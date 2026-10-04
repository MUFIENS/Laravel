<?php

namespace Tests\Feature;

use App\Actions\CreateOrder;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PickupSessionStatus;
use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Order;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CheckoutOrderTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;

    protected User $otherStudent;

    protected Category $category;

    protected Product $activeProduct;

    protected PickupSession $pickupSession;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->student()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@sekolah.sch.id',
        ]);

        $this->otherStudent = User::factory()->student()->create([
            'name' => 'Siti Rahma',
            'email' => 'siti@sekolah.sch.id',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Makanan Ringan',
            'slug' => 'makanan-ringan',
            'is_active' => true,
        ]);

        $this->activeProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Roti Bakar Cokelat Keju',
            'slug' => 'roti-bakar-cokelat-keju',
            'base_price' => 4000,
            'cooperative_margin' => 1000,
            'selling_price' => 5000,
            'stock' => 15,
            'status' => ProductStatus::Active,
        ]);

        $this->pickupSession = PickupSession::factory()->create([
            'name' => 'Istirahat 1 (Pagi)',
            'pickup_date' => now()->toDateString(),
            'starts_at' => '09:30:00',
            'ends_at' => '10:00:00',
            'queue_prefix' => 'A',
            'status' => PickupSessionStatus::Active,
        ]);
    }

    /**
     * Helper to populate student's active cart.
     */
    protected function populateCart(User $user, Product $product, int $quantity = 2): Cart
    {
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);
        $cart->items()->create([
            'product_id' => $product->id,
            'quantity' => $quantity,
        ]);

        return $cart;
    }

    /**
     * 1. Guest cannot checkout.
     */
    public function test_1_guest_cannot_checkout(): void
    {
        $responseGet = $this->get('/checkout');
        $responseGet->assertRedirect('/login');

        $responsePost = $this->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $responsePost->assertRedirect('/login');
    }

    /**
     * 2. Student can open checkout with valid cart.
     */
    public function test_2_student_can_open_checkout_with_valid_cart(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 2);

        $response = $this->actingAs($this->student)->get('/checkout');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('checkout/index')
            ->has('cart.items', 1)
            ->where('cart.total_quantity', 2)
            ->where('cart.subtotal', 10000)
            ->has('pickupSessions')
        );
    }

    /**
     * 3. Empty cart cannot checkout.
     */
    public function test_3_empty_cart_cannot_checkout(): void
    {
        // GET with empty cart
        $responseGet = $this->actingAs($this->student)->get('/checkout');
        $responseGet->assertRedirect('/cart');
        $responseGet->assertSessionHas('error');

        // POST with empty cart
        $responsePost = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $responsePost->assertSessionHasErrors('cart');
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * 4. Inactive product blocks checkout.
     */
    public function test_4_inactive_product_blocks_checkout(): void
    {
        $inactiveProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Minuman Soda Dingin',
            'selling_price' => 4000,
            'stock' => 10,
            'status' => ProductStatus::Inactive,
        ]);

        $this->populateCart($this->student, $inactiveProduct, 1);

        // GET review redirects back to cart
        $responseGet = $this->actingAs($this->student)->get('/checkout');
        $responseGet->assertRedirect('/cart');
        $responseGet->assertSessionHas('error');

        // POST checkout throws validation error
        $responsePost = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $responsePost->assertSessionHasErrors('cart');
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * 5. Archived product blocks checkout.
     */
    public function test_5_archived_product_blocks_checkout(): void
    {
        $archivedProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Snack Jadul',
            'selling_price' => 2000,
            'stock' => 10,
            'status' => ProductStatus::Archived,
        ]);

        $this->populateCart($this->student, $archivedProduct, 1);

        $responsePost = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $responsePost->assertSessionHasErrors('cart');
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * 6. Insufficient stock blocks checkout.
     */
    public function test_6_insufficient_stock_blocks_checkout(): void
    {
        // Product has stock of 15, cart requests 20
        $this->populateCart($this->student, $this->activeProduct, 20);

        $responsePost = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $responsePost->assertSessionHasErrors('cart');
        $this->assertDatabaseCount('orders', 0);

        // Product with 0 stock
        $outOfStockProduct = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Pastel Ayam',
            'selling_price' => 3000,
            'stock' => 0,
            'status' => ProductStatus::Active,
        ]);
        $cart = Cart::where('user_id', $this->student->id)->first();
        $cart->items()->delete();
        $this->populateCart($this->student, $outOfStockProduct, 1);

        $responsePost2 = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $responsePost2->assertSessionHasErrors('cart');
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * 7. Invalid pickup session blocks checkout.
     */
    public function test_7_invalid_pickup_session_blocks_checkout(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);

        // Non-existent session
        $response1 = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => 99999,
        ]);
        $response1->assertSessionHasErrors('pickup_session_id');

        // Closed session
        $closedSession = PickupSession::factory()->create([
            'status' => PickupSessionStatus::Closed,
        ]);
        $response2 = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $closedSession->id,
        ]);
        $response2->assertSessionHasErrors('pickup_session_id');

        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * 8. Server recalculates totals authoritative from database.
     */
    public function test_8_server_recalculates_totals(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 3);

        $response = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(15000, $order->subtotal); // 3 * 5000
        $this->assertSame(15000, $order->total);
        $this->assertSame(3000, $order->cooperative_margin_total); // 3 * 1000
        $response->assertRedirect("/orders/{$order->id}");
    }

    /**
     * 9. Client-submitted total is ignored.
     */
    public function test_9_client_submitted_total_is_ignored(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 2);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
            'total' => 100, // Malicious tamper attempt
            'subtotal' => 100,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(10000, $order->total); // Authoritative calculation: 2 * 5000
        $this->assertSame(10000, $order->subtotal);
    }

    /**
     * 10. Client-submitted price is ignored.
     */
    public function test_10_client_submitted_price_is_ignored(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
            'unit_price' => 500, // Malicious client override
            'selling_price' => 500,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $item = $order->items->first();
        $this->assertSame(5000, $item->unit_price);
        $this->assertSame(5000, $item->subtotal);
    }

    /**
     * 11. Order is created with pending_payment state.
     */
    public function test_11_order_is_created_with_pending_payment_state(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(OrderStatus::PendingPayment, $order->order_status);
        $this->assertFalse($order->isPaid());
        $this->assertFalse($order->isReadyForPickup());
        $this->assertFalse($order->isCompleted());
    }

    /**
     * 12. Payment status is pending.
     */
    public function test_12_payment_status_is_pending(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertSame(PaymentStatus::Pending, $order->payment_status);
    }

    /**
     * 13. Pickup session is stored.
     */
    public function test_13_pickup_session_is_stored(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertSame($this->pickupSession->id, $order->pickup_session_id);
    }

    /**
     * 14. Order number is unique.
     */
    public function test_14_order_number_is_unique(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);
        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $order1 = Order::where('user_id', $this->student->id)->first();

        // Create second order with other student
        $this->populateCart($this->otherStudent, $this->activeProduct, 1);
        $response2 = $this->actingAs($this->otherStudent)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $order2 = Order::where('user_id', $this->otherStudent->id)->first();

        $this->assertNotNull($order1);
        $this->assertNotNull($order2);
        $this->assertNotSame($order1->id, $order2->id);
        $this->assertNotSame($order1->order_number, $order2->order_number);
        $this->assertStringStartsWith('KD-', $order1->order_number);
        $this->assertStringStartsWith('KD-', $order2->order_number);
    }

    /**
     * 15. Order_items contain immutable snapshots.
     */
    public function test_15_order_items_contain_immutable_snapshots(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 2);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $order = Order::latest()->first();
        $this->assertNotNull($order);
        $this->assertCount(1, $order->items);

        $orderItem = $order->items->first();
        $this->assertSame($this->activeProduct->id, $orderItem->product_id);
        $this->assertSame($this->activeProduct->owner_id, $orderItem->seller_id);
        $this->assertSame($this->activeProduct->name, $orderItem->product_name);
        $this->assertSame(5000, $orderItem->unit_price);
        $this->assertSame(4000, $orderItem->base_price);
        $this->assertSame(1000, $orderItem->cooperative_margin);
        $this->assertSame(2, $orderItem->quantity);
        $this->assertSame(10000, $orderItem->subtotal);
    }

    /**
     * 16. Historical order item values remain unchanged after product edits.
     */
    public function test_16_historical_order_item_values_remain_unchanged_after_product_edits(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 2);

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $order = Order::latest()->first();
        $orderItem = $order->items->first();

        // Mutate original product heavily
        $this->activeProduct->update([
            'name' => 'Roti Bakar Super Mewah (Harga Naik)',
            'base_price' => 10000,
            'cooperative_margin' => 5000,
            'selling_price' => 15000,
            'stock' => 1,
            'status' => ProductStatus::Inactive,
        ]);

        // Fresh load the order item
        $orderItem->refresh();

        $this->assertSame('Roti Bakar Cokelat Keju', $orderItem->product_name);
        $this->assertSame(5000, $orderItem->unit_price);
        $this->assertSame(4000, $orderItem->base_price);
        $this->assertSame(1000, $orderItem->cooperative_margin);
        $this->assertSame(10000, $orderItem->subtotal);
        $this->assertSame(2, $orderItem->quantity);
    }

    /**
     * 17. Cart is cleared only after successful order creation.
     */
    public function test_17_cart_is_cleared_only_after_successful_order_creation(): void
    {
        $cart = $this->populateCart($this->student, $this->activeProduct, 1);
        $this->assertSame(1, $cart->items()->count());

        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        $this->assertSame(0, $cart->items()->count());
    }

    /**
     * 18. Cart remains intact when order transaction fails.
     */
    public function test_18_cart_remains_intact_when_order_transaction_fails(): void
    {
        $cart = $this->populateCart($this->student, $this->activeProduct, 2);

        // Mock CreateOrder to throw an unexpected exception inside transaction
        $mock = $this->mock(CreateOrder::class);
        $mock->shouldReceive('execute')
            ->once()
            ->andThrow(new \RuntimeException('Simulated database write failure'));

        try {
            $this->actingAs($this->student)->post('/checkout', [
                'pickup_session_id' => $this->pickupSession->id,
            ]);
        } catch (\RuntimeException $e) {
            // Expected
        }

        // Cart items must remain completely intact
        $this->assertSame(1, $cart->items()->count());
        $this->assertSame(2, $cart->items()->first()->quantity);
        $this->assertDatabaseCount('orders', 0);
    }

    /**
     * 19. Student cannot view another student's order (IDOR Protection).
     */
    public function test_19_student_cannot_view_another_students_order(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);
        $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $order = Order::latest()->first();

        // Other student attempts to access student's order
        $response = $this->actingAs($this->otherStudent)->get("/orders/{$order->id}");
        $response->assertForbidden();

        // Owner student can access
        $ownerResponse = $this->actingAs($this->student)->get("/orders/{$order->id}");
        $ownerResponse->assertOk();
    }

    /**
     * 20. Duplicate checkout attempts do not create unintended duplicate orders.
     */
    public function test_20_duplicate_checkout_attempts_do_not_create_unintended_duplicate_orders(): void
    {
        $this->populateCart($this->student, $this->activeProduct, 1);

        // First successful checkout
        $response1 = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);
        $order1 = Order::latest()->first();
        $response1->assertRedirect("/orders/{$order1->id}");
        $this->assertDatabaseCount('orders', 1);

        // Immediate second checkout attempt (e.g. double click/retry with empty cart)
        $response2 = $this->actingAs($this->student)->post('/checkout', [
            'pickup_session_id' => $this->pickupSession->id,
        ]);

        // Gracefully redirects to the existing recent order without duplicating
        $response2->assertRedirect("/orders/{$order1->id}");
        $this->assertDatabaseCount('orders', 1);
    }
}
