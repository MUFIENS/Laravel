<?php

namespace App\Http\Controllers;

use App\Enums\ProductStatus;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class CartController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display the student's persistent shopping cart.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        assert($user instanceof User);

        $cart = $user->cart()->firstOrCreate([]);

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

            $isOutOfStock = ! $product || $product->stock <= 0;
            $isInactive = ! $product || $product->status !== ProductStatus::Active;
            $hasInsufficientStock = $product !== null && $item->quantity > $product->stock;

            if (! $isAvailable) {
                $hasUnavailableItems = true;
            }

            $lineSubtotal = $product ? (int) ($item->quantity * $product->selling_price) : 0;
            $totalQuantity += $item->quantity;

            if ($product && $product->status === ProductStatus::Active && $product->stock > 0) {
                $subtotal += $lineSubtotal;
            }

            return [
                'id' => $item->id,
                'cart_id' => $item->cart_id,
                'product_id' => $item->product_id,
                'quantity' => $item->quantity,
                'line_subtotal' => $lineSubtotal,
                'is_available' => $isAvailable,
                'is_out_of_stock' => $isOutOfStock,
                'is_inactive' => $isInactive,
                'has_insufficient_stock' => $hasInsufficientStock,
                'max_available_quantity' => $product ? $product->stock : 0,
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

        $canCheckout = $mappedItems->isNotEmpty() && ! $hasUnavailableItems;

        return Inertia::render('cart/index', [
            'cart' => [
                'id' => $cart->id,
                'items' => $mappedItems,
                'total_quantity' => $totalQuantity,
                'subtotal' => $subtotal,
                'can_checkout' => $canCheckout,
                'has_unavailable_items' => $hasUnavailableItems,
            ],
        ]);
    }

    /**
     * Add a product to the student's persistent shopping cart.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        assert($user instanceof User);

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $quantityToAdd = (int) ($validated['quantity'] ?? 1);
        $product = Product::where('id', $validated['product_id'])->firstOrFail();

        // 1. Verify product visibility & active status
        if ($product->status !== ProductStatus::Active) {
            throw ValidationException::withMessages([
                'product_id' => 'Produk tidak aktif atau tidak tersedia untuk dibeli.',
            ]);
        }

        // 2. Verify product has stock
        if ($product->stock <= 0) {
            throw ValidationException::withMessages([
                'product_id' => 'Stok produk sedang habis.',
            ]);
        }

        // 3. Resolve student's cart
        $cart = $user->cart()->firstOrCreate([]);

        // 4. Find or create cart item
        $cartItem = $cart->items()->where('product_id', $product->id)->first();
        $currentQuantity = $cartItem ? $cartItem->quantity : 0;
        $newQuantity = $currentQuantity + $quantityToAdd;

        // 5. Validate combined quantity against available stock
        if ($newQuantity > $product->stock) {
            throw ValidationException::withMessages([
                'quantity' => "Jumlah pesanan melebihi stok yang tersedia (tersisa {$product->stock} unit, di keranjang: {$currentQuantity}).",
            ]);
        }

        if ($cartItem) {
            $cartItem->update(['quantity' => $newQuantity]);
        } else {
            $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $newQuantity,
            ]);
        }

        return back()->with('success', "{$product->name} berhasil ditambahkan ke keranjang.");
    }

    /**
     * Update the quantity of a specific cart item.
     */
    public function update(Request $request, CartItem $cartItem): RedirectResponse
    {
        $this->authorize('update', $cartItem);

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $newQuantity = (int) $validated['quantity'];
        $product = $cartItem->product;

        if (! $product || $product->status !== ProductStatus::Active) {
            throw ValidationException::withMessages([
                'quantity' => 'Produk ini tidak aktif atau tidak tersedia di katalog koperasi.',
            ]);
        }

        if ($newQuantity > $product->stock) {
            throw ValidationException::withMessages([
                'quantity' => "Jumlah melebihi stok yang tersedia (tersisa {$product->stock} unit).",
            ]);
        }

        $cartItem->update(['quantity' => $newQuantity]);

        return back()->with('success', 'Jumlah barang berhasil diperbarui.');
    }

    /**
     * Remove a specific item from the shopping cart.
     */
    public function destroy(Request $request, CartItem $cartItem): RedirectResponse
    {
        $this->authorize('delete', $cartItem);

        $cartItem->delete();

        return back()->with('success', 'Barang berhasil dihapus dari keranjang.');
    }
}
