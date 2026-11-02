import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    ChevronRight,
    Clock,
    Key,
    Lock,
    LogOut,
    Package,
    Plus,
    ShoppingBag,
    Sparkles,
    Store,
    User as UserIcon,
} from 'lucide-react';
import DeleteUser from '@/components/delete-user';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { Auth } from '@/types/auth';

interface OrderSummary {
    id: number;
    order_number: string;
    queue_code: string | null;
    subtotal: number;
    total: number;
    order_status: string;
    order_status_label: string;
    payment_status: string;
    payment_status_label: string;
    created_at: string | null;
    formatted_created_at: string;
    items_count: number;
    total_quantity: number;
    first_item_name: string;
    pickup_session: {
        id: number;
        name: string;
        formatted_time: string;
        formatted_date: string;
    } | null;
}

interface SubmissionSummary {
    id: number;
    name: string;
    category_name: string;
    base_price: number;
    proposed_stock: number;
    status: 'submitted' | 'under_review' | 'approved' | 'rejected';
    status_label: string;
    rejection_reason: string | null;
    created_at: string | null;
    formatted_created_at: string;
    product_slug: string | null;
}

interface UserProfileData {
    id: number;
    name: string;
    email: string;
    student_identifier: string | null;
    avatar_path: string | null;
    role: string;
    role_label: string;
    joined_at: string;
    email_verified: boolean;
}

interface ProfileProps {
    auth: Auth;
    mustVerifyEmail: boolean;
    status?: string;
    userProfile?: UserProfileData;
    recentOrders?: OrderSummary[];
    totalOrdersCount?: number;
    recentSubmissions?: SubmissionSummary[];
    totalSubmissionsCount?: number;
    [key: string]: unknown;
}

export default function Profile({
    mustVerifyEmail,
    status,
    userProfile,
    recentOrders = [],
    totalOrdersCount = 0,
    recentSubmissions = [],
    totalSubmissionsCount = 0,
}: ProfileProps) {
    const { auth } = usePage<ProfileProps>().props;
    const currentUser = auth.user;

    const [profileSaved, setProfileSaved] = useState(false);
    const [passwordSaved, setPasswordSaved] = useState(false);

    // Profile form
    const profileForm = useForm({
        name: userProfile?.name || currentUser.name || '',
        email: userProfile?.email || currentUser.email || '',
    });

    // Password form
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => {
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 4000);
            },
        });
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setPasswordSaved(true);
                setTimeout(() => setPasswordSaved(false), 4000);
            },
        });
    };

    const handleLogout = () => {
        router.post('/logout');
    };

    // User details resolution
    const displayName = userProfile?.name || currentUser.name;
    const displayEmail = userProfile?.email || currentUser.email;
    const displayIdentifier =
        userProfile?.student_identifier || currentUser.student_identifier;
    const roleLabel =
        userProfile?.role_label ||
        (currentUser.role === 'cooperative'
            ? 'Pengurus Koperasi'
            : 'Siswa / Anggota Koperasi');
    const joinedAt = userProfile?.joined_at || 'Warga KOPDIG';

    // Payment status badge helper
    const getPaymentBadge = (statusValue: string, label: string) => {
        switch (statusValue) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                        <Check className="size-2.5" />
                        {label}
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                        <Clock className="size-2.5" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-300">
                        {label}
                    </span>
                );
        }
    };

    // Order fulfillment badge helper
    const getOrderBadge = (statusValue: string, label: string) => {
        switch (statusValue) {
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="size-2.5" />
                        {label}
                    </span>
                );
            case 'ready_for_pickup':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-indigo-500/30 bg-indigo-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-indigo-300">
                        <Sparkles className="size-2.5 text-[#E34A27]" />
                        {label}
                    </span>
                );
            case 'processing':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                        <Clock className="size-2.5" />
                        {label}
                    </span>
                );
            case 'pending_payment':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/40 px-2 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                        <Clock className="size-2.5" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-0.5 font-mono text-[10px] font-medium text-neutral-400">
                        {label}
                    </span>
                );
        }
    };

    // Consignment status badge helper
    const getSubmissionBadge = (
        statusValue: SubmissionSummary['status'],
        label: string,
    ) => {
        switch (statusValue) {
            case 'approved':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                        <CheckCircle2 className="size-2.5" />
                        {label}
                    </span>
                );
            case 'under_review':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sky-300">
                        <Clock className="size-2.5" />
                        {label}
                    </span>
                );
            case 'submitted':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-amber-400">
                        <Clock className="size-2.5" />
                        {label}
                    </span>
                );
            case 'rejected':
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/20 bg-rose-950/40 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-rose-400">
                        <AlertCircle className="size-2.5" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2.5 py-0.5 font-mono text-[10px] font-medium text-neutral-400">
                        {label}
                    </span>
                );
        }
    };

    return (
        <div className="profile-page-root relative min-h-screen w-full overflow-x-hidden bg-white font-sans text-[#151D30] antialiased selection:bg-[#EA4828] selection:text-white dark:bg-[#0A0A0A] dark:text-[#F5F2EB]">
            <Head title={`Akun Saya — ${displayName} | KOPDIG`} />

            {/* DARK MODE ATMOSPHERIC BACKGROUND SYSTEM (Unchanged) */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 hidden bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.15),transparent)] dark:block"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 hidden bg-[linear-gradient(to_right,#26262612_1px,transparent_1px),linear-gradient(to_bottom,#26262612_1px,transparent_1px)] bg-[size:40px_40px] dark:block"
            />

            {/* 1. TOP TRANSACTIONAL / NAVIGATION HEADER */}
            <header className="sticky top-0 z-40 w-full border-b border-[#E3E6EF] bg-white/80 backdrop-blur-md dark:border-[#262626] dark:bg-[#0A0A0A]/90">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
                    {/* Left: Back to Marketplace */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="group inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-[#E3E6EF] bg-white px-3.5 py-1.5 font-heading text-xs font-bold text-[#151D30] shadow-xs transition-colors hover:border-[#EA4828]/40 hover:bg-[#FFF0E9] hover:text-[#EA4828] active:scale-95 dark:border-[#262626] dark:bg-[#141414] dark:text-[#A3A3A3] dark:shadow-none dark:hover:border-[#383838] dark:hover:text-[#F5F2EB]"
                        aria-label="Kembali ke katalog"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="font-bold">Katalog</span>
                    </button>

                    {/* Center: Brand Mark */}
                    <Link
                        href="/explore"
                        className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
                    >
                        <img
                            src="/images/logo.png"
                            alt="Logo SMK Negeri 1 Ciomas - KOPDIG"
                            className="h-8 w-auto object-contain drop-shadow-xs transition-transform duration-300 hover:scale-105"
                        />
                        <div className="flex flex-col">
                            <span className="font-heading text-sm leading-none font-bold tracking-tight text-[#151D30] dark:text-[#F5F2EB]">
                                KOPDIG
                            </span>
                            <span className="mt-0.5 font-mono text-[9px] tracking-wider text-[#8992A5] uppercase dark:text-[#737373]">
                                Hub Akun Siswa
                            </span>
                        </div>
                    </Link>

                    {/* Right: Quick Shortcuts */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/cart"
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[#E3E6EF] bg-white px-3.5 py-1.5 font-heading text-xs font-bold text-[#59647D] shadow-xs transition-colors hover:border-[#EA4828]/40 hover:bg-[#FFF0E9] hover:text-[#EA4828] dark:border-[#262626] dark:bg-[#141414] dark:text-[#A3A3A3] dark:shadow-none dark:hover:border-[#383838] dark:hover:text-[#F5F2EB]"
                            aria-label="Buka Keranjang Belanja"
                        >
                            <ShoppingBag className="size-3.5 text-[#EA4828] dark:text-[#E34A27]" />
                            <span className="hidden font-bold sm:inline">Keranjang</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-full border border-[#E3E6EF] bg-white px-3.5 py-1.5 font-heading text-xs font-bold text-[#59647D] shadow-xs transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 dark:border-[#262626] dark:bg-[#141414] dark:text-[#A3A3A3] dark:shadow-none dark:hover:border-red-900/50 dark:hover:bg-red-950/20 dark:hover:text-red-400"
                            aria-label="Keluar dari akun"
                            title="Keluar dari akun"
                        >
                            <LogOut className="size-3.5" />
                            <span className="hidden font-bold sm:inline">Keluar</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. MAIN HUB CONTENT CONTAINER */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* ======================================================== */}
                {/* 01. PROFILE OVERVIEW / HERO IDENTITY                      */}
                {/* ======================================================== */}
                <section className="profile-hero-card mb-8 overflow-hidden rounded-2xl border border-[#E3E6EF] bg-white p-5 shadow-xs sm:p-7 dark:border-[#262626] dark:bg-[#141414] dark:shadow-2xl">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        {/* Avatar & User Details */}
                        <div className="flex items-center gap-4 sm:gap-5">
                            {/* Avatar with Status Dot */}
                            <div className="relative shrink-0">
                                <div className="flex size-16 items-center justify-center rounded-2xl border border-[#EA4828]/25 bg-[#FFF0E9] font-mono text-xl font-bold text-[#EA4828] shadow-inner sm:size-20 sm:text-2xl dark:border-[#262626] dark:bg-[#1c1c1c] dark:text-[#E34A27]">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    className="absolute -right-1 -bottom-1 size-3.5 rounded-full border-2 border-white bg-[#00B88A] shadow-xs dark:border-[#141414] dark:bg-emerald-500"
                                    title="Sesi Aktif"
                                    aria-label="Sesi Aktif"
                                />
                            </div>

                            {/* Name, Email, Identifier */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="profile-role-badge inline-flex items-center rounded-md border border-[#E3E6EF] bg-white px-2 py-0.5 font-mono text-[10px] font-bold tracking-wider text-[#151D30] uppercase shadow-2xs dark:border-black dark:bg-[#0A0A0A] dark:text-white">
                                        {roleLabel}
                                    </span>
                                    {displayIdentifier && (
                                        <span className="inline-flex items-center rounded-md border border-[#EA4828]/30 bg-[#FFF0E9] px-2 py-0.5 font-mono text-[10px] font-bold text-[#EA4828] dark:border-[#E34A27]/30 dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                            NISN: {displayIdentifier}
                                        </span>
                                    )}
                                </div>

                                <h1 className="mt-1.5 truncate font-heading text-xl font-bold tracking-tight text-[#151D30] sm:text-2xl dark:text-[#F5F2EB]">
                                    {displayName}
                                </h1>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-[#59647D] dark:text-[#A3A3A3]">
                                    <span className="truncate">
                                        {displayEmail}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="text-[#8992A5] dark:text-[#383838]"
                                    >
                                        &bull;
                                    </span>
                                    <span className="font-mono text-[11px] text-[#8992A5] dark:text-[#737373]">
                                        Bergabung {joinedAt}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-[#E3E6EF] pt-4 sm:border-t-0 sm:pt-0 dark:border-[#262626]">
                            <a
                                href="#pesanan"
                                className="profile-quick-link inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#EA4828]/25 bg-[#FFF0E9] px-3 py-2 font-heading text-xs font-bold text-[#EA4828] shadow-xs transition-colors hover:border-[#EA4828]/50 hover:bg-[#FFE5D8] active:scale-95 dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-white dark:hover:border-[#383838] dark:hover:text-white"
                            >
                                <ShoppingBag className="size-3.5 text-[#EA4828] dark:text-[#E34A27]" />
                                <span className="font-bold text-[#EA4828] dark:text-white">Pesanan</span>
                                <span className="profile-badge-count ml-1 rounded-full bg-[#EA4828]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#EA4828] dark:bg-[#262626] dark:text-white">
                                    {totalOrdersCount}
                                </span>
                            </a>
                            <a
                                href="#titipan"
                                className="profile-quick-link inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#EA4828]/25 bg-[#FFF0E9] px-3 py-2 font-heading text-xs font-bold text-[#EA4828] shadow-xs transition-colors hover:border-[#EA4828]/50 hover:bg-[#FFE5D8] active:scale-95 dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-white dark:hover:border-[#383838] dark:hover:text-white"
                            >
                                <Store className="size-3.5 text-[#EA4828] dark:text-[#E34A27]" />
                                <span className="font-bold text-[#EA4828] dark:text-white">Titipan</span>
                                <span className="profile-badge-count ml-1 rounded-full bg-[#EA4828]/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#EA4828] dark:bg-[#262626] dark:text-white">
                                    {totalSubmissionsCount}
                                </span>
                            </a>
                            <a
                                href="#pengaturan"
                                className="profile-quick-link inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#EA4828]/25 bg-[#FFF0E9] px-3 py-2 font-heading text-xs font-bold text-[#EA4828] shadow-xs transition-colors hover:border-[#EA4828]/50 hover:bg-[#FFE5D8] active:scale-95 dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-white dark:hover:border-[#383838] dark:hover:text-white"
                            >
                                <UserIcon className="size-3.5 text-[#EA4828] dark:text-[#E34A27]" />
                                <span className="font-bold text-[#EA4828] dark:text-white">Pengaturan</span>
                            </a>
                            <a
                                href="#keamanan"
                                className="profile-quick-link inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#EA4828]/25 bg-[#FFF0E9] px-3 py-2 font-heading text-xs font-bold text-[#EA4828] shadow-xs transition-colors hover:border-[#EA4828]/50 hover:bg-[#FFE5D8] active:scale-95 dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-white dark:hover:border-[#383838] dark:hover:text-white"
                            >
                                <Lock className="size-3.5 text-[#EA4828] dark:text-[#E34A27]" />
                                <span className="font-bold text-[#EA4828] dark:text-white">Keamanan</span>
                            </a>
                        </div>
                    </div>

                    {/* Dual Identity Statement Cards */}
                    <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#E3E6EF] pt-5 sm:grid-cols-2 dark:border-[#262626]">
                        <div className="profile-identity-card flex items-start gap-3 rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] p-3.5 transition-colors hover:border-[#EA4828]/40 hover:bg-[#FFF0E9]/30 dark:border-[#262626]/70 dark:bg-[#0E0E0E] dark:hover:border-[#383838]">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                <ShoppingBag className="size-3.5" />
                            </div>
                            <div>
                                <p className="font-heading text-xs font-bold text-[#151D30] dark:text-white">
                                    Ini Akun Belanjaku
                                </p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[#59647D] dark:text-[#D4D4D4]">
                                    Pantau transaksi barang, jadwal antrean loket koperasi, dan tanda bukti pembelian.
                                </p>
                            </div>
                        </div>

                        <div className="profile-identity-card flex items-start gap-3 rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] p-3.5 transition-colors hover:border-[#EA4828]/40 hover:bg-[#FFF0E9]/30 dark:border-[#262626]/70 dark:bg-[#0E0E0E] dark:hover:border-[#383838]">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                <Store className="size-3.5" />
                            </div>
                            <div>
                                <p className="font-heading text-xs font-bold text-[#151D30] dark:text-white">
                                    Ini Ruang untuk Karyaku
                                </p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[#59647D] dark:text-[#D4D4D4]">
                                    Titipkan produk kriya atau kulinermu untuk dijual bersama Koperasi Sekolah.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ======================================================== */}
                {/* 02. PRIMARY SIGNATURE ACTION: TITIPKAN BARANG KE KOPERASI */}
                {/* ======================================================== */}
                <section className="profile-consignment-banner mb-10 overflow-hidden rounded-2xl border border-[#E3E6EF] bg-gradient-to-r from-white via-white to-[#FFF5F0] p-6 shadow-xs transition-all duration-300 hover:border-[#EA4828]/40 sm:p-8 dark:border-[#262626] dark:bg-gradient-to-br dark:from-[#181818] dark:via-[#141414] dark:to-[#101010] dark:shadow-2xl dark:hover:border-[#E34A27]/50">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-wider text-[#EA4828] uppercase dark:text-[#E34A27]">
                                <Sparkles className="size-3" />
                                <span>Program Konsinyasi Kreatif Siswa</span>
                            </div>
                            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-[#151D30] sm:text-2xl dark:text-white">
                                Titipkan Karyamu ke Koperasi
                            </h2>
                            <p className="mt-2 text-xs leading-relaxed text-[#59647D] sm:text-sm dark:text-[#D4D4D4]">
                                Ajukan produk buatanmu—kriya tangan, kuliner
                                higienis, perlengkapan belajar, atau merchandise
                                kreatif—untuk dikurasi dan dipasarkan resmi
                                melalui etalase KOPDIG.
                            </p>

                            {/* Value Pillars */}
                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-bold text-[#151D30] dark:text-white">
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-[#00B88A] dark:text-emerald-400" />
                                    <span>Kurasi Resmi Sekolah</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-[#00B88A] dark:text-emerald-400" />
                                    <span>Transaksi Loket Terkelola</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-[#00B88A] dark:text-emerald-400" />
                                    <span>Hak Kepemilikan Tetap Milikmu</span>
                                </span>
                            </div>
                        </div>

                        {/* Prominent CTA */}
                        <div className="shrink-0">
                            <Link
                                href="/student/consignments/create"
                                className="group inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#EA4828] px-6 py-3 font-heading text-sm font-bold text-white shadow-lg shadow-[#EA4828]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d03f1e] hover:shadow-[#EA4828]/40 active:translate-y-0 sm:w-auto"
                            >
                                <span className="font-bold">Mulai Pengajuan Produk</span>
                                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* ======================================================== */}
                {/* 03 & 04. DUAL ACTIVITY: ORDERS & MY CONSIGNMENTS         */}
                {/* ======================================================== */}
                <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* LEFT COLUMN: PESANAN TERBARU (BUYER) */}
                    <section id="pesanan" className="flex flex-col">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                    <ShoppingBag className="size-4" />
                                </div>
                                <div>
                                    <h2 className="font-heading text-base font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                        Pesanan Belanja Terbaru
                                    </h2>
                                    <p className="text-[11px] text-[#59647D] dark:text-[#737373]">
                                        Aktivitas pembelian dan pengambilan
                                        barang
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/orders"
                                className="group inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-[#59647D] transition-colors hover:text-[#EA4828] dark:text-[#A3A3A3] dark:hover:text-[#E34A27]"
                            >
                                <span>Lihat Semua ({totalOrdersCount})</span>
                                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3E6EF] bg-white p-8 text-center dark:border-[#262626] dark:bg-[#141414]">
                                <div className="flex size-12 items-center justify-center rounded-full bg-[#FFF0E9] text-[#EA4828] dark:bg-[#1c1c1c] dark:text-[#737373]">
                                    <ShoppingBag className="size-5" />
                                </div>
                                <h3 className="mt-3 font-heading text-sm font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                    Belum Ada Pesanan
                                </h3>
                                <p className="mt-1 max-w-xs text-xs text-[#59647D] dark:text-[#737373]">
                                    Kamu belum pernah melakukan checkout barang
                                    di KOPDIG.
                                </p>
                                <Link
                                    href="/explore"
                                    className="profile-dark-btn mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#EA4828]/25 bg-[#FFF0E9] px-4 py-2 font-heading text-xs font-bold text-[#EA4828] shadow-xs transition-colors hover:border-[#EA4828]/50 hover:bg-[#FFE5D8] dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-white dark:hover:border-[#383838]"
                                >
                                    <span className="font-bold text-[#EA4828] dark:text-white">Jelajahi Katalog</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/orders/${order.id}`}
                                        className="group block rounded-2xl border border-[#E3E6EF] bg-white p-4 shadow-xs transition-all duration-200 hover:border-[#EA4828]/30 hover:bg-[#FFF0E9]/20 dark:border-[#262626] dark:bg-[#141414] dark:hover:border-[#383838] dark:hover:bg-[#181818]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                                        {order.order_number}
                                                    </span>
                                                    {order.queue_code && (
                                                        <span className="rounded bg-[#FFF0E9] px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                                            {order.queue_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 font-heading text-xs font-semibold text-[#59647D] group-hover:text-[#151D30] dark:text-[#A3A3A3] dark:group-hover:text-[#F5F2EB]">
                                                    {order.first_item_name}
                                                    {order.items_count > 1 && (
                                                        <span className="font-normal text-[#8992A5] dark:text-[#737373]">
                                                            {' '}
                                                            +
                                                            {order.items_count -
                                                                1}{' '}
                                                            item lainnya
                                                        </span>
                                                    )}
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="font-mono text-xs font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                                    {formatRupiah(order.total)}
                                                </p>
                                                <p className="mt-0.5 font-mono text-[10px] text-[#8992A5] dark:text-[#737373]">
                                                    {order.formatted_created_at}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Row */}
                                        <div className="mt-3 flex items-center justify-between border-t border-[#E3E6EF] pt-2.5 text-xs dark:border-[#262626]/80">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {getPaymentBadge(
                                                    order.payment_status,
                                                    order.payment_status_label,
                                                )}
                                                {getOrderBadge(
                                                    order.order_status,
                                                    order.order_status_label,
                                                )}
                                            </div>

                                            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#59647D] group-hover:text-[#EA4828] dark:text-[#A3A3A3] dark:group-hover:text-[#E34A27]">
                                                <span>Detail</span>
                                                <ChevronRight className="size-3" />
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* RIGHT COLUMN: TITIPAN SAYA (CREATOR) */}
                    <section id="titipan" className="flex flex-col">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                    <Store className="size-4" />
                                </div>
                                <div>
                                    <h2 className="font-heading text-base font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                        Titipan Produk Saya
                                    </h2>
                                    <p className="text-[11px] text-[#59647D] dark:text-[#737373]">
                                        Status kurasi dan persetujuan koperasi
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/student/consignments"
                                className="group inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-[#59647D] transition-colors hover:text-[#EA4828] dark:text-[#A3A3A3] dark:hover:text-[#E34A27]"
                            >
                                <span>
                                    Lihat Semua ({totalSubmissionsCount})
                                </span>
                                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {recentSubmissions.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#E3E6EF] bg-white p-8 text-center dark:border-[#262626] dark:bg-[#141414]">
                                <div className="flex size-12 items-center justify-center rounded-full bg-[#FFF0E9] text-[#EA4828] dark:bg-[#1c1c1c] dark:text-[#737373]">
                                    <Package className="size-5" />
                                </div>
                                <h3 className="mt-3 font-heading text-sm font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                    Belum Ada Titipan Produk
                                </h3>
                                <p className="mt-1 max-w-xs text-xs text-[#59647D] dark:text-[#737373]">
                                    Mulai langkah wirausahamu dengan mengajukan
                                    produk ke koperasi sekolah.
                                </p>
                                <Link
                                    href="/student/consignments/create"
                                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#EA4828] px-4 py-2 font-heading text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#d63d1e]"
                                >
                                    <Plus className="size-3.5" />
                                    <span className="font-bold">Ajukan Produk Pertama</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentSubmissions.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="rounded-2xl border border-[#E3E6EF] bg-white p-4 shadow-xs transition-all duration-200 hover:border-[#EA4828]/30 hover:bg-[#FFF0E9]/20 dark:border-[#262626] dark:bg-[#141414] dark:hover:border-[#383838]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] tracking-wider text-[#8992A5] uppercase dark:text-[#737373]">
                                                        {sub.category_name}
                                                    </span>
                                                    {getSubmissionBadge(
                                                        sub.status,
                                                        sub.status_label,
                                                    )}
                                                </div>
                                                <h3 className="mt-1 truncate font-heading text-xs font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                                    {sub.name}
                                                </h3>
                                                <p className="mt-0.5 text-[11px] text-[#59647D] dark:text-[#A3A3A3]">
                                                    Harga modal:{' '}
                                                    <span className="font-mono font-medium text-[#151D30] dark:text-[#F5F2EB]">
                                                        {formatRupiah(
                                                            sub.base_price,
                                                        )}
                                                    </span>{' '}
                                                    &bull; Diajukan:{' '}
                                                    <span className="font-mono font-medium text-[#151D30] dark:text-white">
                                                        {sub.proposed_stock} pcs
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <span className="font-mono text-[10px] text-[#8992A5] dark:text-[#737373]">
                                                    {sub.formatted_created_at}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rejection Note if Rejected */}
                                        {sub.status === 'rejected' &&
                                            sub.rejection_reason && (
                                                <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[11px] text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
                                                    <span className="font-semibold">
                                                        Catatan Koperasi:{' '}
                                                    </span>
                                                    {sub.rejection_reason}
                                                </div>
                                            )}

                                        {/* Actions Row */}
                                        <div className="mt-3 flex items-center justify-between border-t border-[#E3E6EF] pt-2.5 text-xs dark:border-[#262626]/80">
                                            <Link
                                                href={`/student/consignments/${sub.id}`}
                                                className="inline-flex min-h-[44px] items-center gap-1 text-[11px] font-medium text-[#59647D] hover:text-[#151D30] dark:text-[#A3A3A3] dark:hover:text-[#F5F2EB]"
                                            >
                                                <span>Status Pengajuan</span>
                                                <ChevronRight className="size-3" />
                                            </Link>

                                            {sub.status === 'approved' &&
                                                sub.product_slug && (
                                                    <Link
                                                        href={`/products/${sub.product_slug}`}
                                                        className="inline-flex min-h-[44px] items-center gap-1 text-[11px] font-semibold text-[#EA4828] hover:underline dark:text-[#E34A27]"
                                                    >
                                                        <span>
                                                            Lihat di Katalog
                                                        </span>
                                                        <ArrowRight className="size-3" />
                                                    </Link>
                                                )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>

                {/* ======================================================== */}
                {/* 05 & 06. SETTINGS & SECURITY (TWO COLUMNS)               */}
                {/* ======================================================== */}
                <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* SECTION 05: PROFILE SETTINGS */}
                    <section
                        id="pengaturan"
                        className="rounded-2xl border border-[#E3E6EF] bg-white p-5 shadow-xs sm:p-7 dark:border-[#262626] dark:bg-[#141414] dark:shadow-xl"
                    >
                        <div className="mb-5 flex items-center gap-2 border-b border-[#E3E6EF] pb-4 dark:border-[#262626]">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                <UserIcon className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-heading text-base font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                    Pengaturan Profil
                                </h2>
                                <p className="text-[11px] text-[#59647D] dark:text-[#737373]">
                                    Perbarui nama tampilan dan alamat surel akun
                                </p>
                            </div>
                        </div>

                        {profileSaved && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <CheckCircle2 className="size-4 shrink-0 text-[#00B88A] dark:text-emerald-400" />
                                <span>Profil berhasil diperbarui.</span>
                            </div>
                        )}

                        <form
                            onSubmit={handleProfileSubmit}
                            className="space-y-4"
                        >
                            {/* Full Name */}
                            <div>
                                <label
                                    htmlFor="profile-name"
                                    className="block font-heading text-xs font-semibold text-[#59647D] dark:text-[#A3A3A3]"
                                >
                                    Nama Lengkap
                                </label>
                                <input
                                    id="profile-name"
                                    type="text"
                                    required
                                    value={profileForm.data.name}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1.5 h-10 w-full rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] px-3.5 text-xs text-[#151D30] placeholder:text-[#8992A5] focus:border-[#EA4828] focus:ring-1 focus:ring-[#EA4828] focus:outline-none dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-[#F5F2EB] dark:placeholder:text-[#525252]"
                                    placeholder="Nama Lengkap Siswa"
                                />
                                <InputError
                                    message={profileForm.errors.name}
                                    className="mt-1"
                                />
                            </div>

                            {/* Email Address */}
                            <div>
                                <label
                                    htmlFor="profile-email"
                                    className="block font-heading text-xs font-semibold text-[#59647D] dark:text-[#A3A3A3]"
                                >
                                    Alamat Surel (Email)
                                </label>
                                <input
                                    id="profile-email"
                                    type="email"
                                    required
                                    value={profileForm.data.email}
                                    onChange={(e) =>
                                        profileForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1.5 h-10 w-full rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] px-3.5 text-xs text-[#151D30] placeholder:text-[#8992A5] focus:border-[#EA4828] focus:ring-1 focus:ring-[#EA4828] focus:outline-none dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-[#F5F2EB] dark:placeholder:text-[#525252]"
                                    placeholder="alamat.email@sekolah.sch.id"
                                />
                                <InputError
                                    message={profileForm.errors.email}
                                    className="mt-1"
                                />
                            </div>

                            {mustVerifyEmail &&
                                currentUser.email_verified_at === null && (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-500/20 dark:bg-amber-950/30 dark:text-amber-300">
                                        <p>Alamat email belum diverifikasi.</p>
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-1 text-emerald-600 dark:text-emerald-400">
                                                Tautan verifikasi baru telah
                                                dikirim ke alamat email Anda.
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* Read-only NISN info box */}
                            <div className="profile-identity-card rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] p-3 text-xs dark:border-[#262626] dark:bg-[#0A0A0A]">
                                <span className="block font-mono text-[10px] tracking-wider text-[#8992A5] uppercase dark:text-[#A3A3A3]">
                                    Identitas Pelajar (NISN)
                                </span>
                                <span className="mt-0.5 block font-mono font-semibold text-[#151D30] dark:text-white">
                                    {displayIdentifier || 'Tidak terdaftar'}
                                </span>
                                <p className="mt-1 text-[10px] text-[#59647D] dark:text-[#A3A3A3]">
                                    NISN terhubung dengan basis data sekolah.
                                    Hubungi operator koperasi sekolah jika
                                    terdapat kekeliruan data.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-[#EA4828] px-4 py-2 font-heading text-xs font-bold text-white shadow-xs transition-colors hover:bg-[#d63d1e] disabled:opacity-50"
                            >
                                <span className="font-bold">
                                    {profileForm.processing
                                        ? 'Menyimpan...'
                                        : 'Simpan Perubahan'}
                                </span>
                            </button>
                        </form>
                    </section>

                    {/* SECTION 06: SECURITY & PASSWORD */}
                    <section
                        id="keamanan"
                        className="rounded-2xl border border-[#E3E6EF] bg-white p-5 shadow-xs sm:p-7 dark:border-[#262626] dark:bg-[#141414] dark:shadow-xl"
                    >
                        <div className="mb-5 flex items-center gap-2 border-b border-[#E3E6EF] pb-4 dark:border-[#262626]">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#FFF0E9] text-[#EA4828] dark:bg-[#E34A27]/10 dark:text-[#E34A27]">
                                <Lock className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-heading text-base font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                    Keamanan & Kata Sandi
                                </h2>
                                <p className="text-[11px] text-[#59647D] dark:text-[#737373]">
                                    Jaga kerahasiaan akses akun Anda
                                </p>
                            </div>
                        </div>

                        {passwordSaved && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-300">
                                <CheckCircle2 className="size-4 shrink-0 text-[#00B88A] dark:text-emerald-400" />
                                <span>Kata sandi berhasil diperbarui.</span>
                            </div>
                        )}

                        <form
                            onSubmit={handlePasswordSubmit}
                            className="space-y-4"
                        >
                            {/* Current Password */}
                            <div>
                                <label
                                    htmlFor="current-password"
                                    className="block font-heading text-xs font-semibold text-[#59647D] dark:text-[#A3A3A3]"
                                >
                                    Kata Sandi Saat Ini
                                </label>
                                <PasswordInput
                                    id="current-password"
                                    required
                                    value={passwordForm.data.current_password}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'current_password',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1.5 h-10 rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] text-xs text-[#151D30] focus:border-[#EA4828] focus:ring-[#EA4828] dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-[#F5F2EB]"
                                    placeholder="Masukkan kata sandi saat ini"
                                />
                                <InputError
                                    message={
                                        passwordForm.errors.current_password
                                    }
                                    className="mt-1"
                                />
                            </div>

                            {/* New Password */}
                            <div>
                                <label
                                    htmlFor="new-password"
                                    className="block font-heading text-xs font-semibold text-[#59647D] dark:text-[#A3A3A3]"
                                >
                                    Kata Sandi Baru
                                </label>
                                <PasswordInput
                                    id="new-password"
                                    required
                                    value={passwordForm.data.password}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1.5 h-10 rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] text-xs text-[#151D30] focus:border-[#EA4828] focus:ring-[#EA4828] dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-[#F5F2EB]"
                                    placeholder="Minimal 8 karakter"
                                />
                                <InputError
                                    message={passwordForm.errors.password}
                                    className="mt-1"
                                />
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label
                                    htmlFor="password-confirmation"
                                    className="block font-heading text-xs font-semibold text-[#59647D] dark:text-[#A3A3A3]"
                                >
                                    Konfirmasi Kata Sandi Baru
                                </label>
                                <PasswordInput
                                    id="password-confirmation"
                                    required
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    className="mt-1.5 h-10 rounded-xl border border-[#E3E6EF] bg-[#F8F9FC] text-xs text-[#151D30] focus:border-[#EA4828] focus:ring-[#EA4828] dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-[#F5F2EB]"
                                    placeholder="Ulangi kata sandi baru"
                                />
                                <InputError
                                    message={
                                        passwordForm.errors
                                            .password_confirmation
                                    }
                                    className="mt-1"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="profile-dark-btn inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#EA4828]/25 bg-[#FFF0E9] px-4 py-2 font-heading text-xs font-bold text-[#EA4828] shadow-xs transition-colors hover:border-[#EA4828]/50 hover:bg-[#FFE5D8] dark:border-[#262626] dark:bg-[#0A0A0A] dark:text-white dark:hover:border-[#383838] dark:hover:bg-[#1a1a1a] disabled:opacity-50"
                            >
                                <Key className="size-3.5 text-[#EA4828] dark:text-[#E34A27]" />
                                <span className="font-bold text-[#EA4828] dark:text-white">
                                    {passwordForm.processing
                                        ? 'Menyimpan...'
                                        : 'Perbarui Kata Sandi'}
                                </span>
                            </button>
                        </form>
                    </section>
                </div>

                {/* ======================================================== */}
                {/* 07 & 08. SESSION & LOGOUT MANAGEMENT                     */}
                {/* ======================================================== */}
                <section className="rounded-2xl border border-[#E3E6EF] bg-white p-5 shadow-xs sm:p-7 dark:border-[#262626] dark:bg-[#141414] dark:shadow-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-heading text-sm font-bold text-[#151D30] dark:text-[#F5F2EB]">
                                Sesi Akun & Keamanan Perangkat
                            </h3>
                            <p className="mt-0.5 max-w-xl text-xs text-[#59647D] dark:text-[#737373]">
                                Selalu keluar dari akun KOPDIG setelah
                                bertransaksi jika Anda menggunakan komputer
                                bersama di laboratorium sekolah atau
                                perpustakaan.
                            </p>
                        </div>

                        <div className="shrink-0">
                            <button
                                type="button"
                                onClick={handleLogout}
                                className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 font-heading text-xs font-bold text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 active:scale-[0.99] sm:w-auto dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 dark:hover:border-red-800 dark:hover:bg-red-950/40"
                            >
                                <LogOut className="size-4" />
                                <span className="font-bold">Keluar dari Akun KOPDIG</span>
                            </button>
                        </div>
                    </div>

                    {/* Preserved Account Deletion Capability */}
                    <div className="mt-6 border-t border-[#E3E6EF] pt-5 dark:border-[#262626]">
                        <DeleteUser />
                    </div>
                </section>
            </main>
        </div>
    );
}
