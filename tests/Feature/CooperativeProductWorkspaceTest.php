<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CooperativeProductWorkspaceTest extends TestCase
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
            'name' => 'Pengurus Koperasi Unit Produk',
        ]);

        $this->studentUser = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Budi Siswa Niaga',
            'student_identifier' => 'NIS109876',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Alat Tulis & Buku',
            'slug' => 'alat-tulis-buku',
            'is_active' => true,
        ]);
    }

    /**
     * 1. Cooperative can access product workspace listing.
     */
    public function test_1_cooperative_can_access_product_workspace(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Tulis KOPDIG 38 Lembar',
            'source_type' => ProductSourceType::Cooperative,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index'));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cooperative/products/index')
                ->has('products.data', 1)
                ->has('stats')
                ->has('categories')
                ->where('stats.total', 1)
                ->where('stats.active', 1)
            );
    }

    /**
     * 2. Student cannot access cooperative product workspace.
     */
    public function test_2_student_cannot_access_cooperative_product_workspace(): void
    {
        $response = $this->actingAs($this->studentUser)
            ->get(route('cooperative.products.index'));

        $response->assertForbidden();
    }

    /**
     * 3. Guest cannot access cooperative product workspace.
     */
    public function test_3_guest_cannot_access_cooperative_product_workspace(): void
    {
        $response = $this->get(route('cooperative.products.index'));

        $response->assertRedirect(route('login'));
    }

    /**
     * 4. Search works across name, description, category, and student owner.
     */
    public function test_4_search_works_across_name_description_category_and_owner(): void
    {
        $otherStudent = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Fauzi Ramadhan',
            'student_identifier' => 'NIS200999',
        ]);

        $snackCategory = Category::factory()->create([
            'name' => 'Makanan Ringan',
            'slug' => 'makanan-ringan',
        ]);

        $p1 = Product::factory()->create([
            'name' => 'Pulpen Gel Hitam 0.5',
            'description' => 'Tinta tahan air dan cepat kering',
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Cooperative,
        ]);

        $p2 = Product::factory()->create([
            'name' => 'Keripik Tempe Aneka Rasa',
            'description' => 'Camilan renyah produksi rumahan',
            'category_id' => $snackCategory->id,
            'source_type' => ProductSourceType::Student,
            'owner_id' => $otherStudent->id,
        ]);

        // Search by product name
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['search' => 'Pulpen']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $p1->id)
            );

        // Search by description keyword
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['search' => 'rumahan']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $p2->id)
            );

        // Search by category name
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['search' => 'Makanan Ringan']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $p2->id)
            );

        // Search by student owner name
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['search' => 'Fauzi Ramadhan']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $p2->id)
            );
    }

    /**
     * 5. Filter by status works.
     */
    public function test_5_filter_by_status_works(): void
    {
        $activeProd = Product::factory()->create([
            'status' => ProductStatus::Active,
            'category_id' => $this->category->id,
        ]);

        $inactiveProd = Product::factory()->create([
            'status' => ProductStatus::Inactive,
            'category_id' => $this->category->id,
        ]);

        $archivedProd = Product::factory()->create([
            'status' => ProductStatus::Archived,
            'category_id' => $this->category->id,
        ]);

        // Status all
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['status' => 'all']))
            ->assertInertia(fn (Assert $page) => $page->has('products.data', 3));

        // Status active
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['status' => 'active']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $activeProd->id)
            );

        // Status inactive
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['status' => 'inactive']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $inactiveProd->id)
            );

        // Status archived
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['status' => 'archived']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $archivedProd->id)
            );
    }

    /**
     * 6. Filter by source type works (cooperative vs student consignment).
     */
    public function test_6_filter_by_source_type_works(): void
    {
        $coopProd = Product::factory()->create([
            'source_type' => ProductSourceType::Cooperative,
            'category_id' => $this->category->id,
        ]);

        $studentProd = Product::factory()->create([
            'source_type' => ProductSourceType::Student,
            'owner_id' => $this->studentUser->id,
            'category_id' => $this->category->id,
        ]);

        // Source cooperative
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['source' => 'cooperative']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $coopProd->id)
            );

        // Source student
        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['source' => 'student']))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $studentProd->id)
            );
    }

    /**
     * 7. Filter by category works.
     */
    public function test_7_filter_by_category_works(): void
    {
        $categoryA = $this->category;
        $categoryB = Category::factory()->create(['name' => 'Minuman Dingin', 'slug' => 'minuman-dingin']);

        $prodA = Product::factory()->create(['category_id' => $categoryA->id]);
        $prodB = Product::factory()->create(['category_id' => $categoryB->id]);

        $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', ['category' => $categoryB->slug]))
            ->assertInertia(fn (Assert $page) => $page
                ->has('products.data', 1)
                ->where('products.data.0.id', $prodB->id)
            );
    }

    /**
     * 8. Pagination preserves query parameters.
     */
    public function test_8_pagination_preserves_query_parameters(): void
    {
        Product::factory()->count(20)->create([
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Cooperative,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.index', [
                'status' => 'active',
                'source' => 'cooperative',
                'page' => 2,
            ]));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('products.current_page', 2)
                ->has('products.data', 5)
            );
    }

    /**
     * 9. Cooperative can view product detail page.
     */
    public function test_9_cooperative_can_view_product_detail(): void
    {
        $product = Product::factory()->create([
            'name' => 'Pensil 2B KOPDIG',
            'category_id' => $this->category->id,
            'base_price' => 2000,
            'cooperative_margin' => 500,
            'selling_price' => 2500,
            'stock' => 50,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.show', $product));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cooperative/products/show')
                ->where('product.id', $product->id)
                ->where('product.name', 'Pensil 2B KOPDIG')
                ->where('product.selling_price', 2500)
            );
    }

    /**
     * 10. Student product detail preserves student ownership display.
     */
    public function test_10_student_product_detail_preserves_student_ownership_display(): void
    {
        $studentProduct = Product::factory()->create([
            'name' => 'Gantungan Kunci Rajut Siswa',
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Student,
            'owner_id' => $this->studentUser->id,
            'base_price' => 8000,
            'cooperative_margin' => 2000,
            'selling_price' => 10000,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.show', $studentProduct));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('product.source_type', 'student')
                ->where('product.owner_id', $this->studentUser->id)
                ->where('product.owner.name', 'Budi Siswa Niaga')
            );
    }

    /**
     * 11. Cooperative can view edit page.
     */
    public function test_11_cooperative_can_view_edit_page(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get(route('cooperative.products.edit', $product));

        $response->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('cooperative/products/edit')
                ->where('product.id', $product->id)
                ->has('categories')
            );
    }

    /**
     * 12. Cooperative can update cooperative-owned product.
     */
    public function test_12_cooperative_can_update_cooperative_owned_product(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Cooperative,
            'name' => 'Buku Sketsa Lama',
            'base_price' => 10000,
            'cooperative_margin' => 2000,
            'selling_price' => 12000,
            'status' => ProductStatus::Active,
        ]);

        $newCategory = Category::factory()->create(['name' => 'Kesenian', 'slug' => 'kesenian']);

        $response = $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $product), [
                'name' => 'Buku Sketsa A4 Tebal',
                'category_id' => $newCategory->id,
                'description' => 'Kertas 150gsm cocok untuk sketsa pensil dan cat air.',
                'base_price' => 12000,
                'cooperative_margin' => 3000,
                'status' => 'inactive',
                'is_featured' => true,
            ]);

        $response->assertRedirect(route('cooperative.products.show', $product));

        $product->refresh();
        $this->assertEquals('Buku Sketsa A4 Tebal', $product->name);
        $this->assertEquals($newCategory->id, $product->category_id);
        $this->assertEquals(12000, $product->base_price);
        $this->assertEquals(3000, $product->cooperative_margin);
        // Server-side authoritative calculation: 12000 + 3000 = 15000
        $this->assertEquals(15000, $product->selling_price);
        $this->assertEquals(ProductStatus::Inactive, $product->status);
        $this->assertTrue($product->is_featured);
    }

    /**
     * 13. Cooperative can update student consignment product margin and status.
     */
    public function test_13_cooperative_can_update_student_consignment_product(): void
    {
        $studentProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Student,
            'owner_id' => $this->studentUser->id,
            'name' => 'Kue Kering Coklat',
            'base_price' => 7000,
            'cooperative_margin' => 1000,
            'selling_price' => 8000,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $studentProduct), [
                'name' => 'Kue Kering Coklat Renyah',
                'category_id' => $this->category->id,
                'description' => 'Toples 250gr dengan chocochip melimpah.',
                'cooperative_margin' => 1500,
                'status' => 'active',
                'is_featured' => true,
            ]);

        $response->assertRedirect(route('cooperative.products.show', $studentProduct));

        $studentProduct->refresh();
        $this->assertEquals('Kue Kering Coklat Renyah', $studentProduct->name);
        // Base price remains locked at 7000
        $this->assertEquals(7000, $studentProduct->base_price);
        $this->assertEquals(1500, $studentProduct->cooperative_margin);
        // Authoritative selling price: 7000 + 1500 = 8500
        $this->assertEquals(8500, $studentProduct->selling_price);
    }

    /**
     * 14. Updating student product preserves student owner_id and source_type.
     */
    public function test_14_updating_student_product_preserves_student_owner_id_and_source_type(): void
    {
        $studentProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Student,
            'owner_id' => $this->studentUser->id,
            'base_price' => 5000,
            'cooperative_margin' => 1000,
            'selling_price' => 6000,
        ]);

        $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $studentProduct), [
                'name' => 'Stiker Hologram Siswa',
                'category_id' => $this->category->id,
                'description' => 'Stiker vinil tahan gores.',
                'cooperative_margin' => 1000,
                'status' => 'active',
            ]);

        $studentProduct->refresh();
        $this->assertEquals($this->studentUser->id, $studentProduct->owner_id);
        $this->assertEquals(ProductSourceType::Student, $studentProduct->source_type);
    }

    /**
     * 15. Forbidden field tampering is prevented or ignored.
     */
    public function test_15_forbidden_field_tampering_is_prevented_or_ignored(): void
    {
        $studentProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'source_type' => ProductSourceType::Student,
            'owner_id' => $this->studentUser->id,
            'base_price' => 6000,
            'cooperative_margin' => 1000,
            'selling_price' => 7000,
        ]);

        // Attempt to pass forged owner_id, source_type, base_price, or selling_price
        $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $studentProduct), [
                'name' => 'Stiker Hologram',
                'category_id' => $this->category->id,
                'description' => 'Stiker keren',
                'cooperative_margin' => 1500,
                'status' => 'active',
                'owner_id' => 9999,
                'source_type' => 'cooperative',
                'base_price' => 100,
                'selling_price' => 500,
            ]);

        $studentProduct->refresh();
        // Server rules strictly preserve student owner and original base price!
        $this->assertEquals($this->studentUser->id, $studentProduct->owner_id);
        $this->assertEquals(ProductSourceType::Student, $studentProduct->source_type);
        $this->assertEquals(6000, $studentProduct->base_price);
        $this->assertEquals(7500, $studentProduct->selling_price); // 6000 + 1500
    }

    /**
     * 16. Student cannot mutate products via cooperative workspace.
     */
    public function test_16_student_cannot_mutate_products(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
        ]);

        $response = $this->actingAs($this->studentUser)
            ->put(route('cooperative.products.update', $product), [
                'name' => 'Hacked Name',
                'category_id' => $this->category->id,
                'description' => 'Hacked desc',
                'cooperative_margin' => 1000,
                'status' => 'active',
            ]);

        $response->assertForbidden();
    }

    /**
     * 17. Historical order snapshot protection: Updating product does NOT corrupt past OrderItem records.
     */
    public function test_17_historical_order_snapshot_protection(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Catatan Edisi Lama',
            'base_price' => 5000,
            'cooperative_margin' => 1000,
            'selling_price' => 6000,
            'source_type' => ProductSourceType::Cooperative,
        ]);

        $pickupSession = PickupSession::factory()->create();

        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $pickupSession->id,
            'order_status' => OrderStatus::Completed,
            'payment_status' => PaymentStatus::Paid,
            'total' => 12000,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => null,
            'product_name' => 'Buku Catatan Edisi Lama',
            'unit_price' => 6000,
            'base_price' => 5000,
            'cooperative_margin' => 1000,
            'quantity' => 2,
            'subtotal' => 12000,
        ]);

        // Now, cooperative updates the product in the catalog (price change, name change)
        $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $product), [
                'name' => 'Buku Catatan Edisi Revisi 2026',
                'category_id' => $this->category->id,
                'description' => 'Edisi baru dengan jilid spiral.',
                'base_price' => 8000,
                'cooperative_margin' => 2000,
                'status' => 'active',
            ]);

        $product->refresh();
        $this->assertEquals('Buku Catatan Edisi Revisi 2026', $product->name);
        $this->assertEquals(10000, $product->selling_price);

        // Core business guarantee: historical order item remains completely UNCHANGED!
        $orderItem->refresh();
        $this->assertEquals('Buku Catatan Edisi Lama', $orderItem->product_name);
        $this->assertEquals(6000, $orderItem->unit_price);
        $this->assertEquals(5000, $orderItem->base_price);
        $this->assertEquals(1000, $orderItem->cooperative_margin);
        $this->assertEquals(12000, $orderItem->subtotal);
    }

    /**
     * 18. Product status lifecycle behavior (active, inactive, archived).
     */
    public function test_18_product_status_lifecycle_behavior(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'status' => ProductStatus::Active,
        ]);

        $this->assertTrue(Product::active()->where('id', $product->id)->exists());

        // Deactivate product
        $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $product), [
                'name' => $product->name,
                'category_id' => $product->category_id,
                'description' => $product->description,
                'base_price' => $product->base_price,
                'cooperative_margin' => $product->cooperative_margin,
                'status' => 'inactive',
            ]);

        $product->refresh();
        $this->assertEquals(ProductStatus::Inactive, $product->status);
        $this->assertFalse(Product::active()->where('id', $product->id)->exists());

        // Archive product
        $this->actingAs($this->cooperativeUser)
            ->put(route('cooperative.products.update', $product), [
                'name' => $product->name,
                'category_id' => $product->category_id,
                'description' => $product->description,
                'base_price' => $product->base_price,
                'cooperative_margin' => $product->cooperative_margin,
                'status' => 'archived',
            ]);

        $product->refresh();
        $this->assertEquals(ProductStatus::Archived, $product->status);
        $this->assertFalse(Product::active()->where('id', $product->id)->exists());
    }
}
