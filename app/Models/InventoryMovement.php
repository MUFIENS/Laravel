<?php

namespace App\Models;

use App\Enums\InventoryMovementType;
use Database\Factories\InventoryMovementFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $product_id
 * @property InventoryMovementType $type
 * @property int $quantity
 * @property string|null $reference_type
 * @property int|null $reference_id
 * @property string|null $reason
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'product_id',
    'type',
    'quantity',
    'reference_type',
    'reference_id',
    'reason',
    'created_by',
])]
class InventoryMovement extends Model
{
    /** @use HasFactory<InventoryMovementFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'type' => InventoryMovementType::class,
            'quantity' => 'integer',
            'reference_id' => 'integer',
        ];
    }

    /**
     * Product whose inventory moved.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * User or cooperative operator who recorded the movement.
     *
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
