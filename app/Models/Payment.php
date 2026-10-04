<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Database\Factories\PaymentFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $order_id
 * @property string $provider
 * @property string|null $provider_transaction_id
 * @property string|null $provider_order_id
 * @property string|null $payment_token
 * @property PaymentStatus $status
 * @property int $gross_amount
 * @property string|null $payment_type
 * @property string|null $raw_notification_reference
 * @property Carbon|null $paid_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'order_id',
    'provider',
    'provider_transaction_id',
    'provider_order_id',
    'payment_token',
    'status',
    'gross_amount',
    'payment_type',
    'raw_notification_reference',
    'paid_at',
])]
class Payment extends Model
{
    /** @use HasFactory<PaymentFactory> */
    use HasFactory;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => PaymentStatus::class,
            'gross_amount' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function isPaid(): bool
    {
        return $this->status === PaymentStatus::Paid;
    }

    public function isPending(): bool
    {
        return $this->status === PaymentStatus::Pending;
    }

    public function isFailed(): bool
    {
        return in_array($this->status, [PaymentStatus::Failed, PaymentStatus::Cancelled, PaymentStatus::Expired], true);
    }

    /**
     * The order associated with this payment transaction.
     *
     * @return BelongsTo<Order, $this>
     */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
