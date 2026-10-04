import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ExternalLink, LogOut } from 'lucide-react';
import { COOPERATIVE_NAV_ITEMS } from './nav-config';
import type { CooperativeNavKey } from '@/types/cooperative-navigation';
import type { Auth } from '@/types/auth';

interface Props {
    activeNav?: CooperativeNavKey;
    onNavigate?: () => void;
}

export const CooperativeSidebarContent: React.FC<Props> = ({
    activeNav = 'overview',
    onNavigate,
}) => {
    const { auth } = usePage<{ auth?: Auth }>().props;
    const user = auth?.user;

    const getInitials = (name?: string) => {
        if (!name) return 'KP';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[1][0]).toUpperCase();
    };

    return (
        <div className="flex h-full flex-col justify-between bg-[#0E0E0E] text-[#F5F2EB]">
            {/* Top Brand Section */}
            <div>
                <div className="border-b border-[#262626] px-6 py-5">
                    <Link
                        href="/cooperative"
                        className="group flex items-center gap-3"
                        onClick={onNavigate}
                    >
                        <div className="flex size-9 items-center justify-center bg-[#F5F2EB] font-heading text-sm font-black text-[#0A0A0A] shadow-xs transition-transform duration-300 group-hover:scale-95 group-hover:rotate-6">
                            K
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-heading text-base font-bold tracking-tight text-[#F5F2EB]">
                                    KOPDIG
                                </span>
                                <span className="border border-[#E34A27]/30 bg-[#E34A27]/10 px-2 py-0.5 font-mono text-[9px] font-bold tracking-widest text-[#E34A27] uppercase">
                                    Koperasi
                                </span>
                            </div>
                            <p className="truncate text-xs font-medium text-[#737373]">
                                Ruang Niaga Warga Sekolah
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Primary Navigation Menu */}
                <nav
                    aria-label="Navigasi Pengurus Koperasi"
                    className="space-y-1 px-3 py-4"
                >
                    <div className="px-3 pb-2 font-mono text-[10px] font-bold tracking-widest text-[#737373] uppercase">
                        Menu Operasional
                    </div>
                    {COOPERATIVE_NAV_ITEMS.map((item) => {
                        const isActive = activeNav === item.key;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                onClick={onNavigate}
                                className={`group flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2.5 text-xs transition-all ${
                                    isActive
                                        ? 'border-l-2 border-[#E34A27] bg-[#181818] font-semibold text-[#F5F2EB] shadow-xs'
                                        : 'text-[#A3A3A3] hover:bg-[#141414] hover:text-[#F5F2EB]'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        className={`size-4.5 transition-colors ${
                                            isActive
                                                ? 'text-[#E34A27]'
                                                : 'text-[#737373] group-hover:text-[#F5F2EB]'
                                        }`}
                                        aria-hidden="true"
                                    />
                                    <span>{item.label}</span>
                                    {isActive && (
                                        <span className="sr-only">
                                            (halaman aktif)
                                        </span>
                                    )}
                                </div>

                                {item.badge && (
                                    <span
                                        className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-semibold tracking-wide ${
                                            item.status === 'active'
                                                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                : 'border border-[#262626] bg-[#141414] text-[#737373]'
                                        }`}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
            </div>

            {/* Bottom Actions & User Profile */}
            <div className="border-t border-[#262626] p-3">
                {/* Switch to Student Catalog */}
                <Link
                    href="/explore"
                    className="flex min-h-[44px] items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-[#737373] transition-colors hover:bg-[#141414] hover:text-[#F5F2EB]"
                >
                    <span className="flex items-center gap-2">
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Buka Katalog Siswa
                    </span>
                    <span className="text-[10px] text-[#737373]">↗</span>
                </Link>

                {/* Authenticated Cooperative Staff Card */}
                <div className="mt-2 flex items-center justify-between rounded-lg border border-[#262626] bg-[#141414] p-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className="flex size-9 shrink-0 items-center justify-center rounded bg-[#E34A27] text-xs font-bold text-white shadow-xs"
                            aria-hidden="true"
                        >
                            {getInitials(user?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[#F5F2EB]">
                                {user?.name ?? 'Pengurus Koperasi'}
                            </p>
                            <span className="inline-block font-mono text-[10px] font-semibold text-[#E34A27]">
                                Operator Koperasi
                            </span>
                        </div>
                    </div>

                    {/* Direct Logout Action */}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded text-[#737373] transition-colors hover:bg-rose-950/40 hover:text-rose-400 focus:ring-2 focus:ring-[#E34A27] focus:outline-hidden"
                        title="Keluar dari akun"
                        aria-label="Keluar dari akun koperasi"
                    >
                        <LogOut className="size-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </div>
    );
};
