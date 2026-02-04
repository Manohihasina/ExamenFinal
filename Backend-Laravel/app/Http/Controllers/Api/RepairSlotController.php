<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\RepairSlotRepositoryInterface;

use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepairSlotController extends Controller
{
    private RepairSlotRepositoryInterface $repairSlotRepository;
    private FirebaseService $firebaseService;

    public function __construct(RepairSlotRepositoryInterface $repairSlotRepository, FirebaseService $firebaseService)
    {
        $this->repairSlotRepository = $repairSlotRepository;
        $this->firebaseService = $firebaseService;
    }

    public function index(): JsonResponse
    {
        $slots = $this->repairSlotRepository->findAll();
        
        // Synchroniser avec Firebase
        $this->syncSlotsToFirebase($slots);
        
        return response()->json($slots);
    }

    public function available(): JsonResponse
    {
        return response()->json($this->repairSlotRepository->findAvailable());
    }

    public function show(int $slotNumber): JsonResponse
    {
        $slot = $this->repairSlotRepository->findBySlotNumber($slotNumber);
        if (!$slot) {
            return response()->json(['message' => 'Slot not found'], 404);
        }
        
        // Synchroniser ce slot avec Firebase
        $this->syncSlotToFirebase($slot);
        
        return response()->json($slot);
    }

    public function occupy(Request $request, int $slotId): JsonResponse
    {
        $validated = $request->validate([
            'car_id' => 'required|string'
        ]);
        
        $firebaseCarId = $validated['car_id'];
        
        // Occuper le slot directement avec Firebase ID
        $slot = $this->occupySlotWithFirebase($slotId, $firebaseCarId);
        
        if (!$slot) {
            return response()->json([
                'error' => 'Failed to occupy slot',
                'firebase_car_id' => $firebaseCarId
            ], 500);
        }
        
        // Synchroniser avec Firebase
        $this->syncSlotToFirebase($slot);
        
        return response()->json([
            'slot' => $slot,
            'firebase_car_id' => $firebaseCarId
        ]);
    }

    public function free(int $slotId): JsonResponse
    {
        // Libérer le slot directement dans Firebase
        $slot = $this->freeSlotWithFirebase($slotId);
        
        if (!$slot) {
            return response()->json([
                'error' => 'Failed to free slot',
                'slot_id' => $slotId
            ], 500);
        }
        
        return response()->json([
            'slot' => $slot
        ]);
    }

    /**
     * Libérer un slot directement dans Firebase
     */
    private function freeSlotWithFirebase(int $slotId): ?array
    {
        try {
            // Récupérer le slot depuis Firebase
            $slotData = $this->firebaseService->getData("repair_slots/{$slotId}");
            
            if (!$slotData) {
                \Log::warning("Slot not found in Firebase: {$slotId}");
                return null;
            }
            
            // Mettre à jour le slot dans Firebase
            $updatedSlotData = [
                'id' => $slotId,
                'slot_number' => $slotData['slot_number'] ?? $slotId,
                'car_id' => null,
                'status' => 'available',
                'updated_at' => now()->toISOString(),
                'created_at' => $slotData['created_at'] ?? now()->toISOString(),
            ];
            
            $this->firebaseService->syncData("repair_slots/{$slotId}", $updatedSlotData);
            
            \Log::info("Successfully freed slot {$slotId}");
            return $updatedSlotData;
            
        } catch (\Exception $e) {
            \Log::error("Error freeing slot with Firebase: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Occuper un slot directement avec Firebase
     */
    private function occupySlotWithFirebase(int $slotId, string $firebaseCarId): ?array
    {
        try {
            // Récupérer le slot depuis Firebase
            $slotData = $this->firebaseService->getData("repair_slots/{$slotId}");
            
            if (!$slotData) {
                \Log::warning("Slot not found in Firebase: {$slotId}");
                return null;
            }
            
            // Vérifier que le slot est disponible
            if ($slotData['status'] !== 'available') {
                \Log::warning("Slot {$slotId} is not available, current status: {$slotData['status']}");
                return null;
            }
            
            // Récupérer les données de la voiture Firebase
            $carData = $this->firebaseService->getData("cars/{$firebaseCarId}");
            
            if (!$carData) {
                \Log::warning("Car not found in Firebase: {$firebaseCarId}");
                return null;
            }
            
            // Mettre à jour le slot dans Firebase
            $updatedSlotData = [
                'id' => $slotId,
                'slot_number' => $slotData['slot_number'] ?? $slotId,
                'car_id' => $firebaseCarId,
                'status' => 'occupied',
                'updated_at' => now()->toISOString(),
                'created_at' => $slotData['created_at'] ?? now()->toISOString(),
            ];
            
            $this->firebaseService->syncData("repair_slots/{$slotId}", $updatedSlotData);
            
            // Ajouter les informations de la voiture
            $updatedSlotData['car'] = $carData;
            
            \Log::info("Successfully occupied slot {$slotId} with Firebase car {$firebaseCarId}");
            return $updatedSlotData;
            
        } catch (\Exception $e) {
            \Log::error("Error occupying slot with Firebase: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Mapper Firebase ID vers Laravel ID (plus utilisé)
     */
    private function mapFirebaseToLaravelCarId(string $firebaseCarId): ?int
    {
        try {
            // Chercher la voiture dans Firebase par son ID
            $firebaseCar = $this->firebaseService->getData("cars/{$firebaseCarId}");
            
            if (!$firebaseCar) {
                \Log::warning("Car not found in Firebase: {$firebaseCarId}");
                return null;
            }
            
            // Logger la structure pour debug
            \Log::info("Firebase car data for {$firebaseCarId}: " . json_encode($firebaseCar));
            
            // Chercher la voiture correspondante dans Laravel par plaque d'immatriculation
            $licensePlate = $firebaseCar['license_plate'] ?? $firebaseCar['licensePlate'] ?? null;
            
            if (!$licensePlate) {
                \Log::warning("No license plate found for Firebase car: {$firebaseCarId}");
                \Log::warning("Available fields: " . implode(', ', array_keys($firebaseCar)));
                return null;
            }
            
            \Log::info("Found license plate: {$licensePlate} for Firebase car: {$firebaseCarId}");
            
            $laravelCar = \App\Models\Car::where('license_plate', $licensePlate)->first();
            
            if (!$laravelCar) {
                \Log::info("Car not found in Laravel, creating from Firebase data...");
                
                // Créer la voiture dans Laravel à partir des données Firebase
                $laravelCar = \App\Models\Car::create([
                    'make' => $firebaseCar['make'] ?? $firebaseCar['brand'] ?? 'Unknown',
                    'model' => $firebaseCar['model'] ?? 'Unknown',
                    'year' => $firebaseCar['year'] ?? 2024,
                    'license_plate' => $licensePlate,
                    'color' => $firebaseCar['color'] ?? 'Unknown',
                    'vin' => $firebaseCar['vin'] ?? null,
                    'mileage' => $firebaseCar['mileage'] ?? 0,
                    'status' => 'active',
                    'client_id' => $firebaseCar['client_id'] ?? null,
                    'firebase_id' => $firebaseCarId, // Garder la référence Firebase
                ]);
                
                \Log::info("Created Laravel car with ID: {$laravelCar->id} for Firebase ID: {$firebaseCarId}");
            }
            
            \Log::info("Mapped Firebase ID {$firebaseCarId} to Laravel ID {$laravelCar->id}");
            return $laravelCar->id;
            
        } catch (\Exception $e) {
            \Log::error("Error mapping Firebase to Laravel car ID: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Synchroniser tous les slots avec Firebase
     */
    private function syncSlotsToFirebase($slots): void
    {
        try {
            foreach ($slots as $slot) {
                $this->syncSlotToFirebase($slot);
            }
            \Log::info('Repair slots synchronisés avec Firebase');
        } catch (\Exception $e) {
            \Log::error('Erreur synchronisation slots Firebase: ' . $e->getMessage());
        }
    }

    /**
     * Synchroniser un slot spécifique avec Firebase
     */
    private function syncSlotToFirebase($slot): void
    {
        try {
            // Récupérer l'ID du slot (objet ou array)
            $slotId = is_object($slot) ? $slot->id : ($slot['id'] ?? null);
            
            if (!$slotId) {
                \Log::error('Slot ID not found for Firebase sync');
                return;
            }
            
            $firebaseData = [
                'id' => $slotId,
                'slot_number' => is_object($slot) ? ($slot->slot_number ?? $slotId) : ($slot['slot_number'] ?? $slotId),
                'car_id' => is_object($slot) ? $slot->car_id : ($slot['car_id'] ?? null),
                'status' => is_object($slot) ? $slot->status : ($slot['status'] ?? 'available'),
                'created_at' => is_object($slot) ? ($slot->created_at?->toISOString() ?? now()->toISOString()) : ($slot['created_at'] ?? now()->toISOString()),
                'updated_at' => now()->toISOString()
            ];

            // Utiliser Realtime Database
            $path = "repair_slots/{$slotId}";
            $this->firebaseService->syncData($path, $firebaseData);
            
        } catch (\Exception $e) {
            $slotId = is_object($slot) ? $slot->id : ($slot['id'] ?? 'unknown');
            \Log::error("Erreur synchronisation slot {$slotId} Firebase: " . $e->getMessage());
        }
    }
}
