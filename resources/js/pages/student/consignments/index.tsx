import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    ChevronRight,
    Clock,
    ExternalLink,
    Package,
    Plus,
    Sparkles,
    Store,
} from 'lucide-react';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { Product, ProductSubmission } from '@/types/consignment';

interface Props {
    submissions: ProductSubmission[];
    approvedProducts: Product[];
}

export default function StudentConsignmentIndex({
    submissions,
    approvedProducts,
}: Props) {
    // Status counts
    const countSubmitted = submissions.filter(
        (s) => s.status === 'submitted',
    ).length;
    const countUnderReview = submissions.filter(
        (s) => s.status === 'under_review',
    ).length;
    const countApproved = submissions.filter(
        (s) => s.status === 'approved',
    ).length;
    const countRejected = submissions.filter(
        (s) => s.status === 'rejected',
    ).length;

    // Status badge helper
    const getStatusBadge = (
        status: ProductSubmission['status'],
        label?: string,
    ) => {
        switch (status) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="size-2.5" />
                        {label || 'Disetujui'}
                    </span>
                );
            case 'under_review':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                        <Clock className="size-2.5" />
                        {label || 'Sedang Ditinjau'}
                    </span>
                );
            case 'submitted':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                        <Clock className="size-2.5" />
                        {label || 'Diajukan'}
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-rose-400">
                        <AlertCircle className="size-2.5" />
                        {label || 'Ditolak'}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-0.5 font-mono text-[10px] font-medium text-neutral-400">
                        {status}
                    </span>
                );
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title="Titipan Saya — Ruang Karya Siswa | KOPDIG" />

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
                        onClick={() => safeNavigateBack('/settings/profile')}
                        className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke akun profil"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Akun Hub</span>
                    </button>

                    {/* Center: Brand Mark */}
                    <Link
                        href="/explore"
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <div className="flex size-7.5 items-center justify-center bg-[#F5F2EB] font-heading text-xs font-black text-[#0A0A0A] transition-transform duration-300 hover:rotate-3">
                            K
                        </div>
                        <div className="flex flex-col">
                            <span className="font-heading text-sm leading-none font-bold tracking-tight text-[#F5F2EB]">
                                KOPDIG
                            </span>
                            <span className="mt-0.5 font-mono text-[9px] tracking-wider text-[#737373] uppercase">
                                Ruang Karya Siswa
                            </span>
                        </div>
                    </Link>

                    {/* Right: New Submission CTA */}
                    <Link
                        href="/student/consignments/create"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[#E34A27] px-4 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[#d03f1e] active:scale-95"
                    >
                        <Plus className="size-3.5" />
                        <span>Ajukan Titipan</span>
                    </Link>
                </div>
            </header>

            {/* 2. MAIN CONTAINER */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* Hero Overview Card */}
                <section className="mb-8 overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-7">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#E34A27] uppercase">
                                <Sparkles className="size-3" />
                                <span>Ekosistem Konsinyasi Sekolah</span>
                            </div>
                            <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                                Produk Titipan Saya
                            </h1>
                            <p className="mt-2 max-w-xl text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                Pantau status pemeriksaan dan kurasi karya
                                mandirimu oleh tim pengurus Koperasi Sekolah.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <Link
                                href="/student/consignments/create"
                                className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-[#E34A27] px-5 py-2.5 font-heading text-xs font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#d03f1e] active:scale-95"
                            >
                                <Plus className="size-4" />
                                <span>Ajukan Produk Baru</span>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Metric Badges */}
                    <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#262626] pt-5 sm:grid-cols-4">
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs">
                            <span className="block font-mono text-[10px] text-[#737373] uppercase">
                                Total Diajukan
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-[#F5F2EB]">
                                {submissions.length}
                            </span>
                        </div>
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs">
                            <span className="block font-mono text-[10px] text-emerald-400 uppercase">
                                Disetujui & Aktif
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-emerald-400">
                                {countApproved}
                            </span>
                        </div>
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs">
                            <span className="block font-mono text-[10px] text-sky-400 uppercase">
                                Sedang Ditinjau
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-sky-400">
                                {countUnderReview + countSubmitted}
                            </span>
                        </div>
                        <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs">
                            <span className="block font-mono text-[10px] text-rose-400 uppercase">
                                Perlu Perbaikan
                            </span>
                            <span className="mt-1 block font-mono text-xl font-bold text-rose-400">
                                {countRejected}
                            </span>
                        </div>
                    </div>
                </section>

                {/* Submissions Section */}
                <section className="mb-12">
                    <div className="mb-4 flex items-center justify-between border-b border-[#262626] pb-3">
                        <div className="flex items-center gap-2">
                            <Store className="size-4 text-[#E34A27]" />
                            <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                Riwayat Pengajuan Produk
                            </h2>
                        </div>
                        <span className="font-mono text-xs text-[#737373]">
                            {submissions.length} item tercatat
                        </span>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#262626] bg-[#141414] p-12 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl bg-[#1c1c1c] text-[#737373]">
                                <Package className="size-6" />
                            </div>
                            <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                Belum Ada Karya yang Dititipkan
                            </h3>
                            <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#737373]">
                                Punya olahan kuliner, kerajinan tangan, atau
                                merchandise buatanmu? Mulai wirausahamu sekarang
                                melalui KOPDIG.
                            </p>
                            <Link
                                href="/student/consignments/create"
                                className="mt-5 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#E34A27] px-5 py-2.5 font-heading text-xs font-bold text-white transition-all hover:bg-[#d03f1e]"
                            >
                                <Plus className="size-4" />
                                <span>Ajukan Produk Pertama</span>
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map((sub) => (
                                <Link
                                    key={sub.id}
                                    href={`/student/consignments/${sub.id}`}
                                    className="group block rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-lg transition-all duration-200 hover:border-[#383838] hover:bg-[#181818]"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                                    {sub.category?.name ??
                                                        'Kategori'}
                                                </span>
                                                {getStatusBadge(sub.status)}
                                            </div>

                                            <h3 className="mt-1.5 truncate font-heading text-base font-bold text-[#F5F2EB] group-hover:text-[#E34A27]">
                                                {sub.name}
                                            </h3>

                                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#A3A3A3]">
                                                {sub.description}
                                            </p>

                                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#737373]">
                                                <span>
                                                    Modal Bersih:{' '}
                                                    <strong className="font-mono text-[#F5F2EB]">
                                                        {formatRupiah(
                                                            sub.base_price,
                                                        )}
                                                    </strong>
                                                </span>
                                                <span
                                                    aria-hidden="true"
                                                    className="text-[#383838]"
                                                >
                                                    &bull;
                                                </span>
                                                <span>
                                                    Stok:{' '}
                                                    <strong className="font-mono text-[#F5F2EB]">
                                                        {sub.proposed_stock} pcs
                                                    </strong>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex shrink-0 items-center justify-between sm:flex-col sm:items-end sm:justify-start">
                                            <span className="font-mono text-[11px] text-[#737373]">
                                                {new Date(
                                                    sub.created_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric',
                                                })}
                                            </span>

                                            <span className="mt-3 inline-flex items-center gap-1 font-heading text-xs font-semibold text-[#A3A3A3] group-hover:text-[#E34A27]">
                                                <span>Lihat Status</span>
                                                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rejection Notice if rejected */}
                                    {sub.status === 'rejected' &&
                                        sub.rejection_reason && (
                                            <div className="mt-3.5 rounded-xl border border-rose-900/40 bg-rose-950/20 p-2.5 text-xs text-rose-300">
                                                <span className="font-semibold">
                                                    Catatan Koperasi:{' '}
                                                </span>
                                                {sub.rejection_reason}
                                            </div>
                                        )}
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Approved Active Products in Store */}
                {approvedProducts.length > 0 && (
                    <section className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-7">
                        <div className="mb-5 flex items-center justify-between border-b border-[#262626] pb-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="size-4 text-emerald-400" />
                                <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                    Karyamu yang Aktif di Katalog
                                </h2>
                            </div>
                            <span className="font-mono text-xs text-emerald-400">
                                {approvedProducts.length} produk siap beli
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {approvedProducts.map((prod) => (
                                <Link
                                    key={prod.id}
                                    href={`/products/${prod.slug}`}
                                    className="group block rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 transition-all hover:border-[#383838]"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="font-mono text-[10px] text-[#737373] uppercase">
                                                {prod.category?.name ??
                                                    'Kategori'}
                                            </span>
                                            <h3 className="mt-0.5 font-heading text-sm font-bold text-[#F5F2EB] group-hover:text-[#E34A27]">
                                                {prod.name}
                                            </h3>
                                            <p className="mt-1 font-mono text-xs font-bold text-[#E34A27]">
                                                {formatRupiah(
                                                    prod.selling_price,
                                                )}
                                            </p>
                                        </div>
                                        <ExternalLink className="size-4 text-[#737373] group-hover:text-[#E34A27]" />
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}
