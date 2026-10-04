import React, { useState, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import {
    AlertCircle,
    Banknote,
    Camera,
    Check,
    CheckCircle2,
    Clock,
    Eye,
    Keyboard,
    Loader2,
    RotateCcw,
    Search,
    ShieldAlert,
    X,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';

export type ScannerState =
    | 'IDLE'
    | 'REQUESTING_PERMISSION'
    | 'SCANNING'
    | 'PROCESSING'
    | 'INVALID_QR'
    | 'UNAUTHORIZED'
    | 'PAYMENT_NOT_FOUND'
    | 'PAYMENT_NOT_ELIGIBLE'
    | 'ALREADY_PAID'
    | 'CANCELLED_ORDER'
    | 'SUCCESSFUL_LOOKUP'
    | 'CONFIRMING_PAYMENT'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'CAMERA_ERROR';

interface ActiveSession {
    id: number;
    name: string;
    pickup_date: string;
    starts_at: string;
    ends_at: string;
    queue_prefix: string;
}

interface RecentPayment {
    id: number;
    order_id: number;
    order_number: string;
    queue_code: string | null;
    student_name: string;
    gross_amount: number;
    verified_at: string;
    verified_by_name: string;
}

interface PendingOrderItem {
    id: number;
    order_number: string;
    student_name: string;
    student_identifier?: string | null;
    total: number;
    items_count: number;
    total_quantity: number;
    created_at?: string;
    formatted_created_at?: string;
    pickup_session_name?: string | null;
    pickup_time?: string | null;
    token?: string | null;
}

interface PendingOrdersPagination {
    data: PendingOrderItem[];
    current_page?: number;
    last_page?: number;
    total?: number;
}

interface VerifiedItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    current_stock: number;
    is_stock_sufficient: boolean;
}

interface VerifiedOrder {
    id: number;
    order_number: string;
    student_name: string;
    subtotal: number;
    total: number;
    order_status: string;
    order_status_label: string;
    payment_status: string;
    payment_status_label: string;
    has_stock_deficit: boolean;
    pickup_session?: {
        name: string;
        pickup_date: string;
        formatted_time: string;
    } | null;
    items: VerifiedItem[];
}

interface ConfirmedResult {
    order_number: string;
    queue_code: string | null;
    queue_number: number | null;
    student_name: string;
    total: number;
    pickup_session_name?: string;
    ready_at?: string;
    message: string;
}

interface Props {
    active_sessions: ActiveSession[];
    recent_payments: RecentPayment[];
    pending_orders?: PendingOrdersPagination;
}

export default function CooperativePaymentsIndex({
    active_sessions,
    recent_payments: initialRecentPayments,
    pending_orders,
}: Props) {
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [manualToken, setManualToken] = useState('');
    const [manualOrderNumber, setManualOrderNumber] = useState('');
    const [scannerState, setScannerState] = useState<ScannerState>('IDLE');
    const [verificationError, setVerificationError] = useState<string | null>(
        null,
    );
    const [verifiedOrder, setVerifiedOrder] = useState<VerifiedOrder | null>(
        null,
    );
    const [currentToken, setCurrentToken] = useState<string>('');
    const [confirmedResult, setConfirmedResult] =
        useState<ConfirmedResult | null>(null);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>(
        initialRecentPayments,
    );
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningLocked = useRef<boolean>(false);

    const getCsrfToken = (): string => {
        const meta = document.querySelector<HTMLMetaElement>(
            'meta[name="csrf-token"]',
        );
        if (meta?.content) return meta.content;
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    const startScanner = async () => {
        setCameraError(null);
        setScannerState('REQUESTING_PERMISSION');

        try {
            const scanner = new Html5Qrcode('coop-payment-qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Prevent repeated camera frames from triggering multiple concurrent API requests
                    if (isScanningLocked.current) return;
                    isScanningLocked.current = true;
                    void handleVerification(decodedText, 'qr');
                    void stopScanner();
                },
                () => {
                    // Routine frame missed - keep scanning silently
                },
            );

            setScannerState('SCANNING');
        } catch (err: unknown) {
            console.error('Camera startup error:', err);
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Tidak dapat mengakses kamera. Pastikan izin kamera aktif atau gunakan input kode manual.';
            setCameraError(msg);
            setScannerState('CAMERA_ERROR');
        }
    };

    const stopScanner = async () => {
        if (scannerRef.current && scannerRef.current.isScanning) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (err) {
                console.error('Error stopping scanner:', err);
            }
        }
    };

    // Manage camera scanner based on mode and active verification state
    useEffect(() => {
        if (mode === 'scan' && !verifiedOrder && !confirmedResult) {
            isScanningLocked.current = false;
            void startScanner();
        } else {
            void stopScanner();
        }

        return () => {
            void stopScanner();
        };
    }, [mode, verifiedOrder, confirmedResult]);

    const handleVerification = async (
        tokenInput: string,
        _scanMethod: 'qr' | 'manual',
    ) => {
        const trimmed = tokenInput.trim();
        if (!trimmed) {
            setVerificationError(
                'Mohon masukkan token pembayaran atau pindai QR.',
            );
            setScannerState('INVALID_QR');
            isScanningLocked.current = false;
            return;
        }

        setScannerState('PROCESSING');
        setVerificationError(null);
        setConfirmedResult(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/cooperative/payments/verify', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    token: trimmed,
                    order_number: manualOrderNumber.trim() || undefined,
                }),
            });

            const data = (await response.json()) as {
                status?: string;
                message?: string;
                order?: VerifiedOrder;
                token?: string;
                already_paid?: boolean;
                error_type?: string;
            };

            if (!response.ok) {
                if (response.status === 403) {
                    setScannerState('UNAUTHORIZED');
                } else if (response.status === 404) {
                    setScannerState('PAYMENT_NOT_FOUND');
                } else if (data.already_paid) {
                    setScannerState('ALREADY_PAID');
                } else if (
                    data.error_type === 'pickup_qr_detected' ||
                    data.error_type === 'unsupported_version'
                ) {
                    setScannerState('INVALID_QR');
                } else if (data.message?.toLowerCase().includes('dibatalkan')) {
                    setScannerState('CANCELLED_ORDER');
                } else {
                    setScannerState('PAYMENT_NOT_ELIGIBLE');
                }

                throw new Error(
                    data.message ||
                        'QR pembayaran tidak valid atau pesanan tidak ditemukan.',
                );
            }

            if (data.order && data.token) {
                setVerifiedOrder(data.order);
                setCurrentToken(data.token);
                setScannerState('SUCCESSFUL_LOOKUP');
            } else {
                setScannerState('INVALID_QR');
                throw new Error(
                    'Format data verifikasi pembayaran tidak sesuai.',
                );
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan saat memverifikasi pembayaran.';
            setVerificationError(msg);
            setVerifiedOrder(null);
            isScanningLocked.current = false;
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleVerification(manualToken, 'manual');
    };

    const executeConfirmation = async () => {
        if (!verifiedOrder || !currentToken) return;

        setScannerState('CONFIRMING_PAYMENT');
        setVerificationError(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/cooperative/payments/confirm', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    order_id: verifiedOrder.id,
                    token: currentToken,
                }),
            });

            const data = (await response.json()) as {
                status?: string;
                message?: string;
                already_processed?: boolean;
                order?: {
                    id: number;
                    order_number: string;
                    queue_code: string | null;
                    queue_number: number | null;
                    student_name: string;
                    total: number;
                    order_status: string;
                    order_status_label: string;
                    pickup_session_name?: string;
                    ready_at?: string;
                };
            };

            if (!response.ok) {
                setScannerState('PAYMENT_FAILED');
                throw new Error(
                    data.message || 'Gagal mengonfirmasi pembayaran tunai.',
                );
            }

            if (data.order) {
                setConfirmedResult({
                    order_number: data.order.order_number,
                    queue_code: data.order.queue_code,
                    queue_number: data.order.queue_number,
                    student_name: data.order.student_name,
                    total: data.order.total,
                    pickup_session_name: data.order.pickup_session_name,
                    ready_at: data.order.ready_at,
                    message:
                        data.message || 'Pembayaran berhasil diverifikasi.',
                });

                setScannerState('PAYMENT_SUCCESS');

                // Prepend to audit trail
                setRecentPayments((prev) => [
                    {
                        id: Date.now(),
                        order_id: data.order!.id,
                        order_number: data.order!.order_number,
                        queue_code: data.order!.queue_code,
                        student_name: data.order!.student_name,
                        gross_amount: data.order!.total,
                        verified_at: 'Baru saja',
                        verified_by_name: 'Anda',
                    },
                    ...prev.slice(0, 9),
                ]);
            }

            // Close modal & clear verified order state
            setIsConfirmModalOpen(false);
            setVerifiedOrder(null);
            setCurrentToken('');
            setManualToken('');
            setManualOrderNumber('');
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan saat memproses pembayaran.';
            setVerificationError(msg);
            setScannerState('PAYMENT_FAILED');
            setIsConfirmModalOpen(false);
        }
    };

    const handleResetAll = () => {
        setVerifiedOrder(null);
        setCurrentToken('');
        setVerificationError(null);
        setConfirmedResult(null);
        setManualToken('');
        setManualOrderNumber('');
        setIsConfirmModalOpen(false);
        isScanningLocked.current = false;
        setScannerState('IDLE');
        if (mode === 'scan') {
            void startScanner();
        }
    };

    const isProcessing =
        scannerState === 'PROCESSING' ||
        scannerState === 'REQUESTING_PERMISSION';
    const isConfirming = scannerState === 'CONFIRMING_PAYMENT';

    return (
        <CooperativeShell
            activeNav="payments"
            title="Verifikasi Pembayaran"
            subtitle="Scan QR pembayaran siswa untuk memeriksa pesanan dan menerima pembayaran tunai."
            breadcrumbs={[{ label: 'Kasir QR' }]}
        >
            <Head title="Verifikasi Pembayaran & Kasir QR | KOPDIG" />

            <div className="space-y-6">
                {/* 1. OPERATIONAL HEADER BANNER */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="font-heading text-lg font-black tracking-tight text-[#F5F2EB] sm:text-xl">
                                Verifikasi Pembayaran Tunai
                            </h2>
                            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                Loket Aktif
                            </span>
                        </div>
                        <p className="mt-1 text-xs text-[#A3A3A3]">
                            Posisikan QR pembayaran siswa di dalam area
                            pemindaian untuk memeriksa pesanan dan menerima uang
                            tunai.
                        </p>
                    </div>

                    {/* Active session pill */}
                    {active_sessions.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 rounded border border-[#E34A27]/30 bg-[#E34A27]/10 px-3 py-1 font-mono text-xs font-semibold text-[#E34A27]">
                            <Clock className="size-3.5" />
                            <span>
                                {active_sessions[0].name} (
                                {active_sessions[0].starts_at} -{' '}
                                {active_sessions[0].ends_at} WIB)
                            </span>
                        </div>
                    )}
                </div>

                {/* 2. SUCCESS CONFIRMATION STATE */}
                {confirmedResult && (
                    <div
                        role="status"
                        className="animate-in overflow-hidden rounded-xl border border-emerald-500/40 bg-[#121212] shadow-xl fade-in"
                    >
                        <div className="border-b border-emerald-800/40 bg-emerald-950/80 px-6 py-5 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-700/50 bg-emerald-900">
                                        <CheckCircle2 className="size-5 text-emerald-300" />
                                    </div>
                                    <div>
                                        <span className="font-heading text-xs font-bold tracking-wider text-emerald-200 uppercase">
                                            Pembayaran Berhasil Diverifikasi
                                        </span>
                                        <p className="text-[11px] text-emerald-300/80">
                                            Kas fisik telah diterima & pesanan
                                            masuk antrean
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded border border-emerald-400/30 bg-emerald-500/20 px-3 py-0.5 font-mono text-[11px] font-bold text-emerald-200">
                                    LUNAS
                                </span>
                            </div>

                            <div className="mt-5 flex flex-wrap items-baseline justify-between gap-4 border-t border-emerald-800/50 pt-4">
                                <div>
                                    <span className="font-mono text-[11px] text-emerald-300/80 uppercase">
                                        Nomor Antrean Pengambilan
                                    </span>
                                    <p className="font-mono text-3xl font-black text-white sm:text-4xl">
                                        {confirmedResult.queue_code ||
                                            (confirmedResult.queue_number
                                                ? `Antrean #${confirmedResult.queue_number}`
                                                : 'Antrean Diterbitkan')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="font-mono text-[11px] text-emerald-300/80 uppercase">
                                        Kas Diterima
                                    </span>
                                    <p className="font-heading text-xl font-black text-white sm:text-2xl">
                                        {formatRupiah(confirmedResult.total)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 p-6 text-xs text-[#A3A3A3]">
                            <div className="grid gap-3 rounded-xl border border-[#262626] bg-[#161616] p-4 sm:grid-cols-2">
                                <div>
                                    <span className="block font-mono text-[10px] font-bold text-[#737373] uppercase">
                                        Nomor Pesanan
                                    </span>
                                    <span className="font-mono text-xs font-bold text-[#F5F2EB]">
                                        {confirmedResult.order_number}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-mono text-[10px] font-bold text-[#737373] uppercase">
                                        Nama Siswa
                                    </span>
                                    <span className="text-xs font-bold text-[#F5F2EB]">
                                        {confirmedResult.student_name}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-mono text-[10px] font-bold text-[#737373] uppercase">
                                        Sesi Pengambilan
                                    </span>
                                    <span className="text-xs font-medium text-[#F5F2EB]">
                                        {confirmedResult.pickup_session_name ||
                                            'Sesi Terjadwal'}
                                    </span>
                                </div>
                                <div>
                                    <span className="block font-mono text-[10px] font-bold text-[#737373] uppercase">
                                        Status Pesanan
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                                        <Check className="size-3.5" />
                                        <span>
                                            Siap Diambil (Ready for Pickup)
                                        </span>
                                    </span>
                                </div>
                            </div>

                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-[11px] leading-relaxed text-[#A3A3A3]">
                                <strong className="text-[#F5F2EB]">
                                    Catatan Serah-Terima:
                                </strong>{' '}
                                Pembayaran telah selesai diverifikasi, namun
                                pesanan <strong>BELUM</strong> diserahkan ke
                                siswa. Siswa akan membawa QR Pengambilan pada
                                saat jam istirahat/sesi pickup.
                            </div>

                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-lg bg-[#E34A27] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#E34A27]/90 active:scale-95"
                            >
                                <RotateCcw className="size-4" />
                                <span>Scan Pembayaran Berikutnya</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. ERROR ALERT BANNER */}
                {verificationError && (
                    <div
                        role="alert"
                        className="flex animate-in items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-300 shadow-xs fade-in"
                    >
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-400" />
                        <div className="flex-1">
                            <p className="font-bold text-rose-300">
                                Verifikasi Gagal
                            </p>
                            <p className="mt-0.5 leading-relaxed text-[#A3A3A3]">
                                {verificationError}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setVerificationError(null)}
                            className="text-rose-400 hover:text-rose-200"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* 4. MAIN DUAL-COLUMN CONSOLE */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    {/* LEFT COLUMN: SCANNER / MANUAL INPUT (lg:col-span-7) */}
                    <div className="space-y-4 lg:col-span-7">
                        <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#121212] shadow-xs">
                            {/* Mode Tab Switcher */}
                            <div className="flex border-b border-[#262626] bg-[#161616] p-1.5">
                                <button
                                    type="button"
                                    onClick={() => setMode('scan')}
                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                        mode === 'scan'
                                            ? 'bg-[#222222] text-[#F5F2EB] shadow-xs'
                                            : 'text-[#737373] hover:text-[#F5F2EB]'
                                    }`}
                                >
                                    <Camera className="size-4" />
                                    <span>Pindai Kamera QR</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode('manual')}
                                    className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-all ${
                                        mode === 'manual'
                                            ? 'bg-[#222222] text-[#F5F2EB] shadow-xs'
                                            : 'text-[#737373] hover:text-[#F5F2EB]'
                                    }`}
                                >
                                    <Keyboard className="size-4" />
                                    <span>Input Manual</span>
                                </button>
                            </div>

                            {/* MODE A: LIVE CAMERA SCANNER */}
                            {mode === 'scan' && (
                                <div className="p-5 text-center sm:p-6">
                                    <div className="mx-auto max-w-sm">
                                        <div className="relative overflow-hidden rounded-xl border border-[#262626] bg-black">
                                            <div
                                                id="coop-payment-qr-reader"
                                                className="w-full"
                                                style={{ minHeight: '280px' }}
                                            />

                                            {isProcessing && (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white backdrop-blur-xs">
                                                    <Loader2 className="size-8 animate-spin text-[#E34A27]" />
                                                    <span className="mt-2 text-xs font-bold">
                                                        Memeriksa Kredensial...
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {cameraError && (
                                            <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left text-xs text-amber-300">
                                                <p className="font-semibold">
                                                    Kamera Belum Aktif
                                                </p>
                                                <p className="mt-0.5 text-[11px] leading-relaxed text-[#A3A3A3]">
                                                    {cameraError}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setMode('manual')
                                                    }
                                                    className="mt-2 cursor-pointer font-bold text-[#E34A27] underline"
                                                >
                                                    Beralih ke Input Manual
                                                    &rarr;
                                                </button>
                                            </div>
                                        )}

                                        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#737373]">
                                            <span className="size-2 animate-pulse rounded-full bg-emerald-400" />
                                            <span>
                                                Posisikan QR pembayaran siswa di
                                                dalam area pemindaian.
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* MODE B: MANUAL INPUT FALLBACK */}
                            {mode === 'manual' && (
                                <form
                                    onSubmit={handleManualSubmit}
                                    className="space-y-4 p-5 sm:p-6"
                                >
                                    <div>
                                        <label
                                            htmlFor="payment-token-input"
                                            className="block font-mono text-xs font-bold tracking-wider text-[#F5F2EB] uppercase"
                                        >
                                            Kode Verifikasi Kasir / Token QR
                                        </label>
                                        <div className="relative mt-1.5">
                                            <input
                                                id="payment-token-input"
                                                type="text"
                                                value={manualToken}
                                                onChange={(e) =>
                                                    setManualToken(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: A1B2-C3D4-E5F6-7890 atau tempel payload JSON"
                                                className="w-full rounded-lg border border-[#262626] bg-[#181818] px-4 py-3 font-mono text-xs text-[#F5F2EB] uppercase shadow-2xs focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                                required
                                            />
                                        </div>
                                        <p className="mt-1 text-[11px] text-[#737373]">
                                            Kode 16 karakter dapat ditemukan
                                            tepat di bawah QR Pembayaran Tunai
                                            pada layar siswa.
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="order-number-manual-input"
                                            className="block font-mono text-xs font-bold tracking-wider text-[#F5F2EB] uppercase"
                                        >
                                            Nomor Pesanan (Opsional)
                                        </label>
                                        <div className="mt-1.5">
                                            <input
                                                id="order-number-manual-input"
                                                type="text"
                                                value={manualOrderNumber}
                                                onChange={(e) =>
                                                    setManualOrderNumber(
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: KD-20261004-AB12CD"
                                                className="w-full rounded-lg border border-[#262626] bg-[#181818] px-4 py-3 font-mono text-xs text-[#F5F2EB] uppercase shadow-2xs focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={
                                            isProcessing || !manualToken.trim()
                                        }
                                        className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E34A27] py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#E34A27]/90 disabled:opacity-50"
                                    >
                                        {isProcessing ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>
                                                    Memverifikasi Token...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <Search className="size-4" />
                                                <span>
                                                    Cek & Verifikasi Pesanan
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: VERIFICATION DETAIL PREVIEW (lg:col-span-5) */}
                    <div className="lg:col-span-5">
                        {verifiedOrder ? (
                            <div className="animate-in overflow-hidden rounded-xl border border-[#E34A27]/50 bg-[#121212] shadow-lg fade-in">
                                {/* Header Card */}
                                <div className="border-b border-[#E34A27]/30 bg-[#E34A27]/15 px-5 py-4 text-white">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Banknote className="size-5 text-[#E34A27]" />
                                            <span className="font-mono text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                                Detail Pesanan Terverifikasi
                                            </span>
                                        </div>
                                        <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                                            Menunggu Uang Tunai
                                        </span>
                                    </div>

                                    <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#262626] pt-3">
                                        <div>
                                            <span className="font-mono text-[10px] text-[#737373] uppercase">
                                                Total Kas yang Harus Diterima
                                            </span>
                                            <p className="font-heading text-2xl font-black text-[#F5F2EB] sm:text-3xl">
                                                {formatRupiah(
                                                    verifiedOrder.total,
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-mono text-[10px] text-[#737373] uppercase">
                                                Nomor Pesanan
                                            </span>
                                            <p className="font-mono text-xs font-bold text-[#E34A27]">
                                                {verifiedOrder.order_number}
                                            </p>
                                            <p className="text-xs font-medium text-[#F5F2EB]">
                                                {verifiedOrder.student_name}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Items & Live Stock Breakdown */}
                                <div className="space-y-4 p-5 text-xs text-[#F5F2EB]">
                                    {verifiedOrder.has_stock_deficit && (
                                        <div className="flex items-start gap-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-rose-400">
                                            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-rose-400" />
                                            <div>
                                                <p className="font-bold text-rose-300">
                                                    Peringatan: Stok Fisik
                                                    Kurang
                                                </p>
                                                <p className="mt-0.5 text-[11px] text-[#A3A3A3]">
                                                    Salah satu produk pesanan
                                                    ini memiliki stok kurang.
                                                    Pembayaran tidak dapat
                                                    dikonfirmasi sampai stok
                                                    fisik disesuaikan.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between border-b border-[#262626] pb-2 font-mono text-[11px] font-bold text-[#737373] uppercase">
                                        <span>Item Dipesan</span>
                                        <span>Subtotal</span>
                                    </div>

                                    <div className="divide-y divide-[#202020]">
                                        {verifiedOrder.items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center justify-between py-2"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <span className="flex size-6 items-center justify-center rounded bg-[#E34A27]/10 font-mono text-xs font-bold text-[#E34A27]">
                                                        {item.quantity}x
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-[#F5F2EB]">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="font-mono text-[10px] text-[#737373]">
                                                            {formatRupiah(
                                                                item.unit_price,
                                                            )}{' '}
                                                            &bull; Sisa stok:{' '}
                                                            {item.current_stock}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <span className="font-mono font-bold text-[#F5F2EB]">
                                                        {formatRupiah(
                                                            item.subtotal,
                                                        )}
                                                    </span>
                                                    {!item.is_stock_sufficient && (
                                                        <span className="block font-mono text-[9px] font-bold text-rose-400">
                                                            Stok Kurang
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pickup Session Info */}
                                    <div className="rounded-lg border border-[#262626] bg-[#161616] p-3">
                                        <span className="block font-mono text-[10px] font-bold text-[#737373] uppercase">
                                            Sesi Pengambilan
                                        </span>
                                        <p className="mt-0.5 font-medium text-[#F5F2EB]">
                                            {verifiedOrder.pickup_session
                                                ?.name || 'Sesi Terjadwal'}{' '}
                                            (
                                            {
                                                verifiedOrder.pickup_session
                                                    ?.formatted_time
                                            }
                                            )
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            type="button"
                                            disabled={
                                                isConfirming ||
                                                verifiedOrder.has_stock_deficit
                                            }
                                            onClick={() =>
                                                setIsConfirmModalOpen(true)
                                            }
                                            className="flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E34A27] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-[#E34A27]/90 active:scale-[0.99] disabled:opacity-50"
                                        >
                                            <Banknote className="size-4" />
                                            <span>
                                                Konfirmasi Uang Diterima (
                                                {formatRupiah(
                                                    verifiedOrder.total,
                                                )}
                                                )
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleResetAll}
                                            className="flex min-h-[40px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-4 py-2 text-xs font-semibold text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]"
                                        >
                                            <RotateCcw className="size-3.5" />
                                            <span>Batal / Pindai Ulang</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-[#262626] bg-[#121212]/60 p-6 text-center text-xs text-[#737373]">
                                <div className="flex size-11 items-center justify-center rounded-lg border border-[#262626] bg-[#161616] text-[#737373]">
                                    <Banknote className="size-5" />
                                </div>
                                <h3 className="mt-3 font-heading text-sm font-bold text-[#F5F2EB]">
                                    Menunggu Pemindaian QR
                                </h3>
                                <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-[#737373]">
                                    Setelah QR siswa dipindai atau kode
                                    dimasukkan, detail pesanan dan live stock
                                    akan muncul di sini untuk verifikasi sebelum
                                    uang tunai dikonfirmasi.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 5. CONFIRMATION DIALOG MODAL (Section 14) */}
                {isConfirmModalOpen && verifiedOrder && (
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="confirm-modal-title"
                        className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-black/80 p-4 backdrop-blur-xs fade-in"
                    >
                        <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#262626] bg-[#121212] p-6 text-[#F5F2EB] shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg border border-[#E34A27]/25 bg-[#E34A27]/10 text-[#E34A27]">
                                    <Banknote className="size-5" />
                                </div>
                                <div>
                                    <h3
                                        id="confirm-modal-title"
                                        className="font-heading text-base font-bold text-[#F5F2EB]"
                                    >
                                        Konfirmasi Pembayaran
                                    </h3>
                                    <p className="text-xs text-[#737373]">
                                        Verifikasi penerimaan uang tunai siswa
                                    </p>
                                </div>
                            </div>

                            <div className="my-5 rounded-lg border border-[#262626] bg-[#161616] p-4 text-center">
                                <p className="text-xs text-[#737373]">
                                    Pastikan uang tunai sebesar
                                </p>
                                <p className="mt-1 font-heading text-3xl font-black text-[#E34A27]">
                                    {formatRupiah(verifiedOrder.total)}
                                </p>
                                <p className="mt-2 text-[11px] text-[#737373]">
                                    telah diterima dari siswa{' '}
                                    <strong className="text-[#F5F2EB]">
                                        {verifiedOrder.student_name}
                                    </strong>{' '}
                                    untuk pesanan{' '}
                                    <span className="font-mono font-bold text-[#E34A27]">
                                        #{verifiedOrder.order_number}
                                    </span>
                                    .
                                </p>
                            </div>

                            <div className="flex flex-col gap-2.5 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={isConfirming}
                                    onClick={() => void executeConfirmation()}
                                    className="flex min-h-[42px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#E34A27] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-opacity hover:bg-[#E34A27]/90 disabled:opacity-50"
                                >
                                    {isConfirming ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Memproses Transaksi...</span>
                                        </>
                                    ) : (
                                        <span>Konfirmasi Pembayaran</span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    disabled={isConfirming}
                                    onClick={() => setIsConfirmModalOpen(false)}
                                    className="flex min-h-[42px] cursor-pointer items-center justify-center rounded-lg border border-[#262626] bg-[#181818] px-4 py-2.5 text-xs font-semibold text-[#737373] hover:text-[#F5F2EB]"
                                >
                                    Batalkan
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 6. PENDING PAYMENTS LIST (Section 22) */}
                <section
                    className="mt-10"
                    aria-labelledby="pending-payments-title"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3
                                id="pending-payments-title"
                                className="font-heading text-sm font-bold text-[#F5F2EB] sm:text-base"
                            >
                                Daftar Pesanan Menunggu Pembayaran
                            </h3>
                            <span className="rounded border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-400">
                                {pending_orders?.data?.length ?? 0} Antre
                            </span>
                        </div>
                        <span className="text-xs text-[#737373]">
                            Data real-time dari database
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#121212] shadow-xs">
                        {pending_orders?.data &&
                        pending_orders.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="border-b border-[#262626] bg-[#161616] font-mono text-[10px] text-[#737373] uppercase">
                                        <tr>
                                            <th className="px-4 py-3">
                                                Nomor Pesanan
                                            </th>
                                            <th className="px-4 py-3">Siswa</th>
                                            <th className="px-4 py-3">
                                                Total Belanja
                                            </th>
                                            <th className="px-4 py-3">
                                                Sesi Pengambilan
                                            </th>
                                            <th className="px-4 py-3">
                                                Waktu Pemesanan
                                            </th>
                                            <th className="px-4 py-3 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#1F1F1F]">
                                        {pending_orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="transition-colors hover:bg-[#181818]"
                                            >
                                                <td className="px-4 py-3 font-mono font-bold text-[#F5F2EB]">
                                                    #{order.order_number}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="font-bold text-[#F5F2EB]">
                                                        {order.student_name}
                                                    </span>
                                                    {order.student_identifier && (
                                                        <span className="block font-mono text-[10px] text-[#737373]">
                                                            {
                                                                order.student_identifier
                                                            }
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 font-mono font-bold text-[#E34A27]">
                                                    {formatRupiah(order.total)}
                                                </td>
                                                <td className="px-4 py-3 text-[#A3A3A3]">
                                                    {order.pickup_session_name ||
                                                        'Sesi Koperasi'}
                                                    {order.pickup_time && (
                                                        <span className="block font-mono text-[10px] text-[#737373]">
                                                            {order.pickup_time}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-[#737373]">
                                                    {order.formatted_created_at ||
                                                        'Baru saja'}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            void handleVerification(
                                                                order.token ||
                                                                    order.order_number,
                                                                'manual',
                                                            );
                                                            window.scrollTo({
                                                                top: 0,
                                                                behavior:
                                                                    'smooth',
                                                            });
                                                        }}
                                                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#262626] bg-[#181818] px-2.5 py-1 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27]"
                                                    >
                                                        <Eye className="size-3.5" />
                                                        <span>Periksa</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-[#737373]">
                                Tidak ada pesanan menunggu pembayaran tunai saat
                                ini.
                            </div>
                        )}
                    </div>
                </section>

                {/* 7. RECENT VERIFIED CASH PAYMENTS AUDIT TRAIL */}
                <section
                    className="mt-8"
                    aria-labelledby="recent-payments-title"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3
                            id="recent-payments-title"
                            className="font-heading text-sm font-bold text-[#F5F2EB] sm:text-base"
                        >
                            Riwayat Pembayaran Tunai Hari Ini
                        </h3>
                        <span className="text-xs text-[#737373]">
                            {recentPayments.length} transaksi diverifikasi
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-[#262626] bg-[#121212] shadow-xs">
                        {recentPayments.length > 0 ? (
                            <div className="divide-y divide-[#1F1F1F]">
                                {recentPayments.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-[#181818]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded border border-emerald-500/30 bg-emerald-500/10 font-mono text-xs font-bold text-emerald-400">
                                                {log.queue_code || 'OK'}
                                            </span>
                                            <div>
                                                <p className="font-bold text-[#F5F2EB]">
                                                    {log.student_name}
                                                </p>
                                                <p className="font-mono text-[11px] text-[#737373]">
                                                    #{log.order_number}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <span className="font-mono font-bold text-[#F5F2EB]">
                                                {formatRupiah(log.gross_amount)}
                                            </span>
                                            <div className="flex items-center justify-end gap-1 text-[10px] text-[#737373]">
                                                <span>{log.verified_at}</span>
                                                <span>&bull;</span>
                                                <span>
                                                    {log.verified_by_name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-[#737373]">
                                Belum ada pembayaran tunai yang diverifikasi
                                pada hari ini.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </CooperativeShell>
    );
}
