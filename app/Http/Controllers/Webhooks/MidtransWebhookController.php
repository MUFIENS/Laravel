<?php

namespace App\Http\Controllers\Webhooks;

use App\Actions\PreparePaidOrderForPickup;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Services\MidtransService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class MidtransWebhookController extends Controller
{
    /**
     * Handle incoming Midtrans HTTP notifications/webhooks.
     */
    public function handle(Request $request, MidtransService $midtrans): JsonResponse
    {
        $payload = $request->all();

        $orderId = (string) ($payload['order_id'] ?? '');
        $statusCode = (string) ($payload['status_code'] ?? '');
        $grossAmount = (string) ($payload['gross_amount'] ?? '');
        $signatureKey = (string) ($payload['signature_key'] ?? '');
        $transactionStatus = (string) ($payload['transaction_status'] ?? '');
        $transactionId = isset($payload['transaction_id']) ? (string) $payload['transaction_id'] : null;
        $paymentType = isset($payload['payment_type']) ? (string) $payload['payment_type'] : null;
        $fraudStatus = (string) ($payload['fraud_status'] ?? 'accept');

        // 1. Verify official Midtrans signature
        if (empty($signatureKey) || ! $midtrans->verifySignature($orderId, $statusCode, $grossAmount, $signatureKey)) {
            Log::warning('Midtrans webhook rejected: invalid signature key', [
                'order_id' => $orderId,
                'status_code' => $statusCode,
            ]);

            return response()->json(['message' => 'Invalid signature key'], 403);
        }

        // 2. Resolve base KOPDIG order number (handles retries with -R suffix)
        $baseOrderNumber = explode('-R', $orderId)[0];

        return DB::transaction(function () use (
            $baseOrderNumber,
            $orderId,
            $grossAmount,
            $transactionStatus,
            $fraudStatus,
            $transactionId,
            $paymentType,
            $signatureKey
        ) {
            $order = Order::where('order_number', $baseOrderNumber)->lockForUpdate()->first();

            if (! $order) {
                Log::warning('Midtrans webhook rejected: order not found', [
                    'order_number' => $baseOrderNumber,
                    'provider_order_id' => $orderId,
                ]);

                return response()->json(['message' => 'Order not found'], 404);
            }

            // 3. Strict financial amount verification
            $receivedAmount = (int) round((float) $grossAmount);
            if ($receivedAmount !== (int) $order->total) {
                Log::error('Midtrans webhook rejected: gross amount mismatch', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'expected' => $order->total,
                    'received' => $receivedAmount,
                ]);

                return response()->json(['message' => 'Gross amount mismatch'], 400);
            }

            // 4. Locate or create corresponding Payment record
            $payment = Payment::where('order_id', $order->id)
                ->where('provider_order_id', $orderId)
                ->lockForUpdate()
                ->first();

            if (! $payment) {
                $payment = Payment::where('order_id', $order->id)
                    ->lockForUpdate()
                    ->latest()
                    ->first();

                if (! $payment) {
                    $payment = Payment::create([
                        'order_id' => $order->id,
                        'provider' => 'midtrans',
                        'provider_order_id' => $orderId,
                        'status' => PaymentStatus::Pending,
                        'gross_amount' => $order->total,
                    ]);
                }
            }

            // 5. Idempotency safeguard: if already paid, return 200 without re-processing
            if ($order->isPaid() && in_array($transactionStatus, ['settlement', 'capture'], true)) {
                return response()->json([
                    'status' => 'already_processed',
                    'message' => 'Order is already marked as paid.',
                ], 200);
            }

            // 6. Map Midtrans transaction state to KOPDIG enums
            $mapping = match ($transactionStatus) {
                'capture' => $fraudStatus === 'challenge'
                    ? [PaymentStatus::Pending, OrderStatus::PendingPayment]
                    : [PaymentStatus::Paid, OrderStatus::Paid],
                'settlement' => [PaymentStatus::Paid, OrderStatus::Paid],
                'pending' => [PaymentStatus::Pending, OrderStatus::PendingPayment],
                'deny', 'cancel' => [PaymentStatus::Cancelled, OrderStatus::Cancelled],
                'expire' => [PaymentStatus::Expired, OrderStatus::Cancelled],
                default => null,
            };

            if ($mapping === null) {
                return response()->json([
                    'status' => 'ignored',
                    'message' => 'Unsupported or unhandled transaction status.',
                ], 200);
            }

            [$newPaymentStatus, $newOrderStatus] = $mapping;

            // 7. Atomic state mutation
            if ($newPaymentStatus === PaymentStatus::Paid) {
                $now = now();

                $payment->update([
                    'status' => PaymentStatus::Paid,
                    'provider_transaction_id' => $transactionId ?? $payment->provider_transaction_id,
                    'payment_type' => $paymentType ?? $payment->payment_type,
                    'raw_notification_reference' => $signatureKey,
                    'paid_at' => $now,
                ]);

                // Order moves to Paid
                $order->update([
                    'payment_status' => PaymentStatus::Paid,
                    'order_status' => OrderStatus::Paid,
                    'paid_at' => $now,
                ]);

                // Phase 10: Explicit atomic handoff into paid-order fulfillment
                app(PreparePaidOrderForPickup::class)->execute($order);
            } elseif (in_array($newPaymentStatus, [PaymentStatus::Cancelled, PaymentStatus::Expired], true)) {
                $payment->update([
                    'status' => $newPaymentStatus,
                    'provider_transaction_id' => $transactionId ?? $payment->provider_transaction_id,
                    'payment_type' => $paymentType ?? $payment->payment_type,
                    'raw_notification_reference' => $signatureKey,
                ]);

                $order->update([
                    'payment_status' => $newPaymentStatus,
                    'order_status' => $newOrderStatus,
                    'cancelled_at' => now(),
                ]);
            } else {
                $payment->update([
                    'provider_transaction_id' => $transactionId ?? $payment->provider_transaction_id,
                    'payment_type' => $paymentType ?? $payment->payment_type,
                ]);
            }

            Log::info('Midtrans notification processed successfully', [
                'order_id' => $order->id,
                'order_number' => $order->order_number,
                'transaction_status' => $transactionStatus,
                'payment_status' => $newPaymentStatus->value,
                'order_status' => $newOrderStatus->value,
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Notification processed successfully',
            ], 200);
        });
    }
}
