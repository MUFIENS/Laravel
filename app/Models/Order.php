<?php

namespace App\Models;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use Database\Factories\OrderFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $pickup_session_id
 * @property string $order_number
 * @property int|null $queue_number
 * @property string|null $queue_code
 * @property int $subtotal
 * @property int $cooperative_margin_total
 * @property int $total
 * @property PaymentStatus $payment_status
 * @property OrderStatus $order_status
 * @property string|null $pickup_token_hash
 * @property Carbon|null $paid_at
 * @property Carbon|null $ready_at
 * @property Carbon|null $completed_at
 * @property Carbon|null $cancelled_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'user_id',
    'pickup_session_id',
    'order_number',
    'queue_number',
    'queue_code',
    'subtotal',
    'cooperative_margin_total',
    'total',
    'payment_status',
    'order_status',
    'pickup_token_hash',
    'paid_at',
    'ready_at',
    'completed_at',
    'cancelled_at',
])]
class Order extends Model
{
    /** @use HasFactory<OrderFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'payment_status' => PaymentStatus::class,
            'order_status' => OrderStatus::class,
            'subtotal' => 'integer',
            'cooperative_margin_total' => 'integer',
            'total' => 'integer',
            'queue_number' => 'integer',
            'paid_at' => 'datetime',
            'ready_at' => 'datetime',
            'completed_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function isPaid(): bool
    {
        return $this->payment_status === PaymentStatus::Paid;
    }

    public function isReadyForPickup(): bool
    {
        return $this->order_status === OrderStatus::ReadyForPickup;
    }

    public function isCompleted(): bool
    {
        return $this->order_status === OrderStatus::Completed;
    }

    public function isCancelled(): bool
    {
        return $this->order_status === OrderStatus::Cancelled;
    }

    public function isFinal(): bool
    {
        return $this->order_status->isFinal();
    }

    public function canBePickedUp(): bool
    {
        return $this->isPaid() && $this->isReadyForPickup() && $this->pickupLog === null;
    }

    /**
     * Resolve route binding by id or order_number.
     *
     * @param  mixed  $value
     * @param  string|null  $field
     */
    public function resolveRouteBinding($value, $field = null): ?Model
    {
        if (is_numeric($value)) {
            return $this->where('id', $value)->first();
        }

        return $this->where($field ?? 'order_number', $value)->first();
    }

    /**
     * Scope a query to orders awaiting payment.
     *
     * @param  Builder<self>  $query
     */
    public function scopePendingPayment(Builder $query): void
    {
        $query->where('order_status', OrderStatus::PendingPayment);
    }

    /**
     * Scope a query to orders ready for pickup.
     *
     * @param  Builder<self>  $query
     */
    public function scopeReadyForPickup(Builder $query): void
    {
        $query->where('order_status', OrderStatus::ReadyForPickup);
    }

    /**
     * Scope a query to completed orders.
     *
     * @param  Builder<self>  $query
     */
    public function scopeCompleted(Builder $query): void
    {
        $query->where('order_status', OrderStatus::Completed);
    }

    /**
     * Buyer who placed this order.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Pickup session assigned to this order.
     *
     * @return BelongsTo<PickupSession, $this>
     */
    public function pickupSession(): BelongsTo
    {
        return $this->belongsTo(PickupSession::class);
    }

    /**
     * Historical snapshot line items in this order.
     *
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Payments attempted/recorded for this order.
     *
     * @return HasMany<Payment, $this>
     */
    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }

    /**
     * Latest payment recorded for this order.
     *
     * @return HasOne<Payment, $this>
     */
    public function latestPayment(): HasOne
    {
        return $this->hasOne(Payment::class)->latestOfMany();
    }

    /**
     * Pickup verification log for this order.
     *
     * @return HasOne<PickupLog, $this>
     */
    public function pickupLog(): HasOne
    {
        return $this->hasOne(PickupLog::class);
    }
}
