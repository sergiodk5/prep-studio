<?php

namespace Database\Factories;

use App\Enums\Track;
use App\Models\Course;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'title' => fake()->sentence(3),
            'track' => fake()->randomElement(Track::cases())->value,
            'description' => fake()->sentence(),
        ];
    }
}
