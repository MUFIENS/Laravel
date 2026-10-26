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
    Sun,
    Moon,
} from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import type { Auth } from '@/types';
import { useAppearance } from '@/hooks/use-appearance';
import { ThemeToggle } from '@/components/ThemeToggle';
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
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const isDark = resolvedAppearance === 'dark';
    const toggleTheme = () => {
        updateAppearance(isDark ? 'light' : 'dark');
    };
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
            className="kopdig-landing min-h-screen overflow-x-clip bg-[#F8F9FA] dark:bg-[#0A0A0A] font-sans text-[#111111] dark:text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white transition-colors duration-300"
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
                className="preloader-container pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8F9FA] dark:bg-[#0A0A0A] px-6 transition-colors duration-300"
            >
                <div className="mb-4 overflow-hidden">
                    <img
                        src="/images/logo.png"
                        alt="Logo SMK Negeri 1 Ciomas - KOPDIG"
                        className="preloader-item translate-y-full h-20 w-auto object-contain drop-shadow-xl"
                    />
                </div>
                <div className="overflow-hidden">
                    <div className="preloader-item translate-y-full font-heading text-4xl font-black tracking-tighter text-[#111111] dark:text-[#F5F2EB] sm:text-6xl">
                        KOPDIG
                    </div>
                </div>
                <div className="mt-3 overflow-hidden">
                    <div className="preloader-item translate-y-full text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                        SMKN 1 CIOMAS · KOPERASI DIGITAL
                    </div>
                </div>
            </div>

            {/* 01. EDITORIAL HEADER & NAVIGATION */}
            <header className="hero-reveal-elem fixed top-0 left-0 z-40 w-full border-b border-neutral-200/80 dark:border-[#262626]/80 bg-white/90 dark:bg-[#0A0A0A]/90 backdrop-blur-md transition-colors duration-300">
                <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between px-6 sm:px-12">
                    {/* Brand Identifier */}
                    <div className="flex items-center gap-5">
                        <Link
                            href="/"
                            className="group flex items-center gap-3 transition-opacity hover:opacity-90 active:scale-95"
                        >
                            <img
                                src="/images/logo.png"
                                alt="Logo SMK Negeri 1 Ciomas - KOPDIG"
                                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105 drop-shadow-md"
                            />
                            <div className="flex flex-col">
                                <span className="brand-title font-heading text-base font-bold tracking-tight text-[#111111] dark:text-[#F5F2EB]">
                                    KOPDIG
                                </span>
                                <span className="brand-subtitle font-mono text-[9px] tracking-wider text-neutral-500 dark:text-[#737373] uppercase">
                                    SMKN 1 CIOMAS
                                </span>
                            </div>
                        </Link>
                        <span className="hidden border-l border-neutral-200 dark:border-[#262626] pl-4 text-[11px] font-medium tracking-wider text-neutral-500 dark:text-[#737373] sm:inline-block">
                            Koperasi Digital Warga Sekolah
                        </span>
                    </div>

                    {/* Desktop Navigation Links with Micro-Underline Reveal */}
                    <nav className="hidden items-center gap-10 lg:flex">
                        <a
                            href="#tentang"
                            onClick={(e) => handleNavClick(e, '#tentang')}
                            className="relative py-1 text-xs font-medium tracking-wider text-neutral-600 dark:text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Tentang
                        </a>
                        <a
                            href="#cara-kerja"
                            onClick={(e) => handleNavClick(e, '#cara-kerja')}
                            className="relative py-1 text-xs font-medium tracking-wider text-neutral-600 dark:text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Cara Kerja
                        </a>
                        <a
                            href="#karya-siswa"
                            onClick={(e) => handleNavClick(e, '#karya-siswa')}
                            className="relative py-1 text-xs font-medium tracking-wider text-neutral-600 dark:text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Karya Siswa
                        </a>
                        <a
                            href="#showcase-ui"
                            onClick={(e) => handleNavClick(e, '#showcase-ui')}
                            className="relative py-1 text-xs font-medium tracking-wider text-neutral-600 dark:text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#E34A27] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-[#F5F2EB] hover:after:w-full active:scale-95 active:text-[#E34A27]"
                        >
                            Sistem Digital
                        </a>
                    </nav>

                    {/* Action Hub */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {!auth?.user && (
                            <Link
                                href="/login"
                                className="relative hidden py-1 text-xs font-medium tracking-wider text-neutral-600 dark:text-[#A3A3A3] transition-colors after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#111111] dark:after:bg-[#F5F2EB] after:transition-all after:duration-300 hover:text-[#111111] dark:hover:text-[#F5F2EB] hover:after:w-full sm:inline-block"
                            >
                                Masuk Akun
                            </Link>
                        )}

                        {/* Theme Toggle Button (Light Mode / Dark Mode) */}
                        <ThemeToggle size="sm" />

                        <Link
                            href={marketplaceRoute}
                            className="group relative inline-flex items-center justify-center overflow-hidden bg-[#E34A27] px-4 py-2 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#E34A27]/25 active:translate-y-0 active:scale-[0.98] sm:px-5 sm:py-2.5"
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
                            className="mobile-nav-trigger p-2 text-[#F5F2EB] transition-transform duration-200 focus:outline-none active:scale-90 lg:hidden"
                            aria-label="Toggle Navigation Menu"
                        >
                            {mobileMenuOpen ? (
                                <X className="size-6 rotate-90 text-current transition-transform duration-300" />
                            ) : (
                                <Menu className="size-6 text-current transition-transform duration-300" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="mobile-menu-drawer border-b border-[#262626] bg-[#0A0A0A] px-6 py-6 transition-all duration-300 lg:hidden">
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

                            {/* Mobile Theme Toggle Button */}
                            <div className="flex items-center justify-between border-t border-neutral-200 dark:border-[#262626] pt-4">
                                <span className="text-[11px] font-semibold tracking-wider text-neutral-500 dark:text-[#737373] uppercase">
                                    Pilih Tema
                                </span>
                                <ThemeToggle size="sm" />
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            <main>
                {/* 02. SCENE 01: CINEMATIC EDITORIAL HERO */}
                <section
                    ref={heroRef}
                    className="relative border-b border-neutral-200 dark:border-[#262626] pt-24 pb-12 sm:pt-28 sm:pb-16 transition-colors duration-300"
                >
                    <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                        {/* Hero Header Grid: Headline + Narrative & CTA Side-by-Side (Eliminating Empty Space) */}
                        <div className="hero-reveal-elem grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
                            <div className="lg:col-span-7 xl:col-span-7">
                                <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                    Ekosistem Digital Warga Sekolah
                                </span>
                                <h1 className="mt-3 font-heading text-3xl font-black tracking-tight leading-[1.08] text-[#111111] dark:text-[#F5F2EB] sm:text-5xl lg:text-6xl">
                                    TEMPAT KARYA <br />
                                    MENJADI TRANSAKSI.
                                </h1>
                            </div>
                            <div className="lg:col-span-5 xl:col-span-5 lg:pb-1">
                                <p className="text-sm sm:text-base leading-relaxed text-neutral-600 dark:text-[#A3A3A3]">
                                    KOPDIG mentransformasi koperasi konvensional menjadi lokomotif ekonomi mandiri. Menghubungkan karya cipta siswa dengan kebutuhan harian warga sekolah melalui alur kurasi profesional dan transaksi instan.
                                </p>
                                <div className="mt-6 flex flex-wrap items-center gap-4">
                                    <Link
                                        href={marketplaceRoute}
                                        className="group inline-flex items-center gap-3 bg-[#E34A27] px-6 py-3 text-xs font-bold tracking-wider text-white uppercase transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#c93c1b] hover:shadow-lg hover:shadow-[#E34A27]/25 active:translate-y-0 active:scale-[0.98]"
                                    >
                                        <span>{ctaLabel}</span>
                                        <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                                    </Link>
                                    <a
                                        href="#cara-kerja"
                                        onClick={(e) =>
                                            handleNavClick(e, '#cara-kerja')
                                        }
                                        className="group inline-flex items-center gap-2 px-2 py-3 text-xs font-semibold tracking-wider text-neutral-600 dark:text-[#A3A3A3] transition-colors hover:text-[#111111] dark:hover:text-[#F5F2EB] active:scale-95"
                                    >
                                        <span>Pelajari Mekanisme</span>
                                        <ChevronDown className="size-4 transition-transform duration-300 group-hover:translate-y-1" />
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Viewport-Dominating Asymmetric Hero Frame */}
                        <div className="hero-banner-frame surface-card group relative mt-8 overflow-hidden border border-neutral-200 dark:border-[#262626] bg-neutral-100 dark:bg-[#141414] transition-all duration-500 hover:border-[#404040] sm:mt-10">
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
                                    <div className="tactile-badge rounded border border-[#262626]/80 bg-[#0A0A0A]/85 px-3 py-1 font-mono text-xs font-medium tracking-wider text-[#F5F2EB] uppercase backdrop-blur-sm transition-colors group-hover:border-[#E34A27]/50">
                                        [ FIG. 01 — KONSINYASI & KURASI RESMI ]
                                    </div>
                                    <div className="tactile-badge hidden rounded border border-[#262626]/80 bg-[#0A0A0A]/85 px-3 py-1 font-mono text-xs tracking-wider text-[#A3A3A3] uppercase backdrop-blur-sm sm:block">
                                        SMK / KOPERASI SEKOLAH
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Authentic Operational Pillars Spanning Full Width */}
                        <div className="hero-reveal-elem mt-8 grid grid-cols-1 gap-6 border-t border-neutral-200 dark:border-[#262626] pt-8 sm:mt-10 sm:pt-10 md:grid-cols-3">
                            <div className="group space-y-2 border border-neutral-200 dark:border-[#262626] bg-neutral-50/70 dark:bg-[#141414]/70 p-5 transition-all duration-300 hover:border-[#E34A27]/40">
                                <div className="pillar-title flex items-center gap-2.5 text-xs font-bold tracking-wider text-[#111111] dark:text-[#F5F2EB] uppercase">
                                    <Layers className="size-4 text-[#E34A27] transition-transform duration-300 group-hover:rotate-12" />
                                    Kurasi Mutu Mandiri
                                </div>
                                <p className="pillar-desc text-xs leading-relaxed text-neutral-600 dark:text-[#737373] transition-colors group-hover:text-neutral-900 dark:group-hover:text-[#A3A3A3]">
                                    Produk siswa diverifikasi standar higienitas, kelayakan, dan harga pokok oleh guru pembimbing koperasi sekolah.
                                </p>
                            </div>
                            <div className="group space-y-2 border border-neutral-200 dark:border-[#262626] bg-neutral-50/70 dark:bg-[#141414]/70 p-5 transition-all duration-300 hover:border-[#E34A27]/40">
                                <div className="pillar-title flex items-center gap-2.5 text-xs font-bold tracking-wider text-[#111111] dark:text-[#F5F2EB] uppercase">
                                    <QrCode className="size-4 text-[#E34A27] transition-transform duration-300 group-hover:scale-110" />
                                    Prapemesanan Tanpa Antrean
                                </div>
                                <p className="pillar-desc text-xs leading-relaxed text-neutral-600 dark:text-[#737373] transition-colors group-hover:text-neutral-900 dark:group-hover:text-[#A3A3A3]">
                                    Warga sekolah memesan sebelum istirahat. Di loket pengambilan, verifikasi slip selesai dalam 5 detik via kode QR.
                                </p>
                            </div>
                            <div className="group space-y-2 border border-neutral-200 dark:border-[#262626] bg-neutral-50/70 dark:bg-[#141414]/70 p-5 transition-all duration-300 hover:border-[#E34A27]/40">
                                <div className="pillar-title flex items-center gap-2.5 text-xs font-bold tracking-wider text-[#111111] dark:text-[#F5F2EB] uppercase">
                                    <BadgePercent className="size-4 text-[#E34A27] transition-transform duration-300 group-hover:rotate-12" />
                                    Transparansi Bagi Hasil
                                </div>
                                <p className="pillar-desc text-xs leading-relaxed text-neutral-600 dark:text-[#737373] transition-colors group-hover:text-neutral-900 dark:group-hover:text-[#A3A3A3]">
                                    Margin konsinyasi dan pelunasan penjualan siswa tercatat otomatis secara akuntabel di pembukuan kas digital.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 03. SCENE 02: EDITORIAL PHILOSOPHY & STATEMENT */}
                <section
                    id="tentang"
                    className="scene-philosophy relative border-b border-neutral-200 dark:border-[#262626] bg-[#F1F3F5] dark:bg-[#0E0E0E] py-16 sm:py-24 transition-colors duration-300"
                >
                    <div
                        id="filosofi"
                        className="pointer-events-none absolute -top-20"
                    />
                    <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                        <div className="anim-fade-up grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
                            <div className="lg:col-span-7">
                                <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                    Transformasi Paradigma
                                </span>
                                <h2 className="mt-4 font-heading text-2xl font-bold tracking-tight leading-snug text-[#111111] dark:text-[#F5F2EB] sm:text-3xl lg:text-4xl">
                                    Bukan sekadar kantin atau toko kelontong
                                    sekolah. KOPDIG adalah ruang di mana daya kreasi
                                    siswa dihargai sebagai komoditas nyata.
                                </h2>
                                <p className="mt-6 text-base leading-relaxed text-neutral-600 dark:text-[#888888] sm:text-lg">
                                    Dari tugas praktik kejuruan hingga kreasi
                                    kuliner mandiri, seluruh karya berhak atas kanal
                                    distribusi yang profesional, tertib finansial,
                                    dan didukung penuh oleh ekosistem koperasi
                                    sekolah.
                                </p>
                            </div>
                            <div className="lg:col-span-5">
                                <div className="surface-card border border-neutral-200 dark:border-[#262626] bg-white dark:bg-[#141414] p-6 sm:p-8 space-y-5 shadow-sm">
                                    <div className="border-b border-neutral-200 dark:border-[#262626] pb-4">
                                        <span className="font-mono text-xs font-bold tracking-wider text-[#E34A27] uppercase">
                                            // KOPDIG INTEGRASI
                                        </span>
                                        <h3 className="mt-1 font-heading text-lg font-bold text-[#111111] dark:text-[#F5F2EB]">
                                            Ekosistem Niaga Sekolah Terpadu
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-7 shrink-0 items-center justify-center bg-[#E34A27]/10 font-mono text-xs font-bold text-[#E34A27]">01</span>
                                            <div>
                                                <h4 className="font-heading text-sm font-bold text-[#111111] dark:text-[#F5F2EB]">Karya Kejuruan & Kuliner</h4>
                                                <p className="mt-0.5 text-xs text-neutral-600 dark:text-[#888888]">PPLG, DKV, dan Tata Boga langsung memiliki pasar resmi di lingkungan sekolah.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-7 shrink-0 items-center justify-center bg-[#E34A27]/10 font-mono text-xs font-bold text-[#E34A27]">02</span>
                                            <div>
                                                <h4 className="font-heading text-sm font-bold text-[#111111] dark:text-[#F5F2EB]">Akuntabilitas Transparan</h4>
                                                <p className="mt-0.5 text-xs text-neutral-600 dark:text-[#888888]">Bagi hasil konsinyasi dan pembukuan kas koperasi tercatat real-time tanpa selisih.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <span className="flex size-7 shrink-0 items-center justify-center bg-[#E34A27]/10 font-mono text-xs font-bold text-[#E34A27]">03</span>
                                            <div>
                                                <h4 className="font-heading text-sm font-bold text-[#111111] dark:text-[#F5F2EB]">Pemesanan & Pick-up Instan</h4>
                                                <p className="mt-0.5 text-xs text-neutral-600 dark:text-[#888888]">Validasi pengambilan via kode QR untuk mengeliminasi antrean di jam istirahat.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 04. SCENE 03: SCROLL-DRIVEN ECOSYSTEM STORY (REFINED) */}
                <section
                    id="cara-kerja"
                    className="scene-ecosystem relative border-b border-neutral-200 dark:border-[#262626] bg-[#F8F9FA] dark:bg-[#0A0A0A] transition-colors duration-300"
                >
                    <div
                        id="ekosistem"
                        className="pointer-events-none absolute -top-20"
                    />
                    <div className="mx-auto max-w-[1440px] px-6 py-16 sm:px-12 sm:py-24">
                        <div className="anim-fade-up mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end sm:mb-12">
                            <div>
                                <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                                    Alur Ekosistem KOPDIG
                                </span>
                                <h2 className="mt-4 font-heading text-2xl font-black tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-3xl lg:text-4xl">
                                    Tiga Langkah Nyata.
                                </h2>
                            </div>

                            {/* Synchronized Step Quick Selector */}
                            <div className="step-selector-box flex items-center gap-2 self-start border border-[#262626] bg-[#141414] p-1.5">
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
                                <div className="surface-card relative overflow-hidden border border-[#262626] bg-[#141414] p-6 sm:p-8">
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
                                    <div className="progress-line-track mb-6 h-1.5 w-full overflow-hidden bg-[#262626]">
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
                                    <div className="mt-6 flex items-center justify-between border-t border-neutral-200 dark:border-[#262626] pt-5 text-sm">
                                        <div className="font-heading font-bold text-[#111111] dark:text-[#F5F2EB]">
                                            {activeStoryStep === 0 &&
                                                '01. Pendaftaran Karya Mandiri'}
                                            {activeStoryStep === 1 &&
                                                '02. Cek Kelayakan & Penetapan HPP'}
                                            {activeStoryStep === 2 &&
                                                '03. Transaksi Digital Tanpa Antrean'}
                                        </div>
                                        <span className="font-mono text-[10px] text-neutral-500 dark:text-[#737373] uppercase">
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
                                            : 'border-neutral-200 dark:border-[#262626] opacity-40 hover:opacity-80'
                                    }`}
                                    onClick={() => scrollToStep(0)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`step-inactive-num font-heading text-4xl font-black transition-colors duration-300 sm:text-5xl ${
                                                activeStoryStep === 0
                                                    ? 'text-[#E34A27]'
                                                    : 'text-neutral-300 dark:text-[#262626]'
                                            }`}
                                        >
                                            01
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-3xl">
                                        Siswa Mendaftarkan Karya
                                    </h3>

                                    {/* Mobile-Only Step Visual */}
                                    <div className="mt-5 mb-4 overflow-hidden border border-neutral-200 dark:border-[#262626] lg:hidden">
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

                                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-[#888888]">
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
                                            : 'border-neutral-200 dark:border-[#262626] opacity-40 hover:opacity-80'
                                    }`}
                                    onClick={() => scrollToStep(1)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`step-inactive-num font-heading text-4xl font-black transition-colors duration-300 sm:text-5xl ${
                                                activeStoryStep === 1
                                                    ? 'text-[#E34A27]'
                                                    : 'text-neutral-300 dark:text-[#262626]'
                                            }`}
                                        >
                                            02
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-3xl">
                                        Koperasi Melakukan Kurasi
                                    </h3>

                                    {/* Mobile-Only Step Visual */}
                                    <div className="mt-5 mb-4 overflow-hidden border border-neutral-200 dark:border-[#262626] lg:hidden">
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

                                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-[#888888]">
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
                                            : 'border-neutral-200 dark:border-[#262626] opacity-40 hover:opacity-80'
                                    }`}
                                    onClick={() => scrollToStep(2)}
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className={`step-inactive-num font-heading text-4xl font-black transition-colors duration-300 sm:text-5xl ${
                                                activeStoryStep === 2
                                                    ? 'text-[#E34A27]'
                                                    : 'text-neutral-300 dark:text-[#262626]'
                                            }`}
                                        >
                                            03
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-3xl">
                                        Warga Sekolah Bertransaksi Instan
                                    </h3>

                                    {/* Mobile-Only Step Visual */}
                                    <div className="mt-5 mb-4 overflow-hidden border border-neutral-200 dark:border-[#262626] lg:hidden">
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

                                    <p className="mt-4 text-base leading-relaxed text-neutral-600 dark:text-[#888888]">
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
                    className="scene-student-craft border-b border-neutral-200 dark:border-[#262626] bg-white dark:bg-[#0E0E0E] py-16 sm:py-24 transition-colors duration-300"
                >
                    <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-20">
                            {/* Visual Artwork Showcase with Hover Scaling */}
                            <div className="order-2 lg:order-1 lg:col-span-7">
                                <div className="surface-card group overflow-hidden border border-[#262626] bg-[#141414] transition-all duration-500 hover:border-[#404040]">
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
                                <h2 className="font-heading text-2xl leading-tight font-black tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-3xl lg:text-4xl">
                                    KARYA SISWA, <br />
                                    JADI PRODUK NYATA.
                                </h2>
                                <p className="text-base leading-relaxed text-neutral-600 dark:text-[#888888] sm:text-lg">
                                    Bukan sekadar simulasi di atas lembar
                                    penilaian kelas. KOPDIG memberikan panggung
                                    wirausaha nyata. Produk siswa dipajang,
                                    dibeli, dan dinikmati langsung oleh
                                    komunitas sekolah mereka sendiri.
                                </p>
                                <div className="space-y-4 border-t border-neutral-200 dark:border-[#262626] pt-4">
                                    <div className="group flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#E34A27] transition-transform duration-300 group-hover:scale-125" />
                                        <p className="text-xs leading-relaxed text-neutral-600 dark:text-[#A3A3A3] transition-colors group-hover:text-[#111111] dark:group-hover:text-[#F5F2EB]">
                                            Penetapan harga transparan dengan
                                            pencatatan komisi koperasi yang
                                            jelas.
                                        </p>
                                    </div>
                                    <div className="group flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#E34A27] transition-transform duration-300 group-hover:scale-125" />
                                        <p className="text-xs leading-relaxed text-neutral-600 dark:text-[#A3A3A3] transition-colors group-hover:text-[#111111] dark:group-hover:text-[#F5F2EB]">
                                            Rekapitulasi penjualan terpusat yang
                                            memudahkan pelunasan hak dana siswa.
                                        </p>
                                    </div>
                                    <div className="group flex items-start gap-3">
                                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-[#E34A27] transition-transform duration-300 group-hover:scale-125" />
                                        <p className="text-xs leading-relaxed text-neutral-600 dark:text-[#A3A3A3] transition-colors group-hover:text-[#111111] dark:group-hover:text-[#F5F2EB]">
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
                    className="scene-showcase relative border-b border-neutral-200 dark:border-[#262626] bg-[#F8F9FA] dark:bg-[#0A0A0A] py-16 sm:py-24 transition-colors duration-300"
                >
                    <div
                        id="sistem-digital"
                        className="pointer-events-none absolute -top-20"
                    />
                    <div className="mx-auto max-w-[1440px] px-6 text-center sm:px-12">
                        <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                            Arsitektur Antarmuka
                        </span>
                        <h2 className="mt-4 font-heading text-2xl font-black tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-3xl lg:text-4xl">
                            Dirancang untuk Waktu Istirahat yang Singkat.
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm text-neutral-600 dark:text-[#888888] sm:text-base">
                            Setiap detik di jam istirahat berharga. Seluruh alur
                            pesanan dirancang agar tervalidasi seketika tanpa
                            antrean kasir.
                        </p>
                    </div>

                    {/* Art-Directed SaaS Browser Frame with Interactive Hover Elevation */}
                    <div className="mx-auto mt-10 max-w-4xl px-6 sm:mt-12">
                        <div className="surface-card overflow-hidden border border-neutral-200 dark:border-[#262626] bg-white dark:bg-[#141414] shadow-2xl transition-all duration-500 hover:border-[#404040]">
                            {/* Browser chrome header */}
                            <div className="browser-chrome flex items-center justify-between border-b border-neutral-200 dark:border-[#262626] bg-neutral-100 dark:bg-[#0A0A0A] px-5 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="browser-dot size-2.5 rounded-full bg-neutral-300 dark:bg-[#262626]" />
                                    <div className="browser-dot size-2.5 rounded-full bg-neutral-300 dark:bg-[#262626]" />
                                    <div className="browser-dot size-2.5 rounded-full bg-neutral-300 dark:bg-[#262626]" />
                                </div>
                                <span className="font-mono text-[11px] tracking-widest text-neutral-500 dark:text-[#737373]">
                                    app.kopdig.internal / loket-verifikasi
                                </span>
                                <div className="w-8" />
                            </div>

                            {/* UI Content: High-Fidelity Verification Voucher Mockup */}
                            <div className="browser-canvas bg-neutral-50 dark:bg-[#0F0F0F] p-8 sm:p-14">
                                <div className="surface-card mx-auto max-w-md border border-neutral-200 dark:border-[#262626] bg-white dark:bg-[#181818] p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#E34A27] hover:shadow-2xl hover:shadow-[#E34A27]/10 sm:p-8">
                                    <div className="flex items-start justify-between border-b border-neutral-200 dark:border-[#262626] pb-5">
                                        <div>
                                            <span className="font-mono text-[10px] tracking-widest text-neutral-500 dark:text-[#737373] uppercase">
                                                Slip Pesanan Digital
                                            </span>
                                            <h4 className="mt-1 font-heading text-xl font-bold tracking-tight text-[#111111] dark:text-[#F5F2EB]">
                                                #KPD-2026-0814
                                            </h4>
                                        </div>
                                        <div className="group flex flex-col items-center border border-neutral-200 dark:border-[#262626] bg-neutral-100 dark:bg-[#0A0A0A] p-2.5 transition-colors hover:border-[#E34A27]">
                                            <QrCode
                                                className="size-10 text-[#111111] dark:text-[#F5F2EB] transition-transform duration-300 group-hover:scale-105"
                                                strokeWidth={1.5}
                                            />
                                            <span className="mt-1 font-mono text-[8px] text-neutral-500 dark:text-[#737373] uppercase">
                                                Pindai
                                            </span>
                                        </div>
                                    </div>

                                    {/* Order Items */}
                                    <div className="mt-5 space-y-2">
                                        <div className="voucher-item-row -mx-2 flex items-center justify-between rounded p-2 text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-[#202020]">
                                            <span className="text-neutral-600 dark:text-[#A3A3A3]">
                                                1x Risol Mayo Keju (Karya Siswa)
                                            </span>
                                            <span className="font-mono font-medium text-[#111111] dark:text-[#F5F2EB]">
                                                Rp 5.000
                                            </span>
                                        </div>
                                        <div className="voucher-item-row -mx-2 flex items-center justify-between rounded p-2 text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-[#202020]">
                                            <span className="text-neutral-600 dark:text-[#A3A3A3]">
                                                1x Buku Catatan Sekolah
                                                (Koperasi)
                                            </span>
                                            <span className="font-mono font-medium text-[#111111] dark:text-[#F5F2EB]">
                                                Rp 4.500
                                            </span>
                                        </div>
                                    </div>

                                    {/* Pickup Location Status */}
                                    <div className="mt-6 flex items-center justify-between border-t border-neutral-200 dark:border-[#262626] pt-4">
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-4 text-[#E34A27]" />
                                            <span className="text-xs font-medium text-[#E34A27]">
                                                Siap Diambil di Loket 2
                                            </span>
                                        </div>
                                        <span className="font-mono text-[10px] text-neutral-500 dark:text-[#737373]">
                                            Istirahat 1 (10:00 - 10:30)
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 07. SCENE 06: CINEMATIC CLOSING STATEMENT & CTA */}
                <section className="scene-closing-cta relative overflow-hidden border-b border-neutral-200 dark:border-[#262626] bg-[#F1F3F5] dark:bg-[#0A0A0A] py-16 sm:py-24 transition-colors duration-300">
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
                    <div className="cta-scrim absolute inset-0 bg-gradient-to-t from-[#F1F3F5] via-[#F1F3F5]/85 to-[#F1F3F5] dark:from-[#0A0A0A] dark:via-[#0A0A0A]/80 dark:to-[#0A0A0A]" />

                    <div className="anim-fade-up relative z-10 mx-auto max-w-[1440px] px-6 text-center sm:px-12">
                        <span className="text-[11px] font-semibold tracking-[0.25em] text-[#E34A27] uppercase">
                            Bergabung Bersama Ekosistem
                        </span>
                        <h2 className="mt-6 font-heading text-3xl leading-tight font-black tracking-tight text-[#111111] dark:text-[#F5F2EB] sm:text-4xl lg:text-5xl">
                            Mulai dari Satu Karya. <br />
                            Menggerakkan Ekonomi Sekolah.
                        </h2>
                        <p className="mx-auto mt-6 max-w-xl text-base text-neutral-600 dark:text-[#888888] sm:text-lg">
                            Akses resmi bagi siswa untuk mendaftarkan produk dan
                            bagi seluruh warga sekolah untuk menikmati kemudahan
                            transaksi tanpa antrean.
                        </p>

                        <div className="mt-8 flex flex-col items-center justify-center gap-5 sm:mt-10 sm:flex-row">
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
            <footer className="border-t border-neutral-200 dark:border-[#1C1C1C] bg-[#E9ECEF] dark:bg-[#070707] py-20 transition-colors duration-300">
                <div className="mx-auto max-w-[1440px] px-6 sm:px-12">
                    <div className="grid grid-cols-1 gap-12 border-b border-neutral-300 dark:border-[#1C1C1C] pb-16 md:grid-cols-12">
                        {/* Brand Column */}
                        <div className="space-y-4 md:col-span-6">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/images/logo.png"
                                    alt="Logo SMK Negeri 1 Ciomas - KOPDIG"
                                    className="h-9 w-auto object-contain drop-shadow-md"
                                />
                                <div className="flex flex-col">
                                    <span className="font-heading text-base font-bold tracking-tight text-[#111111] dark:text-[#F5F2EB]">
                                        KOPDIG
                                    </span>
                                    <span className="font-mono text-[9px] tracking-wider text-neutral-500 dark:text-[#737373] uppercase">
                                        SMKN 1 CIOMAS
                                    </span>
                                </div>
                            </div>
                            <p className="max-w-sm text-xs leading-relaxed text-neutral-600 dark:text-[#737373]">
                                Ekosistem niaga digital resmi warga sekolah.
                                Platform penghubung kreasi kewirausahaan siswa
                                dan efisiensi operasional koperasi sekolah.
                            </p>
                        </div>

                        {/* Navigation Indices with Hover Microinteractions */}
                        <div className="space-y-3 md:col-span-3">
                            <h5 className="font-mono text-[10px] tracking-widest text-neutral-600 dark:text-[#A3A3A3] uppercase">
                                Navigasi Platform
                            </h5>
                            <ul className="space-y-2 text-xs text-neutral-600 dark:text-[#737373]">
                                <li>
                                    <a
                                        href="#tentang"
                                        onClick={(e) =>
                                            handleNavClick(e, '#tentang')
                                        }
                                        className="inline-block py-0.5 transition-colors hover:text-[#111111] dark:hover:text-[#F5F2EB]"
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
                                        className="inline-block py-0.5 transition-colors hover:text-[#111111] dark:hover:text-[#F5F2EB]"
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
                                        className="inline-block py-0.5 transition-colors hover:text-[#111111] dark:hover:text-[#F5F2EB]"
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
                                        className="inline-block py-0.5 transition-colors hover:text-[#111111] dark:hover:text-[#F5F2EB]"
                                    >
                                        Sistem Digital
                                    </a>
                                </li>
                            </ul>
                        </div>

                        {/* Operational Scope */}
                        <div className="space-y-3 md:col-span-3">
                            <h5 className="font-mono text-[10px] tracking-widest text-neutral-600 dark:text-[#A3A3A3] uppercase">
                                Hak Akses Peran
                            </h5>
                            <ul className="space-y-2 text-xs text-neutral-600 dark:text-[#737373]">
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
                    <div className="mt-8 flex flex-col items-center justify-between gap-4 font-mono text-[11px] text-neutral-500 dark:text-[#555] sm:flex-row">
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
