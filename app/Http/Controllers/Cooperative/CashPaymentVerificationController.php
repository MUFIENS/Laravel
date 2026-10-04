<?php

namespace App\Http\Controllers\Cooperative;

use App\Actions\ConfirmCashPayment;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PickupSession;
use App\Models\User;
use App\Services\CashPaymentService;
use DomainException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CashPaymentVerificationController extends Controller
{
    /**
     * Display the cooperative cash payment verification workspace.
     */
    public function index(Request $request, CashPaymentService $cashService): Response
    {
        $activeSessions = PickupSession::query()
            ->active()
            ->orderBy('pickup_date')
            ->orderBy('starts_at')
            ->get(['id', 'name', 'pickup_date', 'starts_at', 'ends_at', 'queue_prefix'])
            ->map(function (PickupSession $session) {
                return [
                    'id' => $session->id,
                    'name' => $session->name,
                    'pickup_date' => $session->pickup_date->toDateString(),
                    'starts_at' => substr($session->starts_at, 0, 5),
                    'ends_at' => substr($session->ends_at, 0, 5),
                    'queue_prefix' => $session->queue_prefix,
                ];
            });

        // Summary of recent cash payments verified today
        $recentPayments = Payment::query()
            ->where('provider', 'cash')
            ->where('status', PaymentStatus::Paid)
            ->whereDate('cash_received_at', now()->toDateString())
            ->with([
                'order:id,order_number,queue_code,queue_number,total,user_id,order_status',
                'order.user:id,name',
                'verifiedBy:id,name',
            ])
            ->latest('cash_received_at')
            ->limit(10)
            ->get()
            ->map(function (Payment $payment) {
                return [
                    'id' => $payment->id,
                    'order_id' => $payment->order_id,
                    'order_number' => $payment->order?->order_number,
                    'queue_code' => $payment->order?->queue_code,
                    'student_name' => $payment->order?->user?->name,
                    'gross_amount' => $payment->gross_amount,
                    'verified_at' => $payment->cash_received_at?->translatedFormat('H:i \W\I\B'),
                    'verified_by_name' => $payment->verifiedBy->name ?? 'Petugas Koperasi',
                ];
            });

        // Authoritative list of pending cash payment orders (Real DB data)
        $pendingOrders = Order::query()
            ->where('order_status', OrderStatus::PendingPayment)
            ->where('payment_status', PaymentStatus::Pending)
            ->with([
                'user:id,name,student_identifier',
                'pickupSession:id,name,pickup_date,starts_at,ends_at',
                'items:id,order_id,product_id,product_name,quantity,unit_price,subtotal',
                'payments' => function ($query) {
                    $query->where('status', PaymentStatus::Pending)->latest();
                },
            ])
            ->latest()
            ->paginate(15)
            ->through(function (Order $order) use ($cashService) {
                $payment = $order->payments->where('status', PaymentStatus::Pending)->first();
                $rawToken = $payment && $order->user_id ? $cashService->generateRawToken($order) : null;

                return [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'student_name' => $order->user->name,
                    'student_identifier' => $order->user->student_identifier,
                    'total' => $order->total,
                    'items_count' => $order->items->count(),
                    'total_quantity' => $order->items->sum('quantity'),
                    'created_at' => $order->created_at?->toIso8601String(),
                    'formatted_created_at' => $order->created_at?->translatedFormat('d M Y, H:i'),
                    'pickup_session_name' => $order->pickupSession?->name,
                    'pickup_time' => $order->pickupSession ? sprintf(
                        '%s - %s WIB',
                        substr($order->pickupSession->starts_at, 0, 5),
                        substr($order->pickupSession->ends_at, 0, 5)
                    ) : null,
                    'token' => $rawToken,
                ];
            });

        return Inertia::render('cooperative/payments/index', [
            'active_sessions' => $activeSessions,
            'recent_payments' => $recentPayments,
            'pending_orders' => $pendingOrders,
        ]);
    }

    /**
     * Look up and verify an order via scanned Cash Payment QR payload or manual token input.
     */
    public function verify(Request $request, CashPaymentService $cashService): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:500'],
            'order_number' => ['nullable', 'string', 'max:64'],
        ]);

        $rawInput = (string) $validated['token'];
        $parsed = $cashService->parsePaymentQrInput($rawInput);

        if (isset($parsed['error'])) {
            return response()->json([
                'message' => $parsed['message'] ?? 'Token pembayaran tunai tidak valid.',
                'error_type' => $parsed['error'],
            ], 422);
        }

        $orderNumber = $validated['order_number'] ?? $parsed['order_number'];
        $candidateToken = $parsed['token'];

        if (empty($candidateToken)) {
            return response()->json([
                'message' => 'Token pembayaran tunai tidak boleh kosong.',
            ], 422);
        }

        $candidateHash = $cashService->hashToken($candidateToken);

        // 1. Lookup payment by hash
        /** @var Payment|null $payment */
        $payment = Payment::query()
            ->with([
                'order.user:id,name',
                'order.pickupSession',
                'order.items.product:id,name,stock,status',
            ])
            ->where('payment_token_hash', $candidateHash)
            ->where('status', PaymentStatus::Pending)
            ->first();

        // 2. If not found by direct hash and order number is supplied, attempt order number lookup
        if (! $payment && ! empty($orderNumber)) {
            /** @var Order|null $candidateOrder */
            $candidateOrder = Order::with([
                'user:id,name',
                'pickupSession',
                'items.product:id,name,stock,status',
                'payments' => function ($query) {
                    $query->latest();
                },
            ])
                ->where('order_number', trim($orderNumber))
                ->first();

            if ($candidateOrder) {
                // If order is already paid, provide informative response
                if ($candidateOrder->isPaid()) {
                    return response()->json([
                        'message' => "Pesanan #{$candidateOrder->order_number} sudah berstatus lunas sebelumnya.",
                        'already_paid' => true,
                        'order_number' => $candidateOrder->order_number,
                        'queue_code' => $candidateOrder->queue_code,
                    ], 422);
                }

                $activePayment = $candidateOrder->payments
                    ->where('status', PaymentStatus::Pending)
                    ->whereNotNull('payment_token_hash')
                    ->first();

                if ($activePayment && $cashService->verifyToken($activePayment, $candidateToken)) {
                    $payment = $activePayment;
                }
            }
        }

        if (! $payment || ! $payment->order) {
            return response()->json([
                'message' => 'QR pembayaran tidak valid, pesanan tidak ditemukan, atau pembayaran sudah diverifikasi sebelumnya.',
            ], 404);
        }

        $order = $payment->order;

        // 3. Status checks
        if ($order->isCancelled() || $order->order_status === OrderStatus::Cancelled) {
            return response()->json([
                'message' => "Pesanan #{$order->order_number} telah dibatalkan.",
            ], 422);
        }

        if ($order->isPaid() || in_array($order->order_status, [OrderStatus::ReadyForPickup, OrderStatus::Completed], true)) {
            return response()->json([
                'message' => "Pesanan #{$order->order_number} sudah berstatus lunas sebelumnya.",
                'already_paid' => true,
                'order_number' => $order->order_number,
                'queue_code' => $order->queue_code,
            ], 422);
        }

        // 4. Stock preview check so operator can alert student if physical stock is insufficient
        $hasStockDeficit = false;
        $itemsPreview = $order->items->map(function (OrderItem $item) use (&$hasStockDeficit) {
            $product = $item->product;
            $currentStock = $product->stock ?? 0;
            $isSufficient = $currentStock >= $item->quantity;

            if (! $isSufficient) {
                $hasStockDeficit = true;
            }

            return [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'subtotal' => $item->subtotal,
                'current_stock' => $currentStock,
                'is_stock_sufficient' => $isSufficient,
            ];
        });

        return response()->json([
            'status' => 'verified',
            'order' => [
                'id' => $order->id,
                'order_number' => $order->order_number,
                'student_name' => $order->user->name,
                'subtotal' => $order->subtotal,
                'total' => $order->total,
                'order_status' => $order->order_status->value,
                'order_status_label' => $order->order_status->label(),
                'payment_status' => $order->payment_status->value,
                'payment_status_label' => $order->payment_status->label(),
                'has_stock_deficit' => $hasStockDeficit,
                'pickup_session' => $order->pickupSession ? [
                    'name' => $order->pickupSession->name,
                    'pickup_date' => $order->pickupSession->pickup_date->translatedFormat('d M Y'),
                    'formatted_time' => sprintf(
                        '%s - %s WIB',
                        substr($order->pickupSession->starts_at, 0, 5),
                        substr($order->pickupSession->ends_at, 0, 5)
                    ),
                ] : null,
                'items' => $itemsPreview,
            ],
            'token' => $candidateToken,
        ]);
    }

    /**
     * Atomically confirm receipt of physical cash and transition order to paid & ready_for_pickup.
     */
    public function confirm(Request $request, ConfirmCashPayment $confirmAction): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'integer'],
            'token' => ['required', 'string', 'max:500'],
        ]);

        $orderId = (int) $validated['order_id'];
        $token = (string) $validated['token'];

        $user = $request->user();
        assert($user instanceof User);

        try {
            $result = $confirmAction->execute($orderId, $token, $user);
            $order = $result['order'];

            return response()->json([
                'status' => 'success',
                'already_processed' => $result['already_processed'],
                'message' => $result['message'],
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'queue_code' => $order->queue_code,
                    'queue_number' => $order->queue_number,
                    'student_name' => $order->user->name,
                    'total' => $order->total,
                    'order_status' => $order->order_status->value,
                    'order_status_label' => $order->order_status->label(),
                    'pickup_session_name' => $order->pickupSession?->name,
                    'ready_at' => $order->ready_at?->translatedFormat('d M Y, H:i \W\I\B'),
                ],
            ]);
        } catch (InsufficientStockException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_type' => 'insufficient_stock',
            ], 422);
        } catch (DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_type' => 'domain_error',
            ], 422);
        }
    }
}
