import { Link } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { home } from '@/routes';
import { safeNavigateBack } from '@/lib/navigation';

import type { RouteDefinition } from '@/wayfinder';

export type AuthSplitLayoutProps = {
    children?: ReactNode;
    mode?: 'login' | 'register';
    badge?: string;
    title?: string;
    description?: string;
    visualImage?: string;
    visualTag?: string;
    visualHeadline?: string;
    visualSubtext?: string;
    visualAnnotation?: string;
    switchText?: string;
    switchLinkText?: string;
    switchLinkHref?: string | RouteDefinition<'get'>;
    status?: string;
};

export default function AuthSplitLayout({
    children,
    mode = 'login',
    badge = mode === 'login' ? 'Portal Masuk Resmi' : 'Pendaftaran Akun Siswa',
    title = mode === 'login' ? 'Masuk ke KOPDIG' : 'Gabung ke KOPDIG',
    description = mode === 'login'
        ? 'Masuk ke ruang niaga warga sekolah.'
        : 'Mulai menjelajahi, berkarya, dan bertransaksi bersama warga sekolah.',
    visualImage = mode === 'login'
        ? '/images/campaign/community-counter.jpg'
        : '/images/campaign/student-craft.jpg',
    visualTag = mode === 'login'
        ? 'Autentikasi Warga Sekolah'
        : 'Konsinyasi & Karya Siswa',
    visualHeadline = mode === 'login'
        ? 'RUANG NIAGA MANDIRI WARGA SEKOLAH.'
        : 'DARI RUANG KELAS, MENUJU ETALASE DIGITAL.',
    visualSubtext = mode === 'login'
        ? 'Platform resmi koperasi sekolah untuk kurasi produk konsinyasi karya siswa, pemesanan digital cepat, dan pengambilan pesanan tanpa antrean tunai.'
        : 'Daftarkan karya kejuruanmu, pantau proses kurasi oleh pengurus koperasi sekolah, dan mulai bertransaksi secara resmi di ekosistem sekolah.',
    visualAnnotation = mode === 'login'
        ? '[ FIG. AUTH-01 — LOKET & TRANSAKSI RESMI ]'
        : '[ FIG. AUTH-02 — KARYA KREASI MANDIRI SISWA ]',
    switchText = mode === 'login' ? 'Belum punya akun?' : 'Sudah punya akun?',
    switchLinkText = mode === 'login'
        ? 'Daftar sebagai Siswa'
        : 'Masuk ke Akun',
    switchLinkHref = mode === 'login' ? '/register' : '/login',
    status,
}: AuthSplitLayoutProps) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white lg:flex-row">
            {/* 1. PRIMARY FORM COLUMN (42% on desktop, 100% on mobile) */}
            <div className="relative z-10 flex min-h-screen w-full flex-col justify-between px-6 py-8 sm:px-12 sm:py-10 lg:w-[45%] lg:px-14 lg:py-12 xl:w-[42%]">
                {/* Top Navigation Header */}
                <header className="auth-reveal flex items-center justify-between pb-6">
                    <Link
                        href={home()}
                        className="group flex items-center gap-3 transition-opacity hover:opacity-90 active:scale-95"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo SMK Negeri 1 Ciomas - KOPDIG"
                            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-sm"
                        />
                        <div className="flex flex-col">
                            <span className="font-heading text-sm leading-none font-bold tracking-tight text-[#F5F2EB]">
                                KOPDIG
                            </span>
                            <span className="mt-0.5 font-mono text-[9px] tracking-wider text-[#737373] uppercase">
                                SMKN 1 Ciomas
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Switcher Action */}
                    <div className="hidden items-center gap-1.5 text-xs text-[#737373] sm:flex">
                        <span>{switchText}</span>
                        <Link
                            href={switchLinkHref}
                            className="font-medium text-[#F5F2EB] underline-offset-4 transition-colors hover:text-[#E34A27] hover:underline"
                        >
                            {switchLinkText}
                        </Link>
                    </div>
                </header>

                {/* Center Form Container */}
                <main className="auth-reveal my-auto w-full max-w-[400px] py-6 sm:py-10">
                    {/* Editorial Badge */}
                    <div className="mb-4 inline-flex items-center gap-2 border border-[#262626] bg-[#141414] px-2.5 py-1">
                        <span className="size-1.5 animate-pulse rounded-full bg-[#E34A27]" />
                        <span className="font-mono text-[10px] tracking-widest text-[#A3A3A3] uppercase">
                            {badge}
                        </span>
                    </div>

                    {/* Heading & Subtitle */}
                    <h1 className="font-heading text-3xl font-black tracking-tight text-[#F5F2EB] sm:text-4xl">
                        {title}
                    </h1>
                    <p className="mt-2 text-sm leading-relaxed text-[#888888]">
                        {description}
                    </p>

                    {/* Status Feedback Banner */}
                    {status && (
                        <div className="mt-5 flex items-center gap-2.5 border border-[#262626] bg-[#141414] p-3 text-xs font-medium text-emerald-400">
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
                            <span>{status}</span>
                        </div>
                    )}

                    {/* Interactive Form Component */}
                    <div className="mt-6 sm:mt-8">{children}</div>
                </main>

                {/* Bottom Footer Bar */}
                <footer className="auth-reveal flex items-center justify-between border-t border-[#1C1C1C] pt-6 font-mono text-[11px] text-[#525252]">
                    <span>© 2026 KOPDIG</span>
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="group flex cursor-pointer items-center gap-1 text-[#737373] transition-colors hover:text-[#F5F2EB]"
                        aria-label="Kembali ke halaman sebelumnya"
                    >
                        <ArrowLeft className="size-3 transition-transform duration-300 group-hover:-translate-x-1" />
                        <span>Kembali</span>
                    </button>
                </footer>
            </div>

            {/* 2. VISUAL / BRAND COLUMN (58% on desktop, hidden on mobile) */}
            <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden border-l border-[#262626] bg-[#141414] p-10 select-none lg:flex lg:w-[55%] xl:w-[58%] xl:p-14">
                {/* High-Resolution Editorial Background Artwork */}
                <img
                    src={visualImage}
                    alt={visualHeadline}
                    className="absolute inset-0 h-full w-full object-cover brightness-[0.82] contrast-[1.08] transition-transform duration-1000 ease-out hover:scale-105"
                    loading="eager"
                    onError={(e) => {
                        e.currentTarget.src =
                            '/images/campaign/hero-editorial.jpg';
                    }}
                />

                {/* Atmospheric Dark Scrims */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-[#0A0A0A]/70" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,transparent_30%,#0A0A0A_95%)] opacity-80" />

                {/* Top Overlay Indicator */}
                <div className="relative z-10 flex items-center justify-between border-b border-white/10 pb-4 backdrop-blur-xs">
                    <div className="flex items-center gap-2">
                        <span className="size-2 rounded-full bg-[#E34A27]" />
                        <span className="font-mono text-[10px] tracking-widest text-[#F5F2EB] uppercase">
                            {visualTag}
                        </span>
                    </div>
                    <span className="font-mono text-[10px] tracking-wider text-[#A3A3A3] uppercase">
                        EDISI PLATFORM 2026.1
                    </span>
                </div>

                {/* Bottom Editorial Card */}
                <div className="relative z-10 mt-auto max-w-lg border border-[#262626]/90 bg-[#0A0A0A]/85 p-7 backdrop-blur-md xl:p-8">
                    <div className="mb-4 flex items-center gap-2">
                        <span className="h-0.5 w-6 bg-[#E34A27]" />
                        <span className="font-mono text-[10px] tracking-widest text-[#E34A27] uppercase">
                            Manifesto Niaga Sekolah
                        </span>
                    </div>
                    <h2 className="font-heading text-xl leading-tight font-black tracking-tight text-[#F5F2EB] uppercase xl:text-2xl">
                        {visualHeadline}
                    </h2>
                    <p className="mt-3 text-xs leading-relaxed text-[#A3A3A3] xl:text-sm">
                        {visualSubtext}
                    </p>
                    <div className="mt-5 flex items-center justify-between border-t border-[#262626] pt-4 font-mono text-[10px] text-[#737373]">
                        <span>{visualAnnotation}</span>
                        <span className="flex items-center gap-1.5 text-[#E34A27]">
                            <ShieldCheck className="size-3.5" /> Terverifikasi
                        </span>
                    </div>
                </div>
            </aside>
        </div>
    );
}
