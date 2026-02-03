<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\RepairSlotRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RepairSlotController extends Controller
{
    private RepairSlotRepositoryInterface $repairSlotRepository;

    public function __construct(RepairSlotRepositoryInterface $repairSlotRepository)
    {
        $this->repairSlotRepository = $repairSlotRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->repairSlotRepository->findAll());
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
        return response()->json($slot);
    }

    public function occupy(Request $request, int $slotId): JsonResponse
    {
        $carId = $request->input('car_id');
        return response()->json($this->repairSlotRepository->occupy($slotId, $carId));
    }

    public function free(int $slotId): JsonResponse
    {
        return response()->json($this->repairSlotRepository->free($slotId));
    }
}
