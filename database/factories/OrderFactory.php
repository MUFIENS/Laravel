<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\PickupSession;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    protected $model = Order::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $subtotal = 15000;
        $margin = 1000;
        $total = $subtotal;

        return [
            'user_id' => User::factory()->student(),
            'pickup_session_id' => null,
            'order_number' => 'KD-'.date('Ymd').'-'.strtoupper(Str::random(6)),
            'queue_number' => null,
            'queue_code' => null,
            'subtotal' => $subtotal,
            'cooperative_margin_total' => $margin,
            'total' => $total,
            'payment_status' => PaymentStatus::Pending,
            'order_status' => OrderStatus::PendingPayment,
            'pickup_token_hash' => hash('sha256', Str::random(32)),
            'paid_at' => null,
            'ready_at' => null,
            'completed_at' => null,
            'cancelled_at' => null,
        ];
    }

    /**
     * Indicate that the order is paid and assigned a queue.
     */
    public function paid(?PickupSession $session = null): static
    {
        return $this->state(function (array $attributes) use ($session) {
            $sess = $session ?? PickupSession::factory()->create();
            $queueNum = $sess->getNextQueueNumber();

            return [
                'pickup_session_id' => $sess->id,
                'queue_number' => $queueNum,
                'queue_code' => $sess->formatQueueCode($queueNum),
                'payment_status' => PaymentStatus::Paid,
                'order_status' => OrderStatus::Paid,
                'paid_at' => now(),
            ];
        });
    }

    /**
     * Indicate that the order is ready for pickup.
     */
    public function readyForPickup(?PickupSession $session = null): static
    {
        return $this->paid($session)->state(fn () => [
            'order_status' => OrderStatus::ReadyForPickup,
            'ready_at' => now(),
        ]);
    }
}
