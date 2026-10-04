import React, { useState } from 'react';
import { Heart, Plus, Check, Package, Ban } from 'lucide-react';
import { PriceDisplay } from './PriceDisplay';
import { ProductSourceBadge, ProductSourceType } from './ProductSourceBadge';

export interface ProductCardData {
    id: number | string;
    name: string;
    slug?: string;
    source: ProductSourceType;
    ownerName?: string;
    price: number;
    originalPrice?: number;
    imageUrl?: string | null;
    image_url?: string | null;
    image_path?: string | null;
    badge?: string;
    stock?: number;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
    stockStatusLabel?: string;
    isInCart?: boolean;
    isFavorite?: boolean;
    categoryName?: string;
}

interface ProductCardProps {
    product: ProductCardData;
    onAddToCart?: (product: ProductCardData) => void;
    onToggleFavorite?: (productId: number | string) => void;
    onClick?: (product: ProductCardData) => void;
    className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onAddToCart,
    onToggleFavorite,
    onClick,
    className = '',
}) => {
    const [imageError, setImageError] = useState(false);
    const isOutOfStock =
        product.stock === 0 || product.stockStatus === 'out_of_stock';

    const imageSrc = (() => {
        const raw = product.imageUrl || product.image_url || product.image_path;
        if (!raw) return null;
        if (
            raw.startsWith('http://') ||
            raw.startsWith('https://') ||
            raw.startsWith('/')
        ) {
            return raw;
        }
        if (raw.startsWith('storage/')) {
            return `/${raw}`;
        }
        return `/storage/${raw}`;
    })();

    return (
        <article
            className={`group flex flex-col justify-between overflow-hidden rounded-[20px] border border-border bg-surface transition-all duration-200 select-none hover:border-primary/30 hover:shadow-xs active:scale-[0.99] ${
                isOutOfStock ? 'opacity-90' : ''
            } ${className}`}
        >
            {/* Product Image Stage */}
            <div
                className="relative flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden bg-[#FAF9F5] p-3"
                onClick={() => onClick?.(product)}
            >
                {imageSrc && !imageError ? (
                    <img
                        src={imageSrc}
                        alt={`Foto produk ${product.name}`}
                        onError={() => setImageError(true)}
                        className={`h-full w-full object-contain transition-transform duration-300 group-hover:scale-105 ${
                            isOutOfStock ? 'grayscale-[40%]' : ''
                        }`}
                        loading="lazy"
                    />
                ) : (
                    <div className="bg-surface-subtle flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl p-2 text-center text-muted/60">
                        <Package className="size-7 stroke-[1.25] text-primary/30" />
                        <span className="text-ink-muted/70 line-clamp-1 text-[10px] font-medium">
                            {product.categoryName || 'Katalog'}
                        </span>
                    </div>
                )}

                {/* Badges Overlay */}
                <div className="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex items-center justify-between gap-1">
                    <div className="flex flex-wrap items-center gap-1">
                        {isOutOfStock ? (
                            <span className="bg-status-danger pointer-events-auto flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs">
                                <Ban className="size-2.5" />
                                <span>Habis</span>
                            </span>
                        ) : product.stockStatus === 'low_stock' ? (
                            <span className="pointer-events-auto rounded-full bg-[#FDF0D5] px-2 py-0.5 text-[10px] font-bold text-[#8C6212] shadow-xs">
                                {product.stockStatusLabel ||
                                    `Sisa ${product.stock}`}
                            </span>
                        ) : product.badge ? (
                            <span className="pointer-events-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold tracking-wide text-ink uppercase shadow-xs">
                                {product.badge}
                            </span>
                        ) : null}
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.(product.id);
                        }}
                        className={`pointer-events-auto flex size-7 cursor-pointer items-center justify-center rounded-full transition-colors ${
                            product.isFavorite
                                ? 'bg-surface text-danger shadow-xs'
                                : 'bg-surface/80 text-muted backdrop-blur-xs hover:text-ink'
                        }`}
                        aria-label={
                            product.isFavorite
                                ? `Hapus ${product.name} dari favorit`
                                : `Simpan ${product.name} ke favorit`
                        }
                    >
                        <Heart
                            className="size-3.5"
                            fill={product.isFavorite ? 'currentColor' : 'none'}
                        />
                    </button>
                </div>
            </div>

            {/* Content area */}
            <div className="flex flex-1 flex-col justify-between gap-2 p-3 sm:p-3.5">
                <div
                    className="cursor-pointer space-y-1.5"
                    onClick={() => onClick?.(product)}
                >
                    <div className="flex items-center">
                        <ProductSourceBadge
                            source={product.source}
                            ownerName={product.ownerName}
                        />
                    </div>

                    <h3 className="line-clamp-2 font-heading text-xs leading-snug font-semibold text-ink transition-colors group-hover:text-primary sm:text-sm">
                        {product.name}
                    </h3>
                </div>

                {/* Commercial Price & Action */}
                <div className="flex flex-col gap-2 border-t border-border/60 pt-2">
                    <PriceDisplay
                        amount={product.price}
                        originalAmount={product.originalPrice}
                        size="md"
                    />

                    <button
                        type="button"
                        disabled={isOutOfStock}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) {
                                onAddToCart?.(product);
                            }
                        }}
                        aria-label={
                            isOutOfStock
                                ? `${product.name} habis terjual`
                                : `Tambah ${product.name} ke keranjang`
                        }
                        className={`flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-all duration-150 select-none ${
                            isOutOfStock
                                ? 'cursor-not-allowed border border-border bg-[#F5F4EE] text-muted'
                                : product.isInCart
                                  ? 'cursor-pointer border border-[#C5DCD0] bg-primary-soft text-primary active:scale-98'
                                  : 'cursor-pointer bg-primary text-white shadow-xs hover:bg-primary-hover active:scale-98'
                        }`}
                    >
                        {isOutOfStock ? (
                            <span>Stok Habis</span>
                        ) : product.isInCart ? (
                            <>
                                <Check className="size-3.5" />
                                <span>Di Keranjang</span>
                            </>
                        ) : (
                            <>
                                <Plus className="size-3.5" />
                                <span>Tambah</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </article>
    );
};
