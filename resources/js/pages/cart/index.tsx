import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ShoppingBag,
    Trash2,
    Plus,
    Minus,
    AlertTriangle,
    Package,
    Clock,
    ShieldCheck,
    Store,
    ArrowRight,
    Loader2,
    CheckCircle2,
    Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { safeNavigateBack } from '@/lib/navigation';
import type { CartData, CartItemData } from '@/types/cart';
import type { Auth } from '@/types';

interface CartPageProps {
    auth: Auth;
    cart: CartData;
    [key: string]: unknown;
}

export const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export default function CartIndex() {
    const { cart } = usePage<CartPageProps>().props;

    const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
    const [removingItemId, setRemovingItemId] = useState<number | null>(null);
    const [isNavigatingCheckout, setIsNavigatingCheckout] = useState(false);
    const [failedImages, setFailedImages] = useState<Record<number, boolean>>(
        {},
    );

    const handleImageError = (productId: number) => {
        setFailedImages((prev) => ({ ...prev, [productId]: true }));
    };

    const handleUpdateQuantity = (item: CartItemData, newQuantity: number) => {
        if (newQuantity < 1 || newQuantity > item.max_available_quantity)
            return;

        setUpdatingItemId(item.id);
        router.patch(
            `/cart/items/${item.id}`,
            { quantity: newQuantity },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setUpdatingItemId(null);
                    toast.success('Jumlah barang berhasil diperbarui');
                },
                onError: (errors) => {
                    setUpdatingItemId(null);
                    const errorMsg =
                        errors.quantity ||
                        errors.general ||
                        'Gagal memperbarui jumlah barang.';
                    toast.error(String(errorMsg));
                },
            },
        );
    };

    const handleRemoveItem = (item: CartItemData) => {
        setRemovingItemId(item.id);
        router.delete(`/cart/items/${item.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setRemovingItemId(null);
                toast.info(
                    `"${item.product?.name || 'Barang'}" dihapus dari keranjang`,
                );
            },
            onError: (errors) => {
                setRemovingItemId(null);
                const errorMsg =
                    errors.general || 'Gagal menghapus barang dari keranjang.';
                toast.error(String(errorMsg));
            },
        });
    };

    const handleCheckoutClick = () => {
        if (!cart.can_checkout) {
            toast.error(
                'Ada barang dengan stok tidak mencukupi atau tidak aktif. Harap sesuaikan sebelum checkout.',
            );
            return;
        }

        setIsNavigatingCheckout(true);
        router.visit('/checkout', {
            onError: () => {
                setIsNavigatingCheckout(false);
                toast.error(
                    'Gagal melanjutkan ke halaman checkout. Silakan coba lagi.',
                );
            },
        });
    };

    const hasItems = cart.items && cart.items.length > 0;

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title="Keranjang Belanja — KOPDIG" />

            {/* 1. TOP TRANSACTIONAL HEADER (Consistent with KOPDIG Visual System) */}
            <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
                    {/* Left: Back Navigation */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke halaman sebelumnya"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Kembali</span>
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
                                Pasar Sekolah
                            </span>
                        </div>
                    </Link>

                    {/* Right: Cart Status & Quick Link to Orders */}
                    <div className="flex items-center gap-3">
                        <Link
                            href="/orders"
                            className="hidden items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB] md:inline-flex"
                        >
                            <Package className="size-3.5" />
                            <span>Pesanan Saya</span>
                        </Link>

                        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E34A27]/30 bg-[#E34A27]/10 px-3 py-1 font-mono text-xs font-semibold text-[#E34A27]">
                            <ShoppingBag className="size-3.5" />
                            <span>{cart.total_quantity} Unit</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* 2. MAIN CART CONTENT CONTAINER */}
            <main className="mx-auto max-w-6xl px-4 py-6 pb-36 sm:px-6 sm:py-8 lg:px-8 lg:pb-16">
                {/* Page Heading & Context */}
                <div className="mb-6 flex flex-col justify-between gap-2 border-b border-[#262626] pb-5 sm:flex-row sm:items-end">
                    <div>
                        <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-[#737373] uppercase">
                            <span>Katalog Warga Sekolah</span>
                            <span>/</span>
                            <span className="text-[#A3A3A3]">Transaksi</span>
                        </div>
                        <h1 className="mt-1 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                            Keranjang
                        </h1>
                        <p className="mt-1 text-xs text-[#A3A3A3] sm:text-sm">
                            Siap dilanjutkan ke checkout dan pengambilan di
                            loket koperasi.
                        </p>
                    </div>

                    {hasItems && (
                        <div className="flex items-center gap-2 font-mono text-xs">
                            {cart.can_checkout ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 font-semibold text-emerald-400">
                                    <CheckCircle2 className="size-3.5" />
                                    <span>Semua barang siap dipesan</span>
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/40 px-3 py-1 font-semibold text-amber-300">
                                    <AlertTriangle className="size-3.5" />
                                    <span>Penyesuaian stok diperlukan</span>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Unavailable Items Warning Banner */}
                {cart.has_unavailable_items && hasItems && (
                    <div
                        role="alert"
                        className="mb-6 flex items-start gap-3.5 rounded-2xl border border-rose-500/40 bg-rose-950/30 p-4 text-rose-300 shadow-lg sm:p-5"
                    >
                        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-400" />
                        <div className="space-y-1">
                            <h2 className="font-heading text-sm font-bold text-rose-200">
                                Penyesuaian Pesanan Diperlukan
                            </h2>
                            <p className="text-xs leading-relaxed text-rose-300/90">
                                Beberapa produk di keranjangmu mengalami
                                perubahan stok atau ketersediaan di katalog
                                koperasi sekolah. Mohon kurangi jumlah pesanan
                                atau hapus barang bermasalah agar dapat
                                melanjutkan pemesanan.
                            </p>
                        </div>
                    </div>
                )}

                {/* CONTENT AREA: Empty State vs Two-Column Composition */}
                {!hasItems ? (
                    /* EMPTY CART STATE (Intentional, Calm, Premium, Zero Emoji) */
                    <div className="mx-auto my-8 max-w-lg rounded-3xl border border-[#262626] bg-[#141414] p-8 text-center shadow-2xl sm:p-12">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-[#262626] bg-[#1A1A1A] text-[#737373] shadow-inner">
                            <ShoppingBag className="size-9 stroke-[1.5] text-[#737373]" />
                        </div>

                        <h2 className="mt-6 font-heading text-xl font-bold text-[#F5F2EB] sm:text-2xl">
                            Keranjangmu Masih Kosong
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                            Temukan jajanan segar, minuman dingin, ATK, seragam
                            sekolah, dan karya titipan siswa untuk mulai
                            berbelanja di KOPDIG.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/explore"
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#E34A27] px-6 py-3 text-xs font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#d03d1b] active:scale-98 sm:w-auto sm:text-sm"
                            >
                                <span>Jelajahi Produk Pasar Sekolah</span>
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* REFINED TWO-COLUMN COMPOSITION (Desktop: Left items, Right sticky summary) */
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
                        {/* LEFT COLUMN: Cart Items List */}
                        <section
                            aria-label="Daftar Barang Belanja"
                            className="space-y-4 lg:col-span-7 xl:col-span-8"
                        >
                            <div className="flex items-center justify-between px-1 text-xs text-[#737373]">
                                <span>
                                    Daftar Barang ({cart.items.length} jenis)
                                </span>
                                <span>Total unit: {cart.total_quantity}</span>
                            </div>

                            <div className="space-y-3.5">
                                {cart.items.map((item) => {
                                    const isUpdating =
                                        updatingItemId === item.id;
                                    const isRemoving =
                                        removingItemId === item.id;
                                    const product = item.product;
                                    const imageFailed = product
                                        ? failedImages[product.id]
                                        : false;

                                    return (
                                        <article
                                            key={item.id}
                                            className={`group relative overflow-hidden rounded-2xl border bg-[#141414] p-4 transition-all sm:p-5 ${
                                                !item.is_available
                                                    ? 'border-rose-500/40 bg-rose-950/10'
                                                    : 'border-[#262626] hover:border-[#383838]'
                                            } ${isRemoving ? 'pointer-events-none scale-[0.99] opacity-30' : ''}`}
                                        >
                                            <div className="flex gap-4">
                                                {/* Product Thumbnail Frame */}
                                                <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-[#262626] bg-[#1A1A1A] sm:size-24">
                                                    {product?.image_path &&
                                                    !imageFailed ? (
                                                        <img
                                                            src={
                                                                product.image_path
                                                            }
                                                            alt={product.name}
                                                            onError={() =>
                                                                handleImageError(
                                                                    product.id,
                                                                )
                                                            }
                                                            className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                                                                !item.is_available
                                                                    ? 'opacity-60 grayscale'
                                                                    : ''
                                                            }`}
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[#737373]">
                                                            <Package className="size-8 stroke-[1.25]" />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Product Information & Actions */}
                                                <div className="flex flex-1 flex-col justify-between">
                                                    <div>
                                                        {/* Top Row: Category, Provenance Badge & Remove Action */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex flex-wrap items-center gap-1.5">
                                                                {product?.category && (
                                                                    <span className="rounded-full border border-[#262626] bg-[#1A1A1A] px-2 py-0.5 font-mono text-[10px] text-[#A3A3A3]">
                                                                        {
                                                                            product
                                                                                .category
                                                                                .name
                                                                        }
                                                                    </span>
                                                                )}

                                                                {product?.source_type ===
                                                                'student' ? (
                                                                    <span
                                                                        className="inline-flex max-w-[180px] items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 font-mono text-[10px] text-amber-300 sm:max-w-[220px]"
                                                                        title={`Titipan: ${product.owner?.name || 'Siswa'}`}
                                                                    >
                                                                        <span className="truncate">
                                                                            Titipan:{' '}
                                                                            {product
                                                                                .owner
                                                                                ?.name ||
                                                                                'Siswa'}
                                                                        </span>
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] text-emerald-400">
                                                                        <Store className="size-2.5" />
                                                                        <span>
                                                                            Resmi
                                                                            Koperasi
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* Remove Button */}
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    isRemoving ||
                                                                    isUpdating
                                                                }
                                                                onClick={() =>
                                                                    handleRemoveItem(
                                                                        item,
                                                                    )
                                                                }
                                                                className="rounded-lg p-1.5 text-[#737373] transition-colors hover:bg-rose-950/40 hover:text-rose-400 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                                                aria-label={`Hapus ${product?.name || 'barang'} dari keranjang`}
                                                            >
                                                                {isRemoving ? (
                                                                    <Loader2 className="size-4 animate-spin text-rose-400" />
                                                                ) : (
                                                                    <Trash2 className="size-4" />
                                                                )}
                                                            </button>
                                                        </div>

                                                        {/* Product Name */}
                                                        <h3 className="mt-1.5 font-heading text-sm font-bold text-[#F5F2EB] sm:text-base">
                                                            {product?.slug ? (
                                                                <Link
                                                                    href={`/products/${product.slug}`}
                                                                    className="line-clamp-1 transition-colors hover:text-[#E34A27] sm:line-clamp-2"
                                                                >
                                                                    {
                                                                        product.name
                                                                    }
                                                                </Link>
                                                            ) : (
                                                                product?.name ||
                                                                'Produk'
                                                            )}
                                                        </h3>

                                                        {/* Unit Price */}
                                                        <div className="mt-1 text-xs text-[#A3A3A3]">
                                                            Harga satuan:{' '}
                                                            <span className="font-mono font-semibold text-[#F5F2EB]">
                                                                {formatRupiah(
                                                                    product?.selling_price ||
                                                                        0,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Item Specific Availability Warning Badges */}
                                                    {item.is_inactive ? (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                                                            <AlertTriangle className="size-3.5 shrink-0" />
                                                            <span>
                                                                Produk ini sudah
                                                                tidak aktif di
                                                                katalog
                                                                koperasi.
                                                            </span>
                                                        </div>
                                                    ) : item.is_out_of_stock ? (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-950/30 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                                                            <AlertTriangle className="size-3.5 shrink-0" />
                                                            <span>
                                                                Stok produk ini
                                                                sedang habis
                                                                terjual.
                                                            </span>
                                                        </div>
                                                    ) : item.has_insufficient_stock ? (
                                                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                                                            <AlertTriangle className="size-3.5 shrink-0" />
                                                            <span>
                                                                Stok tersisa
                                                                hanya{' '}
                                                                {
                                                                    item.max_available_quantity
                                                                }{' '}
                                                                unit. Mohon
                                                                kurangi jumlah.
                                                            </span>
                                                        </div>
                                                    ) : null}

                                                    {/* Bottom Row: Tactile Quantity Stepper & Line Subtotal */}
                                                    <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-[#262626] pt-3">
                                                        {/* Stepper Controls */}
                                                        <div className="inline-flex items-center rounded-full border border-[#2A2A2A] bg-[#1A1A1A] p-0.5">
                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    item.quantity <=
                                                                        1 ||
                                                                    isUpdating ||
                                                                    isRemoving
                                                                }
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        item,
                                                                        item.quantity -
                                                                            1,
                                                                    )
                                                                }
                                                                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-[#A3A3A3] transition-colors hover:bg-[#262626] hover:text-[#F5F2EB] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:size-7.5"
                                                                aria-label={`Kurangi jumlah ${product?.name || 'barang'}`}
                                                            >
                                                                <Minus className="size-3" />
                                                            </button>

                                                            <span className="flex min-w-[34px] items-center justify-center font-heading text-xs font-bold text-[#F5F2EB]">
                                                                {isUpdating ? (
                                                                    <Loader2 className="size-3 animate-spin text-[#E34A27]" />
                                                                ) : (
                                                                    item.quantity
                                                                )}
                                                            </span>

                                                            <button
                                                                type="button"
                                                                disabled={
                                                                    item.quantity >=
                                                                        item.max_available_quantity ||
                                                                    item.is_inactive ||
                                                                    item.is_out_of_stock ||
                                                                    isUpdating ||
                                                                    isRemoving
                                                                }
                                                                onClick={() =>
                                                                    handleUpdateQuantity(
                                                                        item,
                                                                        item.quantity +
                                                                            1,
                                                                    )
                                                                }
                                                                className="flex size-7 cursor-pointer items-center justify-center rounded-full text-[#A3A3A3] transition-colors hover:bg-[#262626] hover:text-[#F5F2EB] active:scale-95 disabled:cursor-not-allowed disabled:opacity-30 sm:size-7.5"
                                                                aria-label={`Tambah jumlah ${product?.name || 'barang'}`}
                                                            >
                                                                <Plus className="size-3" />
                                                            </button>
                                                        </div>

                                                        {/* Line Subtotal */}
                                                        <div className="text-right">
                                                            <span className="block font-mono text-[10px] text-[#737373] uppercase">
                                                                Subtotal
                                                            </span>
                                                            <span className="font-heading text-sm font-bold text-[#E34A27] sm:text-base">
                                                                {formatRupiah(
                                                                    item.line_subtotal,
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>

                            {/* Cooperative Pickup Guarantee Notice */}
                            <div className="rounded-2xl border border-[#262626] bg-[#111111] p-4.5 text-xs text-[#A3A3A3] shadow-inner">
                                <div className="flex items-center gap-2 font-heading font-bold text-[#F5F2EB]">
                                    <ShieldCheck className="size-4 text-[#E34A27]" />
                                    <span>
                                        Informasi Pengambilan di Loket KOPDIG
                                    </span>
                                </div>
                                <p className="mt-1.5 text-xs leading-relaxed text-[#8E8E8E]">
                                    Pesanan yang telah dibayar dapat langsung
                                    diambil di Loket Koperasi Sekolah pada jam
                                    istirahat. Cukup tunjukkan kode QR transaksi
                                    dari ponsel tanpa perlu mengantre pembayaran
                                    tunai.
                                </p>
                                <div className="mt-2.5 flex items-center gap-1.5 font-mono text-[11px] text-[#A3A3A3]">
                                    <Clock className="size-3 text-[#E34A27]" />
                                    <span>
                                        Waktu operasional loket: 07.00 – 15.30
                                        WIB
                                    </span>
                                </div>
                            </div>
                        </section>

                        {/* RIGHT COLUMN: Sticky Order Summary (Desktop) */}
                        <aside
                            aria-label="Ringkasan Pesanan"
                            className="lg:col-span-5 xl:col-span-4"
                        >
                            <div className="sticky top-24 space-y-4 rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-xl sm:p-6">
                                <div className="flex items-center justify-between border-b border-[#262626] pb-4">
                                    <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                        Ringkasan Pesanan
                                    </h2>
                                    <span className="rounded-full border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 font-mono text-xs text-[#A3A3A3]">
                                        {cart.total_quantity} item
                                    </span>
                                </div>

                                {/* Authoritative Financial Breakdown */}
                                <div className="space-y-3 text-xs">
                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                        <span>Total Unit Barang</span>
                                        <span className="font-mono font-medium text-[#F5F2EB]">
                                            {cart.total_quantity} unit
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                        <span>Subtotal Produk</span>
                                        <span className="font-mono font-medium text-[#F5F2EB]">
                                            {formatRupiah(cart.subtotal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                        <span>Biaya Layanan Loket</span>
                                        <span className="font-mono font-medium text-emerald-400">
                                            Gratis
                                        </span>
                                    </div>
                                </div>

                                <div className="border-t border-[#262626] pt-4">
                                    <div className="flex items-baseline justify-between">
                                        <div>
                                            <span className="text-xs font-medium text-[#A3A3A3]">
                                                Total Pembayaran
                                            </span>
                                            <p className="font-mono text-[10px] text-[#737373]">
                                                Sudah termasuk semua item
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-heading text-2xl font-black text-[#E34A27]">
                                                {formatRupiah(cart.subtotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Primary Checkout Call to Action */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        disabled={
                                            !cart.can_checkout ||
                                            isNavigatingCheckout
                                        }
                                        onClick={handleCheckoutClick}
                                        className={`group relative flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 font-heading text-sm font-bold text-white transition-all select-none ${
                                            !cart.can_checkout
                                                ? 'cursor-not-allowed border border-[#333333] bg-[#1E1E1E] text-[#737373] opacity-60'
                                                : 'cursor-pointer bg-[#E34A27] shadow-lg shadow-[#E34A27]/25 hover:bg-[#d03d1b] hover:shadow-xl hover:shadow-[#E34A27]/30 active:scale-[0.98]'
                                        }`}
                                        aria-label={
                                            !cart.can_checkout
                                                ? 'Perbaiki barang tidak tersedia sebelum checkout'
                                                : `Lanjut ke pembayaran seharga ${formatRupiah(cart.subtotal)}`
                                        }
                                    >
                                        {isNavigatingCheckout ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>
                                                    Menyiapkan Checkout...
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <span>Lanjut ke Checkout</span>
                                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>

                                    {!cart.can_checkout && (
                                        <p className="mt-2 text-center text-[11px] font-medium text-rose-400">
                                            Perbaiki barang yang stoknya
                                            bermasalah sebelum melanjutkan.
                                        </p>
                                    )}
                                </div>

                                {/* Trust Assurance Badge */}
                                <div className="flex items-center justify-center gap-2 border-t border-[#202020] pt-4 text-[11px] text-[#737373]">
                                    <Sparkles className="size-3.5 text-[#E34A27]" />
                                    <span>
                                        Ruang Niaga Resmi Koperasi Siswa KOPDIG
                                    </span>
                                </div>
                            </div>
                        </aside>
                    </div>
                )}
            </main>

            {/* 3. MOBILE STICKY BOTTOM CHECKOUT BAR (Visible when items exist on < lg screens) */}
            {hasItems && (
                <div
                    aria-label="Ringkasan dan Tombol Checkout Bergerak"
                    className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#262626] bg-[#141414]/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-md sm:px-6 lg:hidden"
                >
                    <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                        <div className="flex flex-col">
                            <span className="font-mono text-[10px] text-[#737373]">
                                Total ({cart.total_quantity} item):
                            </span>
                            <span className="font-heading text-lg font-black text-[#E34A27]">
                                {formatRupiah(cart.subtotal)}
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={
                                !cart.can_checkout || isNavigatingCheckout
                            }
                            onClick={handleCheckoutClick}
                            className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-full px-5 py-2.5 font-heading text-xs font-bold text-white transition-all select-none sm:text-sm ${
                                !cart.can_checkout
                                    ? 'cursor-not-allowed border border-[#333333] bg-[#1E1E1E] text-[#737373] opacity-60'
                                    : 'cursor-pointer bg-[#E34A27] shadow-lg shadow-[#E34A27]/25 hover:bg-[#d03d1b] active:scale-95'
                            }`}
                            aria-label={
                                !cart.can_checkout
                                    ? 'Perbaiki barang tidak tersedia sebelum checkout'
                                    : `Lanjut ke checkout seharga ${formatRupiah(cart.subtotal)}`
                            }
                        >
                            {isNavigatingCheckout ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : (
                                <>
                                    <span>Lanjut ke Checkout</span>
                                    <ArrowRight className="size-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

CartIndex.layout = (page: React.ReactNode) => page;
