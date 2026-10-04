<?php

use App\Enums\PaymentStatus;
use App\Enums\ProductSourceType;
use App\Enums\ProductStatus;
use App\Enums\ProductSubmissionStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PickupLog;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\ProductSubmission;
use App\Models\User;
use Illuminate\Database\QueryException;

test('duplicate cart product is prevented by database unique constraint', function () {
    $cart = Cart::factory()->create();
    $product = Product::factory()->create();

    CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'quantity' => 1,
    ]);

    expect(fn () => CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product->id,
        'quantity' => 2,
    ]))->toThrow(QueryException::class);
});

test('queue number uniqueness is enforced within the same pickup session', function () {
    $session1 = PickupSession::factory()->create(['queue_prefix' => 'A']);
    $session2 = PickupSession::factory()->create(['queue_prefix' => 'B']);

    Order::factory()->create([
        'pickup_session_id' => $session1->id,
        'queue_number' => 1,
        'order_number' => 'KD-TEST-001',
    ]);

    // Same session, same queue number must throw QueryException
    expect(fn () => Order::factory()->create([
        'pickup_session_id' => $session1->id,
        'queue_number' => 1,
        'order_number' => 'KD-TEST-002',
    ]))->toThrow(QueryException::class);

    // Different session, same queue number is valid
    $orderInSession2 = Order::factory()->create([
        'pickup_session_id' => $session2->id,
        'queue_number' => 1,
        'order_number' => 'KD-TEST-003',
    ]);

    expect($orderInSession2->queue_number)->toBe(1)
        ->and($orderInSession2->pickup_session_id)->toBe($session2->id);
});

test('physical pickup cannot be logged twice for the same order', function () {
    $coop = User::factory()->cooperative()->create();
    $order = Order::factory()->readyForPickup()->create();

    PickupLog::create([
        'order_id' => $order->id,
        'verified_by' => $coop->id,
        'verified_at' => now(),
        'method' => 'qr',
    ]);

    // Second pickup attempt for same order must fail at database level
    expect(fn () => PickupLog::create([
        'order_id' => $order->id,
        'verified_by' => $coop->id,
        'verified_at' => now(),
        'method' => 'manual',
    ]))->toThrow(QueryException::class);
});

test('historical order item values remain immutable when product changes', function () {
    $product = Product::factory()->create([
        'name' => 'Original Risol',
        'base_price' => 3000,
        'cooperative_margin' => 1000,
        'selling_price' => 4000,
    ]);

    $order = Order::factory()->create();

    $orderItem = OrderItem::create([
        'order_id' => $order->id,
        'product_id' => $product->id,
        'seller_id' => null,
        'product_name' => $product->name,
        'unit_price' => $product->selling_price,
        'base_price' => $product->base_price,
        'cooperative_margin' => $product->cooperative_margin,
        'quantity' => 2,
        'subtotal' => 8000,
    ]);

    // Alter current product pricing, name, and soft-delete it
    $product->update([
        'name' => 'Updated Risol Mayo Super',
        'base_price' => 5000,
        'cooperative_margin' => 2000,
        'selling_price' => 7000,
    ]);
    $product->delete();

    // Re-fetch order item from DB
    $freshItem = $orderItem->fresh();

    expect($freshItem->product_name)->toBe('Original Risol')
        ->and($freshItem->unit_price)->toBe(4000)
        ->and($freshItem->base_price)->toBe(3000)
        ->and($freshItem->cooperative_margin)->toBe(1000)
        ->and($freshItem->subtotal)->toBe(8000);
});

test('product ownership distinguishes cooperative and student consigned products', function () {
    $student = User::factory()->student()->create();

    $coopProduct = Product::factory()->create([
        'source_type' => ProductSourceType::Cooperative,
        'owner_id' => null,
    ]);

    $consignedProduct = Product::factory()->consignment($student)->create();

    expect($coopProduct->isCooperative())->toBeTrue()
        ->and($coopProduct->isConsignment())->toBeFalse()
        ->and($coopProduct->owner)->toBeNull()
        ->and($consignedProduct->isConsignment())->toBeTrue()
        ->and($consignedProduct->isCooperative())->toBeFalse()
        ->and($consignedProduct->owner->id)->toBe($student->id)
        ->and($student->products)->toHaveCount(1)
        ->and($student->products->first()->id)->toBe($consignedProduct->id);
});

test('consignment workflow preserves student ownership and review decisions', function () {
    $student = User::factory()->student()->create();
    $coopOperator = User::factory()->cooperative()->create();
    $category = Category::factory()->create();

    // 1. Student submits product
    $submission = ProductSubmission::create([
        'student_id' => $student->id,
        'category_id' => $category->id,
        'name' => 'Kue Brownies Cokelat',
        'description' => 'Brownies kukus legit lezat',
        'image_path' => 'submissions/brownies.jpg',
        'base_price' => 8000,
        'proposed_stock' => 10,
        'status' => ProductSubmissionStatus::Submitted,
    ]);

    expect($submission->status)->toBe(ProductSubmissionStatus::Submitted)
        ->and($submission->isPending())->toBeTrue()
        ->and($submission->student->id)->toBe($student->id);

    // 2. Cooperative approves with margin
    $coopMargin = 1500;
    $sellingPrice = $submission->base_price + $coopMargin;

    $approvedProduct = Product::create([
        'category_id' => $category->id,
        'owner_id' => $student->id,
        'name' => $submission->name,
        'slug' => 'kue-brownies-cokelat',
        'description' => $submission->description,
        'image_path' => $submission->image_path,
        'source_type' => ProductSourceType::Student,
        'base_price' => $submission->base_price,
        'cooperative_margin' => $coopMargin,
        'selling_price' => $sellingPrice,
        'stock' => $submission->proposed_stock,
        'status' => ProductStatus::Active,
        'published_at' => now(),
    ]);

    $submission->update([
        'product_id' => $approvedProduct->id,
        'cooperative_margin' => $coopMargin,
        'proposed_selling_price' => $sellingPrice,
        'status' => ProductSubmissionStatus::Approved,
        'reviewed_by' => $coopOperator->id,
        'reviewed_at' => now(),
    ]);

    $freshSubmission = $submission->fresh();

    expect($freshSubmission->isApproved())->toBeTrue()
        ->and($freshSubmission->reviewer->id)->toBe($coopOperator->id)
        ->and($freshSubmission->product->id)->toBe($approvedProduct->id)
        ->and($approvedProduct->selling_price)->toBe(9500)
        ->and($approvedProduct->owner->id)->toBe($student->id);
});

test('payment belongs to the correct order and tracks status', function () {
    $order = Order::factory()->create();

    $payment = Payment::create([
        'order_id' => $order->id,
        'provider' => 'midtrans',
        'provider_transaction_id' => 'TRX-12345678',
        'provider_order_id' => $order->order_number,
        'payment_token' => 'SNAP-TOKEN-XYZ',
        'status' => PaymentStatus::Paid,
        'gross_amount' => $order->total,
        'payment_type' => 'qris',
        'paid_at' => now(),
    ]);

    expect($payment->order->id)->toBe($order->id)
        ->and($order->payments)->toHaveCount(1)
        ->and($order->latestPayment->id)->toBe($payment->id)
        ->and($payment->isPaid())->toBeTrue();
});

test('cart subtotal and quantity calculation reflect line items', function () {
    $cart = Cart::factory()->create();

    $product1 = Product::factory()->create(['selling_price' => 5000]);
    $product2 = Product::factory()->create(['selling_price' => 7500]);

    CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product1->id,
        'quantity' => 2,
    ]);

    CartItem::create([
        'cart_id' => $cart->id,
        'product_id' => $product2->id,
        'quantity' => 1,
    ]);

    expect($cart->totalQuantity())->toBe(3)
        ->and($cart->subtotal())->toBe(17500); // (2 * 5000) + (1 * 7500) = 17500
});
