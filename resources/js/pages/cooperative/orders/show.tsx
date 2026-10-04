import React from 'react';
import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    Clock,
    CreditCard,
    ExternalLink,
    Package,
    QrCode,
    ShieldCheck,
    ShoppingBag,
    Ticket,
    User as UserIcon,
    XCircle,
} from 'lucide-react';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { PriceDisplay } from '@/components/commerce/PriceDisplay';
import type { CooperativeOrderDetail } from '@/types/cooperative-order';

type Props = {
    order: CooperativeOrderDetail;
};

export default function CooperativeOrdersShow({ order }: Props) {
    const getOrderStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'pending_payment':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-950/40 px-3 py-1 text-xs font-semibold text-amber-400">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {label}
                    </span>
                );
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/20 bg-sky-950/40 px-3 py-1 text-xs font-semibold text-sky-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
                        {label}
                    </span>
                );
            case 'ready_for_pickup':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                        {label}
                    </span>
                );
            case 'completed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#262626] bg-[#1A1A1A] px-3 py-1 text-xs font-semibold text-[#A3A3A3]">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#737373]" />
                        {label}
                    </span>
                );
            case 'cancelled':
            case 'payment_failed':
                return (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/20 bg-rose-950/40 px-3 py-1 text-xs font-semibold text-rose-400">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded-full border border-[#262626] bg-[#1A1A1A] px-2.5 py-1 text-xs font-semibold text-[#A3A3A3]">
                        {label || status}
                    </span>
                );
        }
    };

    const getPaymentStatusBadge = (status: string, label: string) => {
        switch (status) {
            case 'paid':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-950/40 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        {label}
                    </span>
                );
            case 'pending':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-400">
                        <Clock className="h-3.5 w-3.5 text-amber-400" />
                        {label}
                    </span>
                );
            case 'failed':
            case 'cancelled':
            case 'expired':
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-rose-500/20 bg-rose-950/40 px-2.5 py-1 text-xs font-semibold text-rose-400">
                        <XCircle className="h-3.5 w-3.5 text-rose-400" />
                        {label}
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 rounded border border-[#262626] bg-[#1A1A1A] px-2.5 py-1 text-xs font-semibold text-[#A3A3A3]">
                        {label || status}
                    </span>
                );
        }
    };

    return (
        <CooperativeShell activeNav="orders">
            <Head title={`Rincian Pesanan #${order.order_number} — KOPDIG`} />

            <div className="mx-auto max-w-7xl space-y-6 pb-16">
                {/* Back Link & Header */}
                <div className="flex flex-col gap-4 border-b border-[#262626] pb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <Link
                            href="/cooperative/orders"
                            className="mb-1.5 inline-flex items-center gap-2 text-xs font-semibold tracking-wider text-[#A3A3A3] uppercase transition-colors hover:text-[#F5F2EB]"
                        >
                            <ArrowLeft className="h-3.5 w-3.5 text-[#E34A27]" />
                            <span>Kembali ke Daftar Pesanan</span>
                        </Link>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="font-mono text-2xl font-extrabold tracking-tight text-[#F5F2EB] sm:text-3xl">
                                #{order.order_number}
                            </h1>
                            <div className="flex items-center gap-2">
                                {getOrderStatusBadge(
                                    order.order_status,
                                    order.order_status_label,
                                )}
                                {getPaymentStatusBadge(
                                    order.payment_status,
                                    order.payment_status_label,
                                )}
                            </div>
                        </div>
                        <p className="mt-1 flex items-center gap-1.5 text-xs text-[#737373]">
                            <Clock className="h-3.5 w-3.5 text-[#525252]" />
                            <span>
                                Dibuat pada{' '}
                                {new Date(
                                    order.created_at || '',
                                ).toLocaleString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}{' '}
                                WIB
                            </span>
                        </p>
                    </div>

                    {order.order_status === 'ready_for_pickup' && (
                        <div className="flex items-center gap-2">
                            <Link
                                href="/cooperative/pickup"
                                className="inline-flex items-center gap-2 rounded-full bg-[#E34A27] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#D03E1C] active:scale-98"
                            >
                                <QrCode className="h-4 w-4" />
                                <span>Buka Pemindai QR Loket</span>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Top Grid: Customer Info & Fulfillment Queue Status */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* 1. Customer Identity Card */}
                    <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#A3A3A3] uppercase">
                            <UserIcon className="h-4 w-4 text-[#E34A27]" />
                            <span>Identitas Pemesan</span>
                        </div>

                        {order.customer ? (
                            <div className="space-y-2 text-sm">
                                <div>
                                    <div className="text-[11px] text-[#737373]">
                                        Nama Siswa
                                    </div>
                                    <div className="text-base font-semibold text-[#F5F2EB]">
                                        {order.customer.name}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 border-t border-[#262626] pt-2 text-xs">
                                    <div>
                                        <div className="text-[11px] text-[#737373]">
                                            NISN / Identitas
                                        </div>
                                        <div className="font-mono font-medium text-[#F5F2EB]">
                                            {order.customer
                                                .student_identifier || '-'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[11px] text-[#737373]">
                                            Email Akun
                                        </div>
                                        <div
                                            className="truncate font-medium text-[#A3A3A3]"
                                            title={order.customer.email || ''}
                                        >
                                            {order.customer.email || '-'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-xs text-[#525252] italic">
                                Identitas siswa tidak ditemukan.
                            </div>
                        )}
                    </div>

                    {/* 2. Fulfillment & Pickup Queue Card */}
                    <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#A3A3A3] uppercase">
                                <Ticket className="h-4 w-4 text-emerald-400" />
                                <span>Antrean & Sesi Pengambilan</span>
                            </div>
                            {order.queue_code && (
                                <span className="rounded-md border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 font-mono text-xs font-bold text-emerald-400">
                                    {order.queue_code}
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 text-sm">
                            {order.pickup_session ? (
                                <div>
                                    <div className="text-[11px] text-[#737373]">
                                        Sesi Terjadwal
                                    </div>
                                    <div className="font-semibold text-[#F5F2EB]">
                                        {order.pickup_session.name}
                                    </div>
                                    <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#A3A3A3]">
                                        <Calendar className="h-3.5 w-3.5 text-[#525252]" />
                                        <span>
                                            {order.pickup_session.pickup_date} (
                                            {
                                                order.pickup_session
                                                    .formatted_time
                                            }
                                            )
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-[#525252] italic">
                                    Belum ada sesi pengambilan dipilih
                                </div>
                            )}

                            {/* Pickup Log Status if collected */}
                            {order.pickup_log && (
                                <div className="mt-2 space-y-1 rounded-xl border border-emerald-500/20 bg-emerald-950/30 p-3 text-xs text-emerald-400">
                                    <div className="flex items-center gap-1.5 font-bold text-emerald-300">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                        <span>Pesanan Telah Diambil</span>
                                    </div>
                                    <div className="text-emerald-400/90">
                                        Waktu:{' '}
                                        {new Date(
                                            order.pickup_log.verified_at,
                                        ).toLocaleString('id-ID')}
                                    </div>
                                    <div className="text-emerald-400/80">
                                        Verifikator:{' '}
                                        {order.pickup_log.verified_by_name} (
                                        {order.pickup_log.method})
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 3. Payment Status & Method Card */}
                    <div className="space-y-4 rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#A3A3A3] uppercase">
                            <CreditCard className="h-4 w-4 text-[#E34A27]" />
                            <span>Informasi Pembayaran</span>
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-baseline justify-between">
                                <span className="text-[11px] text-[#737373]">
                                    Total Nominal
                                </span>
                                <PriceDisplay
                                    amount={order.total}
                                    className="font-mono text-lg font-bold text-[#F5F2EB]"
                                />
                            </div>

                            {order.payment ? (
                                <div className="space-y-1.5 border-t border-[#262626] pt-2 text-xs">
                                    <div className="flex items-center justify-between text-[#A3A3A3]">
                                        <span>Gateway / Metode:</span>
                                        <span className="font-mono font-semibold text-[#F5F2EB] uppercase">
                                            {order.payment.payment_type ||
                                                order.payment.provider}
                                        </span>
                                    </div>
                                    {order.payment.provider_transaction_id && (
                                        <div className="flex items-center justify-between text-[#A3A3A3]">
                                            <span>ID Transaksi:</span>
                                            <span
                                                className="max-w-[140px] truncate font-mono text-[11px] text-[#737373]"
                                                title={
                                                    order.payment
                                                        .provider_transaction_id
                                                }
                                            >
                                                {
                                                    order.payment
                                                        .provider_transaction_id
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {order.payment.paid_at && (
                                        <div className="flex items-center justify-between text-[#A3A3A3]">
                                            <span>Waktu Lunas:</span>
                                            <span className="text-[#F5F2EB]">
                                                {new Date(
                                                    order.payment.paid_at,
                                                ).toLocaleString('id-ID')}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="pt-1 text-xs text-[#525252] italic">
                                    Belum ada transaksi pembayaran tercatat
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Historical Snapshot Line Items Table */}
                <div className="space-y-4 overflow-hidden rounded-2xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-[#262626] pb-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#A3A3A3] uppercase">
                                <ShoppingBag className="h-4 w-4 text-[#E34A27]" />
                                <span>
                                    Rincian Barang (Historical Order Snapshot)
                                </span>
                            </div>
                            <p className="mt-0.5 text-xs text-[#737373]">
                                Data harga dasar, margin, dan nama barang
                                dicatat permanen saat transaksi dilakukan dan
                                tidak terpengaruh perubahan katalog terkini.
                            </p>
                        </div>
                        <div className="text-xs text-[#737373]">
                            Total {order.items.length} jenis item
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs text-[#A3A3A3]">
                            <thead className="border-b border-[#262626] bg-[#161616] text-[11px] font-semibold tracking-wider text-[#737373] uppercase">
                                <tr>
                                    <th className="px-4 py-3">
                                        Nama Produk (Snapshot)
                                    </th>
                                    <th className="px-4 py-3">
                                        Sumber / Pemilik
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Harga Dasar
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Margin Koperasi
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Harga Satuan
                                    </th>
                                    <th className="px-4 py-3 text-center">
                                        Jumlah
                                    </th>
                                    <th className="px-4 py-3 text-right">
                                        Subtotal
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#262626]">
                                {order.items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition-colors hover:bg-[#161616]"
                                    >
                                        {/* Product Name */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                {item.product?.image_path ? (
                                                    <img
                                                        src={`/storage/${item.product.image_path}`}
                                                        alt={item.product_name}
                                                        className="h-10 w-10 shrink-0 rounded-lg border border-[#262626] object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#1A1A1A] text-[#525252]">
                                                        <Package className="h-5 w-5" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="font-medium text-[#F5F2EB]">
                                                        {item.product_name}
                                                    </div>
                                                    {item.product && (
                                                        <Link
                                                            href={`/cooperative/products/${item.product.slug}`}
                                                            className="inline-flex items-center gap-1 text-[11px] text-[#E34A27] hover:underline"
                                                        >
                                                            <span>
                                                                Lihat di Katalog
                                                            </span>
                                                            <ExternalLink className="h-2.5 w-2.5" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </td>

                                        {/* Source / Seller */}
                                        <td className="px-4 py-3 text-xs">
                                            {item.seller ? (
                                                <div className="space-y-0.5">
                                                    <span className="rounded border border-amber-500/20 bg-amber-950/40 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                                                        Titipan Siswa
                                                    </span>
                                                    <div className="mt-1 text-xs text-[#A3A3A3]">
                                                        {item.seller.name}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="rounded border border-emerald-500/20 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                                                    Koperasi
                                                </span>
                                            )}
                                        </td>

                                        {/* Base Price */}
                                        <td className="px-4 py-3 text-right">
                                            <PriceDisplay
                                                amount={item.base_price}
                                                className="font-mono text-xs text-[#737373]"
                                            />
                                        </td>

                                        {/* Cooperative Margin */}
                                        <td className="px-4 py-3 text-right">
                                            <PriceDisplay
                                                amount={item.cooperative_margin}
                                                className="font-mono text-xs text-emerald-400"
                                            />
                                        </td>

                                        {/* Unit Price */}
                                        <td className="px-4 py-3 text-right font-mono font-medium text-[#F5F2EB]">
                                            <PriceDisplay
                                                amount={item.unit_price}
                                            />
                                        </td>

                                        {/* Quantity */}
                                        <td className="px-4 py-3 text-center font-mono font-bold text-[#F5F2EB]">
                                            {item.quantity}
                                        </td>

                                        {/* Subtotal */}
                                        <td className="px-4 py-3 text-right font-mono font-bold text-[#F5F2EB]">
                                            <PriceDisplay
                                                amount={item.subtotal}
                                            />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary Breakdown */}
                    <div className="flex justify-end border-t border-[#262626] pt-4">
                        <div className="w-full space-y-2 text-xs sm:w-80">
                            <div className="flex items-center justify-between text-[#737373]">
                                <span>Subtotal Belanja:</span>
                                <PriceDisplay
                                    amount={order.subtotal}
                                    className="font-mono font-medium text-[#F5F2EB]"
                                />
                            </div>
                            <div className="flex items-center justify-between text-[#737373]">
                                <span>Total Margin Koperasi:</span>
                                <PriceDisplay
                                    amount={order.cooperative_margin_total}
                                    className="font-mono font-medium text-emerald-400"
                                />
                            </div>
                            <div className="flex items-center justify-between border-t border-[#262626] pt-2 text-sm font-bold text-[#F5F2EB]">
                                <span>Total Tagihan:</span>
                                <PriceDisplay
                                    amount={order.total}
                                    className="font-mono text-base font-extrabold text-[#F5F2EB]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Operational Safety & Audit Notice */}
                <div className="flex items-start gap-3 rounded-2xl border border-[#262626] bg-[#121212] p-4 text-xs text-[#737373]">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#E34A27]" />
                    <div>
                        <span className="mb-0.5 block font-semibold text-[#F5F2EB]">
                            Integritas Operasional & Verifikasi Loket Koperasi
                        </span>
                        Status pesanan, alokasi antrean, dan validasi pembayaran
                        dikendalikan secara otomatis oleh webhook gateway dan
                        modul verifikasi QR loket KOPDIG. Modul pesanan ini
                        beroperasi secara observasional untuk mencegah
                        kecurangan dan menjaga kepatuhan pembukuan koperasi
                        sekolah.
                    </div>
                </div>
            </div>
        </CooperativeShell>
    );
}
