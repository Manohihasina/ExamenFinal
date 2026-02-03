<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WaitingSlot extends Model
{
    use HasFactory;

    protected $table = 'waiting_slot';

    protected $fillable = [
        'car_id',
        'total_cost',
        'is_paid',
    ];

    protected $casts = [
        'total_cost' => 'decimal:2',
        'is_paid' => 'boolean',
    ];

    public function car(): BelongsTo
    {
        return $this->belongsTo(Car::class);
    }

    public function markAsPaid(): void
    {
        $this->update(['is_paid' => true]);
    }
}
