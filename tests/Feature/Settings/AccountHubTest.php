<?php

namespace Tests\Feature\Settings;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductSubmissionStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountHubTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_account_hub(): void
    {
        $response = $this->get(route('profile.edit'));
        $response->assertRedirect(route('login'));

        $accountResponse = $this->get(route('account.index'));
        $accountResponse->assertRedirect(route('login'));
    }

    public function test_student_can_access_account_hub_with_own_orders_and_submissions(): void
    {
        $student = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Ahmad Fauzi',
            'student_identifier' => 'NISN12345678',
        ]);

        $category = Category::factory()->create(['name' => 'Kriya & Kreatif']);
        $product = Product::factory()->create([
            'category_id' => $category->id,
            'selling_price' => 25000,
        ]);

        // Student's order
        $order = Order::factory()->create([
            'user_id' => $student->id,
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Pending,
            'total' => 25000,
        ]);
        OrderItem::factory()->create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Buku Catatan Batik',
            'quantity' => 1,
            'unit_price' => 25000,
            'subtotal' => 25000,
        ]);

        // Student's submission
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $category->id,
            'name' => 'Stiker KOPDIG Handmade',
            'base_price' => 5000,
            'proposed_stock' => 20,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $response = $this->actingAs($student)->get(route('profile.edit'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/profile')
                ->where('userProfile.name', 'Ahmad Fauzi')
                ->where('userProfile.student_identifier', 'NISN12345678')
                ->where('userProfile.role', 'student')
                ->where('totalOrdersCount', 1)
                ->where('totalSubmissionsCount', 1)
                ->has('recentOrders', 1, fn (Assert $item) => $item
                    ->where('id', $order->id)
                    ->where('order_number', $order->order_number)
                    ->where('total', 25000)
                    ->where('first_item_name', 'Buku Catatan Batik')
                    ->etc()
                )
                ->has('recentSubmissions', 1, fn (Assert $item) => $item
                    ->where('id', $submission->id)
                    ->where('name', 'Stiker KOPDIG Handmade')
                    ->where('status', 'submitted')
                    ->where('base_price', 5000)
                    ->etc()
                )
            );
    }

    public function test_student_sees_only_own_orders_and_submissions_and_not_another_students(): void
    {
        $studentA = User::factory()->create(['role' => UserRole::Student, 'name' => 'Siswa A']);
        $studentB = User::factory()->create(['role' => UserRole::Student, 'name' => 'Siswa B']);

        $category = Category::factory()->create();

        // Orders
        $orderA = Order::factory()->create(['user_id' => $studentA->id, 'order_number' => 'KD-ORDER-A']);
        $orderB = Order::factory()->create(['user_id' => $studentB->id, 'order_number' => 'KD-ORDER-B']);

        // Submissions
        $subA = ProductSubmission::factory()->create([
            'student_id' => $studentA->id,
            'category_id' => $category->id,
            'name' => 'Karya Siswa A',
        ]);
        $subB = ProductSubmission::factory()->create([
            'student_id' => $studentB->id,
            'category_id' => $category->id,
            'name' => 'Karya Siswa B',
        ]);

        $response = $this->actingAs($studentA)->get(route('account.index'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/profile')
                ->where('totalOrdersCount', 1)
                ->where('recentOrders.0.order_number', 'KD-ORDER-A')
                ->where('totalSubmissionsCount', 1)
                ->where('recentSubmissions.0.name', 'Karya Siswa A')
            );
    }

    public function test_internal_reviewer_information_is_not_exposed_in_submissions(): void
    {
        $cooperative = User::factory()->create(['role' => UserRole::Cooperative, 'name' => 'Operator Koperasi']);
        $student = User::factory()->create(['role' => UserRole::Student]);
        $category = Category::factory()->create();

        ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $category->id,
            'name' => 'Karya Ditolak',
            'status' => ProductSubmissionStatus::Rejected,
            'rejection_reason' => 'Perbaiki kemasan produk',
            'reviewed_by' => $cooperative->id,
            'reviewed_at' => now(),
        ]);

        $response = $this->actingAs($student)->get(route('profile.edit'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('settings/profile')
                ->has('recentSubmissions.0', fn (Assert $item) => $item
                    ->where('name', 'Karya Ditolak')
                    ->where('status', 'rejected')
                    ->where('rejection_reason', 'Perbaiki kemasan produk')
                    ->missing('reviewed_by')
                    ->missing('reviewer')
                    ->etc()
                )
            );
    }

    public function test_student_cannot_forge_role_from_frontend_profile_update(): void
    {
        $student = User::factory()->create(['role' => UserRole::Student]);

        $response = $this->actingAs($student)->patch(route('profile.update'), [
            'name' => 'Updated Name',
            'email' => 'updated@example.com',
            'role' => 'cooperative',
        ]);

        $response->assertRedirect(route('profile.edit'));

        $student->refresh();
        $this->assertSame('Updated Name', $student->name);
        $this->assertSame('updated@example.com', $student->email);
        $this->assertSame(UserRole::Student, $student->role);
    }

    public function test_student_can_update_password_from_account_hub_flow(): void
    {
        $student = User::factory()->create([
            'password' => Hash::make('old-password-123'),
        ]);

        $response = $this->actingAs($student)->put(route('user-password.update'), [
            'current_password' => 'old-password-123',
            'password' => 'new-secure-password-456',
            'password_confirmation' => 'new-secure-password-456',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('new-secure-password-456', $student->refresh()->password));
    }
}
