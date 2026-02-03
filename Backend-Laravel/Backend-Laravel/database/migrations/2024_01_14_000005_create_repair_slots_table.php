<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('repair_slots', function (Blueprint $table) {
            $table->id();
            $table->integer('slot_number'); // 1 ou 2
            $table->foreignId('car_id')->nullable()->constrained()->onDelete('set null');
            $table->enum('status', ['available', 'occupied', 'waiting_payment'])->default('available');
            $table->timestamps();
            
            $table->unique('slot_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('repair_slots');
    }
};
