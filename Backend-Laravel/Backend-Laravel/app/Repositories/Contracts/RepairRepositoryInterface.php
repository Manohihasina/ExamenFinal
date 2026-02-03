<?php

namespace App\Repositories\Contracts;

use App\Models\Repair;

interface RepairRepositoryInterface
{
    public function findAll();
    public function findById(int $id): ?Repair;
    public function findByCar(int $carId);
    public function startRepair(int $repairId): Repair;
    public function completeRepair(int $repairId): Repair;
    public function create(array $data): Repair;
}
