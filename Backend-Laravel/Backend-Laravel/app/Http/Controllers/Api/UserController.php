<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\UserRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    private UserRepositoryInterface $userRepository;

    public function __construct(UserRepositoryInterface $userRepository)
    {
        $this->userRepository = $userRepository;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->userRepository->findAll());
    }

    public function show(int $id): JsonResponse
    {
        $user = $this->userRepository->findById($id);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function byEmail(Request $request): JsonResponse
    {
        $email = $request->input('email');
        $user = $this->userRepository->findByEmail($email);
        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }
        return response()->json($user);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $this->userRepository->create($request->all());
        return response()->json($user, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $user = $this->userRepository->update($id, $request->all());
        return response()->json($user);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->userRepository->delete($id);
        return response()->json(['success' => $deleted], $deleted ? 200 : 404);
    }
}
