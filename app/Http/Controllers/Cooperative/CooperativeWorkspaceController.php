<?php

namespace App\Http\Controllers\Cooperative;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use Carbon\Carbon;
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
     * Display the operational reports and accounting workspace.
     */
    public function reports(Request $request): Response
    {
        $preset = $request->query('preset');
        $startDate = $request->query('start_date');
        $endDate = $request->query('end_date');
        $status = $request->query('status', 'all');

        // Preset handling
        if ($preset === 'today') {
            $startDate = now()->toDateString();
            $endDate = now()->toDateString();
        } elseif ($preset === 'last_7_days') {
            $startDate = now()->subDays(6)->toDateString();
            $endDate = now()->toDateString();
        } elseif ($preset === 'this_month') {
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->toDateString();
        } elseif ($preset === 'all') {
            $startDate = null;
            $endDate = null;
        } elseif ($startDate && $endDate) {
            if ($startDate === now()->toDateString() && $endDate === now()->toDateString()) {
                $preset = 'today';
            } elseif ($startDate === now()->subDays(6)->toDateString() && $endDate === now()->toDateString()) {
                $preset = 'last_7_days';
            } elseif ($startDate === now()->startOfMonth()->toDateString() && $endDate === now()->toDateString()) {
                $preset = 'this_month';
            } else {
                $preset = 'custom';
            }
        } else {
            // Default: This Month
            $preset = 'this_month';
            $startDate = now()->startOfMonth()->toDateString();
            $endDate = now()->toDateString();
        }

        $query = OrderItem::query()
            ->with([
                'order:id,order_number,created_at,order_status,payment_status,user_id',
                'order.user:id,name',
                'product:id,category_id,name,source_type',
                'product.category:id,name',
                'seller:id,name',
            ]);

        if ($startDate && $endDate) {
            $query->whereHas('order', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay(),
                ]);
            });
        } elseif ($startDate) {
            $query->whereHas('order', function ($q) use ($startDate) {
                $q->where('created_at', '>=', Carbon::parse($startDate)->startOfDay());
            });
        } elseif ($endDate) {
            $query->whereHas('order', function ($q) use ($endDate) {
                $q->where('created_at', '<=', Carbon::parse($endDate)->endOfDay());
            });
        }

        if ($status && $status !== 'all') {
            $query->whereHas('order', function ($q) use ($status) {
                $q->where('order_status', $status);
            });
        }

        $items = $query->orderByDesc('id')->get();

        $transactions = $items->map(function ($item, $index) {
            $order = $item->order;
            $product = $item->product;
            $date = $order?->created_at ?? $item->created_at ?? now();

            return [
                'id' => $item->id,
                'no' => $index + 1,
                'order_id' => $item->order_id,
                'order_number' => $order?->order_number ?? ('ORD-'.$item->order_id),
                'transaction_date' => $date->format('Y-m-d H:i'),
                'transaction_date_formatted' => $date->translatedFormat('d M Y, H:i'),
                'transaction_date_short' => $date->format('d/m/Y'),
                'product_name' => $item->product_name ?? $product?->name ?? 'Produk Koperasi',
                'category_name' => $product?->category?->name ?? 'Umum',
                'source_type' => $product?->source_type ?? ($item->seller_id ? 'student' : 'cooperative'),
                'seller_name' => $item->seller?->name ?? null,
                'buyer_name' => $order?->user?->name ?? 'Siswa KOPDIG',
                'quantity' => (int) $item->quantity,
                'unit_price' => (int) $item->unit_price,
                'total_nominal' => (int) $item->subtotal,
                'status_raw' => $order?->order_status?->value ?? 'pending',
                'status' => match ($order?->order_status?->value ?? '') {
                    'completed' => 'Selesai',
                    'ready_for_pickup' => 'Siap Diambil',
                    'processing' => 'Disiapkan',
                    'paid' => 'Sudah Bayar',
                    'pending_payment' => 'Menunggu Bayar',
                    'cancelled' => 'Dibatalkan',
                    'payment_failed' => 'Gagal',
                    default => 'Diproses',
                },
                'payment_status' => $order?->payment_status?->value ?? 'pending',
            ];
        });

        $totalTransactions = $items->pluck('order_id')->unique()->count();
        $totalItemsSold = (int) $items->sum('quantity');
        $totalRevenue = (int) $items->sum('subtotal');

        return Inertia::render('cooperative/reports/index', [
            'transactions' => $transactions,
            'summary' => [
                'total_transactions' => $totalTransactions,
                'total_items' => $totalItemsSold,
                'total_revenue' => $totalRevenue,
                'total_records' => $transactions->count(),
            ],
            'filters' => [
                'start_date' => $startDate ?? '',
                'end_date' => $endDate ?? '',
                'preset' => $preset,
                'status' => $status,
            ],
            'generated_at' => now()->translatedFormat('d F Y, H:i').' WIB',
        ]);
    }
}
