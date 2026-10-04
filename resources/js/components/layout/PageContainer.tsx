import React from 'react';

interface PageContainerProps {
    children: React.ReactNode;
    className?: string;
}

export const PageContainer: React.FC<PageContainerProps> = ({
    children,
    className = '',
}) => {
    return (
        <main
            className={`mx-auto max-w-md space-y-6 px-4 py-4 sm:px-6 md:max-w-2xl lg:max-w-4xl ${className}`}
        >
            {children}
        </main>
    );
};
