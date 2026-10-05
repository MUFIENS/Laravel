import React, { useEffect, useRef, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ImageIcon,
    RefreshCw,
    Save,
    Sparkles,
    Trash2,
    X,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { safeNavigateBack } from '@/lib/navigation';
import type { Category, ProductSubmission } from '@/types/consignment';

interface Props {
    submission: ProductSubmission;
    categories: Category[];
}

export default function StudentConsignmentEdit({
    submission,
    categories,
}: Props) {
    const { data, setData, post, processing, errors } = useForm<{
        _method: string;
        name: string;
        category_id: string;
        description: string;
        base_price: string;
        proposed_stock: string;
        image: File | null;
    }>({
        _method: 'put',
        name: submission.name,
        category_id: String(submission.category_id),
        description: submission.description,
        base_price: String(submission.base_price),
        proposed_stock: String(submission.proposed_stock),
        image: null,
    });

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [clientError, setClientError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { delete: destroy, processing: deleting } = useForm({});

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleFileChange = (file: File | null) => {
        setClientError(null);

        if (!file) {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(null);
            setData('image', null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            return;
        }

        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            setClientError(
                'Format gambar tidak didukung. Harap pilih berkas JPEG, PNG, atau WebP.',
            );
            return;
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            setClientError('Ukuran gambar melebihi batas maksimal 2 MB.');
            return;
        }

        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setData('image', file);
    };

    const handleRemoveImage = () => {
        handleFileChange(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/student/consignments/${submission.id}`, {
            forceFormData: true,
        });
    };

    const currentImageUrl =
        submission.image_path.startsWith('http') ||
        submission.image_path.startsWith('/')
            ? submission.image_path
            : `/storage/${submission.image_path}`;

    const handleDelete = () => {
        if (
            confirm(
                'Yakin ingin membatalkan dan menghapus pengajuan titipan ini?',
            )
        ) {
            destroy(`/student/consignments/${submission.id}`);
        }
    };

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title={`Ubah Pengajuan — ${submission.name} | KOPDIG`} />

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
                            safeNavigateBack(
                                `/student/consignments/${submission.id}`,
                            )
                        }
                        className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Batal & Kembali</span>
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
                                Ubah Pengajuan
                            </span>
                        </div>
                    </Link>

                    {/* Right: Delete Action */}
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-rose-900/40 bg-rose-950/20 px-3.5 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:border-rose-800 hover:bg-rose-950/40 active:scale-95 disabled:opacity-50"
                    >
                        <Trash2 className="size-3.5" />
                        <span className="hidden sm:inline">
                            Batalkan Titipan
                        </span>
                    </button>
                </div>
            </header>

            {/* 2. MAIN WORKSPACE */}
            <main className="relative z-10 mx-auto max-w-3xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#E34A27] uppercase">
                        <Sparkles className="size-3" />
                        <span>Perubahan Informasi Pengajuan</span>
                    </div>
                    <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB]">
                        Perbarui Data Titipan Produk
                    </h1>
                    <p className="mt-1 text-xs text-[#737373]">
                        Kamu dapat mengubah rincian produk selama pengajuan
                        masih dalam status menunggu antrean review.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-7"
                >
                    {/* SECTION 1: NAMA & KATEGORI */}
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                            >
                                Nama Produk
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className="mt-1.5 h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                            />
                            <InputError
                                message={errors.name}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="category_id"
                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                            >
                                Kategori
                            </label>
                            <select
                                id="category_id"
                                required
                                value={data.category_id}
                                onChange={(e) =>
                                    setData('category_id', e.target.value)
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

                        {/* Foto Produk */}
                        <div>
                            <div className="flex items-center justify-between">
                                <label
                                    htmlFor="product-image-edit"
                                    className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                                >
                                    Foto Produk
                                </label>
                                <span className="font-mono text-[10px] text-[#737373]">
                                    Maks. 2 MB (Opsional bila tidak diubah)
                                </span>
                            </div>

                            <div className="mt-1.5 overflow-hidden rounded-xl border border-[#262626] bg-[#0A0A0A] p-3.5">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-16 shrink-0 overflow-hidden rounded-lg border border-[#262626] bg-[#141414]">
                                            <img
                                                src={
                                                    previewUrl ||
                                                    currentImageUrl
                                                }
                                                alt="Foto produk"
                                                className="size-full object-cover"
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                {previewUrl ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 font-mono text-[9px] font-semibold text-emerald-400">
                                                        <CheckCircle2 className="size-3" />
                                                        Foto Baru Dipilih
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full border border-[#383838] bg-[#141414] px-2 py-0.5 font-mono text-[9px] font-semibold text-[#A3A3A3]">
                                                        <ImageIcon className="size-3 text-[#E34A27]" />
                                                        Foto Saat Ini
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-1 truncate font-mono text-xs font-semibold text-[#F5F2EB]">
                                                {previewUrl && data.image
                                                    ? data.image.name
                                                    : 'Foto aktif pengajuan'}
                                            </p>
                                            <p className="mt-0.5 text-[10px] text-[#737373]">
                                                {previewUrl && data.image
                                                    ? `${(data.image.size / 1024).toFixed(1)} KB`
                                                    : 'Klik ganti jika ingin memperbarui foto'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 border-t border-[#262626] pt-3 sm:border-0 sm:pt-0">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                fileInputRef.current?.click()
                                            }
                                            className="inline-flex min-h-[36px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-medium text-[#F5F2EB] transition-colors hover:border-[#383838] hover:bg-[#1a1a1a] active:scale-95 sm:flex-initial"
                                        >
                                            <RefreshCw className="size-3.5 text-[#A3A3A3]" />
                                            <span>
                                                {previewUrl
                                                    ? 'Ganti Lainnya'
                                                    : 'Ganti Foto'}
                                            </span>
                                        </button>
                                        {previewUrl && (
                                            <button
                                                type="button"
                                                onClick={handleRemoveImage}
                                                className="inline-flex min-h-[36px] flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-3 py-1.5 text-xs font-medium text-rose-300 transition-colors hover:border-rose-800 hover:bg-rose-950/40 active:scale-95 sm:flex-initial"
                                            >
                                                <X className="size-3.5" />
                                                <span>Batal Ganti</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Hidden native file input */}
                            <input
                                ref={fileInputRef}
                                id="product-image-edit"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                onChange={(e) => {
                                    if (e.target.files && e.target.files[0]) {
                                        handleFileChange(e.target.files[0]);
                                    }
                                }}
                            />

                            {clientError && (
                                <p className="mt-1 text-xs text-rose-400">
                                    {clientError}
                                </p>
                            )}
                            <InputError
                                message={errors.image}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="description"
                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                            >
                                Deskripsi Produk
                            </label>
                            <textarea
                                id="description"
                                required
                                rows={4}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className="mt-1.5 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs leading-relaxed text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                            />
                            <InputError
                                message={errors.description}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    {/* SECTION 2: HARGA & STOK */}
                    <div className="space-y-4 border-t border-[#262626] pt-6">
                        <div>
                            <label
                                htmlFor="base_price"
                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                            >
                                Harga Modal Diterima Siswa (Rp)
                            </label>
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
                                        setData('base_price', e.target.value)
                                    }
                                    className="h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] pr-3.5 pl-10 font-mono text-xs font-bold text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                />
                            </div>
                            <InputError
                                message={errors.base_price}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="proposed_stock"
                                className="block font-heading text-xs font-semibold text-[#A3A3A3]"
                            >
                                Stok Diajukan (pcs)
                            </label>
                            <input
                                id="proposed_stock"
                                type="number"
                                required
                                min="1"
                                max="500"
                                value={data.proposed_stock}
                                onChange={(e) =>
                                    setData('proposed_stock', e.target.value)
                                }
                                className="mt-1.5 h-11 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 font-mono text-xs font-bold text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                            />
                            <InputError
                                message={errors.proposed_stock}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E34A27] px-6 py-3 font-heading text-xs font-bold tracking-wider text-white uppercase shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#d03f1e] disabled:opacity-50"
                        >
                            <Save className="size-4" />
                            <span>
                                {processing
                                    ? 'Menyimpan Perubahan...'
                                    : 'Simpan Perubahan Pengajuan'}
                            </span>
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
}
