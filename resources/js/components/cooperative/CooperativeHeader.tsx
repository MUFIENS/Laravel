import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu, ShieldCheck } from 'lucide-react';
import type { Auth } from '@/types/auth';

interface Props {
    title?: string;
    breadcrumbs?: { label: string; href?: string }[];
    onOpenMobileNav: () => void;
    isMobileNavOpen: boolean;
}

export const CooperativeHeader: React.FC<Props> = ({
    title,
    breadcrumbs,
    onOpenMobileNav,
    isMobileNavOpen,
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
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
                {/* Mobile hamburger menu toggle */}
                <button
                    type="button"
                    onClick={onOpenMobileNav}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-hidden md:hidden"
                    aria-label="Buka menu navigasi"
                    aria-expanded={isMobileNavOpen}
                    aria-controls="cooperative-mobile-drawer"
                >
                    <Menu className="size-5" aria-hidden="true" />
                </button>

                {/* Mobile brand indicator */}
                <div className="flex items-center gap-2 md:hidden">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white shadow-xs">
                        <ShieldCheck
                            className="size-4.5 text-[var(--color-accent)]"
                            aria-hidden="true"
                        />
                    </div>
                    <span className="font-display text-sm font-bold text-[var(--color-primary)]">
                        KOPDIG
                    </span>
                </div>

                {/* Desktop Breadcrumb / Title hierarchy */}
                <nav
                    aria-label="Breadcrumb navigasi"
                    className="hidden items-center gap-2 text-xs md:flex"
                >
                    <Link
                        href="/cooperative"
                        className="font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-primary)]"
                    >
                        Ruang Kerja Koperasi
                    </Link>
                    {breadcrumbs && breadcrumbs.length > 0
                        ? breadcrumbs.map((crumb) => (
                              <React.Fragment key={crumb.label}>
                                  <span className="text-[var(--color-border)]">
                                      /
                                  </span>
                                  {crumb.href ? (
                                      <Link
                                          href={crumb.href}
                                          className="font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-primary)]"
                                      >
                                          {crumb.label}
                                      </Link>
                                  ) : (
                                      <span
                                          className="font-semibold text-[var(--color-ink)]"
                                          aria-current="page"
                                      >
                                          {crumb.label}
                                      </span>
                                  )}
                              </React.Fragment>
                          ))
                        : title && (
                              <>
                                  <span className="text-[var(--color-border)]">
                                      /
                                  </span>
                                  <span
                                      className="font-semibold text-[var(--color-ink)]"
                                      aria-current="page"
                                  >
                                      {title}
                                  </span>
                              </>
                          )}
                </nav>
            </div>

            {/* Right side operational status & user context */}
            <div className="flex items-center gap-3">
                {/* Role badge */}
                <div className="hidden items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)] sm:flex">
                    <span
                        className="size-1.5 rounded-full bg-emerald-600"
                        aria-hidden="true"
                    />
                    <span>Petugas Koperasi</span>
                </div>

                {/* User avatar & name */}
                <div className="flex items-center gap-2 border-l border-[var(--color-border-subtle)] pl-2">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)] text-xs font-bold text-white shadow-xs"
                        aria-hidden="true"
                    >
                        {getInitials(user?.name)}
                    </div>
                    <span className="hidden max-w-[140px] truncate text-xs font-semibold text-[var(--color-ink)] lg:inline-block">
                        {user?.name ?? 'Pengurus'}
                    </span>

                    {/* Quick Logout */}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[var(--color-ink-muted)] transition-colors hover:bg-rose-50 hover:text-[var(--color-status-danger)] focus:ring-2 focus:ring-[var(--color-status-danger)] focus:outline-hidden"
                        title="Keluar dari akun"
                        aria-label="Keluar dari akun"
                    >
                        <LogOut className="size-4" aria-hidden="true" />
                    </Link>
                </div>
            </div>
        </header>
    );
};
