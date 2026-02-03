<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\InterventionRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterventionController extends Controller
{
    private InterventionRepositoryInterface $interventionRepository;

    public function __construct(InterventionRepositoryInterface $interventionRepository)
    {
        $this->interventionRepository = $interventionRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->interventionRepository->findAll());
    }

    public function active(): JsonResponse
    {
        return response()->json($this->interventionRepository->findActive());
    }

    public function show(int $id): JsonResponse
    {
        $intervention = $this->interventionRepository->findById($id);
        if (!$intervention) {
            return response()->json(['message' => 'Intervention not found'], 404);
        }
        return response()->json($intervention);
    }

    public function store(Request $request): JsonResponse
    {
        $intervention = $this->interventionRepository->create($request->all());
        return response()->json($intervention, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $intervention = $this->interventionRepository->update($id, $request->all());
        return response()->json($intervention);
    }

    public function disable(int $id): JsonResponse
    {
        return response()->json($this->interventionRepository->disable($id));
    }
}
