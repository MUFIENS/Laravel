import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, PackageCheck, Plus, Store, Tag } from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { safeNavigateBack } from '@/lib/navigation';
import type { Product, ProductSubmission } from '@/types/consignment';

type Props = {
    submissions: ProductSubmission[];
    approvedProducts: Product[];
};

export default function StudentConsignmentIndex({
    submissions,
    approvedProducts,
}: Props) {
    return (
        <AppShell>
            <Head title="Titipan Saya — KOPDIG" />
            <PageContainer className="py-6">
                {/* Back / Navigation Header */}
                <div className="mb-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center gap-2 rounded-xl text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                        aria-label="Kembali ke halaman sebelumnya"
                    >
                        <ArrowLeft className="size-4" />
                        <span>Kembali ke Pasar Sekolah</span>
                    </button>

                    <Link
                        href="/student/consignments/create"
                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.98]"
                    >
                        <Plus className="size-4" />
                        Ajukan Titipan
                    </Link>
                </div>

                {/* Header Banner */}
                <div className="mb-6 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] sm:p-5">
                    <div className="flex items-start gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                            <Store className="size-5" />
                        </div>
                        <div>
                            <h1 className="font-display text-lg font-bold text-[var(--color-ink)]">
                                Produk Titipan Saya
                            </h1>
                            <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
                                Ajukan karya, makanan, atau perlengkapan
                                buatanmu untuk dijual melalui Koperasi Sekolah.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Submissions Section */}
                <div className="mb-8">
                    <SectionHeader
                        title="Riwayat Pengajuan Titipan"
                        subtitle="Status verifikasi oleh pengurus koperasi sekolah"
                    />

                    {submissions.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center">
                            <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
                                <Tag className="size-5" />
                            </div>
                            <h3 className="font-display text-sm font-semibold text-[var(--color-ink)]">
                                Belum Ada Pengajuan Produk
                            </h3>
                            <p className="mx-auto mt-1 max-w-xs text-xs text-[var(--color-ink-muted)]">
                                Punya produk makanan atau kriya yang ingin kamu
                                jual? Ajukan sekarang ke koperasi sekolah!
                            </p>
                            <Link
                                href="/student/consignments/create"
                                className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
                            >
                                <Plus className="size-4" />
                                Mulai Ajukan Produk
                            </Link>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {submissions.map((sub) => {
                                const statusMap: Record<
                                    ProductSubmission['status'],
                                    {
                                        label: string;
                                        variant:
                                            | 'warning'
                                            | 'info'
                                            | 'success'
                                            | 'danger';
                                    }
                                > = {
                                    submitted: {
                                        label: 'Diajukan',
                                        variant: 'warning',
                                    },
                                    under_review: {
                                        label: 'Sedang Ditinjau',
                                        variant: 'info',
                                    },
                                    approved: {
                                        label: 'Disetujui',
                                        variant: 'success',
                                    },
                                    rejected: {
                                        label: 'Ditolak',
                                        variant: 'danger',
                                    },
                                };

                                const meta = statusMap[sub.status];

                                return (
                                    <Link
                                        key={sub.id}
                                        href={`/student/consignments/${sub.id}`}
                                        className="block rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)] transition-all hover:border-[var(--color-primary)]/40 active:scale-[0.99]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                                        {sub.category?.name ??
                                                            'Kategori'}
                                                    </span>
                                                    <StatusBadge
                                                        variant={meta.variant}
                                                    >
                                                        {meta.label}
                                                    </StatusBadge>
                                                </div>
                                                <h3 className="font-display mt-1 truncate text-sm font-bold text-[var(--color-ink)]">
                                                    {sub.name}
                                                </h3>
                                                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--color-ink-muted)]">
                                                    <span>
                                                        Harga Modal:{' '}
                                                        <PriceDisplay
                                                            amount={
                                                                sub.base_price
                                                            }
                                                            size="sm"
                                                        />
                                                    </span>
                                                    <span>
                                                        Stok:{' '}
                                                        {sub.proposed_stock} pcs
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] text-[var(--color-ink-muted)]">
                                                    {new Date(
                                                        sub.created_at,
                                                    ).toLocaleDateString(
                                                        'id-ID',
                                                        {
                                                            day: 'numeric',
                                                            month: 'short',
                                                        },
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Approved Products in Catalog */}
                {approvedProducts.length > 0 && (
                    <div>
                        <SectionHeader
                            title="Produk Aktif di Katalog Koperasi"
                            subtitle="Karyamu yang sudah disetujui dan sedang dijual resmi"
                        />
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {approvedProducts.map((prod) => (
                                <div
                                    key={prod.id}
                                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-subtle)]"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <span className="text-[10px] font-semibold text-[var(--color-primary)]">
                                                Aktif Dijual
                                            </span>
                                            <h4 className="font-display text-sm font-bold text-[var(--color-ink)]">
                                                {prod.name}
                                            </h4>
                                        </div>
                                        <PackageCheck className="size-5 text-[var(--color-primary)]" />
                                    </div>
                                    <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-3 text-xs">
                                        <div>
                                            <span className="block text-[10px] text-[var(--color-ink-muted)]">
                                                Harga Jual Koperasi
                                            </span>
                                            <PriceDisplay
                                                amount={prod.selling_price}
                                                size="sm"
                                            />
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-[10px] text-[var(--color-ink-muted)]">
                                                Sisa Stok
                                            </span>
                                            <span className="font-semibold text-[var(--color-ink)]">
                                                {prod.stock} pcs
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </PageContainer>
        </AppShell>
    );
}
