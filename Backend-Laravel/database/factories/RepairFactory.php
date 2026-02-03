<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Car;
use App\Models\Intervention;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Repair>
 */
class RepairFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['pending', 'in_progress', 'completed', 'cancelled']);
        
        $startedAt = ($status === 'in_progress' || $status === 'completed') ? fake()->dateTimeBetween('-1 month', 'now') : null;
        $completedAt = ($status === 'completed') ? fake()->dateTimeBetween($startedAt, 'now') : null;

        return [
            'car_id' => Car::factory(),
            'intervention_id' => Intervention::inRandomOrder()->first()?->id ?? Intervention::factory(),
            'status' => $status,
            'started_at' => $startedAt,
            'completed_at' => $completedAt,
        ];
    }
}
