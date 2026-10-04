import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Edit3,
    Eye,
    Inbox,
    Package,
    Search,
    Store,
    Tag,
    X,
    XCircle,
} from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { StatusBadge } from '@/components/ui/status-badge';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import type { Product } from '@/types/consignment';

type Props = {
    products: {
        data: Product[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total: number;
        active: number;
        inactive: number;
        cooperative: number;
        consignment: number;
    };
    categories: { id: number; name: string; slug: string }[];
    filters: {
        status: string;
        source: string;
        category: string;
        search: string;
    };
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeProductsIndex({
    products,
    stats,
    categories,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const statusOptions = [
        { key: 'all', label: 'Semua Status' },
        { key: 'active', label: 'Aktif' },
        { key: 'inactive', label: 'Tidak Aktif' },
        { key: 'archived', label: 'Diarsipkan' },
    ];

    const sourceOptions = [
        { key: 'all', label: 'Semua Sumber' },
        { key: 'cooperative', label: 'Produk Koperasi' },
        { key: 'student', label: 'Titipan Siswa' },
    ];

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/cooperative/products',
            {
                status: filters.status !== 'all' ? filters.status : undefined,
                source: filters.source !== 'all' ? filters.source : undefined,
                category:
                    filters.category !== 'all' ? filters.category : undefined,
                search: searchTerm.trim() || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        router.get(
            '/cooperative/products',
            {
                status: filters.status !== 'all' ? filters.status : undefined,
                source: filters.source !== 'all' ? filters.source : undefined,
                category:
                    filters.category !== 'all' ? filters.category : undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleFilterChange = (
        key: 'status' | 'source' | 'category',
        value: string,
    ) => {
        const nextFilters = {
            ...filters,
            [key]: value,
        };

        router.get(
            '/cooperative/products',
            {
                status:
                    nextFilters.status !== 'all'
                        ? nextFilters.status
                        : undefined,
                source:
                    nextFilters.source !== 'all'
                        ? nextFilters.source
                        : undefined,
                category:
                    nextFilters.category !== 'all'
                        ? nextFilters.category
                        : undefined,
                search: searchTerm.trim() || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleResetAllFilters = () => {
        setSearchTerm('');
        router.get('/cooperative/products', {}, { replace: true });
    };

    const statusBadgeMeta = (status: Product['status']) => {
        switch (status) {
            case 'active':
                return { label: 'Aktif', variant: 'success' as const };
            case 'inactive':
                return { label: 'Tidak Aktif', variant: 'warning' as const };
            case 'archived':
                return { label: 'Diarsipkan', variant: 'danger' as const };
            case 'draft':
                return { label: 'Draft', variant: 'default' as const };
            default:
                return { label: status, variant: 'default' as const };
        }
    };

    return (
        <CooperativeShell
            activeNav="products"
            title="Katalog Produk Koperasi"
            subtitle="Kelola seluruh etalase barang koperasi dan karya titipan siswa, pantau status tayang, serta kontrol penetapan margin."
            breadcrumbs={[{ label: 'Katalog Produk' }]}
        >
            <div className="space-y-6">
                {/* Flash Messages */}
                {flash?.success && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-xs text-emerald-400 shadow-xs"
                        role="alert"
                    >
                        <CheckCircle2
                            className="mt-0.5 size-5 shrink-0 text-emerald-400"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold text-emerald-300">
                                Aksi Berhasil
                            </p>
                            <p className="mt-0.5 text-emerald-400/90">
                                {flash.success}
                            </p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-xs text-rose-400 shadow-xs"
                        role="alert"
                    >
                        <AlertTriangle
                            className="mt-0.5 size-5 shrink-0 text-rose-400"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold text-rose-300">
                                Terjadi Kesalahan
                            </p>
                            <p className="mt-0.5 text-rose-400/90">
                                {flash.error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Real Database Stats Overview */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                            Total Katalog
                        </span>
                        <div className="font-display mt-1 text-2xl font-bold text-[#F5F2EB]">
                            {stats.total}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                            Aktif Tayang
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-emerald-400">
                            <CheckCircle2
                                className="size-5 text-emerald-400"
                                aria-hidden="true"
                            />
                            <span>{stats.active}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase">
                            Nonaktif / Arsip
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-amber-400">
                            <XCircle
                                className="size-5 text-amber-400"
                                aria-hidden="true"
                            />
                            <span>{stats.inactive}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#262626] bg-[#141414] p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-[#A3A3A3] uppercase">
                            Barang Koperasi
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-[#F5F2EB]">
                            <Store
                                className="size-5 text-[#737373]"
                                aria-hidden="true"
                            />
                            <span>{stats.cooperative}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#E34A27]/25 bg-[#E34A27]/10 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-[#E34A27] uppercase">
                            Titipan Siswa
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-[#E34A27]">
                            <Tag
                                className="size-5 text-[#E34A27]"
                                aria-hidden="true"
                            />
                            <span>{stats.consignment}</span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-xs">
                    {/* Top Row: Search Form & Category Select */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        {/* Server-Side Search Form */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="relative flex-1 sm:max-w-md"
                        >
                            <label htmlFor="product-search" className="sr-only">
                                Cari produk, deskripsi, siswa pengusul, atau
                                kategori
                            </label>
                            <div className="relative">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#737373]"
                                    aria-hidden="true"
                                />
                                <input
                                    id="product-search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Cari nama produk, siswa, kategori..."
                                    className="min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] pr-9 pl-9 text-xs text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-[#737373] hover:text-[#F5F2EB]"
                                        aria-label="Bersihkan pencarian"
                                    >
                                        <X
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Category Dropdown Filter */}
                        <div className="flex items-center gap-2">
                            <label
                                htmlFor="category-filter"
                                className="text-xs font-semibold whitespace-nowrap text-[#A3A3A3]"
                            >
                                Kategori:
                            </label>
                            <select
                                id="category-filter"
                                value={filters.category}
                                onChange={(e) =>
                                    handleFilterChange(
                                        'category',
                                        e.target.value,
                                    )
                                }
                                className="min-h-[44px] rounded-xl border border-[#262626] bg-[#161616] px-3 text-xs font-medium text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option
                                        key={c.id}
                                        value={c.slug}
                                        className="bg-[#161616] text-[#F5F2EB]"
                                    >
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bottom Row: Status Tabs & Source Filter */}
                    <div className="flex flex-col gap-3 border-t border-[#262626] pt-3 sm:flex-row sm:items-center sm:justify-between">
                        {/* Status Filter Tabs */}
                        <div
                            className="flex flex-wrap gap-1.5"
                            role="tablist"
                            aria-label="Filter status produk"
                        >
                            {statusOptions.map((opt) => {
                                const isActive = filters.status === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() =>
                                            handleFilterChange(
                                                'status',
                                                opt.key,
                                            )
                                        }
                                        className={`inline-flex min-h-[44px] items-center rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-[#E34A27] text-white shadow-xs'
                                                : 'border border-[#262626] bg-[#161616] text-[#737373] hover:bg-[#202020] hover:text-[#F5F2EB]'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Source Filter Pills */}
                        <div
                            className="flex flex-wrap gap-1.5"
                            role="group"
                            aria-label="Filter sumber produk"
                        >
                            {sourceOptions.map((opt) => {
                                const isActive = filters.source === opt.key;
                                return (
                                    <button
                                        key={opt.key}
                                        type="button"
                                        onClick={() =>
                                            handleFilterChange(
                                                'source',
                                                opt.key,
                                            )
                                        }
                                        className={`inline-flex min-h-[44px] items-center rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                            isActive
                                                ? 'bg-amber-600 text-white shadow-xs'
                                                : 'border border-[#262626] bg-[#161616] text-[#737373] hover:bg-[#202020] hover:text-[#F5F2EB]'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Products Listing */}
                {products.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#262626] bg-[#121212] p-12 text-center shadow-xs">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#181818] text-[#737373]">
                            <Inbox className="size-6" aria-hidden="true" />
                        </div>
                        <h3 className="font-display mt-3 text-sm font-bold text-[#F5F2EB]">
                            Tidak ada produk ditemukan
                        </h3>
                        <p className="mt-1 text-xs text-[#737373]">
                            {filters.search
                                ? `Tidak ada produk yang sesuai dengan kata kunci "${filters.search}".`
                                : 'Belum ada produk yang memenuhi kriteria filter aktif saat ini.'}
                        </p>
                        <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl border border-[#E34A27]/30 bg-[#E34A27]/10 px-4 text-xs font-semibold text-[#E34A27] transition-colors hover:bg-[#E34A27] hover:text-white"
                        >
                            Reset Semua Filter
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop & Tablet Structured Table (>= 768px) */}
                        <div className="hidden overflow-hidden rounded-2xl border border-[#262626] bg-[#121212] shadow-xs md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[960px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-[#262626] bg-[#161616]/80 text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                            <th
                                                scope="col"
                                                className="min-w-[220px] py-3.5 pr-3 pl-6"
                                            >
                                                Produk & Kategori
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 whitespace-nowrap"
                                            >
                                                Sumber / Pemilik
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 whitespace-nowrap"
                                            >
                                                Harga Pokok
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 whitespace-nowrap"
                                            >
                                                Margin Koperasi
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 whitespace-nowrap"
                                            >
                                                Harga Jual
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 whitespace-nowrap"
                                            >
                                                Stok
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-3 py-3.5 whitespace-nowrap"
                                            >
                                                Status
                                            </th>
                                            <th
                                                scope="col"
                                                className="py-3.5 pr-6 pl-3 text-right whitespace-nowrap"
                                            >
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626] text-xs">
                                        {products.data.map((product) => {
                                            const badge = statusBadgeMeta(
                                                product.status,
                                            );
                                            const isConsignment =
                                                product.source_type ===
                                                'student';

                                            return (
                                                <tr
                                                    key={product.id}
                                                    className="transition-colors hover:bg-[#161616]/50"
                                                >
                                                    {/* Product Name & Category */}
                                                    <td className="py-4 pr-3 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-[#262626] bg-[#181818]">
                                                                {product.image_path ? (
                                                                    <img
                                                                        src={
                                                                            product.image_path
                                                                        }
                                                                        alt={
                                                                            product.name
                                                                        }
                                                                        className="size-full object-cover"
                                                                        onError={(
                                                                            e,
                                                                        ) => {
                                                                            (
                                                                                e.currentTarget as HTMLElement
                                                                            ).style.display =
                                                                                'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <div className="flex size-full items-center justify-center text-[#737373]">
                                                                        <Package
                                                                            className="size-5"
                                                                            aria-hidden="true"
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="max-w-xs min-w-0">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="truncate font-semibold text-[#F5F2EB]">
                                                                        {
                                                                            product.name
                                                                        }
                                                                    </span>
                                                                    {product.is_featured && (
                                                                        <span className="shrink-0 rounded-md border border-amber-500/20 bg-amber-950/40 px-1.5 py-0.5 text-[9px] font-bold text-amber-400">
                                                                            Unggulan
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="mt-0.5 truncate text-[10px] text-[#737373]">
                                                                    {product
                                                                        .category
                                                                        ?.name ??
                                                                        'Umum'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Source / Owner */}
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        {isConsignment ? (
                                                            <div>
                                                                <div className="inline-flex items-center gap-1 rounded-md border border-[#E34A27]/25 bg-[#E34A27]/15 px-2 py-0.5 text-[10px] font-semibold text-[#E34A27]">
                                                                    <Tag
                                                                        className="size-3"
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span>
                                                                        Titipan
                                                                        Siswa
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 max-w-[140px] truncate text-[11px] font-medium text-[#F5F2EB]">
                                                                    {product
                                                                        .owner
                                                                        ?.name ??
                                                                        'Siswa'}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="inline-flex items-center gap-1 rounded-md border border-[#262626] bg-[#1E1E1E] px-2 py-0.5 text-[10px] font-semibold text-[#A3A3A3]">
                                                                    <Store
                                                                        className="size-3"
                                                                        aria-hidden="true"
                                                                    />
                                                                    <span>
                                                                        Koperasi
                                                                    </span>
                                                                </div>
                                                                <div className="mt-1 text-[11px] font-medium text-[#737373]">
                                                                    KOPDIG
                                                                    Official
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Base Price */}
                                                    <td className="px-3 py-4 font-mono font-medium whitespace-nowrap text-[#A3A3A3]">
                                                        <PriceDisplay
                                                            amount={
                                                                product.base_price
                                                            }
                                                            size="sm"
                                                        />
                                                    </td>

                                                    {/* Cooperative Margin */}
                                                    <td className="px-3 py-4 font-mono font-semibold whitespace-nowrap text-[#E34A27]">
                                                        <PriceDisplay
                                                            amount={
                                                                product.cooperative_margin
                                                            }
                                                            size="sm"
                                                        />
                                                    </td>

                                                    {/* Selling Price */}
                                                    <td className="px-3 py-4 font-mono font-bold whitespace-nowrap text-emerald-400">
                                                        <PriceDisplay
                                                            amount={
                                                                product.selling_price
                                                            }
                                                            size="sm"
                                                        />
                                                    </td>

                                                    {/* Physical Stock */}
                                                    <td className="px-3 py-4 font-mono whitespace-nowrap">
                                                        <span
                                                            className={`font-semibold ${product.stock > 0 ? 'text-[#F5F2EB]' : 'text-rose-400'}`}
                                                        >
                                                            {product.stock} unit
                                                        </span>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td className="px-3 py-4 whitespace-nowrap">
                                                        <StatusBadge
                                                            variant={
                                                                badge.variant
                                                            }
                                                        >
                                                            {badge.label}
                                                        </StatusBadge>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="py-4 pr-6 pl-3 text-right whitespace-nowrap">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <Link
                                                                href={`/cooperative/products/${product.slug}`}
                                                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#262626] bg-[#161616] px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#F5F2EB] transition-colors hover:bg-[#202020]"
                                                                title="Lihat Detail Produk"
                                                            >
                                                                <Eye
                                                                    className="size-3.5 text-[#737373]"
                                                                    aria-hidden="true"
                                                                />
                                                                <span>
                                                                    Detail
                                                                </span>
                                                            </Link>
                                                            <Link
                                                                href={`/cooperative/products/${product.slug}/edit`}
                                                                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-[#E34A27]/30 bg-[#E34A27]/15 px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#E34A27] transition-colors hover:bg-[#E34A27] hover:text-white"
                                                                title="Ubah Produk"
                                                            >
                                                                <Edit3
                                                                    className="size-3.5"
                                                                    aria-hidden="true"
                                                                />
                                                                <span>
                                                                    Ubah
                                                                </span>
                                                            </Link>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Stacked Card View (< 768px) */}
                        <div className="space-y-3 md:hidden">
                            {products.data.map((product) => {
                                const badge = statusBadgeMeta(product.status);
                                const isConsignment =
                                    product.source_type === 'student';

                                return (
                                    <div
                                        key={product.id}
                                        className="rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-xs"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold tracking-wide text-[#737373] uppercase">
                                                    {product.category?.name ??
                                                        'Umum'}
                                                </span>
                                                {isConsignment ? (
                                                    <span className="rounded-md border border-[#E34A27]/25 bg-[#E34A27]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#E34A27]">
                                                        Titipan Siswa
                                                    </span>
                                                ) : (
                                                    <span className="rounded-md border border-[#262626] bg-[#1E1E1E] px-1.5 py-0.5 text-[9px] font-bold text-[#A3A3A3]">
                                                        Koperasi
                                                    </span>
                                                )}
                                            </div>
                                            <StatusBadge
                                                variant={badge.variant}
                                            >
                                                {badge.label}
                                            </StatusBadge>
                                        </div>

                                        <h3 className="font-display mt-1.5 text-sm font-bold text-[#F5F2EB]">
                                            {product.name}
                                        </h3>

                                        {isConsignment && product.owner && (
                                            <p className="mt-0.5 text-[11px] text-[#737373]">
                                                Pemilik:{' '}
                                                <span className="font-semibold text-[#F5F2EB]">
                                                    {product.owner.name}
                                                </span>
                                            </p>
                                        )}

                                        {/* Financial and Stock Breakdown */}
                                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-[#262626] bg-[#161616] p-2.5 text-xs">
                                            <div>
                                                <span className="text-[10px] text-[#737373]">
                                                    Harga Pokok
                                                </span>
                                                <div className="font-mono text-[#A3A3A3]">
                                                    <PriceDisplay
                                                        amount={
                                                            product.base_price
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#737373]">
                                                    Margin Koperasi
                                                </span>
                                                <div className="font-mono font-semibold text-[#E34A27]">
                                                    <PriceDisplay
                                                        amount={
                                                            product.cooperative_margin
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#737373]">
                                                    Harga Jual Resmi
                                                </span>
                                                <div className="font-mono font-bold text-emerald-400">
                                                    <PriceDisplay
                                                        amount={
                                                            product.selling_price
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[#737373]">
                                                    Stok Tersedia
                                                </span>
                                                <p
                                                    className={`font-mono font-semibold ${product.stock > 0 ? 'text-[#F5F2EB]' : 'text-rose-400'}`}
                                                >
                                                    {product.stock} unit
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mobile Action Buttons */}
                                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[#262626] pt-3">
                                            <Link
                                                href={`/cooperative/products/${product.slug}`}
                                                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[#262626] bg-[#161616] px-3 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:bg-[#202020]"
                                            >
                                                <Eye
                                                    className="size-4 text-[#737373]"
                                                    aria-hidden="true"
                                                />
                                                <span>Detail</span>
                                            </Link>
                                            <Link
                                                href={`/cooperative/products/${product.slug}/edit`}
                                                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#E34A27] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                            >
                                                <Edit3
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                <span>Ubah</span>
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Links */}
                        {products.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
                                {products.links.map((link) => (
                                    <React.Fragment key={link.label}>
                                        {link.url ? (
                                            <Link
                                                href={link.url}
                                                className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3 text-xs font-semibold transition-colors ${
                                                    link.active
                                                        ? 'bg-[#E34A27] text-white shadow-xs'
                                                        : 'border border-[#262626] bg-[#141414] text-[#A3A3A3] hover:bg-[#1E1E1E] hover:text-[#F5F2EB]'
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[#262626]/50 bg-[#121212] px-3 text-xs text-[#525252] opacity-50"
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </CooperativeShell>
    );
}
