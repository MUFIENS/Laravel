import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center">
                <AppLogoIcon className="size-7 drop-shadow-xs" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-heading font-bold text-[#F5F2EB]">
                    {name ?? 'KOPDIG'}
                </span>
                <span className="truncate font-mono text-[9px] tracking-wider text-[#737373] uppercase">
                    SMKN 1 CIOMAS
                </span>
            </div>
        </>
    );
}
