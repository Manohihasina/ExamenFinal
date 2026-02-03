<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cars', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained()->onDelete('cascade');
            $table->string('make');
            $table->string('model');
            $table->string('year');
            $table->string('license_plate')->unique();
            $table->string('color')->nullable();
            $table->string('vin')->unique();
            $table->enum('status', ['available', 'in_repair', 'ready', 'delivered'])->default('available');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cars');
    }
};
