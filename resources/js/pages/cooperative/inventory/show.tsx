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
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
                        <PlusCircle className="h-3 w-3" />
                        {label || 'Restock'}
                    </span>
                );
            case 'sale':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-sky-400">
                        <ArrowDownRight className="h-3 w-3" />
                        {label || 'Penjualan'}
                    </span>
                );
            case 'restore':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/20 bg-purple-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-purple-400">
                        <ArrowUpRight className="h-3 w-3" />
                        {label || 'Pengembalian'}
                    </span>
                );
            case 'adjustment':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-400">
                        <Sliders className="h-3 w-3" />
                        {label || 'Penyesuaian'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#161616] px-2.5 py-0.5 font-mono text-xs font-semibold text-[#A3A3A3]">
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
                <div className="flex flex-col gap-4 border-b border-[#262626] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/cooperative/inventory"
                            className="mb-1.5 inline-flex items-center gap-2 font-mono text-xs font-semibold tracking-wider text-[#E34A27] uppercase transition-colors hover:text-[#cf3e1d]"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Kembali ke Manajemen Stok</span>
                        </Link>
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                            Inventaris: {product.name}
                        </h1>
                        <p className="mt-1 text-sm text-[#A3A3A3]">
                            Buku mutasi stok fisik, saldo unit barang, dan
                            operasi penyesuaian inventaris koperasi.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href={`/cooperative/products/${product.slug}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-[#262626] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#383838] hover:bg-[#1a1a1a]"
                        >
                            <Package className="h-3.5 w-3.5 text-[#A3A3A3]" />
                            <span>Detail Katalog Produk</span>
                        </Link>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-xs text-emerald-300">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-xs text-rose-300">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                        <span className="font-medium">{flash.error}</span>
                    </div>
                )}

                {/* Top Section: Product Summary & Stock Mutation Form */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* Left: Product Overview Card (7 cols) */}
                    <div className="space-y-6 lg:col-span-7">
                        <div className="space-y-5 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                {product.image_path ? (
                                    <img
                                        src={`/storage/${product.image_path}`}
                                        alt={product.name}
                                        className="h-20 w-20 shrink-0 rounded-2xl border border-[#262626] object-cover"
                                    />
                                ) : (
                                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-[#262626] bg-[#181818] text-[#737373]">
                                        <Package className="h-8 w-8" />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        {product.category && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#181818] px-2.5 py-0.5 font-mono text-[10px] font-medium text-[#A3A3A3]">
                                                <Tag className="h-3 w-3 text-[#737373]" />
                                                {product.category.name}
                                            </span>
                                        )}
                                        <span className="font-mono text-xs text-[#525252]">
                                            slug: {product.slug}
                                        </span>
                                    </div>
                                    <h2 className="font-heading text-xl font-bold text-[#F5F2EB]">
                                        {product.name}
                                    </h2>
                                    <p className="line-clamp-2 text-xs leading-relaxed text-[#737373]">
                                        {product.description ||
                                            'Tidak ada deskripsi tambahan.'}
                                    </p>
                                </div>
                            </div>

                            {/* Ownership & Stewardship Pillar */}
                            <div className="space-y-3 rounded-xl border border-[#262626] bg-[#161616] p-4">
                                <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#A3A3A3] uppercase">
                                    <ShieldCheck className="h-4 w-4 text-[#E34A27]" />
                                    <span>
                                        Integritas Kepemilikan & Pengelolaan
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <div className="mb-1 font-mono text-[10px] text-[#737373] uppercase">
                                            Pemilik Sah
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold text-[#F5F2EB]">
                                            {product.source_type ===
                                            'student' ? (
                                                <>
                                                    <UserIcon className="h-3.5 w-3.5 text-amber-400" />
                                                    <span className="truncate">
                                                        {product.owner?.name ||
                                                            'Siswa'}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Store className="h-3.5 w-3.5 text-emerald-400" />
                                                    <span>Koperasi Siswa</span>
                                                </>
                                            )}
                                        </div>
                                        {product.owner?.student_identifier && (
                                            <div className="mt-1 font-mono text-[11px] text-[#737373]">
                                                NISN:{' '}
                                                {
                                                    product.owner
                                                        .student_identifier
                                                }
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <div className="mb-1 font-mono text-[10px] text-[#737373] uppercase">
                                            Pengelola & Operator
                                        </div>
                                        <div className="flex items-center gap-1.5 font-semibold text-[#F5F2EB]">
                                            <Boxes className="h-3.5 w-3.5 text-emerald-400" />
                                            <span>Koperasi KOPDIG</span>
                                        </div>
                                        <div className="mt-1 font-mono text-[10px] text-[#737373]">
                                            Kurasi & Mutasi Fisik
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <div className="mb-1 font-mono text-[10px] text-[#737373] uppercase">
                                            Klasifikasi Sumber
                                        </div>
                                        <div className="font-semibold text-[#F5F2EB]">
                                            {product.source_type ===
                                            'student' ? (
                                                <span className="font-mono text-amber-400">
                                                    Konsinyasi Siswa
                                                </span>
                                            ) : (
                                                <span className="font-mono text-emerald-400">
                                                    Pengadaan Koperasi
                                                </span>
                                            )}
                                        </div>
                                        <div className="mt-1 font-mono text-[10px] text-[#525252]">
                                            Status: {product.status}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Commercial Pricing Breakdown */}
                            <div className="grid grid-cols-3 gap-3 rounded-xl border border-[#262626] bg-[#161616] p-3.5 text-center">
                                <div>
                                    <div className="mb-1 font-mono text-[10px] text-[#737373] uppercase">
                                        Harga Dasar
                                    </div>
                                    <PriceDisplay
                                        amount={product.base_price}
                                        className="font-mono text-sm font-semibold text-[#A3A3A3]"
                                    />
                                </div>
                                <div className="border-x border-[#262626] px-2">
                                    <div className="mb-1 font-mono text-[10px] text-[#737373] uppercase">
                                        Margin Koperasi
                                    </div>
                                    <PriceDisplay
                                        amount={product.cooperative_margin}
                                        className="font-mono text-sm font-semibold text-emerald-400"
                                    />
                                </div>
                                <div>
                                    <div className="mb-1 font-mono text-[10px] text-[#737373] uppercase">
                                        Harga Jual Publik
                                    </div>
                                    <PriceDisplay
                                        amount={product.selling_price}
                                        className="font-mono text-sm font-bold text-[#F5F2EB]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Current Stock & Manual Operation Form (5 cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* Current Stock Snapshot Card */}
                        <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-mono text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                    Saldo Fisik Terkini
                                </span>
                                {product.stock_status === 'out_of_stock' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-rose-400">
                                        Habis (0)
                                    </span>
                                ) : product.stock_status === 'low_stock' ? (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-400">
                                        Stok Menipis
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
                                        Stok Aman
                                    </span>
                                )}
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="font-mono text-4xl font-extrabold tracking-tight text-[#F5F2EB] sm:text-5xl">
                                    {product.stock}
                                </span>
                                <span className="font-mono text-xs text-[#737373]">
                                    unit fisik tersedia
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 border-t border-[#1F1F1F] pt-2 font-mono text-[11px] text-[#525252]">
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
                        <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                            <div className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-wider text-[#A3A3A3] uppercase">
                                <Sliders className="h-4 w-4 text-[#E34A27]" />
                                <span>Operasi Mutasi Stok Fisik</span>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Operation Type Selector */}
                                <div>
                                    <label className="mb-1.5 block font-mono text-xs font-medium text-[#A3A3A3]">
                                        Jenis Mutasi
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTypeChange('restock')
                                            }
                                            className={`rounded-xl border px-3 py-2 text-center font-mono text-xs font-semibold transition-all ${
                                                operationType === 'restock'
                                                    ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-400 shadow-xs'
                                                    : 'border-[#262626] bg-[#161616] text-[#A3A3A3] hover:border-[#383838]'
                                            }`}
                                        >
                                            Restock Masuk (+)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleTypeChange('adjustment')
                                            }
                                            className={`rounded-xl border px-3 py-2 text-center font-mono text-xs font-semibold transition-all ${
                                                operationType === 'adjustment'
                                                    ? 'border-amber-500/30 bg-amber-950/40 text-amber-400 shadow-xs'
                                                    : 'border-[#262626] bg-[#161616] text-[#A3A3A3] hover:border-[#383838]'
                                            }`}
                                        >
                                            Penyesuaian Opname
                                        </button>
                                    </div>
                                    {errors.type && (
                                        <p className="mt-1 font-mono text-xs text-rose-400">
                                            {errors.type}
                                        </p>
                                    )}
                                </div>

                                {/* Adjustment Direction Selector (only shown if type is adjustment) */}
                                {operationType === 'adjustment' && (
                                    <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3">
                                        <label className="block font-mono text-xs font-medium text-[#A3A3A3]">
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
                                                className={`rounded-xl border px-2.5 py-1.5 text-center font-mono text-xs font-medium transition-colors ${
                                                    adjustmentDirection ===
                                                    'addition'
                                                        ? 'border-amber-500/40 bg-amber-950/40 font-semibold text-amber-400 shadow-xs'
                                                        : 'border-[#262626] text-[#737373] hover:text-[#A3A3A3]'
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
                                                className={`rounded-xl border px-2.5 py-1.5 text-center font-mono text-xs font-medium transition-colors ${
                                                    adjustmentDirection ===
                                                    'subtraction'
                                                        ? 'border-rose-500/40 bg-rose-950/40 font-semibold text-rose-400 shadow-xs'
                                                        : 'border-[#262626] text-[#737373] hover:text-[#A3A3A3]'
                                                }`}
                                            >
                                                - Kurang (Rusak/Hilang)
                                            </button>
                                        </div>
                                        {errors.adjustment_direction && (
                                            <p className="font-mono text-xs text-rose-400">
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
                                            className="block font-mono text-xs font-medium text-[#A3A3A3]"
                                        >
                                            Jumlah Unit
                                        </label>
                                        <span className="font-mono text-[11px] text-[#737373]">
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
                                        className="w-full rounded-xl border border-[#262626] bg-[#161616] px-3.5 py-2.5 font-mono text-sm text-[#F5F2EB] focus:border-[#E34A27] focus:outline-hidden"
                                        placeholder="Contoh: 10"
                                        required
                                    />
                                    {errors.quantity && (
                                        <p className="mt-1 font-mono text-xs text-rose-400">
                                            {errors.quantity}
                                        </p>
                                    )}
                                </div>

                                {/* Reason / Note Input */}
                                <div>
                                    <label
                                        htmlFor="reason"
                                        className="mb-1.5 block font-mono text-xs font-medium text-[#A3A3A3]"
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
                                        className="w-full rounded-xl border border-[#262626] bg-[#161616] px-3.5 py-2.5 text-xs text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:outline-hidden"
                                        placeholder={
                                            operationType === 'restock'
                                                ? 'Contoh: Penerimaan stok tambahan dari siswa / pemasok'
                                                : 'Contoh: Penyesuaian opname fisik mingguan / barang rusak'
                                        }
                                        required
                                    />
                                    {errors.reason && (
                                        <p className="mt-1 font-mono text-xs text-rose-400">
                                            {errors.reason}
                                        </p>
                                    )}
                                </div>

                                {/* Live Resulting Stock Preview Card */}
                                <div
                                    className={`flex items-center justify-between rounded-xl border p-3 font-mono text-xs ${
                                        isSubtractionInvalid
                                            ? 'border-rose-500/20 bg-rose-950/30 text-rose-400'
                                            : 'border-[#262626] bg-[#161616] text-[#A3A3A3]'
                                    }`}
                                >
                                    <span>Perkiraan Stok Akhir:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#525252] line-through">
                                            {product.stock}
                                        </span>
                                        <span className="text-sm font-bold text-[#F5F2EB]">
                                            &rarr; {resultingStock} unit
                                        </span>
                                    </div>
                                </div>

                                {isSubtractionInvalid && (
                                    <div className="flex items-start gap-1.5 font-mono text-xs text-rose-400">
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
                                    className="w-full rounded-xl bg-[#E34A27] px-4 py-3 font-mono text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#cf3e1d] disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="space-y-4 overflow-hidden rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                    <div className="flex flex-col gap-2 border-b border-[#262626] pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <History className="h-5 w-5 text-[#E34A27]" />
                            <div>
                                <h3 className="font-heading text-base font-bold text-[#F5F2EB]">
                                    Buku Riwayat Mutasi Inventaris
                                </h3>
                                <p className="text-xs text-[#737373]">
                                    Catatan audit permanen seluruh pergerakan
                                    stok (restock, penjualan, dan penyesuaian).
                                </p>
                            </div>
                        </div>

                        <div className="font-mono text-xs text-[#525252]">
                            Total {movements.total} catatan
                        </div>
                    </div>

                    {movements.data.length === 0 ? (
                        <div className="p-10 text-center text-[#737373]">
                            <Boxes className="mx-auto mb-2 h-10 w-10 text-[#525252]" />
                            <div className="text-sm font-medium text-[#F5F2EB]">
                                Belum ada riwayat mutasi
                            </div>
                            <div className="mt-0.5 text-xs text-[#525252]">
                                Seluruh aktivitas penjualan dan penyesuaian stok
                                akan tercatat otomatis di sini.
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-left text-sm text-[#A3A3A3]">
                                <thead className="border-b border-[#262626] bg-[#161616] font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                                    <tr>
                                        <th className="px-5 py-3">Waktu</th>
                                        <th className="px-5 py-3">
                                            Jenis Mutasi
                                        </th>
                                        <th className="px-5 py-3 text-center">
                                            Perubahan Unit
                                        </th>
                                        <th className="px-5 py-3">
                                            Alasan & Referensi
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Operator / Sistem
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1F1F1F]">
                                    {movements.data.map((movement) => (
                                        <tr
                                            key={movement.id}
                                            className="transition-colors hover:bg-[#161616]/60"
                                        >
                                            <td className="px-5 py-3.5 font-mono text-xs whitespace-nowrap text-[#737373]">
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

                                            <td className="px-5 py-3.5">
                                                {getMovementBadge(
                                                    movement.type,
                                                    movement.type_label,
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-center font-mono">
                                                {movement.quantity > 0 ? (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400">
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                        +{movement.quantity}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-500/20 bg-rose-950/40 px-2.5 py-0.5 font-mono text-xs font-bold text-rose-400">
                                                        <ArrowDownRight className="h-3.5 w-3.5" />
                                                        {movement.quantity}
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-3.5 text-xs">
                                                <div className="font-medium text-[#F5F2EB]">
                                                    {movement.reason ||
                                                        'Mutasi sistem'}
                                                </div>
                                                {movement.reference_type && (
                                                    <div className="mt-0.5 font-mono text-[11px] text-[#737373]">
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

                                            <td className="px-5 py-3.5 text-right font-mono text-xs">
                                                <span className="text-[#A3A3A3]">
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
                        <div className="flex items-center justify-between gap-4 border-t border-[#262626] pt-4">
                            <div className="font-mono text-xs text-[#737373]">
                                Halaman{' '}
                                <span className="font-medium text-[#F5F2EB]">
                                    {movements.current_page}
                                </span>{' '}
                                dari{' '}
                                <span className="font-medium text-[#F5F2EB]">
                                    {movements.last_page}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                {movements.links.map((link, idx) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={idx}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                                className="rounded-xl border border-[#262626]/40 bg-transparent px-3 py-1.5 font-mono text-xs text-[#525252]"
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
                                            className={`rounded-xl border px-3 py-1.5 font-mono text-xs transition-colors ${
                                                link.active
                                                    ? 'border-[#E34A27] bg-[#E34A27] font-semibold text-white'
                                                    : 'border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
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
