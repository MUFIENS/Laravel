<?php

namespace App\Http\Controllers\Cooperative;

use App\Http\Controllers\Controller;
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
        return Inertia::render('cooperative/index', [
            'activeNav' => 'overview',
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
