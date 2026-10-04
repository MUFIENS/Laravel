<?php

namespace App\Http\Controllers;

use App\Actions\CreateOrder;
use App\Enums\PickupSessionStatus;
use App\Enums\ProductStatus;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\PickupSession;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CheckoutController extends Controller
{
    /**
     * Display the checkout review experience.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $cart = $user->cart;

        if (! $cart || $cart->items()->count() === 0) {
            return redirect()->route('cart.index')->with('error', 'Keranjang belanja Anda kosong.');
        }

        $cart->load([
            'items' => function ($query) {
                $query->orderBy('created_at', 'asc');
            },
            'items.product' => function ($query) {
                $query->select([
                    'id',
                    'category_id',
                    'owner_id',
                    'name',
                    'slug',
                    'description',
                    'image_path',
                    'source_type',
                    'selling_price',
                    'stock',
                    'status',
                ]);
            },
            'items.product.category:id,name,slug',
            'items.product.owner:id,name',
        ]);

        $totalQuantity = 0;
        $subtotal = 0;
        $hasUnavailableItems = false;

        $mappedItems = $cart->items->map(function (CartItem $item) use (&$totalQuantity, &$subtotal, &$hasUnavailableItems) {
            $product = $item->product;

            $isAvailable = $product !== null
                && $product->status === ProductStatus::Active
                && $product->stock > 0
                && $item->quantity <= $product->stock;

            if (! $isAvailable) {
                $hasUnavailableItems = true;
            }

            $lineSubtotal = $product ? (int) ($item->quantity * $product->selling_price) : 0;
            $totalQuantity += $item->quantity;
            $subtotal += $lineSubtotal;

            return [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'line_subtotal' => $lineSubtotal,
                'is_available' => $isAvailable,
                'product' => $product ? [
                    'id' => $product->id,
                    'name' => $product->name,
                    'slug' => $product->slug,
                    'image_path' => $product->image_path,
                    'selling_price' => $product->selling_price,
                    'stock' => $product->stock,
                    'status' => $product->status->value,
                    'source_type' => $product->source_type->value,
                    'category' => $product->category ? [
                        'id' => $product->category->id,
                        'name' => $product->category->name,
                        'slug' => $product->category->slug,
                    ] : null,
                    'owner' => $product->owner ? [
                        'id' => $product->owner->id,
                        'name' => $product->owner->name,
                    ] : null,
                ] : null,
            ];
        });

        // Guard against stale cart with unavailable items
        if ($hasUnavailableItems) {
            return redirect()->route('cart.index')->with(
                'error',
                'Terdapat produk di keranjang Anda yang stoknya tidak mencukupi atau tidak aktif. Mohon periksa kembali.'
            );
        }

        // Fetch eligible pickup sessions from database
        $pickupSessions = PickupSession::query()
            ->whereIn('status', [PickupSessionStatus::Active, PickupSessionStatus::Scheduled])
            ->orderBy('pickup_date')
            ->orderBy('starts_at')
            ->get()
            ->map(fn (PickupSession $session) => [
                'id' => $session->id,
                'name' => $session->name,
                'pickup_date' => $session->pickup_date->toDateString(),
                'starts_at' => substr($session->starts_at, 0, 5),
                'ends_at' => substr($session->ends_at, 0, 5),
                'queue_prefix' => $session->queue_prefix,
                'status' => $session->status->value,
                'status_label' => $session->status->label(),
                'formatted_time' => sprintf('%s - %s WIB', substr($session->starts_at, 0, 5), substr($session->ends_at, 0, 5)),
                'formatted_date' => $session->pickup_date->translatedFormat('l, d F Y'),
            ]);

        return Inertia::render('checkout/index', [
            'cart' => [
                'id' => $cart->id,
                'items' => $mappedItems,
                'total_quantity' => $totalQuantity,
                'subtotal' => $subtotal,
                'total' => $subtotal,
            ],
            'pickupSessions' => $pickupSessions,
        ]);
    }

    /**
     * Convert the student's active shopping cart into an order.
     */
    public function store(Request $request, CreateOrder $createOrder): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $validated = $request->validate([
            'pickup_session_id' => [
                'required',
                'integer',
                Rule::exists('pickup_sessions', 'id')->where(function ($query) {
                    $query->whereIn('status', [
                        PickupSessionStatus::Active->value,
                        PickupSessionStatus::Scheduled->value,
                    ]);
                }),
            ],
        ]);

        // Server-side double submission and race condition protection
        $lock = Cache::lock("checkout_user_{$user->id}", 5);

        if (! $lock->get()) {
            $recentOrder = Order::where('user_id', $user->id)
                ->where('created_at', '>=', now()->subSeconds(10))
                ->latest()
                ->first();

            if ($recentOrder) {
                return redirect()->route('orders.show', $recentOrder)
                    ->with('info', 'Pesanan Anda sudah berhasil dibuat.');
            }

            throw ValidationException::withMessages([
                'checkout' => 'Proses checkout sedang berlangsung. Mohon tunggu sejenak.',
            ]);
        }

        try {
            $cart = $user->cart;

            if (! $cart || $cart->items()->count() === 0) {
                $recentOrder = Order::where('user_id', $user->id)
                    ->where('created_at', '>=', now()->subSeconds(10))
                    ->latest()
                    ->first();

                if ($recentOrder) {
                    return redirect()->route('orders.show', $recentOrder)
                        ->with('info', 'Pesanan Anda sudah berhasil dibuat.');
                }

                throw ValidationException::withMessages([
                    'cart' => 'Keranjang belanja Anda kosong.',
                ]);
            }

            $pickupSession = PickupSession::where('id', $validated['pickup_session_id'])->firstOrFail();

            $order = $createOrder->execute($user, $pickupSession);

            return redirect()->route('orders.show', $order)
                ->with('success', 'Pesanan berhasil dibuat. Silakan lakukan pembayaran.');
        } finally {
            $lock->release();
        }
    }
}
