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
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        <Clock className="h-3 w-3 text-amber-500" />
                        {label}
                    </span>
                );
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                        <CheckCircle2 className="h-3 w-3 text-blue-500" />
                        {label}
                    </span>
                );
            case 'ready_for_pickup':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                        {label}
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        <CheckCircle2 className="h-3 w-3 text-slate-500" />
                        {label}
                    </span>
                );
            case 'cancelled':
            case 'payment_failed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                        <XCircle className="h-3 w-3 text-rose-500" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        {label || status}
                    </span>
                );
        }
    };

    const getPaymentStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                        {label}
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Clock className="h-3 w-3 text-amber-600" />
                        {label}
                    </span>
                );
            case 'failed':
            case 'cancelled':
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">
                        <XCircle className="h-3 w-3 text-rose-600" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
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
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-wider text-emerald-700 uppercase">
                            <ShoppingBag className="h-4 w-4" />
                            <span>Operasional Penjualan & Antrean</span>
                        </div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                            Manajemen Pesanan Masuk
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitoring pesanan warga sekolah, status pembayaran,
                            nomor antrean sesi, dan progres pemenuhan loket.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <Link
                            href="/cooperative/pickup"
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800"
                        >
                            <QrCode className="h-3.5 w-3.5" />
                            <span>Loket Pemindai QR</span>
                        </Link>
                    </div>
                </div>

                {/* Flash Notifications */}
                {flash?.success && (
                    <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                {flash?.error && (
                    <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                        <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
                        <span className="font-medium">{flash.error}</span>
                    </div>
                )}

                {/* Real Database Statistics Grid */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Total Pesanan
                            </span>
                            <ShoppingBag className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.total_orders}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Seluruh transaksi tercatat
                        </div>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-amber-700">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Menunggu Bayar
                            </span>
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <div className="text-2xl font-bold text-amber-900">
                            {stats.pending_payment}
                        </div>
                        <div className="mt-1 text-xs text-amber-600">
                            Menanti konfirmasi kasir / gateway
                        </div>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-emerald-700">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Siap Diambil
                            </span>
                            <Ticket className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-900">
                            {stats.ready_for_pickup}
                        </div>
                        <div className="mt-1 text-xs text-emerald-600">
                            Antrean loket aktif
                        </div>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="mb-2 flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Selesai
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="text-2xl font-bold text-slate-900">
                            {stats.completed}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Telah diambil oleh siswa
                        </div>
                    </div>

                    <div className="col-span-2 rounded-xl border border-emerald-200 bg-white p-4 shadow-sm lg:col-span-1">
                        <div className="mb-2 flex items-center justify-between text-slate-500">
                            <span className="text-xs font-medium tracking-wider uppercase">
                                Pendapatan Lunas
                            </span>
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        </div>
                        <div className="text-xl font-bold text-slate-900 sm:text-2xl">
                            <PriceDisplay amount={stats.total_paid_revenue} />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                            Total pesanan terbayar
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col items-stretch justify-between gap-3 md:flex-row md:items-center">
                        {/* Search Input */}
                        <form
                            onSubmit={handleSearch}
                            className="relative flex-1"
                        >
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari no. pesanan, kode antrean (A-001), atau nama/NISN pemesan..."
                                className="w-full rounded-lg border border-slate-200 py-2 pr-4 pl-9 text-sm transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
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
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            >
                                {orderStatusOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
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
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            >
                                {paymentStatusOptions.map((opt) => (
                                    <option key={opt.key} value={opt.key}>
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
                                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            >
                                <option value="all">
                                    Semua Sesi Pengambilan
                                </option>
                                {pickup_sessions.map((sess) => (
                                    <option
                                        key={sess.id}
                                        value={sess.id.toString()}
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
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                                    filters.date === 'today'
                                        ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-700'
                                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900"
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
                    <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                        <h3 className="text-base font-semibold text-slate-900">
                            Tidak ada pesanan ditemukan
                        </h3>
                        <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">
                            {hasActiveFilters
                                ? 'Tidak ada data pesanan yang sesuai dengan filter atau kata kunci pencarian Anda.'
                                : 'Belum ada pesanan yang masuk ke koperasi saat ini.'}
                        </p>
                        {hasActiveFilters && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-4 py-2 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                            >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Hapus Semua Filter</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm text-slate-600">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold tracking-wider text-slate-600 uppercase">
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
                                    <tbody className="divide-y divide-slate-100">
                                        {orders.data.map((order) => (
                                            <tr
                                                key={order.id}
                                                className="transition-colors hover:bg-slate-50/75"
                                            >
                                                {/* Order Number & Timestamp */}
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-0.5">
                                                        <Link
                                                            href={`/cooperative/orders/${order.order_number}`}
                                                            className="block font-mono font-bold text-slate-900 transition-colors hover:text-emerald-700"
                                                        >
                                                            {order.order_number}
                                                        </Link>
                                                        <div className="flex items-center gap-1 text-xs text-slate-400">
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
                                                        <div className="text-[11px] text-slate-500">
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
                                                            <div className="flex items-center gap-1.5 font-medium text-slate-900">
                                                                <UserIcon className="h-3.5 w-3.5 text-slate-400" />
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
                                                                <div className="font-mono text-xs text-slate-500">
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
                                                        <span className="text-xs text-slate-400 italic">
                                                            Tamu / Warga
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Session & Queue */}
                                                <td className="px-4 py-3.5">
                                                    <div className="space-y-1">
                                                        {order.queue_code ? (
                                                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-800">
                                                                <Ticket className="h-3 w-3 text-emerald-600" />
                                                                Antrean{' '}
                                                                {
                                                                    order.queue_code
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="block text-xs text-slate-400 italic">
                                                                Belum ada
                                                                antrean
                                                            </span>
                                                        )}
                                                        {order.pickup_session && (
                                                            <div className="text-xs text-slate-600">
                                                                <span className="font-medium">
                                                                    {
                                                                        order
                                                                            .pickup_session
                                                                            .name
                                                                    }
                                                                </span>
                                                                <div className="text-[11px] text-slate-400">
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
                                                <td className="px-4 py-3.5 text-right">
                                                    <PriceDisplay
                                                        amount={order.total}
                                                        className="text-sm font-bold text-slate-900"
                                                    />
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-3.5 text-right">
                                                    <Link
                                                        href={`/cooperative/orders/${order.order_number}`}
                                                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
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
                                    className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <Link
                                                href={`/cooperative/orders/${order.order_number}`}
                                                className="block font-mono text-sm font-bold text-slate-900 hover:text-emerald-700"
                                            >
                                                {order.order_number}
                                            </Link>
                                            <div className="mt-0.5 text-xs text-slate-500">
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
                                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-800">
                                                <Ticket className="h-3 w-3 text-emerald-600" />
                                                {order.queue_code}
                                            </span>
                                        ) : (
                                            <span className="text-[11px] text-slate-400 italic">
                                                No Queue
                                            </span>
                                        )}
                                    </div>

                                    {/* Customer & Item count */}
                                    <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
                                        <div className="flex items-center gap-1.5 font-medium text-slate-800">
                                            <UserIcon className="h-3.5 w-3.5 text-slate-400" />
                                            <span>
                                                {order.customer?.name ||
                                                    'Warga Sekolah'}
                                            </span>
                                        </div>
                                        <div className="text-slate-500">
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
                                            className="text-sm font-bold text-slate-900"
                                        />
                                    </div>

                                    {/* Action link */}
                                    <div className="border-t border-slate-100 pt-2">
                                        <Link
                                            href={`/cooperative/orders/${order.order_number}`}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100"
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
                            <div className="flex items-center justify-between gap-4 border-t border-slate-200 pt-4">
                                <div className="text-xs text-slate-500">
                                    Halaman{' '}
                                    <span className="font-medium">
                                        {orders.current_page}
                                    </span>{' '}
                                    dari{' '}
                                    <span className="font-medium">
                                        {orders.last_page}
                                    </span>{' '}
                                    ({orders.total} total pesanan)
                                </div>
                                <div className="flex items-center gap-1">
                                    {orders.links.map((link, idx) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={idx}
                                                    dangerouslySetInnerHTML={{
                                                        __html: link.label,
                                                    }}
                                                    className="rounded border border-slate-100 px-3 py-1.5 text-xs text-slate-300"
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
                                                className={`rounded border px-3 py-1.5 text-xs transition-colors ${
                                                    link.active
                                                        ? 'border-emerald-700 bg-emerald-700 font-semibold text-white'
                                                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
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
