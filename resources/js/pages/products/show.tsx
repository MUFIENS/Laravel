import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    Minus,
    Package,
    Plus,
    Share2,
    ShieldCheck,
    ShoppingBag,
    Tag,
    Ban,
    AlertTriangle,
    Loader2,
    Store,
    UserCheck,
    ArrowRight,
    Check,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { MarketplaceProduct } from '@/types/marketplace';
import type { Auth } from '@/types';

interface ProductDetailPageProps {
    auth: Auth;
    product: MarketplaceProduct;
    relatedProducts: MarketplaceProduct[];
    cartCount?: number;
    [key: string]: unknown;
}

export default function ProductDetail() {
    const {
        auth,
        product,
        relatedProducts,
        cartCount: initialCartCount,
    } = usePage<ProductDetailPageProps>().props;

    const [quantity, setQuantity] = useState(1);
    const [imageError, setImageError] = useState(false);
    const [failedRelatedImages, setFailedRelatedImages] = useState<
        Record<number, boolean>
    >({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [addingRelatedId, setAddingRelatedId] = useState<number | null>(null);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [copiedShare, setCopiedShare] = useState(false);

    const user = auth?.user;
    const cartCount = initialCartCount ?? 0;

    const isOutOfStock =
        product.stock <= 0 || product.stock_status === 'out_of_stock';
    const isLowStock =
        product.stock > 0 &&
        product.stock <= 5 &&
        product.stock_status === 'low_stock';
    const maxQuantity = Math.max(1, Math.min(product.stock, 10));

    const handleDecreaseQuantity = () => {
        setQuantity((prev) => Math.max(1, prev - 1));
    };

    const handleIncreaseQuantity = () => {
        setQuantity((prev) => Math.min(maxQuantity, prev + 1));
    };

    const handleAddToCartClick = () => {
        if (isOutOfStock || isSubmitting) return;

        if (!user) {
            router.visit('/login');
            return;
        }

        if (user.role !== 'student') {
            toast.error(
                'Akun pengurus koperasi tidak dapat berbelanja di keranjang siswa.',
            );
            return;
        }

        setIsSubmitting(true);
        router.post(
            '/cart/items',
            {
                product_id: product.id,
                quantity: quantity,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    toast.success(
                        `${quantity}x "${product.name}" berhasil masuk ke keranjang!`,
                        {
                            description:
                                'Buka keranjang untuk melanjutkan pemesanan.',
                        },
                    );
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMsg =
                        errors.quantity ||
                        errors.product_id ||
                        errors.general ||
                        'Gagal menambahkan produk ke keranjang.';
                    toast.error(String(errorMsg));
                },
            },
        );
    };

    const handleAddRelatedToCart = (
        e: React.MouseEvent,
        relProduct: MarketplaceProduct,
    ) => {
        e.preventDefault();
        e.stopPropagation();

        if (relProduct.stock <= 0 || addingRelatedId === relProduct.id) return;

        if (!user) {
            router.visit('/login');
            return;
        }

        if (user.role !== 'student') {
            toast.error(
                'Akun pengurus koperasi tidak dapat berbelanja di keranjang siswa.',
            );
            return;
        }

        setAddingRelatedId(relProduct.id);
        router.post(
            '/cart/items',
            {
                product_id: relProduct.id,
                quantity: 1,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setAddingRelatedId(null);
                    toast.success(
                        `"${relProduct.name}" berhasil ditambahkan ke keranjang!`,
                    );
                },
                onError: (errors) => {
                    setAddingRelatedId(null);
                    const errorMsg =
                        errors.quantity ||
                        errors.product_id ||
                        errors.general ||
                        'Gagal menambahkan produk ke keranjang.';
                    toast.error(String(errorMsg));
                },
            },
        );
    };

    const handleShare = async () => {
        const shareData = {
            title: `${product.name} — KOPDIG`,
            text: `Beli ${product.name} seharga ${formatRupiah(product.selling_price)} di Pasar Sekolah KOPDIG.`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return;
            } catch {
                // User dismissed native share sheet, fallback to clipboard
            }
        }

        if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setCopiedShare(true);
                toast.success('Tautan produk berhasil disalin!');
                setTimeout(() => setCopiedShare(false), 2500);
            } catch {
                toast.error('Gagal menyalin tautan produk.');
            }
        }
    };

    const subtotal = product.selling_price * quantity;

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title={`${product.name} — KOPDIG`} />

            {/* ATMOSPHERIC BACKGROUND (Landing Page Editorial System) */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.14),transparent)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#26262612_1px,transparent_1px),linear-gradient(to_bottom,#26262612_1px,transparent_1px)] bg-[size:40px_40px]"
            />

            {/* 1. TOP TRANSACTIONAL HEADER (Consistent with KOPDIG Ecosystem) */}
            <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6 lg:px-8">
                    {/* Left: Back Navigation Button */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke pasar sekolah"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="hidden sm:inline">Pasar Sekolah</span>
                        <span className="sm:hidden">Kembali</span>
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
                                Detail Produk
                            </span>
                        </div>
                    </Link>

                    {/* Right: Cart & Share Actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-[#262626] bg-[#141414] text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                            title="Bagikan tautan produk"
                            aria-label="Bagikan produk"
                        >
                            {copiedShare ? (
                                <Check className="size-4 text-emerald-400" />
                            ) : (
                                <Share2 className="size-4" />
                            )}
                        </button>

                        <Link
                            href="/cart"
                            className="relative flex size-9 items-center justify-center rounded-full border border-[#262626] bg-[#141414] text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27] active:scale-95"
                            aria-label={`Keranjang Belanja (${cartCount} item)`}
                        >
                            <ShoppingBag className="size-4" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#E34A27] px-1 font-mono text-[9px] font-bold text-white shadow-md shadow-[#E34A27]/30">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            {/* 2. MAIN PRODUCT EXPERIENCE WORKSPACE */}
            <main className="relative z-10 mx-auto max-w-6xl px-4 py-6 pb-36 sm:px-6 sm:py-10 lg:px-8 lg:pb-20">
                {/* Subtle Breadcrumb Navigation */}
                <nav
                    aria-label="Breadcrumb"
                    className="mb-6 flex flex-wrap items-center gap-2 font-mono text-xs text-[#737373]"
                >
                    <Link
                        href="/explore"
                        className="transition-colors hover:text-[#F5F2EB]"
                    >
                        Pasar Sekolah
                    </Link>
                    <span>/</span>
                    {product.category ? (
                        <>
                            <Link
                                href={`/explore?category=${product.category.slug}`}
                                className="transition-colors hover:text-[#F5F2EB]"
                            >
                                {product.category.name}
                            </Link>
                            <span>/</span>
                        </>
                    ) : null}
                    <span className="truncate text-[#E34A27]">
                        {product.name}
                    </span>
                </nav>

                {/* EDITORIAL TWO-COLUMN PRODUCT SHOWCASE */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-12">
                    {/* LEFT COLUMN: HERO PRODUCT VISUAL & STORY SECTION (Col 7) */}
                    <div className="space-y-8 lg:col-span-7">
                        {/* Dominant Product Image Stage */}
                        <div className="group relative overflow-hidden rounded-3xl border border-[#262626] bg-[#141414] shadow-2xl transition-all hover:border-[#383838]">
                            <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[#1A1A1A] p-6 sm:aspect-[4/3] sm:p-10">
                                {product.image_path && !imageError ? (
                                    <img
                                        src={product.image_path}
                                        alt={`Foto produk ${product.name}`}
                                        onError={() => setImageError(true)}
                                        className={`h-full w-full object-contain transition-transform duration-700 ease-out group-hover:scale-105 ${
                                            isOutOfStock
                                                ? 'opacity-50 grayscale'
                                                : ''
                                        }`}
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-8 text-center text-[#525252]">
                                        <Package className="size-16 stroke-[1.25] text-[#737373]" />
                                        <span className="font-mono text-xs tracking-wider text-[#737373] uppercase">
                                            {product.category?.name ||
                                                'Katalog KOPDIG'}
                                        </span>
                                    </div>
                                )}

                                {/* Top Floating Provenance & Feature Badges */}
                                <div className="pointer-events-none absolute top-4 right-4 left-4 flex items-center justify-between gap-2">
                                    {/* Source Provenance */}
                                    <div>
                                        {product.source_type === 'student' ? (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-[#141414]/90 px-3 py-1 font-mono text-[11px] font-semibold text-amber-300 shadow-md backdrop-blur-md"
                                                title={`Karya titipan siswa: ${product.owner?.name || 'Siswa'}`}
                                            >
                                                <UserCheck className="size-3 text-amber-400" />
                                                <span>
                                                    Titipan:{' '}
                                                    {product.owner?.name ||
                                                        'Siswa'}
                                                </span>
                                            </span>
                                        ) : (
                                            <span
                                                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-[#141414]/90 px-3 py-1 font-mono text-[11px] font-semibold text-emerald-400 shadow-md backdrop-blur-md"
                                                title="Pengadaan resmi Koperasi Sekolah"
                                            >
                                                <Store className="size-3 text-emerald-400" />
                                                <span>Koperasi Sekolah</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Featured Flag */}
                                    {product.is_featured && (
                                        <span className="rounded-full border border-[#E34A27]/40 bg-[#E34A27]/15 px-3 py-1 font-mono text-[10px] font-bold tracking-wider text-[#E34A27] uppercase backdrop-blur-md">
                                            Pilihan Unggulan
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PRODUCT STORY & EDITORIAL MERCHANDISING SECTION */}
                        <section
                            aria-labelledby="story-heading"
                            className="space-y-4 pt-2"
                        >
                            <div className="flex items-center gap-2">
                                <span className="rounded-full border border-[#E34A27]/30 bg-[#E34A27]/10 px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#E34A27]">
                                    CERITA PRODUK
                                </span>
                                <h2
                                    id="story-heading"
                                    className="font-heading text-lg font-bold text-[#F5F2EB]"
                                >
                                    Kurasi & Standar Loket KOPDIG
                                </h2>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Editorial Card 1: Cooperative Trust & Curation */}
                                <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg">
                                    <div className="flex size-10 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400">
                                        <ShieldCheck className="size-5" />
                                    </div>
                                    <h3 className="mt-3.5 font-heading text-sm font-bold text-[#F5F2EB]">
                                        Jaminan Mutu & Higienitas
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
                                        {product.source_type === 'student'
                                            ? `Karya titipan siswa atas nama ${product.owner?.name || 'Siswa'} ini telah diperiksa kelayakan, tanggal produksi, dan higienitasnya secara langsung oleh staf pengurus koperasi.`
                                            : 'Barang pengadaan resmi koperasi sekolah yang telah memenuhi standar kebutuhan harian warga sekolah dengan jaminan harga transparan.'}
                                    </p>
                                </div>

                                {/* Editorial Card 2: Pickup Logistics */}
                                <div className="rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg">
                                    <div className="flex size-10 items-center justify-center rounded-2xl border border-[#E34A27]/30 bg-[#E34A27]/10 text-[#E34A27]">
                                        <Clock className="size-5" />
                                    </div>
                                    <h3 className="mt-3.5 font-heading text-sm font-bold text-[#F5F2EB]">
                                        Jadwal Pengambilan Istirahat
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
                                        Pesanan yang telah dibuat dan
                                        diverifikasi bayar tunai dapat diambil
                                        langsung di Loket Koperasi Lantai 1 pada
                                        jadwal sesi istirahat sekolah tanpa
                                        antre manual.
                                    </p>
                                </div>
                            </div>

                            {/* Consignment Partnership Note (If Student Consignment) */}
                            {product.source_type === 'student' && (
                                <div className="rounded-3xl border border-amber-500/20 bg-amber-950/15 p-5 text-xs text-amber-300/90 shadow-md">
                                    <div className="flex items-start gap-3">
                                        <UserCheck className="mt-0.5 size-4 shrink-0 text-amber-400" />
                                        <div className="space-y-1">
                                            <p className="font-heading font-bold text-amber-200">
                                                Dukungan Wirausaha Siswa
                                            </p>
                                            <p className="leading-relaxed">
                                                KOPDIG bertindak sebagai kurator
                                                dan pengelola loket kasir resmi
                                                sekolah, sedangkan kepemilikan
                                                dan hasil karya produk
                                                sepenuhnya merupakan wirausaha
                                                kreatif siswa bersangkutan.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* RIGHT COLUMN: PRODUCT INFORMATION & PURCHASE STATION (Col 5) */}
                    <div className="lg:col-span-5">
                        <div className="sticky top-20 rounded-3xl border border-[#262626] bg-[#141414] p-6 shadow-2xl sm:p-7">
                            {/* Category & Status Pill */}
                            <div className="flex items-center justify-between gap-2 border-b border-[#262626] pb-4">
                                {product.category ? (
                                    <Link
                                        href={`/explore?category=${product.category.slug}`}
                                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-[#E34A27] transition-colors hover:text-[#ff5c38]"
                                    >
                                        <Tag className="size-3" />
                                        <span>{product.category.name}</span>
                                    </Link>
                                ) : (
                                    <span className="font-mono text-xs text-[#737373]">
                                        Katalog Sekolah
                                    </span>
                                )}

                                {/* Stock Status Pill */}
                                {isOutOfStock ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-red-950/50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-red-300">
                                        <Ban className="size-3" />
                                        <span>Stok Habis</span>
                                    </span>
                                ) : isLowStock ? (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-950/50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                        <AlertTriangle className="size-3 text-amber-400" />
                                        <span>
                                            {product.stock_status_label ||
                                                `Sisa ${product.stock} Unit`}
                                        </span>
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                                        <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                        <span>
                                            Tersedia ({product.stock} Unit)
                                        </span>
                                    </span>
                                )}
                            </div>

                            {/* Product Title */}
                            <div className="mt-4">
                                <h1 className="font-heading text-2xl font-black tracking-tight text-[#F5F2EB] sm:text-3xl">
                                    {product.name}
                                </h1>
                            </div>

                            {/* Prominent Price Showcase */}
                            <div className="mt-4 rounded-2xl border border-[#262626] bg-[#0A0A0A] p-4">
                                <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                    Harga Satuan Resmi
                                </span>
                                <div className="mt-1 flex items-baseline justify-between gap-2">
                                    <span className="font-heading text-3xl font-black tracking-tight text-[#E34A27] sm:text-4xl">
                                        {formatRupiah(product.selling_price)}
                                    </span>
                                    <span className="font-mono text-[11px] text-emerald-400">
                                        Bebas Biaya Admin
                                    </span>
                                </div>
                            </div>

                            {/* Product Description */}
                            <div className="mt-5 space-y-2 border-b border-[#262626] pb-5">
                                <h2 className="font-heading text-xs font-bold tracking-wider text-[#737373] uppercase">
                                    Deskripsi Produk
                                </h2>
                                <div className="text-xs leading-relaxed text-[#D4D4D4] sm:text-sm">
                                    {product.description ? (
                                        <div>
                                            <p
                                                className={`whitespace-pre-line ${
                                                    !isDescriptionExpanded &&
                                                    product.description.length >
                                                        200
                                                        ? 'line-clamp-4'
                                                        : ''
                                                }`}
                                            >
                                                {product.description}
                                            </p>
                                            {product.description.length >
                                                200 && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setIsDescriptionExpanded(
                                                            !isDescriptionExpanded,
                                                        )
                                                    }
                                                    className="mt-2 inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#E34A27] transition-colors hover:text-[#ff5c38]"
                                                >
                                                    <span>
                                                        {isDescriptionExpanded
                                                            ? 'Perpendek'
                                                            : 'Baca Selengkapnya'}
                                                    </span>
                                                    {isDescriptionExpanded ? (
                                                        <ChevronUp className="size-3.5" />
                                                    ) : (
                                                        <ChevronDown className="size-3.5" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="font-mono text-xs text-[#737373] italic">
                                            Tidak ada catatan tambahan untuk
                                            produk ini.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Transactional Purchase Controls */}
                            <div className="mt-6 space-y-5">
                                {/* Quantity Stepper */}
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="block font-mono text-xs text-[#A3A3A3]">
                                            Jumlah Pesanan
                                        </span>
                                        <span className="font-mono text-[10px] text-[#737373]">
                                            Maks. {maxQuantity} unit / transaksi
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#1A1A1A] p-1">
                                        <button
                                            type="button"
                                            disabled={
                                                isOutOfStock || quantity <= 1
                                            }
                                            onClick={handleDecreaseQuantity}
                                            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[#F5F2EB] transition-colors hover:bg-[#262626] active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                                            aria-label="Kurangi jumlah pesanan"
                                        >
                                            <Minus className="size-3.5" />
                                        </button>

                                        <span className="min-w-8 text-center font-mono text-sm font-bold text-[#F5F2EB]">
                                            {isOutOfStock ? 0 : quantity}
                                        </span>

                                        <button
                                            type="button"
                                            disabled={
                                                isOutOfStock ||
                                                quantity >= maxQuantity
                                            }
                                            onClick={handleIncreaseQuantity}
                                            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-[#F5F2EB] transition-colors hover:bg-[#262626] active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                                            aria-label="Tambah jumlah pesanan"
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal preview */}
                                <div className="flex items-center justify-between border-t border-[#262626] pt-3 text-xs">
                                    <span className="text-[#A3A3A3]">
                                        Subtotal ({quantity} unit):
                                    </span>
                                    <span className="font-heading text-lg font-black text-[#F5F2EB]">
                                        {formatRupiah(
                                            isOutOfStock ? 0 : subtotal,
                                        )}
                                    </span>
                                </div>

                                {/* Primary Add to Cart CTA */}
                                <div>
                                    <button
                                        type="button"
                                        disabled={isOutOfStock || isSubmitting}
                                        onClick={handleAddToCartClick}
                                        className={`group flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-2 rounded-full px-6 py-3 font-heading text-xs font-bold text-white shadow-lg transition-all select-none active:scale-[0.98] ${
                                            isOutOfStock || isSubmitting
                                                ? 'cursor-not-allowed border border-[#262626] bg-[#1A1A1A] text-[#737373] opacity-60 shadow-none'
                                                : 'bg-[#E34A27] shadow-[#E34A27]/25 hover:bg-[#ff5c38] hover:shadow-[#E34A27]/40'
                                        }`}
                                        aria-label={
                                            isOutOfStock
                                                ? 'Stok produk habis'
                                                : `Tambah ${quantity} ${product.name} ke keranjang`
                                        }
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                <span>
                                                    Menambahkan ke Keranjang...
                                                </span>
                                            </>
                                        ) : isOutOfStock ? (
                                            <span>Persediaan Habis</span>
                                        ) : (
                                            <>
                                                <ShoppingBag className="size-4" />
                                                <span>
                                                    Tambah {quantity} ke
                                                    Keranjang
                                                </span>
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Assurance Footer */}
                                <div className="flex items-center justify-center gap-2 text-center font-mono text-[11px] text-[#737373]">
                                    <ShieldCheck className="size-3.5 text-emerald-400" />
                                    <span>
                                        Bayar tunai di koperasi saat pengambilan
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. RELATED DISCOVERY SECTION */}
                {relatedProducts.length > 0 && (
                    <section
                        aria-labelledby="related-heading"
                        className="mt-16 border-t border-[#262626] pt-10"
                    >
                        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                            <div>
                                <span className="font-mono text-xs tracking-wider text-[#737373] uppercase">
                                    Kategori{' '}
                                    {product.category?.name || 'Sejenis'}
                                </span>
                                <h2
                                    id="related-heading"
                                    className="font-heading text-xl font-black text-[#F5F2EB] sm:text-2xl"
                                >
                                    Temukan Produk Lain
                                </h2>
                            </div>
                            <Link
                                href={
                                    product.category
                                        ? `/explore?category=${product.category.slug}`
                                        : '/explore'
                                }
                                className="group inline-flex items-center gap-1 font-mono text-xs font-semibold text-[#E34A27] transition-colors hover:text-[#ff5c38]"
                            >
                                <span>Lihat Semua Produk Kategori</span>
                                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {/* Related Products Grid */}
                        <div className="grid grid-cols-2 gap-3.5 sm:gap-4 md:grid-cols-4">
                            {relatedProducts.map((rel) => {
                                const isRelOutOfStock =
                                    rel.stock <= 0 ||
                                    rel.stock_status === 'out_of_stock';
                                const isRelImageFailed =
                                    failedRelatedImages[rel.id];
                                const isRelAdding = addingRelatedId === rel.id;

                                return (
                                    <article
                                        key={rel.id}
                                        className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] transition-all duration-300 hover:border-[#E34A27]/40 hover:shadow-xl hover:shadow-black/60"
                                    >
                                        <Link
                                            href={`/products/${rel.slug || rel.id}`}
                                            className="flex flex-1 flex-col select-none"
                                        >
                                            {/* Thumbnail Stage */}
                                            <div className="relative aspect-square w-full overflow-hidden bg-[#1A1A1A]">
                                                {rel.image_path &&
                                                !isRelImageFailed ? (
                                                    <img
                                                        src={rel.image_path}
                                                        alt={rel.name}
                                                        onError={() =>
                                                            setFailedRelatedImages(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    [rel.id]: true,
                                                                }),
                                                            )
                                                        }
                                                        loading="lazy"
                                                        className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                                                            isRelOutOfStock
                                                                ? 'opacity-50 grayscale'
                                                                : ''
                                                        }`}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-4 text-center text-[#525252]">
                                                        <Package className="size-8 stroke-[1.25] text-[#737373]" />
                                                        <span className="font-mono text-[9px] tracking-wider text-[#525252] uppercase">
                                                            {rel.category
                                                                ?.name ||
                                                                'Katalog'}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Status overlay */}
                                                <div className="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between gap-1">
                                                    {isRelOutOfStock ? (
                                                        <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-950/80 px-2 py-0.5 font-mono text-[9px] font-bold text-red-300 shadow-sm backdrop-blur-xs">
                                                            <Ban className="size-2.5" />
                                                            <span>Habis</span>
                                                        </span>
                                                    ) : rel.stock_status ===
                                                      'low_stock' ? (
                                                        <span className="rounded-full border border-amber-500/30 bg-amber-950/80 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 shadow-sm backdrop-blur-xs">
                                                            Sisa {rel.stock}
                                                        </span>
                                                    ) : rel.is_featured ? (
                                                        <span className="rounded-full border border-[#D5A84C]/40 bg-[#D5A84C]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[#E5BA60] shadow-sm backdrop-blur-xs">
                                                            Unggulan
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                                                <div className="space-y-1.5">
                                                    {/* Source Tag */}
                                                    <div>
                                                        {rel.source_type ===
                                                        'student' ? (
                                                            <span
                                                                className="inline-flex items-center gap-1 rounded-full border border-[#D5A84C]/30 bg-[#D5A84C]/10 px-2 py-0.5 font-mono text-[10px] text-[#E5BA60]"
                                                                title={`Karya titipan siswa: ${rel.owner?.name || 'Siswa'}`}
                                                            >
                                                                <UserCheck className="size-2.5 text-[#D5A84C]" />
                                                                <span className="max-w-[110px] truncate">
                                                                    Titipan:{' '}
                                                                    {rel.owner?.name?.split(
                                                                        ' ',
                                                                    )[0] ||
                                                                        'Siswa'}
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span
                                                                className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] text-emerald-400"
                                                                title="Produk resmi pengadaan Koperasi Sekolah"
                                                            >
                                                                <Store className="size-2.5 text-emerald-400" />
                                                                <span>
                                                                    Koperasi
                                                                </span>
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="line-clamp-2 font-heading text-xs leading-snug font-bold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#E34A27] sm:text-sm">
                                                        {rel.name}
                                                    </h3>
                                                </div>

                                                {/* Price */}
                                                <div className="mt-3 border-t border-[#1F1F1F] pt-2">
                                                    <span className="font-heading text-sm font-extrabold tracking-tight text-[#F5F2EB] sm:text-base">
                                                        {formatRupiah(
                                                            rel.selling_price,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>

                                        {/* Quick Add Action */}
                                        <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                                            <button
                                                type="button"
                                                disabled={
                                                    isRelOutOfStock ||
                                                    isRelAdding
                                                }
                                                onClick={(e) =>
                                                    handleAddRelatedToCart(
                                                        e,
                                                        rel,
                                                    )
                                                }
                                                aria-label={`Tambah ${rel.name} ke keranjang`}
                                                className={`flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 ${
                                                    isRelOutOfStock
                                                        ? 'cursor-not-allowed border border-[#262626] bg-[#1A1A1A] text-[#525252]'
                                                        : 'border border-[#262626] bg-[#1C1C1C] text-[#F5F2EB] hover:border-[#E34A27] hover:bg-[#E34A27] hover:text-white'
                                                }`}
                                            >
                                                {isRelAdding ? (
                                                    <Loader2 className="size-3.5 animate-spin" />
                                                ) : isRelOutOfStock ? (
                                                    <span>Habis</span>
                                                ) : (
                                                    <>
                                                        <Plus className="size-3.5" />
                                                        <span>Keranjang</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </article>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>

            {/* 4. MOBILE STICKY BOTTOM COMMERCIAL DOCK */}
            <div
                aria-label="Panel Pembelian Cepat Mobile"
                className="fixed right-0 bottom-0 left-0 z-40 border-t border-[#262626] bg-[#0A0A0A]/95 px-4 py-3 shadow-2xl backdrop-blur-md lg:hidden"
            >
                <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                    {/* Stepper on Mobile */}
                    <div className="flex items-center gap-1 rounded-full border border-[#262626] bg-[#141414] p-1">
                        <button
                            type="button"
                            disabled={isOutOfStock || quantity <= 1}
                            onClick={handleDecreaseQuantity}
                            className="flex size-7.5 cursor-pointer items-center justify-center rounded-full text-[#F5F2EB] transition-colors hover:bg-[#262626] active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Kurangi jumlah"
                        >
                            <Minus className="size-3" />
                        </button>

                        <span className="min-w-6 text-center font-mono text-xs font-bold text-[#F5F2EB]">
                            {isOutOfStock ? 0 : quantity}
                        </span>

                        <button
                            type="button"
                            disabled={isOutOfStock || quantity >= maxQuantity}
                            onClick={handleIncreaseQuantity}
                            className="flex size-7.5 cursor-pointer items-center justify-center rounded-full text-[#F5F2EB] transition-colors hover:bg-[#262626] active:scale-90 disabled:cursor-not-allowed disabled:opacity-30"
                            aria-label="Tambah jumlah"
                        >
                            <Plus className="size-3" />
                        </button>
                    </div>

                    {/* Subtotal & Primary CTA */}
                    <div className="flex flex-1 items-center justify-end gap-2.5">
                        <div className="hidden text-right min-[340px]:block">
                            <span className="block font-mono text-[9px] text-[#737373] uppercase">
                                Subtotal
                            </span>
                            <span className="font-heading text-sm font-black text-[#F5F2EB]">
                                {formatRupiah(isOutOfStock ? 0 : subtotal)}
                            </span>
                        </div>

                        <button
                            type="button"
                            disabled={isOutOfStock || isSubmitting}
                            onClick={handleAddToCartClick}
                            className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2 font-heading text-xs font-bold text-white shadow-md transition-all select-none ${
                                isOutOfStock || isSubmitting
                                    ? 'cursor-not-allowed border border-[#262626] bg-[#1A1A1A] text-[#737373] opacity-60'
                                    : 'cursor-pointer bg-[#E34A27] shadow-[#E34A27]/25 hover:bg-[#ff5c38] active:scale-98'
                            }`}
                            aria-label={
                                isOutOfStock
                                    ? 'Stok produk habis'
                                    : `Tambah ${quantity} ${product.name} ke keranjang`
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    <span>Memproses...</span>
                                </>
                            ) : isOutOfStock ? (
                                <span>Stok Habis</span>
                            ) : (
                                <>
                                    <ShoppingBag className="size-3.5" />
                                    <span>+ Keranjang</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
