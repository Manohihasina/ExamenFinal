<?php

namespace App\Services;

use App\Models\FcmToken;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    protected $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function sendNotification($fcmToken, $title, $body, $data = []): bool
    {
        try {
            $result = $this->firebaseService->sendNotification($fcmToken, $title, $body, $data);
            
            if (!$result) {
                // Token invalide → désactiver
                FcmToken::where('token', $fcmToken)->update(['is_active' => false]);
                Log::warning("FCM token invalide et désactivé: {$fcmToken}");
            }
            
            return $result;
        } catch (\Throwable $e) {
            // Token invalide → désactiver
            FcmToken::where('token', $fcmToken)->update(['is_active' => false]);
            Log::error("Erreur envoi notification pour token {$fcmToken}: " . $e->getMessage());
            return false;
        }
    }

    public function sendNotificationToUser(User $user, $title, $body, $data = []): int
    {
        $fcmTokens = $user->fcmTokens()->where('is_active', true)->pluck('token');
        $successCount = 0;

        foreach ($fcmTokens as $token) {
            if ($this->sendNotification($token, $title, $body, $data)) {
                $successCount++;
            }
        }

        return $successCount;
    }

    public function sendInterventionNotification($intervention): void
    {
        $user = $intervention->user;
        if (!$user) {
            return;
        }

        $car = $intervention->car;
        $carName = $car ? "{$car->make} {$car->model}" : "Votre voiture";

        $title = "Votre voiture est en réparation";
        $body = "Votre {$carName} est en cours de réparation ({$intervention->name})";
        
        $data = [
            'type' => 'intervention',
            'intervention_id' => $intervention->id,
            'car_id' => $intervention->car_id,
            'user_id' => $intervention->user_id
        ];

        $this->sendNotificationToUser($user, $title, $body, $data);
    }

    public function sendRepairCompletedNotification($repair): void
    {
        $user = $repair->user;
        if (!$user) {
            return;
        }

        $car = $repair->car;
        $carName = $car ? "{$car->make} {$car->model}" : "Votre voiture";

        $title = "Réparation terminée";
        $body = "La réparation de votre {$carName} est terminée !";
        
        $data = [
            'type' => 'repair_completed',
            'repair_id' => $repair->id,
            'intervention_id' => $repair->intervention_id,
            'car_id' => $repair->car_id,
            'user_id' => $repair->user_id
        ];

        $this->sendNotificationToUser($user, $title, $body, $data);
    }
}
