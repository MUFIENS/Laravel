import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ExternalLink, LogOut, ShieldCheck } from 'lucide-react';
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
        <div className="flex h-full flex-col justify-between bg-[var(--color-surface)] text-[var(--color-ink)]">
            {/* Top Brand Section */}
            <div>
                <div className="border-b border-[var(--color-border-subtle)] px-6 py-5">
                    <Link
                        href="/cooperative"
                        className="group flex items-center gap-3"
                        onClick={onNavigate}
                    >
                        <div className="flex size-10 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-sm transition-transform group-hover:scale-105">
                            <ShieldCheck
                                className="size-6 text-[var(--color-accent)]"
                                aria-hidden="true"
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="font-display text-base font-black tracking-tight text-[var(--color-primary)]">
                                    KOPDIG
                                </span>
                                <span className="rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[9px] font-bold tracking-wider text-[var(--color-primary)] uppercase">
                                    Koperasi
                                </span>
                            </div>
                            <p className="truncate text-xs font-medium text-[var(--color-ink-muted)]">
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
                    <div className="px-3 pb-2 text-[10px] font-bold tracking-wider text-[var(--color-ink-muted)] uppercase">
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
                                className={`group flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all ${
                                    isActive
                                        ? 'border-l-4 border-[var(--color-primary)] bg-[var(--color-primary-soft)] font-semibold text-[var(--color-primary)] shadow-xs'
                                        : 'text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]'
                                }`}
                                aria-current={isActive ? 'page' : undefined}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        className={`size-4.5 transition-colors ${
                                            isActive
                                                ? 'text-[var(--color-primary)]'
                                                : 'text-[var(--color-ink-muted)] group-hover:text-[var(--color-ink)]'
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
                                        className={`rounded-md px-1.5 py-0.5 text-[9px] font-semibold tracking-wide ${
                                            item.status === 'active'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]'
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
            <div className="border-t border-[var(--color-border-subtle)] p-3">
                {/* Switch to Student Catalog */}
                <Link
                    href="/explore"
                    className="flex min-h-[44px] items-center justify-between rounded-xl px-3 py-2 text-xs font-medium text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-primary)]"
                >
                    <span className="flex items-center gap-2">
                        <ExternalLink className="size-4" aria-hidden="true" />
                        Buka Katalog Siswa
                    </span>
                    <span className="text-[10px] text-[var(--color-ink-muted)]">
                        ↗
                    </span>
                </Link>

                {/* Authenticated Cooperative Staff Card */}
                <div className="mt-2 flex items-center justify-between rounded-xl bg-[var(--color-surface-subtle)]/70 p-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div
                            className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-white shadow-xs"
                            aria-hidden="true"
                        >
                            {getInitials(user?.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-bold text-[var(--color-ink)]">
                                {user?.name ?? 'Pengurus Koperasi'}
                            </p>
                            <span className="inline-block rounded-sm text-[10px] font-medium text-[var(--color-primary)]">
                                Pengurus Koperasi
                            </span>
                        </div>
                    </div>

                    {/* Direct Logout Action */}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-rose-50 hover:text-[var(--color-status-danger)] focus:ring-2 focus:ring-[var(--color-status-danger)] focus:outline-hidden"
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
