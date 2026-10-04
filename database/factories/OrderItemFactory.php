<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    protected $model = OrderItem::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $unitPrice = 12000;
        $basePrice = 11000;
        $margin = 1000;
        $qty = 1;

        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'seller_id' => null,
            'product_name' => 'Sample Product',
            'unit_price' => $unitPrice,
            'base_price' => $basePrice,
            'cooperative_margin' => $margin,
            'quantity' => $qty,
            'subtotal' => $unitPrice * $qty,
        ];
    }
}
