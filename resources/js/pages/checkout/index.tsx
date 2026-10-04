import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Banknote,
    Calendar,
    CheckCircle2,
    Clock,
    Info,
    Loader2,
    Package,
    ShieldCheck,
    ShoppingBag,
    ArrowRight,
    AlertCircle,
} from 'lucide-react';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { Auth } from '@/types';
import type { PickupSessionData } from '@/types/pickup-session';
import type { CartData, CartItemData } from '@/types/cart';

interface CheckoutPageProps {
    auth: Auth;
    cart: CartData & { total: number };
    pickupSessions: PickupSessionData[];
    errors?: Record<string, string>;
    [key: string]: unknown;
}

export default function CheckoutIndex() {
    const { cart, pickupSessions, errors } = usePage<CheckoutPageProps>().props;

    // Default select first available pickup session if present
    const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
        pickupSessions.length > 0 ? pickupSessions[0].id : null,
    );
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(
        errors?.cart || errors?.checkout || errors?.pickup_session_id || null,
    );
    const [failedImages, setFailedImages] = useState<Record<number, boolean>>(
        {},
    );

    const handleImageError = (productId: number) => {
        setFailedImages((prev) => ({ ...prev, [productId]: true }));
    };

    const selectedSession = pickupSessions.find(
        (s) => s.id === selectedSessionId,
    );

    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSessionId) {
            setErrorMessage(
                'Silakan pilih jadwal pengambilan terlebih dahulu.',
            );
            return;
        }

        if (isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        router.post(
            '/checkout',
            { pickup_session_id: selectedSessionId },
            {
                preserveScroll: true,
                onError: (validationErrors) => {
                    setIsSubmitting(false);
                    const msg =
                        validationErrors.cart ||
                        validationErrors.checkout ||
                        validationErrors.pickup_session_id ||
                        validationErrors.general ||
                        'Gagal memproses pesanan. Silakan periksa kembali keranjang belanja Anda.';
                    setErrorMessage(String(msg));
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title="Checkout Pesanan — KOPDIG" />

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
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
                    {/* Left: Back Navigation */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/cart')}
                        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke keranjang belanja"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Keranjang</span>
                    </button>

                    {/* Center: Brand Mark (Identical to Landing Page) */}
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
                                Checkout Transaksi
                            </span>
                        </div>
                    </Link>

                    {/* Right: Quantity Badge */}
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E34A27]/30 bg-[#E34A27]/10 px-3 py-1 font-mono text-xs font-semibold text-[#E34A27]">
                        <ShoppingBag className="size-3.5" />
                        <span>{cart.total_quantity} Unit</span>
                    </div>
                </div>
            </header>

            {/* 2. MAIN CHECKOUT WORKSPACE */}
            <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 pb-36 sm:px-6 sm:py-10 lg:px-8 lg:pb-20">
                {/* Hero Heading Banner */}
                <div className="mb-8 border-b border-[#262626] pb-6">
                    <div className="flex flex-wrap items-center gap-2 font-mono text-xs tracking-wider text-[#737373] uppercase">
                        <span>Pasar Sekolah</span>
                        <span>/</span>
                        <span>Keranjang</span>
                        <span>/</span>
                        <span className="text-[#E34A27]">
                            Konfirmasi Pesanan
                        </span>
                    </div>
                    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="font-heading text-3xl font-black tracking-tight text-[#F5F2EB] sm:text-4xl">
                                Checkout Pesanan
                            </h1>
                            <p className="mt-1 text-xs text-[#A3A3A3] sm:text-sm">
                                Periksa barang, tentukan jadwal pengambilan, dan
                                selesaikan pesanan Anda.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1 text-xs text-[#A3A3A3]">
                            <span className="size-1.5 animate-pulse rounded-full bg-[#E34A27]" />
                            <span className="font-mono text-[11px]">
                                Sistem Loket Resmi
                            </span>
                        </div>
                    </div>
                </div>

                {/* Validation Error Banner */}
                {errorMessage && (
                    <div
                        role="alert"
                        className="mb-8 flex items-start gap-3.5 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-rose-300 shadow-xl backdrop-blur-sm sm:p-5"
                    >
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-rose-400" />
                        <div className="space-y-1">
                            <h2 className="font-heading text-sm font-bold text-rose-200">
                                Perhatian Saat Checkout
                            </h2>
                            <p className="text-xs leading-relaxed text-rose-300/90">
                                {errorMessage}
                            </p>
                            <Link
                                href="/cart"
                                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#E34A27] underline hover:text-[#ff5c38]"
                            >
                                Kembali ke keranjang untuk penyesuaian
                            </Link>
                        </div>
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
                    {/* LEFT / MAIN COLUMN (Col 7) */}
                    <div className="space-y-8 lg:col-span-7">
                        {/* SCENE 01: ORDER ITEMS SNAPSHOT */}
                        <section
                            aria-labelledby="section-items"
                            className="space-y-3.5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="rounded-full border border-[#E34A27]/30 bg-[#E34A27]/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#E34A27]">
                                        01
                                    </span>
                                    <h2
                                        id="section-items"
                                        className="font-heading text-base font-bold text-[#F5F2EB]"
                                    >
                                        Daftar Pesanan ({cart.items.length}{' '}
                                        Barang)
                                    </h2>
                                </div>
                                <Link
                                    href="/cart"
                                    className="font-mono text-xs font-medium text-[#E34A27] transition-colors hover:text-[#ff5c38] hover:underline"
                                >
                                    Ubah Keranjang
                                </Link>
                            </div>

                            <div className="divide-y divide-[#262626] overflow-hidden rounded-3xl border border-[#262626] bg-[#141414] shadow-lg">
                                {cart.items.map((item: CartItemData) => {
                                    const product = item.product;
                                    const isImgFailed = product
                                        ? failedImages[product.id]
                                        : false;

                                    return (
                                        <div
                                            key={item.id}
                                            className="group flex items-center gap-4 p-4 transition-colors hover:bg-[#1A1A1A]/50 sm:p-5"
                                        >
                                            {/* Thumbnail */}
                                            <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#262626] bg-[#1A1A1A] sm:size-18">
                                                {product?.image_path &&
                                                !isImgFailed ? (
                                                    <img
                                                        src={product.image_path}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        onError={() =>
                                                            product &&
                                                            handleImageError(
                                                                product.id,
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <Package className="size-6 text-[#737373]" />
                                                )}
                                            </div>

                                            {/* Item Details */}
                                            <div className="flex flex-1 flex-col justify-between overflow-hidden">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                                        {product?.source_type ===
                                                        'student'
                                                            ? `Titipan ${product.owner?.name || 'Siswa'}`
                                                            : 'Koperasi'}
                                                    </span>
                                                </div>
                                                <h3 className="line-clamp-1 font-heading text-sm font-bold text-[#F5F2EB] group-hover:text-white sm:text-base">
                                                    {product?.name ||
                                                        'Produk KOPDIG'}
                                                </h3>
                                                <p className="mt-1 font-mono text-xs text-[#A3A3A3]">
                                                    {item.quantity} x{' '}
                                                    <span className="text-[#F5F2EB]">
                                                        {formatRupiah(
                                                            product?.selling_price ||
                                                                0,
                                                        )}
                                                    </span>
                                                </p>
                                            </div>

                                            {/* Line Subtotal */}
                                            <div className="text-right">
                                                <span className="block font-mono text-[10px] text-[#737373] uppercase">
                                                    Subtotal
                                                </span>
                                                <span className="font-mono text-sm font-bold text-[#F5F2EB] sm:text-base">
                                                    {formatRupiah(
                                                        item.line_subtotal,
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* SCENE 02: PICKUP SESSION SELECTION */}
                        <section
                            aria-labelledby="section-session"
                            className="space-y-3.5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <span className="rounded-full border border-[#E34A27]/30 bg-[#E34A27]/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#E34A27]">
                                        02
                                    </span>
                                    <h2
                                        id="section-session"
                                        className="font-heading text-base font-bold text-[#F5F2EB]"
                                    >
                                        Jadwal Pengambilan di Loket Koperasi
                                    </h2>
                                </div>
                                <span className="font-mono text-xs text-[#737373]">
                                    Pilih satu sesi
                                </span>
                            </div>

                            {pickupSessions.length === 0 ? (
                                <div className="rounded-3xl border border-amber-500/30 bg-amber-950/20 p-5 text-xs text-amber-300">
                                    <p className="font-semibold">
                                        Tidak ada sesi pengambilan yang aktif
                                        hari ini.
                                    </p>
                                    <p className="mt-1 text-amber-300/80">
                                        Mohon hubungi petugas koperasi untuk
                                        informasi jadwal loket sekolah.
                                    </p>
                                </div>
                            ) : (
                                <div
                                    role="radiogroup"
                                    aria-label="Pilihan Sesi Pengambilan"
                                    className="grid gap-3.5 sm:grid-cols-2"
                                >
                                    {pickupSessions.map((session) => {
                                        const isSelected =
                                            selectedSessionId === session.id;

                                        return (
                                            <button
                                                key={session.id}
                                                type="button"
                                                role="radio"
                                                aria-checked={isSelected}
                                                onClick={() => {
                                                    setSelectedSessionId(
                                                        session.id,
                                                    );
                                                    setErrorMessage(null);
                                                }}
                                                className={`group relative flex flex-col justify-between rounded-3xl border p-4.5 text-left transition-all duration-200 ${
                                                    isSelected
                                                        ? 'border-[#E34A27] bg-[#E34A27]/10 shadow-lg ring-1 shadow-[#E34A27]/10 ring-[#E34A27]'
                                                        : 'border-[#262626] bg-[#141414] hover:border-[#383838] hover:bg-[#1A1A1A]'
                                                }`}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="space-y-1.5">
                                                        <span className="inline-block rounded-md border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#F5F2EB] uppercase">
                                                            {session.name}
                                                        </span>
                                                        <div className="flex items-center gap-1.5 pt-1 font-mono text-xs font-bold text-[#F5F2EB]">
                                                            <Clock className="size-3.5 text-[#E34A27]" />
                                                            <span>
                                                                {session.formatted_time ||
                                                                    `${session.starts_at} - ${session.ends_at} WIB`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Radio Indicator */}
                                                    <div
                                                        className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                                            isSelected
                                                                ? 'border-[#E34A27] bg-[#E34A27] text-white shadow-sm'
                                                                : 'border-[#383838] bg-[#1A1A1A] group-hover:border-[#525252]'
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <CheckCircle2 className="size-3.5" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between border-t border-[#262626] pt-3 text-[11px] text-[#A3A3A3]">
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="size-3 text-[#737373]" />
                                                        <span>
                                                            {session.formatted_date ||
                                                                session.pickup_date}
                                                        </span>
                                                    </div>
                                                    <span className="font-mono text-[10px] text-emerald-400">
                                                        {session.status_label ||
                                                            'Tersedia'}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {/* SCENE 03: PAYMENT METHOD (BAYAR TUNAI DI KOPERASI) */}
                        <section
                            aria-labelledby="section-payment-method"
                            className="space-y-3.5"
                        >
                            <div className="flex items-center gap-2.5">
                                <span className="rounded-full border border-[#E34A27]/30 bg-[#E34A27]/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#E34A27]">
                                    03
                                </span>
                                <h2
                                    id="section-payment-method"
                                    className="font-heading text-base font-bold text-[#F5F2EB]"
                                >
                                    Metode Pembayaran
                                </h2>
                            </div>

                            {/* Authoritative Single Cash Payment Card */}
                            <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg sm:p-6">
                                <div className="flex items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-[#E34A27]/30 bg-[#E34A27]/10 text-[#E34A27] shadow-inner">
                                        <Banknote className="size-6" />
                                    </div>
                                    <div className="flex-1 space-y-1.5">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-heading text-base font-bold text-[#F5F2EB]">
                                                Bayar Tunai di Koperasi
                                            </h3>
                                            <span className="rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                                                Kasir Loket
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                            Bayar tunai saat datang ke loket
                                            koperasi sekolah. Setelah pesanan
                                            dibuat, tunjukkan QR Pembayaran
                                            kepada petugas koperasi dan serahkan
                                            uang tunai sesuai total pesanan.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-[#262626] bg-[#0A0A0A] p-3.5 text-xs text-[#A3A3A3]">
                                    <Info className="mt-0.5 size-4 shrink-0 text-[#E34A27]" />
                                    <p className="leading-relaxed">
                                        Stok fisik dan nomor antrean resmi akan
                                        diverifikasi langsung oleh petugas loket
                                        koperasi saat pembayaran tunai diterima.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT / SUMMARY COLUMN (Col 5) */}
                    <div className="mt-8 lg:col-span-5 lg:mt-0">
                        <div className="sticky top-20 rounded-3xl border border-[#262626] bg-[#141414] p-6 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                                <h2 className="font-heading text-lg font-bold text-[#F5F2EB]">
                                    Ringkasan Pesanan
                                </h2>
                                <span className="font-mono text-xs text-[#737373]">
                                    Otoritatif
                                </span>
                            </div>

                            <div className="mt-5 space-y-3.5 border-b border-[#262626] pb-5 text-xs">
                                <div className="flex justify-between text-[#A3A3A3]">
                                    <span>
                                        Subtotal ({cart.total_quantity} unit)
                                    </span>
                                    <span className="font-mono font-medium text-[#F5F2EB]">
                                        {formatRupiah(cart.subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#A3A3A3]">
                                    <span>Metode Bayar</span>
                                    <span className="font-medium text-[#F5F2EB]">
                                        Bayar Tunai di Koperasi
                                    </span>
                                </div>
                                <div className="flex justify-between text-[#A3A3A3]">
                                    <span>Sesi Pengambilan</span>
                                    <span className="font-medium text-[#F5F2EB]">
                                        {selectedSession
                                            ? selectedSession.name
                                            : 'Belum dipilih'}
                                    </span>
                                </div>
                            </div>

                            {/* Authoritative Total */}
                            <div className="mt-5 flex items-baseline justify-between">
                                <div>
                                    <span className="block text-xs font-medium text-[#A3A3A3]">
                                        Total Akhir
                                    </span>
                                    <span className="font-mono text-[10px] text-[#737373]">
                                        Dibayar tunai di loket
                                    </span>
                                </div>
                                <span className="font-heading text-3xl font-black tracking-tight text-[#E34A27] sm:text-4xl">
                                    {formatRupiah(cart.total)}
                                </span>
                            </div>

                            {/* Primary Confirmation CTA (Matches Landing Page Buttons) */}
                            <div className="mt-6">
                                <button
                                    type="button"
                                    disabled={
                                        isSubmitting ||
                                        !selectedSessionId ||
                                        pickupSessions.length === 0
                                    }
                                    onClick={handleSubmitOrder}
                                    className={`group flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 font-heading text-xs font-bold text-white shadow-lg transition-all select-none active:scale-[0.98] ${
                                        isSubmitting ||
                                        !selectedSessionId ||
                                        pickupSessions.length === 0
                                            ? 'cursor-not-allowed border border-[#262626] bg-[#1A1A1A] text-[#737373] opacity-60 shadow-none'
                                            : 'bg-[#E34A27] shadow-[#E34A27]/25 hover:bg-[#ff5c38] hover:shadow-[#E34A27]/40'
                                    }`}
                                    aria-label="Konfirmasi pesanan sekarang"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            <span>Memproses Pesanan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Konfirmasi Pesanan</span>
                                            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Trust & Verification Note */}
                            <div className="mt-4 flex items-center justify-center gap-2 text-center font-mono text-[11px] text-[#737373]">
                                <ShieldCheck className="size-3.5 text-emerald-400" />
                                <span>
                                    Verifikasi aman di loket koperasi sekolah
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* 3. MOBILE STICKY BOTTOM ACTION BAR */}
            <div
                aria-label="Aksi Konfirmasi Pesanan Mobile"
                className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#262626] bg-[#0A0A0A]/95 px-4 py-3.5 shadow-2xl backdrop-blur-md lg:hidden"
            >
                <div className="mx-auto flex max-w-md items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="font-mono text-[10px] text-[#737373] uppercase">
                            Total Bayar Tunai
                        </span>
                        <span className="font-heading text-lg font-black text-[#E34A27]">
                            {formatRupiah(cart.total)}
                        </span>
                    </div>

                    <button
                        type="button"
                        disabled={
                            isSubmitting ||
                            !selectedSessionId ||
                            pickupSessions.length === 0
                        }
                        onClick={handleSubmitOrder}
                        className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-heading text-xs font-bold text-white shadow-md transition-all select-none ${
                            isSubmitting ||
                            !selectedSessionId ||
                            pickupSessions.length === 0
                                ? 'cursor-not-allowed border border-[#262626] bg-[#1A1A1A] text-[#737373] opacity-60'
                                : 'cursor-pointer bg-[#E34A27] shadow-[#E34A27]/25 hover:bg-[#ff5c38] active:scale-98'
                        }`}
                        aria-label="Konfirmasi pesanan sekarang"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <>
                                <span>Konfirmasi Pesanan</span>
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
