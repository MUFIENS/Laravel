<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\PickupLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PickupLog>
 */
class PickupLogFactory extends Factory
{
    protected $model = PickupLog::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory()->readyForPickup(),
            'verified_by' => User::factory()->cooperative(),
            'verified_at' => now(),
            'method' => 'qr',
            'metadata' => [
                'scanner' => 'web_camera',
                'ip' => '127.0.0.1',
            ],
        ];
    }
}
