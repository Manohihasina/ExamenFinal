<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

// ===== Repositories Interfaces =====
use App\Repositories\Contracts\UserRepositoryInterface;
use App\Repositories\Contracts\ClientRepositoryInterface;
use App\Repositories\Contracts\CarRepositoryInterface;
use App\Repositories\Contracts\InterventionRepositoryInterface;
use App\Repositories\Contracts\RepairSlotRepositoryInterface;
use App\Repositories\Contracts\RepairRepositoryInterface;
use App\Repositories\Contracts\WaitingSlotRepositoryInterface;

// ===== Repositories Implementations =====
use App\Repositories\UserRepository;
use App\Repositories\ClientRepository;
use App\Repositories\CarRepository;
use App\Repositories\InterventionRepository;
use App\Repositories\RepairSlotRepository;
use App\Repositories\RepairRepository;
use App\Repositories\WaitingSlotRepository;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(UserRepositoryInterface::class, UserRepository::class);
        $this->app->bind(ClientRepositoryInterface::class, ClientRepository::class);
        $this->app->bind(CarRepositoryInterface::class, CarRepository::class);

        $this->app->bind(InterventionRepositoryInterface::class, InterventionRepository::class);
        $this->app->bind(RepairSlotRepositoryInterface::class, RepairSlotRepository::class);
        $this->app->bind(RepairRepositoryInterface::class, RepairRepository::class);
        $this->app->bind(WaitingSlotRepositoryInterface::class, WaitingSlotRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // rien ici 
    }
}
