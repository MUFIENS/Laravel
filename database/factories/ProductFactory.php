<?php

namespace Database\Factories;

use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = rtrim(fake()->sentence(3), '.');
        $basePrice = fake()->numberBetween(2000, 25000);
        $margin = 1000;
        $sellingPrice = $basePrice + $margin;

        return [
            'category_id' => Category::factory(),
            'owner_id' => null,
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->randomNumber(5),
            'description' => fake()->paragraph(),
            'image_path' => null,
            'source_type' => ProductSourceType::Cooperative,
            'base_price' => $basePrice,
            'cooperative_margin' => $margin,
            'selling_price' => $sellingPrice,
            'stock' => fake()->numberBetween(5, 50),
            'status' => ProductStatus::Active,
            'is_featured' => false,
            'published_at' => now(),
        ];
    }

    /**
     * Indicate that the product is a student consignment.
     */
    public function consignment(?User $owner = null): static
    {
        return $this->state(fn (array $attributes) => [
            'owner_id' => $owner !== null ? $owner->id : User::factory()->student(),
            'source_type' => ProductSourceType::Student,
        ]);
    }

    /**
     * Indicate that the product is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock' => 0,
        ]);
    }
}
