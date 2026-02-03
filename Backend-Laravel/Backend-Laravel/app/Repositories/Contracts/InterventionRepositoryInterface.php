<?php

namespace App\Repositories\Contracts;

use App\Models\Intervention;

interface InterventionRepositoryInterface
{
    public function findAll();
    public function findActive();
    public function findById(int $id): ?Intervention;
    public function create(array $data): Intervention;
    public function update(int $id, array $data): Intervention;
    public function disable(int $id): Intervention;
}
