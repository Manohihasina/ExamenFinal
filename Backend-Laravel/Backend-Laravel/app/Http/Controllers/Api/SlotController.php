<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RepairSlot;
use App\Models\Car;
use App\Services\FirebaseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SlotController extends Controller
{
    private FirebaseService $firebaseService;

    public function __construct(FirebaseService $firebaseService)
    {
        $this->firebaseService = $firebaseService;
    }

    public function assign(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slot_number' => 'required|integer|in:1,2',
            'car_id' => 'required|exists:cars,id',
        ]);

        $slot = RepairSlot::where('slot_number', $validated['slot_number'])->first();
        
        if (!$slot) {
            $slot = RepairSlot::create([
                'slot_number' => $validated['slot_number'],
                'status' => 'available'
            ]);
        }

        if ($slot->status !== 'available') {
            return response()->json([
                'error' => 'Slot is not available'
            ], 400);
        }

        $slot->update([
            'car_id' => $validated['car_id'],
            'status' => 'occupied'
        ]);

        // Push to Firebase
        $slotData = $slot->load('car.client')->toArray();
        $this->firebaseService->syncData("slots/{$slot->slot_number}", $slotData);

        return response()->json([
            'message' => 'Car assigned to slot and synced to Firebase',
            'slot' => $slot->load('car.client')
        ]);
    }

    public function release(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'slot_number' => 'required|integer|in:1,2',
        ]);

        $slot = RepairSlot::where('slot_number', $validated['slot_number'])->first();
        
        if (!$slot || $slot->status === 'available') {
            return response()->json([
                'error' => 'Slot is already available'
            ], 400);
        }

        $slot->update([
            'car_id' => null,
            'status' => 'available'
        ]);

        // Push to Firebase
        $this->firebaseService->syncData("slots/{$slot->slot_number}", [
            'slot_number' => $slot->slot_number,
            'status' => 'available',
            'car_id' => null
        ]);

        return response()->json([
            'message' => 'Slot released and synced to Firebase',
            'slot' => $slot
        ]);
    }

    public function status(): JsonResponse
    {
        $slots = RepairSlot::with('car.client')->get();
        
        // Push to Firebase
        $slotsData = $slots->mapWithKeys(function ($slot) {
            return [$slot->slot_number => $slot->toArray()];
        })->toArray();
        
        $this->firebaseService->syncData('slots', $slotsData);

        return response()->json([
            'message' => 'Slots status synced to Firebase',
            'slots' => $slots
        ]);
    }
}
