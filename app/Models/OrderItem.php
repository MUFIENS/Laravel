<?php

namespace App\Models;

use Database\Factories\OrderItemFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property int|null $product_id
 * @property int|null $seller_id
 * @property string $product_name
 * @property int $unit_price
 * @property int $base_price
 * @property int $cooperative_margin
 * @property int $quantity
 * @property int $subtotal
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'order_id',
    'product_id',
    'seller_id',
    'product_name',
    'unit_price',
    'base_price',
    'cooperative_margin',
    'quantity',
    'subtotal',
])]
class OrderItem extends Model
{
    /** @use HasFactory<OrderItemFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'unit_price' => 'integer',
            'base_price' => 'integer',
            'cooperative_margin' => 'integer',
            'quantity' => 'integer',
            'subtotal' => 'integer',
        ];
    }

    /**
     * Order this line item belongs to.
     *
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * The product snapshot source.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * The student owner if this was a consigned product.
     *
     * @return BelongsTo<User, $this>
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }
}
