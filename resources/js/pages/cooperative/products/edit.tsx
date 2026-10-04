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
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#262626] bg-[#161616] px-3.5 py-2 text-xs font-semibold text-[#F5F2EB] shadow-xs transition-colors hover:bg-[#202020]"
                    >
                        <ArrowLeft
                            className="size-4 text-[#737373]"
                            aria-hidden="true"
                        />
                        <span>Batal & Kembali ke Detail Produk</span>
                    </Link>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-xs text-emerald-400 shadow-xs"
                        role="alert"
                    >
                        <CheckCircle2
                            className="mt-0.5 size-5 shrink-0 text-emerald-400"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold text-emerald-300">
                                Aksi Berhasil
                            </p>
                            <p className="mt-0.5 text-emerald-400/90">
                                {flash.success}
                            </p>
                        </div>
                    </div>
                )}
                {flash?.error && (
                    <div
                        className="flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-xs text-rose-400 shadow-xs"
                        role="alert"
                    >
                        <AlertTriangle
                            className="mt-0.5 size-5 shrink-0 text-rose-400"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="font-bold text-rose-300">
                                Terjadi Kesalahan
                            </p>
                            <p className="mt-0.5 text-rose-400/90">
                                {flash.error}
                            </p>
                        </div>
                    </div>
                )}

                {/* Ownership Notice Banner */}
                {isConsignment && (
                    <div className="rounded-2xl border border-[#E34A27]/25 bg-[#E34A27]/10 p-4 shadow-xs">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#E34A27]">
                            <ShieldCheck
                                className="size-4"
                                aria-hidden="true"
                            />
                            <span>
                                Aturan Bisnis Titipan Siswa (Konsinyasi)
                            </span>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">
                            Kepemilikan produk tetap atas nama siswa penyetor (
                            <span className="font-semibold text-[#F5F2EB]">
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
                        <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs sm:p-6">
                            <h3 className="font-display border-b border-[#262626] pb-3 text-sm font-bold text-[#F5F2EB]">
                                Informasi Pokok Produk
                            </h3>

                            {/* Product Name */}
                            <div>
                                <label
                                    htmlFor="name"
                                    className="block text-xs font-semibold text-[#F5F2EB]"
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
                                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] px-3 text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                />
                                {form.errors.name && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {form.errors.name}
                                    </p>
                                )}
                            </div>

                            {/* Category Select */}
                            <div>
                                <label
                                    htmlFor="category_id"
                                    className="block text-xs font-semibold text-[#F5F2EB]"
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
                                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] px-3 text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                >
                                    {categories.map((c) => (
                                        <option
                                            key={c.id}
                                            value={c.id}
                                            className="bg-[#161616] text-[#F5F2EB]"
                                        >
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                {form.errors.category_id && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {form.errors.category_id}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <label
                                    htmlFor="description"
                                    className="block text-xs font-semibold text-[#F5F2EB]"
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
                                    className="mt-1 w-full rounded-xl border border-[#262626] bg-[#161616] p-3 text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                />
                                {form.errors.description && (
                                    <p className="mt-1 text-xs text-rose-400">
                                        {form.errors.description}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Pricing & Financial Structure Card */}
                        <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs sm:p-6">
                            <h3 className="font-display border-b border-[#262626] pb-3 text-sm font-bold text-[#F5F2EB]">
                                Struktur Harga & Margin Koperasi
                            </h3>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                {/* Base Price */}
                                <div>
                                    <label
                                        htmlFor="base_price"
                                        className="block text-xs font-semibold text-[#F5F2EB]"
                                    >
                                        Harga Pokok / Modal Siswa (Rp)
                                    </label>
                                    {isConsignment ? (
                                        <div className="mt-1 flex min-h-[44px] items-center justify-between rounded-xl border border-[#262626] bg-[#161616] px-3 py-2 font-mono text-xs text-[#F5F2EB]">
                                            <span>
                                                Rp{' '}
                                                {product.base_price.toLocaleString(
                                                    'id-ID',
                                                )}
                                            </span>
                                            <span className="flex items-center gap-1 text-[10px] font-semibold text-[#737373]">
                                                <Lock
                                                    className="size-3"
                                                    aria-hidden="true"
                                                />
                                                <span>Terkunci</span>
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="relative mt-1">
                                            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[#737373]">
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
                                                className="min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] pr-3 pl-9 font-mono text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                            />
                                        </div>
                                    )}
                                    {form.errors.base_price && (
                                        <p className="mt-1 text-xs text-rose-400">
                                            {form.errors.base_price}
                                        </p>
                                    )}
                                </div>

                                {/* Cooperative Margin */}
                                <div>
                                    <label
                                        htmlFor="cooperative_margin"
                                        className="block text-xs font-semibold text-[#F5F2EB]"
                                    >
                                        Margin Koperasi (Rp){' '}
                                        <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative mt-1">
                                        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-semibold text-[#737373]">
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
                                            className="min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] pr-3 pl-9 font-mono text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                        />
                                    </div>
                                    {form.errors.cooperative_margin && (
                                        <p className="mt-1 text-xs text-rose-400">
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
                                                        ? 'bg-[#E34A27] text-white shadow-xs'
                                                        : 'border border-[#262626] bg-[#161616] text-[#A3A3A3] hover:bg-[#202020] hover:text-[#F5F2EB]'
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
                            <div className="rounded-xl border border-[#E34A27]/25 bg-[#E34A27]/10 p-4 text-xs">
                                <span className="text-[10px] font-bold tracking-wider text-[#E34A27] uppercase">
                                    Kalkulasi Harga Jual Katalog KOPDIG
                                </span>
                                <div className="mt-2 space-y-1.5">
                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                        <span>Harga Pokok / Modal:</span>
                                        <span className="font-mono text-[#F5F2EB]">
                                            <PriceDisplay
                                                amount={parsedBasePrice}
                                                size="sm"
                                            />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                        <span>Margin Koperasi (+):</span>
                                        <span className="font-mono font-semibold text-[#E34A27]">
                                            <PriceDisplay
                                                amount={parsedMargin}
                                                size="sm"
                                            />
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-[#E34A27]/20 pt-2 text-sm font-bold text-[#E34A27]">
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
                        <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-xs">
                            <h3 className="font-display border-b border-[#262626] pb-3 text-sm font-bold text-[#F5F2EB]">
                                Status & Visibilitas Katalog
                            </h3>

                            {/* Status Select */}
                            <div>
                                <label
                                    htmlFor="status"
                                    className="block text-xs font-semibold text-[#F5F2EB]"
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
                                    className="mt-1 min-h-[44px] w-full rounded-xl border border-[#262626] bg-[#161616] px-3 text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#E34A27] focus:outline-hidden"
                                >
                                    <option
                                        value="active"
                                        className="bg-[#161616] text-[#F5F2EB]"
                                    >
                                        Aktif (Tayang di Etalase)
                                    </option>
                                    <option
                                        value="inactive"
                                        className="bg-[#161616] text-[#F5F2EB]"
                                    >
                                        Tidak Aktif (Sembunyikan)
                                    </option>
                                    <option
                                        value="archived"
                                        className="bg-[#161616] text-[#F5F2EB]"
                                    >
                                        Diarsipkan (Tutup Penjualan)
                                    </option>
                                    {!isConsignment && (
                                        <option
                                            value="draft"
                                            className="bg-[#161616] text-[#F5F2EB]"
                                        >
                                            Draft
                                        </option>
                                    )}
                                </select>
                                {form.errors.status && (
                                    <p className="mt-1 text-xs text-rose-400">
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
                                        className="size-4 rounded-md border-[#262626] bg-[#161616] text-[#E34A27] focus:ring-[#E34A27]"
                                    />
                                    <span className="text-xs font-semibold text-[#F5F2EB]">
                                        Tandai sebagai Produk Unggulan
                                    </span>
                                </label>
                                <p className="mt-1 pl-6 text-[11px] text-[#737373]">
                                    Produk unggulan diprioritaskan pada banner
                                    rekomendasi beranda siswa.
                                </p>
                            </div>

                            {/* Save Submit Button */}
                            <div className="border-t border-[#262626] pt-4">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#E34A27] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-[#D03E1C] active:scale-[0.98] disabled:opacity-50"
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
                        <div className="space-y-2.5 rounded-2xl border border-[#262626] bg-[#141414] p-4 text-xs text-[#737373]">
                            <div className="flex items-center gap-1.5 font-bold text-[#F5F2EB]">
                                <Lock
                                    className="size-4 text-[#E34A27]"
                                    aria-hidden="true"
                                />
                                <span>Atribut Sistem Terkunci</span>
                            </div>
                            <div className="space-y-1.5 text-[11px]">
                                <div className="flex justify-between">
                                    <span>Sumber Produk:</span>
                                    <span className="font-semibold text-[#F5F2EB]">
                                        {isConsignment
                                            ? 'Titipan Siswa'
                                            : 'Koperasi'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Pemilik Sah:</span>
                                    <span className="font-semibold text-[#F5F2EB]">
                                        {isConsignment
                                            ? (product.owner?.name ?? 'Siswa')
                                            : 'KOPDIG Official'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Stok Fisik:</span>
                                    <span className="font-semibold text-[#F5F2EB]">
                                        {product.stock} unit
                                    </span>
                                </div>
                            </div>
                            <p className="border-t border-[#262626] pt-2 text-[10px] leading-relaxed text-[#737373]">
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
