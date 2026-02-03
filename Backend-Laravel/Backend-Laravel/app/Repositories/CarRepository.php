<?php

namespace App\Repositories;

use App\Models\Car;
use App\Repositories\Contracts\CarRepositoryInterface;

class CarRepository implements CarRepositoryInterface
{
    public function findAll()
    {
        return Car::with('client')->get();
    }

    public function findById(int $id): ?Car
    {
        return Car::with('client')->find($id);
    }

    public function findByClient(int $clientId)
    {
        return Car::where('client_id', $clientId)->get();
    }

    public function findByStatus(string $status)
    {
        return Car::where('status', $status)->get();
    }

    public function create(array $data): Car
    {
        return Car::create($data);
    }

    public function update(int $id, array $data): Car
    {
        $car = Car::findOrFail($id);
        $car->update($data);
        return $car;
    }

    public function delete(int $id): bool
    {
        return Car::destroy($id) > 0;
    }
}
