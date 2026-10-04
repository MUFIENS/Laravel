import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    ChevronRight,
    Clock,
    Inbox,
    Search,
    X,
    XCircle,
} from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { StatusBadge } from '@/components/ui/status-badge';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import type { ProductSubmission } from '@/types/consignment';

type Props = {
    submissions: {
        data: ProductSubmission[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    currentFilter: string;
    search?: string;
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeConsignmentIndex({
    submissions,
    stats,
    currentFilter,
    search: initialSearch = '',
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(initialSearch);

    const filters = [
        { key: 'all', label: 'Semua', count: stats.total },
        { key: 'submitted', label: 'Menunggu Review', count: stats.pending },
        { key: 'approved', label: 'Disetujui', count: stats.approved },
        { key: 'rejected', label: 'Ditolak', count: stats.rejected },
    ];

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/cooperative/consignments',
            {
                status: currentFilter === 'all' ? undefined : currentFilter,
                search: searchTerm.trim() || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        router.get(
            '/cooperative/consignments',
            {
                status: currentFilter === 'all' ? undefined : currentFilter,
            },
            { preserveState: true, replace: true },
        );
    };

    const getFilterUrl = (filterKey: string) => {
        const params = new URLSearchParams();
        if (filterKey !== 'all') {
            params.set('status', filterKey);
        }
        if (searchTerm.trim()) {
            params.set('search', searchTerm.trim());
        }
        const qs = params.toString();
        return qs
            ? `/cooperative/consignments?${qs}`
            : '/cooperative/consignments';
    };

    const statusBadgeMeta = (status: ProductSubmission['status']) => {
        switch (status) {
            case 'submitted':
                return {
                    label: 'Menunggu Review',
                    variant: 'warning' as const,
                };
            case 'under_review':
                return { label: 'Sedang Ditinjau', variant: 'info' as const };
            case 'approved':
                return { label: 'Disetujui', variant: 'success' as const };
            case 'rejected':
                return { label: 'Ditolak', variant: 'danger' as const };
            default:
                return { label: status, variant: 'default' as const };
        }
    };

    return (
        <CooperativeShell
            activeNav="consignments"
            title="Review Titipan Siswa"
            subtitle="Tinjau usulan produk konsinyasi siswa, tetapkan margin bagi hasil koperasi, dan kurasi kelayakan tayang di katalog resmi."
            breadcrumbs={[{ label: 'Titipan Siswa' }]}
        >
            <div className="space-y-6">
                {/* Flash Messages (Feedback banner) */}
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

                {/* Real Database-Backed Stats Counters */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                            Total Pengajuan
                        </span>
                        <div className="font-display mt-1 text-2xl font-bold text-[var(--color-ink)]">
                            {stats.total}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-amber-800 uppercase">
                            Perlu Ditinjau
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-amber-900">
                            <Clock
                                className="size-5 text-amber-600"
                                aria-hidden="true"
                            />
                            <span>{stats.pending}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                            Disetujui
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-emerald-900">
                            <CheckCircle2
                                className="size-5 text-emerald-600"
                                aria-hidden="true"
                            />
                            <span>{stats.approved}</span>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 shadow-xs">
                        <span className="text-[10px] font-bold tracking-wider text-rose-800 uppercase">
                            Ditolak
                        </span>
                        <div className="font-display mt-1 flex items-center gap-1.5 text-2xl font-bold text-rose-900">
                            <XCircle
                                className="size-5 text-rose-600"
                                aria-hidden="true"
                            />
                            <span>{stats.rejected}</span>
                        </div>
                    </div>
                </div>

                {/* Search Bar & Workflow Filter Controls */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        {/* Status Filter Tabs */}
                        <div
                            className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0"
                            role="tablist"
                            aria-label="Filter status pengajuan"
                        >
                            {filters.map((f) => {
                                const isActive =
                                    currentFilter === f.key ||
                                    (f.key === 'all' &&
                                        (!currentFilter ||
                                            currentFilter === 'all'));
                                return (
                                    <Link
                                        key={f.key}
                                        href={getFilterUrl(f.key)}
                                        className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                                            isActive
                                                ? 'bg-[var(--color-primary)] text-white shadow-xs'
                                                : 'border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]'
                                        }`}
                                        aria-selected={isActive}
                                        role="tab"
                                    >
                                        <span>{f.label}</span>
                                        <span
                                            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                                isActive
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-[var(--color-surface-subtle)] text-[var(--color-ink)]'
                                            }`}
                                        >
                                            {f.count}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* Server-Side Search Form */}
                        <form
                            onSubmit={handleSearchSubmit}
                            className="relative flex items-center"
                        >
                            <label
                                htmlFor="submission-search"
                                className="sr-only"
                            >
                                Cari pengajuan berdasarkan produk, siswa, atau
                                kategori
                            </label>
                            <div className="relative w-full sm:w-72">
                                <Search
                                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--color-ink-muted)]"
                                    aria-hidden="true"
                                />
                                <input
                                    id="submission-search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                        setSearchTerm(e.target.value)
                                    }
                                    placeholder="Cari produk / siswa..."
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
                            <button
                                type="submit"
                                className="ml-2 inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-primary)] px-3 text-xs font-semibold text-white transition-opacity hover:opacity-95"
                            >
                                Cari
                            </button>
                        </form>
                    </div>
                </div>

                {/* Submissions Section */}
                {submissions.data.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-12 text-center shadow-xs">
                        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
                            <Inbox className="size-6" aria-hidden="true" />
                        </div>
                        <h3 className="font-display mt-3 text-sm font-bold text-[var(--color-ink)]">
                            Tidak ada pengajuan ditemukan
                        </h3>
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                            {initialSearch
                                ? `Tidak ada hasil yang sesuai dengan kata kunci "${initialSearch}".`
                                : 'Belum ada pengajuan titipan siswa pada kategori filter ini.'}
                        </p>
                        {initialSearch && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="mt-4 inline-flex min-h-[44px] items-center rounded-xl bg-[var(--color-primary-soft)] px-4 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                            >
                                Reset Pencarian
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop & Tablet Table View (>= 768px) */}
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
                                            Siswa Pengusul
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Harga Dasar
                                        </th>
                                        <th scope="col" className="px-3 py-3.5">
                                            Rencana Stok
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
                                    {submissions.data.map((sub) => {
                                        const badge = statusBadgeMeta(
                                            sub.status,
                                        );
                                        return (
                                            <tr
                                                key={sub.id}
                                                className="transition-colors hover:bg-[var(--color-surface-subtle)]/50"
                                            >
                                                <td className="py-4 pr-3 pl-6">
                                                    <div className="max-w-xs truncate font-semibold text-[var(--color-ink)]">
                                                        {sub.name}
                                                    </div>
                                                    <div className="mt-0.5 text-[10px] font-medium text-[var(--color-ink-muted)]">
                                                        {sub.category?.name ??
                                                            'Umum'}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-4">
                                                    <div className="font-medium text-[var(--color-ink)]">
                                                        {sub.student?.name}
                                                    </div>
                                                    {sub.student
                                                        ?.student_identifier && (
                                                        <div className="text-[10px] text-[var(--color-ink-muted)]">
                                                            NIS:{' '}
                                                            {
                                                                sub.student
                                                                    .student_identifier
                                                            }
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-4 font-mono font-medium">
                                                    <PriceDisplay
                                                        amount={sub.base_price}
                                                        size="sm"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 font-mono text-[var(--color-ink-muted)]">
                                                    {sub.proposed_stock} pcs
                                                </td>
                                                <td className="px-3 py-4">
                                                    <StatusBadge
                                                        variant={badge.variant}
                                                    >
                                                        {badge.label}
                                                    </StatusBadge>
                                                </td>
                                                <td className="py-4 pr-6 pl-3 text-right">
                                                    <Link
                                                        href={`/cooperative/consignments/${sub.id}`}
                                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[var(--color-primary-soft)] px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                                                    >
                                                        <span>Tinjau</span>
                                                        <ChevronRight
                                                            className="size-3.5"
                                                            aria-hidden="true"
                                                        />
                                                    </Link>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Stacked Card View (< 768px) */}
                        <div className="space-y-3 md:hidden">
                            {submissions.data.map((sub) => {
                                const badge = statusBadgeMeta(sub.status);
                                return (
                                    <div
                                        key={sub.id}
                                        className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-xs"
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <span className="text-[10px] font-bold tracking-wide text-[var(--color-ink-muted)] uppercase">
                                                    {sub.category?.name ??
                                                        'Produk'}
                                                </span>
                                                <h3 className="font-display mt-0.5 text-sm font-bold text-[var(--color-ink)]">
                                                    {sub.name}
                                                </h3>
                                            </div>
                                            <StatusBadge
                                                variant={badge.variant}
                                            >
                                                {badge.label}
                                            </StatusBadge>
                                        </div>

                                        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-subtle)]/70 p-2.5 text-xs">
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Pengusul
                                                </span>
                                                <p className="truncate font-semibold text-[var(--color-ink)]">
                                                    {sub.student?.name}
                                                </p>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Harga Pokok
                                                </span>
                                                <div className="font-mono">
                                                    <PriceDisplay
                                                        amount={sub.base_price}
                                                        size="sm"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    Rencana Stok
                                                </span>
                                                <p className="font-mono font-medium text-[var(--color-ink)]">
                                                    {sub.proposed_stock} pcs
                                                </p>
                                            </div>
                                            {sub.cooperative_margin !== null &&
                                                sub.cooperative_margin !==
                                                    undefined && (
                                                    <div>
                                                        <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                            Margin
                                                        </span>
                                                        <div className="font-mono text-[var(--color-primary)]">
                                                            <PriceDisplay
                                                                amount={
                                                                    sub.cooperative_margin
                                                                }
                                                                size="sm"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                        </div>

                                        <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-3">
                                            <Link
                                                href={`/cooperative/consignments/${sub.id}`}
                                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                                            >
                                                <span>Tinjau Pengajuan</span>
                                                <ChevronRight
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Links */}
                        {submissions.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
                                {submissions.links.map((link) => (
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
