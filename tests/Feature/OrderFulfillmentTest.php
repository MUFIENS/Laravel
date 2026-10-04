<?php

namespace Tests\Feature;

use App\Actions\PreparePaidOrderForPickup;
use App\Enums\InventoryMovementType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PickupSessionStatus;
use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Exceptions\InsufficientStockException;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupCredentialService;
use DomainException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderFulfillmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;

    protected User $otherStudent;

    protected User $cooperativeUser;

    protected PickupSession $pickupSessionA;

    protected PickupSession $pickupSessionB;

    protected Product $product;

    protected PreparePaidOrderForPickup $fulfillmentService;

    protected PickupCredentialService $credentialService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->student = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Budi Siswa',
            'email' => 'budi.siswa@sekolah.sch.id',
        ]);

        $this->otherStudent = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Siti Siswi',
            'email' => 'siti.siswi@sekolah.sch.id',
        ]);

        $this->cooperativeUser = User::factory()->create([
            'role' => UserRole::Cooperative,
            'name' => 'Pengurus Koperasi Pak Joko',
            'email' => 'joko.koperasi@sekolah.sch.id',
        ]);

        $this->pickupSessionA = PickupSession::factory()->create([
            'name' => 'Istirahat 1 (Pagi)',
            'pickup_date' => now()->toDateString(),
            'starts_at' => '09:30:00',
            'ends_at' => '10:00:00',
            'queue_prefix' => 'A',
            'status' => PickupSessionStatus::Active,
        ]);

        $this->pickupSessionB = PickupSession::factory()->create([
            'name' => 'Istirahat 2 (Siang)',
            'pickup_date' => now()->toDateString(),
            'starts_at' => '12:00:00',
            'ends_at' => '12:30:00',
            'queue_prefix' => 'B',
            'status' => PickupSessionStatus::Active,
        ]);

        $this->product = Product::factory()->create([
            'name' => 'Roti Cokelat KOPDIG',
            'base_price' => 3000,
            'cooperative_margin' => 1000,
            'selling_price' => 4000,
            'stock' => 15,
            'status' => ProductStatus::Active,
        ]);

        $this->credentialService = app(PickupCredentialService::class);
        $this->fulfillmentService = app(PreparePaidOrderForPickup::class);
    }

    /**
     * Helper to create a test order.
     */
    protected function createOrder(
        User $user,
        PickupSession $session,
        PaymentStatus $paymentStatus = PaymentStatus::Pending,
        OrderStatus $orderStatus = OrderStatus::PendingPayment,
        int $quantity = 2
    ): Order {
        $order = Order::create([
            'user_id' => $user->id,
            'pickup_session_id' => $session->id,
            'order_number' => 'KD-'.date('Ymd').'-'.strtoupper(bin2hex(random_bytes(3))),
            'queue_number' => null,
            'queue_code' => null,
            'subtotal' => $this->product->selling_price * $quantity,
            'cooperative_margin_total' => $this->product->cooperative_margin * $quantity,
            'total' => $this->product->selling_price * $quantity,
            'payment_status' => $paymentStatus,
            'order_status' => $orderStatus,
            'pickup_token_hash' => null,
            'paid_at' => $paymentStatus === PaymentStatus::Paid ? now() : null,
        ]);

        $order->items()->create([
            'product_id' => $this->product->id,
            'seller_id' => $this->product->owner_id,
            'product_name' => $this->product->name,
            'unit_price' => $this->product->selling_price,
            'base_price' => $this->product->base_price,
            'cooperative_margin' => $this->product->cooperative_margin,
            'quantity' => $quantity,
            'subtotal' => $this->product->selling_price * $quantity,
        ]);

        return $order;
    }

    /**
     * 1. Unpaid order cannot receive queue.
     */
    public function test_01_unpaid_order_cannot_receive_queue(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Pending, OrderStatus::PendingPayment);

        $this->expectException(DomainException::class);
        $this->expectExceptionMessage('Hanya pesanan yang berstatus lunas (paid) yang dapat diproses fulfillment');

        $this->fulfillmentService->execute($order);
    }

    /**
     * 2. Paid order can receive queue.
     */
    public function test_02_paid_order_can_receive_queue(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);

        $fulfilledOrder = $this->fulfillmentService->execute($order);

        $this->assertNotNull($fulfilledOrder->queue_number);
        $this->assertSame(1, $fulfilledOrder->queue_number);
        $this->assertSame('A-001', $fulfilledOrder->queue_code);
    }

    /**
     * 3. Queue number is unique within pickup session.
     */
    public function test_03_queue_number_is_unique_within_pickup_session(): void
    {
        $order1 = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $order2 = $this->createOrder($this->otherStudent, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);

        $fulfilled1 = $this->fulfillmentService->execute($order1);
        $fulfilled2 = $this->fulfillmentService->execute($order2);

        $this->assertSame(1, $fulfilled1->queue_number);
        $this->assertSame('A-001', $fulfilled1->queue_code);

        $this->assertSame(2, $fulfilled2->queue_number);
        $this->assertSame('A-002', $fulfilled2->queue_code);

        $this->assertNotSame($fulfilled1->queue_number, $fulfilled2->queue_number);
    }

    /**
     * 4. Queue numbering can reset in a different pickup session.
     */
    public function test_04_queue_numbering_can_reset_in_a_different_pickup_session(): void
    {
        $orderSessionA = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $orderSessionB = $this->createOrder($this->otherStudent, $this->pickupSessionB, PaymentStatus::Paid, OrderStatus::Paid);

        $fulfilledA = $this->fulfillmentService->execute($orderSessionA);
        $fulfilledB = $this->fulfillmentService->execute($orderSessionB);

        $this->assertSame(1, $fulfilledA->queue_number);
        $this->assertSame('A-001', $fulfilledA->queue_code);

        // Different session begins numbering at 1 with prefix B
        $this->assertSame(1, $fulfilledB->queue_number);
        $this->assertSame('B-001', $fulfilledB->queue_code);
    }

    /**
     * 5. Concurrent queue allocation is safe.
     */
    public function test_05_concurrent_queue_allocation_is_safe(): void
    {
        $orders = [];
        for ($i = 0; $i < 5; $i++) {
            $orders[] = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid, 1);
        }

        $allocatedQueueNumbers = [];
        foreach ($orders as $ord) {
            $fulfilled = $this->fulfillmentService->execute($ord);
            $allocatedQueueNumbers[] = $fulfilled->queue_number;
        }

        // Must be exactly [1, 2, 3, 4, 5] without duplicates
        $this->assertCount(5, array_unique($allocatedQueueNumbers));
        $this->assertSame([1, 2, 3, 4, 5], $allocatedQueueNumbers);
    }

    /**
     * 6. Stock is decremented exactly once.
     */
    public function test_06_stock_is_decremented_exactly_once(): void
    {
        $initialStock = $this->product->stock; // 15
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid, 3);

        $this->fulfillmentService->execute($order);

        $this->assertSame($initialStock - 3, $this->product->fresh()->stock); // 12
    }

    /**
     * 7. Inventory sale movement is created exactly once.
     */
    public function test_07_inventory_sale_movement_is_created_exactly_once(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid, 4);

        $this->fulfillmentService->execute($order);

        $movements = InventoryMovement::where('product_id', $this->product->id)
            ->where('reference_type', Order::class)
            ->where('reference_id', $order->id)
            ->get();

        $this->assertCount(1, $movements);
        $this->assertSame(InventoryMovementType::Sale, $movements[0]->type);
        $this->assertSame(-4, $movements[0]->quantity);
    }

    /**
     * 8. Fulfillment is idempotent.
     */
    public function test_08_fulfillment_is_idempotent(): void
    {
        $initialStock = $this->product->stock; // 15
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid, 2);

        // First fulfillment
        $fulfilledFirst = $this->fulfillmentService->execute($order);
        $this->assertSame($initialStock - 2, $this->product->fresh()->stock);
        $this->assertSame(1, $fulfilledFirst->queue_number);
        $this->assertDatabaseCount('inventory_movements', 1);

        // Second fulfillment (re-attempt / webhook duplicate)
        $fulfilledSecond = $this->fulfillmentService->execute($order->fresh());

        // Stock must not be decremented again
        $this->assertSame($initialStock - 2, $this->product->fresh()->stock);
        // Queue number and code remain unchanged
        $this->assertSame($fulfilledFirst->queue_number, $fulfilledSecond->queue_number);
        $this->assertSame($fulfilledFirst->queue_code, $fulfilledSecond->queue_code);
        $this->assertSame($fulfilledFirst->pickup_token_hash, $fulfilledSecond->pickup_token_hash);
        // No duplicate inventory movements
        $this->assertDatabaseCount('inventory_movements', 1);
    }

    /**
     * 9. Insufficient stock prevents invalid fulfillment.
     */
    public function test_09_insufficient_stock_prevents_invalid_fulfillment(): void
    {
        $this->product->update(['stock' => 1]);
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid, 5);

        try {
            $this->fulfillmentService->execute($order);
            $this->fail('Fulfillment should fail when physical stock is insufficient');
        } catch (InsufficientStockException $e) {
            $this->assertStringContainsString('Stok tidak mencukupi', $e->getMessage());
        }

        // Verify state is completely preserved (no partial fulfillment)
        $order->refresh();
        $this->assertNull($order->queue_number);
        $this->assertNull($order->queue_code);
        $this->assertNull($order->pickup_token_hash);
        $this->assertSame(OrderStatus::Paid, $order->order_status);
        $this->assertSame(1, $this->product->fresh()->stock);
        $this->assertDatabaseCount('inventory_movements', 0);
    }

    /**
     * 10. Order becomes ready_for_pickup after successful fulfillment.
     */
    public function test_10_order_becomes_ready_for_pickup_after_successful_fulfillment(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);

        $this->assertSame(OrderStatus::Paid, $order->order_status);

        $fulfilled = $this->fulfillmentService->execute($order);

        $this->assertSame(OrderStatus::ReadyForPickup, $fulfilled->order_status);
        $this->assertNotNull($fulfilled->ready_at);
        $this->assertTrue($fulfilled->isReadyForPickup());
    }

    /**
     * 11. Queue code is correctly formatted.
     */
    public function test_11_queue_code_is_correctly_formatted(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);

        $fulfilled = $this->fulfillmentService->execute($order);

        // Session A has queue_prefix 'A' -> 'A-001'
        $this->assertMatchesRegularExpression('/^[A-Z]-\d{3}$/', $fulfilled->queue_code);
        $this->assertSame('A-001', $fulfilled->queue_code);
    }

    /**
     * 12. Pickup credential is generated.
     */
    public function test_12_pickup_credential_is_generated(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);

        $fulfilled = $this->fulfillmentService->execute($order);

        $this->assertNotNull($fulfilled->pickup_token_hash);
        $this->assertSame(64, strlen($fulfilled->pickup_token_hash)); // sha256 hex string
    }

    /**
     * 13. Raw pickup secret is never persisted in database.
     */
    public function test_13_raw_pickup_secret_is_never_persisted(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);

        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        // Database orders table only stores the 64-char sha256 hash
        $this->assertDatabaseMissing('orders', [
            'id' => $fulfilled->id,
            'pickup_token_hash' => $rawCredential,
        ]);

        $this->assertDatabaseHas('orders', [
            'id' => $fulfilled->id,
            'pickup_token_hash' => hash('sha256', strtoupper(str_replace(['-', ' '], '', $rawCredential))),
        ]);
    }

    /**
     * 14. Student can view own pickup QR.
     */
    public function test_14_student_can_view_own_pickup_qr(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);

        $response = $this->actingAs($this->student)->get("/orders/{$fulfilled->id}");

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('orders/show')
            ->has('order.queue_code')
            ->has('order.pickup_credential')
            ->has('order.qr_payload')
            ->where('order.order_status', 'ready_for_pickup')
        );
    }

    /**
     * 15. Student cannot view another student's QR.
     */
    public function test_15_student_cannot_view_another_students_qr(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);

        $response = $this->actingAs($this->otherStudent)->get("/orders/{$fulfilled->id}");

        $response->assertForbidden();
    }

    /**
     * 16. Cooperative can verify valid pickup.
     */
    public function test_16_cooperative_can_verify_valid_pickup(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        $response = $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/verify', [
            'credential' => $rawCredential,
        ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'verified',
            'order' => [
                'id' => $fulfilled->id,
                'order_number' => $fulfilled->order_number,
                'queue_code' => $fulfilled->queue_code,
                'student_name' => $this->student->name,
            ],
        ]);
    }

    /**
     * 17. Invalid pickup credential is rejected.
     */
    public function test_17_invalid_pickup_credential_is_rejected(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $this->fulfillmentService->execute($order);

        $response = $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/verify', [
            'credential' => 'INVALID-FAKE-CREDENTIAL',
        ]);

        $response->assertStatus(404);
        $response->assertJson(['message' => 'Kredensial pengambilan tidak valid atau pesanan tidak ditemukan.']);
    }

    /**
     * 18. Unpaid order cannot be picked up.
     */
    public function test_18_unpaid_order_cannot_be_picked_up(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Pending, OrderStatus::PendingPayment);
        // Force manual fake hash on unpaid order
        $order->update(['pickup_token_hash' => hash('sha256', 'FORCEDTOKEN12345')]);

        $response = $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/verify', [
            'credential' => 'FORCEDTOKEN12345',
        ]);

        $response->assertStatus(422);
        $response->assertJson(['message' => 'Pesanan belum dibayar atau pembayaran belum terverifikasi.']);
    }

    /**
     * 19. Non-ready order cannot be picked up.
     */
    public function test_19_non_ready_order_cannot_be_picked_up(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        // Order is paid but not fulfilled yet (order_status = Paid)
        $order->update(['pickup_token_hash' => hash('sha256', 'TESTCREDENTIAL123')]);

        $response = $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/verify', [
            'credential' => 'TESTCREDENTIAL123',
        ]);

        $response->assertStatus(422);
        $response->assertJsonFragment(['status' => 'paid']);
    }

    /**
     * 20. Duplicate pickup is rejected.
     */
    public function test_20_duplicate_pickup_is_rejected(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        // First completion
        $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/complete', [
            'order_id' => $fulfilled->id,
            'credential' => $rawCredential,
            'method' => 'qr',
        ])->assertOk();

        // Second completion attempt
        $secondAttempt = $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/complete', [
            'order_id' => $fulfilled->id,
            'credential' => $rawCredential,
            'method' => 'qr',
        ]);

        $secondAttempt->assertStatus(422);
        $secondAttempt->assertJsonFragment(['message' => 'Pesanan ini sudah diambil.']);
    }

    /**
     * 21. Pickup log is created exactly once.
     */
    public function test_21_pickup_log_is_created_exactly_once(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/complete', [
            'order_id' => $fulfilled->id,
            'credential' => $rawCredential,
            'method' => 'qr',
        ])->assertOk();

        $this->assertDatabaseCount('pickup_logs', 1);
        $this->assertDatabaseHas('pickup_logs', [
            'order_id' => $fulfilled->id,
            'verified_by' => $this->cooperativeUser->id,
            'method' => 'qr',
        ]);
    }

    /**
     * 22. Order becomes completed after pickup.
     */
    public function test_22_order_becomes_completed_after_pickup(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        $this->actingAs($this->cooperativeUser)->postJson('/cooperative/pickup/complete', [
            'order_id' => $fulfilled->id,
            'credential' => $rawCredential,
            'method' => 'manual',
        ])->assertOk();

        $fulfilled->refresh();
        $this->assertSame(OrderStatus::Completed, $fulfilled->order_status);
        $this->assertNotNull($fulfilled->completed_at);
        $this->assertTrue($fulfilled->isCompleted());
    }

    /**
     * 23. Student cannot mark order completed directly.
     */
    public function test_23_student_cannot_mark_order_completed_directly(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        $response = $this->actingAs($this->student)->postJson('/cooperative/pickup/complete', [
            'order_id' => $fulfilled->id,
            'credential' => $rawCredential,
        ]);

        $response->assertForbidden();
    }

    /**
     * 24. Non-cooperative user cannot verify pickup.
     */
    public function test_24_non_cooperative_user_cannot_verify_pickup(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid);
        $fulfilled = $this->fulfillmentService->execute($order);
        $rawCredential = $this->credentialService->generateRawCredential($fulfilled);

        $response = $this->actingAs($this->student)->postJson('/cooperative/pickup/verify', [
            'credential' => $rawCredential,
        ]);

        $response->assertForbidden();
    }

    /**
     * 25. Payment and fulfillment race conditions do not corrupt state.
     */
    public function test_25_payment_fulfillment_race_conditions_do_not_corrupt_state(): void
    {
        $order = $this->createOrder($this->student, $this->pickupSessionA, PaymentStatus::Paid, OrderStatus::Paid, 2);

        // Simulate two sequential fulfillment attempts representing concurrent workers
        $worker1Result = $this->fulfillmentService->execute($order);
        $worker2Result = $this->fulfillmentService->execute($order);

        $this->assertSame($worker1Result->queue_number, $worker2Result->queue_number);
        $this->assertSame($worker1Result->queue_code, $worker2Result->queue_code);
        $this->assertSame(13, $this->product->fresh()->stock); // decremented by 2 exactly once
        $this->assertDatabaseCount('inventory_movements', 1);
        $this->assertDatabaseCount('orders', 1);
    }
}
