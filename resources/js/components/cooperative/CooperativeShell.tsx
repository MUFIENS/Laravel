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
        <div
            className="dark relative min-h-screen bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white"
            style={
                {
                    '--color-canvas': '#0A0A0A',
                    '--color-surface': '#121212',
                    '--color-surface-subtle': '#161616',
                    '--color-border': '#262626',
                    '--color-border-subtle': '#262626',
                    '--color-ink': '#F5F2EB',
                    '--color-ink-muted': '#A3A3A3',
                    '--color-muted': '#737373',
                    '--color-primary': '#E34A27',
                    '--color-primary-hover': '#cf3e1d',
                    '--color-primary-soft': 'rgba(227, 74, 39, 0.12)',
                } as React.CSSProperties
            }
        >
            {title && <Head title={`${title} — Koperasi KOPDIG`} />}

            {/* Atmospheric Background System */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.08),transparent)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#26262610_1px,transparent_1px),linear-gradient(to_bottom,#26262610_1px,transparent_1px)] bg-[size:40px_40px]"
            />

            {/* Desktop Persistent Sidebar */}
            <aside
                aria-label="Sidebar Koperasi"
                className="z-40 hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col md:border-r md:border-[#262626] md:bg-[#0E0E0E]"
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
