<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use App\Services\CashPaymentService;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ConfirmCashPayment
{
    public function __construct(
        protected CashPaymentService $cashPaymentService,
        protected PreparePaidOrderForPickup $preparePaidOrderForPickup,
    ) {}

    /**
     * Atomically verify cash payment received at cooperative, mark payment as paid,
     * consume verification token, and invoke authoritative fulfillment.
     *
     * Strict Idempotency & Concurrency:
     * - Uses row-level locks on Order and Payment records.
     * - If already paid, returns safely without duplicate mutations.
     * - If stock is insufficient, rolls back everything and throws InsufficientStockException.
     *
     * @return array{already_processed: bool, order: Order, message: string}
     *
     * @throws DomainException
     * @throws InsufficientStockException
     */
    public function execute(int $orderId, string $candidateToken, User $operator): array
    {
        return DB::transaction(function () use ($orderId, $candidateToken, $operator) {
            // 1. Acquire exclusive lock on the order
            /** @var Order|null $order */
            $order = Order::where('id', $orderId)->lockForUpdate()->first();

            if (! $order) {
                throw new DomainException("Pesanan dengan ID {$orderId} tidak ditemukan.");
            }

            // 2. Strict Idempotency Check: if already paid or fulfilled, return safely
            if ($order->isPaid() || in_array($order->order_status, [OrderStatus::ReadyForPickup, OrderStatus::Completed], true)) {
                Log::info('Cash payment verification skipped: order already paid/fulfilled', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'order_status' => $order->order_status->value,
                    'payment_status' => $order->payment_status->value,
                ]);

                return [
                    'already_processed' => true,
                    'order' => $order->fresh(['pickupSession', 'items', 'user']),
                    'message' => "Pembayaran pesanan #{$order->order_number} sudah diverifikasi sebelumnya.",
                ];
            }

            // 3. Status Gate: order must be pending payment
            if ($order->isCancelled() || $order->order_status === OrderStatus::Cancelled) {
                throw new DomainException("Pesanan #{$order->order_number} telah dibatalkan dan tidak dapat diverifikasi.");
            }

            if ($order->order_status !== OrderStatus::PendingPayment || $order->payment_status !== PaymentStatus::Pending) {
                throw new DomainException(
                    "Status pesanan tidak valid untuk verifikasi pembayaran. Status saat ini: {$order->order_status->label()}."
                );
            }

            // 4. Locate and lock active pending payment record
            /** @var Payment|null $payment */
            $payment = Payment::where('order_id', $order->id)
                ->where('status', PaymentStatus::Pending)
                ->whereNotNull('payment_token_hash')
                ->lockForUpdate()
                ->latest()
                ->first();

            if (! $payment) {
                throw new DomainException("Data pembayaran menunggu verifikasi untuk pesanan #{$order->order_number} tidak ditemukan.");
            }

            // 5. Cryptographic Token Verification
            if (! $this->cashPaymentService->verifyToken($payment, $candidateToken)) {
                Log::warning('Cash payment verification rejected: invalid token', [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'operator_id' => $operator->id,
                ]);

                throw new DomainException("Token pembayaran QR tidak valid atau sudah kedaluwarsa untuk pesanan #{$order->order_number}.");
            }

            $now = now();

            // 6. Atomically update payment to Paid, consume token, record operator and timestamp
            $payment->update([
                'provider' => 'cash',
                'payment_type' => 'cash',
                'status' => PaymentStatus::Paid,
                'paid_at' => $now,
                'cash_received_at' => $now,
                'verified_by' => $operator->id,
                'payment_token_hash' => null, // One-time token consumed!
            ]);

            // 7. Transition order to Paid status so fulfillment can proceed
            $order->update([
                'payment_status' => PaymentStatus::Paid,
                'order_status' => OrderStatus::Paid,
                'paid_at' => $now,
            ]);

            // 8. Authoritative fulfillment handoff (Phase 10):
            // - Locks products and checks stock availability
            // - Decrements stock
            // - Creates sale inventory movements
            // - Allocates sequential queue number for pickup session
            // - Generates pickup credential and hashes to pickup_token_hash
            // - Sets order_status = ReadyForPickup
            // If stock is insufficient, InsufficientStockException is thrown, rolling back everything!
            $fulfilledOrder = $this->preparePaidOrderForPickup->execute($order);

            Log::info('Cash payment verified and fulfilled successfully', [
                'order_id' => $fulfilledOrder->id,
                'order_number' => $fulfilledOrder->order_number,
                'operator_id' => $operator->id,
                'queue_code' => $fulfilledOrder->queue_code,
            ]);

            return [
                'already_processed' => false,
                'order' => $fulfilledOrder,
                'message' => "Pembayaran pesanan #{$fulfilledOrder->order_number} berhasil diverifikasi. Pesanan siap diambil.",
            ];
        });
    }
}
