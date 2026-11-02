<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\PickupLog;
use App\Models\PickupSession;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $coopUser = User::where('email', 'koperasi@kopdig.id')->firstOrFail();
        $budi = User::where('email', 'budi@kopdig.id')->firstOrFail();
        $siti = User::where('email', 'siti@kopdig.id')->firstOrFail();
        $session = PickupSession::where('queue_prefix', 'A')->firstOrFail();

        $risol = Product::where('slug', 'risol-mayo-keju-lumer-homemade')->firstOrFail();
        $teh = Product::where('slug', 'teh-kotak-sosro-melati-200ml')->firstOrFail();
        $pulpen = Product::where('slug', 'pulpen-standard-gel-05mm-hitam')->firstOrFail();

        // 1. Order 1: Ready For Pickup (Budi)
        $order1Number = 'KD-'.date('Ymd').'-0001';
        $order1 = Order::updateOrCreate(
            ['order_number' => $order1Number],
            [
                'user_id' => $budi->id,
                'pickup_session_id' => $session->id,
                'queue_number' => 1,
                'queue_code' => 'A-001',
                'subtotal' => 9000,
                'cooperative_margin_total' => 1000,
                'total' => 9000,
                'payment_status' => PaymentStatus::Paid,
                'order_status' => OrderStatus::ReadyForPickup,
                'pickup_token_hash' => hash('sha256', 'PICKUP-TOKEN-BUDI-001'),
                'paid_at' => now()->subMinutes(15),
                'ready_at' => now()->subMinutes(5),
                'completed_at' => null,
                'cancelled_at' => null,
            ]
        );

        OrderItem::firstOrCreate(
            ['order_id' => $order1->id, 'product_id' => $risol->id],
            [
                'seller_id' => $siti->id,
                'product_name' => $risol->name,
                'unit_price' => 5000,
                'base_price' => 4000,
                'cooperative_margin' => 1000,
                'quantity' => 1,
                'subtotal' => 5000,
            ]
        );

        OrderItem::firstOrCreate(
            ['order_id' => $order1->id, 'product_id' => $teh->id],
            [
                'seller_id' => null,
                'product_name' => $teh->name,
                'unit_price' => 4000,
                'base_price' => 4000,
                'cooperative_margin' => 0,
                'quantity' => 1,
                'subtotal' => 4000,
            ]
        );

        Payment::firstOrCreate(
            ['order_id' => $order1->id],
            [
                'provider' => 'midtrans',
                'provider_transaction_id' => 'TRX-'.Str::random(12),
                'provider_order_id' => $order1Number,
                'payment_token' => Str::random(32),
                'status' => PaymentStatus::Paid,
                'gross_amount' => 9000,
                'payment_type' => 'qris',
                'raw_notification_reference' => '{"transaction_status":"settlement"}',
                'paid_at' => now()->subMinutes(15),
            ]
        );

        // 2. Order 2: Completed with verified PickupLog (Budi yesterday)
        $order2Number = 'KD-'.date('Ymd', strtotime('-1 day')).'-0002';
        $order2 = Order::updateOrCreate(
            ['order_number' => $order2Number],
            [
                'user_id' => $budi->id,
                'pickup_session_id' => $session->id,
                'queue_number' => 2,
                'queue_code' => 'A-002',
                'subtotal' => 3500,
                'cooperative_margin_total' => 0,
                'total' => 3500,
                'payment_status' => PaymentStatus::Paid,
                'order_status' => OrderStatus::Completed,
                'pickup_token_hash' => hash('sha256', 'PICKUP-TOKEN-BUDI-002'),
                'paid_at' => now()->subDay()->addMinutes(10),
                'ready_at' => now()->subDay()->addMinutes(20),
                'completed_at' => now()->subDay()->addMinutes(35),
                'cancelled_at' => null,
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ]
        );
        $order2->created_at = now()->subDay();
        $order2->save();

        OrderItem::firstOrCreate(
            ['order_id' => $order2->id, 'product_id' => $pulpen->id],
            [
                'seller_id' => null,
                'product_name' => $pulpen->name,
                'unit_price' => 3500,
                'base_price' => 3500,
                'cooperative_margin' => 0,
                'quantity' => 1,
                'subtotal' => 3500,
                'created_at' => now()->subDay(),
                'updated_at' => now()->subDay(),
            ]
        );

        PickupLog::updateOrCreate(
            ['order_id' => $order2->id],
            [
                'verified_by' => $coopUser->id,
                'verified_at' => now()->subDay()->addMinutes(35),
                'method' => 'qr',
                'metadata' => [
                    'scanner_type' => 'cooperative_terminal',
                    'session_code' => 'A-002',
                ],
            ]
        );

        // 3. Order 3: 3 days ago (Cookies & Buku Tulis)
        $buku = Product::where('slug', 'buku-tulis-bintang-obor-38-lembar')->first();
        $cookies = Product::where('slug', 'cookies-cokelat-crispy-renyah')->first();
        if ($buku && $cookies) {
            $order3Number = 'KD-'.date('Ymd', strtotime('-3 days')).'-0003';
            $order3 = Order::updateOrCreate(
                ['order_number' => $order3Number],
                [
                    'user_id' => $budi->id,
                    'pickup_session_id' => $session->id,
                    'queue_number' => 3,
                    'queue_code' => 'A-003',
                    'subtotal' => 14000,
                    'cooperative_margin_total' => 1000,
                    'total' => 14000,
                    'payment_status' => PaymentStatus::Paid,
                    'order_status' => OrderStatus::Completed,
                    'pickup_token_hash' => hash('sha256', 'PICKUP-TOKEN-BUDI-003'),
                    'paid_at' => now()->subDays(3)->addMinutes(12),
                    'ready_at' => now()->subDays(3)->addMinutes(25),
                    'completed_at' => now()->subDays(3)->addMinutes(40),
                    'cancelled_at' => null,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(3),
                ]
            );
            $order3->created_at = now()->subDays(3);
            $order3->save();

            OrderItem::firstOrCreate(
                ['order_id' => $order3->id, 'product_id' => $cookies->id],
                [
                    'seller_id' => $siti->id,
                    'product_name' => $cookies->name,
                    'unit_price' => 8000,
                    'base_price' => 7000,
                    'cooperative_margin' => 1000,
                    'quantity' => 1,
                    'subtotal' => 8000,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(3),
                ]
            );

            OrderItem::firstOrCreate(
                ['order_id' => $order3->id, 'product_id' => $buku->id],
                [
                    'seller_id' => null,
                    'product_name' => $buku->name,
                    'unit_price' => 6000,
                    'base_price' => 6000,
                    'cooperative_margin' => 0,
                    'quantity' => 1,
                    'subtotal' => 6000,
                    'created_at' => now()->subDays(3),
                    'updated_at' => now()->subDays(3),
                ]
            );
        }

        // 4. Order 4: 8 days ago (Gantungan Kunci & Dasi OSIS)
        $dasi = Product::where('slug', 'dasi-osis-sma-bordir-resmi')->first();
        $gantungan = Product::where('slug', 'gantungan-kunci-rajut-bunga-handmade')->first();
        if ($dasi && $gantungan) {
            $order4Number = 'KD-'.date('Ymd', strtotime('-8 days')).'-0004';
            $order4 = Order::updateOrCreate(
                ['order_number' => $order4Number],
                [
                    'user_id' => $budi->id,
                    'pickup_session_id' => $session->id,
                    'queue_number' => 4,
                    'queue_code' => 'A-004',
                    'subtotal' => 25000,
                    'cooperative_margin_total' => 2000,
                    'total' => 25000,
                    'payment_status' => PaymentStatus::Paid,
                    'order_status' => OrderStatus::Completed,
                    'pickup_token_hash' => hash('sha256', 'PICKUP-TOKEN-BUDI-004'),
                    'paid_at' => now()->subDays(8)->addMinutes(15),
                    'ready_at' => now()->subDays(8)->addMinutes(30),
                    'completed_at' => now()->subDays(8)->addMinutes(50),
                    'cancelled_at' => null,
                    'created_at' => now()->subDays(8),
                    'updated_at' => now()->subDays(8),
                ]
            );
            $order4->created_at = now()->subDays(8);
            $order4->save();

            OrderItem::firstOrCreate(
                ['order_id' => $order4->id, 'product_id' => $gantungan->id],
                [
                    'seller_id' => $siti->id,
                    'product_name' => $gantungan->name,
                    'unit_price' => 10000,
                    'base_price' => 8000,
                    'cooperative_margin' => 2000,
                    'quantity' => 1,
                    'subtotal' => 10000,
                    'created_at' => now()->subDays(8),
                    'updated_at' => now()->subDays(8),
                ]
            );

            OrderItem::firstOrCreate(
                ['order_id' => $order4->id, 'product_id' => $dasi->id],
                [
                    'seller_id' => null,
                    'product_name' => $dasi->name,
                    'unit_price' => 15000,
                    'base_price' => 15000,
                    'cooperative_margin' => 0,
                    'quantity' => 1,
                    'subtotal' => 15000,
                    'created_at' => now()->subDays(8),
                    'updated_at' => now()->subDays(8),
                ]
            );
        }

        // 3. Active Shopping Cart (Budi)
        $cart = Cart::firstOrCreate(['user_id' => $budi->id]);
        CartItem::updateOrCreate(
            ['cart_id' => $cart->id, 'product_id' => $risol->id],
            ['quantity' => 2]
        );
        CartItem::updateOrCreate(
            ['cart_id' => $cart->id, 'product_id' => $pulpen->id],
            ['quantity' => 1]
        );
    }
}
