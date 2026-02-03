<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\WaitingSlot;
use App\Models\Car;

class WaitingSlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Paul's Peugeot is waiting nicely
        $paulCar = Car::where('license_plate', 'P-208-FR')->first();

        if ($paulCar) {
            // Check if not already in waiting slot
            if (WaitingSlot::where('car_id', $paulCar->id)->doesntExist()) {
                WaitingSlot::create([
                    'car_id' => $paulCar->id,
                    'total_cost' => 150.00, // Price of 'Frein'
                    'is_paid' => false,
                ]);
            }
        }
    }
}
