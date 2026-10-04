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
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->restrictOnDelete();
            $table->foreignId('pickup_session_id')->nullable()->constrained('pickup_sessions')->nullOnDelete();
            $table->string('order_number', 50)->unique();
            $table->unsignedInteger('queue_number')->nullable();
            $table->string('queue_code', 20)->nullable();
            $table->unsignedBigInteger('subtotal');
            $table->unsignedBigInteger('cooperative_margin_total')->default(0);
            $table->unsignedBigInteger('total');
            $table->string('payment_status', 30)->default('pending')->index();
            $table->string('order_status', 30)->default('pending_payment')->index();
            $table->string('pickup_token_hash', 255)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('ready_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->unique(['pickup_session_id', 'queue_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
