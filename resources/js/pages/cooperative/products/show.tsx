import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    Edit3,
    ExternalLink,
    HelpCircle,
    Inbox,
    Package,
    ShieldCheck,
    Sparkles,
    Store,
    Tag,
    User,
    UserCheck,
} from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { StatusBadge } from '@/components/ui/status-badge';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import type { Product, ProductSubmission } from '@/types/consignment';

type Props = {
    product: Product & {
        submissions?: ProductSubmission[];
    };
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeProductShow({ product }: Props) {
    const { flash } = usePage<PageProps>().props;
    const isConsignment = product.source_type === 'student';

    const formatIdDate = (dateString?: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const statusBadgeMeta = (status: Product['status']) => {
        switch (status) {
            case 'active':
                return {
                    label: 'Aktif di Katalog',
                    variant: 'success' as const,
                };
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

    const badge = statusBadgeMeta(product.status);

    return (
        <CooperativeShell
            activeNav="products"
            title={`Detail Produk — ${product.name}`}
            subtitle="Informasi lengkap spesifikasi barang, struktur harga, kepemilikan, dan status keterjualan di etalase KOPDIG."
            breadcrumbs={[
                { label: 'Katalog Produk', href: '/cooperative/products' },
                { label: product.name },
            ]}
        >
            <div className="space-y-6">
                {/* Navigation Header & Quick Actions */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <Link
                        href="/cooperative/products"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-xs transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span>Kembali ke Katalog Produk</span>
                    </Link>

                    <div className="flex flex-wrap items-center gap-2">
                        {product.status === 'active' && (
                            <Link
                                href={`/products/${product.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-xs transition-colors hover:bg-[var(--color-surface-subtle)]"
                            >
                                <ExternalLink
                                    className="size-3.5"
                                    aria-hidden="true"
                                />
                                <span>Etalase Publik</span>
                            </Link>
                        )}
                        <Link
                            href={`/cooperative/products/${product.slug}/edit`}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                        >
                            <Edit3 className="size-3.5" aria-hidden="true" />
                            <span>Ubah Produk</span>
                        </Link>
                    </div>
                </div>

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

                {/* Mandatory Product Ownership Display */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                        <ShieldCheck
                            className="size-4 text-[var(--color-primary)]"
                            aria-hidden="true"
                        />
                        <span>
                            Struktur Kepemilikan & Tanggung Jawab Operasional
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                1. Pemilik Sah Produk
                            </span>
                            <div className="font-display mt-1 flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                                <User
                                    className="size-4 text-[var(--color-primary)]"
                                    aria-hidden="true"
                                />
                                <span className="truncate">
                                    {isConsignment
                                        ? (product.owner?.name ??
                                          'Siswa Pengusul')
                                        : 'Koperasi Siswa KOPDIG'}
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                {isConsignment
                                    ? `Siswa tetap pemilik sah aset (owner_id: ${product.owner_id}).`
                                    : 'Aset pengadaan modal mandiri koperasi.'}
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                2. Operator & Kurator
                            </span>
                            <div className="font-display mt-1 flex items-center gap-2 text-sm font-bold text-[var(--color-ink)]">
                                <Store
                                    className="size-4 text-[var(--color-primary)]"
                                    aria-hidden="true"
                                />
                                <span>Koperasi Siswa (KOPDIG)</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                Pengawasan mutu, kontrol margin, dan etalase
                                loket sekolah.
                            </p>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                3. Klasifikasi Sumber
                            </span>
                            <div className="font-display mt-1 flex items-center gap-2 text-sm font-bold text-[var(--color-primary)]">
                                <Tag
                                    className="size-4 text-[var(--color-primary)]"
                                    aria-hidden="true"
                                />
                                <span>
                                    {isConsignment
                                        ? 'Karya Titipan Siswa'
                                        : 'Barang Koperasi'}
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                {isConsignment
                                    ? 'Konsinyasi bagi hasil dengan modal siswa terlindungi.'
                                    : 'Pengadaan langsung barang kebutuhan sekolah.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Columns: Product Specifications & Breakdown */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Main Product Card */}
                        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex gap-4">
                                    {/* Image with fallback */}
                                    <div className="size-24 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                                        {product.image_path ? (
                                            <img
                                                src={product.image_path}
                                                alt={product.name}
                                                className="size-full object-cover"
                                                onError={(e) => {
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-[var(--color-ink-muted)]">
                                                <Package
                                                    className="size-10"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-[var(--color-surface-subtle)] px-2.5 py-0.5 text-[10px] font-bold tracking-wide text-[var(--color-ink-muted)] uppercase">
                                                {product.category?.name ??
                                                    'Umum'}
                                            </span>
                                            {product.is_featured && (
                                                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                                    <Sparkles
                                                        className="size-3"
                                                        aria-hidden="true"
                                                    />
                                                    <span>Unggulan</span>
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="font-display mt-1 text-xl font-bold text-[var(--color-ink)]">
                                            {product.name}
                                        </h2>
                                        <p className="mt-1 font-mono text-xs text-[var(--color-ink-muted)]">
                                            Slug: {product.slug}
                                        </p>
                                    </div>
                                </div>

                                <div className="self-start">
                                    <StatusBadge variant={badge.variant}>
                                        {badge.label}
                                    </StatusBadge>
                                </div>
                            </div>

                            {/* Economics Breakdown Grid */}
                            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                        Harga Pokok / Modal
                                    </span>
                                    <div className="mt-1 font-mono">
                                        <PriceDisplay
                                            amount={product.base_price}
                                            size="md"
                                        />
                                    </div>
                                    <p className="mt-1 text-[10px] text-[var(--color-ink-muted)]">
                                        {isConsignment
                                            ? 'Hak bersih siswa penyetor'
                                            : 'Biaya kulakan koperasi'}
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                        Margin Koperasi
                                    </span>
                                    <div className="mt-1 font-mono font-bold text-[var(--color-primary)]">
                                        <PriceDisplay
                                            amount={product.cooperative_margin}
                                            size="md"
                                        />
                                    </div>
                                    <p className="mt-1 text-[10px] text-[var(--color-ink-muted)]">
                                        Bagi hasil operasional
                                    </p>
                                </div>

                                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-emerald-800 uppercase">
                                        Harga Jual Resmi
                                    </span>
                                    <div className="mt-1 font-mono font-bold text-emerald-900">
                                        <PriceDisplay
                                            amount={product.selling_price}
                                            size="md"
                                        />
                                    </div>
                                    <p className="mt-1 text-[10px] text-emerald-700">
                                        Harga tayang di etalase
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                        Stok Fisik
                                    </span>
                                    <div className="font-display mt-1 text-lg font-bold text-[var(--color-ink)]">
                                        {product.stock} unit
                                    </div>
                                    <p
                                        className={`mt-1 text-[10px] font-semibold ${product.stock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}
                                    >
                                        {product.stock > 0
                                            ? 'Tersedia di loket'
                                            : 'Stok habis'}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="mt-5">
                                <h4 className="text-xs font-bold text-[var(--color-ink)]">
                                    Deskripsi & Informasi Produk
                                </h4>
                                <div className="mt-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/30 p-4 text-xs leading-relaxed whitespace-pre-line text-[var(--color-ink)]">
                                    {product.description ||
                                        'Tidak ada deskripsi rinci untuk produk ini.'}
                                </div>
                            </div>
                        </div>

                        {/* Associated Student Consignment Submission (if applicable) */}
                        {isConsignment &&
                            product.submissions &&
                            product.submissions.length > 0 && (
                                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Inbox
                                                className="size-4 text-[var(--color-primary)]"
                                                aria-hidden="true"
                                            />
                                            <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                                                Riwayat Pengajuan Titipan
                                                Terkait
                                            </h3>
                                        </div>
                                        <Link
                                            href={`/cooperative/consignments/${product.submissions[0].id}`}
                                            className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                        >
                                            Buka Tiket Pengajuan #
                                            {product.submissions[0].id}
                                        </Link>
                                    </div>
                                    <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                                        Pengajuan titipan disetujui pada{' '}
                                        {formatIdDate(
                                            product.submissions[0].reviewed_at,
                                        )}{' '}
                                        dengan kuantitas awal{' '}
                                        {product.submissions[0].proposed_stock}{' '}
                                        unit.
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* Right 1 Column: Metadata & System Timestamps */}
                    <div className="space-y-6">
                        {/* Student Owner Info (if consignment) */}
                        {isConsignment && (
                            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
                                <div className="flex items-center gap-3">
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                                        <UserCheck
                                            className="size-5"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                            Siswa Pemilik Aset
                                        </span>
                                        <h3 className="font-display truncate text-sm font-bold text-[var(--color-ink)]">
                                            {product.owner?.name ?? 'Siswa'}
                                        </h3>
                                        <p className="text-xs text-[var(--color-ink-muted)]">
                                            {product.owner?.student_identifier
                                                ? `NIS: ${product.owner.student_identifier}`
                                                : 'Siswa Terdaftar KOPDIG'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Lifecycle & Audit Card */}
                        <div className="space-y-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
                            <h3 className="font-display text-xs font-bold tracking-wider text-[var(--color-ink)] uppercase">
                                Jejak Waktu & Status Publikasi
                            </h3>

                            <div className="divide-y divide-[var(--color-border-subtle)] text-xs">
                                <div className="flex items-center justify-between py-2">
                                    <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                                        <Clock
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Status Katalog:</span>
                                    </span>
                                    <StatusBadge variant={badge.variant}>
                                        {badge.label}
                                    </StatusBadge>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                                        <Calendar
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Diterbitkan:</span>
                                    </span>
                                    <span className="font-medium text-[var(--color-ink)]">
                                        {formatIdDate(product.published_at)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                                        <Clock
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Terakhir Diubah:</span>
                                    </span>
                                    <span className="font-medium text-[var(--color-ink)]">
                                        {formatIdDate(product.updated_at)}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between py-2">
                                    <span className="flex items-center gap-1.5 text-[var(--color-ink-muted)]">
                                        <Package
                                            className="size-3.5"
                                            aria-hidden="true"
                                        />
                                        <span>Didaftarkan:</span>
                                    </span>
                                    <span className="font-medium text-[var(--color-ink)]">
                                        {formatIdDate(product.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2">
                                <Link
                                    href={`/cooperative/products/${product.slug}/edit`}
                                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                                >
                                    <Edit3
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    <span>Ubah Data & Pengaturan Harga</span>
                                </Link>
                            </div>
                        </div>

                        {/* Operational Guidance */}
                        <div className="space-y-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-4 text-xs text-[var(--color-ink-muted)]">
                            <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)]">
                                <HelpCircle
                                    className="size-4 text-[var(--color-primary)]"
                                    aria-hidden="true"
                                />
                                <span>Pedoman Operasional Katalog</span>
                            </div>
                            <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                                <li>
                                    Perubahan harga jual produk tidak akan
                                    mempengaruhi rincian transaksi pada pesanan
                                    historis siswa.
                                </li>
                                {isConsignment && (
                                    <li>
                                        Harga pokok titipan siswa bersifat tetap
                                        sesuai persetujuan awal konsinyasi.
                                    </li>
                                )}
                                <li>
                                    Untuk menonaktifkan produk sementara dari
                                    pencarian etalase, ubah status menjadi
                                    &quot;Tidak Aktif&quot;.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </CooperativeShell>
    );
}
