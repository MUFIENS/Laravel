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
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title={`Akun Saya — ${displayName} | KOPDIG`} />

            {/* ATMOSPHERIC BACKGROUND SYSTEM (Consistent with KOPDIG Brand) */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.15),transparent)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#26262612_1px,transparent_1px),linear-gradient(to_bottom,#26262612_1px,transparent_1px)] bg-[size:40px_40px]"
            />

            {/* 1. TOP TRANSACTIONAL / NAVIGATION HEADER */}
            <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:h-16 sm:px-6">
                    {/* Left: Back to Marketplace */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="group inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke katalog"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Katalog</span>
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
                            <span className="font-heading text-sm leading-none font-bold tracking-tight text-[#F5F2EB]">
                                KOPDIG
                            </span>
                            <span className="mt-0.5 font-mono text-[9px] tracking-wider text-[#737373] uppercase">
                                Hub Akun Siswa
                            </span>
                        </div>
                    </Link>

                    {/* Right: Quick Shortcuts */}
                    <div className="flex items-center gap-2">
                        <Link
                            href="/cart"
                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                            aria-label="Buka Keranjang Belanja"
                        >
                            <ShoppingBag className="size-3.5 text-[#E34A27]" />
                            <span className="hidden sm:inline">Keranjang</span>
                        </Link>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-red-900/50 hover:bg-red-950/20 hover:text-red-300 active:scale-95"
                            aria-label="Keluar dari akun"
                            title="Keluar dari akun"
                        >
                            <LogOut className="size-3.5" />
                            <span className="hidden sm:inline">Keluar</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* 2. MAIN HUB CONTENT CONTAINER */}
            <main className="relative z-10 mx-auto max-w-5xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* ======================================================== */}
                {/* 01. PROFILE OVERVIEW / HERO IDENTITY                      */}
                {/* ======================================================== */}
                <section className="mb-8 overflow-hidden rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-2xl sm:p-7">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        {/* Avatar & User Details */}
                        <div className="flex items-center gap-4 sm:gap-5">
                            {/* Avatar Circle with Status Dot */}
                            <div className="relative shrink-0">
                                <div className="flex size-16 items-center justify-center rounded-2xl border border-[#262626] bg-[#1c1c1c] font-mono text-xl font-bold text-[#E34A27] shadow-inner sm:size-20 sm:text-2xl">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span
                                    className="absolute -right-1 -bottom-1 size-3.5 rounded-full border-2 border-[#141414] bg-emerald-500 shadow-xs"
                                    title="Sesi Aktif"
                                    aria-label="Sesi Aktif"
                                />
                            </div>

                            {/* Name, Email, Identifier */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-md border border-[#262626] bg-[#0A0A0A] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-[#A3A3A3] uppercase">
                                        {roleLabel}
                                    </span>
                                    {displayIdentifier && (
                                        <span className="rounded-md border border-[#E34A27]/30 bg-[#E34A27]/10 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#E34A27]">
                                            NISN: {displayIdentifier}
                                        </span>
                                    )}
                                </div>

                                <h1 className="mt-1.5 truncate font-heading text-xl font-bold tracking-tight text-[#F5F2EB] sm:text-2xl">
                                    {displayName}
                                </h1>

                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#A3A3A3]">
                                    <span className="truncate">
                                        {displayEmail}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className="text-[#383838]"
                                    >
                                        &bull;
                                    </span>
                                    <span className="font-mono text-[11px] text-[#737373]">
                                        Bergabung {joinedAt}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Fast Anchors / Quick Jumps */}
                        <div className="flex flex-wrap items-center gap-2 border-t border-[#262626] pt-4 sm:border-t-0 sm:pt-0">
                            <a
                                href="#pesanan"
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                            >
                                <ShoppingBag className="size-3.5 text-[#E34A27]" />
                                <span>Pesanan</span>
                                <span className="py-0.2 ml-1 rounded-full bg-[#1c1c1c] px-1.5 font-mono text-[10px] text-[#737373]">
                                    {totalOrdersCount}
                                </span>
                            </a>
                            <a
                                href="#titipan"
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                            >
                                <Store className="size-3.5 text-[#E34A27]" />
                                <span>Titipan</span>
                                <span className="py-0.2 ml-1 rounded-full bg-[#1c1c1c] px-1.5 font-mono text-[10px] text-[#737373]">
                                    {totalSubmissionsCount}
                                </span>
                            </a>
                            <a
                                href="#pengaturan"
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                            >
                                <UserIcon className="size-3.5" />
                                <span>Pengaturan</span>
                            </a>
                            <a
                                href="#keamanan"
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                            >
                                <Lock className="size-3.5" />
                                <span>Keamanan</span>
                            </a>
                        </div>
                    </div>

                    {/* Dual Identity Statement Banner */}
                    <div className="mt-6 grid grid-cols-1 gap-3 border-t border-[#262626] pt-5 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-xl border border-[#262626]/70 bg-[#0E0E0E] p-3.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#E34A27]/10 text-[#E34A27]">
                                <ShoppingBag className="size-3.5" />
                            </div>
                            <div>
                                <p className="font-heading text-xs font-bold text-[#F5F2EB]">
                                    Ini Akun Belanjaku
                                </p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[#737373]">
                                    Pantau transaksi barang, jadwal antrean
                                    loket koperasi, dan tanda bukti pembelian.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3 rounded-xl border border-[#262626]/70 bg-[#0E0E0E] p-3.5">
                            <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#E34A27]/10 text-[#E34A27]">
                                <Store className="size-3.5" />
                            </div>
                            <div>
                                <p className="font-heading text-xs font-bold text-[#F5F2EB]">
                                    Ini Ruang untuk Karyaku
                                </p>
                                <p className="mt-0.5 text-[11px] leading-relaxed text-[#737373]">
                                    Titipkan produk kriya atau kulinermu untuk
                                    dijual bersama Koperasi Sekolah.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ======================================================== */}
                {/* 02. PRIMARY SIGNATURE ACTION: TITIPKAN BARANG KE KOPERASI */}
                {/* ======================================================== */}
                <section className="mb-10 overflow-hidden rounded-2xl border border-[#262626] bg-gradient-to-br from-[#181818] via-[#141414] to-[#101010] p-6 shadow-2xl transition-all duration-300 hover:border-[#E34A27]/50 sm:p-8">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="flex items-center gap-2 font-mono text-[10px] tracking-wider text-[#E34A27] uppercase">
                                <Sparkles className="size-3" />
                                <span>Program Konsinyasi Kreatif Siswa</span>
                            </div>
                            <h2 className="mt-2 font-heading text-xl font-bold tracking-tight text-[#F5F2EB] sm:text-2xl">
                                Titipkan Karyamu ke Koperasi
                            </h2>
                            <p className="mt-2 text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                                Ajukan produk buatanmu—kriya tangan, kuliner
                                higienis, perlengkapan belajar, atau merchandise
                                kreatif—untuk dikurasi dan dipasarkan resmi
                                melalui etalase KOPDIG.
                            </p>

                            {/* Value Pillars */}
                            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#737373]">
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                                    <span>Kurasi Resmi Sekolah</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                                    <span>Transaksi Loket Terkelola</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5">
                                    <CheckCircle2 className="size-3.5 text-emerald-400" />
                                    <span>Hak Kepemilikan Tetap Milikmu</span>
                                </span>
                            </div>
                        </div>

                        {/* Prominent CTA */}
                        <div className="shrink-0">
                            <Link
                                href="/student/consignments/create"
                                className="group inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#E34A27] px-6 py-3 font-heading text-sm font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#d03f1e] hover:shadow-[#E34A27]/40 active:translate-y-0 sm:w-auto"
                            >
                                <span>Mulai Pengajuan Produk</span>
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
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#E34A27]/10 text-[#E34A27]">
                                    <ShoppingBag className="size-4" />
                                </div>
                                <div>
                                    <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                        Pesanan Belanja Terbaru
                                    </h2>
                                    <p className="text-[11px] text-[#737373]">
                                        Aktivitas pembelian dan pengambilan
                                        barang
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/orders"
                                className="group inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-[#A3A3A3] transition-colors hover:text-[#E34A27]"
                            >
                                <span>Lihat Semua ({totalOrdersCount})</span>
                                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {recentOrders.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#262626] bg-[#141414] p-8 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-[#1c1c1c] text-[#737373]">
                                    <ShoppingBag className="size-5" />
                                </div>
                                <h3 className="mt-3 font-heading text-sm font-bold text-[#F5F2EB]">
                                    Belum Ada Pesanan
                                </h3>
                                <p className="mt-1 max-w-xs text-xs text-[#737373]">
                                    Kamu belum pernah melakukan checkout barang
                                    di KOPDIG.
                                </p>
                                <Link
                                    href="/explore"
                                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-2 text-xs font-semibold text-[#F5F2EB] transition-colors hover:border-[#383838]"
                                >
                                    Jelajahi Katalog
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentOrders.map((order) => (
                                    <Link
                                        key={order.id}
                                        href={`/orders/${order.id}`}
                                        className="group block rounded-2xl border border-[#262626] bg-[#141414] p-4 transition-all duration-200 hover:border-[#383838] hover:bg-[#181818]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-bold text-[#F5F2EB]">
                                                        {order.order_number}
                                                    </span>
                                                    {order.queue_code && (
                                                        <span className="rounded bg-[#E34A27]/10 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#E34A27]">
                                                            {order.queue_code}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-1 font-heading text-xs font-semibold text-[#A3A3A3] group-hover:text-[#F5F2EB]">
                                                    {order.first_item_name}
                                                    {order.items_count > 1 && (
                                                        <span className="font-normal text-[#737373]">
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
                                                <p className="font-mono text-xs font-bold text-[#F5F2EB]">
                                                    {formatRupiah(order.total)}
                                                </p>
                                                <p className="mt-0.5 font-mono text-[10px] text-[#737373]">
                                                    {order.formatted_created_at}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Status Row */}
                                        <div className="mt-3 flex items-center justify-between border-t border-[#262626]/80 pt-2.5 text-xs">
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

                                            <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#A3A3A3] group-hover:text-[#E34A27]">
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
                                <div className="flex size-7 items-center justify-center rounded-lg bg-[#E34A27]/10 text-[#E34A27]">
                                    <Store className="size-4" />
                                </div>
                                <div>
                                    <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                        Titipan Produk Saya
                                    </h2>
                                    <p className="text-[11px] text-[#737373]">
                                        Status kurasi dan persetujuan koperasi
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/student/consignments"
                                className="group inline-flex min-h-[44px] items-center gap-1 text-xs font-semibold text-[#A3A3A3] transition-colors hover:text-[#E34A27]"
                            >
                                <span>
                                    Lihat Semua ({totalSubmissionsCount})
                                </span>
                                <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                        </div>

                        {recentSubmissions.length === 0 ? (
                            <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-[#262626] bg-[#141414] p-8 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-[#1c1c1c] text-[#737373]">
                                    <Package className="size-5" />
                                </div>
                                <h3 className="mt-3 font-heading text-sm font-bold text-[#F5F2EB]">
                                    Belum Ada Titipan Produk
                                </h3>
                                <p className="mt-1 max-w-xs text-xs text-[#737373]">
                                    Mulai langkah wirausahamu dengan mengajukan
                                    produk ke koperasi sekolah.
                                </p>
                                <Link
                                    href="/student/consignments/create"
                                    className="mt-4 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-[#E34A27] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#d03f1e]"
                                >
                                    <Plus className="size-3.5" />
                                    <span>Ajukan Produk Pertama</span>
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentSubmissions.map((sub) => (
                                    <div
                                        key={sub.id}
                                        className="rounded-2xl border border-[#262626] bg-[#141414] p-4 transition-all duration-200 hover:border-[#383838]"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                                        {sub.category_name}
                                                    </span>
                                                    {getSubmissionBadge(
                                                        sub.status,
                                                        sub.status_label,
                                                    )}
                                                </div>
                                                <h3 className="mt-1 truncate font-heading text-xs font-bold text-[#F5F2EB]">
                                                    {sub.name}
                                                </h3>
                                                <p className="mt-0.5 text-[11px] text-[#A3A3A3]">
                                                    Harga modal:{' '}
                                                    <span className="font-mono font-medium text-[#F5F2EB]">
                                                        {formatRupiah(
                                                            sub.base_price,
                                                        )}
                                                    </span>{' '}
                                                    &bull; Diajukan:{' '}
                                                    <span className="font-mono">
                                                        {sub.proposed_stock} pcs
                                                    </span>
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <span className="font-mono text-[10px] text-[#737373]">
                                                    {sub.formatted_created_at}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rejection Note if Rejected */}
                                        {sub.status === 'rejected' &&
                                            sub.rejection_reason && (
                                                <div className="mt-2.5 rounded-lg border border-rose-900/40 bg-rose-950/20 p-2 text-[11px] text-rose-300">
                                                    <span className="font-semibold">
                                                        Catatan Koperasi:{' '}
                                                    </span>
                                                    {sub.rejection_reason}
                                                </div>
                                            )}

                                        {/* Actions Row */}
                                        <div className="mt-3 flex items-center justify-between border-t border-[#262626]/80 pt-2.5 text-xs">
                                            <Link
                                                href={`/student/consignments/${sub.id}`}
                                                className="inline-flex min-h-[44px] items-center gap-1 text-[11px] font-medium text-[#A3A3A3] hover:text-[#F5F2EB]"
                                            >
                                                <span>Status Pengajuan</span>
                                                <ChevronRight className="size-3" />
                                            </Link>

                                            {sub.status === 'approved' &&
                                                sub.product_slug && (
                                                    <Link
                                                        href={`/products/${sub.product_slug}`}
                                                        className="inline-flex min-h-[44px] items-center gap-1 text-[11px] font-semibold text-[#E34A27] hover:underline"
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
                        className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-xl sm:p-7"
                    >
                        <div className="mb-5 flex items-center gap-2 border-b border-[#262626] pb-4">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#E34A27]/10 text-[#E34A27]">
                                <UserIcon className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                    Pengaturan Profil
                                </h2>
                                <p className="text-[11px] text-[#737373]">
                                    Perbarui nama tampilan dan alamat surel akun
                                </p>
                            </div>
                        </div>

                        {profileSaved && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
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
                                    className="block font-heading text-xs font-semibold text-[#A3A3A3]"
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
                                    className="mt-1.5 h-10 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 text-xs text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
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
                                    className="block font-heading text-xs font-semibold text-[#A3A3A3]"
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
                                    className="mt-1.5 h-10 w-full rounded-xl border border-[#262626] bg-[#0A0A0A] px-3.5 text-xs text-[#F5F2EB] placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                    placeholder="alamat.email@sekolah.sch.id"
                                />
                                <InputError
                                    message={profileForm.errors.email}
                                    className="mt-1"
                                />
                            </div>

                            {mustVerifyEmail &&
                                currentUser.email_verified_at === null && (
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3 text-xs text-amber-300">
                                        <p>Alamat email belum diverifikasi.</p>
                                        {status ===
                                            'verification-link-sent' && (
                                            <p className="mt-1 text-emerald-400">
                                                Tautan verifikasi baru telah
                                                dikirim ke alamat email Anda.
                                            </p>
                                        )}
                                    </div>
                                )}

                            {/* Read-only NISN info box */}
                            <div className="rounded-xl border border-[#262626] bg-[#0A0A0A] p-3 text-xs">
                                <span className="block font-mono text-[10px] tracking-wider text-[#737373] uppercase">
                                    Identitas Pelajar (NISN)
                                </span>
                                <span className="mt-0.5 block font-mono font-semibold text-[#F5F2EB]">
                                    {displayIdentifier || 'Tidak terdaftar'}
                                </span>
                                <p className="mt-1 text-[10px] text-[#737373]">
                                    NISN terhubung dengan basis data sekolah.
                                    Hubungi operator koperasi sekolah jika
                                    terdapat kekeliruan data.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl bg-[#E34A27] px-4 py-2 font-heading text-xs font-bold text-white transition-all hover:bg-[#d03f1e] disabled:opacity-50"
                            >
                                {profileForm.processing
                                    ? 'Menyimpan...'
                                    : 'Simpan Perubahan'}
                            </button>
                        </form>
                    </section>

                    {/* SECTION 06: SECURITY & PASSWORD */}
                    <section
                        id="keamanan"
                        className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-xl sm:p-7"
                    >
                        <div className="mb-5 flex items-center gap-2 border-b border-[#262626] pb-4">
                            <div className="flex size-7 items-center justify-center rounded-lg bg-[#E34A27]/10 text-[#E34A27]">
                                <Lock className="size-4" />
                            </div>
                            <div>
                                <h2 className="font-heading text-base font-bold text-[#F5F2EB]">
                                    Keamanan & Kata Sandi
                                </h2>
                                <p className="text-[11px] text-[#737373]">
                                    Jaga kerahasiaan akses akun Anda
                                </p>
                            </div>
                        </div>

                        {passwordSaved && (
                            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-3 text-xs text-emerald-300">
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-400" />
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
                                    className="block font-heading text-xs font-semibold text-[#A3A3A3]"
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
                                    className="mt-1.5 h-10 rounded-xl border border-[#262626] bg-[#0A0A0A] text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-[#E34A27]"
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
                                    className="block font-heading text-xs font-semibold text-[#A3A3A3]"
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
                                    className="mt-1.5 h-10 rounded-xl border border-[#262626] bg-[#0A0A0A] text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-[#E34A27]"
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
                                    className="block font-heading text-xs font-semibold text-[#A3A3A3]"
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
                                    className="mt-1.5 h-10 rounded-xl border border-[#262626] bg-[#0A0A0A] text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-[#E34A27]"
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
                                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-[#262626] bg-[#0A0A0A] px-4 py-2 font-heading text-xs font-bold text-[#F5F2EB] transition-all hover:border-[#383838] hover:bg-[#1a1a1a] disabled:opacity-50"
                            >
                                <Key className="size-3.5 text-[#E34A27]" />
                                <span>
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
                <section className="rounded-2xl border border-[#262626] bg-[#141414] p-5 shadow-xl sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="font-heading text-sm font-bold text-[#F5F2EB]">
                                Sesi Akun & Keamanan Perangkat
                            </h3>
                            <p className="mt-0.5 max-w-xl text-xs text-[#737373]">
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
                                className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-900/40 bg-red-950/20 px-5 py-2.5 font-heading text-xs font-bold text-red-300 transition-all hover:border-red-800 hover:bg-red-950/40 active:scale-[0.99] sm:w-auto"
                            >
                                <LogOut className="size-4" />
                                <span>Keluar dari Akun KOPDIG</span>
                            </button>
                        </div>
                    </div>

                    {/* Preserved Account Deletion Capability */}
                    <div className="mt-6 border-t border-[#262626] pt-5">
                        <DeleteUser />
                    </div>
                </section>
            </main>
        </div>
    );
}
