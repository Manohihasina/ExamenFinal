<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RepairController;
use App\Http\Controllers\Api\InterventionController;
use App\Http\Controllers\Api\RepairSlotController;
use App\Http\Controllers\Api\CarController;
use App\Http\Controllers\Api\ClientController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WaitingSlotController;
use App\Http\Controllers\Api\TestController;
use App\Http\Controllers\API\FCMTokenController;
use App\Http\Controllers\PaymentController;

// Test routes
Route::prefix('test')->group(function () {
    Route::get('/firebase', [TestController::class, 'testFirebase']);
    Route::get('/data', [TestController::class, 'showData']);
});

// Cars
Route::prefix('cars')->group(function () {
    Route::get('/', [CarController::class, 'index']);
    Route::get('/{id}', [CarController::class, 'show']);
    Route::get('/client/{clientId}', [CarController::class, 'byClient']);
    Route::get('/status/{status}', [CarController::class, 'byStatus']);
    Route::post('/', [CarController::class, 'store']);
    Route::put('/{id}', [CarController::class, 'update']);
    Route::delete('/{id}', [CarController::class, 'destroy']);
});

// Clients
Route::prefix('clients')->group(function () {
    Route::get('/', [ClientController::class, 'index']);
    Route::get('/sync', [ClientController::class, 'syncToFirebase']);
    Route::get('/firebase', [ClientController::class, 'indexFromFirestore']);
    Route::get('/firestore/sync', [ClientController::class, 'syncClientsToFirestore']);
    Route::get('/cars-with-repairs', [ClientController::class, 'getCarsWithGroupedRepairs']);
    Route::get('/{clientId}/repair-history', [ClientController::class, 'getClientRepairHistory']);
    Route::get('/{id}', [ClientController::class, 'show'])->whereNumber('id');
    Route::post('/', [ClientController::class, 'store']);
    Route::put('/{id}', [ClientController::class, 'update'])->whereNumber('id');
    Route::delete('/{id}', [ClientController::class, 'destroy'])->whereNumber('id');
});

// Interventions
Route::prefix('interventions')->group(function () {
    Route::get('/', [InterventionController::class, 'index']);
    Route::get('/firebase', [InterventionController::class, 'firebase']);
    Route::get('/active', [InterventionController::class, 'active']);
    Route::get('/{id}', [InterventionController::class, 'show']);
    Route::post('/', [InterventionController::class, 'store']);
    Route::put('/{id}', [InterventionController::class, 'update']);
    Route::post('/{id}/disable', [InterventionController::class, 'disable']);
});

// Repairs
Route::prefix('repairs')->group(function () {
    Route::get('/', [RepairController::class, 'index']);
    Route::get('/{id}', [RepairController::class, 'show']);
    Route::get('/car/{carId}', [RepairController::class, 'byCar']);
    Route::post('/', [RepairController::class, 'store']);
    Route::post('/{id}/start', [RepairController::class, 'start']);
    Route::post('/{id}/complete', [RepairController::class, 'complete']);
});

// Repair Slots
Route::prefix('slots')->group(function () {
    Route::get('/', [RepairSlotController::class, 'index']);
    Route::post('/', [RepairSlotController::class, 'store']);
    Route::get('/available', [RepairSlotController::class, 'available']);
    Route::get('/number/{slotNumber}', [RepairSlotController::class, 'show']);
    Route::post('/{slotId}/occupy', [RepairSlotController::class, 'occupy']);
    Route::post('/{slotId}/free', [RepairSlotController::class, 'free']);
});

// Users
Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);
    Route::get('/{id}', [UserController::class, 'show']);
    Route::get('/email/search', [UserController::class, 'byEmail']);
    Route::post('/', [UserController::class, 'store']);
    Route::put('/{id}', [UserController::class, 'update']);
    Route::delete('/{id}', [UserController::class, 'destroy']);
});

// Waiting Slots
Route::prefix('waiting-slots')->group(function () {
    Route::get('/', [WaitingSlotController::class, 'index']);
    Route::get('/unpaid', [WaitingSlotController::class, 'unpaid']);
    Route::get('/car/{carId}', [WaitingSlotController::class, 'byCar']);
    Route::post('/', [WaitingSlotController::class, 'store']);
    Route::post('/{id}/pay', [WaitingSlotController::class, 'pay']);
});

// FCM Tokens
Route::middleware('auth:sanctum')->prefix('fcm-token')->group(function () {
    Route::post('/', [FCMTokenController::class, 'store']);
    Route::delete('/', [FCMTokenController::class, 'destroy']);
});

// Payments
Route::prefix('payments')->group(function () {
    Route::get('/', [PaymentController::class, 'index']);
    Route::post('/', [PaymentController::class, 'store']);
    Route::get('/{id}', [PaymentController::class, 'show']);
    Route::put('/{id}/status', [PaymentController::class, 'updateStatus']);
    Route::get('/stats', [PaymentController::class, 'stats']);
});
