import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    CheckCircle2,
    Inbox,
    QrCode,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { COOPERATIVE_NAV_ITEMS } from '@/components/cooperative/nav-config';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import type { Auth } from '@/types/auth';

interface OperationalMetrics {
    pending_payment_count: number;
    verified_payments_today_count: number;
    ready_for_pickup_count: number;
    completed_today_count: number;
    cash_received_today_total: number;
}

interface Props {
    metrics?: OperationalMetrics;
}

export default function CooperativeWorkspaceOverview({ metrics }: Props) {
    const { auth } = usePage<{ auth?: Auth }>().props;
    const user = auth?.user;

    const pendingCount = metrics?.pending_payment_count ?? 0;
    const verifiedToday = metrics?.verified_payments_today_count ?? 0;
    const readyPickup = metrics?.ready_for_pickup_count ?? 0;
    const completedToday = metrics?.completed_today_count ?? 0;
    const cashTotal = metrics?.cash_received_today_total ?? 0;

    return (
        <CooperativeShell
            activeNav="overview"
            title="Overview Operasional"
            subtitle="Pusat kendali operasional, kasir pembayaran tunai, dan layanan serah-terima pesanan KOPDIG."
        >
            {/* Operational Context Card */}
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-[#E34A27]/25 bg-[#E34A27]/10 text-[#E34A27]">
                            <ShieldCheck
                                className="size-5 text-[#E34A27]"
                                aria-hidden="true"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="font-heading text-lg font-bold tracking-tight text-[#F5F2EB]">
                                    Selamat Bertugas,{' '}
                                    {user?.name ?? 'Pengurus Koperasi'}
                                </span>
                                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                                    Aktif
                                </span>
                            </div>
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                Ruang Niaga Warga Sekolah KOPDIG dirancang untuk
                                mendukung kegiatan wirausaha siswa dengan
                                pengawasan amanah dan pencatatan tertib dari
                                pengurus koperasi sekolah.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/explore"
                            className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-[#262626] bg-[#181818] px-4 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#383838] hover:bg-[#202020]"
                        >
                            Katalog Siswa
                        </Link>
                    </div>
                </div>
            </div>

            {/* REAL DATABASE OPERATIONAL KPIS */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-mono text-xs font-bold tracking-widest text-[#737373] uppercase">
                        Ringkasan Transaksi & Antrean
                    </h2>
                    <span className="font-mono text-[11px] text-[#525252]">
                        Data Real-Time Database
                    </span>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {/* 1. Menunggu Pembayaran KPI */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                                Menunggu Bayar
                            </span>
                            <span
                                className={`size-2 rounded-full ${pendingCount > 0 ? 'animate-pulse bg-amber-400' : 'bg-neutral-700'}`}
                            />
                        </div>
                        <p className="mt-2.5 font-heading text-2xl font-black text-amber-400">
                            {pendingCount}
                        </p>
                        <p className="mt-1 text-[11px] text-[#737373]">
                            Pesanan tunai loket
                        </p>
                    </div>

                    {/* 2. Kas Diterima Hari Ini */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                            Kas Diterima Hari Ini
                        </span>
                        <p className="mt-2.5 truncate font-heading text-lg font-black text-[#F5F2EB] sm:text-xl">
                            {formatRupiah(cashTotal)}
                        </p>
                        <p className="mt-1 text-[11px] text-[#737373]">
                            Nilai transaksi lunas
                        </p>
                    </div>

                    {/* 3. Pembayaran Terverifikasi */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                            Verifikasi Kasir
                        </span>
                        <p className="mt-2.5 font-heading text-2xl font-black text-emerald-400">
                            {verifiedToday}
                        </p>
                        <p className="mt-1 text-[11px] text-[#737373]">
                            Transaksi diverifikasi
                        </p>
                    </div>

                    {/* 4. Siap Diambil */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                            Siap Diambil
                        </span>
                        <p className="mt-2.5 font-heading text-2xl font-black text-[#E34A27]">
                            {readyPickup}
                        </p>
                        <p className="mt-1 text-[11px] text-[#737373]">
                            Antrean aktif loket
                        </p>
                    </div>

                    {/* 5. Selesai Hari Ini */}
                    <div className="col-span-2 rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838] sm:col-span-1">
                        <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                            Selesai Hari Ini
                        </span>
                        <p className="mt-2.5 font-heading text-2xl font-black text-[#F5F2EB]">
                            {completedToday}
                        </p>
                        <p className="mt-1 text-[11px] text-[#737373]">
                            Serah terima rampung
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Operational Jump Cards */}
            <div className="space-y-3">
                <h2 className="font-mono text-xs font-bold tracking-widest text-[#737373] uppercase">
                    Modul Operasional Utama
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {/* Kasir QR / Scan Pembayaran Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#121212] p-5 transition-all hover:border-[#E34A27]/50 hover:shadow-lg hover:shadow-[#E34A27]/5">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-lg border border-amber-500/25 bg-amber-500/10 text-amber-400">
                                    <Banknote
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                                    {pendingCount > 0
                                        ? `${pendingCount} Menunggu`
                                        : 'Siap Pakai'}
                                </span>
                            </div>
                            <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                Verifikasi Pembayaran Tunai
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
                                Scan QR pembayaran siswa untuk memeriksa
                                pesanan, mengecek ketersediaan fisik, dan
                                konfirmasi penerimaan kas di loket.
                            </p>
                        </div>

                        <div className="mt-6 border-t border-[#262626] pt-4">
                            <Link
                                href="/cooperative/payments/verify"
                                className="group inline-flex min-h-[42px] w-full items-center justify-between rounded-lg bg-[#E34A27] px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all duration-200 hover:bg-[#E34A27]/90 active:scale-[0.99]"
                            >
                                <span>Scan Pembayaran</span>
                                <ArrowRight
                                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Pickup Verification Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#121212] p-5 transition-all hover:border-[#383838]">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-lg border border-[#E34A27]/25 bg-[#E34A27]/10 text-[#E34A27]">
                                    <QrCode
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                    Siap Pakai
                                </span>
                            </div>
                            <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                Loket Pengambilan & QR
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
                                Pemindai kamera QR peramban dan fallback input
                                manual kredensial token untuk verifikasi
                                serah-terima belanja siswa.
                            </p>
                        </div>

                        <div className="mt-6 border-t border-[#262626] pt-4">
                            <Link
                                href="/cooperative/pickup"
                                className="group inline-flex min-h-[42px] w-full items-center justify-between rounded-lg border border-[#262626] bg-[#181818] px-4 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#383838] hover:bg-[#202020]"
                            >
                                <span>Buka Loket Pickup</span>
                                <ArrowRight
                                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Consignment Review Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#121212] p-5 transition-all hover:border-[#383838]">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-lg border border-[#262626] bg-[#181818] text-[#A3A3A3]">
                                    <Inbox
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                    Siap Pakai
                                </span>
                            </div>
                            <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                Review Titipan Siswa
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
                                Kurasi pengajuan barang konsinyasi siswa,
                                tetapkan margin koperasi sekolah, dan berikan
                                persetujuan atau penolakan dengan catatan resmi.
                            </p>
                        </div>

                        <div className="mt-6 border-t border-[#262626] pt-4">
                            <Link
                                href="/cooperative/consignments"
                                className="group inline-flex min-h-[42px] w-full items-center justify-between rounded-lg border border-[#262626] bg-[#181818] px-4 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#383838] hover:bg-[#202020]"
                            >
                                <span>Meja Review Titipan</span>
                                <ArrowRight
                                    className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Navigation Directory */}
            <div className="rounded-xl border border-[#262626] bg-[#121212] p-5">
                <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                    <div>
                        <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                            Struktur Navigasi Operasional Koperasi
                        </h2>
                        <p className="text-xs text-[#737373]">
                            Daftar seluruh menu kerja pengurus koperasi KOPDIG
                        </p>
                    </div>
                </div>

                <div className="mt-2 divide-y divide-[#1F1F1F]">
                    {COOPERATIVE_NAV_ITEMS.map((item) => {
                        const Icon = item.icon;
                        const isLive = item.status === 'active';

                        return (
                            <div
                                key={item.key}
                                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex items-start gap-3">
                                    <div
                                        className={`flex size-8 shrink-0 items-center justify-center rounded-lg border ${
                                            isLive
                                                ? 'border-[#E34A27]/25 bg-[#E34A27]/10 text-[#E34A27]'
                                                : 'border-[#262626] bg-[#161616] text-[#525252]'
                                        }`}
                                    >
                                        <Icon
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[#F5F2EB]">
                                                {item.label}
                                            </span>
                                            <span
                                                className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                                                    isLive
                                                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                        : 'border border-[#262626] bg-[#161616] text-[#737373]'
                                                }`}
                                            >
                                                {isLive
                                                    ? 'Aktif'
                                                    : 'Fase Mendatang'}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-xs text-[#737373]">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Link
                                        href={item.href}
                                        className="group inline-flex min-h-[38px] items-center gap-1.5 font-mono text-xs font-medium text-[#E34A27] transition-colors hover:text-[#F5F2EB]"
                                    >
                                        <span>Buka Modul</span>
                                        <ArrowRight
                                            className="size-3.5 transition-transform duration-200 group-hover:translate-x-1"
                                            aria-hidden="true"
                                        />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SOP Operational Guidance */}
            <div className="rounded-xl border border-[#262626] bg-[#101010] p-5">
                <div className="flex items-center gap-2.5 text-[#E34A27]">
                    <Sparkles className="size-4.5" aria-hidden="true" />
                    <h3 className="font-heading text-sm font-bold text-[#F5F2EB]">
                        Panduan Ringkas Petugas Koperasi
                    </h3>
                </div>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-[#A3A3A3]">
                    <li className="flex items-start gap-2.5">
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-400"
                            aria-hidden="true"
                        />
                        <span>
                            <strong className="text-[#F5F2EB]">
                                Verifikasi Kasir:
                            </strong>{' '}
                            Pastikan uang tunai fisik telah diterima sesuai
                            nominal pesanan sebelum mengonfirmasi "Uang
                            Diterima" pada layar scanner.
                        </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-400"
                            aria-hidden="true"
                        />
                        <span>
                            <strong className="text-[#F5F2EB]">
                                Pemeriksaan Fisik:
                            </strong>{' '}
                            Pastikan jenis barang, ukuran, dan jumlah fisik
                            pesanan sesuai dengan rincian di loket sebelum
                            barang diserahkan ke siswa.
                        </span>
                    </li>
                    <li className="flex items-start gap-2.5">
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-400"
                            aria-hidden="true"
                        />
                        <span>
                            <strong className="text-[#F5F2EB]">
                                Kurasi Titipan:
                            </strong>{' '}
                            Periksa kualitas dan kelayakan barang titipan siswa
                            serta tentukan margin koperasi yang wajar sebelum
                            memberikan persetujuan.
                        </span>
                    </li>
                </ul>
            </div>
        </CooperativeShell>
    );
}
