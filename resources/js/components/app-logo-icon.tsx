import type { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({
    className,
    alt = 'Logo KOPDIG SMKN 1 Ciomas',
    ...props
}: ImgHTMLAttributes<HTMLImageElement> & { [key: string]: any }) {
    return (
        <img
            src="/images/logo.png"
            alt={alt}
            className={`object-contain ${className ?? ''}`}
            {...props}
        />
    );
}

