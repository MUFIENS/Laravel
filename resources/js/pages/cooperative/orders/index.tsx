import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Calendar,
    CheckCircle2,
    Clock,
    Eye,
    QrCode,
    RefreshCw,
    Search,
    ShoppingBag,
    Ticket,
    User as UserIcon,
    X,
    XCircle,
} from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import type {
    CooperativeOrderFilters,
    CooperativeOrderListItem,
    CooperativeOrderStats,
} from '@/types/cooperative-order';

type Props = {
    orders: {
        data: CooperativeOrderListItem[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
    };
    stats: CooperativeOrderStats;
    pickup_sessions: {
        id: number;
        name: string;
        pickup_date: string;
        formatted_time: string;
    }[];
    filters: CooperativeOrderFilters;
};

type PageProps = {
    flash?: {
        success?: string;
        error?: string;
    };
    [key: string]: unknown;
};

export default function CooperativeOrdersIndex({
    orders,
    stats,
    pickup_sessions,
    filters,
}: Props) {
    const { flash } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const orderStatusOptions = [
        { key: 'all', label: 'Semua Status Pesanan' },
        { key: 'pending_payment', label: 'Menunggu Pembayaran' },
        { key: 'paid', label: 'Sudah Dibayar' },
        { key: 'processing', label: 'Sedang Disiapkan' },
        { key: 'ready_for_pickup', label: 'Siap Diambil' },
        { key: 'completed', label: 'Selesai' },
        { key: 'cancelled', label: 'Dibatalkan' },
        { key: 'payment_failed', label: 'Pembayaran Gagal' },
    ];

    const paymentStatusOptions = [
        { key: 'all', label: 'Semua Status Pembayaran' },
        { key: 'pending', label: 'Menunggu Pembayaran' },
        { key: 'paid', label: 'Lunas' },
        { key: 'failed', label: 'Gagal' },
        { key: 'cancelled', label: 'Dibatalkan' },
        { key: 'expired', label: 'Kedaluwarsa' },
    ];

    const applyFilter = (key: string, value: string) => {
        const queryParams: Record<string, string> = {
            ...filters,
            [key]: value,
            page: '1',
        };

        if (value === 'all' || value === '') {
            delete queryParams[key];
        }

        router.get('/cooperative/orders', queryParams, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        applyFilter('search', searchTerm);
    };

    const handleReset = () => {
        setSearchTerm('');
        router.get(
            '/cooperative/orders',
            {},
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const hasActiveFilters =
        filters.payment_status !== 'all' ||
        filters.order_status !== 'all' ||
        filters.pickup_session_id !== 'all' ||
        filters.date !== 'all' ||
        (filters.search && filters.search.trim() !== '');

    const getOrderStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'pending_payment':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-950/40 px-2.5 py-0.5 text-xs font-semibold text-amber-400">
                        <Clock className="h-3 w-3 text-amber-400" />
                        {label}
                    </span>
                );
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-950/40 px-2.5 py-0.5 text-xs font-semibold text-sky-400">
                        <CheckCircle2 className="h-3 w-3 text-sky-400" />
                        {label}
                    </span>
                );
            case 'ready_for_pickup':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        {label}
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3]">
                        <CheckCircle2 className="h-3 w-3 text-[#737373]" />
                        {label}
                    </span>
                );
            case 'cancelled':
            case 'payment_failed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-950/40 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
                        <XCircle className="h-3 w-3 text-rose-400" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 text-xs font-semibold text-[#A3A3A3]">
                        {label || status}
                    </span>
                );
        }
    };

    const getPaymentStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        {label}
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-950/40 px-2 py-0.5 text-xs font-medium text-amber-400">
                        <Clock className="h-3 w-3 text-amber-400" />
                        {label}
                    </span>
                );
            case 'failed':
            case 'cancelled':
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-950/40 px-2 py-0.5 text-xs font-medium text-rose-400">
                        <XCircle className="h-3 w-3 text-rose-400" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-[#262626] bg-[#1A1A1A] px-2 py-0.5 text-xs font-medium text-[#A3A3A3]">
                        {label || status}
                    </span>
                );
        }
    };

    return (
        <CooperativeShell activeNav="orders">
            <Head title="Manajemen Pesanan & Antrean — KOPDIG" />

            <div className="mx-auto max-w-7xl space-y-6 pb-12">
                {/* Header Section */}
                <div className="flex flex-col gap-4 border-b border-[#262626] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-[#E34A27] uppercase">
                            <ShoppingBag className="h-4 w-4" />
                            <span>Operasional Penjualan & Antrean</span>
                        </div>
                        <h1 className="font-heading text-2xl font-bold tracking-tight text-[#F5F2EB] sm:text-3xl">
                            Manajemen Pesanan Masuk
                        </h1>
                        <p className="mt-1 text-xs text-[#737373] sm:text-sm">
                            Monitoring pesanan warga sekolah, status pembayaran,
                            nomor antrean sesi, dan progres pemenuhan loket.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/cooperative/pickup"
                            className="inline-flex items-center gap-2 rounded-full bg-[#E34A27] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#D03E1C] active:scale-98"
                        >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Loket Pemindai QR</span>
                        </Link>
                    </div>
                </div>

                {/* Flash Notifications */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-950/40 p-4 text-xs font-medium text-emerald-400">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                        <span>{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-950/40 p-4 text-xs font-medium text-rose-400">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
                        <span>{flash.error}</span>
                    </div>
                )}

                {/* Real Database Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-[#737373]">
                            <span className="text-[11px] font-semibold tracking-wider uppercase">
                                Total Pesanan
                            </span>
                            <ShoppingBag className="h-4 w-4 text-[#525252]" />
                        </div>
                        <div className="font-mono text-2xl font-bold text-[#F5F2EB]">
                            {stats.total_orders}
                        </div>
                        <div className="mt-1 text-xs text-[#525252]">
                            Seluruh transaksi tercatat
                        </div>
                    </div>

                    <div className="rounded-2xl border border-amber-500/20 bg-amber-950/20 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-amber-400">
                            <span className="text-[11px] font-semibold tracking-wider uppercase">
                                Menunggu Bayar
                            </span>
                            <Clock className="h-4 w-4 text-amber-400" />
                        </div>
                        <div className="font-mono text-2xl font-bold text-amber-300">
                            {stats.pending_payment}
                        </div>
                        <div className="mt-1 text-xs text-amber-400/80">
                            Menanti konfirmasi kasir / gateway
                        </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-emerald-400">
                            <span className="text-[11px] font-semibold tracking-wider uppercase">
                                Siap Diambil
                            </span>
                            <Ticket className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="font-mono text-2xl font-bold text-emerald-300">
                            {stats.ready_for_pickup}
                        </div>
                        <div className="mt-1 text-xs text-emerald-400/80">
                            Antrean loket aktif
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-[#737373]">
                            <span className="text-[11px] font-semibold tracking-wider uppercase">
                                Selesai
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-[#525252]" />
                        </div>
                        <div className="font-mono text-2xl font-bold text-[#F5F2EB]">
                            {stats.completed}
                        </div>
                        <div className="mt-1 text-xs text-[#525252]">
                            Telah diambil oleh siswa
                        </div>
                    </div>

                    <div className="col-span-2 rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-sm lg:col-span-1">
                        <div className="mb-2 flex items-center justify-between text-[#737373]">
                            <span className="text-[11px] font-semibold tracking-wider uppercase">
                                Pendapatan Lunas
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="font-mono text-xl font-bold text-[#F5F2EB] sm:text-2xl">
                            <PriceDisplay amount={stats.total_paid_revenue} />
                        </div>
                        <div className="mt-1 text-xs text-[#525252]">
                            Total pesanan terbayar
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="space-y-3 rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-sm">
                    <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
                        {/* Search Input */}
                        <form
                            onSubmit={handleSearch}
                            className="relative flex-1"
                        >
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#525252]" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari no. pesanan, kode antrean (A-001), atau nama/NISN pemesan..."
                                className="w-full rounded-xl border border-[#262626] bg-[#141414] py-2 pr-4 pl-9 text-xs text-[#F5F2EB] transition-colors placeholder:text-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27]/20 focus:outline-none"
                            />
                        </form>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                            {/* Order Status Filter */}
                            <select
                                value={filters.order_status || 'all'}
                                onChange={(e) =>
                                    applyFilter('order_status', e.target.value)
                                }
                                className="rounded-xl border border-[#262626] bg-[#141414] px-3 py-2 text-xs font-medium text-[#F5F2EB] hover:border-[#383838] focus:border-[#E34A27] focus:outline-none"
                            >
                                {orderStatusOptions.map((opt) => (
                                    <option
                                        key={opt.key}
                                        value={opt.key}
                                        className="bg-[#141414] text-[#F5F2EB]"
                                    >
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Payment Status Filter */}
                            <select
                                value={filters.payment_status || 'all'}
                                onChange={(e) =>
                                    applyFilter(
                                        'payment_status',
                                        e.target.value,
                                    )
                                }
                                className="rounded-xl border border-[#262626] bg-[#141414] px-3 py-2 text-xs font-medium text-[#F5F2EB] hover:border-[#383838] focus:border-[#E34A27] focus:outline-none"
                            >
                                {paymentStatusOptions.map((opt) => (
                                    <option
                                        key={opt.key}
                                        value={opt.key}
                                        className="bg-[#141414] text-[#F5F2EB]"
                                    >
                                        {opt.label}
                                    </option>
                                ))}
                            </select>

                            {/* Pickup Session Filter */}
                            <select
                                value={filters.pickup_session_id || 'all'}
                                onChange={(e) =>
                                    applyFilter(
                                        'pickup_session_id',
                                        e.target.value,
                                    )
                                }
                                className="rounded-xl border border-[#262626] bg-[#141414] px-3 py-2 text-xs font-medium text-[#F5F2EB] hover:border-[#383838] focus:border-[#E34A27] focus:outline-none"
                            >
                                <option
                                    value="all"
                                    className="bg-[#141414] text-[#F5F2EB]"
                                >
                                    Semua Sesi Pengambilan
                                </option>
                                {pickup_sessions.map((sess) => (
                                    <option
                                        key={sess.id}
                                        value={sess.id.toString()}
                                        className="bg-[#141414] text-[#F5F2EB]"
                                    >
                                        {sess.name} ({sess.formatted_time})
                                    </option>
                                ))}
                            </select>

                            {/* Date Filter (Today toggle) */}
                            <button
                                type="button"
                                onClick={() =>
                                    applyFilter(
                                        'date',
                                        filters.date === 'today'
                                            ? 'all'
                                            : 'today',
                                    )
                                }
                                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                                    filters.date === 'today'
                                        ? 'border-[#E34A27] bg-[#E34A27]/10 font-semibold text-[#E34A27]'
                                        : 'border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Hari Ini</span>
                            </button>

                            {/* Reset Button */}
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#262626] bg-[#161616] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                                    title="Reset filter"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Reset</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                {orders.data.length === 0 ? (
                    <div className="rounded-2xl border border-[#262626] bg-[#121212] p-12 text-center shadow-sm">
                        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-[#525252]" />
                        <h3 className="font-heading text-base font-semibold text-[#F5F2EB]">
                            Tidak ada pesanan ditemukan
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-xs text-[#737373]">
                            {hasActiveFilters
                                ? 'Tidak ada data pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.'
                                : 'Belum ada pesanan yang masuk ke koperasi saat ini.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#161616] px-4 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Hapus Semua Filter</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden overflow-hidden rounded-2xl border border-[#262626] bg-[#121212] shadow-sm md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-xs text-[#A3A3A3]">
                                    <thead className="border-b border-[#262626] bg-[#161616] text-[11px] font-semibold tracking-wider text-[#737373] uppercase">
                                        <tr>
                                            <th className="px-4 py-3.5">
                                                No. Pesanan & Waktu
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Pemesan (Siswa)
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Sesi & Antrean
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Status Bayar
                                            </th>
                                            <th className="px-4 py-3.5">
                                                Status Pesanan
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Total
                                            </th>
                                            <th className="px-4 py-3.5 text-right">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#262626]">
                                        {orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="transition-colors hover:bg-[#161616]"
                                            >
                                                {/* Order Number & Timestamp */}
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-0.5">
                                                        <Link
                                                            href={`/cooperative/orders/${order.order_number}`}
                                                            className="block font-mono font-bold text-[#F5F2EB] transition-colors hover:text-[#E34A27]"
                                                        >
                                                            {order.order_number}
                                                        </Link>
                                                        <div className="flex items-center gap-1 text-[11px] text-[#737373]">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(
                                                                order.created_at ||
                                                                    '',
                                                            ).toLocaleDateString(
                                                                'id-ID',
                                                                {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    year: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit',
                                                                },
                                                            )}
                                                        </div>
                                                        <div className="text-[11px] text-[#525252]">
                                                            {order.items_count}{' '}
                                                            jenis barang (
                                                            {
                                                                order.total_quantity
                                                            }{' '}
                                                            unit)
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Customer */}
                                                <td className="px-4 py-3.5">
                                                    {order.customer ? (
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-1.5 font-medium text-[#F5F2EB]">
                                                                <UserIcon className="h-3.5 w-3.5 text-[#737373]" />
                                                                <span>
                                                                    {
                                                                        order
                                                                            .customer
                                                                            .name
                                                                    }
                                                                </span>
                                                            </div>
                                                            {order.customer
                                                                .student_identifier && (
                                                                <div className="font-mono text-[11px] text-[#737373]">
                                                                    NISN:{' '}
                                                                    {
                                                                        order
                                                                            .customer
                                                                            .student_identifier
                                                                    }
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-[#525252] italic">
                                                            Tamu / Warga
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Session & Queue */}
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-1">
                                                        {order.queue_code ? (
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400">
                                                                <Ticket className="h-3 w-3 text-emerald-400" />
                                                                Antrean{' '}
                                                                {
                                                                    order.queue_code
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="block text-xs text-[#525252] italic">
                                                                Belum ada
                                                                antrean
                                                            </span>
                                                        )}
                                                        {order.pickup_session && (
                                                            <div className="text-xs text-[#A3A3A3]">
                                                                <span className="font-medium">
                                                                    {
                                                                        order
                                                                            .pickup_session
                                                                            .name
                                                                    }
                                                                </span>
                                                                <div className="text-[11px] text-[#737373]">
                                                                    {
                                                                        order
                                                                            .pickup_session
                                                                            .formatted_time
                                                                    }
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Payment Status */}
                                                <td className="px-4 py-3.5">
                                                    {getPaymentStatusBadge(
                                                        order.payment_status,
                                                        order.payment_status_label,
                                                    )}
                                                </td>

                                                {/* Order Status */}
                                                <td className="px-4 py-3.5">
                                                    {getOrderStatusBadge(
                                                        order.order_status,
                                                        order.order_status_label,
                                                    )}
                                                </td>

                                                {/* Total */}
                                                <td className="px-4 py-3.5 text-right font-mono font-bold text-[#F5F2EB]">
                                                    <PriceDisplay
                                                        amount={order.total}
                                                        className="text-xs font-bold text-[#F5F2EB]"
                                                    />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <Link
                                                        href={`/cooperative/orders/${order.order_number}`}
                                                        className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#161616] px-3 py-1.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        <span>Detail</span>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Mobile Stacked Card View */}
                        <div className="space-y-3 md:hidden">
                            {orders.data.map((order) => (
                                <div
                                    key={order.id}
                                    className="space-y-3 rounded-2xl border border-[#262626] bg-[#121212] p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <Link
                                                href={`/cooperative/orders/${order.order_number}`}
                                                className="block font-mono text-sm font-bold text-[#F5F2EB] hover:text-[#E34A27]"
                                            >
                                                {order.order_number}
                                            </Link>
                                            <div className="mt-0.5 text-xs text-[#737373]">
                                                {new Date(
                                                    order.created_at || '',
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </div>
                                        </div>

                                        {order.queue_code ? (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400">
                                                <Ticket className="h-3 w-3 text-emerald-400" />
                                                {order.queue_code}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-[#525252] italic">
                                                No Queue
                                            </span>
                                        )}
                                    </div>

                                    {/* Customer & Item count */}
                                    <div className="flex items-center justify-between border-t border-[#262626] pt-2 text-xs">
                                        <div className="flex items-center gap-1.5 font-medium text-[#F5F2EB]">
                                            <UserIcon className="h-3.5 w-3.5 text-[#737373]" />
                                            <span>
                                                {order.customer?.name ||
                                                    'Warga Sekolah'}
                                            </span>
                                        </div>
                                        <div className="text-[#737373]">
                                            {order.items_count} item (
                                            {order.total_quantity} unit)
                                        </div>
                                    </div>

                                    {/* Status Row */}
                                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                                        <div className="flex items-center gap-1.5">
                                            {getOrderStatusBadge(
                                                order.order_status,
                                                order.order_status_label,
                                            )}
                                            {getPaymentStatusBadge(
                                                order.payment_status,
                                                order.payment_status_label,
                                            )}
                                        </div>
                                        <PriceDisplay
                                            amount={order.total}
                                            className="font-mono text-xs font-bold text-[#F5F2EB]"
                                        />
                                    </div>

                                    {/* Action link */}
                                    <div className="border-t border-[#262626] pt-2">
                                        <Link
                                            href={`/cooperative/orders/${order.order_number}`}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#262626] bg-[#161616] px-3 py-2 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>
                                                Lihat Rincian & Riwayat
                                                Pemenuhan
                                            </span>
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination Links */}
                        {orders.links.length > 3 && (
                            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#262626] pt-4">
                                <div className="text-xs text-[#737373]">
                                    Halaman{' '}
                                    <span className="font-mono font-medium text-[#F5F2EB]">
                                        {orders.current_page}
                                    </span>{' '}
                                    dari{' '}
                                    <span className="font-mono font-medium text-[#F5F2EB]">
                                        {orders.last_page}
                                    </span>{' '}
                                    ({orders.total} total pesanan)
                                </div>
                                <div className="flex flex-wrap items-center gap-1">
                                    {orders.links.map((link, idx) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={idx}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                    className="rounded-lg border border-[#262626] px-3 py-1.5 text-xs text-[#525252]"
                                                />
                                            );
                                        }

                                        return (
                                            <Link
                                                key={idx}
                                                href={link.url}
                                                dangerouslySetInnerHTML={{
                                                    __html: link.label,
                                                }}
                                                className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                                    link.active
                                                        ? 'border-[#E34A27] bg-[#E34A27] font-semibold text-white'
                                                        : 'border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                                }`}
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </CooperativeShell>
    );
}
