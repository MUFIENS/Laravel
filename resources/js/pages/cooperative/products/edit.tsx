import React, { useState } from 'react';
import { Link, useForm, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Lock,
    Save,
    ShieldCheck,
} from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import type { Category, Product } from '@/types/consignment';

type Props = {
    product: Product;
    categories: Category[];
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeProductEdit({ product, categories }: Props) {
    const { flash } = usePage<PageProps>().props;
    const isConsignment = product.source_type === 'student';

    // Interactive state for live pricing calculations
    const [marginInput, setMarginInput] = useState<string>(
        String(product.cooperative_margin),
    );
    const [basePriceInput, setBasePriceInput] = useState<string>(
        String(product.base_price),
    );

    const parsedMargin = Math.max(0, parseInt(marginInput, 10) || 0);
    const parsedBasePrice = isConsignment
        ? product.base_price
        : Math.max(0, parseInt(basePriceInput, 10) || 0);

    const calculatedSellingPrice = parsedBasePrice + parsedMargin;

    const form = useForm({
        name: product.name,
        category_id: product.category_id,
        description: product.description,
        base_price: product.base_price,
        cooperative_margin: product.cooperative_margin,
        status: product.status,
        is_featured: product.is_featured,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        form.transform((data) => ({
            ...data,
            base_price: isConsignment ? product.base_price : parsedBasePrice,
            cooperative_margin: parsedMargin,
        }));

        form.put(`/cooperative/products/${product.slug}`);
    };

    return (
        <CooperativeShell
            activeNav="products"
            title={`Ubah Produk — ${product.name}`}
            subtitle="Perbarui data spesifikasi produk, atur penyesuaian margin koperasi, dan kelola status etalase katalog."
            breadcrumbs={[
                { label: 'Katalog Produk', href: '/cooperative/products' },
                {
                    label: product.name,
                    href: `/cooperative/products/${product.slug}`,
                },
                { label: 'Ubah Data' },
            ]}
        >
            <div className="space-y-6">
                {/* Back Link */}
                <div>
                    <Link
                        href={`/cooperative/products/${product.slug}`}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-xs transition-colors hover:bg-[var(--color-surface-subtle)]"
                    >
                        <ArrowLeft className="size-4" aria-hidden="true" />
                        <span>Batal & Kembali ke Detail Produk</span>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-900 shadow-xs"
                        role="alert"
                    >
                        <CheckCircle2
                            className="mt-0.5 size-5 shrink-0 text-emerald-600"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold">Aksi Berhasil</p>
                            <p className="mt-0.5">{flash.success}</p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-xs text-rose-900 shadow-xs"
                        role="alert"
                    >
                        <AlertTriangle
                            className="mt-0.5 size-5 shrink-0 text-rose-600"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold">Terjadi Kesalahan</p>
                            <p className="mt-0.5">{flash.error}</p>
                        </div>
                    </div>
                )}

                {/* Ownership Notice Banner */}
                {isConsignment && (
                    <div className="rounded-2xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]/50 p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary)]">
                            <ShieldCheck
                                className="size-4"
                                aria-hidden="true"
                            />
                            <span>
                                Aturan Bisnis Titipan Siswa (Konsinyasi)
                            </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--color-ink-muted)]">
                            Kepemilikan produk tetap atas nama siswa penyetor (
                            <span className="font-semibold text-[var(--color-ink)]">
                                {product.owner?.name}
                            </span>
                            ). Harga modal dasar siswa bersifat tetap sesuai
                            persetujuan awal. Koperasi hanya berwenang
                            menyesuaikan margin koperasi dan status etalase.
                        </p>
                    </div>
                )}

                {/* Form Grid */}
                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-6 lg:grid-cols-3"
                >
                    {/* Left 2 Cols: Main Info & Pricing Form */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* Basic Information Card */}
                        <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs sm:p-6">
                            <h3 className="font-display border-b border-[var(--color-border-subtle)] pb-3 text-sm font-bold text-[var(--color-ink)]">
                                Informasi Pokok Produk
                            </h3>

                            {/* Product Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Nama Produk{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Category Select */}
                            <div>
                                <label
                                    htmlFor="category_id"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Kategori Produk{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="category_id"
                                    required
                                    value={form.data.category_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'category_id',
                                            parseInt(e.target.value, 10),
                                        )
                                    }
                                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                >
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.category_id && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {form.errors.category_id}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Deskripsi & Spesifikasi Produk{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    required
                                    rows={4}
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                />
                                {form.errors.description && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {form.errors.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Pricing & Financial Structure Card */}
                        <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs sm:p-6">
                            <h3 className="font-display border-b border-[var(--color-border-subtle)] pb-3 text-sm font-bold text-[var(--color-ink)]">
                                Struktur Harga & Margin Koperasi
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Base Price */}
                                <div>
                                    <label
                                        htmlFor="base_price"
                                        className="block text-xs font-semibold text-[var(--color-ink)]"
                                    >
                                        Harga Pokok / Modal Siswa (Rp)
                                    </label>
                                    {isConsignment ? (
                                        <div className="mt-1 flex min-h-[44px] items-center justify-between rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/70 px-3 py-2 font-mono text-xs text-[var(--color-ink)]">
                                            <span>
                                                Rp{' '}
                                                {product.base_price.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-ink-muted)]">
                                                <Lock
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                <span>Terkunci</span>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="relative mt-1">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[var(--color-ink-muted)]">
                                                Rp
                                            </span>
                                            <input
                                                id="base_price"
                                                type="number"
                                                required
                                                min={0}
                                                step={500}
                                                value={basePriceInput}
                                                onChange={(e) => {
                                                    setBasePriceInput(
                                                        e.target.value,
                                                    );
                                                    form.setData(
                                                        'base_price',
                                                        parseInt(
                                                            e.target.value,
                                                            10,
                                                        ) || 0,
                                                    );
                                                }}
                                                className="min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] pr-3 pl-9 font-mono text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                            />
                                        </div>
                                    )}
                                    {form.errors.base_price && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {form.errors.base_price}
                                        </p>
                                    )}
                                </div>

                                {/* Cooperative Margin */}
                                <div>
                                    <label
                                        htmlFor="cooperative_margin"
                                        className="block text-xs font-semibold text-[var(--color-ink)]"
                                    >
                                        Margin Koperasi (Rp){' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative mt-1">
                                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[var(--color-ink-muted)]">
                                            Rp
                                        </span>
                                        <input
                                            id="cooperative_margin"
                                            type="number"
                                            required
                                            min={0}
                                            step={500}
                                            value={marginInput}
                                            onChange={(e) => {
                                                setMarginInput(e.target.value);
                                                form.setData(
                                                    'cooperative_margin',
                                                    parseInt(
                                                        e.target.value,
                                                        10,
                                                    ) || 0,
                                                );
                                            }}
                                            className="min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] pr-3 pl-9 font-mono text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                        />
                                    </div>
                                    {form.errors.cooperative_margin && (
                                        <p className="mt-1 text-xs text-rose-600">
                                            {form.errors.cooperative_margin}
                                        </p>
                                    )}

                                    {/* Presets */}
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {[
                                            '500',
                                            '1000',
                                            '1500',
                                            '2000',
                                            '3000',
                                        ].map((preset) => (
                                            <button
                                                key={preset}
                                                type="button"
                                                onClick={() => {
                                                    setMarginInput(preset);
                                                    form.setData(
                                                        'cooperative_margin',
                                                        parseInt(preset, 10),
                                                    );
                                                }}
                                                className={`min-h-[36px] rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${
                                                    marginInput === preset
                                                        ? 'bg-[var(--color-primary)] text-white'
                                                        : 'border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-ink)] hover:bg-[var(--color-surface)]'
                                                }`}
                                            >
                                                +Rp{' '}
                                                {parseInt(
                                                    preset,
                                                    10,
                                                ).toLocaleString('id-ID')}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Interactive Formula Visualization */}
                            <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]/50 p-4 text-xs">
                                <span className="text-[10px] font-bold tracking-wider text-[var(--color-primary)] uppercase">
                                    Kalkulasi Harga Jual Katalog KOPDIG
                                </span>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                                        <span>Harga Pokok / Modal:</span>
                                        <span className="font-mono">
                                            <PriceDisplay
                                                amount={parsedBasePrice}
                                                size="sm"
                                            />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[var(--color-ink-muted)]">
                                        <span>Margin Koperasi (+):</span>
                                        <span className="font-mono font-semibold text-[var(--color-primary)]">
                                            <PriceDisplay
                                                amount={parsedMargin}
                                                size="sm"
                                            />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[var(--color-primary)]/20 pt-2 text-sm font-bold text-[var(--color-primary)]">
                                        <span>Harga Jual Publik:</span>
                                        <span className="font-mono">
                                            <PriceDisplay
                                                amount={calculatedSellingPrice}
                                                size="sm"
                                            />
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right 1 Col: Status & Controls */}
                    <div className="space-y-6">
                        {/* Status & Catalog Controls */}
                        <div className="space-y-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-xs">
                            <h3 className="font-display border-b border-[var(--color-border-subtle)] pb-3 text-sm font-bold text-[var(--color-ink)]">
                                Status & Visibilitas Katalog
                            </h3>

                            {/* Status Select */}
                            <div>
                                <label
                                    htmlFor="status"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Status Katalog{' '}
                                    <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    id="status"
                                    required
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData(
                                            'status',
                                            e.target.value as Product['status'],
                                        )
                                    }
                                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:ring-1 focus:ring-[var(--color-primary)] focus:outline-hidden"
                                >
                                    <option value="active">
                                        Aktif (Tayang di Etalase)
                                    </option>
                                    <option value="inactive">
                                        Tidak Aktif (Sembunyikan)
                                    </option>
                                    <option value="archived">
                                        Diarsipkan (Tutup Penjualan)
                                    </option>
                                    {!isConsignment && (
                                        <option value="draft">Draft</option>
                                    )}
                                </select>
                                {form.errors.status && (
                                    <p className="mt-1 text-xs text-rose-600">
                                        {form.errors.status}
                                    </p>
                                )}
                            </div>

                            {/* Featured Checkbox */}
                            <div className="pt-2">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        type="checkbox"
                                        checked={form.data.is_featured}
                                        onChange={(e) =>
                                            form.setData(
                                                'is_featured',
                                                e.target.checked,
                                            )
                                        }
                                        className="size-4 rounded-md border-[var(--color-border-subtle)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                                    />
                                    <span className="text-xs font-semibold text-[var(--color-ink)]">
                                        Tandai sebagai Produk Unggulan
                                    </span>
                                </label>
                                <p className="mt-1 pl-6 text-[11px] text-[var(--color-ink-muted)]">
                                    Produk unggulan diprioritaskan pada banner
                                    rekomendasi beranda siswa.
                                </p>
                            </div>

                            {/* Save Submit Button */}
                            <div className="border-t border-[var(--color-border-subtle)] pt-4">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-50"
                                >
                                    <Save
                                        className="size-4"
                                        aria-hidden="true"
                                    />
                                    <span>
                                        {form.processing
                                            ? 'Menyimpan Perubahan...'
                                            : 'Simpan Perubahan Produk'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Read-Only Invariant Information */}
                        <div className="space-y-2.5 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)]/60 p-4 text-xs text-[var(--color-ink-muted)]">
                            <div className="flex items-center gap-1.5 font-bold text-[var(--color-ink)]">
                                <Lock
                                    className="size-4 text-[var(--color-primary)]"
                                    aria-hidden="true"
                                />
                                <span>Atribut Sistem Terkunci</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between">
                                    <span>Sumber Produk:</span>
                                    <span className="font-semibold text-[var(--color-ink)]">
                                        {isConsignment
                                            ? 'Titipan Siswa'
                                            : 'Koperasi'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pemilik Sah:</span>
                                    <span className="font-semibold text-[var(--color-ink)]">
                                        {isConsignment
                                            ? (product.owner?.name ?? 'Siswa')
                                            : 'KOPDIG Official'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Stok Fisik:</span>
                                    <span className="font-semibold text-[var(--color-ink)]">
                                        {product.stock} unit
                                    </span>
                                </div>
                            </div>
                            <p className="border-t border-[var(--color-border-subtle)] pt-2 text-[10px] leading-relaxed text-[var(--color-ink-muted)]">
                                Penyesuaian kuantitas stok fisik dikelola
                                melalui modul mutasi inventaris pada fase
                                berikutnya.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </CooperativeShell>
    );
}
