import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowLeft,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
    Clock,
    History,
    Package,
    PlusCircle,
    ShieldCheck,
    Sliders,
    Store,
    Tag,
    User as UserIcon,
} from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import type {
    InventoryMovementItem,
    InventoryProductDetail,
} from '@/types/inventory';

type Props = {
    product: InventoryProductDetail;
    movements: {
        data: InventoryMovementItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeInventoryShow({
    product,
    movements,
}: Props) {
    const { flash } = usePage<PageProps>().props;

    const [operationType, setOperationType] = useState<
        'restock' | 'adjustment'
    >('restock');
    const [adjustmentDirection, setAdjustmentDirection] = useState<
        'addition' | 'subtraction'
    >('addition');

    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'restock',
        adjustment_direction: 'addition',
        quantity: 1,
        reason: '',
    });

    const handleTypeChange = (type: 'restock' | 'adjustment') => {
        setOperationType(type);
        setData('type', type);
    };

    const handleDirectionChange = (direction: 'addition' | 'subtraction') => {
        setAdjustmentDirection(direction);
        setData('adjustment_direction', direction);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/cooperative/inventory/${product.slug}/adjust`, {
            preserveScroll: true,
            onSuccess: () => {
                reset('quantity', 'reason');
            },
        });
    };

    // Calculate preview of resulting stock
    const qty = Number(data.quantity) || 0;
    let delta = 0;
    if (operationType === 'restock') {
        delta = qty;
    } else {
        delta = adjustmentDirection === 'addition' ? qty : -qty;
    }
    const resultingStock = product.stock + delta;
    const isSubtractionInvalid =
        operationType === 'adjustment' &&
        adjustmentDirection === 'subtraction' &&
        qty > product.stock;

    const getMovementBadge = (type: string, label: string) => {
        switch (type) {
            case 'restock':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <PlusCircle className="h-3 w-3" />
                        {label || 'Restock'}
                    </span>
                );
            case 'sale':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        <ArrowDownRight className="h-3 w-3" />
                        {label || 'Penjualan'}
                    </span>
                );
            case 'restore':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                        <ArrowUpRight className="h-3 w-3" />
                        {label || 'Pengembalian'}
                    </span>
                );
            case 'adjustment':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <Sliders className="h-3 w-3" />
                        {label || 'Penyesuaian'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {label || type}
                    </span>
                );
        }
    };

    return (
        <CooperativeShell activeNav="inventory">
            <Head title={`Stok ${product.name} — KOPDIG`} />

            <div className="mx-auto max-w-7xl space-y-6 pb-16">
                {/* Back Link & Navigation Header */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/cooperative/inventory"
                            className="mb-1 inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-700 uppercase transition-colors hover:text-emerald-800"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Kembali ke Manajemen Stok</span>
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Inventaris: {product.name}
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Buku mutasi stok fisik, saldo unit barang, dan
                            operasi penyesuaian inventaris koperasi.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/cooperative/products/${product.slug}`}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                            <Package className="h-3.5 w-3.5 text-slate-500" />
                            <span>Detail Katalog Produk</span>
                        </Link>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                        <span className="font-medium">{flash.error}</span>
                    </div>
                )}

                {/* Top Section: Product Summary & Stock Mutation Form */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left: Product Overview Card (7 cols) */}
                    <div className="space-y-6 lg:col-span-7">
                        <div className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                {product.image_path ? (
                                    <img
                                        src={`/storage/${product.image_path}`}
                                        alt={product.name}
                                        className="h-20 w-20 shrink-0 rounded-xl border border-slate-200 object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                                        <Package className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {product.category && (
                                            <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                                <Tag className="h-3 w-3 text-slate-400" />
                                                {product.category.name}
                                            </span>
                                        )}
                                        <span className="font-mono text-xs text-slate-400">
                                            slug: {product.slug}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900">
                                        {product.name}
                                    </h2>
                                    <p className="line-clamp-2 text-xs text-slate-500">
                                        {product.description ||
                                            'Tidak ada deskripsi tambahan.'}
                                    </p>
                                </div>
                            </div>

                            {/* Ownership & Stewardship Pillar */}
                            <div className="space-y-3 rounded-xl border border-slate-200/80 bg-slate-50 p-4">
                                <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                                    <span>
                                        Integritas Kepemilikan & Pengelolaan
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <div className="mb-0.5 text-slate-400">
                                            Pemilik Sah
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                            {product.source_type ===
                                            'student' ? (
                                                <>
                                                    <UserIcon className="h-3.5 w-3.5 text-amber-600" />
                                                    <span className="truncate">
                                                        {product.owner?.name ||
                                                            'Siswa'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Store className="h-3.5 w-3.5 text-emerald-600" />
                                                    <span>Koperasi Siswa</span>
                                                </>
                                            )}
                                        </div>
                                        {product.owner?.student_identifier && (
                                            <div className="mt-0.5 text-[11px] text-slate-400">
                                                NISN:{' '}
                                                {
                                                    product.owner
                                                        .student_identifier
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <div className="mb-0.5 text-slate-400">
                                            Pengelola & Operator
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                                            <Boxes className="h-3.5 w-3.5 text-emerald-600" />
                                            <span>Koperasi KOPDIG</span>
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-400">
                                            Kurasi & Mutasi Fisik
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                        <div className="mb-0.5 text-slate-400">
                                            Klasifikasi Sumber
                                        </div>
                                        <div className="font-semibold text-slate-800">
                                            {product.source_type ===
                                            'student' ? (
                                                <span className="text-amber-700">
                                                    Konsinyasi Siswa
                                                </span>
                                            ) : (
                                                <span className="text-emerald-700">
                                                    Pengadaan Koperasi
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-0.5 text-[11px] text-slate-400">
                                            Status Produk: {product.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Commercial Pricing Breakdown */}
                            <div className="grid grid-cols-3 gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 text-center">
                                <div>
                                    <div className="mb-1 text-xs text-slate-400">
                                        Harga Dasar
                                    </div>
                                    <PriceDisplay
                                        amount={product.base_price}
                                        className="text-sm font-semibold text-slate-700"
                                    />
                                </div>
                                <div className="border-x border-slate-200 px-2">
                                    <div className="mb-1 text-xs text-slate-400">
                                        Margin Koperasi
                                    </div>
                                    <PriceDisplay
                                        amount={product.cooperative_margin}
                                        className="text-sm font-semibold text-emerald-700"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 text-xs text-slate-400">
                                        Harga Jual Publik
                                    </div>
                                    <PriceDisplay
                                        amount={product.selling_price}
                                        className="text-sm font-bold text-slate-900"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Current Stock & Manual Operation Form (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Current Stock Snapshot Card */}
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
                                    Saldo Fisik Terkini
                                </span>
                                {product.stock_status === 'out_of_stock' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                                        Habis (0)
                                    </span>
                                ) : product.stock_status === 'low_stock' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                        Stok Menipis
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                        Stok Aman
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
                                    {product.stock}
                                </span>
                                <span className="text-sm font-medium text-slate-500">
                                    unit fisik tersedia
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 border-t border-slate-100 pt-2 text-xs text-slate-400">
                                <Clock className="h-3.5 w-3.5" />
                                <span>
                                    Terakhir diperbarui:{' '}
                                    {new Date(
                                        product.updated_at || '',
                                    ).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>

                        {/* Manual Stock Operation Form */}
                        <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-slate-700 uppercase">
                                <Sliders className="h-4 w-4 text-emerald-600" />
                                <span>Operasi Mutasi Stok Fisik</span>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Operation Type Selector */}
                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-slate-700">
                                        Jenis Mutasi
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTypeChange('restock')
                                            }
                                            className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all ${
                                                operationType === 'restock'
                                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            Restock Masuk (+)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTypeChange('adjustment')
                                            }
                                            className={`rounded-lg border px-3 py-2 text-center text-xs font-semibold transition-all ${
                                                operationType === 'adjustment'
                                                    ? 'border-amber-500 bg-amber-50 text-amber-700 shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            Penyesuaian Opname
                                        </button>
                                    </div>
                                    {errors.type && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Adjustment Direction Selector (only shown if type is adjustment) */}
                                {operationType === 'adjustment' && (
                                    <div className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                                        <label className="block text-xs font-medium text-slate-700">
                                            Arah Penyesuaian Fisik
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDirectionChange(
                                                        'addition',
                                                    )
                                                }
                                                className={`rounded border px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
                                                    adjustmentDirection ===
                                                    'addition'
                                                        ? 'border-amber-500 bg-white font-semibold text-amber-900 shadow-xs'
                                                        : 'border-amber-200 text-amber-800 hover:bg-white'
                                                }`}
                                            >
                                                + Tambah Fisik
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleDirectionChange(
                                                        'subtraction',
                                                    )
                                                }
                                                className={`rounded border px-2.5 py-1.5 text-center text-xs font-medium transition-colors ${
                                                    adjustmentDirection ===
                                                    'subtraction'
                                                        ? 'border-amber-500 bg-white font-semibold text-rose-700 shadow-xs'
                                                        : 'border-amber-200 text-amber-800 hover:bg-white'
                                                }`}
                                            >
                                                - Kurang (Rusak/Hilang)
                                            </button>
                                        </div>
                                        {errors.adjustment_direction && (
                                            <p className="text-xs text-rose-600">
                                                {errors.adjustment_direction}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Quantity Input */}
                                <div>
                                    <div className="mb-1.5 flex items-center justify-between">
                                        <label
                                            htmlFor="quantity"
                                            className="block text-xs font-medium text-slate-700"
                                        >
                                            Jumlah Unit
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            Efek:{' '}
                                            {delta >= 0 ? `+${delta}` : delta}{' '}
                                            unit
                                        </span>
                                    </div>
                                    <input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        max="100000"
                                        value={data.quantity}
                                        onChange={(e) =>
                                            setData(
                                                'quantity',
                                                parseInt(e.target.value, 10) ||
                                                    0,
                                            )
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                        placeholder="Contoh: 10"
                                        required
                                    />
                                    {errors.quantity && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {errors.quantity}
                                        </p>
                                    )}
                                </div>

                                {/* Reason / Note Input */}
                                <div>
                                    <label
                                        htmlFor="reason"
                                        className="mb-1.5 block text-xs font-medium text-slate-700"
                                    >
                                        Keterangan / Alasan Mutasi
                                    </label>
                                    <textarea
                                        id="reason"
                                        rows={2}
                                        value={data.reason}
                                        onChange={(e) =>
                                            setData('reason', e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                                        placeholder={
                                            operationType === 'restock'
                                                ? 'Contoh: Penerimaan stok tambahan dari siswa / pemasok'
                                                : 'Contoh: Penyesuaian opname fisik mingguan / barang rusak'
                                        }
                                        required
                                    />
                                    {errors.reason && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {errors.reason}
                                        </p>
                                    )}
                                </div>

                                {/* Live Resulting Stock Preview Card */}
                                <div
                                    className={`flex items-center justify-between rounded-lg border p-3 text-xs ${
                                        isSubtractionInvalid
                                            ? 'border-rose-200 bg-rose-50 text-rose-800'
                                            : 'border-slate-200 bg-slate-50 text-slate-700'
                                    }`}
                                >
                                    <span>Perkiraan Stok Akhir:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-slate-400 line-through">
                                            {product.stock}
                                        </span>
                                        <span className="font-mono text-sm font-bold">
                                            &rarr; {resultingStock} unit
                                        </span>
                                    </div>
                                </div>

                                {isSubtractionInvalid && (
                                    <div className="flex items-start gap-1.5 text-xs text-rose-600">
                                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>
                                            Jumlah pengurangan melebihi saldo
                                            stok yang tersedia ({product.stock}{' '}
                                            unit).
                                        </span>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={
                                        processing ||
                                        isSubtractionInvalid ||
                                        qty <= 0
                                    }
                                    className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {processing
                                        ? 'Menyimpan Mutasi...'
                                        : 'Catat Mutasi Stok'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {/* Bottom Section: Stock Movement History Ledger */}
                <div className="space-y-4 overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2">
                            <History className="h-5 w-5 text-emerald-600" />
                            <div>
                                <h3 className="text-base font-bold text-slate-900">
                                    Buku Riwayat Mutasi Inventaris
                                </h3>
                                <p className="text-xs text-slate-500">
                                    Catatan audit permanen seluruh pergerakan
                                    stok (restock, penjualan, dan penyesuaian).
                                </p>
                            </div>
                        </div>

                        <div className="text-xs text-slate-400">
                            Total {movements.total} catatan mutasi
                        </div>
                    </div>

                    {movements.data.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            <Boxes className="mx-auto mb-2 h-10 w-10 text-slate-300" />
                            <div className="text-sm font-medium text-slate-800">
                                Belum ada riwayat mutasi
                            </div>
                            <div className="mt-0.5 text-xs text-slate-400">
                                Seluruh aktivitas penjualan dan penyesuaian stok
                                akan tercatat otomatis di sini.
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-slate-600">
                                <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-600 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Waktu</th>
                                        <th className="px-4 py-3">
                                            Jenis Mutasi
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Perubahan Unit
                                        </th>
                                        <th className="px-4 py-3">
                                            Alasan & Referensi
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Operator / Sistem
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {movements.data.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className="transition-colors hover:bg-slate-50/60"
                                        >
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap text-slate-500">
                                                {new Date(
                                                    movement.created_at,
                                                ).toLocaleString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>

                                            <td className="px-4 py-3">
                                                {getMovementBadge(
                                                    movement.type,
                                                    movement.type_label,
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-center font-mono">
                                                {movement.quantity > 0 ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                        +{movement.quantity}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
                                                        <ArrowDownRight className="h-3.5 w-3.5" />
                                                        {movement.quantity}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-xs">
                                                <div className="font-medium text-slate-800">
                                                    {movement.reason ||
                                                        'Mutasi sistem'}
                                                </div>
                                                {movement.reference_type && (
                                                    <div className="mt-0.5 text-[11px] text-slate-400">
                                                        Ref:{' '}
                                                        {
                                                            movement.reference_type
                                                        }{' '}
                                                        #
                                                        {movement.reference_id ||
                                                            '-'}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-4 py-3 text-right text-xs">
                                                <span className="font-medium text-slate-700">
                                                    {movement.creator_name}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination for movements */}
                    {movements.links.length > 3 && (
                        <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                            <div className="text-xs text-slate-500">
                                Halaman{' '}
                                <span className="font-medium">
                                    {movements.current_page}
                                </span>{' '}
                                dari{' '}
                                <span className="font-medium">
                                    {movements.last_page}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                {movements.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                                className="rounded border border-slate-100 px-3 py-1.5 text-xs text-slate-300"
                                            />
                                        );
                                    }

                                    return (
                                        <Link
                                            key={idx}
                                            href={link.url}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                            className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                                                link.active
                                                    ? 'border-emerald-700 bg-emerald-700 font-semibold text-white'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                            }`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </CooperativeShell>
    );
}
