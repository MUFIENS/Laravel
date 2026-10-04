import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    FileText,
    HelpCircle,
    Package,
    ShieldCheck,
    Sparkles,
    Store,
    Tag,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { Category } from '@/types/consignment';

interface Props {
    categories: Category[];
}

export default function StudentConsignmentCreate({ categories }: Props) {
    const defaultCategoryId = categories[0]?.id ? String(categories[0].id) : '';

    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category_id: defaultCategoryId,
        description: '',
        base_price: '',
        proposed_stock: '10',
    });

    const [agreed, setAgreed] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student/consignments');
    };

    // Calculate live estimations
    const numericBasePrice = Math.max(0, parseInt(data.base_price, 10) || 0);
    const estimatedMargin = Math.round(numericBasePrice * 0.12);
    const estimatedSellingPrice = numericBasePrice + estimatedMargin;

    const selectedCategory = categories.find(
        (c) => String(c.id) === data.category_id,
    );

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title="Ajukan Titipan Produk — KOPDIG" />

            {/* ATMOSPHERIC BACKGROUND SYSTEM */}
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
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
                    {/* Left: Back Navigation */}
                    <button
                        type="button"
                        onClick={() =>
                            safeNavigateBack('/student/consignments')
                        }
                        className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke daftar titipan"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Kembali</span>
                    </button>

                    {/* Center: Brand Mark */}
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
                                Pengajuan Konsinyasi
                            </span>
                        </div>
                    </Link>

                    {/* Right: Quick Link to Consignments Hub */}
                    <Link
                        href="/student/consignments"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                    >
                        <Store className="size-3.5 text-[#E34A27]" />
                        <span className="hidden sm:inline">Titipan Saya</span>
                    </Link>
                </div>
            </header>

            {/* 2. MAIN WORKSPACE */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* Hero Narrative Heading */}
                <div className="mb-8 border-b border-[#262626] pb-6">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#E34A27] uppercase">
                        <Sparkles className="size-3" />
                        <span>Program Konsinyasi Mandiri Siswa</span>
                    </div>

                    <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                        Titipkan Karyamu ke Koperasi
                    </h1>

                    <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                        Isi formulir pengajuan dengan lengkap. Tim pengurus
                        koperasi sekolah akan meninjau standar mutu dan
                        kelayakan sebelum produkmu diterbitkan resmi di katalog
                        belanja KOPDIG.
                    </p>
                </div>

                {/* Grid: Form (Left) + Interactive Live Preview (Right) */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
                    {/* LEFT COLUMN: SUBMISSION FORM (7 Cols) */}
                    <div className="lg:col-span-7">
                        <form
                            onSubmit={handleSubmit}
                            className="space-y-6 rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-7"
                        >
                            {/* SECTION A: INFORMASI DASAR */}
                            <div>
                                <div className="mb-4 flex items-center gap-2 border-b border-[#262626] pb-3">
                                    <Tag className="size-4 text-[#E34A27]" />
                                    <h2 className="font-heading text-sm font-bold text-[#F5F2EB]">
                                        01. Identitas Produk
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Nama Produk */}
                                    <div>
                                        <label
                                            htmlFor="name"
                                            className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                                        >
                                            Nama Produk Karya / Olahan{' '}
                                            <span className="text-[#E34A27]">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            required
                                            value={data.name}
                                            onChange={(e) =>
                                                setData('name', e.target.value)
                                            }
                                            placeholder="Contoh: Gantungan Kunci Anyaman Batik"
                                            className="mt-1.5 h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 text-xs text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                        />
                                        <InputError
                                            message={errors.name}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Kategori */}
                                    <div>
                                        <label
                                            htmlFor="category_id"
                                            className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                                        >
                                            Kategori Produk{' '}
                                            <span className="text-[#E34A27]">
                                                *
                                            </span>
                                        </label>
                                        <select
                                            id="category_id"
                                            required
                                            value={data.category_id}
                                            onChange={(e) =>
                                                setData(
                                                    'category_id',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                        >
                                            {categories.map((cat) => (
                                                <option
                                                    key={cat.id}
                                                    value={cat.id}
                                                    className="bg-[#141414] text-[#F5F2EB]"
                                                >
                                                    {cat.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError
                                            message={errors.category_id}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Deskripsi */}
                                    <div>
                                        <label
                                            htmlFor="description"
                                            className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                                        >
                                            Deskripsi Produk & Cerita Pembuatan{' '}
                                            <span className="text-[#E34A27]">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            id="description"
                                            required
                                            rows={4}
                                            value={data.description}
                                            onChange={(e) =>
                                                setData(
                                                    'description',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Jelaskan bahan yang digunakan, keunggulan produk, kebersihan/daya tahan, atau keunikan karyamu..."
                                            className="mt-1.5 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs leading-relaxed text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                        />
                                        <InputError
                                            message={errors.description}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION B: HARGA & PASOKAN */}
                            <div className="border-t border-[#262626] pt-6">
                                <div className="mb-4 flex items-center gap-2 border-b border-[#262626] pb-3">
                                    <Package className="size-4 text-[#E34A27]" />
                                    <h2 className="font-heading text-sm font-bold text-[#F5F2EB]">
                                        02. Harga Modal & Stok Awal
                                    </h2>
                                </div>

                                <div className="space-y-4">
                                    {/* Harga Modal Siswa */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="base_price"
                                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                                            >
                                                Harga Modal Diterima Siswa (Rp){' '}
                                                <span className="text-[#E34A27]">
                                                    *
                                                </span>
                                            </label>
                                            <span className="font-mono text-[10px] text-[#737373]">
                                                Min. Rp 500
                                            </span>
                                        </div>

                                        <div className="relative mt-1.5">
                                            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 font-mono text-xs font-bold text-[#737373]">
                                                Rp
                                            </span>
                                            <input
                                                id="base_price"
                                                type="number"
                                                required
                                                min="500"
                                                max="10000000"
                                                step="500"
                                                value={data.base_price}
                                                onChange={(e) =>
                                                    setData(
                                                        'base_price',
                                                        e.target.value,
                                                    )
                                                }
                                                placeholder="Contoh: 10000"
                                                className="h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] pr-3.5 pl-10 font-mono text-xs font-bold text-[#F5F2EB] placeholder:font-sans placeholder:font-normal placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                            />
                                        </div>
                                        <p className="mt-1 text-[10px] text-[#737373]">
                                            Ini adalah jumlah uang bersih yang
                                            kamu terima untuk setiap pcs produk
                                            yang terjual.
                                        </p>
                                        <InputError
                                            message={errors.base_price}
                                            className="mt-1"
                                        />
                                    </div>

                                    {/* Stok Diajukan */}
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <label
                                                htmlFor="proposed_stock"
                                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                                            >
                                                Jumlah Stok Awal yang Disiapkan{' '}
                                                <span className="text-[#E34A27]">
                                                    *
                                                </span>
                                            </label>
                                            <span className="font-mono text-[10px] text-[#737373]">
                                                Maks. 500 pcs
                                            </span>
                                        </div>

                                        <input
                                            id="proposed_stock"
                                            type="number"
                                            required
                                            min="1"
                                            max="500"
                                            value={data.proposed_stock}
                                            onChange={(e) =>
                                                setData(
                                                    'proposed_stock',
                                                    e.target.value,
                                                )
                                            }
                                            className="mt-1.5 h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 font-mono text-xs font-bold text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                        />

                                        {/* Quick stock chips */}
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-[10px] text-[#737373]">
                                                Pilihan cepat:
                                            </span>
                                            {[5, 10, 20, 50].map((qty) => (
                                                <button
                                                    key={qty}
                                                    type="button"
                                                    onClick={() =>
                                                        setData(
                                                            'proposed_stock',
                                                            String(qty),
                                                        )
                                                    }
                                                    className={`cursor-pointer rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                                                        data.proposed_stock ===
                                                        String(qty)
                                                            ? 'border-[#E34A27] bg-[#E34A27]/20 text-[#E34A27]'
                                                            : 'border-[#262626] bg-[#0A0A0A] text-[#737373] hover:border-[#383838] hover:text-[#F5F2EB]'
                                                    }`}
                                                >
                                                    {qty} pcs
                                                </button>
                                            ))}
                                        </div>

                                        <InputError
                                            message={errors.proposed_stock}
                                            className="mt-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Commitment Checkbox */}
                            <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-4 text-xs">
                                <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                        type="checkbox"
                                        checked={agreed}
                                        onChange={(e) =>
                                            setAgreed(e.target.checked)
                                        }
                                        className="mt-0.5 size-4 rounded border-[#262626] bg-[#141414] text-[#E34A27] focus:ring-[#E34A27] focus:ring-offset-0"
                                    />
                                    <span className="text-[11px] leading-relaxed text-[#A3A3A3]">
                                        Saya menyatakan bahwa produk ini adalah
                                        karya/olahan mandiri yang siap dipasok
                                        ke koperasi sekolah dalam keadaan rapi,
                                        higienis, dan sesuai informasi yang
                                        dicantumkan.
                                    </span>
                                </label>
                            </div>

                            {/* Submission CTA */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing || !agreed}
                                    className="group inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E34A27] px-6 py-3 font-heading text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-[#E34A27]/25 transition-all duration-300 hover:bg-[#d03f1e] hover:shadow-[#E34A27]/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <span>
                                        {processing
                                            ? 'Mengirim Pengajuan...'
                                            : 'Kirim Pengajuan Produk'}
                                    </span>
                                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: INTERACTIVE PREVIEW & STEP GUIDANCE (5 Cols) */}
                    <div className="space-y-6 lg:col-span-5">
                        {/* 1. Live Product Preview Card */}
                        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl">
                            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                                <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                    <FileText className="size-3 text-[#E34A27]" />
                                    <span>Pratinjau Pengajuan</span>
                                </div>
                                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-amber-400">
                                    Draft Siswa
                                </span>
                            </div>

                            <div className="mt-4">
                                <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                    {selectedCategory?.name ?? 'Pilih Kategori'}
                                </span>
                                <h3 className="mt-1 font-heading text-base font-bold text-[#F5F2EB]">
                                    {data.name || 'Nama Produk Karyamu'}
                                </h3>
                                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#737373]">
                                    {data.description ||
                                        'Deskripsi keunggulan dan cerita produk akan tampil di sini...'}
                                </p>

                                {/* Price Simulation Box */}
                                <div className="mt-4 rounded-xl border border-[#262626] bg-[#0A0A0A] p-3.5 text-xs">
                                    <div className="flex items-center justify-between py-1 text-[#A3A3A3]">
                                        <span>Modal Bersih (Diterima):</span>
                                        <span className="font-mono font-bold text-[#F5F2EB]">
                                            {formatRupiah(numericBasePrice)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-1 text-[#737373]">
                                        <span>Estimasi Margin Koperasi:</span>
                                        <span className="font-mono text-[11px]">
                                            +{formatRupiah(estimatedMargin)}
                                        </span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between border-t border-[#262626] pt-2">
                                        <span className="font-heading font-semibold text-[#F5F2EB]">
                                            Estimasi Harga Jual:
                                        </span>
                                        <span className="font-mono text-sm font-bold text-[#E34A27]">
                                            {formatRupiah(
                                                estimatedSellingPrice,
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-3 flex items-center gap-2 text-[11px] text-[#737373]">
                                    <Package className="size-3.5 text-[#E34A27]" />
                                    <span>
                                        Stok disiapkan:{' '}
                                        <strong className="text-[#F5F2EB]">
                                            {data.proposed_stock || 0} pcs
                                        </strong>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* 2. Educational / Workflow Steps */}
                        <div className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl">
                            <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
                                <HelpCircle className="size-4 text-[#E34A27]" />
                                <h3 className="font-heading text-xs font-bold text-[#F5F2EB]">
                                    Alur Kurasi Koperasi
                                </h3>
                            </div>

                            <ol className="mt-4 space-y-3.5 text-xs text-[#A3A3A3]">
                                <li className="flex items-start gap-3">
                                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-mono text-[10px] font-bold text-[#E34A27]">
                                        1
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-[#F5F2EB]">
                                            Pengajuan & Pemeriksaan Fisik
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-[#737373]">
                                            Pengurus koperasi memeriksa sampel
                                            produk dan memastikan standar
                                            kebersihan/mutu.
                                        </p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-mono text-[10px] font-bold text-[#E34A27]">
                                        2
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-[#F5F2EB]">
                                            Penetapan Margin Operasional
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-[#737373]">
                                            Koperasi menambahkan margin
                                            operasional wajar untuk kasir dan
                                            layanan loket.
                                        </p>
                                    </div>
                                </li>

                                <li className="flex items-start gap-3">
                                    <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E34A27]/20 font-mono text-[10px] font-bold text-[#E34A27]">
                                        3
                                    </div>
                                    <div>
                                        <p className="font-heading font-bold text-[#F5F2EB]">
                                            Penerbitan ke Katalog KOPDIG
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-[#737373]">
                                            Produk aktif di marketplace KOPDIG
                                            dan dapat langsung dipesan oleh
                                            warga sekolah.
                                        </p>
                                    </div>
                                </li>
                            </ol>

                            <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-3 text-[11px] text-emerald-300">
                                <div className="flex items-center gap-1.5 font-semibold">
                                    <ShieldCheck className="size-3.5" />
                                    <span>Hak Cipta Tetap Milikmu</span>
                                </div>
                                <p className="mt-1 text-[#A3A3A3]">
                                    Siswa tetap memegang penuh kepemilikan
                                    produk. Koperasi berperan sebagai mitra
                                    kurasi dan etalase resmi sekolah.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
