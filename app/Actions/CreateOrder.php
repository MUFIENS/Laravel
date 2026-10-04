<?php

namespace App\Actions;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Models\Cart;
use App\Models\Order;
use App\Models\PickupSession;
use App\Models\User;
use App\Services\CashPaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateOrder
{
    public function __construct(
        protected CashPaymentService $cashPaymentService,
    ) {}

    /**
     * Execute atomic order creation from the student's active shopping cart.
     *
     * @throws ValidationException
     */
    public function execute(User $user, PickupSession $pickupSession): Order
    {
        return DB::transaction(function () use ($user, $pickupSession) {
            // 1. Lock student cart for update to prevent concurrent duplicate processing
            $cart = Cart::where('user_id', $user->id)->lockForUpdate()->first();

            if (! $cart) {
                throw ValidationException::withMessages([
                    'cart' => 'Keranjang belanja tidak ditemukan.',
                ]);
            }

            // 2. Load cart items with fresh product data
            $cartItems = $cart->items()->with('product')->get();

            if ($cartItems->isEmpty()) {
                throw ValidationException::withMessages([
                    'cart' => 'Keranjang belanja Anda kosong. Silakan pilih produk terlebih dahulu.',
                ]);
            }

            $subtotal = 0;
            $cooperativeMarginTotal = 0;
            $orderItemsData = [];

            // 3. Strictly validate every product state and recalculate authoritative prices
            foreach ($cartItems as $item) {
                $product = $item->product;

                if (! $product) {
                    throw ValidationException::withMessages([
                        'cart' => 'Terdapat produk di keranjang yang sudah tidak ada di sistem.',
                    ]);
                }

                if ($product->status !== ProductStatus::Active) {
                    throw ValidationException::withMessages([
                        'cart' => "Produk \"{$product->name}\" saat ini tidak aktif atau tidak tersedia untuk dibeli.",
                    ]);
                }

                if ($product->stock <= 0) {
                    throw ValidationException::withMessages([
                        'cart' => "Stok produk \"{$product->name}\" habis terjual.",
                    ]);
                }

                if ($item->quantity < 1) {
                    throw ValidationException::withMessages([
                        'cart' => "Jumlah produk \"{$product->name}\" tidak valid.",
                    ]);
                }

                if ($item->quantity > $product->stock) {
                    throw ValidationException::withMessages([
                        'cart' => "Stok produk \"{$product->name}\" tidak mencukupi (tersisa {$product->stock} unit, diminta {$item->quantity} unit).",
                    ]);
                }

                $unitPrice = (int) $product->selling_price;
                $basePrice = (int) $product->base_price;
                $cooperativeMargin = (int) $product->cooperative_margin;
                $itemSubtotal = $unitPrice * $item->quantity;

                $subtotal += $itemSubtotal;
                $cooperativeMarginTotal += ($cooperativeMargin * $item->quantity);

                $orderItemsData[] = [
                    'product_id' => $product->id,
                    'seller_id' => $product->owner_id,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'base_price' => $basePrice,
                    'cooperative_margin' => $cooperativeMargin,
                    'quantity' => $item->quantity,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $total = $subtotal;

            // 4. Generate unique order number: KD-YYYYMMDD-XXXXXX
            $orderNumber = $this->generateUniqueOrderNumber();

            // 5. Create Order with initial pending statuses
            $order = Order::create([
                'user_id' => $user->id,
                'pickup_session_id' => $pickupSession->id,
                'order_number' => $orderNumber,
                'queue_number' => null,
                'queue_code' => null,
                'subtotal' => $subtotal,
                'cooperative_margin_total' => $cooperativeMarginTotal,
                'total' => $total,
                'payment_status' => PaymentStatus::Pending,
                'order_status' => OrderStatus::PendingPayment,
                'pickup_token_hash' => null,
            ]);

            // 6. Create immutable order item snapshots
            foreach ($orderItemsData as $itemData) {
                $order->items()->create($itemData);
            }

            // 7. Create initial cash payment record with one-time verification token
            $rawToken = $this->cashPaymentService->generateRawToken($order);
            $tokenHash = $this->cashPaymentService->hashToken($rawToken);

            $order->payments()->create([
                'provider' => 'cash',
                'provider_order_id' => $order->order_number,
                'payment_type' => 'cash',
                'payment_token_hash' => $tokenHash,
                'status' => PaymentStatus::Pending,
                'gross_amount' => $order->total,
            ]);

            // 8. Clear student's cart items
            $cart->items()->delete();

            return $order;
        });
    }

    /**
     * Generate a unique order number conforming to KOPDIG specifications.
     */
    protected function generateUniqueOrderNumber(): string
    {
        do {
            $candidate = sprintf('KD-%s-%s', date('Ymd'), strtoupper(Str::random(6)));
        } while (Order::where('order_number', $candidate)->exists());

        return $candidate;
    }
}
