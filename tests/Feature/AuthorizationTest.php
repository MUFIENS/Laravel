<?php

namespace Tests\Feature;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\ProductSubmissionStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::factory()->create([
            'name' => 'Makanan Ringan',
            'slug' => 'makanan-ringan',
            'is_active' => true,
        ]);
    }

    /**
     * Test 1: Guest cannot access student routes.
     */
    public function test_guest_cannot_access_student_routes(): void
    {
        $response = $this->get(route('student.consignments.index'));

        $response->assertRedirect(route('login'));
    }

    /**
     * Test 2: Guest cannot access cooperative routes.
     */
    public function test_guest_cannot_access_cooperative_routes(): void
    {
        $response = $this->get(route('cooperative.consignments.index'));

        $response->assertRedirect(route('login'));
    }

    /**
     * Test 3: Student can access student routes.
     */
    public function test_student_can_access_student_routes(): void
    {
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student)->get(route('student.consignments.index'));

        $response->assertOk();
    }

    /**
     * Test 4: Cooperative can access cooperative routes.
     */
    public function test_cooperative_can_access_cooperative_routes(): void
    {
        $cooperative = User::factory()->cooperative()->create();

        $response = $this->actingAs($cooperative)->get(route('cooperative.consignments.index'));

        $response->assertOk();
    }

    /**
     * Test 5: Student cannot access cooperative routes.
     */
    public function test_student_cannot_access_cooperative_routes(): void
    {
        $student = User::factory()->student()->create();

        $response = $this->actingAs($student)->get(route('cooperative.consignments.index'));

        $response->assertForbidden();
    }

    /**
     * Test 6: Cooperative cannot access student-only routes where restricted.
     */
    public function test_cooperative_cannot_access_student_only_routes(): void
    {
        $cooperative = User::factory()->cooperative()->create();

        $response = $this->actingAs($cooperative)->get(route('student.consignments.index'));

        $response->assertForbidden();
    }

    /**
     * Test 7: Student can create a consignment submission.
     */
    public function test_student_can_create_a_consignment_submission(): void
    {
        Storage::fake('public');
        $student = User::factory()->student()->create();

        $payload = [
            'category_id' => $this->category->id,
            'name' => 'Risoles Mayo Keju',
            'description' => 'Risoles isi smoked beef, mayo, dan keju lumer renyah gurih.',
            'base_price' => 3500,
            'proposed_stock' => 15,
            'image' => UploadedFile::fake()->createWithContent(
                'risoles.jpg',
                base64_decode('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=')
            ),
        ];

        $response = $this->actingAs($student)->post(route('student.consignments.store'), $payload);

        $this->assertDatabaseHas('product_submissions', [
            'student_id' => $student->id,
            'name' => 'Risoles Mayo Keju',
            'base_price' => 3500,
            'proposed_stock' => 15,
            'status' => ProductSubmissionStatus::Submitted->value,
            'reviewed_by' => null,
        ]);

        $submission = ProductSubmission::where('name', 'Risoles Mayo Keju')->firstOrFail();
        Storage::disk('public')->assertExists($submission->image_path);
        $response->assertRedirect(route('student.consignments.show', $submission));
    }

    /**
     * Test 8: Student can only read own submission.
     */
    public function test_student_can_only_read_own_submission(): void
    {
        $student = User::factory()->student()->create();
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($student)->get(route('student.consignments.show', $submission));

        $response->assertOk();
    }

    /**
     * Test 9: Student cannot read another student's submission.
     */
    public function test_student_cannot_read_another_students_submission(): void
    {
        $studentA = User::factory()->student()->create();
        $studentB = User::factory()->student()->create();

        $submissionB = ProductSubmission::factory()->create([
            'student_id' => $studentB->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($studentA)->get(route('student.consignments.show', $submissionB));

        $response->assertForbidden();
    }

    /**
     * Test 10: Student cannot approve a submission.
     */
    public function test_student_cannot_approve_a_submission(): void
    {
        $student = User::factory()->student()->create();
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $response = $this->actingAs($student)->post(
            route('cooperative.consignments.approve', $submission),
            ['cooperative_margin' => 1000]
        );

        $response->assertForbidden();
        $this->assertEquals(ProductSubmissionStatus::Submitted, $submission->fresh()->status);
    }

    /**
     * Test 11: Student cannot change approval status or cooperative margins.
     */
    public function test_student_cannot_change_approval_status_or_margins(): void
    {
        $student = User::factory()->student()->create();
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
            'base_price' => 3000,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $response = $this->actingAs($student)->put(route('student.consignments.update', $submission), [
            'name' => 'Risoles Update',
            'category_id' => $this->category->id,
            'description' => 'Deskripsi update yang valid.',
            'base_price' => 3200,
            'proposed_stock' => 20,
            'status' => ProductSubmissionStatus::Approved->value,
            'cooperative_margin' => 500,
        ]);

        $response->assertRedirect(route('student.consignments.show', $submission));

        $fresh = $submission->fresh();
        $this->assertEquals('Risoles Update', $fresh->name);
        $this->assertEquals(3200, $fresh->base_price);
        // Status must remain 'submitted' and margin must remain null
        $this->assertEquals(ProductSubmissionStatus::Submitted, $fresh->status);
        $this->assertNull($fresh->cooperative_margin);
    }

    /**
     * Test 12: Cooperative can review any student submission.
     */
    public function test_cooperative_can_review_any_student_submission(): void
    {
        $cooperative = User::factory()->cooperative()->create();
        $student = User::factory()->student()->create();
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($cooperative)->get(route('cooperative.consignments.show', $submission));

        $response->assertOk();
    }

    /**
     * Test 13: Cooperative can approve a submission, publishing a product and restock movement.
     */
    public function test_cooperative_can_approve_a_submission(): void
    {
        $cooperative = User::factory()->cooperative()->create();
        $student = User::factory()->student()->create();
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
            'name' => 'Brownies Kukus Siswa',
            'base_price' => 5000,
            'proposed_stock' => 10,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $response = $this->actingAs($cooperative)->post(
            route('cooperative.consignments.approve', $submission),
            ['cooperative_margin' => 1500]
        );

        $response->assertRedirect(route('cooperative.consignments.index'));

        $freshSubmission = $submission->fresh();
        $this->assertEquals(ProductSubmissionStatus::Approved, $freshSubmission->status);
        $this->assertEquals(1500, $freshSubmission->cooperative_margin);
        $this->assertEquals(6500, $freshSubmission->proposed_selling_price);
        $this->assertEquals($cooperative->id, $freshSubmission->reviewed_by);
        $this->assertNotNull($freshSubmission->reviewed_at);
        $this->assertNotNull($freshSubmission->product_id);

        // Verify product was published and owned by the student
        $product = Product::find($freshSubmission->product_id);
        $this->assertNotNull($product);
        $this->assertEquals($student->id, $product->owner_id);
        $this->assertEquals(ProductSourceType::Student, $product->source_type);
        $this->assertEquals(5000, $product->base_price);
        $this->assertEquals(1500, $product->cooperative_margin);
        $this->assertEquals(6500, $product->selling_price);
        $this->assertEquals(10, $product->stock);
        $this->assertEquals(ProductStatus::Active, $product->status);

        // Verify inventory restock movement
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Restock->value,
            'quantity' => 10,
            'created_by' => $cooperative->id,
        ]);
    }

    /**
     * Test 14: Cooperative can reject a submission with a required feedback explanation.
     */
    public function test_cooperative_can_reject_a_submission(): void
    {
        $cooperative = User::factory()->cooperative()->create();
        $student = User::factory()->student()->create();
        $submission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $response = $this->actingAs($cooperative)->post(
            route('cooperative.consignments.reject', $submission),
            ['rejection_reason' => 'Kemasan belum higienis, mohon gunakan wadah tertutup rapat.']
        );

        $response->assertRedirect(route('cooperative.consignments.index'));

        $fresh = $submission->fresh();
        $this->assertEquals(ProductSubmissionStatus::Rejected, $fresh->status);
        $this->assertEquals('Kemasan belum higienis, mohon gunakan wadah tertutup rapat.', $fresh->rejection_reason);
        $this->assertEquals($cooperative->id, $fresh->reviewed_by);
        $this->assertNotNull($fresh->reviewed_at);
    }

    /**
     * Test 15: Student cannot modify an approval-locked submission (Approved or UnderReview).
     */
    public function test_student_cannot_modify_an_approval_locked_submission(): void
    {
        $student = User::factory()->student()->create();

        // Test with Approved status
        $approvedSubmission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Approved,
        ]);

        $responseUpdate = $this->actingAs($student)->put(
            route('student.consignments.update', $approvedSubmission),
            [
                'name' => 'Attempted Edit',
                'category_id' => $this->category->id,
                'description' => 'Deskripsi edit.',
                'base_price' => 4000,
                'proposed_stock' => 5,
            ]
        );

        $responseUpdate->assertForbidden();

        $responseDelete = $this->actingAs($student)->delete(
            route('student.consignments.destroy', $approvedSubmission)
        );

        $responseDelete->assertForbidden();

        // Test with Rejected status (locked against direct student mutation)
        $rejectedSubmission = ProductSubmission::factory()->create([
            'student_id' => $student->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Rejected,
        ]);

        $this->actingAs($student)
            ->put(route('student.consignments.update', $rejectedSubmission), [
                'name' => 'Attempted Edit Rejected',
                'category_id' => $this->category->id,
                'description' => 'Deskripsi.',
                'base_price' => 4000,
                'proposed_stock' => 5,
            ])
            ->assertForbidden();
    }

    /**
     * Test 16: Public registration cannot create a cooperative account.
     */
    public function test_public_registration_cannot_create_a_cooperative_account(): void
    {
        $response = $this->post(route('register.store'), [
            'name' => 'Attacker Account',
            'email' => 'attacker@sekolah.sch.id',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'cooperative', // Attempted role escalation
        ]);

        $this->assertAuthenticated();

        $user = User::where('email', 'attacker@sekolah.sch.id')->firstOrFail();
        $this->assertEquals(UserRole::Student, $user->role);
        $this->assertTrue($user->isStudent());
        $this->assertFalse($user->isCooperative());
    }

    /**
     * Test 17: Logout invalidates the authenticated session.
     */
    public function test_logout_invalidates_the_authenticated_session(): void
    {
        $student = User::factory()->student()->create();

        $this->actingAs($student);
        $this->assertAuthenticatedAs($student);

        $response = $this->post(route('logout'));

        $this->assertGuest();
        $response->assertRedirect(route('home'));

        // Subsequent access to authenticated routes is blocked
        $followUp = $this->get(route('student.consignments.index'));
        $followUp->assertRedirect(route('login'));
    }
}
