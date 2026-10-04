<?php

namespace Database\Factories;

use App\Enums\ProductSubmissionStatus;
use App\Models\Category;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductSubmission>
 */
class ProductSubmissionFactory extends Factory
{
    protected $model = ProductSubmission::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $basePrice = fake()->numberBetween(3000, 15000);

        return [
            'student_id' => User::factory()->student(),
            'product_id' => null,
            'category_id' => Category::factory(),
            'name' => ucfirst(rtrim(fake()->sentence(3), '.')),
            'description' => fake()->paragraph(),
            'image_path' => 'submissions/sample.jpg',
            'base_price' => $basePrice,
            'proposed_stock' => fake()->numberBetween(5, 20),
            'cooperative_margin' => null,
            'proposed_selling_price' => null,
            'status' => ProductSubmissionStatus::Submitted,
            'rejection_reason' => null,
            'reviewed_by' => null,
            'reviewed_at' => null,
        ];
    }
}
