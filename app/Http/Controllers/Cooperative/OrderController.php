<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PickupSession;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Inertia\Inertia;
use Inertia\Response;

class OrderController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of orders for the cooperative management workspace.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Order::class);

        $search = trim((string) $request->query('search', ''));
        $paymentStatus = $request->query('payment_status');
        $orderStatus = $request->query('order_status');
        $pickupSessionId = $request->query('pickup_session_id');
        $dateFilter = $request->query('date');

        $query = Order::query()
            ->with([
                'user:id,name,student_identifier,email',
                'pickupSession:id,name,pickup_date,starts_at,ends_at,queue_prefix,status',
                'items:id,order_id,product_name,quantity,unit_price,subtotal',
            ])
            ->latest('created_at');

        // Server-side search across order number, queue code, queue number, and customer name/NISN
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('queue_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('student_identifier', 'like', "%{$search}%");
                    });

                if (is_numeric($search)) {
                    $q->orWhere('queue_number', (int) $search);
                }
            });
        }

        // Filter by Payment Status
        if ($paymentStatus && $paymentStatus !== 'all' && PaymentStatus::tryFrom($paymentStatus)) {
            $query->where('payment_status', $paymentStatus);
        }

        // Filter by Order Status
        if ($orderStatus && $orderStatus !== 'all' && OrderStatus::tryFrom($orderStatus)) {
            $query->where('order_status', $orderStatus);
        }

        // Filter by Pickup Session
        if ($pickupSessionId && $pickupSessionId !== 'all') {
            $query->where('pickup_session_id', (int) $pickupSessionId);
        }

        // Filter by Date
        if ($dateFilter === 'today') {
            $query->whereDate('created_at', now()->toDateString());
        }

        $paginator = $query->paginate(15)->withQueryString();

        /** @var LengthAwarePaginator<int, array<string, mixed>> $orders */
        $orders = $paginator->through(function (Order $order) {
            return [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'customer' => $order->user ? [
                    'id' => $order->user->id,
                    'name' => $order->user->name,
                    'student_identifier' => $order->user->student_identifier,
                ] : null,
                'order_status' => $order->order_status->value,
                'order_status_label' => $order->order_status->label(),
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                'total' => $order->total,
                'subtotal' => $order->subtotal,
                'cooperative_margin_total' => $order->cooperative_margin_total,
                'queue_number' => $order->queue_number,
                'queue_code' => $order->queue_code,
                'items_count' => $order->items->count(),
                'total_quantity' => (int) $order->items->sum('quantity'),
                'pickup_session' => $order->pickupSession ? [
                    'id' => $order->pickupSession->id,
                    'name' => $order->pickupSession->name,
                    'pickup_date' => $order->pickupSession->pickup_date->toDateString(),
                    'formatted_time' => sprintf(
                        '%s - %s WIB',
                        substr($order->pickupSession->starts_at, 0, 5),
                        substr($order->pickupSession->ends_at, 0, 5)
                    ),
                ] : null,
                'created_at' => $order->created_at?->toIso8601String(),
                'updated_at' => $order->updated_at?->toIso8601String(),
            ];
        });

        // Real Database-Backed Stats
        $stats = [
            'total_orders' => Order::count(),
            'pending_payment' => Order::where('order_status', OrderStatus::PendingPayment)->count(),
            'ready_for_pickup' => Order::where('order_status', OrderStatus::ReadyForPickup)->count(),
            'completed' => Order::where('order_status', OrderStatus::Completed)->count(),
            'total_paid_revenue' => (int) Order::where('payment_status', PaymentStatus::Paid)->sum('total'),
        ];

        $pickupSessions = PickupSession::query()
            ->orderBy('pickup_date', 'desc')
            ->orderBy('starts_at', 'asc')
            ->limit(20)
            ->get(['id', 'name', 'pickup_date', 'starts_at', 'ends_at'])
            ->map(fn (PickupSession $session) => [
                'id' => $session->id,
                'name' => $session->name,
                'pickup_date' => $session->pickup_date->toDateString(),
                'formatted_time' => sprintf(
                    '%s - %s WIB',
                    substr($session->starts_at, 0, 5),
                    substr($session->ends_at, 0, 5)
                ),
            ]);

        return Inertia::render('cooperative/orders/index', [
            'orders' => $orders,
            'stats' => $stats,
            'pickup_sessions' => $pickupSessions,
            'filters' => [
                'search' => $search,
                'payment_status' => $paymentStatus ?? 'all',
                'order_status' => $orderStatus ?? 'all',
                'pickup_session_id' => $pickupSessionId ?? 'all',
                'date' => $dateFilter ?? 'all',
            ],
            'activeNav' => 'orders',
        ]);
    }

    /**
     * Display the specified order detail for the cooperative workspace.
     */
    public function show(Request $request, Order $order): Response
    {
        $this->authorize('view', $order);

        $order->load([
            'user:id,name,student_identifier,email',
            'pickupSession',
            'pickupLog.verifiedBy:id,name',
            'items' => fn ($q) => $q->orderBy('id', 'asc'),
            'items.seller:id,name,student_identifier',
            'items.product:id,name,slug,image_path',
            'latestPayment',
            'payments' => fn ($q) => $q->latest(),
        ]);

        /** @var Payment|null $latestPayment */
        $latestPayment = $order->latestPayment;

        $orderData = [
            'id' => $order->id,
            'order_number' => $order->order_number,
            'customer' => $order->user ? [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'student_identifier' => $order->user->student_identifier,
                'email' => $order->user->email,
            ] : null,
            'order_status' => $order->order_status->value,
            'order_status_label' => $order->order_status->label(),
            'payment_status' => $order->payment_status->value,
            'payment_status_label' => $order->payment_status->label(),
            'queue_number' => $order->queue_number,
            'queue_code' => $order->queue_code,
            'subtotal' => $order->subtotal,
            'cooperative_margin_total' => $order->cooperative_margin_total,
            'total' => $order->total,
            'paid_at' => $order->paid_at?->toIso8601String(),
            'ready_at' => $order->ready_at?->toIso8601String(),
            'completed_at' => $order->completed_at?->toIso8601String(),
            'cancelled_at' => $order->cancelled_at?->toIso8601String(),
            'created_at' => $order->created_at?->toIso8601String(),
            'updated_at' => $order->updated_at?->toIso8601String(),
            'pickup_session' => $order->pickupSession ? [
                'id' => $order->pickupSession->id,
                'name' => $order->pickupSession->name,
                'pickup_date' => $order->pickupSession->pickup_date->toDateString(),
                'starts_at' => substr($order->pickupSession->starts_at, 0, 5),
                'ends_at' => substr($order->pickupSession->ends_at, 0, 5),
                'queue_prefix' => $order->pickupSession->queue_prefix,
                'status' => $order->pickupSession->status->value,
                'status_label' => $order->pickupSession->status->label(),
                'formatted_time' => sprintf(
                    '%s - %s WIB',
                    substr($order->pickupSession->starts_at, 0, 5),
                    substr($order->pickupSession->ends_at, 0, 5)
                ),
            ] : null,
            'pickup_log' => $order->pickupLog ? [
                'id' => $order->pickupLog->id,
                'verified_at' => $order->pickupLog->verified_at->toIso8601String(),
                'verified_by_name' => $order->pickupLog->verifiedBy ? $order->pickupLog->verifiedBy->name : 'Operator Koperasi',
                'method' => $order->pickupLog->method,
                'metadata' => $order->pickupLog->metadata,
            ] : null,
            // Historical line items derived strictly from immutable snapshots
            'items' => $order->items->map(function (OrderItem $item) {
                return [
                    'id' => $item->id,
                    'order_id' => $item->order_id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product_name,
                    'unit_price' => $item->unit_price,
                    'base_price' => $item->base_price,
                    'cooperative_margin' => $item->cooperative_margin,
                    'quantity' => $item->quantity,
                    'subtotal' => $item->subtotal,
                    'seller' => $item->seller ? [
                        'id' => $item->seller->id,
                        'name' => $item->seller->name,
                        'student_identifier' => $item->seller->student_identifier,
                    ] : null,
                    'product' => $item->product ? [
                        'id' => $item->product->id,
                        'name' => $item->product->name,
                        'slug' => $item->product->slug,
                        'image_path' => $item->product->image_path,
                    ] : null,
                ];
            }),
            'payment' => $latestPayment ? [
                'id' => $latestPayment->id,
                'provider' => $latestPayment->provider,
                'provider_transaction_id' => $latestPayment->provider_transaction_id,
                'provider_order_id' => $latestPayment->provider_order_id,
                'payment_type' => $latestPayment->payment_type,
                'gross_amount' => $latestPayment->gross_amount,
                'status' => $latestPayment->status->value,
                'status_label' => $latestPayment->status->label(),
                'paid_at' => $latestPayment->paid_at?->toIso8601String(),
                'created_at' => $latestPayment->created_at?->toIso8601String(),
            ] : null,
        ];

        return Inertia::render('cooperative/orders/show', [
            'order' => $orderData,
            'activeNav' => 'orders',
        ]);
    }
}
