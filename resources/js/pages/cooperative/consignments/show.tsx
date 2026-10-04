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
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#262626] bg-[#161616] px-3.5 py-2 text-xs font-semibold text-[#F5F2EB] shadow-xs transition-colors hover:bg-[#202020]"
                    >
                        <ArrowLeft
                            className="size-4 text-[#737373]"
                            aria-hidden="true"
                        />
                        <span>Kembali ke Daftar Titipan</span>
                    </Link>

                    <div className="flex items-center gap-2">
                        <span className="text-xs text-[#737373]">
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

                {/* Mandatory Product Ownership Display (docs & rule compliance) */}
                <div className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#737373] uppercase">
                        <ShieldCheck
                            className="size-4 text-[#E34A27]"
                            aria-hidden="true"
                        />
                        <span>
                            Struktur Kepemilikan & Tanggung Jawab Operasional
                        </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border border-[#262626] bg-[#161616] p-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                1. Pemilik Sah Produk
                            </span>
                            <div className="font-display mt-1 flex items-center gap-2 text-sm font-bold text-[#F5F2EB]">
                                <User
                                    className="size-4 text-[#E34A27]"
                                    aria-hidden="true"
                                />
                                <span className="truncate">
                                    {submission.student?.name ??
                                        'Siswa Pengusul'}
                                </span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#737373]">
                                Tetap menjadi pemilik sah aset (
                                <code className="font-mono text-[10px] text-[#F5F2EB]">
                                    products.owner_id
                                </code>
                                ).
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#262626] bg-[#161616] p-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                2. Operator & Kurator
                            </span>
                            <div className="font-display mt-1 flex items-center gap-2 text-sm font-bold text-[#F5F2EB]">
                                <Store
                                    className="size-4 text-[#E34A27]"
                                    aria-hidden="true"
                                />
                                <span>Koperasi Siswa (KOPDIG)</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#737373]">
                                Kurasi mutu, penetapan margin koperasi, dan
                                etalase fisik.
                            </p>
                        </div>

                        <div className="rounded-xl border border-[#262626] bg-[#161616] p-3.5">
                            <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                3. Klasifikasi Sumber
                            </span>
                            <div className="font-display mt-1 flex items-center gap-2 text-sm font-bold text-[#E34A27]">
                                <Tag
                                    className="size-4 text-[#E34A27]"
                                    aria-hidden="true"
                                />
                                <span>Karya Titipan Siswa</span>
                            </div>
                            <p className="mt-1 text-[11px] text-[#737373]">
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
                        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                            <div className="flex items-center gap-3">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-[#E34A27]/15 text-[#E34A27]">
                                    <UserCheck
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                        Data Siswa Pengusul
                                    </span>
                                    <h3 className="font-display truncate text-sm font-bold text-[#F5F2EB]">
                                        {submission.student?.name}
                                    </h3>
                                    <p className="text-xs text-[#737373]">
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
                        <div className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs sm:p-6">
                            <div className="flex flex-col gap-4 border-b border-[#262626] pb-4 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex gap-4">
                                    {/* Image with fallback */}
                                    <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-[#262626] bg-[#181818]">
                                        {submission.image_path ? (
                                            <img
                                                src={
                                                    submission.image_path.startsWith(
                                                        'http',
                                                    ) ||
                                                    submission.image_path.startsWith(
                                                        '/',
                                                    )
                                                        ? submission.image_path
                                                        : `/storage/${submission.image_path}`
                                                }
                                                alt={submission.name}
                                                className="size-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to placeholder icon
                                                    (
                                                        e.currentTarget as HTMLElement
                                                    ).style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex size-full items-center justify-center text-[#737373]">
                                                <Package
                                                    className="size-8"
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg border border-[#262626] bg-[#161616] px-2 py-0.5 text-[10px] font-bold tracking-wide text-[#A3A3A3] uppercase">
                                                {submission.category?.name ??
                                                    'Umum'}
                                            </span>
                                            <span className="text-[10px] text-[#737373]">
                                                ID #{submission.id}
                                            </span>
                                        </div>
                                        <h2 className="font-display mt-1 text-lg font-bold text-[#F5F2EB]">
                                            {submission.name}
                                        </h2>
                                        <p className="mt-0.5 text-xs text-[#737373]">
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
                                <div className="rounded-xl border border-[#262626] bg-[#161616] p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                        Harga Pokok / Modal Siswa
                                    </span>
                                    <div className="mt-1 font-mono text-[#A3A3A3]">
                                        <PriceDisplay
                                            amount={submission.base_price}
                                            size="md"
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#737373]">
                                        Nominal yang diserahkan utuh kepada
                                        siswa penyetor per unit terjual.
                                    </p>
                                </div>

                                <div className="rounded-xl border border-[#262626] bg-[#161616] p-3.5">
                                    <span className="text-[10px] font-bold tracking-wider text-[#737373] uppercase">
                                        Rencana Unit Stok Awal
                                    </span>
                                    <div className="font-display mt-1 text-lg font-bold text-[#F5F2EB]">
                                        {submission.proposed_stock} unit
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#737373]">
                                        Akan langsung dicatat sebagai mutasi
                                        restock saat disetujui.
                                    </p>
                                </div>
                            </div>

                            {/* Description and composition */}
                            <div className="mt-5">
                                <h4 className="text-xs font-bold text-[#F5F2EB]">
                                    Deskripsi & Spesifikasi Produk
                                </h4>
                                <div className="mt-1.5 rounded-xl border border-[#262626] bg-[#161616] p-3.5 text-xs leading-relaxed whitespace-pre-line text-[#A3A3A3]">
                                    {submission.description ||
                                        'Tidak ada deskripsi tambahan dari siswa.'}
                                </div>
                            </div>
                        </div>

                        {/* Finalized Approved Details Display if already approved */}
                        {submission.status === 'approved' && (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5 shadow-xs">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <CheckCircle2
                                        className="size-5 text-emerald-400"
                                        aria-hidden="true"
                                    />
                                    <h3 className="font-display text-sm font-bold">
                                        Pengajuan Telah Disetujui & Diterbitkan
                                        ke Katalog
                                    </h3>
                                </div>
                                <p className="mt-1 text-xs leading-relaxed text-emerald-400/90">
                                    Produk ini resmi terdaftar di marketplace
                                    KOPDIG dengan status aktif. Mutasi
                                    inventaris awal telah dicatat otomatis pada
                                    pembukuan koperasi.
                                </p>

                                <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <span className="text-[10px] text-[#737373]">
                                            Modal Siswa
                                        </span>
                                        <div className="mt-0.5 font-bold text-[#F5F2EB]">
                                            <PriceDisplay
                                                amount={submission.base_price}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <span className="text-[10px] text-[#737373]">
                                            Margin Koperasi
                                        </span>
                                        <div className="mt-0.5 font-bold text-[#E34A27]">
                                            <PriceDisplay
                                                amount={
                                                    submission.cooperative_margin ??
                                                    0
                                                }
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <span className="text-[10px] text-[#737373]">
                                            Harga Jual Resmi
                                        </span>
                                        <div className="mt-0.5 font-bold text-emerald-400">
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
                                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-3">
                                        <span className="text-[10px] text-[#737373]">
                                            Stok Masuk
                                        </span>
                                        <div className="mt-0.5 font-bold text-[#F5F2EB]">
                                            {submission.proposed_stock} unit
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-col gap-2 border-t border-emerald-500/20 pt-3 text-[11px] text-emerald-400/90 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        Ditinjau oleh:{' '}
                                        <span className="font-semibold text-[#F5F2EB]">
                                            {submission.reviewer?.name ??
                                                'Operator Koperasi'}
                                        </span>
                                        {submission.reviewed_at &&
                                            ` pada ${formatIdDate(submission.reviewed_at)}`}
                                    </div>
                                    {submission.product?.slug && (
                                        <Link
                                            href={`/products/${submission.product.slug}`}
                                            className="inline-flex min-h-[44px] items-center gap-1.5 font-semibold text-[#E34A27] hover:underline"
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
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 shadow-xs">
                                <div className="flex items-center gap-2 text-rose-400">
                                    <XCircle
                                        className="size-5 text-rose-400"
                                        aria-hidden="true"
                                    />
                                    <h3 className="font-display text-sm font-bold">
                                        Pengajuan Telah Ditolak
                                    </h3>
                                </div>
                                <p className="mt-1 text-xs text-rose-400/90">
                                    Pengajuan ini ditolak dan tidak diterbitkan
                                    ke katalog. Catatan feedback telah
                                    dikirimkan ke siswa untuk bahan perbaikan.
                                </p>

                                <div className="mt-3 rounded-xl border border-rose-500/20 bg-[#121212] p-3.5 text-xs text-rose-300">
                                    <span className="block text-[10px] font-bold tracking-wider text-rose-400 uppercase">
                                        Alasan / Catatan Evaluasi:
                                    </span>
                                    <p className="mt-1 leading-relaxed whitespace-pre-line text-[#F5F2EB]">
                                        {submission.rejection_reason ||
                                            'Tidak ada catatan spesifik.'}
                                    </p>
                                </div>

                                <div className="mt-3 text-[11px] text-rose-400/90">
                                    Ditinjau oleh:{' '}
                                    <span className="font-semibold text-[#F5F2EB]">
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
                            <div className="rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                                {/* Action Navigation Tabs */}
                                <div className="grid grid-cols-2 gap-1 rounded-xl border border-[#262626] bg-[#161616] p-1 text-xs font-semibold">
                                    <button
                                        type="button"
                                        onClick={() => setActionTab('approve')}
                                        className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg transition-all ${
                                            actionTab === 'approve'
                                                ? 'border border-emerald-500/30 bg-[#1E1E1E] text-emerald-400 shadow-xs'
                                                : 'text-[#737373] hover:text-[#F5F2EB]'
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
                                                ? 'border border-rose-500/30 bg-[#1E1E1E] text-rose-400 shadow-xs'
                                                : 'text-[#737373] hover:text-[#F5F2EB]'
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
                                                <h3 className="font-display text-sm font-bold text-[#F5F2EB]">
                                                    Tetapkan Margin Koperasi
                                                </h3>
                                                <span className="rounded-full border border-emerald-500/20 bg-emerald-950/40 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                                    Wajib
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-[#737373]">
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
                                                    className="block text-xs font-semibold text-[#F5F2EB]"
                                                >
                                                    Margin Koperasi (Rp)
                                                </label>
                                                <div className="relative mt-1">
                                                    <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[#737373]">
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
                                                        className="min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] pr-3 pl-9 font-mono text-xs font-medium text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                                    />
                                                </div>
                                                {approveForm.errors
                                                    .cooperative_margin && (
                                                    <p className="mt-1 text-xs text-rose-400">
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
                                                                    ? 'bg-[#E34A27] text-white shadow-xs'
                                                                    : 'border border-[#262626] bg-[#161616] text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F5F2EB]'
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
                                            <div className="rounded-xl border border-[#E34A27]/25 bg-[#E34A27]/10 p-3.5 text-xs">
                                                <span className="text-[10px] font-bold tracking-wider text-[#E34A27] uppercase">
                                                    Kalkulasi Harga Jual KOPDIG
                                                </span>
                                                <div className="mt-2 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                                        <span>
                                                            Harga Dasar Siswa:
                                                        </span>
                                                        <span className="font-mono text-[#F5F2EB]">
                                                            <PriceDisplay
                                                                amount={
                                                                    submission.base_price
                                                                }
                                                                size="sm"
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                                        <span>
                                                            Margin Koperasi (+):
                                                        </span>
                                                        <span className="font-mono font-semibold text-[#E34A27]">
                                                            <PriceDisplay
                                                                amount={
                                                                    parsedMargin
                                                                }
                                                                size="sm"
                                                            />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-t border-[#E34A27]/20 pt-2 text-sm font-bold text-[#E34A27]">
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
                                            <div className="space-y-1.5 rounded-xl border border-[#262626] bg-[#161616] p-3 text-[11px]">
                                                <div className="flex items-center gap-1.5 font-bold text-[#F5F2EB]">
                                                    <Info
                                                        className="size-3.5 text-[#E34A27]"
                                                        aria-hidden="true"
                                                    />
                                                    <span>
                                                        Pratinjau Hasil Rilis
                                                        Produk:
                                                    </span>
                                                </div>
                                                <div className="space-y-1 text-[#A3A3A3]">
                                                    <p>
                                                        •{' '}
                                                        <strong className="text-[#F5F2EB]">
                                                            Nama:
                                                        </strong>{' '}
                                                        {submission.name}
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong className="text-[#F5F2EB]">
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
                                                        <strong className="text-[#F5F2EB]">
                                                            Harga Jual:
                                                        </strong>{' '}
                                                        Rp{' '}
                                                        {calculatedSellingPrice.toLocaleString(
                                                            'id-ID',
                                                        )}
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong className="text-[#F5F2EB]">
                                                            Stok Awal:
                                                        </strong>{' '}
                                                        {
                                                            submission.proposed_stock
                                                        }{' '}
                                                        unit (Otomatis Restock)
                                                    </p>
                                                    <p>
                                                        •{' '}
                                                        <strong className="text-[#F5F2EB]">
                                                            Status:
                                                        </strong>{' '}
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
                                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#E34A27] px-4 py-3 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#D03E1C] active:scale-[0.98] disabled:opacity-50"
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
                                                <h3 className="font-display text-sm font-bold text-rose-400">
                                                    Tolak Pengajuan Titipan
                                                </h3>
                                                <span className="rounded-full border border-rose-500/20 bg-rose-950/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-400">
                                                    Wajib Alasan
                                                </span>
                                            </div>
                                            <p className="mt-1 text-xs leading-relaxed text-[#737373]">
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
                                                        className="block text-xs font-semibold text-[#F5F2EB]"
                                                    >
                                                        Catatan / Alasan
                                                        Penolakan{' '}
                                                        <span className="text-rose-400">
                                                            *
                                                        </span>
                                                    </label>
                                                    <span className="text-[10px] text-[#737373]">
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
                                                    className="mt-1 w-full rounded-xl border border-rose-500/20 bg-rose-950/20 p-3 text-xs text-[#F5F2EB] placeholder:text-[#737373] focus:border-rose-500 focus:bg-[#161616] focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                                                />
                                                {rejectForm.errors
                                                    .rejection_reason && (
                                                    <p className="mt-1 text-xs text-rose-400">
                                                        {
                                                            rejectForm.errors
                                                                .rejection_reason
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            {/* Actionable Feedback Suggestion Chips */}
                                            <div>
                                                <span className="block text-[10px] font-semibold tracking-wide text-[#737373] uppercase">
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
                                                                className="min-h-[44px] rounded-lg border border-[#262626] bg-[#161616] px-2.5 py-2 text-left text-[11px] text-[#A3A3A3] transition-colors hover:border-rose-500/40 hover:bg-rose-950/20 hover:text-rose-300"
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
                                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-xs font-semibold text-rose-400 shadow-xs transition-all hover:bg-rose-900/60 hover:text-white active:scale-[0.98] disabled:opacity-50"
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
                            <div className="space-y-3 rounded-2xl border border-[#262626] bg-[#121212] p-5 text-center shadow-xs">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#181818] text-[#737373]">
                                    <Clock
                                        className="size-6"
                                        aria-hidden="true"
                                    />
                                </div>
                                <h3 className="font-display text-sm font-bold text-[#F5F2EB]">
                                    Status Pengajuan Terkunci
                                </h3>
                                <p className="text-xs leading-relaxed text-[#737373]">
                                    Pengajuan ini telah diproses sebelumnya (
                                    {badge.label}) dan tidak dapat diubah
                                    kembali demi integritas audit dan riwayat
                                    transaksi.
                                </p>
                                <div className="pt-2">
                                    <Link
                                        href="/cooperative/consignments"
                                        className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl border border-[#E34A27]/30 bg-[#E34A27]/10 px-4 py-2.5 text-xs font-semibold text-[#E34A27] transition-colors hover:bg-[#E34A27] hover:text-white"
                                    >
                                        Kembali ke Antrean Review
                                    </Link>
                                </div>
                            </div>
                        )}

                        {/* Operational Guidance Card */}
                        <div className="space-y-2 rounded-2xl border border-[#262626] bg-[#141414] p-4 text-xs text-[#737373]">
                            <div className="flex items-center gap-1.5 font-bold text-[#F5F2EB]">
                                <HelpCircle
                                    className="size-4 text-[#E34A27]"
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
