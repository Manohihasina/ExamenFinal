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
}
