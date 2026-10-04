import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Calendar,
    Copy,
    Check,
    Store,
    ListOrdered,
    Package,
    MapPin,
    AlertCircle,
    CreditCard,
    Loader2,
    ShieldCheck,
    XCircle,
    RefreshCw,
    Ticket,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { OrderData, OrderItemData } from '@/types/order';

interface OrderShowProps {
    order: OrderData;
    midtrans_client_key?: string;
    snap_js_url?: string;
    flash?: {
        success?: string;
        info?: string;
        error?: string;
    };
    [key: string]: unknown;
}

declare global {
    interface Window {
        snap?: {
            pay: (
                token: string,
                options?: {
                    onSuccess?: (result: unknown) => void;
                    onPending?: (result: unknown) => void;
                    onError?: (result: unknown) => void;
                    onClose?: () => void;
                },
            ) => void;
        };
    }
}

export default function OrderShow() {
    const { order, midtrans_client_key, snap_js_url, flash } =
        usePage<OrderShowProps>().props;
    const [copied, setCopied] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [paymentError, setPaymentError] = useState<string | null>(null);
    const [paymentFeedback, setPaymentFeedback] = useState<string | null>(null);

    // Dynamically load Midtrans Snap JS in Sandbox mode
    useEffect(() => {
        const snapUrl =
            snap_js_url || 'https://app.sandbox.midtrans.com/snap/snap.js';
        const clientKey = midtrans_client_key || '';

        if (!clientKey) return;

        const scriptId = 'midtrans-snap-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.src = snapUrl;
            script.setAttribute('data-client-key', clientKey);
            script.async = true;
            document.body.appendChild(script);
        }
    }, [midtrans_client_key, snap_js_url]);

    const handleCopyOrderNumber = () => {
        void navigator.clipboard.writeText(order.order_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const [credentialCopied, setCredentialCopied] = useState(false);
    const handleCopyCredential = () => {
        if (order.pickup_credential) {
            void navigator.clipboard.writeText(order.pickup_credential);
            setCredentialCopied(true);
            setTimeout(() => setCredentialCopied(false), 2500);
        }
    };

    const handlePayNow = async () => {
        setIsPaying(true);
        setPaymentError(null);
        setPaymentFeedback(null);

        try {
            const metaToken = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;
            const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
            const xsrfCookieToken = cookieMatch
                ? decodeURIComponent(cookieMatch[1])
                : '';
            const csrfToken = metaToken || xsrfCookieToken;

            const response = await fetch(`/orders/${order.id}/payment`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': xsrfCookieToken,
                },
            });

            const data = (await response.json()) as {
                message?: string;
                snap_token?: string;
                redirect_url?: string;
            };

            if (!response.ok) {
                throw new Error(
                    data.message || 'Gagal menyiapkan pembayaran Midtrans.',
                );
            }

            if (window.snap && data.snap_token) {
                window.snap.pay(data.snap_token, {
                    onSuccess: () => {
                        setPaymentFeedback(
                            'Pembayaran berhasil dikirim! Memperbarui status pesanan...',
                        );
                        router.reload();
                    },
                    onPending: () => {
                        setPaymentFeedback(
                            'Transaksi dibuat dan menunggu pembayaran. Silakan selesaikan pembayaran.',
                        );
                        router.reload();
                    },
                    onError: () => {
                        setPaymentError(
                            'Pembayaran dibatalkan atau terjadi kesalahan pada simulator Midtrans.',
                        );
                        router.reload();
                    },
                    onClose: () => {
                        setPaymentFeedback(
                            'Jendela pembayaran ditutup tanpa menyelesaikan transaksi.',
                        );
                    },
                });
            } else if (data.redirect_url) {
                window.location.href = data.redirect_url;
            } else {
                throw new Error('Snap token tidak tersedia dari server.');
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan sistem saat memulai pembayaran.';
            setPaymentError(msg);
        } finally {
            setIsPaying(false);
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
        <AppShell hideHeader>
            <Head title={`Pesanan ${order.order_number}`} />

            <PageContainer className="pb-24">
                {/* Header Navigation */}
                <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => safeNavigateBack('/orders')}
                            className="hover:bg-surface-subtle flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-ink shadow-2xs transition-colors active:scale-95"
                            aria-label="Kembali ke halaman sebelumnya"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <div>
                            <h1 className="font-heading text-lg font-bold tracking-tight text-ink sm:text-xl">
                                Detail Pesanan
                            </h1>
                            <p className="text-xs text-muted">
                                {order.formatted_created_at || order.created_at}
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/explore"
                        className="hover:bg-surface-subtle flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs"
                    >
                        <Store className="size-3.5 text-primary" />
                        <span>Katalog</span>
                    </Link>
                </div>

                {/* Flash Notifications */}
                {flash?.success && (
                    <div
                        role="status"
                        className="mb-6 flex animate-in items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-primary shadow-xs fade-in"
                    >
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                        <div>
                            <p className="font-bold text-ink">
                                Pesanan Berhasil Dibuat!
                            </p>
                            <p className="mt-0.5 leading-relaxed text-muted">
                                {flash.success}
                            </p>
                        </div>
                    </div>
                )}

                {/* Dynamic Payment State Alerts */}
                {paymentError && (
                    <div
                        role="alert"
                        className="border-status-danger/30 text-status-danger mb-5 flex animate-in items-start gap-3 rounded-2xl border bg-[#FFFAFA] p-4 text-xs shadow-xs fade-in"
                    >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold">Kendala Pembayaran</p>
                            <p className="text-status-danger/90 mt-0.5 leading-relaxed">
                                {paymentError}
                            </p>
                        </div>
                    </div>
                )}

                {paymentFeedback && (
                    <div
                        role="status"
                        className="mb-5 flex animate-in items-start gap-3 rounded-2xl border border-border bg-[#FAF9F5] p-4 text-xs text-ink shadow-xs fade-in"
                    >
                        <Clock className="mt-0.5 size-4 shrink-0 text-primary" />
                        <div className="flex-1">
                            <p className="font-semibold">Status Transaksi</p>
                            <p className="mt-0.5 leading-relaxed text-muted">
                                {paymentFeedback}
                            </p>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* PRIMARY ORDER STATUS CARD */}
                    <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
                        <div className="border-b border-border/60 bg-gradient-to-br from-[#FAF9F5] to-surface p-5 sm:p-6">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                                        Nomor Pesanan
                                    </span>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="font-mono text-base font-bold tracking-tight text-ink sm:text-lg">
                                            {order.order_number}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={handleCopyOrderNumber}
                                            className="flex size-7 items-center justify-center rounded-lg border border-border bg-white text-muted shadow-2xs transition-all hover:text-ink active:scale-95"
                                            title="Salin nomor pesanan"
                                            aria-label="Salin nomor pesanan"
                                        >
                                            {copied ? (
                                                <Check className="size-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="size-3.5" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end">
                                    <span className="text-[11px] font-semibold text-muted">
                                        Status Pesanan
                                    </span>
                                    {isCompleted ? (
                                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Selesai (Sudah Diambil)</span>
                                        </span>
                                    ) : isReadyForPickup ? (
                                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-400 bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-900 shadow-2xs">
                                            <span className="size-2 animate-pulse rounded-full bg-emerald-600" />
                                            <span>Siap Diambil di Loket</span>
                                        </span>
                                    ) : isPaid ? (
                                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 shadow-2xs">
                                            <CheckCircle2 className="size-3.5" />
                                            <span>Lunas (Diproses)</span>
                                        </span>
                                    ) : isCancelled ? (
                                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1 text-xs font-bold text-rose-800 shadow-2xs">
                                            <XCircle className="size-3.5" />
                                            <span>Dibatalkan</span>
                                        </span>
                                    ) : (
                                        <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800 shadow-2xs">
                                            <Clock className="size-3.5" />
                                            <span>
                                                {order.order_status_label ||
                                                    'Menunggu Pembayaran'}
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* HIGH-CONTRAST QR PICKUP TICKET CARD (Phase 10) */}
                        {(isReadyForPickup || isCompleted) && (
                            <div className="border-b border-border/80 bg-white">
                                <div className="border-b border-primary/20 bg-primary px-5 py-4 text-white sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Ticket className="size-5 text-amber-300" />
                                            <span className="font-heading text-xs font-bold tracking-wider text-white uppercase">
                                                Tiket Pengambilan Loket KOPDIG
                                            </span>
                                        </div>
                                        {isCompleted ? (
                                            <span className="rounded-full bg-emerald-800/80 px-2.5 py-0.5 text-[10px] font-bold text-emerald-100">
                                                Selesai Diambil
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                                                <span className="size-1.5 animate-pulse rounded-full bg-amber-300" />
                                                Siap Diambil
                                            </span>
                                        )}
                                    </div>

                                    {/* Prominent High-Contrast Queue Display */}
                                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2 border-t border-white/15 pt-3">
                                        <div>
                                            <span className="text-[11px] font-medium text-white/80">
                                                Nomor Antrean Loket
                                            </span>
                                            <p className="font-mono text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                                                {order.queue_code ||
                                                    (order.queue_number
                                                        ? `Antrean #${order.queue_number}`
                                                        : '-')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-medium text-white/80">
                                                Sesi Pengambilan
                                            </span>
                                            <p className="text-xs font-bold text-white sm:text-sm">
                                                {order.pickup_session?.name ||
                                                    'Sesi Koperasi'}
                                            </p>
                                            <p className="text-[11px] text-amber-200">
                                                {
                                                    order.pickup_session
                                                        ?.formatted_time
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* QR Code Vector Display */}
                                <div className="flex flex-col items-center p-6 text-center">
                                    {isReadyForPickup && order.qr_payload ? (
                                        <>
                                            <div className="rounded-2xl border-4 border-slate-900/10 bg-white p-3 shadow-sm">
                                                <QRCodeSVG
                                                    value={order.qr_payload}
                                                    size={200}
                                                    level="M"
                                                    includeMargin={false}
                                                    className="h-auto max-w-full"
                                                    role="img"
                                                    aria-label={`QR Code Pengambilan untuk pesanan ${order.order_number}`}
                                                />
                                            </div>
                                            <p className="mt-3.5 text-xs font-bold text-ink">
                                                Tunjukkan QR ini kepada petugas
                                                loket koperasi
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-muted">
                                                Atur kecerahan layar agar
                                                pemindaian barcode berjalan
                                                cepat dan lancar.
                                            </p>

                                            {/* Manual Credential Fallback Display */}
                                            {order.pickup_credential && (
                                                <div className="mt-4 flex w-full max-w-xs items-center justify-between rounded-xl border border-border bg-[#FAF9F5] px-3.5 py-2 text-xs">
                                                    <div className="text-left">
                                                        <span className="block text-[10px] font-semibold text-muted uppercase">
                                                            Kode Pengambilan
                                                            Manual
                                                        </span>
                                                        <span className="font-mono text-xs font-bold tracking-wider text-ink">
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
                                                        className="flex items-center gap-1 rounded-lg border border-border bg-white px-2 py-1 text-[11px] font-semibold text-muted shadow-2xs hover:text-ink active:scale-95"
                                                        title="Salin kode kredensial"
                                                    >
                                                        {credentialCopied ? (
                                                            <>
                                                                <Check className="size-3 text-emerald-600" />
                                                                <span className="text-emerald-700">
                                                                    Tersalin
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="size-3" />
                                                                <span>
                                                                    Salin
                                                                </span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : isCompleted ? (
                                        <div className="py-2">
                                            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                                                <CheckCircle2 className="size-8" />
                                            </div>
                                            <p className="mt-3 font-heading text-base font-bold text-ink">
                                                Pesanan Selesai Diambil
                                            </p>
                                            <p className="mt-1 max-w-xs text-xs text-muted">
                                                Pengambilan barang telah
                                                diverifikasi oleh petugas
                                                koperasi pada{' '}
                                                <span className="font-semibold text-ink">
                                                    {order.pickup_log
                                                        ?.verified_at ||
                                                        order.completed_at ||
                                                        'Hari ini'}
                                                </span>
                                                .
                                            </p>
                                        </div>
                                    ) : null}

                                    {/* Concise Step-by-Step Instructions */}
                                    <div className="mt-5 w-full border-t border-border/60 pt-4 text-left text-xs text-muted">
                                        <p className="mb-1.5 font-semibold text-ink">
                                            Instruksi Pengambilan:
                                        </p>
                                        <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed">
                                            <li>
                                                Datang ke loket koperasi sekolah
                                                pada jadwal sesi istirahat.
                                            </li>
                                            <li>
                                                Tunjukkan QR code di atas atau
                                                sebutkan kode antrean kepada
                                                petugas.
                                            </li>
                                            <li>
                                                Periksa kembali kelengkapan
                                                belanjaan Anda sebelum
                                                meninggalkan loket.
                                            </li>
                                        </ol>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Payment State Action Block */}
                        <div className="space-y-3 bg-surface p-4 text-xs sm:p-5">
                            {isCompleted ? (
                                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-muted">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    <div className="leading-relaxed">
                                        <p className="font-bold text-emerald-900">
                                            Transaksi Telah Selesai
                                        </p>
                                        <p className="mt-1 text-[11px] text-emerald-800/90">
                                            Seluruh produk dalam pesanan ini
                                            telah diambil di loket koperasi
                                            sekolah. Terima kasih telah
                                            berbelanja di KOPDIG!
                                        </p>
                                    </div>
                                </div>
                            ) : isReadyForPickup ? (
                                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-muted">
                                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    <div className="leading-relaxed">
                                        <p className="font-bold text-emerald-900">
                                            Pembayaran Lunas & Antrean Siap
                                        </p>
                                        <p className="mt-1 text-[11px] text-emerald-800/90">
                                            Pembayaran sebesar{' '}
                                            <PriceDisplay
                                                amount={order.total}
                                                size="sm"
                                            />{' '}
                                            telah terverifikasi. Nomor antrean
                                            dan QR pengambilan Anda telah aktif
                                            dan siap dipindai di loket koperasi
                                            sekolah.
                                        </p>
                                    </div>
                                </div>
                            ) : isPaid ? (
                                <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-muted">
                                    <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    <div className="leading-relaxed">
                                        <p className="font-bold text-emerald-900">
                                            Pembayaran Lunas & Terverifikasi
                                        </p>
                                        <p className="mt-1 text-[11px] text-emerald-800/90">
                                            Pembayaran sebesar{' '}
                                            <PriceDisplay
                                                amount={order.total}
                                                size="sm"
                                            />{' '}
                                            telah berhasil dikonfirmasi oleh
                                            sistem KOPDIG melalui Midtrans.
                                            Pesanan Anda sedang dipersiapkan
                                            untuk sesi pengambilan di loket
                                            koperasi.
                                        </p>
                                    </div>
                                </div>
                            ) : isCancelled ? (
                                <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/70 p-4 text-muted">
                                    <XCircle className="mt-0.5 size-5 shrink-0 text-rose-600" />
                                    <div className="leading-relaxed">
                                        <p className="font-bold text-rose-900">
                                            Pesanan Telah Dibatalkan
                                        </p>
                                        <p className="mt-1 text-[11px] text-rose-800/90">
                                            Batas waktu pembayaran telah
                                            kedaluwarsa atau pesanan dibatalkan.
                                            Anda dapat membuat pesanan baru
                                            melalui katalog.
                                        </p>
                                    </div>
                                </div>
                            ) : isPendingPayment ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-[#FFFDF7] p-4 text-muted">
                                        <Clock className="mt-0.5 size-4 shrink-0 text-amber-600" />
                                        <div className="leading-relaxed">
                                            <p className="font-semibold text-ink">
                                                Pesanan Menunggu Pembayaran
                                            </p>
                                            <p className="mt-1 text-[11px]">
                                                Silakan lakukan pembayaran
                                                digital via Midtrans Sandbox
                                                (QRIS, GoPay, ShopeePay, atau
                                                Virtual Account bank simulasi).
                                            </p>
                                            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-amber-100/70 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                                                <span>
                                                    Mode: Midtrans Sandbox
                                                    (Tanpa uang sungguhan)
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action CTA: Pay with Midtrans Snap */}
                                    <div className="flex flex-col gap-2.5 sm:flex-row">
                                        <button
                                            type="button"
                                            disabled={isPaying}
                                            onClick={handlePayNow}
                                            className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-bold text-white shadow-xs transition-all select-none ${
                                                isPaying
                                                    ? 'cursor-not-allowed bg-primary/70'
                                                    : 'cursor-pointer bg-primary hover:bg-primary-hover active:scale-98'
                                            }`}
                                        >
                                            {isPaying ? (
                                                <>
                                                    <Loader2 className="size-4 animate-spin" />
                                                    <span>
                                                        Menghubungkan ke
                                                        Midtrans...
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <CreditCard className="size-4" />
                                                    <span>
                                                        Bayar Sekarang
                                                        (Midtrans)
                                                    </span>
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => router.reload()}
                                            className="hover:bg-surface-subtle flex min-h-[46px] items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 py-2.5 text-xs font-semibold text-ink shadow-2xs active:scale-98"
                                            title="Cek pembaruan status pembayaran"
                                        >
                                            <RefreshCw className="size-3.5 text-muted" />
                                            <span>Cek Status</span>
                                        </button>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* PICKUP SESSION DETAILS */}
                    <section aria-labelledby="pickup-details">
                        <h2
                            id="pickup-details"
                            className="mb-3 font-heading text-sm font-bold text-ink sm:text-base"
                        >
                            Jadwal Pengambilan di Loket KOPDIG
                        </h2>

                        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
                            {order.pickup_session ? (
                                <div className="space-y-3 text-xs">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary uppercase">
                                                {order.pickup_session.name}
                                            </span>
                                            <p className="mt-2 flex items-center gap-1.5 font-bold text-ink sm:text-sm">
                                                <Clock className="size-4 shrink-0 text-primary" />
                                                <span>
                                                    {order.pickup_session
                                                        .formatted_time ||
                                                        `${order.pickup_session.starts_at} - ${order.pickup_session.ends_at} WIB`}
                                                </span>
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <span className="flex items-center gap-1 text-[11px] text-muted">
                                                <Calendar className="size-3.5" />
                                                <span>
                                                    {order.pickup_session
                                                        .formatted_date ||
                                                        order.pickup_session
                                                            .pickup_date}
                                                </span>
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-[11px] text-muted">
                                        <MapPin className="size-3.5 shrink-0 text-primary" />
                                        <span>
                                            Loket Koperasi Sekolah KOPDIG
                                            (Lantai 1)
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted">
                                    Sesi pengambilan belum ditentukan.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* IMMUTABLE ORDER ITEMS SNAPSHOT */}
                    <section aria-labelledby="items-details">
                        <div className="mb-3 flex items-center justify-between">
                            <h2
                                id="items-details"
                                className="font-heading text-sm font-bold text-ink sm:text-base"
                            >
                                Rincian Produk (Snapshot Transaksi)
                            </h2>
                            <span className="text-xs text-muted">
                                {order.items?.length || 0} Barang
                            </span>
                        </div>

                        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
                            {order.items?.map((item: OrderItemData) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-3 p-3.5 text-xs sm:p-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-[#FAF9F5] p-1 text-primary/40">
                                            <Package className="size-5 stroke-[1.25]" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-ink sm:text-sm">
                                                {item.product_name}
                                            </h3>
                                            <p className="mt-0.5 text-[11px] text-muted">
                                                {item.quantity} x{' '}
                                                <PriceDisplay
                                                    amount={item.unit_price}
                                                    size="sm"
                                                />
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="block text-[10px] text-muted">
                                            Subtotal
                                        </span>
                                        <PriceDisplay
                                            amount={item.subtotal}
                                            size="sm"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* FINANCIAL TOTAL SUMMARY */}
                    <section aria-labelledby="financial-summary">
                        <h2
                            id="financial-summary"
                            className="mb-3 font-heading text-sm font-bold text-ink sm:text-base"
                        >
                            Total Pembayaran
                        </h2>

                        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between text-muted">
                                    <span>Subtotal</span>
                                    <span className="font-semibold text-ink">
                                        <PriceDisplay
                                            amount={order.subtotal}
                                            size="sm"
                                        />
                                    </span>
                                </div>
                                <div className="flex justify-between text-muted">
                                    <span>Biaya Layanan Koperasi</span>
                                    <span className="font-semibold text-emerald-700">
                                        Gratis (Rp 0)
                                    </span>
                                </div>
                                <div className="flex justify-between border-t border-border/60 pt-3 text-sm font-bold text-ink">
                                    <span>Total Akhir</span>
                                    <span className="font-heading text-base text-primary">
                                        <PriceDisplay
                                            amount={order.total}
                                            size="md"
                                        />
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ACTION LINKS */}
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <Link
                            href="/orders"
                            className="hover:bg-surface-subtle flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-surface py-3 text-xs font-bold text-ink shadow-2xs transition-all active:scale-98"
                        >
                            <ListOrdered className="size-4" />
                            <span>Lihat Riwayat Pesanan</span>
                        </Link>
                        <Link
                            href="/explore"
                            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-xs font-bold text-white shadow-xs transition-all hover:bg-primary-hover active:scale-98"
                        >
                            <Store className="size-4" />
                            <span>Lanjut Belanja di Marketplace</span>
                        </Link>
                    </div>
                </div>
            </PageContainer>
        </AppShell>
    );
}
