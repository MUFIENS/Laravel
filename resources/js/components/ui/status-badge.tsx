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
        default: 'bg-primary-soft text-primary border-[#D0E2D8]',
        success: 'bg-[#EBF7F1] text-success border-[#C3E8D6]',
        warning: 'bg-[#FDF6EB] text-warning border-[#F6E1C3]',
        danger: 'bg-[#FDF0F0] text-danger border-[#F6D0D0]',
        info: 'bg-[#EEF5F9] text-info border-[#D2E4EF]',
        accent: 'bg-[#FCF7ED] text-[#8C6212] border-[#F2DEBA]',
    };

    return (
        <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${variantStyles[variant]} ${className}`}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{children}</span>
        </span>
    );
};
