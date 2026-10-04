<?php

namespace Database\Factories;

use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Payment>
 */
class PaymentFactory extends Factory
{
    protected $model = Payment::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'provider' => 'midtrans',
            'provider_transaction_id' => 'TRX-'.Str::random(12),
            'provider_order_id' => 'ORDER-'.Str::random(10),
            'payment_token' => Str::random(32),
            'status' => PaymentStatus::Pending,
            'gross_amount' => 15000,
            'payment_type' => 'qris',
            'raw_notification_reference' => null,
            'paid_at' => null,
        ];
    }

    /**
     * Indicate that the payment is settled.
     */
    public function paid(): static
    {
        return $this->state(fn () => [
            'status' => PaymentStatus::Paid,
            'paid_at' => now(),
        ]);
    }
}
