import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Clock, Inbox, QrCode } from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import type { CooperativeNavKey } from '@/types/cooperative-navigation';

interface Props {
    module: string;
    description: string;
    activeNav: CooperativeNavKey;
}

export default function CooperativePlaceholder({
    module,
    description,
    activeNav,
}: Props) {
    return (
        <CooperativeShell
            activeNav={activeNav}
            title={module}
            subtitle="Modul operasional dalam perencanaan roadmap KOPDIG."
            breadcrumbs={[{ label: module }]}
        >
            <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center shadow-xs">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
                    <Clock className="size-7" aria-hidden="true" />
                </div>

                <div className="mt-4">
                    <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-semibold tracking-wide text-zinc-700">
                        Modul Fase Berikutnya
                    </span>
                    <h2 className="font-display mt-2 text-xl font-bold text-[var(--color-ink)]">
                        {module}
                    </h2>
                    <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[var(--color-ink-muted)] sm:text-sm">
                        {description}
                    </p>
                </div>

                <div className="mx-auto mt-8 max-w-md border-t border-[var(--color-border-subtle)] pt-6">
                    <p className="mb-3 text-xs font-semibold text-[var(--color-ink-muted)]">
                        Gunakan modul operasional yang sudah aktif:
                    </p>

                    <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                        <Link
                            href="/cooperative/consignments"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-soft)] px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)] hover:text-white"
                        >
                            <Inbox className="size-4" aria-hidden="true" />
                            <span>Review Titipan Siswa</span>
                        </Link>

                        <Link
                            href="/cooperative/pickup"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            <QrCode className="size-4" aria-hidden="true" />
                            <span>Loket Pengambilan & QR</span>
                        </Link>
                    </div>

                    <div className="mt-6">
                        <Link
                            href="/cooperative"
                            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                        >
                            <ArrowLeft
                                className="size-3.5"
                                aria-hidden="true"
                            />
                            <span>Kembali ke Overview Koperasi</span>
                        </Link>
                    </div>
                </div>
            </div>
        </CooperativeShell>
    );
}
