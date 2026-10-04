import React from 'react';

interface CategoryChipProps {
    label: string;
    isActive?: boolean;
    icon?: React.ReactNode;
    onClick?: () => void;
    className?: string;
}

export const CategoryChip: React.FC<CategoryChipProps> = ({
    label,
    isActive = false,
    icon,
    onClick,
    className = '',
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium whitespace-nowrap transition-all duration-150 select-none active:scale-98 ${
                isActive
                    ? 'border border-primary bg-primary font-semibold text-white shadow-xs'
                    : 'border border-border bg-surface text-ink hover:border-primary/40 hover:bg-[#F2EFE9]'
            } ${className}`}
            aria-pressed={isActive}
        >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
        </button>
    );
};
