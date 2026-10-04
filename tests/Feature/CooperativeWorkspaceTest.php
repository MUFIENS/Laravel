<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CooperativeWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private User $student;

    private User $cooperativeUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Siswa Test',
        ]);

        $this->cooperativeUser = User::factory()->create([
            'role' => UserRole::Cooperative,
            'name' => 'Pengurus Koperasi Test',
        ]);
    }

    /**
     * 1. Guest cannot access cooperative workspace.
     */
    public function test_1_guest_cannot_access_cooperative_workspace(): void
    {
        $response = $this->get('/cooperative');

        $response->assertRedirect(route('login'));
    }

    /**
     * 2. Student cannot access cooperative workspace.
     */
    public function test_2_student_cannot_access_cooperative_workspace(): void
    {
        $response = $this->actingAs($this->student)->get('/cooperative');

        $response->assertForbidden();
    }

    /**
     * 3. Cooperative can access cooperative workspace.
     */
    public function test_3_cooperative_can_access_cooperative_workspace(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/index')
            ->where('activeNav', 'overview')
        );
    }

    /**
     * 4. Cooperative navigation renders.
     */
    public function test_4_cooperative_navigation_renders(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/index')
            ->has('activeNav')
        );

        // Test navigation routes are accessible
        $ordersResponse = $this->actingAs($this->cooperativeUser)->get('/cooperative/orders');
        $ordersResponse->assertOk();
        $ordersResponse->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/orders/index')
            ->where('activeNav', 'orders')
        );

        $productsResponse = $this->actingAs($this->cooperativeUser)->get('/cooperative/products');
        $productsResponse->assertOk();
        $productsResponse->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/products/index')
            ->where('activeNav', 'products')
        );

        $inventoryResponse = $this->actingAs($this->cooperativeUser)->get('/cooperative/inventory');
        $inventoryResponse->assertOk();
        $inventoryResponse->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->where('activeNav', 'inventory')
        );

        $reportsResponse = $this->actingAs($this->cooperativeUser)->get('/cooperative/reports');
        $reportsResponse->assertOk();
        $reportsResponse->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/placeholder')
            ->where('activeNav', 'reports')
            ->where('module', 'Laporan & Pembukuan')
        );
    }

    /**
     * 5. Cooperative user context renders.
     */
    public function test_5_cooperative_user_context_renders(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/index')
            ->where('auth.user.id', $this->cooperativeUser->id)
            ->where('auth.user.name', 'Pengurus Koperasi Test')
            ->where('auth.user.role', 'cooperative')
        );
    }

    /**
     * 6. Existing cooperative consignment route remains accessible.
     */
    public function test_6_existing_cooperative_consignment_route_remains_accessible(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->get(route('cooperative.consignments.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/consignments/index')
        );
    }

    /**
     * 7. Existing cooperative pickup route remains accessible.
     */
    public function test_7_existing_cooperative_pickup_route_remains_accessible(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->get(route('cooperative.pickup.index'));

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/pickup/index')
        );
    }

    /**
     * 8. Student remains redirected to student experience.
     */
    public function test_8_student_remains_redirected_to_student_experience(): void
    {
        $response = $this->actingAs($this->student)->get(route('dashboard'));

        $response->assertRedirect(route('explore'));
    }

    /**
     * 9. Cooperative dashboard route directs to cooperative workspace.
     */
    public function test_9_cooperative_dashboard_route_directs_to_cooperative_workspace(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->get(route('dashboard'));

        $response->assertRedirect(route('cooperative.index'));
    }

    /**
     * 10. Logout still works from cooperative shell.
     */
    public function test_10_logout_still_works_from_cooperative_shell(): void
    {
        $response = $this->actingAs($this->cooperativeUser)->post(route('logout'));

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
