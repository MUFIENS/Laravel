import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { CooperativeSidebarContent } from './CooperativeSidebarContent';
import { CooperativeHeader } from './CooperativeHeader';
import { CooperativeMobileNav } from './CooperativeMobileNav';
import { CooperativePageContainer } from './CooperativePageContainer';
import type { CooperativeNavKey } from '@/types/cooperative-navigation';

interface Props {
    children: React.ReactNode;
    activeNav?: CooperativeNavKey;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
    className?: string;
    noContainer?: boolean;
}

export const CooperativeShell: React.FC<Props> = ({
    children,
    activeNav = 'overview',
    title,
    subtitle,
    actions,
    breadcrumbs,
    className = '',
    noContainer = false,
}) => {
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[var(--color-canvas)] font-sans text-[var(--color-ink)] antialiased">
            {title && <Head title={`${title} — Koperasi KOPDIG`} />}

            {/* Desktop Persistent Sidebar */}
            <aside
                aria-label="Sidebar Koperasi"
                className="z-40 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:border-[var(--color-border-subtle)] md:bg-[var(--color-surface)]"
            >
                <CooperativeSidebarContent activeNav={activeNav} />
            </aside>

            {/* Mobile Slide-over Drawer */}
            <CooperativeMobileNav
                isOpen={isMobileNavOpen}
                onClose={() => setIsMobileNavOpen(false)}
                activeNav={activeNav}
            />

            {/* Main Application Area */}
            <div className="flex flex-1 flex-col md:pl-64">
                {/* Unified Cooperative Header */}
                <CooperativeHeader
                    title={title}
                    breadcrumbs={breadcrumbs}
                    onOpenMobileNav={() => setIsMobileNavOpen(true)}
                    isMobileNavOpen={isMobileNavOpen}
                />

                {/* Content Container */}
                <div className="flex-1">
                    {noContainer ? (
                        children
                    ) : (
                        <CooperativePageContainer
                            title={title}
                            subtitle={subtitle}
                            actions={actions}
                            className={className}
                        >
                            {children}
                        </CooperativePageContainer>
                    )}
                </div>
            </div>
        </div>
    );
};
