import { AlertCircle } from 'lucide-react';
import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export default function InputError({
    message,
    className = '',
    ...props
}: HTMLAttributes<HTMLParagraphElement> & { message?: string }) {
    return message ? (
        <p
            {...props}
            className={cn(
                'mt-1 flex items-center gap-1.5 text-xs font-medium text-red-400',
                className,
            )}
        >
            <AlertCircle className="size-3.5 shrink-0" />
            <span>{message}</span>
        </p>
    ) : null;
}
