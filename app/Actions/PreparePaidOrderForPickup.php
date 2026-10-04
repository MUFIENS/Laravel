<?php

namespace App\Actions;

use App\Enums\InventoryMovementType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\InsufficientStockException;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\PickupSession;
use App\Models\Product;
use App\Services\PickupCredentialService;
use DomainException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PreparePaidOrderForPickup
{
    public function __construct(
        protected PickupCredentialService $credentialService,
    ) {}

    /**
     * Atomically fulfill a paid order: allocate queue, finalize physical stock,
     * record inventory sale movements, and transition to ready_for_pickup.
     *
     * Strict Idempotency: Safe to call repeatedly without duplicate effects.
     *
     * @throws DomainException
     * @throws InsufficientStockException
     */
    public function execute(Order $order): Order
    {
        return DB::transaction(function () use ($order) {
            // 1. Acquire exclusive row lock on the order
            /** @var Order|null $lockedOrder */
            $lockedOrder = Order::where('id', $order->id)->lockForUpdate()->first();

            if (! $lockedOrder) {
                throw new DomainException("Pesanan dengan ID {$order->id} tidak ditemukan.");
            }

            // 2. Strict Payment Gate: Only confirmed paid orders may enter fulfillment
            if ($lockedOrder->payment_status !== PaymentStatus::Paid) {
                throw new DomainException(
                    "Hanya pesanan yang berstatus lunas (paid) yang dapat diproses fulfillment. Status saat ini: {$lockedOrder->payment_status->value}."
                );
            }

            // 3. Strict Idempotency: If already fulfilled or completed, return safely without re-processing
            if (in_array($lockedOrder->order_status, [OrderStatus::ReadyForPickup, OrderStatus::Completed], true)) {
                Log::info('Fulfillment skipped: order is already fulfilled or completed', [
                    'order_id' => $lockedOrder->id,
                    'order_number' => $lockedOrder->order_number,
                    'order_status' => $lockedOrder->order_status->value,
                ]);

                return $lockedOrder;
            }

            // 4. Resolve and lock PickupSession to serialize queue allocation
            if (! $lockedOrder->pickup_session_id) {
                throw new DomainException("Pesanan #{$lockedOrder->order_number} tidak memiliki sesi pengambilan yang valid.");
            }

            /** @var PickupSession|null $pickupSession */
            $pickupSession = PickupSession::where('id', $lockedOrder->pickup_session_id)->lockForUpdate()->first();

            if (! $pickupSession) {
                throw new DomainException("Sesi pengambilan ID {$lockedOrder->pickup_session_id} tidak ditemukan.");
            }

            // Allocate sequential queue number scoped to this pickup session
            $queueNumber = $pickupSession->getNextQueueNumber();
            $queueCode = $pickupSession->formatQueueCode($queueNumber);

            // 5. Stock Finalization & Concurrency Control
            // Sort items by product_id ascending to ensure deterministic lock acquisition and eliminate deadlocks
            $orderItems = $lockedOrder->items()->orderBy('product_id')->get();

            // First pass: Verify all product stocks while holding row-level locks
            /** @var array<int, Product> $lockedProducts */
            $lockedProducts = [];

            foreach ($orderItems as $item) {
                if ($item->product_id === null) {
                    continue;
                }

                if (! isset($lockedProducts[$item->product_id])) {
                    /** @var Product|null $product */
                    $product = Product::where('id', $item->product_id)->lockForUpdate()->first();

                    if (! $product) {
                        throw new DomainException("Produk ID {$item->product_id} tidak ditemukan di database.");
                    }

                    $lockedProducts[$item->product_id] = $product;
                }

                $product = $lockedProducts[$item->product_id];

                if ($product->stock < $item->quantity) {
                    Log::error('Fulfillment aborted: insufficient physical stock', [
                        'order_id' => $lockedOrder->id,
                        'order_number' => $lockedOrder->order_number,
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'available_stock' => $product->stock,
                        'required_quantity' => $item->quantity,
                    ]);

                    throw new InsufficientStockException(
                        "Stok tidak mencukupi untuk produk '{$product->name}'. Tersedia: {$product->stock}, Dibutuhkan: {$item->quantity}."
                    );
                }
            }

            // Second pass: Atomically decrement stock and record inventory movement audit ledger
            foreach ($orderItems as $item) {
                if ($item->product_id === null) {
                    continue;
                }

                $product = $lockedProducts[$item->product_id];

                // Decrement stock
                $product->decrement('stock', $item->quantity);

                // Create inventory movement record with signed negative quantity
                InventoryMovement::create([
                    'product_id' => $product->id,
                    'type' => InventoryMovementType::Sale,
                    'quantity' => -$item->quantity,
                    'reference_type' => Order::class,
                    'reference_id' => $lockedOrder->id,
                    'reason' => "Penjualan pesanan #{$lockedOrder->order_number}",
                    'created_by' => $lockedOrder->user_id,
                ]);
            }

            // 6. Generate unguessable server-derived pickup credential and store only its SHA-256 hash
            $rawCredential = $this->credentialService->generateRawCredential($lockedOrder);
            $tokenHash = $this->credentialService->hashCredential($rawCredential);

            // 7. Atomic state transition: order becomes ready_for_pickup
            $now = now();
            $lockedOrder->update([
                'order_status' => OrderStatus::ReadyForPickup,
                'queue_number' => $queueNumber,
                'queue_code' => $queueCode,
                'pickup_token_hash' => $tokenHash,
                'ready_at' => $now,
            ]);

            Log::info('Order successfully fulfilled and ready for pickup', [
                'order_id' => $lockedOrder->id,
                'order_number' => $lockedOrder->order_number,
                'queue_number' => $queueNumber,
                'queue_code' => $queueCode,
            ]);

            return $lockedOrder->fresh(['pickupSession', 'items', 'user']);
        });
    }
}
