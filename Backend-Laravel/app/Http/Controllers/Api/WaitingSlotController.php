<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\WaitingSlotRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WaitingSlotController extends Controller
{
    private WaitingSlotRepositoryInterface $waitingSlotRepository;

    public function __construct(WaitingSlotRepositoryInterface $waitingSlotRepository)
    {
        $this->waitingSlotRepository = $waitingSlotRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->waitingSlotRepository->findAll());
    }

    public function unpaid(): JsonResponse
    {
        return response()->json($this->waitingSlotRepository->findUnpaid());
    }

    public function byCar(int $carId): JsonResponse
    {
        $slot = $this->waitingSlotRepository->findByCar($carId);
        if (!$slot) {
            return response()->json(['message' => 'Waiting slot not found'], 404);
        }
        return response()->json($slot);
    }

    public function store(Request $request): JsonResponse
    {
        $slot = $this->waitingSlotRepository->create($request->all());
        return response()->json($slot, 201);
    }

    public function pay(int $id): JsonResponse
    {
        return response()->json($this->waitingSlotRepository->markAsPaid($id));
    }
}
