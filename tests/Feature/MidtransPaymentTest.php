<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PickupSessionStatus;
use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MidtransPaymentTest extends TestCase
{
    use RefreshDatabase;

    protected User $student;

    protected User $otherStudent;

    protected Category $category;

    protected Product $product;

    protected PickupSession $pickupSession;

    protected Order $order;

    protected string $serverKey = 'SB-Mid-server-test-secret-key-12345';

    protected string $clientKey = 'SB-Mid-client-test-public-key-67890';

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'services.midtrans.server_key' => $this->serverKey,
            'services.midtrans.client_key' => $this->clientKey,
            'services.midtrans.is_production' => false,
            'services.midtrans.snap_url' => 'https://app.sandbox.midtrans.com/snap/v1/transactions',
            'services.midtrans.snap_js_url' => 'https://app.sandbox.midtrans.com/snap/snap.js',
        ]);

        $this->student = User::factory()->student()->create([
            'name' => 'Aditya Pratama',
            'email' => 'aditya@sekolah.sch.id',
        ]);

        $this->otherStudent = User::factory()->student()->create([
            'name' => 'Dewi Lestari',
            'email' => 'dewi@sekolah.sch.id',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Minuman Dingin',
            'slug' => 'minuman-dingin',
            'is_active' => true,
        ]);

        $this->product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Susu Kotak UHT Cokelat',
            'slug' => 'susu-kotak-uht-cokelat',
            'base_price' => 4500,
            'cooperative_margin' => 1000,
            'selling_price' => 5500,
            'stock' => 20,
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

        // Create standard pending order (subtotal = 11000, total = 11000)
        $this->order = Order::create([
            'user_id' => $this->student->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_number' => 'KD-20261003-AB12CD',
            'queue_number' => null,
            'queue_code' => null,
            'subtotal' => 11000,
            'cooperative_margin_total' => 2000,
            'total' => 11000,
            'payment_status' => PaymentStatus::Pending,
            'order_status' => OrderStatus::PendingPayment,
            'pickup_token_hash' => null,
        ]);

        $this->order->items()->create([
            'product_id' => $this->product->id,
            'seller_id' => $this->product->owner_id,
            'product_name' => $this->product->name,
            'unit_price' => 5500,
            'base_price' => 4500,
            'cooperative_margin' => 1000,
            'quantity' => 2,
            'subtotal' => 11000,
        ]);
    }

    /**
     * Helper to compute official Midtrans SHA512 signature.
     */
    protected function generateMidtransSignature(string $orderId, string $statusCode, string $grossAmount): string
    {
        return hash('sha512', $orderId.$statusCode.$grossAmount.$this->serverKey);
    }

    /**
     * 1. Student can initialize payment for own pending order.
     */
    public function test_1_student_can_initialize_payment_for_own_pending_order(): void
    {
        Http::fake([
            '*/snap/v1/transactions' => Http::response([
                'token' => 'mock-snap-token-001',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/mock-snap-token-001',
            ], 201),
        ]);

        $response = $this->actingAs($this->student)->postJson("/orders/{$this->order->id}/payment");

        $response->assertOk();
        $response->assertJson([
            'snap_token' => 'mock-snap-token-001',
            'client_key' => $this->clientKey,
        ]);

        $this->assertDatabaseHas('payments', [
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'payment_token' => 'mock-snap-token-001',
            'status' => 'pending',
            'gross_amount' => 11000,
        ]);
    }

    /**
     * 2. Student cannot initialize payment for another student's order.
     */
    public function test_2_student_cannot_initialize_payment_for_another_students_order(): void
    {
        Http::fake();

        $response = $this->actingAs($this->otherStudent)->postJson("/orders/{$this->order->id}/payment");

        $response->assertForbidden();
        Http::assertNothingSent();
        $this->assertDatabaseCount('payments', 0);
    }

    /**
     * 3. Paid order cannot be paid again.
     */
    public function test_3_paid_order_cannot_be_paid_again(): void
    {
        Http::fake();

        $this->order->update([
            'payment_status' => PaymentStatus::Paid,
            'order_status' => OrderStatus::Paid,
            'paid_at' => now(),
        ]);

        $response = $this->actingAs($this->student)->postJson("/orders/{$this->order->id}/payment");

        $response->assertStatus(422);
        Http::assertNothingSent();
    }

    /**
     * 4. Cancelled order cannot be paid.
     */
    public function test_4_cancelled_order_cannot_be_paid(): void
    {
        Http::fake();

        $this->order->update([
            'payment_status' => PaymentStatus::Cancelled,
            'order_status' => OrderStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        $response = $this->actingAs($this->student)->postJson("/orders/{$this->order->id}/payment");

        $response->assertStatus(422);
        Http::assertNothingSent();
    }

    /**
     * 5. Server-side order total is used.
     */
    public function test_5_server_side_order_total_is_used(): void
    {
        $this->order->update(['total' => 11000]);

        Http::fake([
            '*/snap/v1/transactions' => Http::response([
                'token' => 'token-123',
                'redirect_url' => 'https://midtrans.test',
            ], 201),
        ]);

        $this->actingAs($this->student)->postJson("/orders/{$this->order->id}/payment");

        Http::assertSent(function ($request) {
            return $request['transaction_details']['gross_amount'] === 11000
                && $request['transaction_details']['order_id'] === $this->order->order_number;
        });
    }

    /**
     * 6. Client-submitted amount is ignored.
     */
    public function test_6_client_submitted_amount_is_ignored(): void
    {
        Http::fake([
            '*/snap/v1/transactions' => Http::response([
                'token' => 'token-tamper-test',
                'redirect_url' => 'https://midtrans.test',
            ], 201),
        ]);

        // Attacker attempts to tamper gross amount in request payload
        $this->actingAs($this->student)->postJson("/orders/{$this->order->id}/payment", [
            'gross_amount' => 500,
            'total' => 500,
        ]);

        Http::assertSent(function ($request) {
            // Must strictly use database total (11000), NOT client's 500
            return $request['transaction_details']['gross_amount'] === 11000;
        });

        $this->assertDatabaseHas('payments', [
            'order_id' => $this->order->id,
            'gross_amount' => 11000,
        ]);
    }

    /**
     * 7. Server Key is never exposed to frontend props.
     */
    public function test_7_server_key_is_never_exposed_to_frontend_props(): void
    {
        $response = $this->actingAs($this->student)->get("/orders/{$this->order->id}");

        $response->assertOk();
        $response->assertDontSee($this->serverKey);
        $response->assertInertia(fn (Assert $page) => $page
            ->component('orders/show')
            ->where('midtrans_client_key', $this->clientKey)
            ->missing('server_key')
            ->missing('midtrans_server_key')
        );
    }

    /**
     * 8. Snap token is returned when initialization succeeds.
     */
    public function test_8_snap_token_is_returned_when_initialization_succeeds(): void
    {
        Http::fake([
            '*/snap/v1/transactions' => Http::response([
                'token' => 'unique-snap-token-xyz',
                'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v4/redirection/unique-snap-token-xyz',
            ], 201),
        ]);

        $response = $this->actingAs($this->student)->postJson("/orders/{$this->order->id}/payment");

        $response->assertOk();
        $response->assertJsonPath('snap_token', 'unique-snap-token-xyz');
        $response->assertJsonPath('client_key', $this->clientKey);
    }

    /**
     * 9. Webhook can mark valid payment as paid.
     */
    public function test_9_webhook_can_mark_valid_payment_as_paid(): void
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'payment_token' => 'snap-token-999',
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-trans-uuid-001',
            'payment_type' => 'qris',
        ];

        $response = $this->postJson('/webhooks/midtrans', $payload);

        $response->assertOk();
        $response->assertJson(['status' => 'success']);

        $this->order->refresh();
        $payment->refresh();

        $this->assertSame(OrderStatus::ReadyForPickup, $this->order->order_status);
        $this->assertSame(PaymentStatus::Paid, $this->order->payment_status);
        $this->assertNotNull($this->order->paid_at);

        $this->assertSame(PaymentStatus::Paid, $payment->status);
        $this->assertSame('midtrans-trans-uuid-001', $payment->provider_transaction_id);
        $this->assertSame('qris', $payment->payment_type);
        $this->assertNotNull($payment->paid_at);
    }

    /**
     * 10. Invalid webhook signature cannot mark payment as paid.
     */
    public function test_10_invalid_webhook_cannot_mark_payment_as_paid(): void
    {
        Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'payment_token' => 'snap-token-999',
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $payload = [
            'order_id' => $this->order->order_number,
            'status_code' => '200',
            'gross_amount' => '11000.00',
            'signature_key' => 'fake_tampered_signature_hash',
            'transaction_status' => 'settlement',
            'transaction_id' => 'fake-id',
        ];

        $response = $this->postJson('/webhooks/midtrans', $payload);

        $response->assertStatus(403);

        $this->order->refresh();
        $this->assertSame(OrderStatus::PendingPayment, $this->order->order_status);
        $this->assertSame(PaymentStatus::Pending, $this->order->payment_status);
    }

    /**
     * 11. Wrong order identity is rejected.
     */
    public function test_11_wrong_order_identity_is_rejected(): void
    {
        $nonExistentOrderId = 'KD-99999999-NOTFOUND';
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($nonExistentOrderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $nonExistentOrderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
        ];

        $response = $this->postJson('/webhooks/midtrans', $payload);

        $response->assertStatus(404);
    }

    /**
     * 12. Wrong amount is rejected.
     */
    public function test_12_wrong_amount_is_rejected(): void
    {
        Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'payment_token' => 'snap-token-999',
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $tamperedAmount = '500.00'; // Doesn't match order total (11000)
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $tamperedAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $tamperedAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
        ];

        $response = $this->postJson('/webhooks/midtrans', $payload);

        $response->assertStatus(400);

        $this->order->refresh();
        $this->assertSame(OrderStatus::PendingPayment, $this->order->order_status);
    }

    /**
     * 13. Duplicate webhook is idempotent.
     */
    public function test_13_duplicate_webhook_is_idempotent(): void
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'payment_token' => 'snap-token-999',
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-trans-uuid-001',
            'payment_type' => 'qris',
        ];

        // First delivery
        $res1 = $this->postJson('/webhooks/midtrans', $payload);
        $res1->assertOk();
        $this->assertSame(OrderStatus::ReadyForPickup, $this->order->fresh()->order_status);

        // Second delivery (duplicate identical webhook notification)
        $res2 = $this->postJson('/webhooks/midtrans', $payload);
        $res2->assertOk();
        $res2->assertJson(['status' => 'already_processed']);

        $this->assertSame(OrderStatus::ReadyForPickup, $this->order->fresh()->order_status);
        $this->assertSame(PaymentStatus::Paid, $payment->fresh()->status);
        $this->assertDatabaseCount('payments', 1);
    }

    /**
     * 14. Repeated success notification does not duplicate state changes.
     */
    public function test_14_repeated_success_notification_does_not_duplicate_state_changes(): void
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'payment_token' => 'snap-token-999',
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'transaction_id' => 'midtrans-trans-uuid-001',
            'payment_type' => 'gopay',
        ];

        $this->postJson('/webhooks/midtrans', $payload)->assertOk();
        $firstPaidAt = $this->order->fresh()->paid_at;

        // Repeat webhook notification
        $this->postJson('/webhooks/midtrans', $payload)->assertOk();

        $this->assertEquals($firstPaidAt, $this->order->fresh()->paid_at);
        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseCount('orders', 1);
    }

    /**
     * 15. Failed payment maps to correct KOPDIG state.
     */
    public function test_15_failed_payment_maps_to_correct_kopdig_state(): void
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '202';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'expire',
            'transaction_id' => 'midtrans-trans-uuid-expired',
        ];

        $response = $this->postJson('/webhooks/midtrans', $payload);
        $response->assertOk();

        $this->order->refresh();
        $payment->refresh();

        $this->assertSame(PaymentStatus::Expired, $this->order->payment_status);
        $this->assertSame(OrderStatus::Cancelled, $this->order->order_status);
        $this->assertSame(PaymentStatus::Expired, $payment->status);
    }

    /**
     * 16. Pending payment remains pending.
     */
    public function test_16_pending_payment_remains_pending(): void
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '201';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'pending',
            'transaction_id' => 'midtrans-trans-uuid-pending',
            'payment_type' => 'bank_transfer',
        ];

        $response = $this->postJson('/webhooks/midtrans', $payload);
        $response->assertOk();

        $this->order->refresh();
        $payment->refresh();

        $this->assertSame(PaymentStatus::Pending, $this->order->payment_status);
        $this->assertSame(OrderStatus::PendingPayment, $this->order->order_status);
        $this->assertSame(PaymentStatus::Pending, $payment->status);
    }

    /**
     * 17. Payment update and order update are atomic.
     */
    public function test_17_payment_update_and_order_update_are_atomic(): void
    {
        $payment = Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
            'transaction_id' => 'atomic-test-uuid',
            'payment_type' => 'qris',
        ];

        $this->postJson('/webhooks/midtrans', $payload)->assertOk();

        $this->order->refresh();
        $payment->refresh();

        // Both order and payment must be in paid state together with order ready for pickup
        $this->assertSame(PaymentStatus::Paid, $this->order->payment_status);
        $this->assertSame(OrderStatus::ReadyForPickup, $this->order->order_status);
        $this->assertSame(PaymentStatus::Paid, $payment->status);
    }

    /**
     * 18. Successful payment does NOT prematurely mark order completed.
     */
    public function test_18_successful_payment_does_not_prematurely_mark_order_completed(): void
    {
        Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
        ];

        $this->postJson('/webhooks/midtrans', $payload)->assertOk();

        $this->order->refresh();
        $this->assertNotSame(OrderStatus::Completed, $this->order->order_status);
        $this->assertSame(OrderStatus::ReadyForPickup, $this->order->order_status);
        $this->assertNotNull($this->order->queue_number);
        $this->assertNotNull($this->order->queue_code);
    }

    /**
     * 19. Successful payment hands off to pickup fulfillment and generates QR credential hash.
     */
    public function test_19_successful_payment_hands_off_to_pickup_fulfillment(): void
    {
        Payment::create([
            'order_id' => $this->order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $this->order->order_number,
            'status' => PaymentStatus::Pending,
            'gross_amount' => 11000,
        ]);

        $orderId = $this->order->order_number;
        $statusCode = '200';
        $grossAmount = '11000.00';
        $signature = $this->generateMidtransSignature($orderId, $statusCode, $grossAmount);

        $payload = [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signature,
            'transaction_status' => 'settlement',
        ];

        $this->postJson('/webhooks/midtrans', $payload)->assertOk();

        $this->order->refresh();

        // Verify QR pickup token hash is generated upon verified fulfillment
        $this->assertNotNull($this->order->pickup_token_hash);
        $this->assertSame(OrderStatus::ReadyForPickup, $this->order->order_status);
    }
}
