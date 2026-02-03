<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\InterventionRepositoryInterface;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    private InterventionRepositoryInterface $interventionRepository;
    private $firebaseService;

    public function __construct(InterventionRepositoryInterface $interventionRepository, FirebaseService $firebaseService)
    {
        $this->interventionRepository = $interventionRepository;
        $this->firebaseService = $firebaseService;
    }

    public function index(): JsonResponse
    {
        try {
            return response()->json($this->interventionRepository->findAll());
        } catch (\Exception $e) {
            // Fallback to mock data if database is not available
            return response()->json([
                ['id' => 1, 'name' => 'Freinage', 'price' => 150, 'is_active' => true],
                ['id' => 2, 'name' => 'Vidange', 'price' => 80, 'is_active' => true],
                ['id' => 3, 'name' => 'Pneus', 'price' => 200, 'is_active' => true]
            ]);
        }
    }

    /**
     * Récupérer les interventions depuis Firebase Realtime Database
     */
    public function firebase(): JsonResponse
    {
        try {
            $interventions = $this->firebaseService->getData('interventions');
            return response()->json($interventions ?: []);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la récupération des interventions depuis Firebase',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function active(): JsonResponse
    {
        try {
            return response()->json($this->interventionRepository->findActive());
        } catch (\Exception $e) {
            // Fallback to mock data if database is not available
            return response()->json([
                ['id' => 1, 'name' => 'Freinage', 'price' => 150, 'is_active' => true],
                ['id' => 2, 'name' => 'Vidange', 'price' => 80, 'is_active' => true],
                ['id' => 3, 'name' => 'Pneus', 'price' => 200, 'is_active' => true]
            ]);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $intervention = $this->interventionRepository->findById($id);
            if (!$intervention) {
                return response()->json(['message' => 'Intervention not found'], 404);
            }
            return response()->json($intervention);
        } catch (\Exception $e) {
            // Fallback to mock data
            $mockInterventions = [
                1 => ['id' => 1, 'name' => 'Freinage', 'price' => 150, 'is_active' => true],
                2 => ['id' => 2, 'name' => 'Vidange', 'price' => 80, 'is_active' => true],
                3 => ['id' => 3, 'name' => 'Pneus', 'price' => 200, 'is_active' => true]
            ];
            
            if (isset($mockInterventions[$id])) {
                return response()->json($mockInterventions[$id]);
            }
            return response()->json(['message' => 'Intervention not found'], 404);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            // Validation des données
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'price' => 'required|numeric|min:0',
                'duration_seconds' => 'required|integer|min:60',
                'description' => 'nullable|string',
                'is_active' => 'boolean'
            ]);

            // Créer dans la base de données MySQL
            $intervention = $this->interventionRepository->create($validated);
            
            // Synchroniser avec Firebase Firestore
            $this->syncToFirebase($intervention);
            
            return response()->json([
                'message' => 'Intervention créée avec succès',
                'intervention' => $intervention
            ], 201);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de la création de l\'intervention',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Synchroniser l'intervention avec Firebase Realtime Database
     */
    private function syncToFirebase($intervention): void
    {
        try {
            $firebaseData = [
                'id' => $intervention->id,
                'name' => $intervention->name,
                'price' => (float) $intervention->price,
                'duration_seconds' => (int) $intervention->duration_seconds,
                'description' => $intervention->description ?? '',
                'is_active' => (bool) $intervention->is_active,
                'created_at' => $intervention->created_at->toISOString(),
                'updated_at' => $intervention->updated_at->toISOString()
            ];

            // Utiliser le service Firebase pour sauvegarder dans Realtime Database
            $path = "interventions/{$intervention->id}";
            $this->firebaseService->syncData($path, $firebaseData);
            
            \Log::info("Intervention {$intervention->id} synchronisée avec Firebase Realtime Database");
            
        } catch (\Exception $e) {
            // Logger l'erreur mais ne pas bloquer le processus
            \Log::error('Erreur synchronisation Firebase: ' . $e->getMessage());
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $intervention = $this->interventionRepository->update($id, $request->all());
            return response()->json($intervention);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Database not available - intervention not updated'], 503);
        }
    }

    public function disable(int $id): JsonResponse
    {
        try {
            return response()->json($this->interventionRepository->disable($id));
        } catch (\Exception $e) {
            return response()->json(['message' => 'Database not available - intervention not disabled'], 503);
        }
    }
}
