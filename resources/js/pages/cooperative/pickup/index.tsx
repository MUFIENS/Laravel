import React, { useState, useEffect, useRef } from 'react';
import {
    Keyboard,
    Search,
    CheckCircle2,
    AlertCircle,
    Clock,
    Camera,
    RotateCcw,
    Loader2,
    Check,
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';

interface ActiveSession {
    id: number;
    name: string;
    pickup_date: string;
    starts_at: string;
    ends_at: string;
    queue_prefix: string;
}

interface RecentPickup {
    id: number;
    order_id: number;
    order_number: string;
    queue_code: string | null;
    student_name: string;
    total: number;
    method: string;
    verified_at: string;
    verified_by_name?: string;
}

interface VerifiedItem {
    id: number;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
}

interface VerifiedOrder {
    id: number;
    order_number: string;
    queue_code: string | null;
    queue_number: number | null;
    student_name: string;
    subtotal: number;
    total: number;
    order_status: string;
    order_status_label: string;
    payment_status: string;
    payment_status_label: string;
    pickup_session?: {
        name: string;
        pickup_date: string;
        formatted_time: string;
    } | null;
    items: VerifiedItem[];
}

interface Props {
    active_sessions: ActiveSession[];
    recent_pickups: RecentPickup[];
}

export default function CooperativePickupIndex({
    active_sessions,
    recent_pickups: initialRecentPickups,
}: Props) {
    const [mode, setMode] = useState<'scan' | 'manual'>('scan');
    const [manualCredential, setManualCredential] = useState('');
    const [manualOrderNumber, setManualOrderNumber] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [isCompleting, setIsCompleting] = useState(false);
    const [verificationError, setVerificationError] = useState<string | null>(
        null,
    );
    const [verifiedOrder, setVerifiedOrder] = useState<VerifiedOrder | null>(
        null,
    );
    const [currentCredential, setCurrentCredential] = useState<string>('');
    const [completedSuccess, setCompletedSuccess] = useState<string | null>(
        null,
    );
    const [recentPickups, setRecentPickups] =
        useState<RecentPickup[]>(initialRecentPickups);

    // Camera scanner state
    const [cameraError, setCameraError] = useState<string | null>(null);
    const scannerRef = useRef<Html5Qrcode | null>(null);

    const getCsrfToken = (): string => {
        const meta = document.querySelector<HTMLMetaElement>(
            'meta[name="csrf-token"]',
        );
        if (meta?.content) return meta.content;
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    };

    // Start scanner
    const startScanner = async () => {
        setCameraError(null);
        try {
            const scanner = new Html5Qrcode('coop-qr-reader');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                },
                (decodedText) => {
                    // Successful scan callback
                    void handleVerification(decodedText, 'qr');
                    // Pause/stop scanner temporarily while inspecting order
                    void stopScanner();
                },
                () => {
                    // Frame error callback - ignore routine frame misses
                },
            );
        } catch (err: unknown) {
            console.error('Camera startup error:', err);
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan atau gunakan input manual.';
            setCameraError(msg);
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

    // Automatically manage camera when in 'scan' mode
    useEffect(() => {
        if (mode === 'scan' && !verifiedOrder && !completedSuccess) {
            void startScanner();
        } else {
            void stopScanner();
        }

        return () => {
            void stopScanner();
        };
    }, [mode, verifiedOrder, completedSuccess]);

    const handleVerification = async (
        credentialInput: string,
        _scanMethod: 'qr' | 'manual',
    ) => {
        const trimmed = credentialInput.trim();
        if (!trimmed) {
            setVerificationError(
                'Mohon masukkan kode kredensial atau pindai QR.',
            );
            return;
        }

        setIsVerifying(true);
        setVerificationError(null);
        setCompletedSuccess(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/cooperative/pickup/verify', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    credential: trimmed,
                    order_number: manualOrderNumber.trim() || undefined,
                }),
            });

            const data = (await response.json()) as {
                status?: string;
                message?: string;
                order?: VerifiedOrder;
                credential_token?: string;
                already_picked_up?: boolean;
            };

            if (!response.ok) {
                throw new Error(
                    data.message ||
                        'Kredensial tidak valid atau pesanan tidak ditemukan.',
                );
            }

            if (data.order && data.credential_token) {
                setVerifiedOrder(data.order);
                setCurrentCredential(data.credential_token);
            } else {
                throw new Error('Format data pesanan tidak sesuai.');
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan saat verifikasi kredensial.';
            setVerificationError(msg);
            setVerifiedOrder(null);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        void handleVerification(manualCredential, 'manual');
    };

    const handleCompletePickup = async () => {
        if (!verifiedOrder || !currentCredential) return;

        setIsCompleting(true);
        setVerificationError(null);

        try {
            const csrfToken = getCsrfToken();
            const response = await fetch('/cooperative/pickup/complete', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'X-XSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    order_id: verifiedOrder.id,
                    credential: currentCredential,
                    method: mode === 'scan' ? 'qr' : 'manual',
                }),
            });

            const data = (await response.json()) as {
                status?: string;
                message?: string;
                order_number?: string;
                queue_code?: string;
                completed_at?: string;
            };

            if (!response.ok) {
                throw new Error(
                    data.message || 'Gagal menyelesaikan pengambilan.',
                );
            }

            setCompletedSuccess(
                `Pesanan #${verifiedOrder.order_number} (${verifiedOrder.queue_code || 'Antrean Terverifikasi'}) berhasil diserahkan.`,
            );

            // Add to recent pickups list
            setRecentPickups((prev) => [
                {
                    id: Date.now(),
                    order_id: verifiedOrder.id,
                    order_number: verifiedOrder.order_number,
                    queue_code: verifiedOrder.queue_code,
                    student_name: verifiedOrder.student_name,
                    total: verifiedOrder.total,
                    method: mode === 'scan' ? 'qr' : 'manual',
                    verified_at: 'Baru saja',
                    verified_by_name: 'Anda',
                },
                ...prev.slice(0, 7),
            ]);

            // Reset current verified order
            setVerifiedOrder(null);
            setCurrentCredential('');
            setManualCredential('');
            setManualOrderNumber('');
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : 'Terjadi kesalahan saat menyelesaikan pengambilan.';
            setVerificationError(msg);
        } finally {
            setIsCompleting(false);
        }
    };

    const handleResetAll = () => {
        setVerifiedOrder(null);
        setCurrentCredential('');
        setVerificationError(null);
        setCompletedSuccess(null);
        setManualCredential('');
        setManualOrderNumber('');
        if (mode === 'scan') {
            void startScanner();
        }
    };

    return (
        <CooperativeShell
            activeNav="pickup"
            title="Loket Pengambilan Pesanan"
            subtitle="Pindai QR code siswa atau masukkan kode kredensial manual untuk memverifikasi dan menyerahkan pesanan."
            breadcrumbs={[{ label: 'Loket Pickup' }]}
        >
            <div className="space-y-6">
                {/* Header Context */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="font-heading text-xl font-bold tracking-tight text-[#F5F2EB] sm:text-2xl">
                            Verifikasi Tiket QR Loket
                        </h2>
                        <p className="mt-1 text-xs text-[#737373]">
                            Pindai QR code siswa atau masukkan kode kredensial
                            manual untuk memverifikasi dan menyerahkan pesanan.
                        </p>
                    </div>

                    {/* Active session pill */}
                    {active_sessions.length > 0 && (
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3]">
                            <Clock className="size-3.5 text-[#E34A27]" />
                            <span>
                                {active_sessions[0].name} (
                                {active_sessions[0].starts_at} -{' '}
                                {active_sessions[0].ends_at} WIB)
                            </span>
                        </div>
                    )}
                </div>

                {/* Completion Flash Alert */}
                {completedSuccess && (
                    <div
                        role="status"
                        className="flex animate-in items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-xs text-emerald-400 shadow-sm fade-in"
                    >
                        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
                        <div className="flex-1">
                            <p className="font-bold text-emerald-300">
                                Pengambilan Berhasil Dikonfirmasi!
                            </p>
                            <p className="mt-0.5 leading-relaxed text-emerald-400/90">
                                {completedSuccess}
                            </p>
                            <button
                                type="button"
                                onClick={handleResetAll}
                                className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-900/40 px-3 py-1.5 text-xs font-semibold text-emerald-200 transition-colors hover:bg-emerald-900/60 active:scale-95"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>Pindai Pesanan Berikutnya</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Verification Error Alert */}
                {verificationError && (
                    <div
                        role="alert"
                        className="flex animate-in items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-xs text-rose-400 shadow-sm fade-in"
                    >
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-400" />
                        <div className="flex-1">
                            <p className="font-bold text-rose-300">
                                Verifikasi Gagal
                            </p>
                            <p className="mt-0.5 leading-relaxed text-rose-400/90">
                                {verificationError}
                            </p>
                        </div>
                    </div>
                )}

                {/* VERIFIED ORDER CARD (Confirmation Stage) */}
                {verifiedOrder ? (
                    <div className="overflow-hidden rounded-3xl border border-emerald-500/30 bg-[#121212] shadow-xl">
                        {/* Queue Header Badge */}
                        <div className="border-b border-[#262626] bg-[#161616] px-5 py-4 text-[#F5F2EB] sm:px-6">
                            <div className="flex items-center justify-between">
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-950/60 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                                    Pesanan Terverifikasi
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                                    <Check className="size-4" />
                                    <span>Lunas & Siap Diambil</span>
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-t border-[#262626] pt-3">
                                <div>
                                    <span className="text-[11px] text-[#737373]">
                                        Nomor Antrean Siswa
                                    </span>
                                    <p className="font-mono text-3xl font-extrabold text-[#F5F2EB] sm:text-4xl">
                                        {verifiedOrder.queue_code ||
                                            `Antrean #${verifiedOrder.queue_number}`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[11px] text-[#737373]">
                                        Nama Siswa / Pembeli
                                    </span>
                                    <p className="text-base font-bold text-[#F5F2EB] sm:text-lg">
                                        {verifiedOrder.student_name}
                                    </p>
                                    <p className="font-mono text-[11px] text-[#737373]">
                                        #{verifiedOrder.order_number}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Order Items & Handover Checklist */}
                        <div className="space-y-4 p-5 sm:p-6">
                            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                                <span className="text-xs font-bold tracking-wider text-[#A3A3A3] uppercase">
                                    Daftar Barang yang Diserahkan
                                </span>
                                <span className="text-xs text-[#737373]">
                                    Total:{' '}
                                    {verifiedOrder.items.reduce(
                                        (acc, cur) => acc + cur.quantity,
                                        0,
                                    )}{' '}
                                    item
                                </span>
                            </div>

                            <div className="divide-y divide-[#262626]">
                                {verifiedOrder.items.map((item) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between py-3 text-xs"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-7 items-center justify-center rounded-lg border border-[#262626] bg-[#1A1A1A] font-mono text-xs font-bold text-[#F5F2EB]">
                                                {item.quantity}x
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#F5F2EB]">
                                                    {item.product_name}
                                                </p>
                                                <p className="text-[11px] text-[#737373]">
                                                    <PriceDisplay
                                                        amount={item.unit_price}
                                                        size="sm"
                                                    />
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right font-semibold text-[#F5F2EB]">
                                            <PriceDisplay
                                                amount={item.subtotal}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Total summary */}
                            <div className="flex items-center justify-between rounded-xl border border-[#262626] bg-[#161616] p-3.5 text-xs">
                                <span className="font-semibold text-[#737373]">
                                    Total Transaksi
                                </span>
                                <span className="font-mono text-base font-bold text-[#F5F2EB]">
                                    <PriceDisplay
                                        amount={verifiedOrder.total}
                                        size="md"
                                    />
                                </span>
                            </div>

                            {/* Operational Pickup Actions */}
                            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row">
                                <button
                                    type="button"
                                    disabled={isCompleting}
                                    onClick={handleCompletePickup}
                                    className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-sm transition-all select-none ${
                                        isCompleting
                                            ? 'cursor-not-allowed bg-[#E34A27]/60'
                                            : 'cursor-pointer bg-[#E34A27] hover:bg-[#D03E1C] active:scale-98'
                                    }`}
                                >
                                    {isCompleting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>
                                                Menyimpan Pengambilan...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="size-4" />
                                            <span>
                                                Konfirmasi Penyerahan Barang
                                            </span>
                                        </>
                                    )}
                                </button>

                                <button
                                    type="button"
                                    onClick={handleResetAll}
                                    className="flex min-h-[46px] items-center justify-center gap-1.5 rounded-full border border-[#262626] bg-[#161616] px-5 py-2.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB] active:scale-98"
                                >
                                    <RotateCcw className="size-3.5 text-[#737373]" />
                                    <span>Batal / Reset</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* INPUT / SCANNER MODES CONSOLE */
                    <div className="overflow-hidden rounded-3xl border border-[#262626] bg-[#121212] shadow-sm">
                        {/* Tab Switcher */}
                        <div className="flex border-b border-[#262626] bg-[#141414] p-1.5">
                            <button
                                type="button"
                                onClick={() => setMode('scan')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold transition-all ${
                                    mode === 'scan'
                                        ? 'border border-[#333333] bg-[#1E1E1E] text-[#F5F2EB] shadow-xs'
                                        : 'text-[#737373] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <Camera className="size-4" />
                                <span>Pindai Kamera QR</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('manual')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-xs font-semibold transition-all ${
                                    mode === 'manual'
                                        ? 'border border-[#333333] bg-[#1E1E1E] text-[#F5F2EB] shadow-xs'
                                        : 'text-[#737373] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <Keyboard className="size-4" />
                                <span>Input Kode Manual</span>
                            </button>
                        </div>

                        {/* MODE A: LIVE CAMERA SCANNER */}
                        {mode === 'scan' && (
                            <div className="p-5 text-center sm:p-6">
                                <div className="mx-auto max-w-sm">
                                    <div
                                        id="coop-qr-reader"
                                        className="overflow-hidden rounded-2xl border border-[#262626] bg-[#0A0A0A]"
                                        style={{ minHeight: '280px' }}
                                    />

                                    {cameraError && (
                                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-950/40 p-3 text-left text-xs text-amber-400">
                                            <p className="font-semibold text-amber-300">
                                                Kamera Belum Aktif
                                            </p>
                                            <p className="mt-0.5 text-[11px] leading-relaxed text-amber-400/90">
                                                {cameraError}
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setMode('manual')
                                                }
                                                className="mt-2 font-medium text-[#E34A27] underline"
                                            >
                                                Beralih ke Input Manual →
                                            </button>
                                        </div>
                                    )}

                                    <p className="mt-3 text-xs text-[#737373]">
                                        Arahkan kamera ke QR Code yang
                                        ditampilkan pada ponsel siswa.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* MODE B: MANUAL CREDENTIAL INPUT FALLBACK */}
                        {mode === 'manual' && (
                            <form
                                onSubmit={handleManualSubmit}
                                className="space-y-4 p-5 sm:p-6"
                            >
                                <div>
                                    <label
                                        htmlFor="credential-input"
                                        className="block text-xs font-semibold tracking-wider text-[#A3A3A3] uppercase"
                                    >
                                        Kode Kredensial Pengambilan
                                    </label>
                                    <div className="relative mt-1.5">
                                        <input
                                            id="credential-input"
                                            type="text"
                                            value={manualCredential}
                                            onChange={(e) =>
                                                setManualCredential(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: 7F9B-2E4A-8C1D-5F03 atau tempel payload"
                                            className="w-full rounded-xl border border-[#262626] bg-[#141414] px-4 py-3 font-mono text-xs text-[#F5F2EB] uppercase placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27]/20 focus:outline-none"
                                            required
                                        />
                                    </div>
                                    <p className="mt-1 text-[11px] text-[#737373]">
                                        Kode 16 karakter dapat ditemukan tepat
                                        di bawah QR code siswa.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="order-number-input"
                                        className="block text-xs font-semibold tracking-wider text-[#A3A3A3] uppercase"
                                    >
                                        Nomor Pesanan (Opsional)
                                    </label>
                                    <div className="mt-1.5">
                                        <input
                                            id="order-number-input"
                                            type="text"
                                            value={manualOrderNumber}
                                            onChange={(e) =>
                                                setManualOrderNumber(
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Contoh: KD-20261003-AB12CD"
                                            className="w-full rounded-xl border border-[#262626] bg-[#141414] px-4 py-3 font-mono text-xs text-[#F5F2EB] uppercase placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27]/20 focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={
                                        isVerifying || !manualCredential.trim()
                                    }
                                    className={`flex min-h-[46px] w-full items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold text-white shadow-sm transition-all ${
                                        isVerifying || !manualCredential.trim()
                                            ? 'cursor-not-allowed bg-[#E34A27]/60'
                                            : 'cursor-pointer bg-[#E34A27] hover:bg-[#D03E1C] active:scale-98'
                                    }`}
                                >
                                    {isVerifying ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>
                                                Memverifikasi Kredensial...
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
                )}

                {/* RECENT PICKUPS AUDIT TRAIL */}
                <section
                    className="mt-8"
                    aria-labelledby="recent-pickups-title"
                >
                    <div className="mb-3 flex items-center justify-between">
                        <h3
                            id="recent-pickups-title"
                            className="font-heading text-sm font-bold text-[#F5F2EB] sm:text-base"
                        >
                            Riwayat Pengambilan Hari Ini
                        </h3>
                        <span className="text-xs text-[#737373]">
                            {recentPickups.length} pesanan diserahkan
                        </span>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[#262626] bg-[#121212] shadow-sm">
                        {recentPickups.length > 0 ? (
                            <div className="divide-y divide-[#262626]">
                                {recentPickups.map((log) => (
                                    <div
                                        key={log.id}
                                        className="flex items-center justify-between p-3.5 text-xs transition-colors hover:bg-[#161616]"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#1A1A1A] font-mono text-xs font-bold text-emerald-400">
                                                {log.queue_code || 'OK'}
                                            </span>
                                            <div>
                                                <p className="font-medium text-[#F5F2EB]">
                                                    {log.student_name}
                                                </p>
                                                <p className="font-mono text-[11px] text-[#737373]">
                                                    #{log.order_number}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 text-[11px] font-semibold text-emerald-400">
                                                <CheckCircle2 className="size-3.5" />
                                                <span>{log.verified_at}</span>
                                            </div>
                                            <span className="inline-block text-[10px] text-[#737373] uppercase">
                                                Via{' '}
                                                {log.method === 'qr'
                                                    ? 'QR Scanner'
                                                    : 'Kode Manual'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-xs text-[#737373]">
                                Belum ada pengambilan yang diselesaikan pada
                                hari ini.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </CooperativeShell>
    );
}
