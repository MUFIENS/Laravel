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
        Schema::create('pickup_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100);
            $table->date('pickup_date')->index();
            $table->time('starts_at');
            $table->time('ends_at');
            $table->string('queue_prefix', 10)->default('A');
            $table->string('status', 20)->default('scheduled')->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pickup_sessions');
    }
};
