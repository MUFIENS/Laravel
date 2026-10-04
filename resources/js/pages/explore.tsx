import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Search,
    ShoppingBag,
    SlidersHorizontal,
    Package,
    Plus,
    Minus,
    Check,
    LoaderCircle,
    X,
    Store,
    UserCheck,
    BookOpen,
    Shirt,
    Ban,
    Sparkles,
    RefreshCw,
    User,
    UtensilsCrossed,
    CupSoda,
    Palette,
    Eye,
    ArrowUpDown,
    ExternalLink,
    ChevronRight,
    CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import type { Auth } from '@/types';

export interface CategoryItem {
    id: number;
    name: string;
    slug: string;
    description: string | null;
}

export interface ProductItem {
    id: number;
    category_id: number;
    name: string;
    slug: string;
    description: string | null;
    image_path: string | null;
    source_type: 'cooperative' | 'student';
    selling_price: number;
    stock: number;
    stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
    stock_status_label: string;
    is_featured: boolean;
    category: {
        id: number;
        name: string;
        slug: string;
    } | null;
    owner: {
        id: number;
        name: string;
    } | null;
}

export interface PaginatedProducts {
    data: ProductItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

export interface Filters {
    category: string;
    search: string;
    source: string;
    availability: string;
}

interface ExplorePageProps {
    products: PaginatedProducts;
    featuredProducts: ProductItem[];
    categories: CategoryItem[];
    filters: Filters;
    auth: Auth;
    cartCount: number;
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

export default function Explore({
    products,
    featuredProducts,
    categories,
    filters,
    cartCount,
}: ExplorePageProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const user = auth?.user;

    // Search and Filter State
    const [searchInput, setSearchInput] = useState(filters.search || '');
    const [addingProductId, setAddingProductId] = useState<number | null>(null);
    const [recentlyAddedId, setRecentlyAddedId] = useState<number | null>(null);

    // Interactive Marketplace Enhancements
    const [previewProduct, setPreviewProduct] = useState<ProductItem | null>(
        null,
    );
    const [previewQuantity, setPreviewQuantity] = useState<number>(1);
    const [previewAdding, setPreviewAdding] = useState(false);
    const [sortBy, setSortBy] = useState<
        'relevance' | 'price_low' | 'price_high' | 'stock_high'
    >('relevance');
    const searchInputRef = useRef<HTMLInputElement>(null);

    // Prevent background scrolling when Quick View modal is active
    useEffect(() => {
        if (previewProduct) {
            const originalOverflow = document.body.style.overflow;
            const originalPaddingRight = document.body.style.paddingRight;
            const scrollbarWidth =
                window.innerWidth - document.documentElement.clientWidth;

            document.body.style.overflow = 'hidden';
            if (scrollbarWidth > 0) {
                document.body.style.paddingRight = `${scrollbarWidth}px`;
            }

            return () => {
                document.body.style.overflow = originalOverflow;
                document.body.style.paddingRight = originalPaddingRight;
            };
        }
    }, [previewProduct]);

    // Keyboard shortcut '/' to focus search & 'Escape' to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === '/' &&
                document.activeElement !== searchInputRef.current
            ) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape' && previewProduct) {
                setPreviewProduct(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewProduct]);

    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    // Apply Filter Navigation
    const applyFilters = (updated: Partial<Filters>) => {
        const queryParams: Record<string, string> = {};

        const newCategory =
            updated.category !== undefined
                ? updated.category
                : filters.category;
        const newSearch =
            updated.search !== undefined ? updated.search : searchInput;
        const newSource =
            updated.source !== undefined ? updated.source : filters.source;
        const newAvailability =
            updated.availability !== undefined
                ? updated.availability
                : filters.availability;

        if (newCategory && newCategory !== 'all') {
            queryParams.category = newCategory;
        }
        if (newSearch && newSearch.trim() !== '') {
            queryParams.search = newSearch.trim();
        }
        if (newSource && newSource !== 'all') {
            queryParams.source = newSource;
        }
        if (newAvailability && newAvailability !== 'all') {
            queryParams.availability = newAvailability;
        }

        router.get('/explore', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilters({ search: searchInput });
    };

    const handleClearSearch = () => {
        setSearchInput('');
        applyFilters({ search: '' });
    };

    const handleResetAllFilters = () => {
        setSearchInput('');
        router.get(
            '/explore',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    // Quick Add to Cart with arbitrary quantity
    const handleAddToCart = (
        e: React.MouseEvent | null,
        product: ProductItem,
        quantity: number = 1,
    ) => {
        if (e) e.stopPropagation();

        if (!user) {
            toast.info('Silakan masuk untuk berbelanja di KOPDIG', {
                description: 'Anda akan diarahkan ke halaman login.',
            });
            router.visit('/login');
            return;
        }

        if (product.stock <= 0) {
            toast.error('Stok produk sedang habis');
            return;
        }

        setAddingProductId(product.id);

        router.post(
            '/cart/items',
            { product_id: product.id, quantity },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRecentlyAddedId(product.id);
                    toast.success('Berhasil ditambahkan ke keranjang!', {
                        description: `${quantity}x ${product.name} telah masuk ke pesanan Anda.`,
                    });
                    setTimeout(() => {
                        setRecentlyAddedId(null);
                    }, 2500);
                },
                onError: (errors) => {
                    const message =
                        errors.product_id ||
                        errors.quantity ||
                        'Gagal menambahkan ke keranjang';
                    toast.error(message);
                },
                onFinish: () => {
                    setAddingProductId(null);
                },
            },
        );
    };

    // Quick View Modal Add to Cart
    const handlePreviewAddToCart = () => {
        if (!previewProduct) return;
        setPreviewAdding(true);

        if (!user) {
            toast.info('Silakan masuk untuk berbelanja di KOPDIG');
            router.visit('/login');
            return;
        }

        router.post(
            '/cart/items',
            { product_id: previewProduct.id, quantity: previewQuantity },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setRecentlyAddedId(previewProduct.id);
                    toast.success('Berhasil ditambahkan ke keranjang!', {
                        description: `${previewQuantity}x ${previewProduct.name} telah masuk ke pesanan Anda.`,
                    });
                    setPreviewProduct(null);
                    setTimeout(() => {
                        setRecentlyAddedId(null);
                    }, 2500);
                },
                onError: (errors) => {
                    const message =
                        errors.product_id ||
                        errors.quantity ||
                        'Gagal menambahkan ke keranjang';
                    toast.error(message);
                },
                onFinish: () => {
                    setPreviewAdding(false);
                },
            },
        );
    };

    // Category Icons with accurate semantic representations:
    // Food/Jajanan -> UtensilsCrossed
    // Minuman -> CupSoda
    // ATK -> BookOpen
    // Atribut -> Shirt
    // Karya Siswa -> Palette
    const getCategoryIcon = (slug: string) => {
        switch (slug) {
            case 'jajanan':
                return <UtensilsCrossed className="size-3.5 text-amber-400" />;
            case 'minuman':
                return <CupSoda className="size-3.5 text-cyan-400" />;
            case 'atk-buku':
                return <BookOpen className="size-3.5 text-blue-400" />;
            case 'atribut-sekolah':
                return <Shirt className="size-3.5 text-emerald-400" />;
            case 'karya-siswa':
                return <Palette className="size-3.5 text-purple-400" />;
            default:
                return <Package className="size-3.5 text-[#A3A3A3]" />;
        }
    };

    // Distinct Theme Colors for Category Pills
    const getCategoryBadgeClass = (slug: string, isActive: boolean) => {
        if (isActive) {
            return 'bg-[#E34A27] text-white shadow-md shadow-[#E34A27]/25 border-transparent';
        }
        switch (slug) {
            case 'jajanan':
                return 'border-[#262626] bg-[#141414] text-[#D4D4D4] hover:border-amber-500/50 hover:text-amber-300';
            case 'minuman':
                return 'border-[#262626] bg-[#141414] text-[#D4D4D4] hover:border-cyan-500/50 hover:text-cyan-300';
            case 'atk-buku':
                return 'border-[#262626] bg-[#141414] text-[#D4D4D4] hover:border-blue-500/50 hover:text-blue-300';
            case 'atribut-sekolah':
                return 'border-[#262626] bg-[#141414] text-[#D4D4D4] hover:border-emerald-500/50 hover:text-emerald-300';
            case 'karya-siswa':
                return 'border-[#262626] bg-[#141414] text-[#D4D4D4] hover:border-purple-500/50 hover:text-purple-300';
            default:
                return 'border-[#262626] bg-[#141414] text-[#D4D4D4] hover:border-[#E34A27]/40 hover:text-[#F5F2EB]';
        }
    };

    // Filter and Sort Displayed Products
    const displayedProducts = useMemo(() => {
        const list = [...products.data];

        // Apply client-side sorting for instantaneous response
        if (sortBy === 'price_low') {
            list.sort((a, b) => a.selling_price - b.selling_price);
        } else if (sortBy === 'price_high') {
            list.sort((a, b) => b.selling_price - a.selling_price);
        } else if (sortBy === 'stock_high') {
            list.sort((a, b) => b.stock - a.stock);
        } else {
            // Relevance: Featured first, then available stock, then id
            list.sort((a, b) => {
                if (a.is_featured && !b.is_featured) return -1;
                if (!a.is_featured && b.is_featured) return 1;
                if (a.stock > 0 && b.stock <= 0) return -1;
                if (a.stock <= 0 && b.stock > 0) return 1;
                return b.id - a.id;
            });
        }

        return list;
    }, [products.data, sortBy]);

    const isFiltered =
        (filters.category && filters.category !== 'all') ||
        (filters.search && filters.search.trim() !== '') ||
        (filters.source && filters.source !== 'all') ||
        (filters.availability && filters.availability !== 'all');

    // Quick search tags for instant discovery
    const quickSearchSuggestions = [
        'Risol Mayo',
        'Pulpen Gel',
        'Teh Kotak',
        'Cookies Cokelat',
        'Dasi OSIS',
        'Karya Siswa',
    ];

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title="Katalog Pasar Sekolah — KOPDIG" />

            {/* 1. TOP COMMERCIAL HEADER (Sticky, Tokopedia-Class Ergonomics) */}
            <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#0A0A0A]/95 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3.5 py-2.5 sm:gap-6 sm:px-6 sm:py-3.5">
                    {/* Brand Emblem */}
                    <Link
                        href={user ? '/explore' : '/'}
                        className="group flex shrink-0 items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <div className="flex size-8 items-center justify-center bg-[#F5F2EB] font-heading text-xs font-black text-[#0A0A0A] transition-transform duration-300 group-hover:scale-95 group-hover:rotate-6">
                            K
                        </div>
                        <div className="hidden flex-col sm:flex">
                            <span className="font-heading text-sm leading-none font-bold tracking-tight text-[#F5F2EB]">
                                KOPDIG
                            </span>
                            <span className="mt-0.5 font-mono text-[9px] tracking-wider text-[#737373] uppercase">
                                Pasar Sekolah
                            </span>
                        </div>
                    </Link>

                    {/* Global Omnibox Search Bar with Keyboard Shortcut */}
                    <form
                        onSubmit={handleSearchSubmit}
                        className="relative flex min-w-0 flex-1 items-center"
                    >
                        <div className="relative w-full min-w-0">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#737373] sm:left-3.5 sm:size-4" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                placeholder="Cari jajanan, ATK, seragam, atau karya siswa..."
                                className="h-9 w-full min-w-0 rounded-full border border-[#262626] bg-[#141414] pr-10 pl-8.5 text-xs text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27]/30 focus:outline-hidden sm:h-11 sm:pr-12 sm:pl-10 sm:text-sm"
                            />
                            {searchInput && (
                                <div className="absolute top-1/2 right-2.5 flex -translate-y-1/2 items-center sm:right-3">
                                    <button
                                        type="button"
                                        onClick={handleClearSearch}
                                        className="rounded-full p-1 text-[#737373] transition-colors hover:bg-[#262626] hover:text-[#F5F2EB]"
                                        aria-label="Bersihkan pencarian"
                                    >
                                        <X className="size-3 sm:size-3.5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* Header Action Badges */}
                    <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
                        {/* Cart Button with Count Badge */}
                        <Link
                            href="/cart"
                            className="relative flex size-9 items-center justify-center rounded-full border border-[#262626] bg-[#141414] text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27] active:scale-95 sm:size-11"
                            aria-label={`Keranjang Belanja (${cartCount} item)`}
                        >
                            <ShoppingBag className="size-4 sm:size-4.5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-[#E34A27] px-1 font-mono text-[9px] font-bold text-white shadow-md shadow-[#E34A27]/30 sm:h-5 sm:min-w-5 sm:text-[10px]">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>

                        {/* Account Access */}
                        {user ? (
                            <Link
                                href={
                                    user.role === 'cooperative'
                                        ? '/cooperative'
                                        : '/orders'
                                }
                                className="flex items-center gap-2 rounded-full border border-[#262626] bg-[#141414] p-1.5 text-xs text-[#F5F2EB] transition-colors hover:border-[#E34A27] sm:py-2 sm:pr-4 sm:pl-2"
                            >
                                <div className="flex size-6 items-center justify-center rounded-full bg-[#262626] font-mono text-[10px] font-bold text-[#E34A27] sm:size-7 sm:text-[11px]">
                                    {user.name.charAt(0).toUpperCase()}
                                </div>
                                <span className="hidden max-w-[100px] truncate font-medium sm:inline">
                                    {user.name.split(' ')[0]}
                                </span>
                            </Link>
                        ) : (
                            <div className="flex items-center gap-1.5">
                                <Link
                                    href="/login"
                                    className="flex size-9 items-center justify-center rounded-full border border-[#262626] bg-[#141414] text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27] sm:hidden"
                                    aria-label="Masuk ke Akun"
                                >
                                    <User className="size-4" />
                                </Link>
                                <Link
                                    href="/login"
                                    className="hidden rounded-full border border-[#262626] bg-[#141414] px-3.5 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27] sm:inline-block"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href="/register"
                                    className="hidden rounded-full bg-[#E34A27] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#d03f1e] sm:inline-block"
                                >
                                    Daftar
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 2. MAIN CONTAINER */}
            <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
                {/* 2A. COMPACT COMMERCE HERO BANNER */}
                {!isFiltered && (
                    <section className="relative mb-8 overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] p-4.5 sm:p-8">
                        <div className="absolute inset-0 z-10 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/85 to-transparent" />
                        <img
                            src="/images/campaign/hero-editorial.jpg"
                            alt="Suasana Koperasi Digital KOPDIG"
                            className="absolute inset-0 h-full w-full object-cover opacity-35 contrast-125"
                            loading="eager"
                        />
                        <div className="relative z-20 max-w-2xl space-y-3">
                            <div className="inline-flex items-center gap-2 border border-[#262626] bg-[#0A0A0A]/80 px-2.5 py-1">
                                <span className="size-1.5 rounded-full bg-[#E34A27]" />
                                <span className="font-mono text-[10px] tracking-widest text-[#A3A3A3] uppercase">
                                    [ KATALOG RESMI KOPERASI SEKOLAH 2026 ]
                                </span>
                            </div>
                            <h1 className="font-heading text-2xl font-black tracking-tight text-[#F5F2EB] uppercase sm:text-3xl lg:text-4xl">
                                KARYA SISWA & KEBUTUHAN SEKOLAH HARIAN.
                            </h1>
                            <p className="text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                Platform transaksi resmi koperasi sekolah:
                                belanja jajanan istirahat, perlengkapan ATK,
                                hingga produk konsinyasi karya kreatif siswa
                                tanpa antrean tunai.
                            </p>

                            {/* Quick Search Tag Suggestions */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                                <span className="font-mono text-[11px] text-[#737373]">
                                    Pencarian Populer:
                                </span>
                                {quickSearchSuggestions.map((term) => (
                                    <button
                                        key={term}
                                        type="button"
                                        onClick={() => {
                                            setSearchInput(term);
                                            applyFilters({ search: term });
                                        }}
                                        className="cursor-pointer rounded-full border border-[#262626] bg-[#0A0A0A]/90 px-2.5 py-1 font-mono text-[10px] text-[#D4D4D4] transition-colors hover:border-[#E34A27] hover:text-[#E34A27]"
                                    >
                                        #{term}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {/* 2B. HORIZONTAL CATEGORY DISCOVERY RAIL (Scrollable, Tactile, Accurate Icons) */}
                <section className="mb-6">
                    <div className="flex items-center justify-between pb-3">
                        <div className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-[#E34A27]" />
                            <h2 className="font-mono text-xs tracking-wider text-[#A3A3A3] uppercase">
                                Kategori Belanja
                            </h2>
                        </div>
                        {filters.category && filters.category !== 'all' && (
                            <button
                                type="button"
                                onClick={() =>
                                    applyFilters({ category: 'all' })
                                }
                                className="cursor-pointer font-mono text-[11px] text-[#E34A27] hover:underline"
                            >
                                Tampilkan Semua
                            </button>
                        )}
                    </div>

                    <div className="flex scrollbar-none items-center gap-2 overflow-x-auto pb-2">
                        {/* "Semua" Chip */}
                        <button
                            type="button"
                            onClick={() => applyFilters({ category: 'all' })}
                            className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all select-none ${
                                !filters.category || filters.category === 'all'
                                    ? 'border-transparent bg-[#E34A27] text-white shadow-md shadow-[#E34A27]/25'
                                    : 'border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#E34A27]/40 hover:text-[#F5F2EB]'
                            }`}
                        >
                            <Package className="size-3.5" />
                            <span>Semua Kategori</span>
                            <span className="py-0.2 ml-0.5 rounded-full bg-white/10 px-1.5 font-mono text-[10px]">
                                {products.total}
                            </span>
                        </button>

                        {/* Database Categories Chips with Semantic Icons */}
                        {categories.map((cat) => {
                            const isActive = filters.category === cat.slug;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() =>
                                        applyFilters({ category: cat.slug })
                                    }
                                    className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-all select-none ${getCategoryBadgeClass(
                                        cat.slug,
                                        isActive,
                                    )}`}
                                >
                                    {getCategoryIcon(cat.slug)}
                                    <span>{cat.name}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 2C. STUDENT CREATOR SPOTLIGHT & BULLETIN CARD (Engaging Context) */}
                {!isFiltered && (
                    <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-[#1C140C] to-[#141414] p-4.5 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-amber-400">
                                        <Sparkles className="size-3.5" />
                                        <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
                                            KREATOR SISWA MINGGU INI
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-base font-bold text-[#F5F2EB]">
                                        Risol Mayo Siti (Tata Boga)
                                    </h3>
                                    <p className="max-w-md text-xs leading-relaxed text-[#A3A3A3]">
                                        Dibuat segar setiap pagi dengan isian
                                        smoked beef & keju lumer. Terjual habis
                                        tiap jam istirahat pertama!
                                    </p>
                                </div>
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                                    <UtensilsCrossed className="size-4.5" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        applyFilters({ source: 'student' })
                                    }
                                    className="flex cursor-pointer items-center gap-1 font-mono text-xs font-semibold text-amber-400 hover:text-amber-300"
                                >
                                    <span>Eksplor Produk Titipan Siswa</span>
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-[#0C141C] to-[#141414] p-4.5 sm:p-5">
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-1.5 text-blue-400">
                                        <BookOpen className="size-3.5" />
                                        <span className="font-mono text-[10px] font-bold tracking-wider uppercase">
                                            PERSIAPAN KELAS & UJIAN
                                        </span>
                                    </div>
                                    <h3 className="font-heading text-base font-bold text-[#F5F2EB]">
                                        Paket ATK Resmi Sekolah
                                    </h3>
                                    <p className="max-w-md text-xs leading-relaxed text-[#A3A3A3]">
                                        Pulpen Standard Gel 0.5mm & Buku Tulis
                                        standar siap pakai langsung di etalase
                                        koperasi.
                                    </p>
                                </div>
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                                    <BookOpen className="size-4.5" />
                                </span>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() =>
                                        applyFilters({ category: 'atk-buku' })
                                    }
                                    className="flex cursor-pointer items-center gap-1 font-mono text-xs font-semibold text-blue-400 hover:text-blue-300"
                                >
                                    <span>Lihat Semua ATK & Buku</span>
                                    <ChevronRight className="size-3.5" />
                                </button>
                            </div>
                        </div>
                    </section>
                )}

                {/* 2D. FEATURED PRODUCTS HORIZONTAL RAIL (When not searching) */}
                {!isFiltered && featuredProducts.length > 0 && (
                    <section className="mb-10 rounded-2xl border border-[#262626] bg-[#141414]/60 p-4 sm:p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <span className="size-2 rounded-full bg-[#D5A84C]" />
                                    <h2 className="font-heading text-base font-bold tracking-tight text-[#F5F2EB] uppercase sm:text-lg">
                                        Pilihan Unggulan Koperasi & Siswa
                                    </h2>
                                </div>
                                <p className="text-xs text-[#737373]">
                                    Produk kurasi terbaik dengan permintaan
                                    tinggi minggu ini.
                                </p>
                            </div>
                            <span className="hidden font-mono text-[10px] tracking-wider text-[#A3A3A3] uppercase sm:inline">
                                [ KURASI MINGGU INI ]
                            </span>
                        </div>

                        {/* Horizontal Rail Cards */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                            {featuredProducts.map((p) => (
                                <ProductCardItem
                                    key={p.id}
                                    product={p}
                                    onAddToCart={handleAddToCart}
                                    onQuickView={() => {
                                        setPreviewProduct(p);
                                        setPreviewQuantity(1);
                                    }}
                                    isAdding={addingProductId === p.id}
                                    isJustAdded={recentlyAddedId === p.id}
                                />
                            ))}
                        </div>
                    </section>
                )}

                {/* 2E. MULTI-FACET FILTER & SORT CONTROLS */}
                <section className="mb-6 flex flex-col gap-3 border-b border-[#1C1C1C] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left: Product Counts & Status */}
                    <div className="flex flex-wrap items-center gap-2">
                        <SlidersHorizontal className="size-4 text-[#E34A27]" />
                        <span className="font-heading text-sm font-bold tracking-tight text-[#F5F2EB]">
                            Katalog Produk
                        </span>
                        <span className="rounded-md border border-[#262626] bg-[#141414] px-2 py-0.5 font-mono text-xs text-[#A3A3A3]">
                            {displayedProducts.length} item
                        </span>
                        {isFiltered && (
                            <button
                                type="button"
                                onClick={handleResetAllFilters}
                                className="flex cursor-pointer items-center gap-1 rounded-full border border-[#262626] bg-[#141414] px-2.5 py-0.5 font-mono text-[10px] text-[#E34A27] transition-colors hover:bg-[#E34A27] hover:text-white"
                            >
                                <RefreshCw className="size-2.5" />
                                <span>Reset Filter</span>
                            </button>
                        )}
                    </div>

                    {/* Right: Facet Filters & Client Sorting */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Instant Sort Menu */}
                        <div className="flex items-center gap-1 rounded-full border border-[#262626] bg-[#141414] px-2.5 py-1 text-xs">
                            <ArrowUpDown className="size-3 text-[#737373]" />
                            <select
                                value={sortBy}
                                onChange={(e) =>
                                    setSortBy(e.target.value as any)
                                }
                                className="cursor-pointer bg-transparent text-[11px] font-medium text-[#F5F2EB] focus:outline-hidden"
                                aria-label="Urutkan Katalog"
                            >
                                <option
                                    value="relevance"
                                    className="bg-[#141414] text-[#F5F2EB]"
                                >
                                    Urutan: Rekomendasi
                                </option>
                                <option
                                    value="price_low"
                                    className="bg-[#141414] text-[#F5F2EB]"
                                >
                                    Harga: Termurah
                                </option>
                                <option
                                    value="price_high"
                                    className="bg-[#141414] text-[#F5F2EB]"
                                >
                                    Harga: Tertinggi
                                </option>
                                <option
                                    value="stock_high"
                                    className="bg-[#141414] text-[#F5F2EB]"
                                >
                                    Stok: Terbanyak
                                </option>
                            </select>
                        </div>

                        {/* Source Filter: Semua, Koperasi, Titipan Siswa */}
                        <div className="flex rounded-full border border-[#262626] bg-[#141414] p-0.5 text-xs">
                            <button
                                type="button"
                                onClick={() => applyFilters({ source: 'all' })}
                                className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    !filters.source || filters.source === 'all'
                                        ? 'bg-[#262626] font-semibold text-[#F5F2EB]'
                                        : 'text-[#737373] hover:text-[#F5F2EB]'
                                }`}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    applyFilters({ source: 'cooperative' })
                                }
                                className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    filters.source === 'cooperative'
                                        ? 'bg-[#2E795A]/30 font-semibold text-emerald-400'
                                        : 'text-[#737373] hover:text-emerald-400'
                                }`}
                            >
                                <Store className="size-3" />
                                <span>Koperasi</span>
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    applyFilters({ source: 'student' })
                                }
                                className={`flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                    filters.source === 'student'
                                        ? 'bg-[#D5A84C]/30 font-semibold text-amber-400'
                                        : 'text-[#737373] hover:text-amber-400'
                                }`}
                            >
                                <UserCheck className="size-3" />
                                <span>Titipan Siswa</span>
                            </button>
                        </div>

                        {/* Availability Filter Toggle */}
                        <button
                            type="button"
                            onClick={() =>
                                applyFilters({
                                    availability:
                                        filters.availability === 'in_stock'
                                            ? 'all'
                                            : 'in_stock',
                                })
                            }
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                                filters.availability === 'in_stock'
                                    ? 'border-[#2E795A] bg-[#2E795A]/20 text-emerald-400'
                                    : 'border-[#262626] bg-[#141414] text-[#737373] hover:text-[#F5F2EB]'
                            }`}
                        >
                            <span
                                className={`size-1.5 rounded-full ${
                                    filters.availability === 'in_stock'
                                        ? 'bg-emerald-400'
                                        : 'bg-[#525252]'
                                }`}
                            />
                            <span>Hanya Stok Tersedia</span>
                        </button>
                    </div>
                </section>

                {/* 2F. PRODUCT DISCOVERY GRID (2 Columns Mobile, 3 Tablet, 4 Desktop) */}
                {displayedProducts.length > 0 ? (
                    <section className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {displayedProducts.map((product) => (
                            <ProductCardItem
                                key={product.id}
                                product={product}
                                onAddToCart={handleAddToCart}
                                onQuickView={() => {
                                    setPreviewProduct(product);
                                    setPreviewQuantity(1);
                                }}
                                isAdding={addingProductId === product.id}
                                isJustAdded={recentlyAddedId === product.id}
                            />
                        ))}
                    </section>
                ) : (
                    /* 2G. EMPTY STATE */
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#262626] bg-[#141414]/50 py-16 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-[#1C1C1C] text-[#737373]">
                            <Package className="size-7" />
                        </div>
                        <h3 className="mt-4 font-heading text-lg font-bold text-[#F5F2EB]">
                            Tidak ada produk ditemukan
                        </h3>
                        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#737373]">
                            {filters.search
                                ? `Tidak ada barang yang cocok dengan kata kunci "${filters.search}".`
                                : 'Belum ada produk aktif yang memenuhi kriteria filter saat ini.'}
                        </p>
                        <button
                            type="button"
                            onClick={handleResetAllFilters}
                            className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#E34A27] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#d03f1e]"
                        >
                            <RefreshCw className="size-3.5" />
                            <span>Lihat Semua Produk</span>
                        </button>
                    </div>
                )}

                {/* 2H. SERVER-DRIVEN PAGINATION */}
                {products.last_page > 1 && (
                    <nav
                        aria-label="Paginasi Katalog"
                        className="mt-10 flex flex-wrap items-center justify-center gap-1.5 border-t border-[#1C1C1C] pt-6 font-mono text-xs"
                    >
                        {products.links.map((link, idx) => {
                            if (!link.url) {
                                return (
                                    <span
                                        key={idx}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                        className="rounded-lg border border-[#1C1C1C] px-3 py-2 text-[#404040] select-none"
                                    />
                                );
                            }

                            return (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    preserveScroll
                                    preserveState
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                    className={`rounded-lg px-3 py-2 font-medium transition-colors ${
                                        link.active
                                            ? 'border border-[#E34A27] bg-[#E34A27] font-bold text-white'
                                            : 'border border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#E34A27]/50 hover:text-[#F5F2EB]'
                                    }`}
                                />
                            );
                        })}
                    </nav>
                )}
            </main>

            {/* 3. INTERACTIVE QUICK VIEW MODAL (Background Scroll Locked) */}
            {previewProduct && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overscroll-contain bg-black/80 p-4 backdrop-blur-sm transition-opacity"
                    onClick={() => setPreviewProduct(null)}
                    role="dialog"
                    aria-modal="true"
                    aria-label={`Pratinjau ${previewProduct.name}`}
                >
                    <div
                        className="relative my-auto max-h-[90vh] w-full max-w-2xl overflow-y-auto overscroll-contain rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-7"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            onClick={() => setPreviewProduct(null)}
                            className="absolute top-4 right-4 z-20 flex size-8 items-center justify-center rounded-full border border-[#262626] bg-[#1C1C1C]/90 text-[#A3A3A3] shadow-md backdrop-blur-sm transition-all hover:border-[#E34A27] hover:bg-[#262626] hover:text-white active:scale-95 sm:size-9"
                            aria-label="Tutup Pratinjau"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                            {/* Product Visual Container */}
                            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-[#1C1C1C]">
                                {previewProduct.image_path ? (
                                    <img
                                        src={previewProduct.image_path}
                                        alt={previewProduct.name}
                                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-6 text-[#737373]">
                                        {getCategoryIcon(
                                            previewProduct.category?.slug || '',
                                        )}
                                        <span className="font-mono text-xs">
                                            {previewProduct.category?.name ||
                                                'Katalog KOPDIG'}
                                        </span>
                                    </div>
                                )}

                                {/* Stock status pill */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                    {previewProduct.stock <= 0 ? (
                                        <span className="flex items-center gap-1 rounded-full border border-red-500/40 bg-red-950/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-red-300">
                                            <Ban className="size-3" />
                                            <span>Stok Habis</span>
                                        </span>
                                    ) : previewProduct.stock <= 5 ? (
                                        <span className="rounded-full border border-amber-500/40 bg-amber-950/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                            Sisa {previewProduct.stock} unit
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-950/80 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
                                            <CheckCircle2 className="size-3" />
                                            <span>
                                                Tersedia ({previewProduct.stock}
                                                )
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Product Information & Quantity Controls */}
                            <div className="flex flex-col justify-between space-y-4">
                                <div className="pr-10 sm:pr-12">
                                    {/* Category & Provenance Tags */}
                                    <div className="flex flex-wrap items-center gap-2 pb-1.5">
                                        <span className="shrink-0 rounded-full border border-[#262626] bg-[#1C1C1C] px-2.5 py-0.5 font-mono text-[10px] text-[#A3A3A3]">
                                            {previewProduct.category?.name ||
                                                'Katalog'}
                                        </span>
                                        {previewProduct.source_type ===
                                        'student' ? (
                                            <span
                                                className="inline-flex max-w-[200px] items-center gap-1 rounded-full border border-amber-500/30 bg-amber-950/40 px-2.5 py-0.5 font-mono text-[10px] text-amber-300 sm:max-w-[240px]"
                                                title={`Titipan: ${previewProduct.owner?.name || 'Siswa'}`}
                                            >
                                                <UserCheck className="size-2.5 shrink-0" />
                                                <span className="truncate">
                                                    Titipan:{' '}
                                                    {previewProduct.owner
                                                        ?.name || 'Siswa'}
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] text-emerald-400">
                                                <Store className="size-2.5 shrink-0" />
                                                <span>Resmi Koperasi</span>
                                            </span>
                                        )}
                                    </div>

                                    {/* Title */}
                                    <h2 className="font-heading text-lg font-bold text-[#F5F2EB] sm:text-xl">
                                        {previewProduct.name}
                                    </h2>

                                    {/* Price */}
                                    <div className="mt-2 text-xl font-black text-[#E34A27] sm:text-2xl">
                                        {formatRupiah(
                                            previewProduct.selling_price,
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="mt-3 text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                        {previewProduct.description ||
                                            'Produk berkualitas resmi koperasi sekolah, siap dipesan untuk kemudahan aktivitas sekolah.'}
                                    </p>
                                </div>

                                {/* Interactive Quantity Stepper & Subtotal */}
                                <div className="space-y-3 rounded-2xl border border-[#262626] bg-[#191919] p-3.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium text-[#737373]">
                                            Jumlah Pesanan:
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={previewQuantity <= 1}
                                                onClick={() =>
                                                    setPreviewQuantity((q) =>
                                                        Math.max(1, q - 1),
                                                    )
                                                }
                                                className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[#333] bg-[#222] text-[#F5F2EB] transition-colors hover:border-[#E34A27] disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Kurangi jumlah"
                                            >
                                                <Minus className="size-3" />
                                            </button>
                                            <span className="min-w-6 text-center font-mono font-bold text-[#F5F2EB]">
                                                {previewQuantity}
                                            </span>
                                            <button
                                                type="button"
                                                disabled={
                                                    previewQuantity >=
                                                    previewProduct.stock
                                                }
                                                onClick={() =>
                                                    setPreviewQuantity((q) =>
                                                        Math.min(
                                                            previewProduct.stock,
                                                            q + 1,
                                                        ),
                                                    )
                                                }
                                                className="flex size-7 cursor-pointer items-center justify-center rounded-lg border border-[#333] bg-[#222] text-[#F5F2EB] transition-colors hover:border-[#E34A27] disabled:cursor-not-allowed disabled:opacity-40"
                                                aria-label="Tambah jumlah"
                                            >
                                                <Plus className="size-3" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between border-t border-[#262626] pt-2 text-xs">
                                        <span className="text-[#A3A3A3]">
                                            Subtotal:
                                        </span>
                                        <span className="font-heading text-sm font-bold text-[#F5F2EB]">
                                            {formatRupiah(
                                                previewProduct.selling_price *
                                                    previewQuantity,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="space-y-2 pt-1">
                                    <button
                                        type="button"
                                        disabled={
                                            previewProduct.stock <= 0 ||
                                            previewAdding
                                        }
                                        onClick={handlePreviewAddToCart}
                                        className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E34A27] text-xs font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#d03f1e] active:scale-95 disabled:cursor-not-allowed disabled:bg-[#262626] disabled:text-[#525252]"
                                    >
                                        {previewAdding ? (
                                            <>
                                                <LoaderCircle className="size-4 animate-spin" />
                                                <span>
                                                    Menambahkan ke Keranjang...
                                                </span>
                                            </>
                                        ) : previewProduct.stock <= 0 ? (
                                            <span>Stok Habis</span>
                                        ) : (
                                            <>
                                                <ShoppingBag className="size-4" />
                                                <span>
                                                    Tambah {previewQuantity} ke
                                                    Keranjang
                                                </span>
                                            </>
                                        )}
                                    </button>

                                    <Link
                                        href={`/products/${previewProduct.slug || previewProduct.id}`}
                                        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-[#262626] bg-[#191919] text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#E34A27] hover:text-[#F5F2EB]"
                                    >
                                        <span>Buka Halaman Detail Produk</span>
                                        <ExternalLink className="size-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. MOBILE FLOATING BOTTOM NAVIGATION DOCK */}
            <BottomNavigation
                activeTab="explore"
                cartCount={cartCount}
                className="md:hidden"
            />

            {/* Bottom spacer for mobile floating dock */}
            <div className="h-24 md:hidden" />
        </div>
    );
}

// -------------------------------------------------------------
// PRODUCT CARD COMPONENT (KOPDIG Commercial Craftsmanship)
// -------------------------------------------------------------
interface ProductCardItemProps {
    product: ProductItem;
    onAddToCart: (
        e: React.MouseEvent,
        product: ProductItem,
        quantity?: number,
    ) => void;
    onQuickView: () => void;
    isAdding: boolean;
    isJustAdded: boolean;
}

function ProductCardItem({
    product,
    onAddToCart,
    onQuickView,
    isAdding,
    isJustAdded,
}: ProductCardItemProps) {
    const [imageFailed, setImageFailed] = useState(false);
    const isOutOfStock =
        product.stock <= 0 || product.stock_status === 'out_of_stock';
    const isLowStock = product.stock_status === 'low_stock';

    const productDetailHref = `/products/${product.slug || product.id}`;

    return (
        <article className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] transition-all duration-300 hover:border-[#E34A27]/40 hover:shadow-xl hover:shadow-black/60">
            {/* Clickable Card Body */}
            <Link
                href={productDetailHref}
                className="flex flex-1 flex-col select-none"
            >
                {/* 1. Square Image Container */}
                <div className="relative aspect-square w-full overflow-hidden bg-[#1A1A1A]">
                    {product.image_path && !imageFailed ? (
                        <img
                            src={product.image_path}
                            alt={product.name}
                            onError={() => setImageFailed(true)}
                            loading="lazy"
                            className={`h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                                isOutOfStock ? 'opacity-60 grayscale' : ''
                            }`}
                        />
                    ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 p-4 text-center text-[#525252]">
                            <Package className="size-8 stroke-[1.25] text-[#737373]" />
                            <span className="font-mono text-[9px] tracking-wider text-[#525252] uppercase">
                                {product.category?.name || 'Katalog'}
                            </span>
                        </div>
                    )}

                    {/* Stock & Status Overlay Badges */}
                    <div className="pointer-events-none absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between gap-1">
                        <div className="flex flex-wrap gap-1">
                            {isOutOfStock ? (
                                <span className="flex items-center gap-1 rounded-full border border-red-500/30 bg-red-950/80 px-2 py-0.5 font-mono text-[9px] font-bold text-red-300 shadow-sm backdrop-blur-xs">
                                    <Ban className="size-2.5" />
                                    <span>Habis</span>
                                </span>
                            ) : isLowStock ? (
                                <span className="rounded-full border border-amber-500/30 bg-amber-950/80 px-2 py-0.5 font-mono text-[9px] font-bold text-amber-300 shadow-sm backdrop-blur-xs">
                                    {product.stock_status_label ||
                                        `Sisa ${product.stock}`}
                                </span>
                            ) : product.is_featured ? (
                                <span className="rounded-full border border-[#D5A84C]/40 bg-[#D5A84C]/20 px-2 py-0.5 font-mono text-[9px] font-bold text-[#E5BA60] shadow-sm backdrop-blur-xs">
                                    Unggulan
                                </span>
                            ) : null}
                        </div>
                    </div>

                    {/* Quick View Floating Button */}
                    <div className="absolute top-2.5 right-2.5 z-10 transition-opacity">
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onQuickView();
                            }}
                            className="flex size-7.5 cursor-pointer items-center justify-center rounded-full border border-[#333] bg-[#0A0A0A]/80 text-[#D4D4D4] backdrop-blur-md transition-all hover:border-[#E34A27] hover:bg-[#E34A27] hover:text-white active:scale-90"
                            title="Pratinjau Cepat"
                            aria-label="Pratinjau Cepat"
                        >
                            <Eye className="size-3.5" />
                        </button>
                    </div>
                </div>

                {/* 2. Metadata & Title */}
                <div className="flex flex-1 flex-col justify-between p-3 sm:p-4">
                    <div className="space-y-1.5">
                        {/* Source Provenance Badge */}
                        <div>
                            {product.source_type === 'student' ? (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full border border-[#D5A84C]/30 bg-[#D5A84C]/10 px-2 py-0.5 font-mono text-[10px] text-[#E5BA60]"
                                    title={`Karya titipan siswa: ${product.owner?.name || 'Siswa'}`}
                                >
                                    <UserCheck className="size-2.5 text-[#D5A84C]" />
                                    <span className="max-w-[110px] truncate">
                                        Titipan:{' '}
                                        {product.owner?.name?.split(' ')[0] ||
                                            'Siswa'}
                                    </span>
                                </span>
                            ) : (
                                <span
                                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] text-emerald-400"
                                    title="Produk resmi pengadaan Koperasi Sekolah"
                                >
                                    <Store className="size-2.5 text-emerald-400" />
                                    <span>Koperasi</span>
                                </span>
                            )}
                        </div>

                        {/* Product Title */}
                        <h3 className="line-clamp-2 font-heading text-xs leading-snug font-bold tracking-tight text-[#F5F2EB] transition-colors group-hover:text-[#E34A27] sm:text-sm">
                            {product.name}
                        </h3>
                    </div>

                    {/* 3. Price Display */}
                    <div className="mt-3 border-t border-[#1F1F1F] pt-2">
                        <span className="font-heading text-sm font-extrabold tracking-tight text-[#F5F2EB] sm:text-base">
                            {formatRupiah(product.selling_price)}
                        </span>
                    </div>
                </div>
            </Link>

            {/* Quick Action Button (Add to Cart) */}
            <div className="px-3 pb-3 sm:px-4 sm:pb-4">
                <button
                    type="button"
                    disabled={isOutOfStock || isAdding}
                    onClick={(e) => onAddToCart(e, product, 1)}
                    aria-label={`Tambah ${product.name} ke keranjang`}
                    className={`flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-xs font-semibold tracking-wide transition-all select-none active:scale-95 ${
                        isOutOfStock
                            ? 'cursor-not-allowed border border-[#262626] bg-[#1A1A1A] text-[#525252]'
                            : isJustAdded
                              ? 'border border-emerald-500/40 bg-emerald-950/60 text-emerald-400'
                              : 'bg-[#E34A27] text-white shadow-md shadow-[#E34A27]/20 hover:bg-[#d03f1e] hover:shadow-lg hover:shadow-[#E34A27]/30'
                    }`}
                >
                    {isAdding ? (
                        <>
                            <LoaderCircle className="size-3.5 animate-spin" />
                            <span>Menambah...</span>
                        </>
                    ) : isJustAdded ? (
                        <>
                            <Check className="size-3.5 text-emerald-400" />
                            <span>Di Keranjang</span>
                        </>
                    ) : isOutOfStock ? (
                        <span>Stok Habis</span>
                    ) : (
                        <>
                            <Plus className="size-3.5" />
                            <span>Tambah</span>
                        </>
                    )}
                </button>
            </div>
        </article>
    );
}

Explore.layout = (page: React.ReactNode) => page;
