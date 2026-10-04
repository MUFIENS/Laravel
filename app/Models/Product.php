<?php

namespace App\Models;

use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use Database\Factories\ProductFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $category_id
 * @property int|null $owner_id
 * @property string $name
 * @property string $slug
 * @property string $description
 * @property string|null $image_path
 * @property ProductSourceType $source_type
 * @property int $base_price
 * @property int $cooperative_margin
 * @property int $selling_price
 * @property int $stock
 * @property ProductStatus $status
 * @property bool $is_featured
 * @property Carbon|null $published_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property Carbon|null $deleted_at
 */
#[Fillable([
    'category_id',
    'owner_id',
    'name',
    'slug',
    'description',
    'image_path',
    'source_type',
    'base_price',
    'cooperative_margin',
    'selling_price',
    'stock',
    'status',
    'is_featured',
    'published_at',
])]
class Product extends Model
{
    /** @use HasFactory<ProductFactory> */
    use HasFactory, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'source_type' => ProductSourceType::class,
            'status' => ProductStatus::class,
            'base_price' => 'integer',
            'cooperative_margin' => 'integer',
            'selling_price' => 'integer',
            'stock' => 'integer',
            'is_featured' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function isConsignment(): bool
    {
        return $this->source_type === ProductSourceType::Student;
    }

    public function isCooperative(): bool
    {
        return $this->source_type === ProductSourceType::Cooperative;
    }

    public function isAvailable(): bool
    {
        return $this->status === ProductStatus::Active && $this->stock > 0;
    }

    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    /**
     * Retrieve the model for a bound value (supports both slug and id).
     *
     * @param  mixed  $value
     * @param  string|null  $field
     */
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if (is_numeric($value)) {
            return $this->where('id', $value)->first();
        }

        return $this->where($field ?? 'slug', $value)->first();
    }

    /**
     * Scope a query to only include active products.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', ProductStatus::Active);
    }

    /**
     * Scope a query to only include featured products.
     *
     * @param  Builder<self>  $query
     */
    public function scopeFeatured(Builder $query): void
    {
        $query->where('is_featured', true);
    }

    /**
     * Scope a query to only include cooperative products.
     *
     * @param  Builder<self>  $query
     */
    public function scopeCooperative(Builder $query): void
    {
        $query->where('source_type', ProductSourceType::Cooperative);
    }

    /**
     * Scope a query to only include student consignment products.
     *
     * @param  Builder<self>  $query
     */
    public function scopeConsignment(Builder $query): void
    {
        $query->where('source_type', ProductSourceType::Student);
    }

    /**
     * Category that this product belongs to.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Student owner for consigned products.
     *
     * @return BelongsTo<User, $this>
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Product submissions associated with this product.
     *
     * @return HasMany<ProductSubmission, $this>
     */
    public function submissions(): HasMany
    {
        return $this->hasMany(ProductSubmission::class);
    }

    /**
     * Active cart items referencing this product.
     *
     * @return HasMany<CartItem, $this>
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    /**
     * Historical order items snapshotting this product.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Stock changes for this product.
     *
     * @return HasMany<InventoryMovement, $this>
     */
    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    /**
     * Most recent inventory movement for this product.
     *
     * @return HasOne<InventoryMovement, $this>
     */
    public function latestInventoryMovement(): HasOne
    {
        return $this->hasOne(InventoryMovement::class)->latestOfMany();
    }

    /**
     * Get the standardized stock status key ('in_stock', 'low_stock', 'out_of_stock').
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->stock <= 0) {
            return 'out_of_stock';
        }

        if ($this->stock <= 5) {
            return 'low_stock';
        }

        return 'in_stock';
    }

    /**
     * Get the human-readable stock status label in Indonesian.
     */
    public function getStockStatusLabelAttribute(): string
    {
        return match ($this->stock_status) {
            'out_of_stock' => 'Habis',
            'low_stock' => 'Sisa '.$this->stock,
            default => 'Tersedia',
        };
    }
}
