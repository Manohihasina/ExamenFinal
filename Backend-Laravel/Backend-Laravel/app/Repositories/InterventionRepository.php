<?php

namespace App\Repositories;

use App\Models\Intervention;
use App\Repositories\Contracts\InterventionRepositoryInterface;

class InterventionRepository implements InterventionRepositoryInterface
{
    public function findAll()
    {
        return Intervention::all();
    }

    public function findActive()
    {
        return Intervention::where('is_active', true)->get();
    }

    public function findById(int $id): ?Intervention
    {
        return Intervention::find($id);
    }

    public function create(array $data): Intervention
    {
        return Intervention::create($data);
    }

    public function update(int $id, array $data): Intervention
    {
        $intervention = Intervention::findOrFail($id);
        $intervention->update($data);
        return $intervention;
    }

    public function disable(int $id): Intervention
    {
        $intervention = Intervention::findOrFail($id);
        $intervention->update(['is_active' => false]);
        return $intervention;
    }
}
