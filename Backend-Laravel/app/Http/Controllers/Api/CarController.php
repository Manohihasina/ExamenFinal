<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\CarRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CarController extends Controller
{
    private CarRepositoryInterface $carRepository;

    public function __construct(CarRepositoryInterface $carRepository)
    {
        $this->carRepository = $carRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->carRepository->findAll());
    }

    public function show(int $id): JsonResponse
    {
        $car = $this->carRepository->findById($id);
        if (!$car) {
            return response()->json(['message' => 'Car not found'], 404);
        }
        return response()->json($car);
    }

    public function byClient(int $clientId): JsonResponse
    {
        return response()->json($this->carRepository->findByClient($clientId));
    }

    public function byStatus(string $status): JsonResponse
    {
        return response()->json($this->carRepository->findByStatus($status));
    }

    public function store(Request $request): JsonResponse
    {
        $car = $this->carRepository->create($request->all());
        return response()->json($car, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $car = $this->carRepository->update($id, $request->all());
        return response()->json($car);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->carRepository->delete($id);
        return response()->json(['success' => $deleted], $deleted ? 200 : 404);
    }

    
}
