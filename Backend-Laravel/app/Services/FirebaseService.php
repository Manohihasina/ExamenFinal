<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Factory;
use Kreait\Firebase\ServiceAccount;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

class FirebaseService
{
    private $factory;
    private $database;
    private $firestore;
    private $messaging;
    private $auth;

    public function __construct()
    {
        try {
            $keyFile = config('firebase.key_file');
            // If the path is relative, assume it's from project root
            $serviceAccountPath = str_starts_with($keyFile, DIRECTORY_SEPARATOR) || (strlen($keyFile) > 1 && $keyFile[1] === ':')
                ? $keyFile 
                : base_path($keyFile);
            
            if (!file_exists($serviceAccountPath)) {
                // Try storage_path as a fallback if not found at base_path
                $serviceAccountPath = storage_path('app/firebase_credentials.json');
                if (!file_exists($serviceAccountPath)) {
                    throw new \Exception("Firebase credentials file not found.");
                }
            }

            $this->factory = (new Factory)
                ->withServiceAccount($serviceAccountPath);

            $projectId = config('firebase.project_id');
            if ($projectId) {
                $this->factory = $this->factory->withProjectId($projectId);
            }

            $databaseUrl = config('firebase.database_url');
            if ($databaseUrl) {
                $this->factory = $this->factory->withDatabaseUri($databaseUrl);
            }

            $this->database = $databaseUrl ? $this->factory->createDatabase() : null;

            try {
                $this->firestore = method_exists($this->factory, 'createFirestore')
                    ? $this->factory->createFirestore()
                    : null;
            } catch (\Exception $e) {
                Log::error('Firebase Firestore initialization failed: ' . $e->getMessage());
                $this->firestore = null;
            }

            $this->messaging = $this->factory->createMessaging();
            $this->auth = $this->factory->createAuth();
        } catch (\Exception $e) {
            Log::error('Firebase initialization failed: ' . $e->getMessage());
            $this->factory = null;
            $this->database = null;
            $this->firestore = null;
            $this->messaging = null;
            $this->auth = null;
        }
    }

    public function syncData(string $path, $data): bool
    {
        if (!$this->database) {
            Log::error('Firebase not initialized - cannot sync data');
            return false;
        }

        try {
            $this->database->getReference($path)->set($data);
            return true;
        } catch (\Exception $e) {
            Log::error('Firebase sync error: ' . $e->getMessage());
            return false;
        }
    }

    public function getData(string $path)
    {
        if (!$this->database) {
            Log::error('Firebase not initialized - cannot get data');
            return null;
        }

        try {
            return $this->database->getReference($path)->getValue();
        } catch (\Exception $e) {
            Log::error('Firebase get error: ' . $e->getMessage());
            return null;
        }
    }

    public function sendNotification(string $token, string $title, string $body, array $data = []): bool
    {
        if (!$this->messaging) {
            Log::error('Firebase messaging not initialized - cannot send notification');
            return false;
        }

        try {
            $message = CloudMessage::withTarget('token', $token)
                ->withNotification(Notification::create($title, $body))
                ->withData($data);

            $this->messaging->send($message);
            return true;
        } catch (\Exception $e) {
            Log::error('Firebase notification error: ' . $e->getMessage());
            return false;
        }
    }

    public function syncUsers(array $clients): array
    {
        if (!$this->auth) {
            Log::error('Firebase Auth not initialized - cannot sync users');
            return ['success' => false, 'message' => 'Firebase Auth not initialized'];
        }

        $created = 0;
        $updated = 0;
        $errors = 0;

        foreach ($clients as $client) {
            $email = $client['email'] ?? null;
            try {
                if (!$email) {
                    continue;
                }

                $userProperties = [
                    'email' => $email,
                    'emailVerified' => false,
                    'displayName' => $client['name'] ?? '',
                    'disabled' => false,
                ];

                try {
                    $user = $this->auth->getUserByEmail($email);
                    $this->auth->updateUser($user->uid, $userProperties);
                    $updated++;
                } catch (\Kreait\Firebase\Exception\Auth\UserNotFound $e) {
                    $userProperties['password'] = \Str::random(12);
                    $this->auth->createUser($userProperties);
                    $created++;
                }

            } catch (\Exception $e) {
                Log::error("Failed to sync client {$email}: " . $e->getMessage());
                $errors++;
            }
        }

        return [
            'success' => true,
            'stats' => [
                'created' => $created,
                'updated' => $updated,
                'errors' => $errors
            ]
        ];
    }

    public function isAuthAvailable(): bool
    {
        return (bool) $this->auth;
    }

    public function listAuthUsers(int $maxResults = 1000): array
    {
        if (!$this->auth) {
            Log::error('Firebase Auth not initialized - cannot list users');
            return [];
        }

        // Log temporaire pour diagnostiquer
        Log::info('Firebase Auth listing users for project: ' . config('firebase.project_id', 'NOT_SET'));

        $users = [];

        try {
            $userRecords = $this->auth->listUsers($maxResults);

            foreach ($userRecords as $user) {
                $createdAt = null;
                $lastLoginAt = null;

                if (isset($user->metadata)) {
                    if (method_exists($user->metadata, 'createdAt')) {
                        $createdAt = $user->metadata->createdAt();
                    } elseif (property_exists($user->metadata, 'createdAt')) {
                        $createdAt = $user->metadata->createdAt;
                    }

                    if (method_exists($user->metadata, 'lastLoginAt')) {
                        $lastLoginAt = $user->metadata->lastLoginAt();
                    } elseif (property_exists($user->metadata, 'lastLoginAt')) {
                        $lastLoginAt = $user->metadata->lastLoginAt;
                    }
                }

                $users[] = [
                    'uid' => $user->uid,
                    'email' => $user->email ?? '',
                    'name' => $user->displayName ?? '',
                    'phone' => $user->phoneNumber ?? null,
                    'created_at' => $createdAt instanceof \DateTimeInterface ? $createdAt->format(DATE_ATOM) : '',
                    'last_login_at' => $lastLoginAt instanceof \DateTimeInterface ? $lastLoginAt->format(DATE_ATOM) : null,
                    'disabled' => (bool) ($user->disabled ?? false),
                    'email_verified' => (bool) ($user->emailVerified ?? false),
                ];
            }
        } catch (\Exception $e) {
            Log::error('Firebase Auth list users failed: ' . $e->getMessage());
            return [];
        }

        return $users;
    }

    public function isFirestoreAvailable(): bool
    {
        return (bool) $this->firestore;
    }

    public function syncClientsToFirestore(array $clients, string $collectionName = 'clients'): array
    {
        if (!$this->firestore) {
            Log::error('Firebase Firestore not initialized - cannot sync clients');
            return ['success' => false, 'message' => 'Firebase Firestore not initialized'];
        }

        $synced = 0;
        $errors = 0;

        try {
            $collection = $this->firestore->database()->collection($collectionName);

            foreach ($clients as $client) {
                try {
                    $id = $client['id'] ?? null;
                    if ($id === null || $id === '') {
                        continue;
                    }

                    $collection->document((string) $id)->set($client, ['merge' => true]);
                    $synced++;
                } catch (\Exception $e) {
                    $errors++;
                    Log::error('Firestore client sync failed: ' . $e->getMessage());
                }
            }

            return [
                'success' => true,
                'stats' => [
                    'synced' => $synced,
                    'errors' => $errors,
                ],
            ];
        } catch (\Exception $e) {
            Log::error('Firestore sync failed: ' . $e->getMessage());
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function getFirestoreCollection(string $collectionName): array
    {
        if (!$this->firestore) {
            Log::error('Firebase Firestore not initialized - cannot read collection');
            return [];
        }

        $documents = $this->firestore->database()->collection($collectionName)->documents();
        $items = [];

        foreach ($documents as $document) {
            if (!$document->exists()) {
                continue;
            }

            $data = $document->data();
            if (!array_key_exists('id', $data)) {
                $data['id'] = ctype_digit($document->id()) ? (int) $document->id() : $document->id();
            }

            $items[] = $data;
        }

        return $items;
    }

    public function storeDocument(string $collection, string $documentId, array $data): bool
    {
        if (!$this->firestore) {
            Log::error('Firebase Firestore not initialized - cannot store document');
            return false;
        }

        try {
            $collection = $this->firestore->database()->collection($collection);
            $collection->document($documentId)->set($data);
            
            Log::info("Document {$documentId} stored in collection {$collection}");
            return true;
        } catch (\Exception $e) {
            Log::error('Firestore store document failed: ' . $e->getMessage());
            return false;
        }
    }

    public function getCarsWithGroupedRepairs(): array
    {
        if (!$this->database) {
            Log::error('Firebase Realtime Database not initialized - cannot get cars with repairs');
            return [];
        }

        try {
            // Get all repairs from Realtime Database
            $repairsData = $this->getData('repairs');
            if (!$repairsData) {
                return [];
            }

            // Get all cars from Realtime Database
            $carsData = $this->getData('cars');
            if (!$carsData) {
                $carsData = [];
            }

            // Get only required users from Firebase Auth (optimization)
            $users = [];
            $requiredUserIds = [];
            
            // First pass: collect all required user IDs
            foreach ($repairsData as $repair) {
                $userId = $repair['userId'] ?? null;
                if ($userId && !in_array($userId, $requiredUserIds)) {
                    $requiredUserIds[] = $userId;
                }
            }
            
            // Get only the users we need (much faster than listUsers(1000))
            try {
                if ($this->auth && !empty($requiredUserIds)) {
                    foreach ($requiredUserIds as $userId) {
                        try {
                            $user = $this->auth->getUser($userId);
                            $users[$userId] = [
                                'id' => $user->uid,
                                'name' => $user->displayName ?? $user->email ?? 'Utilisateur inconnu',
                                'email' => $user->email ?? '',
                                'phone' => $user->phoneNumber ?? null
                            ];
                        } catch (\Exception $e) {
                            // User not found, create fallback
                            $users[$userId] = [
                                'id' => $userId,
                                'name' => 'Client inconnu',
                                'email' => '',
                                'phone' => null
                            ];
                        }
                    }
                }
            } catch (\Exception $e) {
                Log::warning('Could not fetch users from Firebase Auth: ' . $e->getMessage());
            }

            // Group repairs by carId and collect user IDs
            $repairsByCar = [];
            $carIds = [];
            $userIds = [];
            
            foreach ($repairsData as $repairId => $repair) {
                $carId = $repair['carId'] ?? null;
                $userId = $repair['userId'] ?? null;
                
                if ($carId) {
                    if (!isset($repairsByCar[$carId])) {
                        $repairsByCar[$carId] = [];
                    }
                    $carIds[] = $carId;
                    
                    if ($userId) {
                        $userIds[] = $userId;
                    }
                    
                    $repairsByCar[$carId][] = [
                        'id' => $repairId,
                        'interventionId' => $repair['interventionId'] ?? null,
                        'interventionName' => $repair['interventionName'] ?? '',
                        'interventionPrice' => $repair['interventionPrice'] ?? 0,
                        'interventionDuration' => $repair['interventionDuration'] ?? 0,
                        'status' => $repair['status'] ?? 'pending',
                        'userId' => $userId,
                        'completedNotified' => $repair['completedNotified'] ?? false,
                        'halfwayNotified' => $repair['halfwayNotified'] ?? false,
                        'startedAt' => $repair['startedAt'] ?? null,
                        'created_at' => $repair['created_at'] ?? null,
                        'updated_at' => $repair['updated_at'] ?? null
                    ];
                }
            }

            // Sort repairs by date for each car (most recent first)
            foreach ($repairsByCar as $carId => &$repairs) {
                usort($repairs, function($a, $b) {
                    $dateA = $a['startedAt'] ?? $a['created_at'] ?? 0;
                    $dateB = $b['startedAt'] ?? $b['created_at'] ?? 0;
                    return $dateB - $dateA; // Reverse order for most recent first
                });
            }

            // Build result with real car data and client information
            $result = [];
            $uniqueCarIds = array_unique($carIds);
            
            foreach ($uniqueCarIds as $carId) {
                // Get car data from Realtime Database or create fallback
                $carInfo = $carsData[$carId] ?? null;
                $userId = null;
                
                // Find the user ID from repairs for this car
                if (isset($repairsByCar[$carId]) && !empty($repairsByCar[$carId])) {
                    $userId = $repairsByCar[$carId][0]['userId'];
                }
                
                // Get client information
                $client = $userId ? ($users[$userId] ?? ['id' => $userId, 'name' => 'Client inconnu', 'email' => '']) : null;
                
                $result[] = [
                    'id' => $carId,
                    'make' => $carInfo['brand'] ?? $carInfo['make'] ?? 'Voiture inconnue',
                    'model' => $carInfo['model'] ?? 'Modèle inconnu',
                    'year' => $carInfo['year'] ?? 2020,
                    'license_plate' => $carInfo['licensePlate'] ?? $carInfo['license_plate'] ?? 'Inconnue',
                    'client_id' => $userId,
                    'client' => $client,
                    'status' => $carInfo['status'] ?? 'active',
                    'created_at' => $carInfo['created_at'] ?? date('Y-m-d H:i:s'),
                    'updated_at' => $carInfo['updated_at'] ?? date('Y-m-d H:i:s'),
                    'repairs' => $repairsByCar[$carId] ?? []
                ];
            }

            Log::info('getCarsWithGroupedRepairs: Retrieved ' . count($result) . ' cars with repairs');
            return $result;
        } catch (\Exception $e) {
            Log::error('Firebase getCarsWithGroupedRepairs failed: ' . $e->getMessage());
            return [];
        }
    }

    public function getClientRepairHistory(string $clientId): array
    {
        if (!$this->database) {
            Log::error('Firebase Realtime Database not initialized - cannot get client repair history');
            return [];
        }

        try {
            // Get all repairs from Realtime Database
            $repairsData = $this->getData('repairs');
            if (!$repairsData) {
                return [];
            }

            // Get all cars from Realtime Database
            $carsData = $this->getData('cars');
            if (!$carsData) {
                $carsData = [];
            }

            // Get client information from Firebase Auth
            $client = null;
            try {
                if ($this->auth) {
                    $user = $this->auth->getUser($clientId);
                    $client = [
                        'id' => $user->uid,
                        'name' => $user->displayName ?? $user->email ?? 'Utilisateur inconnu',
                        'email' => $user->email ?? '',
                        'phone' => $user->phoneNumber ?? null
                    ];
                }
            } catch (\Exception $e) {
                Log::warning('Could not fetch client from Firebase Auth: ' . $e->getMessage());
                $client = [
                    'id' => $clientId,
                    'name' => 'Client inconnu',
                    'email' => '',
                    'phone' => null
                ];
            }

            // Filter repairs for this specific client
            $clientRepairs = [];
            $carIds = [];
            
            foreach ($repairsData as $repairId => $repair) {
                $userId = $repair['userId'] ?? null;
                $carId = $repair['carId'] ?? null;
                
                if ($userId === $clientId && $carId) {
                    $carIds[] = $carId;
                    
                    $clientRepairs[] = [
                        'id' => $repairId,
                        'interventionId' => $repair['interventionId'] ?? null,
                        'interventionName' => $repair['interventionName'] ?? '',
                        'interventionPrice' => $repair['interventionPrice'] ?? 0,
                        'interventionDuration' => $repair['interventionDuration'] ?? 0,
                        'status' => $repair['status'] ?? 'pending',
                        'carId' => $carId,
                        'completedNotified' => $repair['completedNotified'] ?? false,
                        'halfwayNotified' => $repair['halfwayNotified'] ?? false,
                        'startedAt' => $repair['startedAt'] ?? null,
                        'completedAt' => $repair['completedAt'] ?? null,
                        'created_at' => $repair['created_at'] ?? null,
                        'updated_at' => $repair['updated_at'] ?? null
                    ];
                }
            }

            // Sort repairs by date (most recent first)
            usort($clientRepairs, function($a, $b) {
                $dateA = $a['startedAt'] ?? $a['created_at'] ?? 0;
                $dateB = $b['startedAt'] ?? $b['created_at'] ?? 0;
                return $dateB - $dateA; // Reverse order for most recent first
            });

            // Get car information for each repair
            $uniqueCarIds = array_unique($carIds);
            $cars = [];
            
            foreach ($uniqueCarIds as $carId) {
                $carInfo = $carsData[$carId] ?? null;
                $cars[$carId] = [
                    'id' => $carId,
                    'make' => $carInfo['brand'] ?? $carInfo['make'] ?? 'Voiture inconnue',
                    'model' => $carInfo['model'] ?? 'Modèle inconnu',
                    'year' => $carInfo['year'] ?? 2020,
                    'license_plate' => $carInfo['licensePlate'] ?? $carInfo['license_plate'] ?? 'Inconnue'
                ];
            }

            // Attach car information to repairs
            foreach ($clientRepairs as &$repair) {
                $carId = $repair['carId'];
                $repair['car'] = $cars[$carId] ?? [
                    'id' => $carId,
                    'make' => 'Voiture inconnue',
                    'model' => 'Modèle inconnu',
                    'year' => 2020,
                    'license_plate' => 'Inconnue'
                ];
            }

            // Calculate statistics
            $totalAmount = array_sum(array_column($clientRepairs, 'interventionPrice'));
            $completedRepairs = count(array_filter($clientRepairs, fn($r) => $r['status'] === 'completed'));
            $pendingRepairs = count(array_filter($clientRepairs, fn($r) => $r['status'] === 'pending'));
            $inProgressRepairs = count(array_filter($clientRepairs, fn($r) => $r['status'] === 'in_progress'));

            Log::info('getClientRepairHistory: Retrieved ' . count($clientRepairs) . ' repairs for client ' . $clientId);
            
            return [
                'client' => $client,
                'repairs' => $clientRepairs,
                'statistics' => [
                    'total_repairs' => count($clientRepairs),
                    'total_amount' => $totalAmount,
                    'completed_repairs' => $completedRepairs,
                    'pending_repairs' => $pendingRepairs,
                    'in_progress_repairs' => $inProgressRepairs
                ]
            ];
        } catch (\Exception $e) {
            Log::error('Firebase getClientRepairHistory failed: ' . $e->getMessage());
            return [];
        }
    }

    public function createRepairSlot(array $slotData): bool
    {
        if (!$this->database) {
            Log::error('Firebase Realtime Database not initialized - cannot create repair slot');
            return false;
        }

        try {
            // Get current slots to determine the next slot number
            $slotsData = $this->getData('repair_slots');
            $nextSlotNumber = 1;
            
            if ($slotsData && is_array($slotsData)) {
                $maxSlotNumber = 0;
                foreach ($slotsData as $slot) {
                    $slotNumber = $slot['slot_number'] ?? 0;
                    if ($slotNumber > $maxSlotNumber) {
                        $maxSlotNumber = $slotNumber;
                    }
                }
                $nextSlotNumber = $maxSlotNumber + 1;
            }

            // Prepare the new slot data
            $newSlot = [
                'id' => $nextSlotNumber,
                'slot_number' => $nextSlotNumber,
                'car_id' => $slotData['car_id'] ?? null,
                'status' => $slotData['status'] ?? 'available',
                'created_at' => now()->toISOString(),
                'updated_at' => now()->toISOString()
            ];

            // Create the new slot in Firebase
            $result = $this->database->getReference('repair_slots/' . $nextSlotNumber)->set($newSlot);
            
            Log::info("Created new repair slot {$nextSlotNumber} with car_id: " . ($slotData['car_id'] ?? 'none'));
            return true;
        } catch (\Exception $e) {
            Log::error('Firebase createRepairSlot failed: ' . $e->getMessage());
            return false;
        }
    }

    public function getRepairSlots(): array
    {
        if (!$this->database) {
            Log::error('Firebase Realtime Database not initialized - cannot get repair slots');
            return [];
        }

        try {
            $slotsData = $this->getData('repair_slots');
            if (!$slotsData) {
                return [];
            }

            $slots = [];
            foreach ($slotsData as $slotId => $slot) {
                $slots[] = [
                    'id' => $slot['id'] ?? $slotId,
                    'slot_number' => $slot['slot_number'] ?? $slotId,
                    'car_id' => $slot['car_id'] ?? null,
                    'status' => $slot['status'] ?? 'available',
                    'created_at' => $slot['created_at'] ?? null,
                    'updated_at' => $slot['updated_at'] ?? null
                ];
            }

            // Sort by slot number
            usort($slots, function($a, $b) {
                return $a['slot_number'] - $b['slot_number'];
            });

            return $slots;
        } catch (\Exception $e) {
            Log::error('Firebase getRepairSlots failed: ' . $e->getMessage());
            return [];
        }
    }
}
