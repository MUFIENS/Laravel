import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Calendar,
    AlertCircle,
    ShoppingBag,
    Package,
    ShieldCheck,
    ArrowRight,
    Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { ProductSourceBadge } from '@/components/commerce/ProductSourceBadge';
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

    const handleSubmitOrder = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedSessionId) {
            setErrorMessage('Silakan pilih sesi pengambilan terlebih dahulu.');
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
                        'Gagal memproses pesanan. Silakan periksa keranjang Anda.';
                    setErrorMessage(String(msg));
                },
                onFinish: () => {
                    setIsSubmitting(false);
                },
            },
        );
    };

    return (
        <AppShell hideHeader hideBottomNav>
            <Head title="Konfirmasi Checkout" />

            <PageContainer className="pb-36 sm:pb-32">
                {/* Header Navigation */}
                <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => safeNavigateBack('/cart')}
                            className="hover:bg-surface-subtle flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-ink shadow-2xs transition-colors active:scale-95"
                            aria-label="Kembali ke keranjang belanja"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <div>
                            <h1 className="font-heading text-lg font-bold tracking-tight text-ink sm:text-xl">
                                Checkout Pesanan
                            </h1>
                            <p className="text-xs text-muted">
                                Konfirmasi produk dan tentukan sesi pengambilan
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[11px] font-semibold text-primary">
                        <ShoppingBag className="size-3.5" />
                        <span>{cart.total_quantity} Produk</span>
                    </div>
                </div>

                {/* Validation Error Banner */}
                {errorMessage && (
                    <div
                        role="alert"
                        className="border-status-danger/30 text-status-danger mb-5 flex animate-in items-start gap-3 rounded-2xl border bg-[#FFFAFA] p-4 text-xs shadow-xs fade-in"
                    >
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold">Perhatian</p>
                            <p className="text-status-danger/90 mt-0.5 leading-relaxed">
                                {errorMessage}
                            </p>
                            <Link
                                href="/cart"
                                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold underline hover:text-danger"
                            >
                                Kembali ke keranjang untuk menyesuaikan
                            </Link>
                        </div>
                    </div>
                )}

                <div className="space-y-6">
                    {/* SECTION 1: ORDER SUMMARY (PRODUCT LIST) */}
                    <section aria-labelledby="section-items">
                        <div className="mb-3 flex items-center justify-between">
                            <h2
                                id="section-items"
                                className="font-heading text-sm font-bold text-ink sm:text-base"
                            >
                                1. Daftar Pesanan
                            </h2>
                            <Link
                                href="/cart"
                                className="text-xs font-semibold text-primary hover:underline"
                            >
                                Ubah Keranjang
                            </Link>
                        </div>

                        <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
                            {cart.items.map((item: CartItemData) => {
                                const product = item.product;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3.5 p-3.5 sm:p-4"
                                    >
                                        {/* Product Thumbnail */}
                                        <div className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/80 bg-[#FAF9F5] p-1 sm:size-18">
                                            {product?.image_path ? (
                                                <img
                                                    src={product.image_path}
                                                    alt={`Foto ${product.name}`}
                                                    className="h-full w-full object-contain"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <Package className="size-6 stroke-[1.25] text-primary/30" />
                                            )}
                                        </div>

                                        {/* Details */}
                                        <div className="flex flex-1 flex-col justify-between overflow-hidden">
                                            <div>
                                                {product && (
                                                    <div className="mb-1 flex items-center">
                                                        <ProductSourceBadge
                                                            source={
                                                                product.source_type
                                                            }
                                                            ownerName={
                                                                product.owner
                                                                    ?.name
                                                            }
                                                        />
                                                    </div>
                                                )}
                                                <h3 className="line-clamp-1 font-heading text-xs font-bold text-ink sm:text-sm">
                                                    {product?.name ||
                                                        'Produk KOPDIG'}
                                                </h3>
                                                <p className="mt-0.5 text-[11px] text-muted">
                                                    {item.quantity} x{' '}
                                                    <PriceDisplay
                                                        amount={
                                                            product?.selling_price ||
                                                            0
                                                        }
                                                        size="sm"
                                                    />
                                                </p>
                                            </div>
                                        </div>

                                        {/* Line Subtotal */}
                                        <div className="text-right">
                                            <span className="block text-[10px] text-muted">
                                                Subtotal
                                            </span>
                                            <PriceDisplay
                                                amount={item.line_subtotal}
                                                size="sm"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>

                    {/* SECTION 2: PICKUP SESSION SELECTION */}
                    <section aria-labelledby="section-session">
                        <div className="mb-2">
                            <h2
                                id="section-session"
                                className="font-heading text-sm font-bold text-ink sm:text-base"
                            >
                                2. Pilih Sesi Pengambilan di Loket KOPDIG
                            </h2>
                            <p className="text-xs text-muted">
                                Tentukan waktu pengambilan saat jam istirahat
                                sekolah
                            </p>
                        </div>

                        {pickupSessions.length === 0 ? (
                            <div className="border-status-warning/40 rounded-2xl border bg-[#FFFDF5] p-4 text-xs text-ink">
                                <p className="text-status-warning font-semibold">
                                    Tidak ada sesi pengambilan yang tersedia
                                    hari ini.
                                </p>
                                <p className="mt-1 text-muted">
                                    Mohon hubungi pengurus koperasi sekolah
                                    untuk informasi jam layanan loket.
                                </p>
                            </div>
                        ) : (
                            <div
                                role="radiogroup"
                                aria-label="Pilihan Sesi Pengambilan"
                                className="grid gap-3 sm:grid-cols-2"
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
                                            className={`relative flex flex-col justify-between rounded-2xl border p-4 text-left transition-all ${
                                                isSelected
                                                    ? 'border-primary bg-primary/5 shadow-xs ring-1 ring-primary'
                                                    : 'hover:bg-surface-subtle border-border bg-surface hover:border-primary/40'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="space-y-1">
                                                    <span className="inline-block rounded-md border border-primary/20 bg-white px-2 py-0.5 text-[10px] font-bold tracking-wide text-primary uppercase shadow-2xs">
                                                        {session.name}
                                                    </span>
                                                    <div className="flex items-center gap-1.5 pt-1 text-xs font-bold text-ink">
                                                        <Clock className="size-3.5 shrink-0 text-primary" />
                                                        <span>
                                                            {session.formatted_time ||
                                                                `${session.starts_at} - ${session.ends_at} WIB`}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Selection Indicator */}
                                                <div
                                                    className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-all ${
                                                        isSelected
                                                            ? 'border-primary bg-primary text-white'
                                                            : 'border-border bg-surface'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <CheckCircle2 className="size-3.5" />
                                                    )}
                                                </div>
                                            </div>

                                            <div className="mt-3 flex items-center justify-between border-t border-border/50 pt-2.5 text-[11px] text-muted">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="size-3 text-muted" />
                                                    <span>
                                                        {session.formatted_date ||
                                                            session.pickup_date}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-emerald-700">
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

                    {/* SECTION 3: COMMERCIAL & FINANCIAL SUMMARY */}
                    <section aria-labelledby="section-payment">
                        <h2
                            id="section-payment"
                            className="mb-3 font-heading text-sm font-bold text-ink sm:text-base"
                        >
                            3. Rincian Pembayaran
                        </h2>

                        <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs sm:p-5">
                            <div className="space-y-2.5 text-xs">
                                <div className="flex justify-between text-muted">
                                    <span>
                                        Subtotal Produk ({cart.total_quantity}{' '}
                                        barang)
                                    </span>
                                    <span className="font-semibold text-ink">
                                        <PriceDisplay
                                            amount={cart.subtotal}
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
                                            amount={cart.total}
                                            size="md"
                                        />
                                    </span>
                                </div>
                            </div>

                            {/* Trust & Guarantee Banner */}
                            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border/60 bg-[#FAF9F5] p-3 text-[11px] text-muted">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                                <p className="leading-relaxed">
                                    Transaksi Anda aman. Pesanan yang berhasil
                                    dibuat akan berstatus{' '}
                                    <span className="font-semibold text-ink">
                                        Menunggu Pembayaran
                                    </span>
                                    . Pengambilan dilakukan di loket KOPDIG
                                    sesuai sesi yang dipilih.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </PageContainer>

            {/* STICKY BOTTOM CHECKOUT ACTION BAR */}
            <div
                aria-label="Aksi Konfirmasi Pesanan"
                className="fixed right-0 bottom-0 left-0 z-40 border-t border-border/80 bg-surface/95 px-4 py-3.5 shadow-lg backdrop-blur-md sm:px-6"
            >
                <div className="mx-auto flex max-w-md items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-muted">
                            Total Pembayaran:
                        </span>
                        <PriceDisplay amount={cart.total} size="lg" />
                    </div>

                    <button
                        type="button"
                        disabled={
                            isSubmitting ||
                            !selectedSessionId ||
                            pickupSessions.length === 0
                        }
                        onClick={handleSubmitOrder}
                        className={`flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold shadow-xs transition-all select-none ${
                            isSubmitting ||
                            !selectedSessionId ||
                            pickupSessions.length === 0
                                ? 'cursor-not-allowed border border-border bg-[#F5F4EE] text-muted opacity-75'
                                : 'cursor-pointer bg-primary text-white hover:bg-primary-hover active:scale-98'
                        }`}
                        aria-label="Konfirmasi dan buat pesanan sekarang"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="size-4 animate-spin" />
                                <span>Membuat Pesanan...</span>
                            </>
                        ) : (
                            <>
                                <span>Buat Pesanan</span>
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </AppShell>
    );
}
