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
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_token_hash', 255)->nullable()->index()->after('payment_token');
            $table->foreignId('verified_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('cash_received_at')->nullable()->after('paid_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['verified_by']);
            $table->dropColumn(['payment_token_hash', 'verified_by', 'cash_received_at']);
        });
    }
};
