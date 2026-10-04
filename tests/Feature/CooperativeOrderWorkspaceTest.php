<?php

namespace Tests\Feature;

use App\Actions\PreparePaidOrderForPickup;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PickupSessionStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PickupLog;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use App\Services\PickupCredentialService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CooperativeOrderWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    private User $cooperativeUser;

    private User $studentUser;

    private User $secondStudent;

    private Category $category;

    private PickupSession $pickupSession;

    protected function setUp(): void
    {
        parent::setUp();

        $this->cooperativeUser = User::factory()->create([
            'role' => UserRole::Cooperative,
            'name' => 'Pengurus Koperasi Loket Kasir',
            'email' => 'kasir.koperasi@sekolah.sch.id',
        ]);

        $this->studentUser = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Raditya Pratama',
            'student_identifier' => 'NIS204060',
            'email' => 'raditya@sekolah.sch.id',
        ]);

        $this->secondStudent = User::factory()->create([
            'role' => UserRole::Student,
            'name' => 'Siti Nurhaliza',
            'student_identifier' => 'NIS204061',
            'email' => 'siti@sekolah.sch.id',
        ]);

        $this->category = Category::factory()->create([
            'name' => 'Konsumsi Sekolah',
            'slug' => 'konsumsi-sekolah',
            'is_active' => true,
        ]);

        $this->pickupSession = PickupSession::factory()->create([
            'name' => 'Istirahat Siang',
            'pickup_date' => now()->toDateString(),
            'starts_at' => '12:00:00',
            'ends_at' => '12:30:00',
            'queue_prefix' => 'B',
            'status' => PickupSessionStatus::Active,
        ]);
    }

    /**
     * 1. Cooperative user can access order workspace list.
     */
    public function test_1_cooperative_can_access_order_workspace_list(): void
    {
        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative/orders');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/orders/index')
            ->where('activeNav', 'orders')
            ->has('orders.data', 1)
            ->has('stats')
            ->has('pickup_sessions')
            ->has('filters')
        );
    }

    /**
     * 2. Student user cannot access cooperative order workspace.
     */
    public function test_2_student_cannot_access_cooperative_order_workspace(): void
    {
        $response = $this->actingAs($this->studentUser)->get('/cooperative/orders');
        $response->assertForbidden();
    }

    /**
     * 3. Guest is redirected to login.
     */
    public function test_3_guest_is_redirected_to_login(): void
    {
        $response = $this->get('/cooperative/orders');
        $response->assertRedirect('/login');
    }

    /**
     * 4. Cooperative can view order detail.
     */
    public function test_4_cooperative_can_view_order_detail(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_number' => 'KD-20261004-TEST01',
            'subtotal' => 20000,
            'cooperative_margin_total' => 4000,
            'total' => 24000,
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders/'.$order->order_number);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/orders/show')
            ->where('activeNav', 'orders')
            ->where('order.order_number', 'KD-20261004-TEST01')
            ->where('order.customer.name', 'Raditya Pratama')
            ->where('order.customer.student_identifier', 'NIS204060')
            ->where('order.total', 24000)
        );
    }

    /**
     * 5. Student cannot access cooperative order detail.
     */
    public function test_5_student_cannot_access_cooperative_order_detail(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-20261004-TEST02',
        ]);

        $response = $this->actingAs($this->studentUser)
            ->get('/cooperative/orders/'.$order->order_number);

        $response->assertForbidden();
    }

    /**
     * 6. Order list loads real database data with item counts.
     */
    public function test_6_order_list_loads_real_database_data(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_number' => 'KD-20261004-REAL01',
            'subtotal' => 15000,
            'total' => 15000,
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Pending,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => null,
            'product_name' => 'Buku Catatan Saku',
            'unit_price' => 5000,
            'base_price' => 4000,
            'cooperative_margin' => 1000,
            'quantity' => 3,
            'subtotal' => 15000,
        ]);

        $response = $this->actingAs($this->cooperativeUser)->get('/cooperative/orders');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('orders.data.0.order_number', 'KD-20261004-REAL01')
            ->where('orders.data.0.items_count', 1)
            ->where('orders.data.0.total_quantity', 3)
            ->where('orders.data.0.total', 15000)
            ->where('orders.data.0.customer.name', 'Raditya Pratama')
        );
    }

    /**
     * 7. Server-side search by order number, customer name, NISN, and queue code.
     */
    public function test_7_search_filters_orders_appropriately(): void
    {
        $orderA = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-20261004-ALPHA1',
            'queue_code' => 'B-001',
            'queue_number' => 1,
        ]);

        $orderB = Order::factory()->create([
            'user_id' => $this->secondStudent->id,
            'order_number' => 'KD-20261004-BETA02',
            'queue_code' => 'B-002',
            'queue_number' => 2,
        ]);

        // Search by Order Number
        $resOrder = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?search=ALPHA1');
        $resOrder->assertOk();
        $resOrder->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-20261004-ALPHA1')
        );

        // Search by Student Name
        $resName = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?search=Nurhaliza');
        $resName->assertOk();
        $resName->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-20261004-BETA02')
        );

        // Search by Student NISN
        $resNisn = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?search=NIS204060');
        $resNisn->assertOk();
        $resNisn->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-20261004-ALPHA1')
        );

        // Search by Queue Code
        $resQueue = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?search=B-002');
        $resQueue->assertOk();
        $resQueue->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-20261004-BETA02')
        );
    }

    /**
     * 8. Filter by Order Status.
     */
    public function test_8_filter_by_order_status(): void
    {
        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-STATUS-PENDING',
            'order_status' => OrderStatus::PendingPayment,
        ]);

        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-STATUS-READY',
            'order_status' => OrderStatus::ReadyForPickup,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?order_status=ready_for_pickup');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-STATUS-READY')
        );
    }

    /**
     * 9. Filter by Payment Status.
     */
    public function test_9_filter_by_payment_status(): void
    {
        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-PAY-PENDING',
            'payment_status' => PaymentStatus::Pending,
        ]);

        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-PAY-PAID',
            'payment_status' => PaymentStatus::Paid,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?payment_status=paid');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-PAY-PAID')
        );
    }

    /**
     * 10. Filter by Pickup Session.
     */
    public function test_10_filter_by_pickup_session(): void
    {
        $sessionSecond = PickupSession::factory()->create([
            'name' => 'Istirahat Sore',
            'pickup_date' => now()->toDateString(),
            'starts_at' => '15:00:00',
            'ends_at' => '15:30:00',
            'queue_prefix' => 'C',
            'status' => PickupSessionStatus::Active,
        ]);

        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_number' => 'KD-SESS-FIRST',
        ]);

        Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $sessionSecond->id,
            'order_number' => 'KD-SESS-SECOND',
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?pickup_session_id='.$sessionSecond->id);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->has('orders.data', 1)
            ->where('orders.data.0.order_number', 'KD-SESS-SECOND')
        );
    }

    /**
     * 11. Pagination preserves search and filter parameters.
     */
    public function test_11_pagination_preserves_query_parameters(): void
    {
        Order::factory()->count(25)->create([
            'user_id' => $this->studentUser->id,
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Pending,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders?payment_status=pending&order_status=pending_payment&page=1');

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/orders/index')
            ->where('orders.current_page', 1)
            ->where('orders.last_page', 2)
            ->where('orders.total', 25)
            ->has('orders.links')
        );
    }

    /**
     * 12. Order detail displays historical order item snapshots accurately.
     */
    public function test_12_order_detail_displays_historical_order_item_snapshots(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Kue Brownies Cokelat',
            'base_price' => 8000,
            'cooperative_margin' => 2000,
            'selling_price' => 10000,
        ]);

        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-20261004-SNAP01',
            'subtotal' => 20000,
            'cooperative_margin_total' => 4000,
            'total' => 20000,
            'order_status' => OrderStatus::Paid,
            'payment_status' => PaymentStatus::Paid,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => 'Kue Brownies Cokelat (Snapshot 2026)',
            'unit_price' => 10000,
            'base_price' => 8000,
            'cooperative_margin' => 2000,
            'quantity' => 2,
            'subtotal' => 20000,
        ]);

        // Alter current product in catalog to verify snapshots remain untouched
        $product->update([
            'name' => 'Brownies Premium Modifikasi',
            'base_price' => 15000,
            'cooperative_margin' => 5000,
            'selling_price' => 20000,
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders/'.$order->order_number);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->component('cooperative/orders/show')
            ->where('order.items.0.product_name', 'Kue Brownies Cokelat (Snapshot 2026)')
            ->where('order.items.0.unit_price', 10000)
            ->where('order.items.0.base_price', 8000)
            ->where('order.items.0.cooperative_margin', 2000)
            ->where('order.items.0.subtotal', 20000)
            ->where('order.items.0.quantity', 2)
            ->where('order.total', 20000)
        );
    }

    /**
     * 13. Order detail displays pickup log when completed.
     */
    public function test_13_order_detail_displays_pickup_log_when_collected(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_number' => 'KD-PICKUP-COMPLETED',
            'order_status' => OrderStatus::Completed,
            'payment_status' => PaymentStatus::Paid,
            'queue_code' => 'B-005',
            'queue_number' => 5,
        ]);

        PickupLog::create([
            'order_id' => $order->id,
            'verified_by' => $this->cooperativeUser->id,
            'verified_at' => now(),
            'method' => 'qr',
            'metadata' => ['device' => 'scanner-tablet-1'],
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders/'.$order->order_number);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('order.order_status', 'completed')
            ->where('order.pickup_log.method', 'qr')
            ->where('order.pickup_log.verified_by_name', $this->cooperativeUser->name)
        );
    }

    /**
     * 14. Customer privacy: raw secrets and hashes are never exposed.
     */
    public function test_14_customer_privacy_raw_secrets_never_exposed(): void
    {
        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'order_number' => 'KD-PRIVACY-CHECK',
            'pickup_token_hash' => hash('sha256', 'super-secret-token'),
        ]);

        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders/'.$order->order_number);

        $response->assertOk();
        // Assert pickup_token_hash and password are not exposed in props
        $props = $response->getOriginalContent()->getData()['page']['props'];
        $this->assertArrayNotHasKey('pickup_token_hash', $props['order']);
        $this->assertArrayNotHasKey('password', $props['order']['customer']);
        $this->assertArrayNotHasKey('two_factor_secret', $props['order']['customer']);
    }

    /**
     * 15. Nonexistent order returns 404.
     */
    public function test_15_nonexistent_order_returns_404(): void
    {
        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders/KD-NONEXISTENT-999');

        $response->assertNotFound();
    }

    /**
     * 16. Existing automated fulfillment and queue allocation remain untouched.
     */
    public function test_16_existing_fulfillment_and_queue_allocation_remains_authoritative(): void
    {
        $product = Product::factory()->create([
            'category_id' => $this->category->id,
            'name' => 'Biskuit Gandum',
            'base_price' => 4000,
            'cooperative_margin' => 1000,
            'selling_price' => 5000,
            'stock' => 10,
        ]);

        $order = Order::factory()->create([
            'user_id' => $this->studentUser->id,
            'pickup_session_id' => $this->pickupSession->id,
            'order_number' => 'KD-FULFILL-TEST',
            'order_status' => OrderStatus::PendingPayment,
            'payment_status' => PaymentStatus::Paid,
            'subtotal' => 10000,
            'total' => 10000,
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'product_name' => $product->name,
            'unit_price' => 5000,
            'base_price' => 4000,
            'cooperative_margin' => 1000,
            'quantity' => 2,
            'subtotal' => 10000,
        ]);

        // Fulfill through existing authoritative action
        $fulfillmentService = new PreparePaidOrderForPickup(new PickupCredentialService);
        $fulfilled = $fulfillmentService->execute($order);

        $this->assertSame(OrderStatus::ReadyForPickup, $fulfilled->order_status);
        $this->assertNotNull($fulfilled->queue_code);
        $this->assertNotNull($fulfilled->queue_number);

        // Inspect through cooperative order detail
        $response = $this->actingAs($this->cooperativeUser)
            ->get('/cooperative/orders/'.$fulfilled->order_number);

        $response->assertOk();
        $response->assertInertia(fn (Assert $page) => $page
            ->where('order.order_status', 'ready_for_pickup')
            ->where('order.queue_code', $fulfilled->queue_code)
            ->where('order.queue_number', $fulfilled->queue_number)
        );
    }
}
