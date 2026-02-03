<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Intervention;

class InterventionSeeder extends Seeder
{
    public function run(): void
    {
        $interventions = [
            [
                'name' => 'Frein',
                'price' => 150.00,
                'duration_seconds' => 1800, // 30 minutes
                'description' => 'Changement des plaquettes de frein avant et arrière',
            ],
            [
                'name' => 'Vidange',
                'price' => 80.00,
                'duration_seconds' => 900, // 15 minutes
                'description' => 'Vidange moteur avec filtre à huile',
            ],
            [
                'name' => 'Filtre',
                'price' => 45.00,
                'duration_seconds' => 600, // 10 minutes
                'description' => 'Changement des filtres à air et à habitacle',
            ],
            [
                'name' => 'Batterie',
                'price' => 120.00,
                'duration_seconds' => 1200, // 20 minutes
                'description' => 'Remplacement de la batterie et vérification du système électrique',
            ],
            [
                'name' => 'Amortisseurs',
                'price' => 200.00,
                'duration_seconds' => 2400, // 40 minutes
                'description' => 'Remplacement des amortisseurs avant et arrière',
            ],
            [
                'name' => 'Embrayage',
                'price' => 350.00,
                'duration_seconds' => 3600, // 60 minutes
                'description' => 'Remplacement complet du kit d\'embrayage',
            ],
            [
                'name' => 'Pneus',
                'price' => 180.00,
                'duration_seconds' => 1500, // 25 minutes
                'description' => 'Montage et équilibrage de 4 pneus',
            ],
            [
                'name' => 'Système de refroidissement',
                'price' => 130.00,
                'duration_seconds' => 2100, // 35 minutes
                'description' => 'Vidange et remplacement du liquide de refroidissement',
            ],
        ];

        foreach ($interventions as $intervention) {
            Intervention::create($intervention);
        }
    }
}
