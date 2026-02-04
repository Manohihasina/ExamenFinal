<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\RepairRepositoryInterface;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class RepairController extends Controller
{
    private RepairRepositoryInterface $repairRepository;
    private FirebaseService $firebaseService;

    public function __construct(RepairRepositoryInterface $repairRepository, FirebaseService $firebaseService)
    {
        $this->repairRepository = $repairRepository;
        $this->firebaseService = $firebaseService;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->repairRepository->findAll());
    }

    public function show(int $id): JsonResponse
    {
        $repair = $this->repairRepository->findById($id);
        if (!$repair) {
            return response()->json(['message' => 'Repair not found'], 404);
        }
        return response()->json($repair);
    }

    public function byCar(int $carId): JsonResponse
    {
        return response()->json($this->repairRepository->findByCar($carId));
    }

    public function store(Request $request): JsonResponse
    {
        $repair = $this->repairRepository->create($request->all());
        
        // Synchroniser avec Firebase Realtime Database
        $this->syncRepairToFirebase($repair);
        
        return response()->json($repair, 201);
    }

    public function start(int $id): JsonResponse
    {
        return response()->json($this->repairRepository->startRepair($id));
    }

    public function complete(int $id): JsonResponse
    {
        return response()->json($this->repairRepository->completeRepair($id));
    }
    
    /**
     * Synchroniser une réparation avec Firebase Realtime Database
     */
    private function syncRepairToFirebase($repair): void
    {
        try {
            $firebaseData = [
                'id' => $repair->id,
                'carId' => $repair->car_id,
                'interventionId' => $repair->intervention_id,
                'interventionName' => $repair->intervention->name ?? 'Unknown',
                'interventionPrice' => $repair->intervention->price ?? 0,
                'status' => $repair->status,
                'created_at' => $repair->created_at->toISOString(),
                'updated_at' => $repair->updated_at->toISOString(),
            ];
            
            $this->firebaseService->syncData("repairs/{$repair->id}", $firebaseData);
            
            Log::info("Repair {$repair->id} synchronized to Firebase");
        } catch (\Exception $e) {
            Log::error("Error synchronizing repair to Firebase: " . $e->getMessage());
        }
    }
}
