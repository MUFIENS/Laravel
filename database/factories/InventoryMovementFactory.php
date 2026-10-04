<?php

namespace Database\Factories;

use App\Enums\InventoryMovementType;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<InventoryMovement>
 */
class InventoryMovementFactory extends Factory
{
    protected $model = InventoryMovement::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'type' => InventoryMovementType::Restock,
            'quantity' => 20,
            'reference_type' => null,
            'reference_id' => null,
            'reason' => 'Initial stock delivery',
            'created_by' => User::factory()->cooperative(),
        ];
    }
}
