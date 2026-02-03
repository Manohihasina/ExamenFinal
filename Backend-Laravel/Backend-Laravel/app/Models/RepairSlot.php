<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RepairSlot extends Model
{
    use HasFactory;

    protected $fillable = [
        'slot_number',
        'car_id',
        'status',
    ];

    protected $casts = [
        'slot_number' => 'integer',
        'status' => 'string',
    ];

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function isOccupied(): bool
    {
        return $this->status === 'occupied';
    }

    public function isWaitingPayment(): bool
    {
        return $this->status === 'waiting_payment';
    }
}
