<?php

namespace Database\Factories;

use App\Enums\PickupSessionStatus;
use App\Models\PickupSession;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PickupSession>
 */
class PickupSessionFactory extends Factory
{
    protected $model = PickupSession::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => 'Istirahat '.fake()->numberBetween(1, 2),
            'pickup_date' => now()->toDateString(),
            'starts_at' => '10:00:00',
            'ends_at' => '10:30:00',
            'queue_prefix' => 'A',
            'status' => PickupSessionStatus::Active,
        ];
    }
}
