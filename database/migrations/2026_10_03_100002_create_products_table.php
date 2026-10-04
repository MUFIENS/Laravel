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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->text('description');
            $table->string('image_path', 255)->nullable();
            $table->string('source_type', 20)->default('cooperative')->index();
            $table->unsignedBigInteger('base_price');
            $table->unsignedBigInteger('cooperative_margin')->default(0);
            $table->unsignedBigInteger('selling_price');
            $table->unsignedInteger('stock')->default(0);
            $table->string('status', 20)->default('draft')->index();
            $table->boolean('is_featured')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
