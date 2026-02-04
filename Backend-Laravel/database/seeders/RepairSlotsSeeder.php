<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class RepairSlotsSeeder extends Seeder
{
    public function run(): void
    {
        // Créer 2 slots de réparation
        $slots = [
            [
                'slot_number' => 1,
                'car_id' => null,
                'status' => 'available',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'slot_number' => 2,
                'car_id' => null,
                'status' => 'available',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('repair_slots')->insert($slots);
        
        $this->command->info('✅ 2 repair slots créés avec succès');
    }
}
