<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = rtrim(fake()->unique()->sentence(2), '.');

        return [
            'name' => ucfirst($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->randomNumber(4),
            'description' => fake()->sentence(),
            'image_path' => null,
            'is_active' => true,
            'display_order' => fake()->numberBetween(1, 10),
        ];
    }
}
