<?php

namespace Tests\Feature;

use App\Enums\InventoryMovementType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PickupSessionStatus;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use App\Services\CashPaymentService;
use App\Services\PickupCredentialService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CashPaymentVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;

    protected User $otherStudent;

    protected User $cooperativeUser;

    protected Category $category;

    protected Product $product;

    protected PickupSession $pickupSession;

    protected CashPaymentService $cashPaymentService;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cashPaymentService = app(CashPaymentService::class);

        $this->student = User::factory()->student()->create([
            'name' => 'Ahmad Faiz',
            'email' => 'ahmad@sekolah.sch.id',
        ]);

        $this->otherStudent = User::factory()->student()->create([
            'name' => 'Budi Santoso',
            'email' => 'budi@sekolah.sch.id',
        ]);

        $this->cooperativeUser = User::factory()->cooperative()->create([
            'name' => 'Pengurus Koperasi',
            'email' => 'koperasi@sekolah.sch.id',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Makanan Ringan',
        ]);

        $this->product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Roti Coklat Koperasi',
            'selling_price' => 5000,
            'base_price' => 4000,
            'cooperative_margin' => 1000,
            'stock' => 15,
            'status' => ProductStatus::Active,
            'source_type' => ProductSourceType::Cooperative,
        ]);

        $this->pickupSession = PickupSession::factory()->create([
            'name' => 'Sesi Istirahat Pertama',
            'pickup_date' => now()->toDateString(),
            'starts_at' => '09:30:00',
            'ends_at' => '10:00:00',
            'queue_prefix' => 'A',
            'status' => PickupSessionStatus::Active,
        ]);
    }

    /**
     * Helper to add item to student's cart.
     */
    protected function addItemToCart(User $user, Product $product, int $quantity = 2): CartItem
    {
        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        return CartItem::create([
            'cart_id' => $cart->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
        ]);
    }

    // =========================================================================
    // CHECKOUT TESTS
    // =========================================================================

    public function test_student_can_create_order_with_cash_payment_and_no_stock_deduction_at_checkout(): void
    {
        $this->addItemToCart($this->student, $this->product, 3);
        $initialStock = $this->product->stock;

        $response = $this->actingAs($this->student)
            ->post('/checkout', [
                'pickup_session_id' => $this->pickupSession->id,
            ]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $this->assertNotNull($order);

        $response->assertRedirect("/orders/{$order->id}");

        // Order starts in pending payment
        $this->assertSame(OrderStatus::PendingPayment, $order->order_status);
        $this->assertSame(PaymentStatus::Pending, $order->payment_status);
        $this->assertSame(15000, $order->total);
        $this->assertNull($order->queue_number);
        $this->assertNull($order->pickup_token_hash);

        // Physical stock is NOT decremented yet
        $this->product->refresh();
        $this->assertSame($initialStock, $this->product->stock);

        // Payment record is created with cash provider and token hash
        $payment = $order->payments()->first();
        $this->assertNotNull($payment);
        $this->assertSame('cash', $payment->provider);
        $this->assertSame('cash', $payment->payment_type);
        $this->assertSame(PaymentStatus::Pending, $payment->status);
        $this->assertSame(15000, $payment->gross_amount);
        $this->assertNotNull($payment->payment_token_hash);
        $this->assertNull($payment->verified_by);
        $this->assertNull($payment->paid_at);

        // Cart is cleared
        $cart = $this->student->cart;
        $this->assertCount(0, $cart->items);
    }

    public function test_student_order_show_displays_cash_payment_qr_and_token_when_pending(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);

        $this->actingAs($this->student)
            ->post('/checkout', [
                'pickup_session_id' => $this->pickupSession->id,
            ]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();

        $response = $this->actingAs($this->student)
            ->get("/orders/{$order->id}");

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->where('order.order_number', $order->order_number)
            ->where('order.order_status', 'pending_payment')
            ->where('order.payment_status', 'pending')
            ->where('order.payment_method', 'cash')
            ->has('order.payment_qr_payload')
            ->has('order.payment_token')
            ->where('order.pickup_credential', null)
            ->where('order.qr_payload', null)
        );
    }

    // =========================================================================
    // QR RESOLUTION TESTS
    // =========================================================================

    public function test_valid_payment_qr_resolves_correct_order_in_cooperative_scanner(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);
        $qrPayload = $this->cashPaymentService->buildPaymentQrPayload($order, $rawToken);

        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => $qrPayload,
            ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'verified',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'student_name' => 'Ahmad Faiz',
                'total' => 10000,
                'order_status' => 'pending_payment',
                'payment_status' => 'pending',
                'has_stock_deficit' => false,
            ],
            'token' => $rawToken,
        ]);
    }

    public function test_manual_token_resolves_correct_order(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => $rawToken,
                'order_number' => $order->order_number,
            ]);

        $response->assertOk();
        $response->assertJsonPath('order.order_number', $order->order_number);
    }

    public function test_forged_or_invalid_qr_token_is_rejected(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();

        // Forged fake token
        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => 'FORGED-TOKEN-9999-FAKE',
                'order_number' => $order->order_number,
            ]);

        $response->assertStatus(404);
        $response->assertJsonFragment([
            'message' => 'QR pembayaran tidak valid, pesanan tidak ditemukan, atau pembayaran sudah diverifikasi sebelumnya.',
        ]);
    }

    // =========================================================================
    // COOPERATIVE ROLE AUTHORIZATION TESTS
    // =========================================================================

    public function test_student_cannot_access_cash_verification(): void
    {
        $response = $this->actingAs($this->student)
            ->get('/cooperative/payments');

        $response->assertForbidden();

        $verifyPageResponse = $this->actingAs($this->student)
            ->get('/cooperative/payments/verify');

        $verifyPageResponse->assertForbidden();

        $verifyResponse = $this->actingAs($this->student)
            ->postJson('/cooperative/payments/verify', [
                'token' => 'SOME-TOKEN',
            ]);

        $verifyResponse->assertForbidden();

        $confirmResponse = $this->actingAs($this->student)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => 1,
                'token' => 'SOME-TOKEN',
            ]);

        $confirmResponse->assertForbidden();
    }

    public function test_cooperative_can_open_verification_workspace(): void
    {
        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/payments');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/payments/index')
            ->has('active_sessions')
            ->has('recent_payments')
            ->has('pending_orders')
        );

        // Dedicated verify route specified in Section 8 & 34
        $verifyPage = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/payments/verify');

        $verifyPage->assertOk();
        $verifyPage->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/payments/index')
            ->has('pending_orders')
        );
    }

    // =========================================================================
    // PAYMENT CONFIRMATION & ATOMIC FULFILLMENT TESTS
    // =========================================================================

    public function test_cash_confirmation_marks_payment_paid_consumes_token_and_runs_fulfillment(): void
    {
        $this->addItemToCart($this->student, $this->product, 3);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        $initialStock = $this->product->stock;

        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ]);

        $response->assertOk();
        $response->assertJson([
            'status' => 'success',
            'already_processed' => false,
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'queue_code' => 'A-001',
                'order_status' => 'ready_for_pickup',
            ],
        ]);

        // Verify Payment record state
        $payment = $order->payments()->first();
        $this->assertSame(PaymentStatus::Paid, $payment->status);
        $this->assertSame($this->cooperativeUser->id, $payment->verified_by);
        $this->assertNotNull($payment->paid_at);
        $this->assertNotNull($payment->cash_received_at);
        $this->assertNull($payment->payment_token_hash); // Token consumed!

        // Verify Order record state
        $order->refresh();
        $this->assertSame(PaymentStatus::Paid, $order->payment_status);
        $this->assertSame(OrderStatus::ReadyForPickup, $order->order_status);
        $this->assertSame(1, $order->queue_number);
        $this->assertSame('A-001', $order->queue_code);
        $this->assertNotNull($order->pickup_token_hash);
        $this->assertNotNull($order->ready_at);

        // Verify physical stock decremented
        $this->product->refresh();
        $this->assertSame($initialStock - 3, $this->product->stock);

        // Verify InventoryMovement created
        $movement = InventoryMovement::where('reference_type', Order::class)
            ->where('reference_id', $order->id)
            ->first();

        $this->assertNotNull($movement);
        $this->assertSame(InventoryMovementType::Sale, $movement->type);
        $this->assertSame(-3, $movement->quantity);
    }

    public function test_consumed_token_cannot_be_verified_again(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // First verification & confirmation
        $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ])
            ->assertOk();

        // Attempting to scan again fails with 422 (already paid)
        $reScan = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => $rawToken,
                'order_number' => $order->order_number,
            ]);

        $reScan->assertStatus(422);
        $reScan->assertJsonFragment([
            'already_paid' => true,
        ]);
    }

    // =========================================================================
    // IDEMPOTENCY & CONCURRENCY TESTS
    // =========================================================================

    public function test_idempotent_cash_confirmation_does_not_duplicate_stock_queue_or_movements(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // First confirmation
        $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ])
            ->assertOk();

        $stockAfterFirst = $this->product->fresh()->stock;
        $movementsCount = InventoryMovement::where('reference_id', $order->id)->count();
        $this->assertSame(1, $movementsCount);

        // Duplicate confirmation with same parameters
        $res2 = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ]);

        $res2->assertOk();
        $res2->assertJson(['already_processed' => true]);

        // No extra stock deduction
        $this->assertSame($stockAfterFirst, $this->product->fresh()->stock);

        // No extra movement created
        $this->assertSame(1, InventoryMovement::where('reference_id', $order->id)->count());

        // Queue number unchanged
        $this->assertSame('A-001', $order->fresh()->queue_code);
    }

    // =========================================================================
    // STOCK RACE CONDITION TESTS
    // =========================================================================

    public function test_insufficient_stock_at_verification_rolls_back_everything(): void
    {
        $this->addItemToCart($this->student, $this->product, 5);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // Simulate concurrent stock depletion before student pays cash
        $this->product->update(['stock' => 2]); // only 2 left, but order requires 5

        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ]);

        $response->assertStatus(422);
        $response->assertJsonFragment([
            'error_type' => 'insufficient_stock',
        ]);

        // Verify atomic rollback:
        $order->refresh();
        $this->assertSame(OrderStatus::PendingPayment, $order->order_status);
        $this->assertSame(PaymentStatus::Pending, $order->payment_status);
        $this->assertNull($order->queue_number);
        $this->assertNull($order->pickup_token_hash);

        $payment = $order->payments()->first();
        $this->assertSame(PaymentStatus::Pending, $payment->status);
        $this->assertNotNull($payment->payment_token_hash); // Token NOT consumed!

        // Stock was NOT made negative
        $this->assertSame(2, $this->product->fresh()->stock);

        // No inventory movements created
        $this->assertSame(0, InventoryMovement::where('reference_id', $order->id)->count());
    }

    // =========================================================================
    // COMPATIBILITY WITH EXISTING PHASE 10 PICKUP CONSOLE
    // =========================================================================

    public function test_verified_order_can_be_completed_via_phase10_pickup_console(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // 1. Cooperative verifies cash payment
        $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ])
            ->assertOk();

        $order->refresh();
        $this->assertSame(OrderStatus::ReadyForPickup, $order->order_status);

        // 2. Student views order details and receives Phase 10 Pickup Credential
        $credentialService = app(PickupCredentialService::class);
        $rawPickupCredential = $credentialService->generateRawCredential($order);

        // 3. Cooperative scans Pickup QR at counter to hand over items
        $pickupVerify = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/pickup/verify', [
                'credential' => $rawPickupCredential,
                'order_number' => $order->order_number,
            ]);

        $pickupVerify->assertOk();
        $pickupVerify->assertJsonPath('order.order_status', 'ready_for_pickup');

        // 4. Cooperative completes handover
        $pickupComplete = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/pickup/complete', [
                'order_id' => $order->id,
                'credential' => $rawPickupCredential,
            ]);

        $pickupComplete->assertOk();

        $order->refresh();
        $this->assertSame(OrderStatus::Completed, $order->order_status);
        $this->assertNotNull($order->completed_at);
        $this->assertNotNull($order->pickupLog);
    }

    // =========================================================================
    // SEPARATION: PAYMENT QR vs PICKUP QR (Section 21)
    // =========================================================================

    public function test_pickup_qr_cannot_be_verified_in_payment_scanner(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $credentialService = app(PickupCredentialService::class);
        $pickupPayload = $credentialService->buildQrPayload($order, 'SOME-PICKUP-CREDENTIAL');

        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => $pickupPayload,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error_type' => 'pickup_qr_detected',
            'message' => 'QR yang dipindai adalah QR Pengambilan Pesanan, bukan QR Pembayaran.',
        ]);
    }

    public function test_payment_qr_cannot_be_verified_in_pickup_scanner(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawPaymentToken = $this->cashPaymentService->generateRawToken($order);
        $paymentPayload = $this->cashPaymentService->buildPaymentQrPayload($order, $rawPaymentToken);

        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/pickup/verify', [
                'credential' => $paymentPayload,
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error_type' => 'payment_qr_detected',
            'message' => 'QR yang dipindai adalah QR Pembayaran Kasir, bukan QR Pengambilan Pesanan.',
        ]);
    }

    // =========================================================================
    // ROBUSTNESS & SECURITY (Sections 12, 19, 27)
    // =========================================================================

    public function test_malformed_qr_payload_is_rejected(): void
    {
        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => '{broken-json-payload',
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error_type' => 'malformed_payload',
            'message' => 'Format payload QR tidak valid atau rusak.',
        ]);
    }

    public function test_unsupported_qr_version_is_rejected(): void
    {
        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => json_encode(['v' => 99, 'o' => 'KD-999', 't' => 'TOKEN']),
            ]);

        $response->assertStatus(422);
        $response->assertJson([
            'error_type' => 'unsupported_version',
            'message' => 'Versi QR pembayaran tidak didukung.',
        ]);
    }

    public function test_cancelled_order_cannot_be_verified_or_paid(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // Cancel order
        $order->update(['order_status' => OrderStatus::Cancelled]);

        $verify = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify', [
                'token' => $rawToken,
                'order_number' => $order->order_number,
            ]);

        $verify->assertStatus(422);
        $verify->assertJsonFragment([
            'message' => "Pesanan #{$order->order_number} telah dibatalkan.",
        ]);

        $confirm = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ]);

        $confirm->assertStatus(422);
    }

    public function test_client_cannot_tamper_payment_amount(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // Attempting to submit a manipulated fake amount from client
        $response = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
                'total' => 100, // Tampered client value!
                'gross_amount' => 100,
            ]);

        $response->assertOk();

        // Server authoritative total MUST remain intact (10000, not 100)
        $order->refresh();
        $this->assertSame(10000, $order->total);
        $payment = $order->payments()->first();
        $this->assertSame(10000, $payment->gross_amount);
    }

    public function test_cooperative_workspace_overview_shows_real_metrics(): void
    {
        // 1 pending order
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/index')
            ->has('metrics')
            ->where('metrics.pending_payment_count', 1)
        );
    }

    public function test_cooperative_payment_verification_route_aliases_work(): void
    {
        $this->addItemToCart($this->student, $this->product, 2);
        $this->actingAs($this->student)
            ->post('/checkout', ['pickup_session_id' => $this->pickupSession->id]);

        $order = Order::where('user_id', $this->student->id)->latest()->first();
        $rawToken = $this->cashPaymentService->generateRawToken($order);

        // Scan alias
        $scan = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify/scan', [
                'token' => $rawToken,
                'order_number' => $order->order_number,
            ]);
        $scan->assertOk();

        // Confirm alias
        $confirm = $this->actingAs($this->cooperativeUser)
            ->postJson('/cooperative/payments/verify/confirm', [
                'order_id' => $order->id,
                'token' => $rawToken,
            ]);
        $confirm->assertOk();
    }
}
