<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Car;
use App\Models\Client;

class CarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $jean = Client::where('email', 'jean.dupont@example.com')->first();
        $marie = Client::where('email', 'marie.curie@example.com')->first();
        $paul = Client::where('email', 'paul.martin@example.com')->first();

        if ($jean) {
            Car::updateOrCreate(
                ['license_plate' => '1234 WWT'],
                [
                    'client_id' => $jean->id,
                    'make' => 'Toyota',
                    'model' => 'Corolla',
                    'year' => '2018',
                    'color' => 'Gris Argent',
                    'vin' => '1HGCM82633A004352',
                    'status' => 'delivered', // Previously repaired
                ]
            );
        }

        if ($marie) {
            Car::updateOrCreate(
                ['license_plate' => 'ELECTRIC'],
                [
                    'client_id' => $marie->id,
                    'make' => 'Tesla',
                    'model' => 'Model 3',
                    'year' => '2023',
                    'color' => 'Blanc Perle',
                    'vin' => '5YJ3E1EA1JF000001',
                    'status' => 'in_repair', // Currently in repair
                ]
            );
        }

        if ($paul) {
            Car::updateOrCreate(
                ['license_plate' => 'P-208-FR'],
                [
                    'client_id' => $paul->id,
                    'make' => 'Peugeot',
                    'model' => '208',
                    'year' => '2020',
                    'color' => 'Bleu',
                    'vin' => 'VF3CCZMZ4KT000002',
                    'status' => 'available', // Checked in
                ]
            );
        }
    }
}
