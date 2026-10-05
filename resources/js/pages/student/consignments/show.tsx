import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Edit3,
    ExternalLink,
    Package,
    ShieldCheck,
} from 'lucide-react';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { ProductSubmission } from '@/types/consignment';

interface Props {
    submission: ProductSubmission;
}

export default function StudentConsignmentShow({ submission }: Props) {
    const canEdit = submission.status === 'submitted';

    // Status badge helper
    const getStatusDisplay = () => {
        switch (submission.status) {
            case 'approved':
                return {
                    label: 'Disetujui & Resmi Masuk Katalog',
                    badge: (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                            <CheckCircle2 className="size-3.5" />
                            Disetujui
                        </span>
                    ),
                    banner: (
                        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-xs text-emerald-300">
                            <div className="flex items-start gap-3">
                                <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
                                <div>
                                    <p className="font-heading font-bold text-[#F5F2EB]">
                                        Produk Disetujui & Resmi Masuk Katalog!
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A3A3]">
                                        Produk karyamu kini dijual secara resmi
                                        di gerai KOPDIG sekolah. Pembeli dapat
                                        memesan melalui marketplace.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ),
                };
            case 'under_review':
                return {
                    label: 'Sedang Ditinjau oleh Pengurus',
                    badge: (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-950/40 px-3 py-1 font-mono text-xs font-semibold text-sky-300">
                            <Clock className="size-3.5" />
                            Sedang Ditinjau
                        </span>
                    ),
                    banner: (
                        <div className="mb-6 rounded-2xl border border-sky-500/30 bg-sky-950/20 p-4 text-xs text-sky-300">
                            <div className="flex items-start gap-3">
                                <Clock className="size-5 shrink-0 text-sky-400" />
                                <div>
                                    <p className="font-heading font-bold text-[#F5F2EB]">
                                        Sedang Ditinjau Pengurus Koperasi
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A3A3]">
                                        Pengurus koperasi sedang memeriksa
                                        sampel mutu dan menghitung margin
                                        operasional wajar.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ),
                };
            case 'rejected':
                return {
                    label: 'Pengajuan Ditolak',
                    badge: (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-950/40 px-3 py-1 font-mono text-xs font-semibold text-rose-400">
                            <AlertCircle className="size-3.5" />
                            Ditolak
                        </span>
                    ),
                    banner: (
                        <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
                            <div className="flex items-start gap-3">
                                <AlertCircle className="size-5 shrink-0 text-rose-400" />
                                <div>
                                    <p className="font-heading font-bold text-[#F5F2EB]">
                                        Pengajuan Belum Dapat Disetujui
                                    </p>
                                    <p className="mt-1 font-semibold text-rose-200">
                                        Catatan Koperasi:
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#F5F2EB]">
                                        {submission.rejection_reason ??
                                            'Produk belum memenuhi kriteria mutu koperasi saat ini.'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ),
                };
            default:
                return {
                    label: 'Menunggu Antrean Review',
                    badge: (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 font-mono text-xs font-semibold text-amber-400">
                            <Clock className="size-3.5" />
                            Diajukan
                        </span>
                    ),
                    banner: (
                        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-300">
                            <div className="flex items-start gap-3">
                                <Clock className="size-5 shrink-0 text-amber-400" />
                                <div>
                                    <p className="font-heading font-bold text-[#F5F2EB]">
                                        Pengajuan Masuk Antrean Review
                                    </p>
                                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A3A3]">
                                        Pengajuanmu telah diterima sistem dan
                                        menunggu giliran pemeriksaan fisik oleh
                                        pengurus koperasi sekolah.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ),
                };
        }
    };

    const statusDisplay = getStatusDisplay();

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title={`Detail Pengajuan — ${submission.name} | KOPDIG`} />

            {/* ATMOSPHERIC BACKGROUND SYSTEM */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.15),transparent)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#26262612_1px,transparent_1px),linear-gradient(to_bottom,#26262612_1px,transparent_1px)] bg-[size:40px_40px]"
            />

            {/* 1. TOP TRANSACTIONAL HEADER */}
            <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
                    {/* Left: Back Navigation */}
                    <button
                        type="button"
                        onClick={() =>
                            safeNavigateBack('/student/consignments')
                        }
                        className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke daftar titipan"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Daftar Titipan</span>
                    </button>

                    {/* Center: Brand Mark */}
                    <Link
                        href="/explore"
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo SMK Negeri 1 Ciomas - KOPDIG"
                            className="h-8 w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="font-heading text-sm leading-none font-bold tracking-tight text-[#F5F2EB]">
                                KOPDIG
                            </span>
                            <span className="mt-0.5 font-mono text-[9px] tracking-wider text-[#737373] uppercase">
                                Detail Pengajuan
                            </span>
                        </div>
                    </Link>

                    {/* Right: Action or Edit */}
                    <div className="flex items-center gap-2">
                        {canEdit && (
                            <Link
                                href={`/student/consignments/${submission.id}/edit`}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27]"
                            >
                                <Edit3 className="size-3.5" />
                                <span>Ubah</span>
                            </Link>
                        )}
                        <Link
                            href="/settings/profile"
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                        >
                            <span>Akun Hub</span>
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. MAIN CONTENT */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* Status Notice Banner */}
                {statusDisplay.banner}

                {/* Main Card Header */}
                <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex max-w-2xl flex-col gap-5 sm:flex-row sm:items-start">
                            <div className="size-24 shrink-0 overflow-hidden rounded-2xl border border-[#262626] bg-[#181818] sm:size-28">
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

                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md border border-[#262626] bg-[#0A0A0A] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#A3A3A3] uppercase">
                                        {submission.category?.name ??
                                            'Kategori'}
                                    </span>
                                    {statusDisplay.badge}
                                </div>

                                <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                                    {submission.name}
                                </h1>

                                <p className="mt-3 text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                    {submission.description}
                                </p>
                            </div>
                        </div>

                        {/* Approved Link CTA */}
                        {submission.status === 'approved' &&
                            submission.product && (
                                <div className="shrink-0">
                                    <Link
                                        href={`/products/${submission.product.slug}`}
                                        className="group inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#E34A27] px-5 py-2.5 font-heading text-xs font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#d03f1e] active:scale-95"
                                    >
                                        <span>Buka di Katalog Publik</span>
                                        <ExternalLink className="size-3.5" />
                                    </Link>
                                </div>
                            )}
                    </div>

                    {/* Financial & Stock Metrics Grid */}
                    <div className="mt-8 grid grid-cols-1 gap-4 border-t border-[#262626] pt-6 sm:grid-cols-3">
                        {/* 1. Modal Bersih */}
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-4">
                            <span className="block font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                Modal Bersih (Hak Siswa)
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-[#F5F2EB]">
                                {formatRupiah(submission.base_price)}
                            </span>
                            <p className="mt-1 text-[10px] text-[#737373]">
                                Diterima utuh per pcs saat produk laku
                            </p>
                        </div>

                        {/* 2. Margin & Harga Jual */}
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-4">
                            <span className="block font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                Margin Koperasi & Harga Jual
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-[#E34A27]">
                                {submission.proposed_selling_price
                                    ? formatRupiah(
                                          submission.proposed_selling_price,
                                      )
                                    : 'Menunggu Kurasi'}
                            </span>
                            <p className="mt-1 text-[10px] text-[#737373]">
                                {submission.cooperative_margin
                                    ? `Margin: +${formatRupiah(submission.cooperative_margin)}`
                                    : 'Dihitung saat verifikasi'}
                            </p>
                        </div>

                        {/* 3. Stok Diajukan */}
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-4">
                            <span className="block font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                Pasokan Stok Diajukan
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-[#F5F2EB]">
                                {submission.proposed_stock} pcs
                            </span>
                            <p className="mt-1 text-[10px] text-[#737373]">
                                Disiapkan untuk display loket
                            </p>
                        </div>
                    </div>
                </div>

                {/* Audit & Legal Ownership Assurance */}
                <div className="mt-8 rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-xl sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                                <ShieldCheck className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-heading text-xs font-bold text-[#F5F2EB]">
                                    Prinsip Konsinyasi KOPDIG
                                </h3>
                                <p className="text-[11px] text-[#737373]">
                                    Karya mandiri tetap menjadi milikmu
                                    sepenuhnya. Koperasi bertindak sebagai ruang
                                    kurasi dan etalase transaksi bersama.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-[#737373]">
                            <span>
                                Diajukan:{' '}
                                {new Date(
                                    submission.created_at,
                                ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
