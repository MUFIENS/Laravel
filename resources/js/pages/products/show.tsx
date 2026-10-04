import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Minus,
    Package,
    Plus,
    Share2,
    ShieldCheck,
    ShoppingBag,
    Tag,
    X,
    Ban,
    AlertTriangle,
    Loader2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { ProductCard } from '@/components/commerce/ProductCard';
import { ProductSourceBadge } from '@/components/commerce/ProductSourceBadge';
import { SectionHeader } from '@/components/ui/section-header';
import { safeNavigateBack } from '@/lib/navigation';
import type { MarketplaceProduct } from '@/types/marketplace';
import type { Auth } from '@/types';

interface ProductDetailPageProps {
    auth: Auth;
    product: MarketplaceProduct;
    relatedProducts: MarketplaceProduct[];
    [key: string]: unknown;
}

export default function ProductDetail() {
    const { auth, product, relatedProducts } =
        usePage<ProductDetailPageProps>().props;

    const [quantity, setQuantity] = useState(1);
    const [imageError, setImageError] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isOutOfStock =
        product.stock === 0 || product.stock_status === 'out_of_stock';
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

        if (!auth?.user) {
            router.visit('/login');
            return;
        }

        if (auth.user.role !== 'student') {
            setToastMessage(
                'Akun pengurus koperasi tidak dapat berbelanja di keranjang siswa.',
            );
            setTimeout(() => setToastMessage(null), 4000);
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
                    setToastMessage(
                        `${quantity}x "${product.name}" berhasil ditambahkan ke keranjang.`,
                    );
                    setTimeout(() => setToastMessage(null), 3500);
                },
                onError: (errors) => {
                    setIsSubmitting(false);
                    const errorMsg =
                        errors.quantity ||
                        errors.product_id ||
                        errors.general ||
                        'Gagal menambahkan produk ke keranjang.';
                    setToastMessage(String(errorMsg));
                    setTimeout(() => setToastMessage(null), 4000);
                },
            },
        );
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${product.name} — KOPDIG`,
                    text: `Beli ${product.name} di Koperasi Digital Sekolah KOPDIG.`,
                    url: window.location.href,
                });
            } catch {
                // User cancelled or browser dismissed share
            }
        } else if (navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(window.location.href);
                setToastMessage('Tautan produk berhasil disalin ke clipboard.');
                setTimeout(() => setToastMessage(null), 3000);
            } catch {
                // Clipboard write failed or blocked
            }
        }
    };

    const subtotal = product.selling_price * quantity;

    return (
        <AppShell
            activeTab="explore"
            userName={auth?.user?.name}
            isAuthenticated={!!auth?.user}
        >
            <Head title={`${product.name} — KOPDIG`} />

            <PageContainer className="pb-36">
                {/* Floating Notification Banner */}
                {toastMessage && (
                    <div
                        role="status"
                        className="fixed top-16 right-4 left-4 z-50 mx-auto flex max-w-md animate-in items-center gap-2.5 rounded-2xl border border-primary/20 bg-surface p-3.5 shadow-xl shadow-ink/10 transition-all fade-in slide-in-from-top-3"
                    >
                        <CheckCircle2 className="size-5 shrink-0 text-primary" />
                        <p className="flex-1 text-xs font-medium text-ink">
                            {toastMessage}
                        </p>
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="text-muted hover:text-ink"
                            aria-label="Tutup pemberitahuan"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                )}

                {/* Top Back Navigation Bar */}
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="hover:bg-surface-subtle inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-2 text-xs font-semibold text-ink shadow-xs transition-colors active:scale-95"
                        aria-label="Kembali ke halaman sebelumnya"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {product.category && (
                            <Link
                                href={`/explore?category=${product.category.slug}`}
                                className="inline-flex min-h-[36px] items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] font-medium text-muted transition-colors hover:border-primary/40 hover:text-primary"
                                aria-label={`Lihat kategori ${product.category.name}`}
                            >
                                <Tag className="size-3" />
                                <span>{product.category.name}</span>
                            </Link>
                        )}

                        <button
                            type="button"
                            onClick={handleShare}
                            className="flex size-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-full border border-border bg-surface text-muted shadow-xs transition-colors hover:text-ink active:scale-95"
                            aria-label="Bagikan produk ini"
                        >
                            <Share2 className="size-4" />
                        </button>
                    </div>
                </div>

                {/* Main Product Showcase Card */}
                <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
                    {/* Primary Product Image Stage */}
                    <div className="relative flex aspect-square w-full items-center justify-center overflow-hidden bg-[#FAF9F5] p-6 sm:aspect-[4/3]">
                        {product.image_path && !imageError ? (
                            <img
                                src={product.image_path}
                                alt={`Foto detail produk ${product.name}`}
                                onError={() => setImageError(true)}
                                className={`h-full w-full object-contain transition-all duration-300 ${
                                    isOutOfStock ? 'grayscale-[50%]' : ''
                                }`}
                            />
                        ) : (
                            <div className="bg-surface-subtle flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl p-6 text-center text-muted">
                                <Package className="size-16 stroke-[1.25] text-primary/30" />
                                <span className="text-ink-muted font-heading text-xs font-semibold">
                                    {product.category?.name ||
                                        'Produk Koperasi'}
                                </span>
                            </div>
                        )}

                        {/* Badges on Top Image */}
                        <div className="pointer-events-none absolute top-4 right-4 left-4 flex items-center justify-between">
                            <ProductSourceBadge
                                source={product.source_type}
                                ownerName={product.owner?.name}
                            />

                            {product.is_featured && (
                                <span className="rounded-full bg-accent px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-ink uppercase shadow-xs">
                                    Unggulan
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Product Details Section */}
                    <div className="space-y-5 p-5 sm:p-7">
                        {/* Title & Provenance */}
                        <div>
                            <div className="mb-2 flex items-center gap-2">
                                <span className="text-[11px] font-medium text-muted">
                                    Kategori:
                                </span>
                                {product.category ? (
                                    <Link
                                        href={`/?category=${product.category.slug}`}
                                        className="text-[11px] font-semibold text-primary hover:underline"
                                    >
                                        {product.category.name}
                                    </Link>
                                ) : (
                                    <span className="text-[11px] text-muted">
                                        Umum
                                    </span>
                                )}
                            </div>

                            <h1 className="font-heading text-xl leading-snug font-bold text-ink sm:text-2xl">
                                {product.name}
                            </h1>
                        </div>

                        {/* Price Display */}
                        <div className="rounded-2xl border border-border/80 bg-[#FAF9F5] p-4">
                            <span className="text-[11px] font-medium text-muted">
                                Harga Satuan Resmi:
                            </span>
                            <div className="mt-1">
                                <PriceDisplay
                                    amount={product.selling_price}
                                    size="xl"
                                />
                            </div>
                        </div>

                        {/* Availability & Stock State Banner */}
                        <div>
                            {isOutOfStock ? (
                                <div
                                    role="alert"
                                    className="border-status-danger/20 text-status-danger flex items-center gap-2.5 rounded-2xl border bg-[#FDF2F2] p-3.5 text-xs"
                                >
                                    <Ban className="text-status-danger size-4 shrink-0" />
                                    <div>
                                        <p className="font-bold">
                                            Stok Sedang Habis
                                        </p>
                                        <p className="text-status-danger/80 mt-0.5 text-[11px]">
                                            Produk ini saat ini belum tersedia
                                            untuk dipesan. Tunggu restok sesi
                                            berikutnya.
                                        </p>
                                    </div>
                                </div>
                            ) : isLowStock ? (
                                <div
                                    role="status"
                                    className="border-status-warning/20 text-status-warning flex items-center gap-2.5 rounded-2xl border bg-[#FDF8EE] p-3.5 text-xs"
                                >
                                    <AlertTriangle className="text-status-warning size-4 shrink-0" />
                                    <div>
                                        <p className="font-bold">
                                            Stok Terbatas (Tersisa{' '}
                                            {product.stock} unit)
                                        </p>
                                        <p className="text-status-warning/80 mt-0.5 text-[11px]">
                                            Persediaan hampir habis. Pesan lebih
                                            awal sebelum jam istirahat sekolah
                                            berakhir.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    role="status"
                                    className="border-status-success/20 text-status-success flex items-center gap-2.5 rounded-2xl border bg-[#F0F9F5] p-3.5 text-xs"
                                >
                                    <CheckCircle2 className="text-status-success size-4 shrink-0" />
                                    <div>
                                        <p className="font-bold">
                                            Stok Tersedia ({product.stock} unit)
                                        </p>
                                        <p className="text-status-success/80 mt-0.5 text-[11px]">
                                            Barang siap diambil di loket
                                            koperasi sekolah saat jam istirahat.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Description Block */}
                        <div className="space-y-2 border-t border-border pt-4">
                            <h2 className="font-heading text-sm font-bold text-ink">
                                Rincian & Deskripsi Produk
                            </h2>
                            <div className="text-xs leading-relaxed whitespace-pre-line text-ink/80 sm:text-sm">
                                {product.description ? (
                                    product.description
                                ) : (
                                    <p className="text-muted italic">
                                        Tidak ada deskripsi tambahan yang
                                        disertakan untuk produk ini.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Cooperative Quality & Pickup Information */}
                        <div className="border-border-subtle bg-surface-subtle space-y-2 rounded-2xl border p-4 text-xs text-muted">
                            <div className="flex items-center gap-2 font-semibold text-ink">
                                <ShieldCheck className="size-4 text-primary" />
                                <span>Koperasi Terverifikasi Sekolah</span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                                {product.source_type === 'student'
                                    ? `Produk ini merupakan karya titipan siswa atas nama ${product.owner?.name || 'Siswa'} yang telah disetujui, dicek higienitas serta kelayakannya oleh pengurus Koperasi Sekolah.`
                                    : 'Produk ini merupakan barang pengadaan resmi Koperasi Sekolah dengan jaminan standar kualitas dan harga terjangkau.'}
                            </p>
                            <div className="flex items-center gap-1.5 pt-1 text-[11px] font-medium text-primary">
                                <Clock className="size-3.5" />
                                <span>
                                    Pengambilan pesanan: Loket Koperasi saat jam
                                    istirahat
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Related Products from Category */}
                {relatedProducts.length > 0 && (
                    <section aria-labelledby="related-heading" className="mt-8">
                        <SectionHeader
                            title={`Produk Terkait ${product.category?.name || ''}`}
                            subtitle="Pilihan produk sejenis yang siap dipesan"
                        />
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                            {relatedProducts.map((rel) => (
                                <ProductCard
                                    key={rel.id}
                                    product={{
                                        id: rel.id,
                                        name: rel.name,
                                        slug: rel.slug,
                                        source: rel.source_type,
                                        ownerName: rel.owner?.name,
                                        price: rel.selling_price,
                                        imageUrl: rel.image_path,
                                        badge: rel.is_featured
                                            ? 'Pilihan'
                                            : undefined,
                                        stock: rel.stock,
                                        stockStatus: rel.stock_status,
                                        stockStatusLabel:
                                            rel.stock_status_label,
                                        categoryName:
                                            rel.category?.name || 'Kategori',
                                    }}
                                    onClick={(p) => {
                                        if (p.slug) {
                                            router.visit(`/products/${p.slug}`);
                                        }
                                    }}
                                    onAddToCart={(relProduct) => {
                                        if (!auth?.user) {
                                            router.visit('/login');
                                            return;
                                        }
                                        if (auth.user.role !== 'student') {
                                            setToastMessage(
                                                'Akun pengurus koperasi tidak dapat berbelanja di keranjang siswa.',
                                            );
                                            setTimeout(
                                                () => setToastMessage(null),
                                                4000,
                                            );
                                            return;
                                        }

                                        router.post(
                                            '/cart/items',
                                            {
                                                product_id: relProduct.id,
                                                quantity: 1,
                                            },
                                            {
                                                preserveScroll: true,
                                                onSuccess: () => {
                                                    setToastMessage(
                                                        `"${relProduct.name}" berhasil ditambahkan ke keranjang.`,
                                                    );
                                                    setTimeout(
                                                        () =>
                                                            setToastMessage(
                                                                null,
                                                            ),
                                                        3500,
                                                    );
                                                },
                                                onError: (errors) => {
                                                    const errorMsg =
                                                        errors.quantity ||
                                                        errors.product_id ||
                                                        errors.general ||
                                                        'Gagal menambahkan produk ke keranjang.';
                                                    setToastMessage(
                                                        String(errorMsg),
                                                    );
                                                    setTimeout(
                                                        () =>
                                                            setToastMessage(
                                                                null,
                                                            ),
                                                        4000,
                                                    );
                                                },
                                            },
                                        );
                                    }}
                                />
                            ))}
                        </div>
                    </section>
                )}
            </PageContainer>

            {/* Sticky Mobile Bottom Commercial Action Bar */}
            <div
                aria-label="Panel Pembelian Cepat"
                className="fixed right-0 bottom-0 left-0 z-40 border-t border-border/80 bg-surface/95 px-4 py-3 shadow-lg backdrop-blur-md sm:px-6"
            >
                <div className="mx-auto flex max-w-md items-center justify-between gap-3">
                    {/* Quantity Stepper (Active when in stock) */}
                    <div className="flex flex-col">
                        <span className="text-[10px] font-medium text-muted">
                            Jumlah:
                        </span>
                        <div className="mt-0.5 flex items-center rounded-full border border-border bg-[#FAF9F5] p-1">
                            <button
                                type="button"
                                disabled={isOutOfStock || quantity <= 1}
                                onClick={handleDecreaseQuantity}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-surface active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Kurangi jumlah pesanan"
                            >
                                <Minus className="size-3.5" />
                            </button>

                            <span className="min-w-[28px] text-center font-heading text-xs font-bold text-ink">
                                {isOutOfStock ? 0 : quantity}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    isOutOfStock || quantity >= maxQuantity
                                }
                                onClick={handleIncreaseQuantity}
                                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-ink transition-colors hover:bg-surface active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                                aria-label="Tambah jumlah pesanan"
                            >
                                <Plus className="size-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Subtotal & Primary Add-To-Cart CTA */}
                    <div className="flex flex-1 items-center justify-end gap-2.5">
                        <div className="hidden text-right min-[360px]:block">
                            <span className="block text-[10px] text-muted">
                                Total:
                            </span>
                            <PriceDisplay
                                amount={isOutOfStock ? 0 : subtotal}
                                size="md"
                            />
                        </div>

                        <button
                            type="button"
                            disabled={isOutOfStock || isSubmitting}
                            onClick={handleAddToCartClick}
                            className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-xs font-semibold transition-all select-none ${
                                isOutOfStock || isSubmitting
                                    ? 'cursor-not-allowed border border-border bg-[#F5F4EE] text-muted opacity-75'
                                    : 'cursor-pointer bg-primary text-white shadow-xs hover:bg-primary-hover active:scale-98'
                            }`}
                            aria-label={
                                isOutOfStock
                                    ? 'Stok produk habis'
                                    : isSubmitting
                                      ? 'Sedang menambahkan...'
                                      : `Tambah ${quantity} ${product.name} ke keranjang`
                            }
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="size-4 animate-spin text-muted" />
                                    <span>Menambahkan...</span>
                                </>
                            ) : (
                                <>
                                    <ShoppingBag className="size-4 shrink-0" />
                                    <span>
                                        {isOutOfStock
                                            ? 'Stok Habis'
                                            : 'Tambah ke Keranjang'}
                                    </span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}
