<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Repositories\Contracts\ClientRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClientController extends Controller
{
    private ClientRepositoryInterface $clientRepository;
    private $firebaseService;

    public function __construct(ClientRepositoryInterface $clientRepository, \App\Services\FirebaseService $firebaseService)
    {
        $this->clientRepository = $clientRepository;
        $this->firebaseService = $firebaseService;
    }

    public function index(): JsonResponse
    {
        return response()->json($this->clientRepository->findAll());
    }

    public function indexFromFirestore(): JsonResponse
    {
        if (!method_exists($this->firebaseService, 'isAuthAvailable') || !$this->firebaseService->isAuthAvailable()) {
            return response()->json([
                'message' => 'Firebase Auth not initialized',
            ], 500);
        }

        $maxResults = (int) request()->query('max', 1000);
        $users = $this->firebaseService->listAuthUsers($maxResults);
        return response()->json($users);
    }

    public function show(int $id): JsonResponse
    {
        $client = $this->clientRepository->findById($id);
        if (!$client) {
            return response()->json(['message' => 'Client not found'], 404);
        }
        return response()->json($client);
    }

    public function store(Request $request): JsonResponse
    {
        $client = $this->clientRepository->create($request->all());
        return response()->json($client, 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $client = $this->clientRepository->update($id, $request->all());
        return response()->json($client);
    }

    public function destroy(int $id): JsonResponse
    {
        $deleted = $this->clientRepository->delete($id);
        return response()->json(['success' => $deleted], $deleted ? 200 : 404);
    }

    public function syncToFirebase(): JsonResponse
    {
        $clients = $this->clientRepository->findAll();
        // Convert collection to array if necessary, assuming findAll returns Collection
        // If findAll returns array, this is fine. If it returns Collection, use ->toArray()
        $clientsArray = $clients instanceof \Illuminate\Support\Collection ? $clients->toArray() : $clients;
        
        $result = $this->firebaseService->syncUsers($clientsArray);
        
        return response()->json($result);
    }

    public function syncClientsToFirestore(): JsonResponse
    {
        $clients = $this->clientRepository->findAll();
        $clientsArray = $clients instanceof \Illuminate\Support\Collection ? $clients->toArray() : $clients;

        if (!method_exists($this->firebaseService, 'syncClientsToFirestore')) {
            return response()->json([
                'success' => false,
                'message' => 'Firestore sync not supported',
            ], 500);
        }

        $result = $this->firebaseService->syncClientsToFirestore($clientsArray, 'clients');
        return response()->json($result, ($result['success'] ?? false) ? 200 : 500);
    }
}
