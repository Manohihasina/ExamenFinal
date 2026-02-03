<?php

namespace App\Repositories\Contracts;

use App\Models\RepairSlot;

interface RepairSlotRepositoryInterface
{
    public function findAll();
    public function findAvailable();
    public function findBySlotNumber(int $slotNumber): ?RepairSlot;
    public function occupy(int $slotId, int $carId): RepairSlot;
    public function free(int $slotId): RepairSlot;
}
