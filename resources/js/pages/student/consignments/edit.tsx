import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { Spinner } from '@/components/ui/spinner';
import type { Category, ProductSubmission } from '@/types/consignment';

type Props = {
    submission: ProductSubmission;
    categories: Category[];
};

export default function StudentConsignmentEdit({
    submission,
    categories,
}: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: submission.name,
        category_id: String(submission.category_id),
        description: submission.description,
        base_price: String(submission.base_price),
        proposed_stock: String(submission.proposed_stock),
    });

    const { delete: destroy, processing: deleting } = useForm({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/student/consignments/${submission.id}`);
    };

    const handleDelete = () => {
        if (confirm('Yakin ingin membatalkan pengajuan titipan ini?')) {
            destroy(`/student/consignments/${submission.id}`);
        }
    };

    return (
        <AppShell>
            <Head title={`Ubah Pengajuan — ${submission.name}`} />
            <PageContainer className="py-6">
                <div className="mb-4 flex items-center justify-between">
                    <Link
                        href={`/student/consignments/${submission.id}`}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    >
                        <ArrowLeft className="size-4" />
                        Batal & Kembali
                    </Link>

                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={deleting}
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
                    >
                        <Trash2 className="size-3.5" />
                        Batalkan Pengajuan
                    </button>
                </div>

                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
                    <div className="mb-6">
                        <h1 className="font-display text-lg font-bold text-[var(--color-ink)]">
                            Perbarui Pengajuan Titipan
                        </h1>
                        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                            Ubah informasi produk sebelum pengurus koperasi
                            meninjau pengajuanmu.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-xs font-semibold text-[var(--color-ink)]"
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
                                className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="category_id"
                                className="block text-xs font-semibold text-[var(--color-ink)]"
                            >
                                Kategori Produk
                            </label>
                            <select
                                id="category_id"
                                required
                                value={data.category_id}
                                onChange={(e) =>
                                    setData('category_id', e.target.value)
                                }
                                className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
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

                        <div>
                            <label
                                htmlFor="description"
                                className="block text-xs font-semibold text-[var(--color-ink)]"
                            >
                                Deskripsi Produk
                            </label>
                            <textarea
                                id="description"
                                required
                                rows={3}
                                value={data.description}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                                className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-red-600">
                                    {errors.description}
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="base_price"
                                    className="block text-xs font-semibold text-[var(--color-ink)]"
                                >
                                    Harga Modal Siswa (Rp)
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
                                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
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
                                    Rencana Stok Awal (Pcs)
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
                                    className="mt-1.5 w-full rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] px-3.5 py-2.5 font-mono text-xs text-[var(--color-ink)] focus:border-[var(--color-primary)] focus:bg-[var(--color-surface)] focus:outline-none"
                                />
                                {errors.proposed_stock && (
                                    <p className="mt-1 text-xs text-red-600">
                                        {errors.proposed_stock}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-3 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)] active:scale-[0.98] disabled:opacity-50"
                            >
                                {processing ? (
                                    <Spinner className="size-4" />
                                ) : (
                                    <Save className="size-4" />
                                )}
                                Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>
            </PageContainer>
        </AppShell>
    );
}
