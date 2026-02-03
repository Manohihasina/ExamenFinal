<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Car;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\WaitingSlot>
 */
class WaitingSlotFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'car_id' => Car::factory(),
            'total_cost' => fake()->randomFloat(2, 50, 500),
            'is_paid' => fake()->boolean(30), // 30% chance of being paid
        ];
    }
}
