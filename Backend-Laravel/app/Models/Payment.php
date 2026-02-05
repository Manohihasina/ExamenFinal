<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'firestore_id',
        'waiting_slot_id',
        'client_id',
        'client_name',
        'car_id',
        'interventions',
        'total_price',
        'payment_method',
        'payment_date',
        'status',
    ];

    protected $casts = [
        'interventions' => 'array',
        'total_price' => 'decimal:2',
        'payment_date' => 'datetime',
    ];

    /**
     * Obtenir le client associé à ce paiement
     */
    public function client()
    {
        return $this->belongsTo(Client::class, 'client_id', 'firebase_uid');
    }

    /**
     * Obtenir la voiture associée à ce paiement
     */
    public function car()
    {
        return $this->belongsTo(Car::class, 'car_id', 'firebase_id');
    }

    /**
     * Scope pour les paiements d'un client spécifique
     */
    public function scopeForClient($query, $clientId)
    {
        return $query->where('client_id', $clientId);
    }

    /**
     * Scope pour les paiements par statut
     */
    public function scopeWithStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope pour les paiements récents
     */
    public function scopeRecent($query, $days = 30)
    {
        return $query->where('payment_date', '>=', now()->subDays($days));
    }
}
