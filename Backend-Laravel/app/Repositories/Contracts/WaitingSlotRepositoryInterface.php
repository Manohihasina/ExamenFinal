<?php

namespace App\Repositories\Contracts;

use App\Models\WaitingSlot;

interface WaitingSlotRepositoryInterface
{
    public function findAll();
    public function findUnpaid();
    public function findByCar(int $carId): ?WaitingSlot;
    public function create(array $data): WaitingSlot;
    public function markAsPaid(int $id): WaitingSlot;
}
