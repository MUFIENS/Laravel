import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Sparkles,
    ShieldCheck,
    QrCode,
    CheckCircle2,
    Clock,
    Menu,
    X,
    Layers,
    BadgePercent,
    ChevronDown,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { Auth } from '@/types';
import heroEditorialImg from '../../images/campaign/hero-editorial.jpg';
import studentCraftImg from '../../images/campaign/student-craft.jpg';
import curationStepImg from '../../images/campaign/curation-step.jpg';
import transactionStepImg from '../../images/campaign/transaction-step.jpg';
import communityCounterImg from '../../images/campaign/community-counter.jpg';

gsap.registerPlugin(useGSAP, ScrollTrigger);

interface WelcomePageProps {
    auth: Auth;
    [key: string]: unknown;
}

export default function Welcome() {
    const { auth } = usePage<WelcomePageProps>().props;
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [activeStoryStep, setActiveStoryStep] = useState(0);

    const containerRef = useRef<HTMLDivElement>(null);
    const preloaderRef = useRef<HTMLDivElement>(null);
    const heroRef = useRef<HTMLElement>(null);
    const storyContainerRef = useRef<HTMLDivElement>(null);
    const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
    const lenisRef = useRef<Lenis | null>(null);
    const isCooperative = auth?.user?.role === 'cooperative';
    const marketplaceRoute = isCooperative ? '/cooperative' : '/explore';
    const ctaLabel = isCooperative
        ? 'Buka Portal Koperasi'
        : 'Buka Marketplace';

    // 1. Lenis Smooth Scroll Synchronized with GSAP ScrollTrigger
    useEffect(() => {
        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;
        if (prefersReducedMotion) return;

        const lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            touchMultiplier: 1.8,
        });

        lenisRef.current = lenis;

        lenis.on('scroll', () => {
            ScrollTrigger.update();
        });

        const tickerCb = (time: number) => {
            lenis.raf(time * 1000);
        };

        gsap.ticker.add(tickerCb);
        gsap.ticker.lagSmoothing(0);

        return () => {
            gsap.ticker.remove(tickerCb);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    // 2. Motion Systems & Controlled ScrollTrigger
    useGSAP(
        () => {
            const prefersReducedMotion = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;

            if (prefersReducedMotion) {
                if (preloaderRef.current) {
                    preloaderRef.current.style.display = 'none';
                }
                return;
            }

            // Preloader Entrance
            const tl = gsap.timeline({
                onComplete: () => {
                    if (preloaderRef.current) {
                        preloaderRef.current.style.display = 'none';
                    }
                },
            });

            tl.to('.preloader-item', {
                y: 0,
                duration: 0.9,
                stagger: 0.08,
                ease: 'power4.out',
            })
                .to('.preloader-item', {
                    y: -60,
                    opacity: 0,
                    duration: 0.7,
                    stagger: 0.04,
                    ease: 'power3.in',
                    delay: 0.4,
                })
                .to(
                    preloaderRef.current,
                    {
                        yPercent: -100,
                        duration: 0.9,
                        ease: 'power4.inOut',
                    },
                    '-=0.3',
                );

            // Hero Entrance
            tl.from(
                '.hero-reveal-elem',
                {
                    opacity: 0,
                    y: 40,
                    duration: 1.1,
                    stagger: 0.09,
                    ease: 'power3.out',
                },
                '-=0.5',
            );

            // Desktop Scroll Pinned Narrative (Scene 03)
            const mm = gsap.matchMedia();

            mm.add('(min-width: 1024px)', () => {
                const storySteps = gsap.utils.toArray(
                    '.story-step-content',
                ) as HTMLElement[];

                storySteps.forEach((step, idx) => {
                    ScrollTrigger.create({
                        trigger: step,
                        start: 'top 60%',
                        end: 'bottom 40%',
                        onEnter: () => setActiveStoryStep(idx),
                        onEnterBack: () => setActiveStoryStep(idx),
                    });
                });
            });

            // Parallax on Visual Elements
            const parallaxImages = gsap.utils.toArray('.img-scale-parallax');
            parallaxImages.forEach((img: any) => {
                gsap.to(img, {
                    scrollTrigger: {
                        trigger: img.parentElement,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: true,
                    },
                    y: '8%',
                    ease: 'none',
                });
            });

            // General Fade Up Elements
            const fadeUpElements = gsap.utils.toArray('.anim-fade-up');
            fadeUpElements.forEach((el: any) => {
                gsap.from(el, {
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 88%',
                    },
                    opacity: 0,
                    y: 45,
                    duration: 0.9,
                    ease: 'power3.out',
                });
            });
        },
        { scope: containerRef },
    );

    // Get fixed header offset height dynamically (standard 80px)
    const getHeaderOffset = (): number => {
        const header = document.querySelector('header');
        return header ? header.offsetHeight : 80;
    };

    // Unified Smooth Scroll Function using existing Lenis instance
    const scrollToHash = (
        hash: string,
        options?: { updateHistory?: boolean; immediate?: boolean },
    ) => {
        if (!hash || !hash.startsWith('#')) return;

        const target = document.querySelector(hash);
        if (!target) return;

        const { updateHistory = true, immediate = false } = options || {};

        const prefersReducedMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)',
        ).matches;

        const headerOffset = getHeaderOffset();

        if (lenisRef.current && !prefersReducedMotion) {
            lenisRef.current.scrollTo(target as HTMLElement, {
                offset: -headerOffset,
                duration: immediate ? 0 : 1.1,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                immediate,
                onComplete: () => {
                    ScrollTrigger.update();
                },
            });
        } else {
            const rect = target.getBoundingClientRect();
            const offsetPosition = rect.top + window.pageYOffset - headerOffset;
            window.scrollTo({
                top: offsetPosition,
                behavior: prefersReducedMotion || immediate ? 'auto' : 'smooth',
            });
        }

        if (updateHistory) {
            // Push state so URL reflects hash without native anchor jump
            if (window.location.hash !== hash) {
                window.history.pushState(null, '', hash);
            }
        }
    };

    // Desktop navbar link click handler
    const handleNavClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        hash: string,
    ) => {
        e.preventDefault();
        scrollToHash(hash, { updateHistory: true });
    };

    // Mobile menu navigation click handler
    const handleMobileNavClick = (
        e: React.MouseEvent<HTMLAnchorElement>,
        hash: string,
    ) => {
        e.preventDefault();
        setMobileMenuOpen(false);
        requestAnimationFrame(() => {
            scrollToHash(hash, { updateHistory: true });
        });
    };

    // Scroll to specific step handler (synchronized with Lenis)
    const scrollToStep = (index: number) => {
        setActiveStoryStep(index);
        const target = stepRefs.current[index];
        if (target) {
            const headerOffset = getHeaderOffset();
            const prefersReducedMotion = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
            ).matches;
            if (lenisRef.current && !prefersReducedMotion) {
                lenisRef.current.scrollTo(target, {
                    offset: -headerOffset - 40,
                    duration: 0.9,
                    onComplete: () => {
                        ScrollTrigger.update();
                    },
                });
            } else {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    // Synchronize initial URL hash and browser back/forward (popstate)
    useEffect(() => {
        const initialHash = window.location.hash;
        if (initialHash) {
            const timer = setTimeout(() => {
                scrollToHash(initialHash, {
                    updateHistory: false,
                    immediate: false,
                });
            }, 300);
            return () => clearTimeout(timer);
        }
    }, []);

    useEffect(() => {
        const handlePopState = () => {
            const currentHash = window.location.hash;
            if (currentHash) {
                scrollToHash(currentHash, {
                    updateHistory: false,
                    immediate: false,
                });
            } else {
                const prefersReducedMotion = window.matchMedia(
                    '(prefers-reduced-motion: reduce)',
                ).matches;
                if (lenisRef.current && !prefersReducedMotion) {
                    lenisRef.current.scrollTo(0, { duration: 1.0 });
                } else {
                    window.scrollTo({
                        top: 0,
                        behavior: prefersReducedMotion ? 'auto' : 'smooth',
                    });
                }
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="min-h-screen overflow-x-clip bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white"
            style={{ overflowX: 'clip' }}
        >
            <Head>
                <title>KOPDIG — Ekosistem Niaga Mandiri Warga Sekolah</title>
                <meta
                    name="description"
                    content="Tempat karya menjadi transaksi. Ekosistem digital untuk kurasi, distribusi, dan niaga warga sekolah."
                />
            </Head>

            {/* BRANDED PRELOADER */}
            <div
                ref={preloaderRef}
                className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0A0A] px-6"
            >
                <div className="overflow-hidden">
                    <div className="preloader-item translate-y-full font-heading text-4xl font-black tracking-tighter text-[#F5F2EB] sm:text-6xl">
                        KOPDIG
                    </div>
                </div>
                <div className="mt-3 overflow-hidden">
                    <div className="preloader-item translate-y-full text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                        Koperasi Digital Sekolah
                    </div>
                </div>
            </div>

            {/* 01. EDITORIAL HEADER & NAVIGATION */}
            <header className="hero-reveal-elem fixed top-0 left-0 z-40 w-full border-b border-[#262626]/80 bg-[#0A0A0A]/90 backdrop-blur-md">
                <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 sm:px-12">
                    {/* Brand Identifier */}
                    <div className="flex items-center gap-5">
                        <Link
                            href="/"
                            className="group flex items-center gap-3 transition-opacity hover:opacity-90 active:scale-95"
                        >
                            <div className="flex size-9 items-center justify-center bg-[#F5F2EB] font-heading text-sm font-black text-[#0A0A0A] transition-transform duration-300 group-hover:scale-95 group-hover:rotate-6">
                                K
                            </div>
                            <span className="font-heading text-base font-bold tracking-tight text-[#F5F2EB]">
                                KOPDIG
                            </span>
                        </Link>
                        <span className="hidden border-l border-[#262626] pl-4 text-[11px] font-medium tracking-wider text-[#737373] sm:inline-block">
                            Koperasi Digital Warga Sekolah
                        </span>
                    </div>

                    {/* Desktop Navigation Links with Micro-Underline Reveal */}
                    <nav className="hidden items-center gap-10 lg:flex">
                        <a
                            href="#tentang"
                            onClick={(e) => handleNavClick(e, '#tentang')}
                            className="relative py-1 text-xs font-medium tracking-wider text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Tentang
                        </a>
                        <a
                            href="#cara-kerja"
                            onClick={(e) => handleNavClick(e, '#cara-kerja')}
                            className="relative py-1 text-xs font-medium tracking-wider text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Cara Kerja
                        </a>
                        <a
                            href="#karya-siswa"
                            onClick={(e) => handleNavClick(e, '#karya-siswa')}
                            className="relative py-1 text-xs font-medium tracking-wider text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Karya Siswa
                        </a>
                        <a
                            href="#showcase-ui"
                            onClick={(e) => handleNavClick(e, '#showcase-ui')}
                            className="relative py-1 text-xs font-medium tracking-wider text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Sistem Digital
                        </a>
                    </nav>

                    {/* Action Hub */}
                    <div className="flex items-center gap-5">
                        {!auth?.user && (
                            <Link
                                href="/login"
                                className="relative hidden py-1 text-xs font-medium tracking-wider text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#F5F2EB] after:transition-all after:duration-300 hover:text-[#F5F2EB] hover:after:w-full sm:inline-block"
                            >
                                Masuk Akun
                            </Link>
                        )}
                        <Link
                            href={marketplaceRoute}
                            className="group relative inline-flex items-center justify-center overflow-hidden bg-[#E34A27] px-5 py-2.5 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E34A27]/25 active:translate-y-0 active:scale-[0.98]"
                        >
                            <span className="relative z-10 flex items-center gap-2">
                                {ctaLabel}
                                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                            </span>
                            <div className="absolute inset-0 z-0 origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
                            <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 text-xs font-bold tracking-wider text-[#E34A27] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                {ctaLabel}
                                <ArrowRight className="size-3.5 translate-x-1.5" />
                            </span>
                        </Link>

                        {/* Mobile Drawer Trigger with Icon Transition */}
                        <button
                            type="button"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-[#F5F2EB] transition-transform duration-200 focus:outline-none active:scale-90 lg:hidden"
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="size-6 rotate-90 text-[#F5F2EB] transition-transform duration-300" />
                            ) : (
                                <Menu className="size-6 text-[#F5F2EB] transition-transform duration-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="border-b border-[#262626] bg-[#0A0A0A] px-6 py-6 transition-all duration-300 lg:hidden">
                        <nav className="flex flex-col gap-5 text-xs font-semibold tracking-wider text-[#A3A3A3] uppercase">
                            <a
                                href="#tentang"
                                onClick={(e) =>
                                    handleMobileNavClick(e, '#tentang')
                                }
                                className="py-1 transition-colors hover:text-[#F5F2EB] active:text-[#E34A27]"
                            >
                                Tentang
                            </a>
                            <a
                                href="#cara-kerja"
                                onClick={(e) =>
                                    handleMobileNavClick(e, '#cara-kerja')
                                }
                                className="py-1 transition-colors hover:text-[#F5F2EB] active:text-[#E34A27]"
                            >
                                Cara Kerja
                            </a>
                            <a
                                href="#karya-siswa"
                                onClick={(e) =>
                                    handleMobileNavClick(e, '#karya-siswa')
                                }
                                className="py-1 transition-colors hover:text-[#F5F2EB] active:text-[#E34A27]"
                            >
                                Karya Siswa
                            </a>
                            <a
                                href="#showcase-ui"
                                onClick={(e) =>
                                    handleMobileNavClick(e, '#showcase-ui')
                                }
                                className="py-1 transition-colors hover:text-[#F5F2EB] active:text-[#E34A27]"
                            >
                                Sistem Digital
                            </a>
                            <Link
                                href={marketplaceRoute}
                                onClick={() => setMobileMenuOpen(false)}
                                className="border-t border-[#262626] pt-3 text-[#E34A27] transition-colors hover:text-[#F5F2EB]"
                            >
                                {ctaLabel}
                            </Link>
                            {!auth?.user && (
                                <Link
                                    href="/login"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-[#F5F2EB] transition-colors"
                                >
                                    Masuk Akun
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            <main>
                {/* 02. SCENE 01: CINEMATIC EDITORIAL HERO */}
                <section
                    ref={heroRef}
                    className="relative border-b border-[#262626] pt-36 pb-20 sm:pt-44 sm:pb-32"
                >
                    <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                        {/* Dominant Headline Spanning Viewport */}
                        <div className="hero-reveal-elem">
                            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                Ekosistem Digital Warga Sekolah
                            </span>
                            <h1 className="mt-4 font-heading text-[12vw] leading-[0.88] font-black tracking-[-0.04em] text-[#F5F2EB] sm:text-[9vw] lg:text-[104px] xl:text-[124px]">
                                TEMPAT KARYA <br />
                                MENJADI TRANSAKSI.
                            </h1>
                        </div>

                        {/* Viewport-Dominating Asymmetric Hero Frame */}
                        <div className="hero-banner-frame group relative mt-12 overflow-hidden border border-[#262626] bg-[#141414] transition-all duration-500 hover:border-[#404040] sm:mt-16">
                            <div className="relative aspect-[16/9] max-h-[580px] min-h-[300px] w-full overflow-hidden sm:min-h-[420px] lg:min-h-[520px]">
                                <img
                                    src={
                                        heroEditorialImg ||
                                        '/images/campaign/hero-editorial.jpg'
                                    }
                                    alt="KOPDIG — Ruang Niaga Warga Sekolah"
                                    className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                                    loading="eager"
                                    decoding="async"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            '/images/campaign/hero-editorial.jpg';
                                    }}
                                />
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/60 via-transparent to-transparent" />

                                {/* Tactile Corner Descriptor */}
                                <div className="pointer-events-none absolute right-6 bottom-6 left-6 flex items-end justify-between">
                                    <div className="rounded border border-[#262626]/80 bg-[#0A0A0A]/85 px-3 py-1 font-mono text-xs font-medium tracking-wider text-[#F5F2EB] uppercase backdrop-blur-sm transition-colors group-hover:border-[#E34A27]/50">
                                        [ FIG. 01 — KONSINYASI & KURASI RESMI ]
                                    </div>
                                    <div className="hidden rounded border border-[#262626]/80 bg-[#0A0A0A]/85 px-3 py-1 font-mono text-xs tracking-wider text-[#A3A3A3] uppercase backdrop-blur-sm sm:block">
                                        SMK / KOPERASI SEKOLAH
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Asymmetric Sub-Hero Narrative Grid */}
                        <div className="hero-reveal-elem mt-12 grid grid-cols-1 items-start gap-10 sm:mt-16 lg:grid-cols-12">
                            <div className="lg:col-span-7">
                                <p className="text-lg leading-relaxed font-normal text-[#A3A3A3] sm:text-2xl">
                                    KOPDIG mentransformasi koperasi konvensional
                                    menjadi lokomotif ekonomi mandiri.
                                    Menghubungkan karya cipta siswa dengan
                                    kebutuhan harian seluruh warga sekolah
                                    melalui alur kurasi profesional dan
                                    transaksi instan.
                                </p>
                                <div className="mt-8 flex flex-wrap items-center gap-5">
                                    <Link
                                        href={marketplaceRoute}
                                        className="group inline-flex items-center gap-3 bg-[#F5F2EB] px-6 py-3.5 text-xs font-bold tracking-wider text-[#0A0A0A] uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#E34A27] hover:text-white hover:shadow-lg hover:shadow-[#E34A27]/25 active:translate-y-0 active:scale-[0.98]"
                                    >
                                        <span>{ctaLabel}</span>
                                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                    </Link>
                                    <a
                                        href="#cara-kerja"
                                        onClick={(e) =>
                                            handleNavClick(e, '#cara-kerja')
                                        }
                                        className="group inline-flex items-center gap-2 px-2 py-3.5 text-xs font-semibold tracking-wider text-[#737373] transition-colors hover:text-[#F5F2EB] active:scale-95"
                                    >
                                        <span>Pelajari Mekanisme</span>
                                        <ChevronDown className="size-4 transition-transform duration-300 group-hover:translate-y-1" />
                                    </a>
                                </div>
                            </div>

                            {/* Authentic Operational Pillars (No Fake Metrics) */}
                            <div className="grid grid-cols-1 gap-6 border-t border-[#262626] pt-8 lg:col-span-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
                                <div className="group space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                        <Layers className="size-4 text-[#E34A27] transition-transform duration-300 group-hover:rotate-12" />
                                        Kurasi Mutu Mandiri
                                    </div>
                                    <p className="text-xs leading-relaxed text-[#737373] transition-colors group-hover:text-[#A3A3A3]">
                                        Produk siswa diverifikasi standar
                                        higienitas, kelayakan, dan harga pokok
                                        oleh guru pembimbing koperasi.
                                    </p>
                                </div>
                                <div className="group space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                        <QrCode className="size-4 text-[#E34A27] transition-transform duration-300 group-hover:scale-110" />
                                        Prapemesanan Tanpa Antrean
                                    </div>
                                    <p className="text-xs leading-relaxed text-[#737373] transition-colors group-hover:text-[#A3A3A3]">
                                        Warga sekolah memesan sebelum istirahat.
                                        Di loket, verifikasi slip selesai dalam
                                        5 detik via pemindaian kode QR.
                                    </p>
                                </div>
                                <div className="group space-y-1">
                                    <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                        <BadgePercent className="size-4 text-[#E34A27] transition-transform duration-300 group-hover:rotate-12" />
                                        Transparansi Bagi Hasil
                                    </div>
                                    <p className="text-xs leading-relaxed text-[#737373] transition-colors group-hover:text-[#A3A3A3]">
                                        Margin konsinyasi dan pelunasan
                                        penjualan siswa tercatat otomatis secara
                                        akuntabel di buku kas digital.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 03. SCENE 02: EDITORIAL PHILOSOPHY & STATEMENT */}
                <section
                    id="tentang"
                    className="relative border-b border-[#262626] bg-[#0E0E0E] py-28 sm:py-44"
                >
                    <div
                        id="filosofi"
                        className="pointer-events-none absolute -top-20"
                    />
                    <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                        <div className="anim-fade-up max-w-4xl">
                            <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                Transformasi Paradigma
                            </span>
                            <h2 className="mt-8 font-heading text-3xl leading-[1.08] font-bold tracking-tight text-[#F5F2EB] sm:text-5xl lg:text-6xl">
                                Bukan sekadar kantin atau toko kelontong
                                sekolah. KOPDIG adalah ruang di mana daya kreasi
                                siswa dihargai sebagai komoditas nyata.
                            </h2>
                            <p className="mt-8 max-w-2xl text-base leading-relaxed text-[#888888] sm:text-lg">
                                Dari tugas praktik kejuruan hingga kreasi
                                kuliner mandiri, seluruh karya berhak atas kanal
                                distribusi yang profesional, tertib finansial,
                                dan didukung penuh oleh ekosistem koperasi
                                sekolah.
                            </p>
                        </div>
                    </div>
                </section>

                {/* 04. SCENE 03: SCROLL-DRIVEN ECOSYSTEM STORY (REFINED) */}
                <section
                    id="cara-kerja"
                    className="relative border-b border-[#262626] bg-[#0A0A0A]"
                >
                    <div
                        id="ekosistem"
                        className="pointer-events-none absolute -top-20"
                    />
                    <div className="mx-auto max-w-[1440px] px-6 py-24 sm:px-12 sm:py-36">
                        <div className="anim-fade-up mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
                            <div>
                                <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                    Alur Ekosistem KOPDIG
                                </span>
                                <h2 className="mt-4 font-heading text-3xl font-black tracking-tight text-[#F5F2EB] sm:text-5xl">
                                    Tiga Langkah Nyata.
                                </h2>
                            </div>

                            {/* Synchronized Step Quick Selector */}
                            <div className="flex items-center gap-2 self-start border border-[#262626] bg-[#141414] p-1.5">
                                {[0, 1, 2].map((stepIdx) => (
                                    <button
                                        key={stepIdx}
                                        type="button"
                                        onClick={() => scrollToStep(stepIdx)}
                                        className={`px-3 py-1.5 font-mono text-xs font-bold tracking-wider transition-all duration-300 ${
                                            activeStoryStep === stepIdx
                                                ? 'bg-[#E34A27] text-white'
                                                : 'text-[#737373] hover:text-[#F5F2EB]'
                                        }`}
                                    >
                                        0{stepIdx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Synchronized Narrative Flow */}
                        <div
                            ref={storyContainerRef}
                            className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16 xl:gap-20"
                        >
                            {/* Sticky Visual Stage (Desktop Pinned) */}
                            <div className="hidden lg:sticky lg:top-28 lg:col-span-7 lg:block lg:self-start">
                                <div className="relative overflow-hidden border border-[#262626] bg-[#141414] p-6 sm:p-8">
                                    {/* Progress Header */}
                                    <div className="mb-6 flex items-center justify-between border-b border-[#262626] pb-5">
                                        <div className="flex items-center gap-2.5">
                                            <span className="size-2.5 animate-pulse rounded-full bg-[#E34A27]" />
                                            <span className="font-mono text-xs tracking-widest text-[#A3A3A3] uppercase">
                                                Tahapan Ekosistem
                                            </span>
                                        </div>
                                        <span className="font-mono text-sm font-bold tracking-wider text-[#E34A27]">
                                            0{activeStoryStep + 1} / 03
                                        </span>
                                    </div>

                                    {/* Step Progress Line Bar */}
                                    <div className="mb-6 h-1.5 w-full overflow-hidden bg-[#262626]">
                                        <div
                                            className="h-full bg-[#E34A27] transition-all duration-500 ease-out"
                                            style={{
                                                width: `${((activeStoryStep + 1) / 3) * 100}%`,
                                            }}
                                        />
                                    </div>

                                    {/* Distinct Step Visual Layer Frame - Enlarged to fill whitespace */}
                                    <div className="relative aspect-[16/11] min-h-[460px] w-full overflow-hidden border border-[#262626] bg-[#0A0A0A] lg:min-h-[500px] xl:min-h-[540px]">
                                        {/* Visual 01: Siswa Berkarya */}
                                        <div
                                            className={`absolute inset-0 transition-all duration-700 ease-out ${
                                                activeStoryStep === 0
                                                    ? 'pointer-events-auto z-10 scale-100 opacity-100'
                                                    : 'pointer-events-none z-0 scale-105 opacity-0'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    studentCraftImg ||
                                                    '/images/campaign/student-craft.jpg'
                                                }
                                                alt="Siswa Berkarya"
                                                className="h-full w-full object-cover contrast-105"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        '/images/campaign/student-craft.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent" />
                                            <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between">
                                                <span className="font-mono text-xs tracking-wider text-[#F5F2EB] uppercase">
                                                    [ TAHAP 01: KONSINYASI KARYA
                                                    ]
                                                </span>
                                                <Sparkles className="size-4 text-[#E34A27]" />
                                            </div>
                                        </div>

                                        {/* Visual 02: Koperasi Mengkurasi */}
                                        <div
                                            className={`absolute inset-0 transition-all duration-700 ease-out ${
                                                activeStoryStep === 1
                                                    ? 'pointer-events-auto z-10 scale-100 opacity-100'
                                                    : 'pointer-events-none z-0 scale-105 opacity-0'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    curationStepImg ||
                                                    '/images/campaign/curation-step.jpg'
                                                }
                                                alt="Koperasi Mengkurasi"
                                                className="h-full w-full object-cover contrast-105"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        '/images/campaign/curation-step.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent" />
                                            <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between">
                                                <span className="font-mono text-xs tracking-wider text-[#F5F2EB] uppercase">
                                                    [ TAHAP 02: KURASI & STANDAR
                                                    MUTU ]
                                                </span>
                                                <ShieldCheck className="size-4 text-[#E34A27]" />
                                            </div>
                                        </div>

                                        {/* Visual 03: Warga Bertransaksi */}
                                        <div
                                            className={`absolute inset-0 transition-all duration-700 ease-out ${
                                                activeStoryStep === 2
                                                    ? 'pointer-events-auto z-10 scale-100 opacity-100'
                                                    : 'pointer-events-none z-0 scale-105 opacity-0'
                                            }`}
                                        >
                                            <img
                                                src={
                                                    transactionStepImg ||
                                                    '/images/campaign/transaction-step.jpg'
                                                }
                                                alt="Warga Sekolah Bertransaksi"
                                                className="h-full w-full object-cover contrast-105"
                                                onError={(e) => {
                                                    e.currentTarget.src =
                                                        '/images/campaign/transaction-step.jpg';
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/90 via-transparent to-transparent" />
                                            <div className="absolute right-5 bottom-5 left-5 flex items-center justify-between">
                                                <span className="font-mono text-xs tracking-wider text-[#F5F2EB] uppercase">
                                                    [ TAHAP 03: PENGAMBILAN QR
                                                    INSTAN ]
                                                </span>
                                                <QrCode className="size-4 text-[#E34A27]" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Bottom Step Title Descriptor */}
                                    <div className="mt-6 flex items-center justify-between border-t border-[#262626] pt-5 text-sm">
                                        <div className="font-heading font-bold text-[#F5F2EB]">
                                            {activeStoryStep === 0 &&
                                                '01. Pendaftaran Karya Mandiri'}
                                            {activeStoryStep === 1 &&
                                                '02. Cek Kelayakan & Penetapan HPP'}
                                            {activeStoryStep === 2 &&
                                                '03. Transaksi Digital Tanpa Antrean'}
                                        </div>
                                        <span className="font-mono text-[10px] text-[#737373] uppercase">
                                            Status Terverifikasi
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Scrolling Steps Narrative (Both Desktop & Mobile Friendly) */}
                            <div className="space-y-24 sm:space-y-36 lg:col-span-5 lg:self-start lg:py-6">
                                {/* Step 01 */}
                                <div
                                    ref={(el) => {
                                        stepRefs.current[0] = el;
                                    }}
                                    className={`story-step-content cursor-pointer border-l-2 pl-8 transition-all duration-500 ${
                                        activeStoryStep === 0
                                            ? 'border-[#E34A27] opacity-100'
                                            : 'border-[#262626] opacity-35 hover:opacity-75'
                                    }`}
                                    onClick={() => scrollToStep(0)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`font-heading text-6xl font-black transition-colors duration-300 sm:text-7xl ${
                                                activeStoryStep === 0
                                                    ? 'text-[#E34A27]'
                                                    : 'text-[#262626]'
                                            }`}
                                        >
                                            01
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                                        Siswa Mendaftarkan Karya
                                    </h3>

                                    {/* Mobile-Only Step Visual */}
                                    <div className="mt-5 mb-4 overflow-hidden border border-[#262626] lg:hidden">
                                        <img
                                            src={
                                                studentCraftImg ||
                                                '/images/campaign/student-craft.jpg'
                                            }
                                            alt="Siswa Berkarya"
                                            className="aspect-[16/10] w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    '/images/campaign/student-craft.jpg';
                                            }}
                                        />
                                    </div>

                                    <p className="mt-4 text-base leading-relaxed text-[#888888]">
                                        Siswa mengunggah rincian produk
                                        konsinyasi—mulai dari makanan ringan,
                                        minuman sehat, hingga merchandise dan
                                        kriya kejuruan. Sistem mencatat
                                        transparansi harga pokok serta margin
                                        yang disepakati bersama koperasi.
                                    </p>
                                </div>

                                {/* Step 02 */}
                                <div
                                    ref={(el) => {
                                        stepRefs.current[1] = el;
                                    }}
                                    className={`story-step-content cursor-pointer border-l-2 pl-8 transition-all duration-500 ${
                                        activeStoryStep === 1
                                            ? 'border-[#E34A27] opacity-100'
                                            : 'border-[#262626] opacity-35 hover:opacity-75'
                                    }`}
                                    onClick={() => scrollToStep(1)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`font-heading text-6xl font-black transition-colors duration-300 sm:text-7xl ${
                                                activeStoryStep === 1
                                                    ? 'text-[#E34A27]'
                                                    : 'text-[#262626]'
                                            }`}
                                        >
                                            02
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                                        Koperasi Melakukan Kurasi
                                    </h3>

                                    {/* Mobile-Only Step Visual */}
                                    <div className="mt-5 mb-4 overflow-hidden border border-[#262626] lg:hidden">
                                        <img
                                            src={
                                                curationStepImg ||
                                                '/images/campaign/curation-step.jpg'
                                            }
                                            alt="Koperasi Mengkurasi"
                                            className="aspect-[16/10] w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    '/images/campaign/curation-step.jpg';
                                            }}
                                        />
                                    </div>

                                    <p className="mt-4 text-base leading-relaxed text-[#888888]">
                                        Pengurus koperasi dan guru pembina
                                        memeriksa kualitas produk. Setiap produk
                                        yang lolos kurasi langsung diterbitkan
                                        ke dalam etalase digital sekolah dengan
                                        label penanda karya siswa yang otentik.
                                    </p>
                                </div>

                                {/* Step 03 */}
                                <div
                                    ref={(el) => {
                                        stepRefs.current[2] = el;
                                    }}
                                    className={`story-step-content cursor-pointer border-l-2 pl-8 transition-all duration-500 ${
                                        activeStoryStep === 2
                                            ? 'border-[#E34A27] opacity-100'
                                            : 'border-[#262626] opacity-35 hover:opacity-75'
                                    }`}
                                    onClick={() => scrollToStep(2)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`font-heading text-6xl font-black transition-colors duration-300 sm:text-7xl ${
                                                activeStoryStep === 2
                                                    ? 'text-[#E34A27]'
                                                    : 'text-[#262626]'
                                            }`}
                                        >
                                            03
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                                        Warga Sekolah Bertransaksi Instan
                                    </h3>

                                    {/* Mobile-Only Step Visual */}
                                    <div className="mt-5 mb-4 overflow-hidden border border-[#262626] lg:hidden">
                                        <img
                                            src={
                                                transactionStepImg ||
                                                '/images/campaign/transaction-step.jpg'
                                            }
                                            alt="Warga Sekolah Bertransaksi"
                                            className="aspect-[16/10] w-full object-cover"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    '/images/campaign/transaction-step.jpg';
                                            }}
                                        />
                                    </div>

                                    <p className="mt-4 text-base leading-relaxed text-[#888888]">
                                        Pesanan dilakukan sebelum jam istirahat
                                        tiba. Saat bel berbunyi, siswa hanya
                                        perlu menunjukkan kode QR pesanan di
                                        loket pengambilan tanpa perlu berdesakan
                                        atau membawa uang kembalian receh.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 05. SCENE 04: STUDENT CREATIVITY VISUAL CAMPAIGN */}
                <section
                    id="karya-siswa"
                    className="border-b border-[#262626] bg-[#0E0E0E] py-28 sm:py-44"
                >
                    <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
                            {/* Visual Artwork Showcase with Hover Scaling */}
                            <div className="order-2 lg:order-1 lg:col-span-7">
                                <div className="group overflow-hidden border border-[#262626] bg-[#141414] transition-all duration-500 hover:border-[#404040]">
                                    <div className="relative aspect-[4/3] w-full overflow-hidden">
                                        <img
                                            src={
                                                studentCraftImg ||
                                                '/images/campaign/student-craft.jpg'
                                            }
                                            alt="Karya Nyata Siswa KOPDIG"
                                            className="img-scale-parallax h-[115%] w-full object-cover contrast-105 transition-all duration-700 ease-out group-hover:scale-[1.03]"
                                            onError={(e) => {
                                                e.currentTarget.src =
                                                    '/images/campaign/student-craft.jpg';
                                            }}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/70 via-transparent to-transparent" />
                                        <div className="absolute bottom-5 left-6 font-mono text-xs tracking-wider text-[#A3A3A3] uppercase transition-colors group-hover:text-[#F5F2EB]">
                                            [ FIG. 02 — KARYA KREASI MANDIRI
                                            SISWA ]
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Campaign Text */}
                            <div className="order-1 space-y-6 lg:order-2 lg:col-span-5">
                                <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                    Pemberdayaan Nyata
                                </span>
                                <h2 className="font-heading text-3xl leading-tight font-black tracking-tight text-[#F5F2EB] sm:text-5xl">
                                    KARYA SISWA, <br />
                                    JADI PRODUK NYATA.
                                </h2>
                                <p className="text-base leading-relaxed text-[#888888] sm:text-lg">
                                    Bukan sekadar simulasi di atas lembar
                                    penilaian kelas. KOPDIG memberikan panggung
                                    wirausaha nyata. Produk siswa dipajang,
                                    dibeli, dan dinikmati langsung oleh
                                    komunitas sekolah mereka sendiri.
                                </p>
                                <div className="space-y-4 border-t border-[#262626] pt-4">
                                    <div className="group flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#E34A27] transition-transform duration-300 group-hover:scale-125" />
                                        <p className="text-xs leading-relaxed text-[#A3A3A3] transition-colors group-hover:text-[#F5F2EB]">
                                            Penetapan harga transparan dengan
                                            pencatatan komisi koperasi yang
                                            jelas.
                                        </p>
                                    </div>
                                    <div className="group flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#E34A27] transition-transform duration-300 group-hover:scale-125" />
                                        <p className="text-xs leading-relaxed text-[#A3A3A3] transition-colors group-hover:text-[#F5F2EB]">
                                            Rekapitulasi penjualan terpusat yang
                                            memudahkan pelunasan hak dana siswa.
                                        </p>
                                    </div>
                                    <div className="group flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#E34A27] transition-transform duration-300 group-hover:scale-125" />
                                        <p className="text-xs leading-relaxed text-[#A3A3A3] transition-colors group-hover:text-[#F5F2EB]">
                                            Etalase resmi yang menempatkan karya
                                            siswa sejajar dengan komoditas
                                            sekolah.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 06. SCENE 05: DIGITAL PRODUCT SHOWCASE (ART-DIRECTED UI) */}
                <section
                    id="showcase-ui"
                    className="relative border-b border-[#262626] bg-[#0A0A0A] py-28 sm:py-44"
                >
                    <div
                        id="sistem-digital"
                        className="pointer-events-none absolute -top-20"
                    />
                    <div className="mx-auto max-w-[1440px] px-6 text-center sm:px-12">
                        <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                            Arsitektur Antarmuka
                        </span>
                        <h2 className="mt-4 font-heading text-3xl font-black tracking-tight text-[#F5F2EB] sm:text-5xl">
                            Dirancang untuk Waktu Istirahat yang Singkat.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm text-[#888888] sm:text-base">
                            Setiap detik di jam istirahat berharga. Seluruh alur
                            pesanan dirancang agar tervalidasi seketika tanpa
                            antrean kasir.
                        </p>
                    </div>

                    {/* Art-Directed SaaS Browser Frame with Interactive Hover Elevation */}
                    <div className="mx-auto mt-16 max-w-4xl px-6">
                        <div className="overflow-hidden border border-[#262626] bg-[#141414] shadow-2xl transition-all duration-500 hover:border-[#404040]">
                            {/* Browser chrome header */}
                            <div className="flex items-center justify-between border-b border-[#262626] bg-[#0A0A0A] px-5 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="size-2.5 rounded-full bg-[#262626]" />
                                    <div className="size-2.5 rounded-full bg-[#262626]" />
                                    <div className="size-2.5 rounded-full bg-[#262626]" />
                                </div>
                                <span className="font-mono text-[11px] tracking-widest text-[#737373]">
                                    app.kopdig.internal / loket-verifikasi
                                </span>
                                <div className="w-8" />
                            </div>

                            {/* UI Content: High-Fidelity Verification Voucher Mockup */}
                            <div className="bg-[#0F0F0F] p-8 sm:p-14">
                                <div className="mx-auto max-w-md border border-[#262626] bg-[#181818] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#E34A27] hover:shadow-2xl hover:shadow-[#E34A27]/10 sm:p-8">
                                    <div className="flex items-start justify-between border-b border-[#262626] pb-5">
                                        <div>
                                            <span className="font-mono text-[10px] tracking-widest text-[#737373] uppercase">
                                                Slip Pesanan Digital
                                            </span>
                                            <h4 className="mt-1 font-heading text-xl font-bold tracking-tight text-[#F5F2EB]">
                                                #KPD-2026-0814
                                            </h4>
                                        </div>
                                        <div className="group flex flex-col items-center border border-[#262626] bg-[#0A0A0A] p-2.5 transition-colors hover:border-[#E34A27]">
                                            <QrCode
                                                className="size-10 text-[#F5F2EB] transition-transform duration-300 group-hover:scale-105"
                                                strokeWidth={1.5}
                                            />
                                            <span className="mt-1 font-mono text-[8px] text-[#737373] uppercase">
                                                Pindai
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mt-5 space-y-2">
                                        <div className="-mx-2 flex items-center justify-between rounded p-2 text-xs transition-colors hover:bg-[#202020]">
                                            <span className="text-[#A3A3A3]">
                                                1x Risol Mayo Keju (Karya Siswa)
                                            </span>
                                            <span className="font-mono font-medium text-[#F5F2EB]">
                                                Rp 5.000
                                            </span>
                                        </div>
                                        <div className="-mx-2 flex items-center justify-between rounded p-2 text-xs transition-colors hover:bg-[#202020]">
                                            <span className="text-[#A3A3A3]">
                                                1x Buku Catatan Sekolah
                                                (Koperasi)
                                            </span>
                                            <span className="font-mono font-medium text-[#F5F2EB]">
                                                Rp 4.500
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pickup Location Status */}
                                    <div className="mt-6 flex items-center justify-between border-t border-[#262626] pt-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-4 text-[#E34A27]" />
                                            <span className="text-xs font-medium text-[#E34A27]">
                                                Siap Diambil di Loket 2
                                            </span>
                                        </div>
                                        <span className="font-mono text-[10px] text-[#737373]">
                                            Istirahat 1 (10:00 - 10:30)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 07. SCENE 06: CINEMATIC CLOSING STATEMENT & CTA */}
                <section className="relative overflow-hidden border-b border-[#262626] bg-[#0A0A0A] py-32 sm:py-48">
                    {/* Background Texture Asset with High Visual Restraint */}
                    <div className="absolute inset-0 opacity-15">
                        <img
                            src={
                                communityCounterImg ||
                                '/images/campaign/community-counter.jpg'
                            }
                            alt="Suasana Koperasi Digital"
                            className="h-full w-full object-cover contrast-125"
                            onError={(e) => {
                                e.currentTarget.src =
                                    '/images/campaign/community-counter.jpg';
                            }}
                        />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/80 to-[#0A0A0A]" />

                    <div className="anim-fade-up relative z-10 mx-auto max-w-[1440px] px-6 text-center sm:px-12">
                        <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                            Bergabung Bersama Ekosistem
                        </span>
                        <h2 className="mt-6 font-heading text-4xl leading-[1.05] font-black tracking-tight text-[#F5F2EB] sm:text-6xl lg:text-7xl">
                            Mulai dari Satu Karya. <br />
                            Menggerakkan Ekonomi Sekolah.
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-base text-[#888888] sm:text-lg">
                            Akses resmi bagi siswa untuk mendaftarkan produk dan
                            bagi seluruh warga sekolah untuk menikmati kemudahan
                            transaksi tanpa antrean.
                        </p>

                        <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
                            <Link
                                href={marketplaceRoute}
                                className="group relative inline-flex w-full items-center justify-center overflow-hidden bg-[#E34A27] px-8 py-4 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#E34A27]/30 active:translate-y-0 active:scale-[0.98] sm:w-auto"
                            >
                                <span className="relative z-10 flex items-center gap-3">
                                    {ctaLabel}
                                    <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                </span>
                                <div className="absolute inset-0 z-0 origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
                                <span className="absolute inset-0 z-10 flex items-center justify-center gap-3 text-xs font-bold tracking-wider text-[#E34A27] uppercase opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    {ctaLabel}
                                    <ArrowRight className="size-4 translate-x-1.5" />
                                </span>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            {/* 08. SCENE 07: EDITORIAL MONOGRAPH FOOTER */}
            <footer className="border-t border-[#1C1C1C] bg-[#070707] py-20">
                <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                    <div className="grid grid-cols-1 gap-12 border-b border-[#1C1C1C] pb-16 md:grid-cols-12">
                        {/* Brand Column */}
                        <div className="space-y-4 md:col-span-6">
                            <div className="flex items-center gap-3">
                                <div className="flex size-8 items-center justify-center bg-[#F5F2EB] font-heading text-xs font-black text-[#0A0A0A]">
                                    K
                                </div>
                                <span className="font-heading text-base font-bold tracking-tight text-[#F5F2EB]">
                                    KOPDIG
                                </span>
                            </div>
                            <p className="max-w-sm text-xs leading-relaxed text-[#737373]">
                                Ekosistem niaga digital resmi warga sekolah.
                                Platform penghubung kreasi kewirausahaan siswa
                                dan efisiensi operasional koperasi sekolah.
                            </p>
                        </div>

                        {/* Navigation Indices with Hover Microinteractions */}
                        <div className="space-y-3 md:col-span-3">
                            <h5 className="font-mono text-[10px] tracking-widest text-[#A3A3A3] uppercase">
                                Navigasi Platform
                            </h5>
                            <ul className="space-y-2 text-xs text-[#737373]">
                                <li>
                                    <a
                                        href="#tentang"
                                        onClick={(e) =>
                                            handleNavClick(e, '#tentang')
                                        }
                                        className="inline-block py-0.5 transition-colors hover:text-[#F5F2EB]"
                                    >
                                        Filosofi Niaga
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#cara-kerja"
                                        onClick={(e) =>
                                            handleNavClick(e, '#cara-kerja')
                                        }
                                        className="inline-block py-0.5 transition-colors hover:text-[#F5F2EB]"
                                    >
                                        Alur Ekosistem
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#karya-siswa"
                                        onClick={(e) =>
                                            handleNavClick(e, '#karya-siswa')
                                        }
                                        className="inline-block py-0.5 transition-colors hover:text-[#F5F2EB]"
                                    >
                                        Karya Siswa
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="#showcase-ui"
                                        onClick={(e) =>
                                            handleNavClick(e, '#showcase-ui')
                                        }
                                        className="inline-block py-0.5 transition-colors hover:text-[#F5F2EB]"
                                    >
                                        Sistem Digital
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Operational Scope */}
                        <div className="space-y-3 md:col-span-3">
                            <h5 className="font-mono text-[10px] tracking-widest text-[#A3A3A3] uppercase">
                                Hak Akses Peran
                            </h5>
                            <ul className="space-y-2 text-xs text-[#737373]">
                                <li>
                                    Siswa — Pengajuan Konsinyasi & Pemesanan
                                </li>
                                <li>Koperasi — Kurasi, Inventaris & Kasir</li>
                                <li>
                                    Warga Sekolah — Pemesanan & Pengambilan QR
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Attribution */}
                    <div className="mt-8 flex flex-col items-center justify-between gap-4 font-mono text-[11px] text-[#555] sm:flex-row">
                        <p>
                            © 2026 KOPDIG. Standar Koperasi Digital Sekolah
                            Mandiri.
                        </p>
                        <p className="tracking-wider uppercase">
                            Dirancang untuk Pengalaman Niaga Bermartabat
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
