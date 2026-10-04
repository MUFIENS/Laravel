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
            $table->foreignId('order_id')->constrained('orders')->cascadeOnDelete();
            $table->string('provider', 50);
            $table->string('provider_transaction_id', 255)->nullable()->unique();
            $table->string('provider_order_id', 255)->nullable();
            $table->text('payment_token')->nullable();
            $table->string('status', 50)->default('pending')->index();
            $table->unsignedBigInteger('gross_amount');
            $table->string('payment_type', 100)->nullable();
            $table->string('raw_notification_reference', 255)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();
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
