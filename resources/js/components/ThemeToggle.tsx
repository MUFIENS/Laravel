import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

interface ThemeToggleProps {
    className?: string;
    size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
    className = '',
    size = 'md',
}) => {
    const { appearance, updateAppearance } = useAppearance();
    const isDark =
        appearance === 'dark' ||
        (appearance === 'system' &&
            typeof window !== 'undefined' &&
            window.matchMedia('(prefers-color-scheme: dark)').matches);

    const toggleTheme = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        updateAppearance(isDark ? 'light' : 'dark');
    };

    const sizeClasses =
        size === 'sm' ? 'size-8.5 sm:size-9 text-xs' : 'size-9 sm:size-10 text-sm';

    return (
        <button
            type="button"
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            title={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            className={`theme-toggle-btn relative flex shrink-0 cursor-pointer items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-800 shadow-xs backdrop-blur-md transition-all duration-300 hover:border-[#E34A27] hover:text-[#E34A27] dark:border-[#262626] dark:bg-[#141414] dark:text-[#F5F2EB] dark:hover:border-[#E34A27] dark:hover:text-[#E34A27] active:scale-95 ${sizeClasses} ${className}`}
        >
            {isDark ? (
                <Sun className="size-4 shrink-0 text-amber-400 stroke-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
                <Moon className="size-4 shrink-0 text-neutral-800 stroke-neutral-800 transition-transform duration-300 hover:-rotate-12" />
            )}
        </button>
    );
};

export default ThemeToggle;
