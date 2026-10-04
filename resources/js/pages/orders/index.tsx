import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock,
    ShoppingBag,
    ArrowRight,
    Store,
    Calendar,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { PageContainer } from '@/components/layout/PageContainer';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
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
        <AppShell hideHeader activeTab="orders">
            <Head title="Pesanan Saya" />

            <PageContainer className="pb-24">
                {/* Header Navigation */}
                <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => safeNavigateBack('/explore')}
                            className="hover:bg-surface-subtle flex size-9 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-ink shadow-2xs transition-colors active:scale-95"
                            aria-label="Kembali ke halaman sebelumnya"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                        <div>
                            <h1 className="font-heading text-lg font-bold tracking-tight text-ink sm:text-xl">
                                Riwayat Pesanan
                            </h1>
                            <p className="text-xs text-muted">
                                Pantau status transaksi dan jadwal pengambilan
                                Anda
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/explore"
                        className="hover:bg-surface-subtle flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink shadow-2xs"
                    >
                        <Store className="size-3.5 text-primary" />
                        <span>Katalog</span>
                    </Link>
                </div>

                {/* Orders Content */}
                {orders.data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-surface px-6 py-14 text-center shadow-xs">
                        <div className="flex size-16 items-center justify-center rounded-full bg-[#FAF9F5] p-3 text-primary shadow-inner">
                            <ShoppingBag className="size-8 stroke-[1.25] text-primary/40" />
                        </div>

                        <h2 className="mt-4 font-heading text-base font-bold text-ink sm:text-lg">
                            Belum Ada Pesanan
                        </h2>

                        <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-muted">
                            Anda belum pernah melakukan pemesanan di KOPDIG.
                            Silakan pilih produk dari katalog koperasi sekolah.
                        </p>

                        <div className="mt-6">
                            <Link
                                href="/explore"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-2.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-primary-hover active:scale-98"
                            >
                                <Store className="size-4" />
                                <span>Mulai Belanja</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.data.map((order: OrderData) => (
                            <Link
                                key={order.id}
                                href={`/orders/${order.id}`}
                                className="group block rounded-2xl border border-border bg-surface p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-ink sm:text-sm">
                                                {order.order_number}
                                            </span>
                                        </div>
                                        <p className="mt-0.5 text-[11px] text-muted">
                                            {order.formatted_created_at ||
                                                order.created_at}
                                        </p>
                                    </div>

                                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                                        <Clock className="size-3" />
                                        <span>{order.order_status_label}</span>
                                    </span>
                                </div>

                                <div className="mt-3 flex items-center justify-between text-xs">
                                    <div className="space-y-1">
                                        {order.pickup_session && (
                                            <div className="flex items-center gap-1.5 text-muted">
                                                <Calendar className="size-3.5 text-primary" />
                                                <span>
                                                    {order.pickup_session.name}{' '}
                                                    (
                                                    {order.pickup_session
                                                        .formatted_time ||
                                                        order.pickup_session
                                                            .starts_at}
                                                    )
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-[11px] text-muted">
                                            {order.items_count || 1} jenis
                                            produk ({order.total_quantity || 1}{' '}
                                            unit)
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right">
                                            <span className="block text-[10px] text-muted">
                                                Total
                                            </span>
                                            <PriceDisplay
                                                amount={order.total}
                                                size="sm"
                                            />
                                        </div>
                                        <ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                                    </div>
                                </div>
                            </Link>
                        ))}

                        {/* Pagination Links */}
                        {orders.last_page > 1 && (
                            <div className="flex items-center justify-center gap-1 pt-4">
                                {orders.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg px-3 text-xs font-semibold transition-colors ${
                                            link.active
                                                ? 'bg-primary text-white'
                                                : link.url
                                                  ? 'hover:bg-surface-subtle border border-border bg-surface text-ink'
                                                  : 'cursor-not-allowed text-muted/50'
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
            </PageContainer>
        </AppShell>
    );
}
