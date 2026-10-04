<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CooperativeWorkspaceController extends Controller
{
    /**
     * Display the cooperative workspace overview.
     */
    public function index(Request $request): Response
    {
        $pendingPaymentCount = Order::query()
            ->where('order_status', OrderStatus::PendingPayment)
            ->where('payment_status', PaymentStatus::Pending)
            ->count();

        $verifiedPaymentsTodayCount = Payment::query()
            ->where('status', PaymentStatus::Paid)
            ->whereDate('cash_received_at', now()->toDateString())
            ->count();

        $readyForPickupCount = Order::query()
            ->where('order_status', OrderStatus::ReadyForPickup)
            ->count();

        $completedTodayCount = Order::query()
            ->where('order_status', OrderStatus::Completed)
            ->whereDate('completed_at', now()->toDateString())
            ->count();

        $cashReceivedTodayTotal = (int) Payment::query()
            ->where('status', PaymentStatus::Paid)
            ->whereDate('cash_received_at', now()->toDateString())
            ->sum('gross_amount');

        return Inertia::render('cooperative/index', [
            'activeNav' => 'overview',
            'metrics' => [
                'pending_payment_count' => $pendingPaymentCount,
                'verified_payments_today_count' => $verifiedPaymentsTodayCount,
                'ready_for_pickup_count' => $readyForPickupCount,
                'completed_today_count' => $completedTodayCount,
                'cash_received_today_total' => $cashReceivedTodayTotal,
            ],
        ]);
    }

    /**
     * Display the operational order management placeholder.
     */
    public function orders(Request $request): Response
    {
        return Inertia::render('cooperative/placeholder', [
            'module' => 'Pesanan & Antrean',
            'description' => 'Modul manajemen antrean pesanan masuk, pemantauan status pemenuhan, dan riwayat transaksi koperasi sedang disiapkan untuk fase berikutnya.',
            'activeNav' => 'orders',
        ]);
    }

    /**
     * Display the cooperative product management placeholder.
     */
    public function products(Request $request): Response
    {
        return Inertia::render('cooperative/placeholder', [
            'module' => 'Katalog Produk Koperasi',
            'description' => 'Modul inventaris produk koperasi, etalase mandiri, dan pengawasan harga sedang disiapkan untuk fase berikutnya.',
            'activeNav' => 'products',
        ]);
    }

    /**
     * Display the inventory and stock management placeholder.
     */
    public function inventory(Request $request): Response
    {
        return Inertia::render('cooperative/placeholder', [
            'module' => 'Manajemen Stok & Mutasi',
            'description' => 'Modul mutasi inventaris, opname stok fisik, dan log penyesuaian barang sedang disiapkan untuk fase berikutnya.',
            'activeNav' => 'inventory',
        ]);
    }

    /**
     * Display the operational reports placeholder.
     */
    public function reports(Request $request): Response
    {
        return Inertia::render('cooperative/placeholder', [
            'module' => 'Laporan & Pembukuan',
            'description' => 'Modul rekapitulasi penjualan, bagi hasil konsinyasi siswa, dan pelaporan keuangan koperasi sedang disiapkan untuk fase berikutnya.',
            'activeNav' => 'reports',
        ]);
    }
}
