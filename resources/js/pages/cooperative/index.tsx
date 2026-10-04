import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    Inbox,
    QrCode,
    ShieldCheck,
    Sparkles,
} from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { COOPERATIVE_NAV_ITEMS } from '@/components/cooperative/nav-config';
import type { Auth } from '@/types/auth';

export default function CooperativeWorkspaceOverview() {
    const { auth } = usePage<{ auth?: Auth }>().props;
    const user = auth?.user;

    return (
        <CooperativeShell
            activeNav="overview"
            title="Overview Operasional"
            subtitle="Pusat kendali operasional, kurasi titipan siswa, dan layanan serah-terima pesanan KOPDIG."
        >
            {/* Operational Context Card */}
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 shadow-xs">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                            <ShieldCheck
                                className="size-6 text-[var(--color-primary)]"
                                aria-hidden="true"
                            />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-display text-lg font-bold text-[var(--color-ink)]">
                                    Selamat Bertugas,{' '}
                                    {user?.name ?? 'Pengurus Koperasi'}
                                </span>
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                                    Aktif
                                </span>
                            </div>
                            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[var(--color-ink-muted)] sm:text-sm">
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
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-subtle)]"
                        >
                            Katalog Siswa
                        </Link>
                    </div>
                </div>
            </div>

            {/* Quick Operational Jump Cards */}
            <div>
                <h2 className="font-display mb-3 text-base font-bold text-[var(--color-ink)]">
                    Modul Operasional Aktif
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {/* Consignment Review Card */}
                    <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                                    <Inbox
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Siap Pakai
                                </span>
                            </div>
                            <h3 className="font-display mt-4 text-base font-bold text-[var(--color-ink)]">
                                Review Titipan Siswa
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                                Kurasi pengajuan barang konsinyasi siswa,
                                tetapkan margin koperasi sekolah, dan berikan
                                persetujuan atau penolakan dengan catatan resmi.
                            </p>
                        </div>

                        <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-4">
                            <Link
                                href="/cooperative/consignments"
                                className="inline-flex min-h-[44px] w-full items-center justify-between rounded-xl bg-[var(--color-primary-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                            >
                                <span>Buka Meja Review Titipan</span>
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Pickup Verification Card */}
                    <div className="flex flex-col justify-between rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 transition-shadow hover:shadow-md">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-[var(--color-primary)]">
                                    <QrCode
                                        className="size-5"
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                                    Siap Pakai
                                </span>
                            </div>
                            <h3 className="font-display mt-4 text-base font-bold text-[var(--color-ink)]">
                                Loket Pengambilan & QR
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                                Pemindai kamera QR langsung di peramban dan
                                fallback input manual kredensial token untuk
                                verifikasi serah-terima belanja siswa.
                            </p>
                        </div>

                        <div className="mt-6 border-t border-[var(--color-border-subtle)] pt-4">
                            <Link
                                href="/cooperative/pickup"
                                className="inline-flex min-h-[44px] w-full items-center justify-between rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                            >
                                <span>Buka Loket Pickup</span>
                                <ArrowRight
                                    className="size-4"
                                    aria-hidden="true"
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Operational Navigation Directory */}
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5">
                <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
                    <div>
                        <h2 className="font-display text-base font-bold text-[var(--color-ink)]">
                            Struktur Navigasi Operasional Koperasi
                        </h2>
                        <p className="text-xs text-[var(--color-ink-muted)]">
                            Daftar seluruh menu kerja pengurus koperasi KOPDIG
                        </p>
                    </div>
                </div>

                <div className="mt-4 divide-y divide-[var(--color-border-subtle)]">
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
                                        className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${
                                            isLive
                                                ? 'bg-[var(--color-primary-soft)] text-[var(--color-primary)]'
                                                : 'bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]'
                                        }`}
                                    >
                                        <Icon
                                            className="size-4.5"
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-[var(--color-ink)]">
                                                {item.label}
                                            </span>
                                            <span
                                                className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold ${
                                                    isLive
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-zinc-100 text-zinc-600'
                                                }`}
                                            >
                                                {isLive
                                                    ? 'Aktif'
                                                    : 'Fase Mendatang'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-[var(--color-ink-muted)]">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <Link
                                        href={item.href}
                                        className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
                                    >
                                        <span>Buka Modul</span>
                                        <ArrowRight
                                            className="size-3.5"
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
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-5">
                <div className="flex items-center gap-2.5 text-[var(--color-primary)]">
                    <Sparkles className="size-4.5" aria-hidden="true" />
                    <h3 className="font-display text-sm font-bold text-[var(--color-ink)]">
                        Panduan Ringkas Petugas Koperasi
                    </h3>
                </div>
                <ul className="mt-3 space-y-2 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                    <li className="flex items-start gap-2">
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                        />
                        <span>
                            <strong>Verifikasi Identitas:</strong> Selalu minta
                            siswa menunjukkan QR resmi dari aplikasi KOPDIG
                            sebelum barang diserahkan.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                        />
                        <span>
                            <strong>Pemeriksaan Fisik:</strong> Pastikan jenis
                            barang, ukuran, dan jumlah fisik sesuai daftar pada
                            layar loket sebelum mengonfirmasi serah-terima.
                        </span>
                    </li>
                    <li className="flex items-start gap-2">
                        <CheckCircle2
                            className="mt-0.5 size-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                        />
                        <span>
                            <strong>Kurasi Titipan:</strong> Periksa kualitas
                            dan kelayakan barang titipan siswa serta tentukan
                            margin koperasi yang wajar sebelum disetujui.
                        </span>
                    </li>
                </ul>
            </div>
        </CooperativeShell>
    );
}
