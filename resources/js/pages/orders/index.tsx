import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    ShoppingBag,
    ArrowRight,
    Calendar,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import { safeNavigateBack } from '@/lib/navigation';
import type { Auth } from '@/types';
import type { OrderData } from '@/types/order';

interface PaginatedOrders {
    data: OrderData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface OrdersIndexProps {
    auth: Auth;
    orders: PaginatedOrders;
    [key: string]: unknown;
}

export default function OrdersIndex() {
    const { orders } = usePage<OrdersIndexProps>().props;

    return (
        <div className="relative min-h-screen w-full overflow-x-hidden bg-[#0A0A0A] font-sans text-[#F5F2EB] antialiased selection:bg-[#E34A27] selection:text-white">
            <Head title="Riwayat Pesanan — KOPDIG" />

            {/* ATMOSPHERIC BACKGROUND (Landing Page Editorial System) */}
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(227,74,39,0.15),transparent)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(to_right,#26262612_1px,transparent_1px),linear-gradient(to_bottom,#26262612_1px,transparent_1px)] bg-[size:40px_40px]"
            />

            {/* 1. TOP TRANSACTIONAL HEADER */}
            <header className="sticky top-0 z-40 w-full border-b border-[#262626] bg-[#0A0A0A]/90 backdrop-blur-md">
                <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4 sm:h-16 sm:px-6">
                    {/* Left: Back Navigation */}
                    <button
                        type="button"
                        onClick={() => safeNavigateBack('/explore')}
                        className="group inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-all hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                        aria-label="Kembali ke katalog"
                    >
                        <ArrowLeft className="size-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span>Katalog</span>
                    </button>

                    {/* Center: Brand Mark (Identical to Landing Page) */}
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
                                Riwayat Pesanan
                            </span>
                        </div>
                    </Link>

                    {/* Right: Cart Link */}
                    <Link
                        href="/cart"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1.5 text-xs font-medium text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB]"
                    >
                        <ShoppingBag className="size-3.5 text-[#E34A27]" />
                        <span className="hidden sm:inline">Keranjang</span>
                    </Link>
                </div>
            </header>

            {/* 2. MAIN ORDERS CONTENT */}
            <main className="relative z-10 mx-auto max-w-4xl px-4 py-8 pb-32 sm:px-6 sm:py-10">
                {/* Heading Banner */}
                <div className="mb-6 border-b border-[#262626] pb-5">
                    <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-[#737373] uppercase">
                        <span>Pasar Sekolah</span>
                        <span>/</span>
                        <span className="text-[#E34A27]">Pesanan Saya</span>
                    </div>
                    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="font-heading text-2xl font-black tracking-tight text-[#F5F2EB] sm:text-3xl">
                                Riwayat Pesanan
                            </h1>
                            <p className="mt-1 text-xs text-[#A3A3A3] sm:text-sm">
                                Pantau status pembayaran tunai dan jadwal
                                pengambilan barang Anda di loket koperasi.
                            </p>
                        </div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-[#262626] bg-[#141414] px-3.5 py-1 font-mono text-xs text-[#A3A3A3]">
                            <span>{orders.total} Total Transaksi</span>
                        </div>
                    </div>
                </div>

                {/* Orders Content */}
                {orders.data.length === 0 ? (
                    <div className="mx-auto my-8 max-w-lg rounded-3xl border border-[#262626] bg-[#141414] p-8 text-center shadow-2xl sm:p-12">
                        <div className="mx-auto flex size-20 items-center justify-center rounded-full border border-[#262626] bg-[#1A1A1A] text-[#737373]">
                            <ShoppingBag className="size-9 stroke-[1.5] text-[#737373]" />
                        </div>

                        <h2 className="mt-6 font-heading text-xl font-bold text-[#F5F2EB]">
                            Belum Ada Pesanan
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">
                            Anda belum pernah melakukan pemesanan di KOPDIG.
                            Temukan jajanan, ATK, dan karya titipan siswa di
                            katalog pasar sekolah.
                        </p>

                        <div className="mt-8 flex justify-center">
                            <Link
                                href="/explore"
                                className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#E34A27] px-6 py-3 font-heading text-xs font-bold text-white shadow-lg shadow-[#E34A27]/25 transition-all hover:bg-[#ff5c38] active:scale-98 sm:text-sm"
                            >
                                <span>Mulai Belanja</span>
                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order: OrderData) => {
                            const isReady =
                                order.order_status === 'ready_for_pickup';
                            const isCompleted =
                                order.order_status === 'completed';
                            const isCancelled =
                                order.order_status === 'cancelled';
                            const isPending =
                                order.order_status === 'pending_payment';

                            return (
                                <Link
                                    key={order.id}
                                    href={`/orders/${order.id}`}
                                    className="group block rounded-3xl border border-[#262626] bg-[#141414] p-5 shadow-lg transition-all duration-200 hover:border-[#383838] hover:bg-[#1A1A1A]/80 hover:shadow-xl sm:p-6"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262626] pb-4">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm font-bold text-[#F5F2EB] transition-colors group-hover:text-[#E34A27] sm:text-base">
                                                    {order.order_number}
                                                </span>
                                            </div>
                                            <p className="mt-0.5 font-mono text-[11px] text-[#737373]">
                                                {order.formatted_created_at ||
                                                    order.created_at}
                                            </p>
                                        </div>

                                        {/* Status Badge */}
                                        {isCompleted ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 font-mono text-xs font-semibold text-emerald-400">
                                                <CheckCircle2 className="size-3.5" />
                                                <span>Selesai Diambil</span>
                                            </span>
                                        ) : isReady ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-950/50 px-3 py-1 font-mono text-xs font-semibold text-emerald-300">
                                                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                                                <span>Siap Diambil</span>
                                            </span>
                                        ) : isCancelled ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-950/40 px-3 py-1 font-mono text-xs font-semibold text-rose-400">
                                                <XCircle className="size-3.5" />
                                                <span>Dibatalkan</span>
                                            </span>
                                        ) : isPending ? (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-950/50 px-3 py-1 font-mono text-xs font-semibold text-amber-300">
                                                <Clock className="size-3.5 text-amber-400" />
                                                <span>Menunggu Pembayaran</span>
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#1A1A1A] px-3 py-1 font-mono text-xs font-semibold text-[#A3A3A3]">
                                                <span>
                                                    {order.order_status_label}
                                                </span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                                        <div className="space-y-1.5">
                                            {order.pickup_session && (
                                                <div className="flex items-center gap-2 text-[#A3A3A3]">
                                                    <Calendar className="size-3.5 text-[#E34A27]" />
                                                    <span>
                                                        {
                                                            order.pickup_session
                                                                .name
                                                        }{' '}
                                                        (
                                                        {order.pickup_session
                                                            .formatted_time ||
                                                            order.pickup_session
                                                                .starts_at}
                                                        )
                                                    </span>
                                                </div>
                                            )}
                                            <p className="font-mono text-[11px] text-[#737373]">
                                                {order.items_count || 1} jenis
                                                barang (
                                                {order.total_quantity || 1}{' '}
                                                unit)
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <span className="block font-mono text-[10px] text-[#737373] uppercase">
                                                    Total Bayar
                                                </span>
                                                <span className="font-heading text-base font-black text-[#E34A27] sm:text-lg">
                                                    {formatRupiah(order.total)}
                                                </span>
                                            </div>
                                            <div className="flex size-8 items-center justify-center rounded-full border border-[#262626] bg-[#1A1A1A] text-[#737373] transition-all group-hover:border-[#E34A27]/40 group-hover:bg-[#E34A27]/10 group-hover:text-[#E34A27]">
                                                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}

                        {/* Pagination Links */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1.5 pt-6">
                                {orders.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`flex min-h-[38px] min-w-[38px] items-center justify-center rounded-xl px-3 font-mono text-xs font-semibold transition-all ${
                                            link.active
                                                ? 'bg-[#E34A27] text-white shadow-md shadow-[#E34A27]/25'
                                                : link.url
                                                  ? 'border border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                                  : 'cursor-not-allowed text-[#737373]/40'
                                        }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
