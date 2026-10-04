import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, HelpCircle, Send } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Spinner } from '@/components/ui/spinner';
import type { Category } from '@/types/consignment';

type Props = {
    categories: Category[];
};

export default function StudentConsignmentCreate({ categories }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        category_id: categories[0]?.id ? String(categories[0].id) : '',
        description: '',
        base_price: '',
        proposed_stock: '10',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/student/consignments');
    };

    return (
        <AppShell>
            <Head title="Ajukan Titipan Produk — KOPDIG" />
            <PageContainer className="py-6">
                {/* Back Nav */}
                <div className="mb-4">
                    <Link
                        href="/student/consignments"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Daftar Titipan
                    </Link>
                </div>

                {/* Form Card */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
                    <div className="mb-6">
                        <h1 className="font-display text-lg font-bold text-[var(--color-ink)]">
                            Formulir Pengajuan Titipan Produk
                        </h1>
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                            Isi detail produk karya atau olahanmu dengan lengkap
                            untuk ditinjau oleh tim Koperasi Sekolah.
                        </p>
                    </div>

                    {/* Educational Banner */}
                    <div className="mb-6 flex items-start gap-3 rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] p-3.5 text-xs text-[var(--color-ink)]">
                        <HelpCircle className="size-4 shrink-0 text-[var(--color-primary)]" />
                        <div>
                            <span className="font-semibold text-[var(--color-primary)]">
                                Cara Penentuan Harga Jual:
                            </span>{' '}
                            Harga modal adalah jumlah yang kamu terima tiap
                            produk laku. Koperasi akan menambahkan margin
                            operasional (contoh: +Rp 1.000) saat pengajuan
                            disetujui.
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Nama Produk */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-xs font-semibold text-[var(--color-ink)]"
                            >
                                Nama Produk{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="name"
                                type="text"
                                required
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="Contoh: Risol Mayo Homemade Lumer"
                                className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Kategori */}
                        <div>
                            <label
                                htmlFor="category_id"
                                className="block text-xs font-semibold text-[var(--color-ink)]"
                            >
                                Kategori Produk{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="category_id"
                                required
                                value={data.category_id}
                                onChange={(e) =>
                                    setData('category_id', e.target.value)
                                }
                                className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                            >
                                {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.category_id}
                                </p>
                            )}
                        </div>

                        {/* Deskripsi */}
                        <div>
                            <label
                                htmlFor="description"
                                className="block text-xs font-semibold text-[var(--color-ink)]"
                            >
                                Deskripsi Produk & Komposisi{' '}
                                <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                id="description"
                                required
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                placeholder="Jelaskan isi, rasa, bahan pembuatan, dan keunggulan produkmu..."
                                className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        {/* Pricing & Stock Grid */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="base_price"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Harga Modal Siswa (Rp){' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="base_price"
                                    type="number"
                                    required
                                    min={500}
                                    step={500}
                                    value={data.base_price}
                                    onChange={(e) =>
                                        setData('base_price', e.target.value)
                                    }
                                    placeholder="Contoh: 5000"
                                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-xs text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                                />
                                {errors.base_price && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.base_price}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="proposed_stock"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Rencana Stok Awal (Pcs){' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="proposed_stock"
                                    type="number"
                                    required
                                    min={1}
                                    max={500}
                                    value={data.proposed_stock}
                                    onChange={(e) =>
                                        setData(
                                            'proposed_stock',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Contoh: 15"
                                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-xs text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                                />
                                {errors.proposed_stock && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.proposed_stock}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-50"
                            >
                                {processing ? (
                                    <Spinner className="size-4" />
                                ) : (
                                    <Send className="size-4" />
                                )}
                                Kirim Pengajuan ke Koperasi
                            </button>
                        </div>
                    </form>
                </div>
            </PageContainer>
        </AppShell>
    );
}
