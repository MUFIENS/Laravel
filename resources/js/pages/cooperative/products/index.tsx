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
                        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-xs"
                        role="alert"
                    >
                        <CheckCircle2
                            className="mt-0.5 size-5 shrink-0 text-emerald-600"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold">Aksi Berhasil</p>
                            <p className="mt-0.5">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 shadow-xs"
                        role="alert"
                    >
                        <AlertTriangle
                            className="mt-0.5 size-5 shrink-0 text-rose-600"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold">Terjadi Kesalahan</p>
                            <p className="mt-0.5">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* Real Database Stats Overview */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                            Total Katalog
                        </span>
                        <div className="font-display mt-1 text-2xl font-bold text-[var(--color-ink)]">
                            {stats.total}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                            Aktif Tayang
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-emerald-900">
                            <CheckCircle2
                                className="size-5 text-emerald-600"
                                aria-hidden="true"
                            />
                            <span>{stats.active}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                            Nonaktif / Arsip
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-amber-900">
                            <XCircle
                                className="size-5 text-amber-600"
                                aria-hidden="true"
                            />
                            <span>{stats.inactive}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-slate-700 uppercase">
                            Barang Koperasi
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-slate-800">
                            <Store
                                className="size-5 text-slate-600"
                                aria-hidden="true"
                            />
                            <span>{stats.cooperative}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]/50 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-[var(--color-primary)] uppercase">
                            Titipan Siswa
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-[var(--color-primary)]">
                            <Tag
                                className="size-5 text-[var(--color-primary)]"
                                aria-hidden="true"
                            />
                            <span>{stats.consignment}</span>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
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
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
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
                                    className="min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 pr-9 pl-9 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 items-center justify-center rounded-lg text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
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
                                className="text-xs font-semibold whitespace-nowrap text-[var(--color-ink)]"
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
                                className="min-h-[44px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 text-xs font-medium text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                            >
                                <option value="all">Semua Kategori</option>
                                {categories.map((c) => (
                                    <option key={c.id} value={c.slug}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bottom Row: Status Tabs & Source Filter */}
                    <div className="flex flex-col gap-3 border-t border-[var(--color-border-subtle)]/60 pt-3 sm:flex-row sm:items-center sm:justify-between">
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
                                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                                : 'border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]'
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
                                                : 'border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]'
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
                    <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-12 text-center shadow-xs">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
                            <Inbox className="size-6" aria-hidden="true" />
                        </div>
                        <h3 className="font-display mt-3 text-sm font-bold text-[var(--color-ink)]">
                            Tidak ada produk ditemukan
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                            {filters.search
                                ? `Tidak ada produk yang sesuai dengan kata kunci "${filters.search}".`
                                : 'Belum ada produk yang memenuhi kriteria filter aktif saat ini.'}
                        </p>
                        <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-primary-soft)] px-4 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                        >
                            Reset Semua Filter
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Desktop & Tablet Structured Table (>= 768px) */}
                        <div className="hidden overflow-hidden rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xs md:block">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                        <th
                                            scope="col"
                                            className="py-3.5 pr-3 pl-6"
                                        >
                                            Produk & Kategori
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Sumber / Pemilik
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Harga Pokok
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Margin Koperasi
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Harga Jual
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Stok
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Status
                                        </th>
                                        <th
                                            scope="col"
                                            className="py-3.5 pr-6 pl-3 text-right"
                                        >
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--color-border-subtle)] text-xs">
                                    {products.data.map((product) => {
                                        const badge = statusBadgeMeta(
                                            product.status,
                                        );
                                        const isConsignment =
                                            product.source_type === 'student';

                                        return (
                                            <tr
                                                key={product.id}
                                                className="transition-colors hover:bg-[var(--color-surface-subtle)]/50"
                                            >
                                                {/* Product Name & Category */}
                                                <td className="py-4 pr-3 pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
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
                                                                <div className="flex size-full items-center justify-center text-[var(--color-ink-muted)]">
                                                                    <Package
                                                                        className="size-5"
                                                                        aria-hidden="true"
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="max-w-xs min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="truncate font-semibold text-[var(--color-ink)]">
                                                                    {
                                                                        product.name
                                                                    }
                                                                </span>
                                                                {product.is_featured && (
                                                                    <span className="shrink-0 rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                                                                        Unggulan
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-0.5 truncate text-[10px] text-[var(--color-ink-muted)]">
                                                                {product
                                                                    .category
                                                                    ?.name ??
                                                                    'Umum'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Source / Owner */}
                                                <td className="px-3 py-4">
                                                    {isConsignment ? (
                                                        <div>
                                                            <div className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-primary)]">
                                                                <Tag
                                                                    className="size-3"
                                                                    aria-hidden="true"
                                                                />
                                                                <span>
                                                                    Titipan
                                                                    Siswa
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 max-w-[140px] truncate text-[11px] font-medium text-[var(--color-ink)]">
                                                                {product.owner
                                                                    ?.name ??
                                                                    'Siswa'}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                                                                <Store
                                                                    className="size-3"
                                                                    aria-hidden="true"
                                                                />
                                                                <span>
                                                                    Koperasi
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 text-[11px] font-medium text-[var(--color-ink-muted)]">
                                                                KOPDIG Official
                                                            </div>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Base Price */}
                                                <td className="px-3 py-4 font-mono font-medium">
                                                    <PriceDisplay
                                                        amount={
                                                            product.base_price
                                                        }
                                                        size="sm"
                                                    />
                                                </td>

                                                {/* Cooperative Margin */}
                                                <td className="px-3 py-4 font-mono font-semibold text-[var(--color-primary)]">
                                                    <PriceDisplay
                                                        amount={
                                                            product.cooperative_margin
                                                        }
                                                        size="sm"
                                                    />
                                                </td>

                                                {/* Selling Price */}
                                                <td className="px-3 py-4 font-mono font-bold text-emerald-800">
                                                    <PriceDisplay
                                                        amount={
                                                            product.selling_price
                                                        }
                                                        size="sm"
                                                    />
                                                </td>

                                                {/* Physical Stock */}
                                                <td className="px-3 py-4 font-mono">
                                                    <span
                                                        className={`font-semibold ${product.stock > 0 ? 'text-[var(--color-ink)]' : 'text-rose-600'}`}
                                                    >
                                                        {product.stock} unit
                                                    </span>
                                                </td>

                                                {/* Status Badge */}
                                                <td className="px-3 py-4">
                                                    <StatusBadge
                                                        variant={badge.variant}
                                                    >
                                                        {badge.label}
                                                    </StatusBadge>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-4 pr-6 pl-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={`/cooperative/products/${product.slug}`}
                                                            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-[var(--color-surface-subtle)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-border-subtle)]"
                                                            title="Lihat Detail Produk"
                                                        >
                                                            <Eye
                                                                className="size-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            <span>Detail</span>
                                                        </Link>
                                                        <Link
                                                            href={`/cooperative/products/${product.slug}/edit`}
                                                            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-[var(--color-primary-soft)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                                                            title="Ubah Produk"
                                                        >
                                                            <Edit3
                                                                className="size-3.5"
                                                                aria-hidden="true"
                                                            />
                                                            <span>Ubah</span>
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
                                        className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold tracking-wide text-[var(--color-ink-muted)] uppercase">
                                                    {product.category?.name ??
                                                        'Umum'}
                                                </span>
                                                {isConsignment ? (
                                                    <span className="rounded-md bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-[9px] font-bold text-[var(--color-primary)]">
                                                        Titipan Siswa
                                                    </span>
                                                ) : (
                                                    <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
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

                                        <h3 className="font-display mt-1.5 text-sm font-bold text-[var(--color-ink)]">
                                            {product.name}
                                        </h3>

                                        {isConsignment && product.owner && (
                                            <p className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]">
                                                Pemilik:{' '}
                                                <span className="font-semibold text-[var(--color-ink)]">
                                                    {product.owner.name}
                                                </span>
                                            </p>
                                        )}

                                        {/* Financial and Stock Breakdown */}
                                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-subtle)]/70 p-2.5 text-xs">
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Harga Pokok
                                                </span>
                                                <div className="font-mono">
                                                    <PriceDisplay
                                                        amount={
                                                            product.base_price
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Margin Koperasi
                                                </span>
                                                <div className="font-mono font-semibold text-[var(--color-primary)]">
                                                    <PriceDisplay
                                                        amount={
                                                            product.cooperative_margin
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Harga Jual Resmi
                                                </span>
                                                <div className="font-mono font-bold text-emerald-800">
                                                    <PriceDisplay
                                                        amount={
                                                            product.selling_price
                                                        }
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Stok Tersedia
                                                </span>
                                                <p
                                                    className={`font-mono font-semibold ${product.stock > 0 ? 'text-[var(--color-ink)]' : 'text-rose-600'}`}
                                                >
                                                    {product.stock} unit
                                                </p>
                                            </div>
                                        </div>

                                        {/* Mobile Action Buttons */}
                                        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[var(--color-border-subtle)] pt-3">
                                            <Link
                                                href={`/cooperative/products/${product.slug}`}
                                                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                                            >
                                                <Eye
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                <span>Detail</span>
                                            </Link>
                                            <Link
                                                href={`/cooperative/products/${product.slug}/edit`}
                                                className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
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
                                                        ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                                        : 'border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]'
                                                }`}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                            />
                                        ) : (
                                            <span
                                                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-[var(--color-border-subtle)]/50 bg-[var(--color-surface)] px-3 text-xs text-[var(--color-ink-muted)] opacity-50"
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
