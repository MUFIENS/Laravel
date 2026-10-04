<?php

namespace Tests\Feature;

use App\Actions\PreparePaidOrderForPickup;
use App\Enums\InventoryMovementType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PickupSessionStatus;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupCredentialService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CooperativeInventoryWorkspaceTest extends TestCase
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
            'name' => 'Pengurus Koperasi Unit Logistik',
        ]);

        $this->studentUser = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Ahmad Santoso',
            'student_identifier' => 'NIS102030',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Alat Tulis Sekolah',
            'slug' => 'alat-tulis-sekolah',
            'is_active' => true,
        ]);
    }

    /**
     * 1. Cooperative user can access inventory workspace listing.
     */
    public function test_1_cooperative_can_access_inventory_workspace(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Gambar A4 KOPDIG',
            'source_type' => ProductSourceType::Cooperative,
            'stock' => 20,
            'status' => ProductStatus::Active,
        ]);

        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative/inventory');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->where('activeNav', 'inventory')
            ->has('products.data', 1)
            ->has('stats')
            ->has('categories')
            ->has('filters')
        );
    }

    /**
     * 2. Student user cannot access cooperative inventory workspace.
     */
    public function test_2_student_cannot_access_inventory_workspace(): void
    {
        $response = $this->actingAs($this->studentUser)->get('/cooperative/inventory');
        $response->assertForbidden();
    }

    /**
     * 3. Guest visitor is redirected to login page.
     */
    public function test_3_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/cooperative/inventory');
        $response->assertRedirect('/login');
    }

    /**
     * 4. Inventory list loads real products with latest movement audit record.
     */
    public function test_4_inventory_list_loads_real_products_with_latest_movement(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Pensil 2B KOPDIG',
            'source_type' => ProductSourceType::Cooperative,
            'stock' => 50,
            'status' => ProductStatus::Active,
        ]);

        InventoryMovement::create([
            'product_id' => $product->id,
            'type' => InventoryMovementType::Restock,
            'quantity' => 50,
            'reason' => 'Pengadaan stok awal tahun ajaran baru',
            'created_by' => $this->cooperativeUser->id,
        ]);

        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative/inventory');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->where('products.data.0.name', 'Pensil 2B KOPDIG')
            ->where('products.data.0.stock', 50)
            ->where('products.data.0.latest_movement.type', 'restock')
            ->where('products.data.0.latest_movement.quantity', 50)
            ->where('products.data.0.latest_movement.reason', 'Pengadaan stok awal tahun ajaran baru')
            ->where('products.data.0.latest_movement.creator_name', $this->cooperativeUser->name)
        );
    }

    /**
     * 5. Server-side search filters by product name.
     */
    public function test_5_search_filters_by_product_name(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Penghapus Karet Putih',
            'stock' => 15,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Penggaris Besi 30cm',
            'stock' => 8,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?search=Penghapus');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Penghapus Karet Putih')
        );
    }

    /**
     * 6. Server-side search filters by student owner and identifier.
     */
    public function test_6_search_filters_by_student_owner_and_identifier(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => $this->studentUser->id,
            'name' => 'Kue Nastar Homemade',
            'source_type' => ProductSourceType::Student,
            'stock' => 10,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Kas Koperasi',
            'source_type' => ProductSourceType::Cooperative,
            'stock' => 5,
        ]);

        // Search by student NISN
        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?search=NIS102030');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Kue Nastar Homemade')
            ->where('products.data.0.owner.name', 'Ahmad Santoso')
        );

        // Search by student Name
        $responseName = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?search=Ahmad');

        $responseName->assertOk();
        $responseName->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Kue Nastar Homemade')
        );
    }

    /**
     * 7. Filters work for cooperative products vs student consignment.
     */
    public function test_7_filter_by_source_type(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Stopmap KOPDIG',
            'source_type' => ProductSourceType::Cooperative,
            'stock' => 40,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => $this->studentUser->id,
            'name' => 'Kripik Tempe Siswa',
            'source_type' => ProductSourceType::Student,
            'stock' => 12,
        ]);

        // Filter cooperative only
        $coopResponse = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?source=cooperative');

        $coopResponse->assertOk();
        $coopResponse->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Stopmap KOPDIG')
        );

        // Filter student only
        $studentResponse = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?source=student');

        $studentResponse->assertOk();
        $studentResponse->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Kripik Tempe Siswa')
        );
    }

    /**
     * 8. Filter by category.
     */
    public function test_8_filter_by_category(): void
    {
        $snackCategory = Category::factory()->create([
            'name' => 'Makanan Ringan',
            'slug' => 'makanan-ringan',
            'is_active' => true,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Kotak-Kotak',
            'stock' => 10,
        ]);

        Product::factory()->create([
            'category_id' => $snackCategory->id,
            'name' => 'Roti Cokelat',
            'stock' => 15,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?category='.$snackCategory->id);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Roti Cokelat')
        );
    }

    /**
     * 9. Filter by stock status (out_of_stock, low_stock, in_stock).
     */
    public function test_9_filter_by_stock_status(): void
    {
        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Barang Habis',
            'stock' => 0,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Barang Menipis',
            'stock' => 3,
        ]);

        Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Barang Aman',
            'stock' => 25,
        ]);

        // Out of stock
        $outResponse = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?stock_status=out_of_stock');
        $outResponse->assertOk();
        $outResponse->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Barang Habis')
        );

        // Low stock
        $lowResponse = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?stock_status=low_stock');
        $lowResponse->assertOk();
        $lowResponse->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Barang Menipis')
        );

        // In stock
        $inResponse = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?stock_status=in_stock');
        $inResponse->assertOk();
        $inResponse->assertInertia(fn (Assert $page) => $page
            ->has('products.data', 1)
            ->where('products.data.0.name', 'Barang Aman')
        );
    }

    /**
     * 10. Pagination preserves search and filter query parameters.
     */
    public function test_10_pagination_preserves_query_parameters(): void
    {
        Product::factory()->count(25)->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Latihan Siswa',
            'source_type' => ProductSourceType::Cooperative,
            'stock' => 10,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory?search=Buku&source=cooperative&page=1');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/index')
            ->where('products.current_page', 1)
            ->where('products.last_page', 2)
            ->where('products.total', 25)
            ->has('products.links')
        );
    }

    /**
     * 11. Cooperative can view inventory detail page.
     */
    public function test_11_cooperative_can_view_inventory_detail(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Kalkulator Ilmiah KOPDIG',
            'stock' => 12,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory/'.$product->slug);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/show')
            ->where('activeNav', 'inventory')
            ->where('product.name', 'Kalkulator Ilmiah KOPDIG')
            ->where('product.stock', 12)
            ->has('movements')
        );
    }

    /**
     * 12. Inventory detail preserves student ownership and source metadata.
     */
    public function test_12_inventory_detail_preserves_student_ownership_and_source_type(): void
    {
        $consignmentProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'owner_id' => $this->studentUser->id,
            'name' => 'Gantungan Kunci Rajut',
            'source_type' => ProductSourceType::Student,
            'base_price' => 5000,
            'cooperative_margin' => 1000,
            'selling_price' => 6000,
            'stock' => 8,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/inventory/'.$consignmentProduct->slug);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/inventory/show')
            ->where('product.source_type', 'student')
            ->where('product.owner.id', $this->studentUser->id)
            ->where('product.owner.name', 'Ahmad Santoso')
            ->where('product.owner.student_identifier', 'NIS102030')
            ->where('product.base_price', 5000)
            ->where('product.cooperative_margin', 1000)
            ->where('product.selling_price', 6000)
        );
    }

    /**
     * 13. Valid restock operation increases stock and creates inventory movement record.
     */
    public function test_13_valid_restock_operation_increases_stock_and_creates_movement(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Map Plastik Resleting',
            'stock' => 10,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => 15,
                'reason' => 'Pengadaan tambahan dari distributor ATK',
            ]);

        $response->assertRedirect('/cooperative/inventory/'.$product->slug);
        $response->assertSessionHas('success');

        $product->refresh();
        $this->assertSame(25, $product->stock);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Restock->value,
            'quantity' => 15,
            'reason' => 'Pengadaan tambahan dari distributor ATK',
            'created_by' => $this->cooperativeUser->id,
        ]);
    }

    /**
     * 14. Valid adjustment addition increases stock and creates inventory movement record.
     */
    public function test_14_valid_adjustment_addition_increases_stock_and_creates_movement(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Stapler Kecil No.10',
            'stock' => 7,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'adjustment',
                'adjustment_direction' => 'addition',
                'quantity' => 3,
                'reason' => 'Hasil opname fisik menemukan kelebihan stok di etalase',
            ]);

        $response->assertRedirect('/cooperative/inventory/'.$product->slug);
        $response->assertSessionHas('success');

        $product->refresh();
        $this->assertSame(10, $product->stock);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Adjustment->value,
            'quantity' => 3,
            'reason' => 'Hasil opname fisik menemukan kelebihan stok di etalase',
            'created_by' => $this->cooperativeUser->id,
        ]);
    }

    /**
     * 15. Valid adjustment subtraction decreases stock and creates negative signed inventory movement record.
     */
    public function test_15_valid_adjustment_subtraction_decreases_stock_and_creates_movement(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Isi Ulang Tinta Spidol',
            'stock' => 12,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'adjustment',
                'adjustment_direction' => 'subtraction',
                'quantity' => 4,
                'reason' => 'Barang pecah bocor saat penataan rak toko',
            ]);

        $response->assertRedirect('/cooperative/inventory/'.$product->slug);
        $response->assertSessionHas('success');

        $product->refresh();
        $this->assertSame(8, $product->stock);

        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Adjustment->value,
            'quantity' => -4,
            'reason' => 'Barang pecah bocor saat penataan rak toko',
            'created_by' => $this->cooperativeUser->id,
        ]);
    }

    /**
     * 16. Invalid quantity inputs are rejected.
     */
    public function test_16_invalid_quantity_is_rejected(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock' => 10,
        ]);

        // Zero quantity
        $responseZero = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => 0,
                'reason' => 'Test invalid zero',
            ]);
        $responseZero->assertSessionHasErrors('quantity');

        // Negative quantity in input
        $responseNeg = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => -5,
                'reason' => 'Test invalid negative',
            ]);
        $responseNeg->assertSessionHasErrors('quantity');

        // Over limit quantity
        $responseOver = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => 200000,
                'reason' => 'Test invalid over limit',
            ]);
        $responseOver->assertSessionHasErrors('quantity');
    }

    /**
     * 17. Unauthorized student user cannot mutate inventory.
     */
    public function test_17_unauthorized_student_cannot_mutate_stock(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock' => 10,
        ]);

        $response = $this->actingAs($this->studentUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => 5,
                'reason' => 'Student trying to restock',
            ]);

        $response->assertForbidden();
        $product->refresh();
        $this->assertSame(10, $product->stock);
    }

    /**
     * 18. Stock cannot become negative when subtracting more than available stock.
     */
    public function test_18_stock_cannot_become_negative_on_subtraction(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'stock' => 5,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'adjustment',
                'adjustment_direction' => 'subtraction',
                'quantity' => 6, // 6 > 5!
                'reason' => 'Koreksi berlebih',
            ]);

        $response->assertSessionHasErrors('quantity');
        $product->refresh();
        $this->assertSame(5, $product->stock);

        $this->assertDatabaseMissing('inventory_movements', [
            'product_id' => $product->id,
            'reason' => 'Koreksi berlebih',
        ]);
    }

    /**
     * 19. Stock mutations strictly preserve historical order item snapshots.
     */
    public function test_19_updating_stock_preserves_historical_order_item_snapshots(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Buku Gambar Snapshot Test',
            'base_price' => 10000,
            'cooperative_margin' => 2000,
            'selling_price' => 12000,
            'stock' => 10,
        ]);

        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_status' => OrderStatus::Completed,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 24000,
            'total' => 24000,
        ]);

        $orderItem = OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => $product->owner_id,
            'product_name' => 'Buku Gambar Snapshot Test (Snapshot Asli)',
            'base_price' => 10000,
            'cooperative_margin' => 2000,
            'unit_price' => 12000,
            'quantity' => 2,
            'subtotal' => 24000,
        ]);

        // Cooperative adds stock via Restock
        $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => 50,
                'reason' => 'Restock buku gambar',
            ]);

        $product->refresh();
        $this->assertSame(60, $product->stock);

        // Verify historical OrderItem is untouched
        $orderItem->refresh();
        $this->assertSame('Buku Gambar Snapshot Test (Snapshot Asli)', $orderItem->product_name);
        $this->assertSame(12000, $orderItem->unit_price);
        $this->assertSame(10000, $orderItem->base_price);
        $this->assertSame(2000, $orderItem->cooperative_margin);
        $this->assertSame(24000, $orderItem->subtotal);
        $this->assertSame(2, $orderItem->quantity);
    }

    /**
     * 20. Existing paid order fulfillment coexists safely with inventory operations.
     */
    public function test_20_existing_paid_order_fulfillment_coexists_safely_with_inventory_operations(): void
    {
        $pickupSession = PickupSession::factory()->create([
            'name' => 'Istirahat Pagi',
            'status' => PickupSessionStatus::Active,
            'pickup_date' => now()->toDateString(),
            'starts_at' => '09:30:00',
            'ends_at' => '10:00:00',
            'queue_prefix' => 'A',
        ]);

        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Pulpen Gel Hitam',
            'stock' => 10,
            'status' => ProductStatus::Active,
        ]);

        // 1. Cooperative restocks 10 more units -> stock becomes 20
        $this->actingAs($this->cooperativeUser)
            ->post("/cooperative/inventory/{$product->slug}/adjust", [
                'type' => 'restock',
                'quantity' => 10,
                'reason' => 'Restock sebelum pesanan diproses',
            ]);

        $product->refresh();
        $this->assertSame(20, $product->stock);

        // 2. Student pays for an order of 3 units
        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $pickupSession->id,
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 30000,
            'total' => 30000,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'seller_id' => $product->owner_id,
            'product_name' => $product->name,
            'base_price' => 8000,
            'cooperative_margin' => 2000,
            'unit_price' => 10000,
            'quantity' => 3,
            'subtotal' => 30000,
        ]);

        // 3. Fulfillment action executes
        $credentialService = new PickupCredentialService;
        $fulfillmentAction = new PreparePaidOrderForPickup($credentialService);
        $fulfilledOrder = $fulfillmentAction->execute($order);

        $this->assertSame(OrderStatus::ReadyForPickup, $fulfilledOrder->order_status);

        // Stock correctly decremented from 20 to 17
        $product->refresh();
        $this->assertSame(17, $product->stock);

        // Check InventoryMovement for Sale was created
        $this->assertDatabaseHas('inventory_movements', [
            'product_id' => $product->id,
            'type' => InventoryMovementType::Sale->value,
            'quantity' => -3,
            'reference_type' => Order::class,
            'reference_id' => $order->id,
        ]);

        // 4. Repeated/idempotent fulfillment remains safe
        $secondRun = $fulfillmentAction->execute($fulfilledOrder);
        $this->assertSame(OrderStatus::ReadyForPickup, $secondRun->order_status);
        $product->refresh();
        $this->assertSame(17, $product->stock); // Did not decrement again
    }
}
