<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Repair;
use App\Models\Car;
use App\Models\Intervention;

class RepairSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Jean's Toyota - Completed "Vidange"
        $jeanCar = Car::where('license_plate', '1234 WWT')->first();
        $vidange = Intervention::where('name', 'Vidange')->first();

        if ($jeanCar && $vidange) {
            Repair::create([
                'car_id' => $jeanCar->id,
                'intervention_id' => $vidange->id,
                'status' => 'completed',
                'started_at' => now()->subDays(2),
                'completed_at' => now()->subDays(2)->addMinutes($vidange->duration_seconds / 60),
            ]);
        }

        // 2. Marie's Tesla - In Progress "Pneus"
        $marieCar = Car::where('license_plate', 'ELECTRIC')->first();
        $pneus = Intervention::where('name', 'Pneus')->first();

        if ($marieCar && $pneus) {
            Repair::create([
                'car_id' => $marieCar->id,
                'intervention_id' => $pneus->id,
                'status' => 'in_progress',
                'started_at' => now()->subMinutes(10),
                'completed_at' => null,
            ]);
        }

        // 3. Paul's Peugeot - Pending "Frein"
        $paulCar = Car::where('license_plate', 'P-208-FR')->first();
        $frein = Intervention::where('name', 'Frein')->first();

        if ($paulCar && $frein) {
            Repair::create([
                'car_id' => $paulCar->id,
                'intervention_id' => $frein->id,
                'status' => 'pending',
                'started_at' => null,
                'completed_at' => null,
            ]);
        }
    }
}
