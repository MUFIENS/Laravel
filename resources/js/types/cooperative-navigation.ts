import React from 'react';

export type CooperativeNavKey =
    | 'overview'
    | 'orders'
    | 'consignments'
    | 'products'
    | 'inventory'
    | 'payments'
    | 'pickup'
    | 'reports';

export interface CooperativeNavItem {
    key: CooperativeNavKey;
    label: string;
    href: string;
    icon: React.ComponentType<{
        className?: string;
        'aria-hidden'?: boolean | 'true' | 'false';
    }>;
    status: 'active' | 'upcoming';
    badge?: string;
    description: string;
}
