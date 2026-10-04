import { router } from '@inertiajs/react';

const STORAGE_KEY_CURRENT = 'kopdig_current_url';
const STORAGE_KEY_PREV = 'kopdig_prev_url';

/**
 * Checks whether a given path is considered a root landing page or auth gate
 * where users should not be dumped upon clicking back buttons.
 */
export function isExcludedBackPath(url: string | null | undefined): boolean {
    if (!url) return true;

    // Normalize path by stripping origin, query, and hash
    let path = url;
    try {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            path = new URL(url).pathname;
        } else {
            path = url.split('?')[0].split('#')[0];
        }
    } catch {
        path = url.split('?')[0].split('#')[0];
    }

    if (path === '' || path === '/') {
        return true;
    }

    const excludedPrefixes = [
        '/login',
        '/register',
        '/forgot-password',
        '/reset-password',
        '/two-factor-challenge',
        '/verify-email',
        '/confirm-password',
    ];

    return excludedPrefixes.some((prefix) => path.startsWith(prefix));
}

/**
 * Initializes the navigation tracker to record current and previous URLs in sessionStorage.
 */
export function initNavigationTracker(): void {
    if (typeof window === 'undefined') return;

    try {
        // Record initial page load URL if empty
        const initialPath = window.location.pathname + window.location.search;
        if (!sessionStorage.getItem(STORAGE_KEY_CURRENT)) {
            sessionStorage.setItem(STORAGE_KEY_CURRENT, initialPath);
        }

        router.on('navigate', (event) => {
            try {
                const nextUrl = event.detail.page.url;
                const currentStored =
                    sessionStorage.getItem(STORAGE_KEY_CURRENT);

                if (currentStored && currentStored !== nextUrl) {
                    sessionStorage.setItem(STORAGE_KEY_PREV, currentStored);
                }
                sessionStorage.setItem(STORAGE_KEY_CURRENT, nextUrl);
            } catch {
                // Ignore storage quota or access errors
            }
        });
    } catch {
        // Catch any browser storage security exceptions
    }
}

/**
 * Safely navigates back to the previous page in history.
 * If there is no previous internal page, or if the previous page was the landing page ('/')
 * or an authentication gate, safely visits the provided fallback (defaults to '/explore').
 */
export function safeNavigateBack(fallback = '/explore'): void {
    if (typeof window === 'undefined') {
        router.visit(fallback);
        return;
    }

    try {
        const prevUrl = sessionStorage.getItem(STORAGE_KEY_PREV);
        const hasValidPrev = prevUrl && !isExcludedBackPath(prevUrl);

        // If browser history has depth and the tracked previous page was valid
        if (window.history.length > 1 && hasValidPrev) {
            window.history.back();
            return;
        }

        // If window.history length is > 1 but previous page wasn't tracked, inspect document.referrer
        if (window.history.length > 1 && !prevUrl && document.referrer) {
            try {
                const refUrl = new URL(document.referrer);
                if (
                    refUrl.origin === window.location.origin &&
                    !isExcludedBackPath(refUrl.pathname)
                ) {
                    window.history.back();
                    return;
                }
            } catch {
                // Ignore URL parsing errors
            }
        }
    } catch {
        // Ignore storage errors
    }

    // Default safe fallback (never landing page '/')
    router.visit(fallback);
}
