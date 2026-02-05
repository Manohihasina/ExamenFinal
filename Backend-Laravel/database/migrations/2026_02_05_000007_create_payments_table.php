<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->string('firestore_id')->unique()->nullable(); // ID du document Firestore
            $table->string('waiting_slot_id')->nullable(); // Référence au waiting slot
            $table->string('client_id'); // ID du client (Firebase UID)
            $table->string('client_name'); // Nom du client
            $table->string('car_id'); // ID de la voiture
            $table->json('interventions'); // Liste des interventions avec prix
            $table->decimal('total_price', 10, 2); // Prix total
            $table->string('payment_method'); // Méthode de paiement
            $table->timestamp('payment_date'); // Date du paiement
            $table->string('status')->default('paid'); // Statut du paiement
            $table->timestamps();
            
            // Index pour optimiser les requêtes
            $table->index('client_id');
            $table->index('payment_date');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
