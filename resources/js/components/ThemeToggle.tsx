import React, { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { useAppearance } from '@/hooks/use-appearance';

export const ThemeToggle: React.FC = () => {
    const { appearance, updateAppearance } = useAppearance();

    const isCooperativeRoute = (urlOrPath?: string, componentName?: string): boolean => {
        const path = (
            urlOrPath ||
            (typeof window !== 'undefined' ? window.location.pathname : '')
        ).toLowerCase();
        const comp = (componentName || '').toLowerCase();

        if (path.startsWith('/cooperative') || path.startsWith('/admin')) {
            return true;
        }

        if (comp.startsWith('cooperative/')) {
            return true;
        }

        if (typeof document !== 'undefined') {
            if (document.querySelector('.cooperative-shell') !== null) {
                return true;
            }
            const appEl = document.getElementById('app');
            const dataPage = appEl?.getAttribute('data-page') || '';
            if (dataPage.toLowerCase().includes('cooperative')) {
                return true;
            }
        }

        return false;
    };

    const [isCooperative, setIsCooperative] = useState<boolean>(() => isCooperativeRoute());

    useEffect(() => {
        const updateVisibility = (url?: string, component?: string) => {
            setIsCooperative(isCooperativeRoute(url, component));
        };

        // Initial verification on mount
        updateVisibility();

        // 1. Inertia lifecycle event listeners
        const removeStartListener = router.on('start', (event: any) => {
            const visitUrl =
                event?.detail?.visit?.url?.pathname ||
                event?.detail?.visit?.url?.href ||
                event?.detail?.visit?.url;
            if (visitUrl) updateVisibility(String(visitUrl));
        });

        const removeNavigateListener = router.on('navigate', (event: any) => {
            const pageUrl = event?.detail?.page?.url;
            const pageComp = event?.detail?.page?.component;
            updateVisibility(pageUrl, pageComp);
        });

        const removeSuccessListener = router.on('success', (event: any) => {
            const pageUrl = event?.detail?.page?.url;
            const pageComp = event?.detail?.page?.component;
            updateVisibility(pageUrl, pageComp);
        });

        const removeFinishListener = router.on('finish', () => {
            updateVisibility();
        });

        // 2. Browser history navigation
        const handlePopState = () => updateVisibility();
        window.addEventListener('popstate', handlePopState);

        // 3. MutationObserver to catch instantaneous DOM mounts of .cooperative-shell
        const observer = new MutationObserver(() => {
            const hasCoop = isCooperativeRoute();
            setIsCooperative(hasCoop);
        });

        observer.observe(document.body, { childList: true, subtree: true });

        return () => {
            removeStartListener();
            removeNavigateListener();
            removeSuccessListener();
            removeFinishListener();
            window.removeEventListener('popstate', handlePopState);
            observer.disconnect();
        };
    }, []);

    // Completely hide toggle on admin / cooperative dashboard
    if (isCooperative) {
        return null;
    }

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

    return (
        <button
            type="button"
            id="floating-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDark ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
            title={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            className="floating-theme-toggle fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex size-12 cursor-pointer items-center justify-center rounded-full border shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 bg-white border-neutral-200 text-neutral-800 shadow-neutral-900/15 hover:border-neutral-300 hover:bg-neutral-50 dark:bg-[#141414] dark:border-[#333333] dark:text-amber-400 dark:shadow-black/60 dark:hover:border-[#E34A27]/60 dark:hover:bg-[#1a1a1a]"
        >
            {isDark ? (
                <Sun className="size-5 shrink-0 text-amber-400 stroke-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
                <Moon className="size-5 shrink-0 text-neutral-800 stroke-neutral-800 transition-transform duration-300 hover:-rotate-12" />
            )}
        </button>
    );
};

export default ThemeToggle;
