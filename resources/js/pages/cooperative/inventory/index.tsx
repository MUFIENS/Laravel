import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    AlertTriangle,
    ArrowDownRight,
    ArrowUpRight,
    Boxes,
    CheckCircle2,
    Clock,
    History,
    Package,
    RefreshCw,
    Search,
    Store,
    Tag,
    User as UserIcon,
    X,
    XCircle,
} from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import type {
    InventoryFilterParams,
    InventoryProductItem,
    InventoryStats,
} from '@/types/inventory';

type Props = {
    products: {
        data: InventoryProductItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: InventoryStats;
    categories: { id: number; name: string; slug: string }[];
    filters: InventoryFilterParams;
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeInventoryIndex({
    products,
    stats,
    categories,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const sourceOptions = [
        { key: 'all', label: 'Semua Sumber' },
        { key: 'cooperative', label: 'Barang Koperasi' },
        { key: 'student', label: 'Titipan Siswa' },
    ];

    const stockStatusOptions = [
        { key: 'all', label: 'Semua Status Stok' },
        { key: 'in_stock', label: 'Tersedia (> 5)' },
        { key: 'low_stock', label: 'Stok Menipis (1-5)' },
        { key: 'out_of_stock', label: 'Habis (0)' },
    ];

    const applyFilter = (key: string, value: string) => {
        const queryParams: Record<string, string> = {
            ...filters,
            [key]: value,
            page: '1',
        };

        if (value === 'all' || value === '') {
            delete queryParams[key];
        }

        router.get('/cooperative/inventory', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter('search', searchTerm);
    };

    const handleReset = () => {
        setSearchTerm('');
        router.get(
            '/cooperative/inventory',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const hasActiveFilters =
        filters.source !== 'all' ||
        filters.category !== 'all' ||
        filters.stock_status !== 'all' ||
        (filters.search && filters.search.trim() !== '');

    const getStockBadge = (status: string, stock: number) => {
        if (status === 'out_of_stock' || stock <= 0) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                    Habis (0)
                </span>
            );
        }

        if (status === 'low_stock' || stock <= 5) {
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Menipis ({stock})
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Tersedia ({stock})
            </span>
        );
    };

    return (
        <CooperativeShell activeNav="inventory">
            <div className="mx-auto max-w-7xl space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                            <Boxes className="h-4 w-4" />
                            <span>Logistik & Fisik Koperasi</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Manajemen Stok & Mutasi
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitoring ketersediaan unit barang fisik, opname
                            inventaris, dan audit riwayat mutasi stok.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/cooperative/products"
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                        >
                            <Package className="h-3.5 w-3.5 text-slate-500" />
                            <span>Katalog Produk</span>
                        </Link>
                    </div>
                </div>

                {/* Flash Notifications */}
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

                {/* Real Database Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Total Produk
                            </span>
                            <Package className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.total_products}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Item dalam katalog
                        </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-emerald-700">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Stok Aman
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-900">
                            {stats.in_stock}
                        </div>
                        <div className="mt-1 text-xs text-emerald-600">
                            Stok &gt; 5 unit
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-amber-700">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Stok Menipis
                            </span>
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-900">
                            {stats.low_stock}
                        </div>
                        <div className="mt-1 text-xs text-amber-600">
                            Sisa 1 s.d. 5 unit
                        </div>
                    </div>

                    <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-rose-700">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Stok Habis
                            </span>
                            <XCircle className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="text-2xl font-bold text-rose-900">
                            {stats.out_of_stock}
                        </div>
                        <div className="mt-1 text-xs text-rose-600">
                            0 unit tersedia
                        </div>
                    </div>

                    <div className="col-span-2 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-1">
                        <div className="mb-2 flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Total Fisik
                            </span>
                            <Boxes className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.total_units.toLocaleString('id-ID')}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Total seluruh unit
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
                        {/* Search Input */}
                        <form
                            onSubmit={handleSearch}
                            className="relative flex-1"
                        >
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nama produk, kategori, atau nama/NISN siswa..."
                                className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-9 text-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            />
                        </form>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                            {/* Stock Status Filter */}
                            <select
                                value={filters.stock_status || 'all'}
                                onChange={(e) =>
                                    applyFilter('stock_status', e.target.value)
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            >
                                {stockStatusOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Source Filter */}
                            <select
                                value={filters.source || 'all'}
                                onChange={(e) =>
                                    applyFilter('source', e.target.value)
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            >
                                {sourceOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Category Filter */}
                            <select
                                value={filters.category || 'all'}
                                onChange={(e) =>
                                    applyFilter('category', e.target.value)
                                }
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((cat) => (
                                    <option
                                        key={cat.id}
                                        value={cat.id.toString()}
                                    >
                                        {cat.name}
                                    </option>
                                ))}
                            </select>

                            {/* Reset Button */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
                                    title="Reset filter"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {products.data.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <Boxes className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                        <h3 className="text-base font-semibold text-slate-900">
                            Tidak ada produk ditemukan
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                            {hasActiveFilters
                                ? 'Tidak ada data stok yang sesuai dengan kriteria pencarian dan filter aktif Anda.'
                                : 'Belum ada produk yang tercatat dalam katalog koperasi saat ini.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Hapus Semua Filter</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop & Tablet Table View */}
                        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm text-slate-600">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-600 uppercase">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                Produk
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Kategori
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Kepemilikan / Sumber
                                            </th>
                                            <th className="px-4 py-3.5 text-center">
                                                Stok Terkini
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Mutasi Terakhir
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {products.data.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="transition-colors hover:bg-slate-50/75"
                                            >
                                                {/* Product Info */}
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        {item.image_path ? (
                                                            <img
                                                                src={`/storage/${item.image_path}`}
                                                                alt={item.name}
                                                                className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                                                                <Package className="h-5 w-5" />
                                                            </div>
                                                        )}
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={`/cooperative/inventory/${item.slug}`}
                                                                className="line-clamp-1 font-medium text-slate-900 transition-colors hover:text-emerald-600"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                                                                <span>
                                                                    Harga Jual:
                                                                </span>
                                                                <PriceDisplay
                                                                    amount={
                                                                        item.selling_price
                                                                    }
                                                                    className="font-semibold text-slate-700"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Category */}
                                                <td className="px-4 py-3.5">
                                                    {item.category ? (
                                                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                                                            <Tag className="h-3 w-3 text-slate-400" />
                                                            {item.category.name}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            -
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Ownership / Source */}
                                                <td className="px-4 py-3.5">
                                                    {item.source_type ===
                                                    'student' ? (
                                                        <div className="space-y-0.5">
                                                            <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                                <UserIcon className="h-3 w-3" />
                                                                Titipan Siswa
                                                            </span>
                                                            <div className="text-xs font-medium text-slate-600">
                                                                {item.owner
                                                                    ?.name ||
                                                                    'Siswa'}
                                                                {item.owner
                                                                    ?.student_identifier && (
                                                                    <span className="ml-1 text-slate-400">
                                                                        (
                                                                        {
                                                                            item
                                                                                .owner
                                                                                .student_identifier
                                                                        }
                                                                        )
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                                                            <Store className="h-3 w-3" />
                                                            Milik Koperasi
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Current Stock */}
                                                <td className="px-4 py-3.5 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-mono text-base font-bold text-slate-900">
                                                            {item.stock}
                                                        </span>
                                                        <div className="mt-1">
                                                            {getStockBadge(
                                                                item.stock_status,
                                                                item.stock,
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Latest Movement */}
                                                <td className="px-4 py-3.5">
                                                    {item.latest_movement ? (
                                                        <div className="space-y-0.5 text-xs">
                                                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                                                {item
                                                                    .latest_movement
                                                                    .quantity >
                                                                0 ? (
                                                                    <span className="inline-flex items-center text-emerald-600">
                                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                                        +
                                                                        {
                                                                            item
                                                                                .latest_movement
                                                                                .quantity
                                                                        }
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center text-rose-600">
                                                                        <ArrowDownRight className="h-3.5 w-3.5" />
                                                                        {
                                                                            item
                                                                                .latest_movement
                                                                                .quantity
                                                                        }
                                                                    </span>
                                                                )}
                                                                <span className="text-slate-600">
                                                                    (
                                                                    {
                                                                        item
                                                                            .latest_movement
                                                                            .type_label
                                                                    }
                                                                    )
                                                                </span>
                                                            </div>
                                                            {item
                                                                .latest_movement
                                                                .reason && (
                                                                <div
                                                                    className="max-w-[180px] truncate text-slate-500"
                                                                    title={
                                                                        item
                                                                            .latest_movement
                                                                            .reason
                                                                    }
                                                                >
                                                                    {
                                                                        item
                                                                            .latest_movement
                                                                            .reason
                                                                    }
                                                                </div>
                                                            )}
                                                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                                                                <Clock className="h-3 w-3" />
                                                                {new Date(
                                                                    item
                                                                        .latest_movement
                                                                        .created_at ||
                                                                        '',
                                                                ).toLocaleDateString(
                                                                    'id-ID',
                                                                    {
                                                                        day: 'numeric',
                                                                        month: 'short',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit',
                                                                    },
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">
                                                            Belum ada mutasi
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <Link
                                                        href={`/cooperative/inventory/${item.slug}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                                    >
                                                        <History className="h-3.5 w-3.5" />
                                                        <span>Kelola Stok</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Stacked Card View */}
                        <div className="space-y-3 md:hidden">
                            {products.data.map((item) => (
                                <div
                                    key={item.id}
                                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start gap-3">
                                        {item.image_path ? (
                                            <img
                                                src={`/storage/${item.image_path}`}
                                                alt={item.name}
                                                className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-400">
                                                <Package className="h-6 w-6" />
                                            </div>
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="truncate text-xs text-slate-500">
                                                    {item.category?.name ||
                                                        'Umum'}
                                                </div>
                                                {getStockBadge(
                                                    item.stock_status,
                                                    item.stock,
                                                )}
                                            </div>
                                            <Link
                                                href={`/cooperative/inventory/${item.slug}`}
                                                className="mt-0.5 line-clamp-1 block text-sm font-semibold text-slate-900"
                                            >
                                                {item.name}
                                            </Link>
                                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-600">
                                                <span>Harga Jual:</span>
                                                <PriceDisplay
                                                    amount={item.selling_price}
                                                    className="font-semibold text-slate-800"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Source and Ownership */}
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                                        <div className="text-slate-500">
                                            Sumber / Pemilik:
                                        </div>
                                        {item.source_type === 'student' ? (
                                            <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-700">
                                                Titipan:{' '}
                                                {item.owner?.name || 'Siswa'}
                                            </span>
                                        ) : (
                                            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
                                                Koperasi
                                            </span>
                                        )}
                                    </div>

                                    {/* Latest Movement Summary */}
                                    {item.latest_movement && (
                                        <div className="space-y-1 rounded-lg border border-slate-100 bg-slate-50 p-2.5 text-xs text-slate-600">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-500">
                                                    Mutasi Terakhir:
                                                </span>
                                                <span className="font-medium">
                                                    {item.latest_movement
                                                        .quantity > 0
                                                        ? `+${item.latest_movement.quantity}`
                                                        : item.latest_movement
                                                              .quantity}{' '}
                                                    (
                                                    {
                                                        item.latest_movement
                                                            .type_label
                                                    }
                                                    )
                                                </span>
                                            </div>
                                            {item.latest_movement.reason && (
                                                <div className="truncate text-[11px] text-slate-500">
                                                    {
                                                        item.latest_movement
                                                            .reason
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    <div className="pt-2">
                                        <Link
                                            href={`/cooperative/inventory/${item.slug}`}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                                        >
                                            <History className="h-3.5 w-3.5" />
                                            <span>
                                                Lihat Riwayat & Mutasi Stok
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Links */}
                        {products.links.length > 3 && (
                            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                                <div className="text-xs text-slate-500">
                                    Halaman{' '}
                                    <span className="font-medium">
                                        {products.current_page}
                                    </span>{' '}
                                    dari{' '}
                                    <span className="font-medium">
                                        {products.last_page}
                                    </span>{' '}
                                    ({products.total} total produk)
                                </div>
                                <div className="flex items-center gap-1">
                                    {products.links.map((link, idx) => {
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
                    </>
                )}
            </div>
        </CooperativeShell>
    );
}
