<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            ClientSeeder::class,
            CarSeeder::class,
            InterventionSeeder::class, // Déjà existant
            RepairSlotSeeder::class,
            RepairSeeder::class,
            WaitingSlotSeeder::class,
        ]);
    }
}
