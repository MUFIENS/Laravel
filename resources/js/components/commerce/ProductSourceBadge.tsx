import React from 'react';
import { Store, UserCheck } from 'lucide-react';

export type ProductSourceType = 'cooperative' | 'student';

interface ProductSourceBadgeProps {
    source: ProductSourceType;
    ownerName?: string;
    className?: string;
}

export const ProductSourceBadge: React.FC<ProductSourceBadgeProps> = ({
    source,
    ownerName,
    className = '',
}) => {
    if (source === 'student') {
        return (
            <span
                className={`inline-flex items-center gap-1 rounded-full border border-[#EEDBBA] bg-[#FBF4E4] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[#8C6212] ${className}`}
                title={`Produk titipan siswa: ${ownerName || 'Siswa'}`}
            >
                <UserCheck className="size-3 text-[#A97122]" />
                <span className="max-w-[130px] truncate">
                    Dititipkan oleh {ownerName || 'Siswa'}
                </span>
            </span>
        );
    }

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border border-[#D0E2D8] bg-primary-soft px-2 py-0.5 text-[11px] font-medium tracking-tight text-primary ${className}`}
            title="Produk resmi Koperasi Sekolah"
        >
            <Store className="size-3 text-primary" />
            <span>Koperasi</span>
        </span>
    );
};
