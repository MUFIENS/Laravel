import { Head, Link } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    Clock,
    Edit3,
} from 'lucide-react';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { StatusBadge } from '@/components/ui/status-badge';
import type { ProductSubmission } from '@/types/consignment';

type Props = {
    submission: ProductSubmission;
};

export default function StudentConsignmentShow({ submission }: Props) {
    const statusMap: Record<
        ProductSubmission['status'],
        { label: string; variant: 'warning' | 'info' | 'success' | 'danger' }
    > = {
        submitted: { label: 'Menunggu Ditinjau', variant: 'warning' },
        under_review: { label: 'Sedang Ditinjau', variant: 'info' },
        approved: { label: 'Disetujui & Aktif', variant: 'success' },
        rejected: { label: 'Ditolak', variant: 'danger' },
    };

    const currentMeta = statusMap[submission.status];
    const canEdit = submission.status === 'submitted';

    return (
        <AppShell>
            <Head title={`Detail Pengajuan — ${submission.name}`} />
            <PageContainer className="py-6">
                {/* Back Nav */}
                <div className="mb-4 flex items-center justify-between">
                    <Link
                        href="/student/consignments"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-xl text-sm font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke Daftar Titipan
                    </Link>

                    {canEdit && (
                        <Link
                            href={`/student/consignments/${submission.id}/edit`}
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                        >
                            <Edit3 className="size-3.5" />
                            Ubah Pengajuan
                        </Link>
                    )}
                </div>

                {/* Status Notice Banner */}
                {submission.status === 'rejected' && (
                    <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900">
                        <div className="flex items-start gap-2.5">
                            <AlertCircle className="size-4 shrink-0 text-red-600" />
                            <div>
                                <span className="font-bold">
                                    Pengajuan Belum Dapat Disetujui:
                                </span>
                                <p className="mt-1 text-red-800">
                                    {submission.rejection_reason ??
                                        'Catatan review tidak tersedia.'}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {submission.status === 'approved' && (
                    <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-xs text-green-900">
                        <div className="flex items-start gap-2.5">
                            <CheckCircle2 className="size-4 shrink-0 text-green-600" />
                            <div>
                                <span className="font-bold">
                                    Produk Disetujui & Resmi Masuk Katalog!
                                </span>
                                <p className="mt-1 text-green-800">
                                    Produkmu kini dijual secara resmi di
                                    koperasi sekolah. Pembeli dapat memesan
                                    melalui KOPDIG.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {submission.status === 'submitted' && (
                    <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                        <div className="flex items-start gap-2.5">
                            <Clock className="size-4 shrink-0 text-amber-600" />
                            <div>
                                <span className="font-bold">
                                    Pengajuan Masuk Antrean Review:
                                </span>
                                <p className="mt-1 text-amber-800">
                                    Pengurus koperasi akan memverifikasi
                                    kesesuaian kemasan, harga, dan ketersediaan
                                    etalase fisik koperasi.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Detail Card */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-semibold tracking-wider text-[var(--color-ink-muted)] uppercase">
                                    {submission.category?.name}
                                </span>
                                <StatusBadge variant={currentMeta.variant}>
                                    {currentMeta.label}
                                </StatusBadge>
                            </div>
                            <h1 className="font-display mt-1 text-lg font-bold text-[var(--color-ink)]">
                                {submission.name}
                            </h1>
                        </div>

                        <div className="text-right text-xs text-[var(--color-ink-muted)]">
                            Diajukan pada:{' '}
                            <span className="font-medium text-[var(--color-ink)]">
                                {new Date(
                                    submission.created_at,
                                ).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </span>
                        </div>
                    </div>

                    {/* Breakdown Grid */}
                    <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                            <span className="text-[10px] text-[var(--color-ink-muted)]">
                                Harga Modal Siswa
                            </span>
                            <div className="mt-1">
                                <PriceDisplay
                                    amount={submission.base_price}
                                    size="md"
                                />
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                            <span className="text-[10px] text-[var(--color-ink-muted)]">
                                Margin Koperasi
                            </span>
                            <div className="mt-1">
                                {submission.cooperative_margin !== null &&
                                submission.cooperative_margin !== undefined ? (
                                    <PriceDisplay
                                        amount={submission.cooperative_margin}
                                        size="md"
                                    />
                                ) : (
                                    <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                                        Menunggu Review
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] p-3">
                            <span className="text-[10px] text-[var(--color-ink-muted)]">
                                Harga Jual Akhir
                            </span>
                            <div className="mt-1">
                                {submission.proposed_selling_price ? (
                                    <PriceDisplay
                                        amount={
                                            submission.proposed_selling_price
                                        }
                                        size="md"
                                    />
                                ) : (
                                    <span className="text-xs font-medium text-[var(--color-ink-muted)]">
                                        Menunggu Review
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="mt-5">
                        <h4 className="text-xs font-bold text-[var(--color-ink)]">
                            Deskripsi Produk
                        </h4>
                        <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-line text-[var(--color-ink-muted)]">
                            {submission.description}
                        </p>
                    </div>

                    {/* Proposed Stock */}
                    <div className="mt-4 border-t border-[var(--color-border-subtle)] pt-4 text-xs">
                        <span className="text-[var(--color-ink-muted)]">
                            Rencana Stok Unit:{' '}
                        </span>
                        <span className="font-bold text-[var(--color-ink)]">
                            {submission.proposed_stock} pcs
                        </span>
                    </div>
                </div>
            </PageContainer>
        </AppShell>
    );
}
