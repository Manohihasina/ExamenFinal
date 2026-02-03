<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Client;

class ClientSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Jean Dupont (Regular)
        Client::updateOrCreate(
            ['email' => 'jean.dupont@example.com'],
            [
                'name' => 'Jean Dupont',
                'phone' => '034 12 345 67',
                'address' => '12 Rue de la Paix, Antananarivo',
            ]
        );

        // 2. Marie Curie (VIP)
        Client::updateOrCreate(
            ['email' => 'marie.curie@example.com'],
            [
                'name' => 'Marie Curie',
                'phone' => '032 98 765 43',
                'address' => '45 Avenue de l\'Indépendance, Antananarivo',
            ]
        );

        // 3. Paul Martin (New)
        Client::updateOrCreate(
            ['email' => 'paul.martin@example.com'],
            [
                'name' => 'Paul Martin',
                'phone' => '033 11 222 33',
                'address' => 'Lot II J 10, Ivandry',
            ]
        );
    }
}
