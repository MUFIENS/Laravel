import React from 'react';

interface PriceDisplayProps {
    amount: number;
    originalAmount?: number;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const formatRupiah = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
};

export const PriceDisplay: React.FC<PriceDisplayProps> = ({
    amount,
    originalAmount,
    size = 'md',
    className = '',
}) => {
    const sizeClasses = {
        sm: 'text-sm font-semibold',
        md: 'text-base font-bold',
        lg: 'text-lg font-bold',
        xl: 'text-2xl font-bold',
    };

    return (
        <div
            className={`inline-flex items-baseline gap-1.5 font-heading ${className}`}
        >
            <span className={`text-ink ${sizeClasses[size]}`}>
                {formatRupiah(amount)}
            </span>
            {originalAmount && originalAmount > amount && (
                <span className="text-xs font-normal text-muted line-through">
                    {formatRupiah(originalAmount)}
                </span>
            )}
        </div>
    );
};
