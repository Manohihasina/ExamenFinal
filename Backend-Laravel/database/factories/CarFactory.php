<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Client;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Car>
 */
class CarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'client_id' => Client::factory(),
            'make' => fake()->word(), // ex: Toyota, Ford
            'model' => fake()->word(), // ex: Camry, Focus
            'year' => fake()->year(),
            'license_plate' => fake()->unique()->regexify('[A-Z]{2}-[0-9]{3}-[A-Z]{2}'),
            'color' => fake()->safeColorName(),
            'vin' => fake()->unique()->bothify('1################'),
            'status' => fake()->randomElement(['available', 'in_repair', 'ready', 'delivered']),
        ];
    }
}
