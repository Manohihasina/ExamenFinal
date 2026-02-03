<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RepairSlot;
use App\Models\Car;

class RepairSlotSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Slot 1: Occupied by Marie's Tesla
        $marieCar = Car::where('license_plate', 'ELECTRIC')->first();
        
        RepairSlot::updateOrCreate(
            ['slot_number' => 1],
            [
                'status' => 'occupied',
                'car_id' => $marieCar ? $marieCar->id : null,
            ]
        );

        // Slot 2: Available
        RepairSlot::updateOrCreate(
            ['slot_number' => 2],
            [
                'status' => 'available',
                'car_id' => null,
            ]
        );
    }
}
