<?php

namespace App\Repositories;

use App\Models\Repair;
use App\Repositories\Contracts\RepairRepositoryInterface;
use Carbon\Carbon;

class RepairRepository implements RepairRepositoryInterface
{
    public function findAll()
    {
        return Repair::with(['car', 'intervention'])->get();
    }

    public function findById(int $id): ?Repair
    {
        return Repair::find($id);
    }

    public function findByCar(int $carId)
    {
        return Repair::where('car_id', $carId)->get();
    }

    public function create(array $data): Repair
    {
        return Repair::create($data);
    }

    public function startRepair(int $repairId): Repair
    {
        $repair = Repair::findOrFail($repairId);
        $repair->update([
            'status' => 'in_progress',
            'started_at' => Carbon::now()
        ]);
        return $repair;
    }

    public function completeRepair(int $repairId): Repair
    {
        $repair = Repair::findOrFail($repairId);
        $repair->update([
            'status' => 'completed',
            'completed_at' => Carbon::now()
        ]);
        return $repair;
    }
}
