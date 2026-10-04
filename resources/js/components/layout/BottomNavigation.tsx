import React from 'react';
import { Home, Compass, Package, ShoppingBag } from 'lucide-react';
import { Link, usePage } from '@inertiajs/react';
import type { User } from '@/types/auth';

export type NavItemKey = 'home' | 'explore' | 'orders' | 'cart';

interface BottomNavigationProps {
    activeTab?: NavItemKey;
    cartCount?: number;
    className?: string;
}

interface NavItemDef {
    key: NavItemKey;
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
    activeTab = 'home',
    cartCount = 0,
    className = '',
}) => {
    const page = usePage<{ auth?: { user?: User | null } }>();
    const user = page.props.auth?.user;
    const homeHref = user
        ? user.role === 'cooperative'
            ? '/cooperative'
            : '/explore'
        : '/';

    const navItems: NavItemDef[] = [
        {
            key: 'home',
            label: 'Beranda',
            href: homeHref,
            icon: Home,
        },
        {
            key: 'explore',
            label: 'Jelajah',
            href: '/explore',
            icon: Compass,
        },
        {
            key: 'orders',
            label: 'Pesanan',
            href: '/orders',
            icon: Package,
        },
        {
            key: 'cart',
            label: 'Keranjang',
            href: '/cart',
            icon: ShoppingBag,
            badge: cartCount,
        },
    ];

    return (
        <nav
            aria-label="Navigasi Utama"
            className={`fixed bottom-4 left-1/2 z-40 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 ${className}`}
        >
            <div className="flex items-center justify-between rounded-full border border-border/90 bg-surface/95 p-1.5 shadow-lg shadow-ink/5 backdrop-blur-md">
                {navItems.map((item) => {
                    const isActive = activeTab === item.key;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`relative flex min-h-[42px] items-center justify-center gap-1.5 rounded-full px-3 py-2 transition-all duration-200 select-none sm:px-4 ${
                                isActive
                                    ? 'flex-1 bg-primary px-4 text-xs font-medium text-white shadow-xs'
                                    : 'flex-initial text-muted hover:text-ink active:scale-95'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                            aria-label={item.label}
                        >
                            <Icon
                                className={`size-4.5 ${isActive ? 'text-white' : 'text-muted'}`}
                            />

                            {isActive && (
                                <span className="animate-in font-heading font-medium tracking-tight duration-150 zoom-in-95 fade-in">
                                    {item.label}
                                </span>
                            )}

                            {/* Badge */}
                            {!isActive &&
                                item.badge !== undefined &&
                                item.badge > 0 && (
                                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full border-2 border-surface bg-primary text-[10px] font-bold text-white">
                                        {item.badge > 9 ? '9+' : item.badge}
                                    </span>
                                )}

                            {isActive &&
                                item.badge !== undefined &&
                                item.badge > 0 && (
                                    <span className="ml-0.5 flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-ink">
                                        {item.badge}
                                    </span>
                                )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
};
