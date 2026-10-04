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
            <div className="rounded-2xl border border-[#262626] bg-[#121212] p-8 text-center shadow-xs">
                <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#181818] text-[#737373]">
                    <Clock className="size-7" aria-hidden="true" />
                </div>

                <div className="mt-4">
                    <span className="inline-block rounded-full border border-[#262626] bg-[#1A1A1A] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#A3A3A3]">
                        Modul Fase Berikutnya
                    </span>
                    <h2 className="font-display mt-2 text-xl font-bold text-[#F5F2EB]">
                        {module}
                    </h2>
                    <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-[#737373] sm:text-sm">
                        {description}
                    </p>
                </div>

                <div className="mx-auto mt-8 max-w-md border-t border-[#262626] pt-6">
                    <p className="mb-3 text-xs font-semibold text-[#737373]">
                        Gunakan modul operasional yang sudah aktif:
                    </p>

                    <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
                        <Link
                            href="/cooperative/consignments"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#E34A27]/30 bg-[#E34A27]/15 px-4 py-2.5 text-xs font-semibold text-[#E34A27] transition-colors hover:bg-[#E34A27] hover:text-white"
                        >
                            <Inbox className="size-4" aria-hidden="true" />
                            <span>Review Titipan Siswa</span>
                        </Link>

                        <Link
                            href="/cooperative/pickup"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#E34A27] px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:bg-[#D03E1C]"
                        >
                            <QrCode className="size-4" aria-hidden="true" />
                            <span>Loket Pengambilan & QR</span>
                        </Link>
                    </div>

                    <div className="mt-6">
                        <Link
                            href="/cooperative"
                            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-[#737373] hover:text-[#F5F2EB]"
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
