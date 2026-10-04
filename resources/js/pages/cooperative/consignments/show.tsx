import React, { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle2,
    Clock,
    HelpCircle,
    Info,
    Package,
    ShieldCheck,
    Sparkles,
    Store,
    Tag,
    User,
    UserCheck,
    X,
    XCircle,
} from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { StatusBadge } from '@/components/ui/status-badge';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import type { ProductSubmission } from '@/types/consignment';

type Props = {
    submission: ProductSubmission;
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeConsignmentShow({ submission }: Props) {
    const { flash } = usePage<PageProps>().props;

    // Margin configuration state (default 1000 or existing margin)
    const initialMargin =
        submission.cooperative_margin !== null &&
        submission.cooperative_margin !== undefined
            ? String(submission.cooperative_margin)
            : '1000';

    const [marginInput, setMarginInput] = useState<string>(initialMargin);
    const [actionTab, setActionTab] = useState<'approve' | 'reject'>('approve');

    const parsedMargin = Math.max(0, parseInt(marginInput, 10) || 0);
    const calculatedSellingPrice = submission.base_price + parsedMargin;

    const approveForm = useForm({
        cooperative_margin: parsedMargin,
    });

    const rejectForm = useForm({
        rejection_reason: '',
    });

    const isReviewed =
        submission.status === 'approved' || submission.status === 'rejected';

    const handleApprove = (e: React.FormEvent) => {
        e.preventDefault();
        approveForm.setData('cooperative_margin', parsedMargin);
        approveForm.post(`/cooperative/consignments/${submission.id}/approve`, {
            preserveScroll: true,
        });
    };

    const handleReject = (e: React.FormEvent) => {
        e.preventDefault();
        rejectForm.post(`/cooperative/consignments/${submission.id}/reject`, {
            preserveScroll: true,
        });
    };

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

    const badge = statusBadgeMeta(submission.status);

    // Quick feedback chips for rejection to encourage actionable operational feedback
    const rejectionSuggestions = [
        'Kemasan produk belum higienis / belum kedap udara.',
        'Informasi tanggal kedaluwarsa atau komposisi wajib dicantumkan pada kemasan.',
        'Harga dasar yang diajukan terlalu tinggi dibanding daya beli warga sekolah.',
        'Kapasitas etalase pendingin / display koperasi saat ini sedang penuh.',
    ];

    const applyRejectionTemplate = (template: string) => {
        const current = rejectForm.data.rejection_reason.trim();
        if (!current) {
            rejectForm.setData('rejection_reason', template);
        } else {
            rejectForm.setData('rejection_reason', `${current}\n${template}`);
        }
    };

    return (
        <CooperativeShell
            activeNav="consignments"
            title={`Tinjau Pengajuan — ${submission.name}`}
            subtitle="Pemeriksaan kelayakan produk titipan siswa, penetapan margin koperasi, dan keputusan kurasi katalog."
            breadcrumbs={[
                { label: 'Titipan Siswa', href: '/cooperative/consignments' },
                { label: submission.name },
            ]}
        >
            <div className="space-y-6">
                {/* Back button and navigation header */}
                <div className="flex items-center justify-between">
                    <Link
                        href="/cooperative/consignments"
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-xs transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span>Kembali ke Daftar Titipan</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-ink-muted)]">
                            Status Pengajuan:
                        </span>
                        <StatusBadge variant={badge.variant}>
                            {badge.label}
                        </StatusBadge>
                    </div>
                </div>

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

                {/* Mandatory Product Ownership Display (docs & rule compliance) */}
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
                                    {submission.student?.name ??
                                        'Siswa Pengusul'}
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                Tetap menjadi pemilik sah aset (
                                <code className="font-mono text-[10px]">
                                    products.owner_id
                                </code>
                                ).
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
                                Kurasi mutu, penetapan margin koperasi, dan
                                etalase fisik.
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
                                <span>Karya Titipan Siswa</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                Model konsinyasi resmi sekolah berbasis bagi
                                hasil.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main 2-Column Responsive Layout */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Left 2 Cols: Submission & Product Inspection Details */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Student Author Card (Privacy-Compliant: No email or sensitive data) */}
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
                                        Data Siswa Pengusul
                                    </span>
                                    <h3 className="font-display truncate text-sm font-bold text-[var(--color-ink)]">
                                        {submission.student?.name}
                                    </h3>
                                    <p className="text-xs text-[var(--color-ink-muted)]">
                                        {submission.student?.student_identifier
                                            ? `NIS / No. Pelajar: ${submission.student.student_identifier}`
                                            : 'Siswa Terdaftar KOPDIG'}
                                        {' • '}
                                        Diajukan pada{' '}
                                        {formatIdDate(submission.created_at)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Product Detail & Spec Card */}
                        <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex gap-4">
                                    {/* Image with fallback */}
                                    <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]">
                                        {submission.image_path ? (
                                            <img
                                                src={submission.image_path}
                                                alt={submission.name}
                                                className="size-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to placeholder icon
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.display = 'none';
                                                    if (
                                                        e.currentTarget
                                                            .parentElement
                                                    ) {
                                                        const placeholder =
                                                            document.createElement(
                                                                'div',
                                                            );
                                                        placeholder.className =
                                                            'size-full flex items-center justify-center text-[var(--color-ink-muted)]';
                                                        placeholder.innerHTML =
                                                            '<svg class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>';
                                                        e.currentTarget.parentElement.appendChild(
                                                            placeholder,
                                                        );
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-[var(--color-ink-muted)]">
                                                <Package
                                                    className="size-8"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-[var(--color-surface-subtle)] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[var(--color-ink-muted)] uppercase">
                                                {submission.category?.name ??
                                                    'Umum'}
                                            </span>
                                            <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                ID #{submission.id}
                                            </span>
                                        </div>
                                        <h2 className="font-display mt-1 text-lg font-bold text-[var(--color-ink)]">
                                            {submission.name}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-[var(--color-ink-muted)]">
                                            Kategori:{' '}
                                            {submission.category?.name ??
                                                'Umum'}
                                        </p>
                                    </div>
                                </div>

                                <div className="self-start">
                                    <StatusBadge variant={badge.variant}>
                                        {badge.label}
                                    </StatusBadge>
                                </div>
                            </div>

                            {/* Base Economics Breakdown */}
                            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                        Harga Pokok / Modal Siswa
                                    </span>
                                    <div className="mt-1 font-mono">
                                        <PriceDisplay
                                            amount={submission.base_price}
                                            size="md"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                        Nominal yang diserahkan utuh kepada
                                        siswa penyetor per unit terjual.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                        Rencana Unit Stok Awal
                                    </span>
                                    <div className="font-display mt-1 text-lg font-bold text-[var(--color-ink)]">
                                        {submission.proposed_stock} unit
                                    </div>
                                    <p className="mt-1 text-[11px] text-[var(--color-ink-muted)]">
                                        Akan langsung dicatat sebagai mutasi
                                        restock saat disetujui.
                                    </p>
                                </div>
                            </div>

                            {/* Description and composition */}
                            <div className="mt-5">
                                <h4 className="text-xs font-bold text-[var(--color-ink)]">
                                    Deskripsi & Spesifikasi Produk
                                </h4>
                                <div className="mt-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/30 p-3.5 text-xs leading-relaxed whitespace-pre-line text-[var(--color-ink)]">
                                    {submission.description ||
                                        'Tidak ada deskripsi tambahan dari siswa.'}
                                </div>
                            </div>
                        </div>

                        {/* Finalized Approved Details Display if already approved */}
                        {submission.status === 'approved' && (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
                                <div className="flex items-center gap-2 text-emerald-800">
                                    <CheckCircle2
                                        className="size-5 text-emerald-600"
                                        aria-hidden="true"
                                    />
                                    <h3 className="font-display text-sm font-bold">
                                        Pengajuan Telah Disetujui & Diterbitkan
                                        ke Katalog
                                    </h3>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-emerald-900">
                                    Produk ini resmi terdaftar di marketplace
                                    KOPDIG dengan status aktif. Mutasi
                                    inventaris awal telah dicatat otomatis pada
                                    pembukuan koperasi.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                                        <span className="text-[10px] text-[var(--color-ink-muted)]">
                                            Modal Siswa
                                        </span>
                                        <div className="mt-0.5 font-bold text-[var(--color-ink)]">
                                            <PriceDisplay
                                                amount={submission.base_price}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                                        <span className="text-[10px] text-[var(--color-ink-muted)]">
                                            Margin Koperasi
                                        </span>
                                        <div className="mt-0.5 font-bold text-[var(--color-primary)]">
                                            <PriceDisplay
                                                amount={
                                                    submission.cooperative_margin ??
                                                    0
                                                }
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                                        <span className="text-[10px] text-[var(--color-ink-muted)]">
                                            Harga Jual Resmi
                                        </span>
                                        <div className="mt-0.5 font-bold text-emerald-700">
                                            <PriceDisplay
                                                amount={
                                                    submission.proposed_selling_price ??
                                                    submission.base_price +
                                                        (submission.cooperative_margin ??
                                                            0)
                                                }
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-emerald-100 bg-white p-3">
                                        <span className="text-[10px] text-[var(--color-ink-muted)]">
                                            Stok Masuk
                                        </span>
                                        <div className="mt-0.5 font-bold text-[var(--color-ink)]">
                                            {submission.proposed_stock} unit
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 border-t border-emerald-200/60 pt-3 text-[11px] text-emerald-900 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        Ditinjau oleh:{' '}
                                        <span className="font-semibold">
                                            {submission.reviewer?.name ??
                                                'Operator Koperasi'}
                                        </span>
                                        {submission.reviewed_at &&
                                            ` pada ${formatIdDate(submission.reviewed_at)}`}
                                    </div>
                                    {submission.product?.slug && (
                                        <Link
                                            href={`/products/${submission.product.slug}`}
                                            className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-[var(--color-primary)] hover:underline"
                                        >
                                            <span>
                                                Lihat di Katalog Marketplace
                                            </span>
                                            <Sparkles
                                                className="size-3.5"
                                                aria-hidden="true"
                                            />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Finalized Rejected Details Display if already rejected */}
                        {submission.status === 'rejected' && (
                            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-5 shadow-xs">
                                <div className="flex items-center gap-2 text-rose-800">
                                    <XCircle
                                        className="size-5 text-rose-600"
                                        aria-hidden="true"
                                    />
                                    <h3 className="font-display text-sm font-bold">
                                        Pengajuan Telah Ditolak
                                    </h3>
                                </div>
                                <p className="mt-1 text-xs text-rose-900">
                                    Pengajuan ini ditolak dan tidak diterbitkan
                                    ke katalog. Catatan feedback telah
                                    dikirimkan ke siswa untuk bahan perbaikan.
                                </p>

                                <div className="mt-3 rounded-xl border border-rose-200 bg-white p-3.5 text-xs text-rose-950">
                                    <span className="block text-[10px] font-bold tracking-wider text-rose-800 uppercase">
                                        Alasan / Catatan Evaluasi:
                                    </span>
                                    <p className="mt-1 leading-relaxed whitespace-pre-line">
                                        {submission.rejection_reason ||
                                            'Tidak ada catatan spesifik.'}
                                    </p>
                                </div>

                                <div className="mt-3 text-[11px] text-rose-900">
                                    Ditinjau oleh:{' '}
                                    <span className="font-semibold">
                                        {submission.reviewer?.name ??
                                            'Operator Koperasi'}
                                    </span>
                                    {submission.reviewed_at &&
                                        ` pada ${formatIdDate(submission.reviewed_at)}`}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right 1 Col: Operational Action Panel (Approve with Margin / Reject) */}
                    <div className="space-y-6">
                        {!isReviewed ? (
                            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
                                {/* Action Navigation Tabs */}
                                <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-subtle)] p-1 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setActionTab('approve')}
                                        className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg transition-all ${
                                            actionTab === 'approve'
                                                ? 'bg-white text-[var(--color-primary)] shadow-xs'
                                                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                                        }`}
                                    >
                                        <CheckCircle2
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        <span>Setujui</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActionTab('reject')}
                                        className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg transition-all ${
                                            actionTab === 'reject'
                                                ? 'bg-white text-rose-700 shadow-xs'
                                                : 'text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'
                                        }`}
                                    >
                                        <XCircle
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        <span>Tolak</span>
                                    </button>
                                </div>

                                {/* TAB 1: Approval & Margin Configuration */}
                                {actionTab === 'approve' && (
                                    <div className="mt-5 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                                                    Tetapkan Margin Koperasi
                                                </h3>
                                                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                                    Wajib
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                                                Tentukan margin tetap (Rupiah)
                                                yang ditambahkan ke harga modal
                                                siswa untuk operasional
                                                koperasi.
                                            </p>
                                        </div>

                                        <form
                                            onSubmit={handleApprove}
                                            className="space-y-4"
                                        >
                                            {/* Margin Input Field */}
                                            <div>
                                                <label
                                                    htmlFor="cooperative_margin"
                                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                                >
                                                    Margin Koperasi (Rp)
                                                </label>
                                                <div className="relative mt-1">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[var(--color-ink-muted)]">
                                                        Rp
                                                    </span>
                                                    <input
                                                        id="cooperative_margin"
                                                        type="number"
                                                        required
                                                        min={0}
                                                        step={500}
                                                        value={marginInput}
                                                        onChange={(e) =>
                                                            setMarginInput(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Contoh: 1000"
                                                        className="min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 pr-3 pl-9 font-mono text-xs font-medium text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                                    />
                                                </div>
                                                {approveForm.errors
                                                    .cooperative_margin && (
                                                    <p className="mt-1 text-xs text-rose-600">
                                                        {
                                                            approveForm.errors
                                                                .cooperative_margin
                                                        }
                                                    </p>
                                                )}

                                                {/* Preset Margin Buttons */}
                                                <div className="mt-2 flex flex-wrap gap-1.5">
                                                    {[
                                                        '500',
                                                        '1000',
                                                        '1500',
                                                        '2000',
                                                        '3000',
                                                    ].map((preset) => (
                                                        <button
                                                            key={preset}
                                                            type="button"
                                                            onClick={() =>
                                                                setMarginInput(
                                                                    preset,
                                                                )
                                                            }
                                                            className={`min-h-[44px] rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                                                                marginInput ===
                                                                preset
                                                                    ? 'bg-[var(--color-primary)] text-white'
                                                                    : 'border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
                                                            }`}
                                                        >
                                                            +Rp{' '}
                                                            {parseInt(
                                                                preset,
                                                                10,
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Formula Visualization Box */}
                                            <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]/60 p-3.5 text-xs">
                                                <span className="text-[10px] font-bold tracking-wider text-[var(--color-primary)] uppercase">
                                                    Kalkulasi Harga Jual KOPDIG
                                                </span>
                                                <div className="mt-2 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                                                        <span>
                                                            Harga Dasar Siswa:
                                                        </span>
                                                        <span className="font-mono">
                                                            <PriceDisplay
                                                                amount={
                                                                    submission.base_price
                                                                }
                                                                size="sm"
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                                                        <span>
                                                            Margin Koperasi (+):
                                                        </span>
                                                        <span className="font-mono font-semibold text-[var(--color-primary)]">
                                                            <PriceDisplay
                                                                amount={
                                                                    parsedMargin
                                                                }
                                                                size="sm"
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-[var(--color-primary)]/20 pt-2 text-sm font-bold text-[var(--color-primary)]">
                                                        <span>
                                                            Harga Jual Katalog:
                                                        </span>
                                                        <span className="font-mono">
                                                            <PriceDisplay
                                                                amount={
                                                                    calculatedSellingPrice
                                                                }
                                                                size="sm"
                                                            />
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Pre-Approval Preview Card (Required by specification) */}
                                            <div className="space-y-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-[11px]">
                                                <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)]">
                                                    <Info
                                                        className="size-3.5 text-[var(--color-primary)]"
                                                        aria-hidden="true"
                                                    />
                                                    <span>
                                                        Pratinjau Hasil Rilis
                                                        Produk:
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-[var(--color-ink-muted)]">
                                                    <p>
                                                        • <strong>Nama:</strong>{' '}
                                                        {submission.name}
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong>
                                                            Pemilik Aset:
                                                        </strong>{' '}
                                                        {
                                                            submission.student
                                                                ?.name
                                                        }{' '}
                                                        (Siswa)
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong>
                                                            Harga Jual:
                                                        </strong>{' '}
                                                        Rp{' '}
                                                        {calculatedSellingPrice.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong>
                                                            Stok Awal:
                                                        </strong>{' '}
                                                        {
                                                            submission.proposed_stock
                                                        }{' '}
                                                        unit (Otomatis Restock)
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong>Status:</strong>{' '}
                                                        Aktif di Etalase KOPDIG
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <button
                                                type="submit"
                                                disabled={
                                                    approveForm.processing
                                                }
                                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <Check
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    {approveForm.processing
                                                        ? 'Memproses Persetujuan...'
                                                        : 'Setujui & Publikasikan Produk'}
                                                </span>
                                            </button>
                                        </form>
                                    </div>
                                )}

                                {/* TAB 2: Rejection Flow with Actionable Reason */}
                                {actionTab === 'reject' && (
                                    <div className="mt-5 space-y-4">
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-display text-sm font-bold text-rose-900">
                                                    Tolak Pengajuan Titipan
                                                </h3>
                                                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-800">
                                                    Wajib Alasan
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                                                Sampaikan umpan balik yang
                                                konstruktif dan jelas agar siswa
                                                memahami alasan penolakan dan
                                                dapat memperbaikinya.
                                            </p>
                                        </div>

                                        <form
                                            onSubmit={handleReject}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <label
                                                        htmlFor="rejection_reason"
                                                        className="block text-xs font-semibold text-[var(--color-ink)]"
                                                    >
                                                        Catatan / Alasan
                                                        Penolakan{' '}
                                                        <span className="text-rose-600">
                                                            *
                                                        </span>
                                                    </label>
                                                    <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                        Min. 5 karakter
                                                    </span>
                                                </div>

                                                <textarea
                                                    id="rejection_reason"
                                                    required
                                                    rows={4}
                                                    value={
                                                        rejectForm.data
                                                            .rejection_reason
                                                    }
                                                    onChange={(e) =>
                                                        rejectForm.setData(
                                                            'rejection_reason',
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Jelaskan alasan penolakan secara spesifik, misalnya kemasan belum kedap udara atau informasi kadaluwarsa belum tertera..."
                                                    className="mt-1 w-full rounded-xl border border-rose-200 bg-rose-50/30 p-3 text-xs text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] focus:border-rose-400 focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-rose-400 focus:outline-hidden"
                                                />
                                                {rejectForm.errors
                                                    .rejection_reason && (
                                                    <p className="mt-1 text-xs text-rose-600">
                                                        {
                                                            rejectForm.errors
                                                                .rejection_reason
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actionable Feedback Suggestion Chips */}
                                            <div>
                                                <span className="block text-[10px] font-semibold tracking-wide text-[var(--color-ink-muted)] uppercase">
                                                    Template Catatan Cepat (Klik
                                                    untuk menyisipkan):
                                                </span>
                                                <div className="mt-1.5 flex flex-col gap-1.5">
                                                    {rejectionSuggestions.map(
                                                        (suggestion, idx) => (
                                                            <button
                                                                key={idx}
                                                                type="button"
                                                                onClick={() =>
                                                                    applyRejectionTemplate(
                                                                        suggestion,
                                                                    )
                                                                }
                                                                className="min-h-[44px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 px-2.5 py-2 text-left text-[11px] text-[var(--color-ink)] transition-colors hover:border-rose-300 hover:bg-rose-50/50"
                                                            >
                                                                + {suggestion}
                                                            </button>
                                                        ),
                                                    )}
                                                </div>
                                            </div>

                                            {/* Destructive Action Button */}
                                            <button
                                                type="submit"
                                                disabled={
                                                    rejectForm.processing ||
                                                    !rejectForm.data.rejection_reason.trim()
                                                }
                                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700 shadow-xs transition-all hover:bg-rose-100 active:scale-[0.98] disabled:opacity-50"
                                            >
                                                <X
                                                    className="size-4"
                                                    aria-hidden="true"
                                                />
                                                <span>
                                                    {rejectForm.processing
                                                        ? 'Menyimpan Penolakan...'
                                                        : 'Tolak Pengajuan'}
                                                </span>
                                            </button>
                                        </form>
                                    </div>
                                )}
                            </div>
                        ) : (
                            /* State Locking Card for already finalized review */
                            <div className="space-y-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 text-center shadow-xs">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
                                    <Clock
                                        className="size-6"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                                    Status Pengajuan Terkunci
                                </h3>
                                <p className="text-xs leading-relaxed text-[var(--color-ink-muted)]">
                                    Pengajuan ini telah diproses sebelumnya (
                                    {badge.label}) dan tidak dapat diubah
                                    kembali demi integritas audit dan riwayat
                                    transaksi.
                                </p>
                                <div className="pt-2">
                                    <Link
                                        href="/cooperative/consignments"
                                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-[var(--color-primary-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                                    >
                                        Kembali ke Antrean Review
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Operational Guidance Card */}
                        <div className="space-y-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-4 text-xs text-[var(--color-ink-muted)]">
                            <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)]">
                                <HelpCircle
                                    className="size-4 text-[var(--color-primary)]"
                                    aria-hidden="true"
                                />
                                <span>Panduan Kurasi KOPDIG</span>
                            </div>
                            <ul className="list-disc space-y-1 pl-4 text-[11px] leading-relaxed">
                                <li>
                                    Pastikan sampel fisik produk telah diperiksa
                                    oleh staf piket koperasi.
                                </li>
                                <li>
                                    Margin koperasi dihitung secara nominal
                                    tetap per kemasan.
                                </li>
                                <li>
                                    Siswa dapat melihat status persetujuan
                                    secara real-time pada dashboard mereka.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </CooperativeShell>
    );
}
