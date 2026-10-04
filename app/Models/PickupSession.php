<?php

namespace App\Models;

use App\Enums\PickupSessionStatus;
use Database\Factories\PickupSessionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property Carbon $pickup_date
 * @property string $starts_at
 * @property string $ends_at
 * @property string $queue_prefix
 * @property PickupSessionStatus $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'pickup_date',
    'starts_at',
    'ends_at',
    'queue_prefix',
    'status',
])]
class PickupSession extends Model
{
    /** @use HasFactory<PickupSessionFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'pickup_date' => 'date',
            'status' => PickupSessionStatus::class,
        ];
    }

    public function isActive(): bool
    {
        return $this->status === PickupSessionStatus::Active;
    }

    /**
     * Scope a query to only include active sessions.
     *
     * @param  Builder<self>  $query
     */
    public function scopeActive(Builder $query): void
    {
        $query->where('status', PickupSessionStatus::Active);
    }

    /**
     * Orders scheduled for this pickup session.
     *
     * @return HasMany<Order, $this>
     */
    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Generate the next queue number sequentially for this session.
     */
    public function getNextQueueNumber(): int
    {
        $maxQueue = (int) $this->orders()->max('queue_number');

        return $maxQueue + 1;
    }

    /**
     * Format a human-readable queue code, e.g. A-001.
     */
    public function formatQueueCode(int $queueNumber): string
    {
        return sprintf('%s-%03d', $this->queue_prefix, $queueNumber);
    }
}
