<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\RepairRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepairController extends Controller
{
    private RepairRepositoryInterface $repairRepository;

    public function __construct(RepairRepositoryInterface $repairRepository)
    {
        $this->repairRepository = $repairRepository;
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
}
