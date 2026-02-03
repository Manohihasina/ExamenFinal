<?php

namespace App\Repositories;

use App\Models\RepairSlot;
use App\Repositories\Contracts\RepairSlotRepositoryInterface;

class RepairSlotRepository implements RepairSlotRepositoryInterface
{
    public function findAll()
    {
        return RepairSlot::with('car')->get();
    }

    public function findAvailable()
    {
        return RepairSlot::where('status', 'available')->get();
    }

    public function findBySlotNumber(int $slotNumber): ?RepairSlot
    {
        return RepairSlot::where('slot_number', $slotNumber)->first();
    }

    public function occupy(int $slotId, int $carId): RepairSlot
    {
        $slot = RepairSlot::findOrFail($slotId);
        $slot->update([
            'car_id' => $carId,
            'status' => 'occupied'
        ]);
        return $slot;
    }

    public function free(int $slotId): RepairSlot
    {
        $slot = RepairSlot::findOrFail($slotId);
        $slot->update([
            'car_id' => null,
            'status' => 'available'
        ]);
        return $slot;
    }
}
