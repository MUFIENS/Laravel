<?php

namespace App\Models;

use Database\Factories\CartFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable(['user_id'])]
class Cart extends Model
{
    /** @use HasFactory<CartFactory> */
    use HasFactory;

    /**
     * Student who owns this shopping cart.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Line items in this cart.
     *
     * @return HasMany<CartItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Total quantity of items in the cart.
     */
    public function totalQuantity(): int
    {
        return (int) $this->items()->sum('quantity');
    }

    /**
     * Calculate cart subtotal based on current product selling prices.
     */
    public function subtotal(): int
    {
        return (int) $this->items()
            ->with('product')
            ->get()
            ->sum(fn (CartItem $item) => $item->subtotal());
    }
}
