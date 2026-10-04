<?php

namespace App\Http\Controllers;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\MidtransService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    use AuthorizesRequests;

    /**
     * Initialize or retrieve a Midtrans Snap transaction for an eligible order.
     */
    public function store(Request $request, Order $order, MidtransService $midtrans): JsonResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        // 1. Authorize ownership of order
        $this->authorize('view', $order);

        if ($user->id !== $order->user_id) {
            return response()->json([
                'message' => 'Anda tidak memiliki akses ke pesanan ini.',
            ], 403);
        }

        // 2. Verify order is in payable state
        if ($order->isPaid() || $order->payment_status === PaymentStatus::Paid) {
            return response()->json([
                'message' => 'Pesanan ini sudah lunas.',
            ], 422);
        }

        if ($order->isCancelled() || $order->order_status === OrderStatus::Cancelled) {
            return response()->json([
                'message' => 'Pesanan yang telah dibatalkan tidak dapat dibayar.',
            ], 422);
        }

        if ($order->order_status !== OrderStatus::PendingPayment) {
            return response()->json([
                'message' => 'Status pesanan saat ini tidak memungkinkan pembayaran.',
            ], 422);
        }

        $order->load(['items', 'user']);

        // 3. Reuse existing pending payment token if present and recent
        $existingPayment = Payment::where('order_id', $order->id)
            ->where('status', PaymentStatus::Pending)
            ->whereNotNull('payment_token')
            ->latest()
            ->first();

        if ($existingPayment && $existingPayment->payment_token) {
            return response()->json([
                'snap_token' => $existingPayment->payment_token,
                'client_key' => $midtrans->getClientKey(),
                'snap_js_url' => $midtrans->getSnapJsUrl(),
                'provider_order_id' => $existingPayment->provider_order_id,
            ]);
        }

        // 4. Generate deterministic transaction identity
        $attemptCount = Payment::where('order_id', $order->id)->count();
        $providerOrderId = $attemptCount === 0
            ? $order->order_number
            : sprintf('%s-R%d', $order->order_number, $attemptCount + 1);

        // 5. Request Snap transaction from Midtrans Sandbox
        $snapData = $midtrans->createSnapTransaction($order, $providerOrderId);

        // 6. Persist Payment record
        $payment = Payment::create([
            'order_id' => $order->id,
            'provider' => 'midtrans',
            'provider_order_id' => $providerOrderId,
            'payment_token' => $snapData['token'],
            'status' => PaymentStatus::Pending,
            'gross_amount' => $order->total,
        ]);

        return response()->json([
            'snap_token' => $snapData['token'],
            'redirect_url' => $snapData['redirect_url'],
            'client_key' => $snapData['client_key'],
            'snap_js_url' => $snapData['snap_js_url'],
            'provider_order_id' => $payment->provider_order_id,
        ]);
    }
}
