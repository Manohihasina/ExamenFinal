<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'message' => 'Garage Backend API - Firebase Push Service',
        'version' => '1.0.0',
        'endpoints' => [
            'POST /api/repairs/start' => 'Start a new repair',
            'POST /api/repairs/{id}/complete' => 'Complete a repair',
            'GET /api/interventions' => 'List all interventions',
            'POST /api/slots/assign' => 'Assign car to slot',
            'POST /api/slots/release' => 'Release slot',
        ]
    ]);
});


