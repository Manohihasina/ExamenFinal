<?php

namespace App\Repositories\Contracts;

use App\Models\Car;

interface CarRepositoryInterface
{
    public function findAll();
    public function findById(int $id): ?Car;
    public function findByClient(int $clientId);
    public function findByStatus(string $status);
    public function create(array $data): Car;
    public function update(int $id, array $data): Car;
    public function delete(int $id): bool;
}
