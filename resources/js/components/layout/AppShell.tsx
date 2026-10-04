import React from 'react';
import { usePage } from '@inertiajs/react';
import { MobileHeader } from './MobileHeader';
import { BottomNavigation, NavItemKey } from './BottomNavigation';

interface AppShellProps {
    children: React.ReactNode;
    activeTab?: NavItemKey;
    cartCount?: number;
    title?: string;
    subtitle?: string;
    userName?: string;
    isAuthenticated?: boolean;
    headerActions?: React.ReactNode;
    hideBottomNav?: boolean;
    hideHeader?: boolean;
    className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
    children,
    activeTab = 'home',
    cartCount,
    title,
    subtitle,
    userName,
    isAuthenticated = false,
    headerActions,
    hideBottomNav = false,
    hideHeader = false,
    className = '',
}) => {
    const pageProps = usePage<{ cartCount?: number }>().props;
    const resolvedCartCount = cartCount ?? pageProps.cartCount ?? 0;
    return (
        <div
            className={`flex min-h-screen flex-col bg-canvas font-sans text-ink ${className}`}
        >
            {!hideHeader && (
                <div className="mx-auto w-full max-w-md md:max-w-2xl lg:max-w-4xl">
                    <MobileHeader
                        title={title}
                        subtitle={subtitle}
                        userName={userName}
                        isAuthenticated={isAuthenticated}
                        actions={headerActions}
                    />
                </div>
            )}

            <div className="w-full flex-1 pb-24 md:pb-28">{children}</div>

            {!hideBottomNav && (
                <BottomNavigation
                    activeTab={activeTab}
                    cartCount={resolvedCartCount}
                />
            )}
        </div>
    );
};
