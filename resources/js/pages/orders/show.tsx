import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    CheckCircle2,
    Clock,
    Calendar,
    Copy,
    Check,
    Store,
    ListOrdered,
    Package,
    MapPin,
    XCircle,
    RefreshCw,
    Ticket,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { OrderData, OrderItemData } from '@/types/order';

interface OrderShowProps {
    order: OrderData;
    flash?: {
        success?: string;
        info?: string;
        error?: string;
    };
    [key: string]: unknown;
}

export default function OrderShow() {
    const { order, flash } = usePage<OrderShowProps>().props;
    const [copied, setCopied] = useState(false);
    const [credentialCopied, setCredentialCopied] = useState(false);
    const [paymentTokenCopied, setPaymentTokenCopied] = useState(false);

    const handleCopyOrderNumber = () => {
        void navigator.clipboard.writeText(order.order_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleCopyCredential = () => {
        if (order.pickup_credential) {
            void navigator.clipboard.writeText(order.pickup_credential);
            setCredentialCopied(true);
            setTimeout(() => setCredentialCopied(false), 2500);
        }
    };

    const handleCopyPaymentToken = () => {
        if (order.payment_token) {
            void navigator.clipboard.writeText(order.payment_token);
            setPaymentTokenCopied(true);
            setTimeout(() => setPaymentTokenCopied(false), 2500);
        }
    };

    const isPaid = order.payment_status === 'paid';
    const isReadyForPickup = order.order_status === 'ready_for_pickup';
    const isCompleted = order.order_status === 'completed';
    const isCancelled =
        order.order_status === 'cancelled' ||
        order.payment_status === 'cancelled';
    const isPendingPayment =
        order.order_status === 'pending_payment' &&
        order.payment_status === 'pending';

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title={`Pesanan ${order.order_number} — KOPDIG`} />

            {/* ATMOSPHERIC BACKGROUND (Landing Page Editorial System) */}
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
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
                    {/* Left: Back Navigation */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/orders')}
                        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke daftar pesanan"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Pesanan Saya</span>
                    </button>

                    {/* Center: Brand Mark (Identical to Landing Page) */}
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
                                Detail Transaksi
                            </span>
                        </div>
                    </Link>

                    {/* Right: Catalog Link */}
                    <Link
                        href="/explore"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                    >
                        <Store className="size-3.5 text-[#E34A27]" />
                        <span className="hidden sm:inline">Katalog</span>
                    </Link>
                </div>
            </header>

            {/* 2. MAIN ORDER DETAILS CONTAINER */}
            <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* Flash Notifications */}
                {flash?.success && (
                    <div
                        role="status"
                        className="mb-6 flex items-start gap-3.5 rounded-3xl border border-emerald-500/40 bg-emerald-950/30 p-4 text-emerald-300 shadow-xl backdrop-blur-sm sm:p-5"
                    >
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                        <div>
                            <p className="font-heading text-sm font-bold text-emerald-200">
                                Pesanan Berhasil Dibuat
                            </p>
                            <p className="mt-0.5 text-xs text-emerald-300/90">
                                {flash.success}
                            </p>
                        </div>
                    </div>
                )}

                {/* Page Heading & Breadcrumb */}
                <div className="mb-6 border-b border-[#262626] pb-5">
                    <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-[#737373] uppercase">
                        <span>Pasar Sekolah</span>
                        <span>/</span>
                        <span>Pesanan</span>
                        <span>/</span>
                        <span className="text-[#E34A27]">
                            {order.order_number}
                        </span>
                    </div>
                    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="font-heading text-2xl font-black tracking-tight text-[#F5F2EB] sm:text-3xl">
                                Detail Pesanan
                            </h1>
                            <p className="mt-1 text-xs text-[#A3A3A3]">
                                Dibuat pada{' '}
                                {order.formatted_created_at || order.created_at}
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            {isCompleted ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-400">
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Selesai (Sudah Diambil)</span>
                                </span>
                            ) : isReadyForPickup ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-400">
                                    <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                    <span>Siap Diambil di Loket</span>
                                </span>
                            ) : isPaid ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3.5 py-1 font-mono text-xs font-semibold text-emerald-400">
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Lunas (Diproses)</span>
                                </span>
                            ) : isCancelled ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/40 px-3.5 py-1 font-mono text-xs font-semibold text-rose-400">
                                    <XCircle className="size-3.5" />
                                    <span>Dibatalkan</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/50 px-3.5 py-1 font-mono text-xs font-semibold text-amber-300">
                                    <Clock className="size-3.5 text-amber-400" />
                                    <span>Menunggu Pembayaran</span>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* PRIMARY ORDER METADATA BAR */}
                    <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg sm:p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                    Nomor Pesanan
                                </span>
                                <div className="mt-1 flex items-center gap-2.5">
                                    <span className="font-mono text-lg font-black tracking-tight text-[#F5F2EB] sm:text-xl">
                                        {order.order_number}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleCopyOrderNumber}
                                        className="flex size-7 items-center justify-center rounded-lg border border-[#262626] bg-[#1C1C1C] text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                                        title="Salin nomor pesanan"
                                        aria-label="Salin nomor pesanan"
                                    >
                                        {copied ? (
                                            <Check className="size-3.5 text-emerald-400" />
                                        ) : (
                                            <Copy className="size-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                    Total Pesanan
                                </span>
                                <p className="font-heading text-xl font-black text-[#E34A27] sm:text-2xl">
                                    {formatRupiah(order.total)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 1. CASH PAYMENT QR CARD (Before Verification) */}
                    {isPendingPayment && order.payment_qr_payload && (
                        <div className="overflow-hidden rounded-3xl border border-[#E34A27]/40 bg-[#141414] shadow-2xl shadow-[#E34A27]/5">
                            {/* Card Header Banner */}
                            <div className="border-b border-[#262626] bg-gradient-to-r from-[#E34A27]/20 via-[#141414] to-[#141414] p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-9 items-center justify-center rounded-xl border border-[#E34A27]/40 bg-[#E34A27]/10 text-[#E34A27]">
                                            <Banknote className="size-5" />
                                        </div>
                                        <div>
                                            <span className="font-heading text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                                QR Pembayaran Tunai di Koperasi
                                            </span>
                                            <p className="text-[11px] text-[#A3A3A3]">
                                                Tunjukkan QR ini ke petugas
                                                loket koperasi sekolah
                                            </p>
                                        </div>
                                    </div>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                        Menunggu Kasir
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-[#262626] pt-4">
                                    <div>
                                        <span className="font-mono text-[10px] text-[#737373] uppercase">
                                            Jumlah yang Harus Dibayar
                                        </span>
                                        <p className="font-heading text-3xl font-black tracking-tight text-[#E34A27] sm:text-4xl">
                                            {formatRupiah(order.total)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono text-[10px] text-[#737373] uppercase">
                                            Lokasi Pembayaran
                                        </span>
                                        <p className="font-heading text-xs font-bold text-[#F5F2EB] sm:text-sm">
                                            Loket Koperasi Sekolah
                                        </p>
                                        <p className="font-mono text-[11px] text-[#737373]">
                                            Lantai 1 Sekolah
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* QR Code Container */}
                            <div className="flex flex-col items-center p-6 text-center sm:p-8">
                                <div className="relative rounded-3xl border border-[#262626] bg-white p-4 shadow-2xl">
                                    <QRCodeSVG
                                        value={order.payment_qr_payload}
                                        size={220}
                                        level="M"
                                        includeMargin={false}
                                        className="h-auto max-w-full"
                                        role="img"
                                        aria-label={`QR Code Pembayaran Tunai untuk pesanan ${order.order_number}`}
                                    />
                                </div>

                                <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                    Tunjukkan QR kepada Petugas Koperasi
                                </h3>
                                <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#A3A3A3]">
                                    Serahkan uang tunai sebesar{' '}
                                    <span className="font-bold text-[#F5F2EB]">
                                        {formatRupiah(order.total)}
                                    </span>{' '}
                                    kepada petugas loket untuk memproses
                                    verifikasi dan mengaktifkan tiket antrean
                                    Anda.
                                </p>

                                {/* Manual Token Fallback */}
                                {order.payment_token && (
                                    <div className="mt-5 flex w-full max-w-xs items-center justify-between rounded-2xl border border-[#262626] bg-[#1A1A1A] px-4 py-2.5 text-xs">
                                        <div className="text-left">
                                            <span className="block font-mono text-[9px] font-bold text-[#737373] uppercase">
                                                Kode Verifikasi Kasir
                                            </span>
                                            <span className="font-mono text-xs font-bold tracking-wider text-[#F5F2EB]">
                                                {order.payment_token}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCopyPaymentToken}
                                            className="flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#262626] px-2.5 py-1 font-mono text-[11px] font-medium text-[#F5F2EB] transition-all hover:bg-[#333333] active:scale-95"
                                            title="Salin kode verifikasi kasir"
                                        >
                                            {paymentTokenCopied ? (
                                                <>
                                                    <Check className="size-3 text-emerald-400" />
                                                    <span className="text-emerald-400">
                                                        Tersalin
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="size-3 text-[#A3A3A3]" />
                                                    <span>Salin</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}

                                {/* 4-Step Instructions */}
                                <div className="mt-6 w-full rounded-2xl border border-[#262626] bg-[#0A0A0A] p-4 text-left sm:p-5">
                                    <p className="mb-2.5 font-heading text-xs font-bold text-[#F5F2EB]">
                                        Langkah Pembayaran Tunai di Koperasi:
                                    </p>
                                    <ol className="space-y-2 font-mono text-xs text-[#A3A3A3]">
                                        <li className="flex items-start gap-2">
                                            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-bold text-[#E34A27]">
                                                1
                                            </span>
                                            <span>
                                                Datang ke loket koperasi sekolah
                                                saat jam operasional.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-bold text-[#E34A27]">
                                                2
                                            </span>
                                            <span>
                                                Tunjukkan QR pembayaran ini
                                                kepada petugas kasir koperasi.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-bold text-[#E34A27]">
                                                3
                                            </span>
                                            <span>
                                                Serahkan uang tunai pas atau
                                                sesuai nominal total pesanan.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-bold text-[#E34A27]">
                                                4
                                            </span>
                                            <span>
                                                Petugas konfirmasi pembayaran &
                                                tiket antrean pengambilan
                                                langsung aktif.
                                            </span>
                                        </li>
                                    </ol>
                                </div>

                                {/* Status Refresh Button */}
                                <div className="mt-6">
                                    <button
                                        type="button"
                                        onClick={() => router.reload()}
                                        className="group inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#1A1A1A] px-5 py-2.5 text-xs font-medium text-[#F5F2EB] shadow-md transition-all hover:border-[#383838] hover:bg-[#262626] active:scale-98"
                                    >
                                        <RefreshCw className="size-3.5 text-[#E34A27] transition-transform group-hover:rotate-180" />
                                        <span>Periksa Status Pembayaran</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. HIGH-CONTRAST QR PICKUP TICKET CARD (After Verification) */}
                    {(isReadyForPickup || isCompleted) && (
                        <div className="overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#141414] shadow-2xl">
                            {/* Ticket Header Banner */}
                            <div className="border-b border-[#262626] bg-gradient-to-r from-emerald-950/40 via-[#141414] to-[#141414] p-5 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-950/40 text-emerald-400">
                                            <Ticket className="size-5" />
                                        </div>
                                        <div>
                                            <span className="font-heading text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                                Tiket Pengambilan Loket KOPDIG
                                            </span>
                                            <p className="text-[11px] text-[#A3A3A3]">
                                                Gunakan saat mengambil pesanan
                                                di loket sekolah
                                            </p>
                                        </div>
                                    </div>
                                    {isCompleted ? (
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-950/60 px-3 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                            Selesai Diambil
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                                            <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                            <span>Siap Diambil</span>
                                        </span>
                                    )}
                                </div>

                                {/* Prominent Queue Number */}
                                <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#262626] pt-4">
                                    <div>
                                        <span className="font-mono text-[10px] text-[#737373] uppercase">
                                            Nomor Antrean Loket
                                        </span>
                                        <p className="font-mono text-4xl font-black tracking-tight text-emerald-400 sm:text-5xl">
                                            {order.queue_code ||
                                                (order.queue_number
                                                    ? `Antrean #${order.queue_number}`
                                                    : '-')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-mono text-[10px] text-[#737373] uppercase">
                                            Sesi Pengambilan
                                        </span>
                                        <p className="font-heading text-xs font-bold text-[#F5F2EB] sm:text-sm">
                                            {order.pickup_session?.name ||
                                                'Sesi Koperasi'}
                                        </p>
                                        <p className="font-mono text-[11px] text-emerald-400">
                                            {
                                                order.pickup_session
                                                    ?.formatted_time
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Ticket Perforation Graphic */}
                            <div className="relative flex items-center justify-between">
                                <div className="size-5 -translate-x-2.5 rounded-full bg-[#0A0A0A]" />
                                <div className="h-[1px] flex-1 border-t-2 border-dashed border-[#262626]" />
                                <div className="size-5 translate-x-2.5 rounded-full bg-[#0A0A0A]" />
                            </div>

                            {/* QR & Verification Display */}
                            <div className="flex flex-col items-center p-6 text-center sm:p-8">
                                {isReadyForPickup && order.qr_payload ? (
                                    <>
                                        <div className="relative rounded-3xl border border-[#262626] bg-white p-4 shadow-2xl">
                                            <QRCodeSVG
                                                value={order.qr_payload}
                                                size={220}
                                                level="M"
                                                includeMargin={false}
                                                className="h-auto max-w-full"
                                                role="img"
                                                aria-label={`QR Code Pengambilan untuk pesanan ${order.order_number}`}
                                            />
                                        </div>
                                        <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                            Tunjukkan QR ini kepada Petugas
                                            Loket
                                        </h3>
                                        <p className="mt-1 text-xs text-[#A3A3A3]">
                                            Atur kecerahan layar agar pemindaian
                                            barcode berjalan cepat dan lancar.
                                        </p>

                                        {/* Manual Credential Fallback */}
                                        {order.pickup_credential && (
                                            <div className="mt-5 flex w-full max-w-xs items-center justify-between rounded-2xl border border-[#262626] bg-[#1A1A1A] px-4 py-2.5 text-xs">
                                                <div className="text-left">
                                                    <span className="block font-mono text-[9px] font-bold text-[#737373] uppercase">
                                                        Kode Pengambilan Manual
                                                    </span>
                                                    <span className="font-mono text-xs font-bold tracking-wider text-[#F5F2EB]">
                                                        {
                                                            order.pickup_credential
                                                        }
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={
                                                        handleCopyCredential
                                                    }
                                                    className="flex items-center gap-1.5 rounded-lg border border-[#383838] bg-[#262626] px-2.5 py-1 font-mono text-[11px] font-medium text-[#F5F2EB] transition-all hover:bg-[#333333] active:scale-95"
                                                    title="Salin kode kredensial"
                                                >
                                                    {credentialCopied ? (
                                                        <>
                                                            <Check className="size-3 text-emerald-400" />
                                                            <span className="text-emerald-400">
                                                                Tersalin
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Copy className="size-3 text-[#A3A3A3]" />
                                                            <span>Salin</span>
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </>
                                ) : isCompleted ? (
                                    <div className="py-4">
                                        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
                                            <CheckCircle2 className="size-8" />
                                        </div>
                                        <h3 className="mt-4 font-heading text-lg font-bold text-[#F5F2EB]">
                                            Pesanan Telah Selesai Diambil
                                        </h3>
                                        <p className="mt-1 text-xs text-[#A3A3A3]">
                                            Pengambilan barang telah
                                            diverifikasi oleh petugas loket
                                            koperasi pada{' '}
                                            <span className="font-semibold text-[#F5F2EB]">
                                                {order.pickup_log
                                                    ?.verified_at ||
                                                    order.completed_at ||
                                                    'Hari ini'}
                                            </span>
                                            .
                                        </p>
                                    </div>
                                ) : null}

                                {/* Concise Step Instructions */}
                                <div className="mt-6 w-full rounded-2xl border border-[#262626] bg-[#0A0A0A] p-4 text-left sm:p-5">
                                    <p className="mb-2 font-heading text-xs font-bold text-[#F5F2EB]">
                                        Instruksi Pengambilan Barang:
                                    </p>
                                    <ol className="space-y-1.5 font-mono text-xs text-[#A3A3A3]">
                                        <li>
                                            1. Datang ke loket koperasi sekolah
                                            pada jadwal sesi istirahat.
                                        </li>
                                        <li>
                                            2. Tunjukkan QR code di atas atau
                                            sebutkan nomor antrean kepada
                                            petugas.
                                        </li>
                                        <li>
                                            3. Periksa kembali kelengkapan
                                            belanjaan sebelum meninggalkan
                                            loket.
                                        </li>
                                    </ol>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PICKUP SESSION DETAILS */}
                    <section
                        aria-labelledby="pickup-details"
                        className="space-y-3"
                    >
                        <h2
                            id="pickup-details"
                            className="font-heading text-base font-bold text-[#F5F2EB]"
                        >
                            Jadwal & Lokasi Pengambilan di Loket KOPDIG
                        </h2>

                        <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg sm:p-6">
                            {order.pickup_session ? (
                                <div className="space-y-4 text-xs">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <span className="inline-block rounded-md border border-[#262626] bg-[#1C1C1C] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#F5F2EB] uppercase">
                                                {order.pickup_session.name}
                                            </span>
                                            <p className="mt-2 flex items-center gap-2 font-mono text-sm font-bold text-[#F5F2EB]">
                                                <Clock className="size-4 text-[#E34A27]" />
                                                <span>
                                                    {order.pickup_session
                                                        .formatted_time ||
                                                        `${order.pickup_session.starts_at} - ${order.pickup_session.ends_at} WIB`}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                                                <Calendar className="size-3.5 text-[#737373]" />
                                                <span>
                                                    {order.pickup_session
                                                        .formatted_date ||
                                                        order.pickup_session
                                                            .pickup_date}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2.5 border-t border-[#262626] pt-3.5 text-xs text-[#A3A3A3]">
                                        <MapPin className="size-4 shrink-0 text-[#E34A27]" />
                                        <span>
                                            Loket Koperasi Siswa KOPDIG (Lantai
                                            1 Gedung Utama Sekolah)
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-[#737373]">
                                    Sesi pengambilan belum ditentukan.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* IMMUTABLE ORDER ITEMS SNAPSHOT */}
                    <section
                        aria-labelledby="items-details"
                        className="space-y-3"
                    >
                        <div className="flex items-center justify-between">
                            <h2
                                id="items-details"
                                className="font-heading text-base font-bold text-[#F5F2EB]"
                            >
                                Rincian Barang ({order.items?.length || 0}{' '}
                                Jenis)
                            </h2>
                            <span className="font-mono text-xs text-[#737373]">
                                Snapshot Transaksi
                            </span>
                        </div>

                        <div className="divide-y divide-[#262626] overflow-hidden rounded-3xl border border-[#262626] bg-[#141414] shadow-lg">
                            {order.items?.map((item: OrderItemData) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 p-4 text-xs sm:p-5"
                                >
                                    <div className="flex items-center gap-3.5">
                                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#262626] bg-[#1A1A1A] text-[#737373]">
                                            <Package className="size-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-heading text-sm font-bold text-[#F5F2EB]">
                                                {item.product_name}
                                            </h3>
                                            <p className="mt-0.5 font-mono text-[11px] text-[#A3A3A3]">
                                                {item.quantity} x{' '}
                                                {formatRupiah(item.unit_price)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="block font-mono text-[10px] text-[#737373] uppercase">
                                            Subtotal
                                        </span>
                                        <span className="font-mono text-sm font-bold text-[#F5F2EB]">
                                            {formatRupiah(item.subtotal)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FINANCIAL TOTAL SUMMARY */}
                    <section
                        aria-labelledby="financial-summary"
                        className="space-y-3"
                    >
                        <h2
                            id="financial-summary"
                            className="font-heading text-base font-bold text-[#F5F2EB]"
                        >
                            Ringkasan Pembayaran
                        </h2>

                        <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg sm:p-6">
                            <div className="space-y-3 text-xs">
                                <div className="flex justify-between text-[#A3A3A3]">
                                    <span>Subtotal Barang</span>
                                    <span className="font-mono font-medium text-[#F5F2EB]">
                                        {formatRupiah(order.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#A3A3A3]">
                                    <span>Metode Pembayaran</span>
                                    <span className="font-medium text-[#F5F2EB]">
                                        Bayar Tunai di Koperasi
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#A3A3A3]">
                                    <span>Biaya Layanan Koperasi</span>
                                    <span className="font-mono font-medium text-emerald-400">
                                        Gratis (Rp 0)
                                    </span>
                                </div>
                                <div className="flex items-baseline justify-between border-t border-[#262626] pt-3.5">
                                    <span className="font-heading text-sm font-bold text-[#F5F2EB]">
                                        Total Akhir
                                    </span>
                                    <span className="font-heading text-2xl font-black text-[#E34A27]">
                                        {formatRupiah(order.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ACTION LINKS (Landing Page Style Pill Buttons) */}
                    <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                        <Link
                            href="/orders"
                            className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#262626] bg-[#141414] py-3.5 font-heading text-xs font-bold text-[#F5F2EB] shadow-md transition-all hover:border-[#383838] hover:bg-[#1A1A1A] active:scale-98"
                        >
                            <ListOrdered className="size-4" />
                            <span>Lihat Riwayat Pesanan</span>
                        </Link>
                        <Link
                            href="/explore"
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#E34A27] py-3.5 font-heading text-xs font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#ff5c38] active:scale-98"
                        >
                            <Store className="size-4" />
                            <span>Lanjut Belanja di Marketplace</span>
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
}
