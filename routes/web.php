<?php

use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\Cooperative\CashPaymentVerificationController;
use App\Http\Controllers\Cooperative\ConsignmentReviewController;
use App\Http\Controllers\Cooperative\CooperativeWorkspaceController;
use App\Http\Controllers\Cooperative\InventoryController as CooperativeInventoryController;
use App\Http\Controllers\Cooperative\OrderController as CooperativeOrderController;
use App\Http\Controllers\Cooperative\PickupVerificationController;
use App\Http\Controllers\Cooperative\ProductController as CooperativeProductController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MarketplaceController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Student\ConsignmentController;
use Illuminate\Support\Facades\Route;

// Public marketplace discovery and product detail entry points
Route::get('/', [MarketplaceController::class, 'index'])->name('home');
Route::get('explore', [MarketplaceController::class, 'index'])->name('explore');
Route::get('products/{product}', [ProductController::class, 'show'])->name('products.show');

// Student Shopping Cart routes
Route::middleware(['auth', 'role:student'])
    ->prefix('cart')
    ->name('cart.')
    ->group(function () {
        Route::get('/', [CartController::class, 'index'])->name('index');
        Route::post('items', [CartController::class, 'store'])->name('items.store');
        Route::patch('items/{cartItem}', [CartController::class, 'update'])->name('items.update');
        Route::delete('items/{cartItem}', [CartController::class, 'destroy'])->name('items.destroy');
    });

// Student Checkout routes
Route::middleware(['auth', 'role:student'])->group(function () {
    Route::get('checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout.store');
});

// Order routes (authorized via OrderPolicy)
Route::middleware(['auth'])->group(function () {
    Route::get('orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('orders/{order}', [OrderController::class, 'show'])->name('orders.show');
});

// Authenticated entry point (routes by role)
Route::get('dashboard', DashboardController::class)
    ->middleware(['auth'])
    ->name('dashboard');

// Student-only protected workspace
Route::middleware(['auth', 'role:student'])
    ->prefix('student')
    ->name('student.')
    ->group(function () {
        Route::resource('consignments', ConsignmentController::class)->parameters([
            'consignments' => 'submission',
        ]);
    });

// Cooperative-only protected workspace
Route::middleware(['auth', 'role:cooperative'])
    ->prefix('cooperative')
    ->name('cooperative.')
    ->group(function () {
        // Phase 11A: Cooperative Workspace Overview & Operational Shell
        Route::get('/', [CooperativeWorkspaceController::class, 'index'])->name('index');
        // Phase 11E: Cooperative Order Management Workspace
        Route::get('orders', [CooperativeOrderController::class, 'index'])->name('orders.index');
        Route::get('orders/{order}', [CooperativeOrderController::class, 'show'])->name('orders.show');
        // Phase 11C: Cooperative Product Management Workspace
        Route::get('products', [CooperativeProductController::class, 'index'])->name('products.index');
        Route::get('products/{product}', [CooperativeProductController::class, 'show'])->name('products.show');
        Route::get('products/{product}/edit', [CooperativeProductController::class, 'edit'])->name('products.edit');
        Route::put('products/{product}', [CooperativeProductController::class, 'update'])->name('products.update');
        // Phase 11D: Cooperative Inventory Management Workspace
        Route::get('inventory', [CooperativeInventoryController::class, 'index'])->name('inventory.index');
        Route::get('inventory/{product}', [CooperativeInventoryController::class, 'show'])->name('inventory.show');
        Route::post('inventory/{product}/adjust', [CooperativeInventoryController::class, 'adjust'])->name('inventory.adjust');
        Route::get('reports', [CooperativeWorkspaceController::class, 'reports'])->name('reports.index');

        // Existing functional operational modules:
        Route::get('consignments', [ConsignmentReviewController::class, 'index'])->name('consignments.index');
        Route::get('consignments/{submission}', [ConsignmentReviewController::class, 'show'])->name('consignments.show');
        Route::post('consignments/{submission}/approve', [ConsignmentReviewController::class, 'approve'])->name('consignments.approve');
        Route::post('consignments/{submission}/reject', [ConsignmentReviewController::class, 'reject'])->name('consignments.reject');

        // Phase 10: Operational Pickup Verification & QR Scanning Console
        Route::get('pickup', [PickupVerificationController::class, 'index'])->name('pickup.index');
        Route::post('pickup/verify', [PickupVerificationController::class, 'verify'])->name('pickup.verify');
        Route::post('pickup/complete', [PickupVerificationController::class, 'complete'])->name('pickup.complete');

        // Operational Cash Payment Verification & QR Scanner Console
        Route::get('payments', [CashPaymentVerificationController::class, 'index'])->name('payments.index');
        Route::get('payments/verify', [CashPaymentVerificationController::class, 'index'])->name('payments.verify.page');
        Route::post('payments/verify', [CashPaymentVerificationController::class, 'verify'])->name('payments.verify');
        Route::post('payments/verify/scan', [CashPaymentVerificationController::class, 'verify'])->name('payments.verify.scan');
        Route::post('payments/confirm', [CashPaymentVerificationController::class, 'confirm'])->name('payments.confirm');
        Route::post('payments/verify/confirm', [CashPaymentVerificationController::class, 'confirm'])->name('payments.verify.confirm');
    });

require __DIR__.'/settings.php';
