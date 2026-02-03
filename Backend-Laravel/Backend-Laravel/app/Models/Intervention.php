<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Intervention extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'duration_seconds',
        'description',
        'is_active',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'duration_seconds' => 'integer',
        'is_active' => 'boolean',
    ];

    public function repairs(): HasMany
    {
        return $this->hasMany(Repair::class);
    }
}
