<?php

namespace Tests\Feature;

use App\Enums\InventoryMovementType;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\ProductSubmissionStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CooperativeConsignmentReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $cooperativeUser;

    private User $studentUser;

    private Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cooperativeUser = User::factory()->create([
            'role' => UserRole::Cooperative,
            'name' => 'Pengurus Koperasi Unit 1',
        ]);

        $this->studentUser = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Siswa Kreatif',
            'student_identifier' => 'NIS100234',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Snack & Minuman',
            'slug' => 'snack-minuman',
            'is_active' => true,
        ]);
    }

    /**
     * 1. Cooperative can access submission list.
     */
    public function test_1_cooperative_can_access_submission_list(): void
    {
        ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'name' => 'Keripik Pisang Coklat',
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cooperative/consignments/index')
                ->has('submissions.data', 1)
                ->has('stats')
                ->where('stats.total', 1)
            );
    }

    /**
     * 2. Student cannot access cooperative review routes.
     */
    public function test_2_student_cannot_access_cooperative_review_routes(): void
    {
        $response = $this->actingAs($this->studentUser)
            ->get(route('cooperative.consignments.index'));

        $response->assertForbidden();
    }

    /**
     * 3. Search works across product name, student name, and category.
     */
    public function test_3_search_works_across_product_name_student_name_and_category(): void
    {
        $otherStudent = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Ahmad Fauzi',
            'student_identifier' => 'NIS200555',
        ]);

        $pastryCategory = Category::factory()->create([
            'name' => 'Kue Tradisional',
            'slug' => 'kue-tradisional',
        ]);

        $sub1 = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'name' => 'Keripik Singkong Renyah',
        ]);

        $sub2 = ProductSubmission::factory()->create([
            'student_id' => $otherStudent->id,
            'category_id' => $this->category->id,
            'name' => 'Donat Kentang Manis',
        ]);

        $sub3 = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $pastryCategory->id,
            'name' => 'Lumpia Basah',
        ]);

        // Search by product name
        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['search' => 'Singkong']));
        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $sub1->id)
            );

        // Search by student name
        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['search' => 'Ahmad Fauzi']));
        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $sub2->id)
            );

        // Search by category name
        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['search' => 'Tradisional']));
        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $sub3->id)
            );
    }

    /**
     * 4. Status filter works for all, pending, approved, and rejected.
     */
    public function test_4_status_filter_works_for_all_pending_approved_and_rejected(): void
    {
        $pending = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $approved = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Approved,
        ]);

        $rejected = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Rejected,
        ]);

        // All filter
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['status' => 'all']))
            ->assertInertia(fn (Assert $page) => $page->has('submissions.data', 3));

        // Pending / submitted filter
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['status' => 'submitted']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $pending->id)
            );

        // Approved filter
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['status' => 'approved']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $approved->id)
            );

        // Rejected filter
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.index', ['status' => 'rejected']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('submissions.data', 1)
                ->where('submissions.data.0.id', $rejected->id)
            );
    }

    /**
     * 5. Cooperative can view a submission.
     */
    public function test_5_cooperative_can_view_a_submission(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'name' => 'Brownies Lumer',
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.consignments.show', $submission));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cooperative/consignments/show')
                ->where('submission.id', $submission->id)
                ->where('submission.name', 'Brownies Lumer')
            );
    }

    /**
     * 6. Student cannot view cooperative review data.
     */
    public function test_6_student_cannot_view_cooperative_review_data(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->studentUser)
            ->get(route('cooperative.consignments.show', $submission));

        $response->assertForbidden();
    }

    /**
     * 7. Approval requires valid margin.
     */
    public function test_7_approval_requires_valid_margin(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'base_price' => 5000,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        // Missing margin
        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), []);
        $response->assertSessionHasErrors('cooperative_margin');

        // Negative margin
        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => -500,
            ]);
        $response->assertSessionHasErrors('cooperative_margin');
    }

    /**
     * 8. Approval creates and activates product correctly.
     */
    public function test_8_approval_creates_and_activates_product_correctly(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'name' => 'Makaroni Pedas Daun Jeruk',
            'base_price' => 6000,
            'proposed_stock' => 15,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1000,
            ]);

        $response->assertRedirect(route('cooperative.consignments.index'));

        $submission->refresh();
        $this->assertEquals(ProductSubmissionStatus::Approved, $submission->status);
        $this->assertNotNull($submission->product_id);
        $this->assertEquals($this->cooperativeUser->id, $submission->reviewed_by);

        $product = Product::find($submission->product_id);
        $this->assertNotNull($product);
        $this->assertEquals(ProductStatus::Active, $product->status);
        $this->assertNotNull($product->published_at);
        $this->assertEquals('Makaroni Pedas Daun Jeruk', $product->name);
        $this->assertEquals(15, $product->stock);
    }

    /**
     * 9. Approved product preserves student ownership.
     */
    public function test_9_approved_product_preserves_student_ownership(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'base_price' => 8000,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1500,
            ]);

        $submission->refresh();
        $product = Product::find($submission->product_id);

        // Core business rule: student remains the owner!
        $this->assertEquals($this->studentUser->id, $product->owner_id);
        $this->assertNotEquals($this->cooperativeUser->id, $product->owner_id);
        $this->assertEquals(ProductSourceType::Student, $product->source_type);
    }

    /**
     * 10. Approval creates correct selling price.
     */
    public function test_10_approval_creates_correct_selling_price(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'base_price' => 8000,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1200,
            ]);

        $submission->refresh();
        $product = Product::find($submission->product_id);

        $this->assertEquals(8000, $product->base_price);
        $this->assertEquals(1200, $product->cooperative_margin);
        $this->assertEquals(9200, $product->selling_price);

        $this->assertEquals(1200, $submission->cooperative_margin);
        $this->assertEquals(9200, $submission->proposed_selling_price);
    }

    /**
     * 11. Approval creates required inventory record.
     */
    public function test_11_approval_creates_required_inventory_record(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'base_price' => 5000,
            'proposed_stock' => 20,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1000,
            ]);

        $submission->refresh();

        $movement = InventoryMovement::where('product_id', $submission->product_id)->first();
        $this->assertNotNull($movement);
        $this->assertEquals(InventoryMovementType::Restock, $movement->type);
        $this->assertEquals(20, $movement->quantity);
        $this->assertEquals('product_submission', $movement->reference_type);
        $this->assertEquals($submission->id, $movement->reference_id);
        $this->assertEquals($this->cooperativeUser->id, $movement->created_by);
    }

    /**
     * 12. Rejection requires a reason.
     */
    public function test_12_rejection_requires_a_reason(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        // Empty reason
        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.reject', $submission), [
                'rejection_reason' => '',
            ]);
        $response->assertSessionHasErrors('rejection_reason');

        // Too short reason (< 5 characters)
        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.reject', $submission), [
                'rejection_reason' => 'abc',
            ]);
        $response->assertSessionHasErrors('rejection_reason');
    }

    /**
     * 13. Rejection stores the reason.
     */
    public function test_13_rejection_stores_the_reason(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        $reason = 'Kemasan belum higienis dan belum mencantumkan tanggal kedaluwarsa.';

        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.reject', $submission), [
                'rejection_reason' => $reason,
            ]);

        $response->assertRedirect(route('cooperative.consignments.index'));

        $submission->refresh();
        $this->assertEquals(ProductSubmissionStatus::Rejected, $submission->status);
        $this->assertEquals($reason, $submission->rejection_reason);
        $this->assertEquals($this->cooperativeUser->id, $submission->reviewed_by);
        $this->assertNotNull($submission->reviewed_at);
    }

    /**
     * 14. Finalized submissions cannot be re-approved.
     */
    public function test_14_finalized_submissions_cannot_be_reapproved(): void
    {
        $approvedSubmission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Approved,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $approvedSubmission), [
                'cooperative_margin' => 1000,
            ]);

        // Handled by policy with 403 Forbidden
        $response->assertForbidden();
    }

    /**
     * 15. Finalized submissions cannot be re-rejected.
     */
    public function test_15_finalized_submissions_cannot_be_rerejected(): void
    {
        $rejectedSubmission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Rejected,
            'rejection_reason' => 'Alasan lama',
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.reject', $rejectedSubmission), [
                'rejection_reason' => 'Alasan baru yang mencoba menimpa penolakan lama',
            ]);

        // Handled by policy with 403 Forbidden
        $response->assertForbidden();
    }

    /**
     * 16. Unauthorized user cannot forge reviewer identity.
     */
    public function test_16_unauthorized_user_cannot_forge_reviewer_identity(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        // Attempt to spoof reviewed_by as another ID 9999
        $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1000,
                'reviewed_by' => 9999,
            ]);

        $submission->refresh();
        // Server authority sets reviewed_by to auth user
        $this->assertEquals($this->cooperativeUser->id, $submission->reviewed_by);
        $this->assertNotEquals(9999, $submission->reviewed_by);
    }

    /**
     * 17. Forged margin/selling_price payload is ignored.
     */
    public function test_17_forged_margin_and_selling_price_payload_is_ignored(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'base_price' => 7000,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        // Malicious client tries to force selling_price = 100 and owner_id = 8888
        $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1000,
                'selling_price' => 100,
                'owner_id' => 8888,
            ]);

        $submission->refresh();
        $product = Product::find($submission->product_id);

        // Server authoritative calculation: 7000 + 1000 = 8000
        $this->assertEquals(8000, $product->selling_price);
        $this->assertEquals($this->studentUser->id, $product->owner_id);
    }

    /**
     * 18. Concurrent/stale review cannot corrupt state.
     */
    public function test_18_concurrent_stale_review_cannot_corrupt_state(): void
    {
        $submission = ProductSubmission::factory()->create([
            'student_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
            'base_price' => 5000,
            'status' => ProductSubmissionStatus::Submitted,
        ]);

        // Simulate concurrent execution: while operator B is approving, operator A finalized it to Approved
        // Update database directly before transaction locks
        ProductSubmission::where('id', $submission->id)->update([
            'status' => ProductSubmissionStatus::Approved,
        ]);

        // Attempting to approve via Controller (which checks row lock state) aborts with 422 if finalized
        $response = $this->actingAs($this->cooperativeUser)
            ->post(route('cooperative.consignments.approve', $submission), [
                'cooperative_margin' => 1000,
            ]);

        // Either 403 (policy re-evaluation) or 422 (controller lock validation) protects integrity
        $this->assertTrue(in_array($response->status(), [403, 422], true));
    }
}
