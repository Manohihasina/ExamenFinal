<?php

namespace App\Repositories;

use App\Models\WaitingSlot;
use App\Repositories\Contracts\WaitingSlotRepositoryInterface;

class WaitingSlotRepository implements WaitingSlotRepositoryInterface
{
    public function findAll()
    {
        return WaitingSlot::with('car')->get();
    }

    public function findUnpaid()
    {
        return WaitingSlot::where('is_paid', false)->get();
    }

    public function findByCar(int $carId): ?WaitingSlot
    {
        return WaitingSlot::where('car_id', $carId)->first();
    }

    public function create(array $data): WaitingSlot
    {
        return WaitingSlot::create($data);
    }

    public function markAsPaid(int $id): WaitingSlot
    {
        $slot = WaitingSlot::findOrFail($id);
        $slot->update(['is_paid' => true]);
        return $slot;
    }
}
