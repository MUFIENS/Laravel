import React from 'react';
import { User as UserIcon, LogIn, Store, ShieldCheck } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import type { User } from '@/types/auth';

interface MobileHeaderProps {
    title?: string;
    subtitle?: string;
    userName?: string;
    isAuthenticated?: boolean;
    actions?: React.ReactNode;
    className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
    title,
    subtitle,
    userName,
    isAuthenticated,
    actions,
    className = '',
}) => {
    const page = usePage<{ auth?: { user?: User | null } }>();
    const currentUser = page.props.auth?.user;
    const isAuthed =
        isAuthenticated !== undefined ? isAuthenticated : Boolean(currentUser);
    const resolvedName = userName || currentUser?.name;
    const homeHref = isAuthed
        ? currentUser?.role === 'cooperative'
            ? '/cooperative'
            : '/explore'
        : '/';

    return (
        <header
            className={`sticky top-0 z-30 border-b border-[var(--color-border-subtle)] bg-[var(--color-canvas)]/90 px-4 py-3 backdrop-blur-md transition-all sm:px-6 ${className}`}
        >
            <div className="flex items-center justify-between gap-3">
                {/* Brand / Title section */}
                <div className="min-w-0">
                    {title ? (
                        <div>
                            <h1 className="truncate font-heading text-base leading-tight font-bold text-ink sm:text-lg">
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="mt-0.5 truncate text-xs text-muted">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    ) : (
                        <Link
                            href={homeHref}
                            className="flex items-center gap-2"
                        >
                            <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-primary)] font-heading text-xs font-bold text-white shadow-xs">
                                KD
                            </div>
                            <div>
                                <span className="block font-heading text-sm leading-tight font-bold tracking-tight text-[var(--color-ink)]">
                                    KOPDIG
                                </span>
                                <span className="block text-[10px] font-medium tracking-tight text-[var(--color-ink-muted)]">
                                    Ruang Niaga Warga Sekolah
                                </span>
                            </div>
                        </Link>
                    )}
                </div>

                {/* Right actions & user profile */}
                <div className="flex shrink-0 items-center gap-2">
                    {actions}

                    {isAuthed && currentUser?.role === 'cooperative' && (
                        <Link
                            href="/cooperative/consignments"
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-soft)]/80"
                        >
                            <ShieldCheck className="size-3.5" />
                            <span className="hidden sm:inline">
                                Portal
                            </span>{' '}
                            Koperasi
                        </Link>
                    )}

                    {isAuthed && currentUser?.role === 'student' && (
                        <Link
                            href="/student/consignments"
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold text-[var(--color-ink)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)]"
                        >
                            <Store className="size-3.5 text-[var(--color-primary)]" />
                            <span className="hidden sm:inline">Titipan</span>{' '}
                            Saya
                        </Link>
                    )}

                    {isAuthed ? (
                        <Link
                            href="/settings/profile"
                            className="flex size-8 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink)] shadow-xs transition-colors hover:border-[var(--color-primary)]/50"
                            aria-label="Profil Pengguna"
                            title={resolvedName || 'Profil'}
                        >
                            <UserIcon className="size-4 text-[var(--color-primary)]" />
                        </Link>
                    ) : (
                        <Link
                            href="/login"
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white shadow-xs transition-colors hover:bg-[var(--color-primary-hover)]"
                        >
                            <LogIn className="size-3.5" />
                            <span>Masuk</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};
