import React from 'react';

export type StatusBadgeVariant =
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'accent';

interface StatusBadgeProps {
    children: React.ReactNode;
    variant?: StatusBadgeVariant;
    icon?: React.ReactNode;
    className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
    children,
    variant = 'default',
    icon,
    className = '',
}) => {
    const variantStyles: Record<StatusBadgeVariant, string> = {
        default: 'bg-[#181818] text-[#A3A3A3] border-[#262626]',
        success: 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20',
        warning: 'bg-amber-950/40 text-amber-400 border-amber-500/20',
        danger: 'bg-rose-950/40 text-rose-400 border-rose-500/20',
        info: 'bg-sky-950/40 text-sky-400 border-sky-500/20',
        accent: 'bg-[#E34A27]/10 text-[#E34A27] border-[#E34A27]/20',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${variantStyles[variant]} ${className}`}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{children}</span>
        </span>
    );
};
