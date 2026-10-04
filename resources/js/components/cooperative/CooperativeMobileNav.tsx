import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { CooperativeSidebarContent } from './CooperativeSidebarContent';
import type { CooperativeNavKey } from '@/types/cooperative-navigation';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    activeNav?: CooperativeNavKey;
}

export const CooperativeMobileNav: React.FC<Props> = ({
    isOpen,
    onClose,
    activeNav,
}) => {
    // Handle ESC key to close drawer
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            id="cooperative-mobile-drawer"
            className="fixed inset-0 z-50 flex md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu navigasi koperasi"
        >
            {/* Backdrop overlay */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Slide-over panel */}
            <div className="relative flex w-full max-w-xs flex-1 animate-in flex-col bg-[var(--color-surface)] shadow-2xl transition-transform duration-200 slide-in-from-left">
                {/* Close Button Header */}
                <div className="absolute top-3 right-3 z-10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-hidden"
                        aria-label="Tutup menu navigasi"
                    >
                        <X className="size-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Content */}
                <div className="h-full overflow-y-auto pt-2">
                    <CooperativeSidebarContent
                        activeNav={activeNav}
                        onNavigate={onClose}
                    />
                </div>
            </div>
        </div>
    );
};
