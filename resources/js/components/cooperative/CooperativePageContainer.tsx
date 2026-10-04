import React from 'react';

interface Props {
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export const CooperativePageContainer: React.FC<Props> = ({
    title,
    subtitle,
    actions,
    children,
    className = '',
}) => {
    return (
        <main
            className={`mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 ${className}`}
        >
            {(title || actions) && (
                <div className="flex flex-col gap-4 border-b border-[var(--color-border-subtle)] pb-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        {title && (
                            <h1 className="font-display text-2xl font-bold tracking-tight text-[var(--color-ink)] sm:text-3xl">
                                {title}
                            </h1>
                        )}
                        {subtitle && (
                            <p className="mt-1 text-xs text-[var(--color-ink-muted)] sm:text-sm">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2">{actions}</div>
                    )}
                </div>
            )}

            {children}
        </main>
    );
};
