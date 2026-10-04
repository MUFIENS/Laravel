import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { LogOut, Menu } from 'lucide-react';
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
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[#262626] bg-[#0A0A0A]/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
                {/* Mobile hamburger menu toggle */}
                <button
                    type="button"
                    onClick={onOpenMobileNav}
                    className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-[#737373] transition-colors hover:bg-[#181818] hover:text-[#F5F2EB] focus:ring-2 focus:ring-[#E34A27] focus:outline-hidden md:hidden"
                    aria-label="Buka menu navigasi"
                    aria-expanded={isMobileNavOpen}
                    aria-controls="cooperative-mobile-drawer"
                >
                    <Menu className="size-5" aria-hidden="true" />
                </button>

                {/* Mobile brand indicator */}
                <div className="flex items-center gap-2 md:hidden">
                    <div className="flex size-7 items-center justify-center bg-[#F5F2EB] font-heading text-xs font-black text-[#0A0A0A] shadow-xs">
                        K
                    </div>
                    <span className="font-heading text-sm font-bold tracking-tight text-[#F5F2EB]">
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
                        className="font-medium text-[#737373] transition-colors hover:text-[#F5F2EB]"
                    >
                        Ruang Kerja Koperasi
                    </Link>
                    {breadcrumbs && breadcrumbs.length > 0
                        ? breadcrumbs.map((crumb) => (
                              <React.Fragment key={crumb.label}>
                                  <span className="text-[#333333]">/</span>
                                  {crumb.href ? (
                                      <Link
                                          href={crumb.href}
                                          className="font-medium text-[#737373] transition-colors hover:text-[#F5F2EB]"
                                      >
                                          {crumb.label}
                                      </Link>
                                  ) : (
                                      <span
                                          className="font-semibold text-[#F5F2EB]"
                                          aria-current="page"
                                      >
                                          {crumb.label}
                                      </span>
                                  )}
                              </React.Fragment>
                          ))
                        : title && (
                              <>
                                  <span className="text-[#333333]">/</span>
                                  <span
                                      className="font-semibold text-[#F5F2EB]"
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
                <div className="hidden items-center gap-1.5 rounded border border-[#E34A27]/30 bg-[#E34A27]/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-[#E34A27] sm:flex">
                    <span
                        className="size-1.5 rounded-full bg-emerald-400"
                        aria-hidden="true"
                    />
                    <span>Operator Koperasi</span>
                </div>

                {/* User avatar & name */}
                <div className="flex items-center gap-2 border-l border-[#262626] pl-3">
                    <div
                        className="flex size-8 shrink-0 items-center justify-center rounded bg-[#E34A27] text-xs font-bold text-white shadow-xs"
                        aria-hidden="true"
                    >
                        {getInitials(user?.name)}
                    </div>
                    <span className="hidden max-w-[140px] truncate text-xs font-semibold text-[#F5F2EB] lg:inline-block">
                        {user?.name ?? 'Pengurus'}
                    </span>

                    {/* Quick Logout */}
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="inline-flex min-h-[38px] min-w-[38px] items-center justify-center rounded text-[#737373] transition-colors hover:bg-rose-950/40 hover:text-rose-400 focus:ring-2 focus:ring-[#E34A27] focus:outline-hidden"
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
