<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Intervention;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;

class TestController extends Controller
{
    private FirebaseService $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function testFirebase(): JsonResponse
    {
        try {
            // Test 1: Récupérer les interventions depuis SQL
            $interventions = Intervention::all();
            
            // Test 2: Pousser vers Firebase
            $this->firebaseService->syncData('test/interventions', $interventions->toArray());
            
            // Test 3: Créer une donnée de test
            $testData = [
                'message' => 'Firebase test successful!',
                'timestamp' => now()->toISOString(),
                'interventions_count' => $interventions->count(),
                'laravel_version' => app()->version(),
                'php_version' => PHP_VERSION
            ];
            
            $this->firebaseService->syncData('test/connection', $testData);
            
            return response()->json([
                'success' => true,
                'message' => 'Firebase test completed successfully',
                'data_pushed' => $testData,
                'interventions_count' => $interventions->count()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Firebase test failed',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function showData(): JsonResponse
    {
        try {
            // Vérifier les données dans Firebase
            $interventions = Intervention::all();
            
            return response()->json([
                'message' => 'Current data in Laravel',
                'interventions' => $interventions,
                'database_info' => [
                    'connection' => config('database.default'),
                    'host' => config('database.connections.mysql.host'),
                    'database' => config('database.connections.mysql.database')
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
