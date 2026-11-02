import React, { useMemo } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    BarChart3,
    Layers,
    TrendingUp,
} from 'lucide-react';
import { formatRupiah } from '@/components/commerce/PriceDisplay';
import type { ReportTransaction } from '@/pages/cooperative/reports/index';

interface ReportChartsProps {
    transactions: ReportTransaction[];
    isLoading?: boolean;
    startDate?: string;
    endDate?: string;
}

// Fallback palette for dark mode
const PALETTE = [
    '#EA580C', // KOPDIG Signature Orange
    '#10B981', // Emerald Green
    '#0284C7', // Sky / Blue
    '#8B5CF6', // Violet / Purple
    '#F59E0B', // Amber
    '#EC4899', // Pink
    '#06B6D4', // Cyan
];

// Contextual category color mapping matching KOPDIG theme identity
const getCategoryColor = (categoryName: string, index: number): string => {
    const lower = categoryName.toLowerCase();
    if (lower.includes('jajan') || lower.includes('makanan') || lower.includes('kuliner') || lower.includes('snack')) {
        return '#EA580C'; // Oranye untuk Jajanan
    }
    if (lower.includes('minum') || lower.includes('teh') || lower.includes('kopi') || lower.includes('jus')) {
        return '#10B981'; // Hijau untuk Minuman
    }
    if (lower.includes('atk') || lower.includes('buku') || lower.includes('tulis') || lower.includes('kertas')) {
        return '#0284C7'; // Biru untuk ATK & Buku
    }
    if (lower.includes('kriya') || lower.includes('rajut') || lower.includes('kerajinan') || lower.includes('handmade')) {
        return '#8B5CF6'; // Ungu untuk Kriya & Kerajinan
    }
    if (lower.includes('atribut') || lower.includes('seragam') || lower.includes('dasi') || lower.includes('topi')) {
        return '#F59E0B'; // Kuning / Amber untuk Atribut Sekolah
    }
    return PALETTE[index % PALETTE.length];
};

// Helper for Indonesian Rupiah formatting
const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0,
    }).format(val);
};

export const ReportCharts: React.FC<ReportChartsProps> = ({
    transactions,
    isLoading = false,
}) => {
    // 1. Process Trend Data (Grouped by date or time slot, sorted chronologically)
    const trendData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const uniqueDates = new Set(transactions.map((t) => t.transaction_date.split(' ')[0]));
        const isSingleDay = uniqueDates.size <= 1;

        const dateMap = new Map<
            string,
            {
                dateKey: string;
                label: string;
                fullDate: string;
                revenue: number;
                orders: Set<number>;
                volume: number;
            }
        >();

        transactions.forEach((t) => {
            const rawDateTime = t.transaction_date; // 'YYYY-MM-DD HH:mm'
            const [datePart, timePart] = rawDateTime.split(' ');
            const hourPart = timePart ? timePart.split(':')[0] + ':00' : '00:00';

            const key = isSingleDay ? hourPart : datePart;

            let label = key;
            let fullDate = rawDateTime;
            if (!isSingleDay && datePart) {
                const [y, m, d] = datePart.split('-');
                const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
                    'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
                ];
                label = `${d} ${monthNames[parseInt(m, 10) - 1] || m}`;
                fullDate = `${d} ${monthNames[parseInt(m, 10) - 1] || m} ${y}`;
            }

            const existing = dateMap.get(key) || {
                dateKey: key,
                label,
                fullDate,
                revenue: 0,
                orders: new Set<number>(),
                volume: 0,
            };

            existing.revenue += t.total_nominal;
            existing.orders.add(t.order_id);
            existing.volume += t.quantity;

            dateMap.set(key, existing);
        });

        const sorted = Array.from(dateMap.values()).sort((a, b) =>
            a.dateKey.localeCompare(b.dateKey)
        );

        return sorted.map((item) => ({
            key: item.dateKey,
            label: item.label,
            fullDate: item.fullDate,
            revenue: item.revenue,
            orderCount: item.orders.size,
            volume: item.volume,
        }));
    }, [transactions]);

    // 2. Process Category Distribution Data (Sorted by revenue descending)
    const categoryData = useMemo(() => {
        if (!transactions || transactions.length === 0) return [];

        const catMap = new Map<
            string,
            { name: string; revenue: number; quantity: number }
        >();

        let totalRev = 0;

        transactions.forEach((t) => {
            const name = t.category_name || 'Umum';
            const existing = catMap.get(name) || {
                name,
                revenue: 0,
                quantity: 0,
            };

            existing.revenue += t.total_nominal;
            existing.quantity += t.quantity;
            totalRev += t.total_nominal;

            catMap.set(name, existing);
        });

        // Urutkan kategori berdasarkan omzet terbesar (descending)
        const sorted = Array.from(catMap.values()).sort((a, b) => b.revenue - a.revenue);

        return sorted.map((cat, idx) => ({
            name: cat.name,
            value: cat.revenue,
            quantity: cat.quantity,
            percentage: totalRev > 0 ? ((cat.revenue / totalRev) * 100).toFixed(1) : '0',
            color: getCategoryColor(cat.name, idx),
        }));
    }, [transactions]);

    // Total revenue for card headers
    const totalRevenue = useMemo(() => {
        return transactions.reduce((sum, t) => sum + t.total_nominal, 0);
    }, [transactions]);

    // Loading State Skeleton
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="h-80 animate-pulse rounded-2xl border border-neutral-800 bg-[#141414] p-6" />
                <div className="h-80 animate-pulse rounded-2xl border border-neutral-800 bg-[#141414] p-6" />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ========================================================================= */}
            {/* 1. TREN PENJUALAN & PERPUTARAN DANA (DIAGRAM BATANG / VERTICAL BAR CHART) */}
            {/* ========================================================================= */}
            <div className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-[#141414] p-6 shadow-xl transition-all duration-200 hover:border-neutral-700">
                {/* Header Card */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400">
                                <TrendingUp className="size-4.5" />
                            </div>
                            <div>
                                <h3 className="font-heading text-sm font-bold text-[#F5F2EB]">
                                    Tren Penjualan & Perputaran Dana
                                </h3>
                                <p className="text-[11px] text-neutral-400">
                                    Diagram batang nominal omzet per periode
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="font-mono text-xs font-bold text-orange-400">
                                {formatRupiah(totalRevenue)}
                            </span>
                            <p className="text-[10px] text-neutral-500">Total Periode Ini</p>
                        </div>
                    </div>
                </div>

                {/* Bar Chart Canvas / Empty State */}
                <div className="mt-6 h-64 w-full">
                    {trendData.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800/80 bg-neutral-900/30 p-4 text-center">
                            <BarChart3 className="size-8 text-neutral-600" />
                            <p className="mt-2 text-xs font-semibold text-neutral-400">
                                Belum Ada Data Tren Penjualan
                            </p>
                            <p className="mt-0.5 text-[11px] text-neutral-600">
                                Tidak ada transaksi yang tercatat pada rentang filter aktif.
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={trendData}
                                margin={{ top: 12, right: 12, left: -8, bottom: 0 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#27272A"
                                    vertical={false}
                                />

                                <XAxis
                                    dataKey="label"
                                    stroke="#71717A"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={{ stroke: '#27272A' }}
                                    tickMargin={8}
                                />

                                <YAxis
                                    stroke="#71717A"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={{ stroke: '#27272A' }}
                                    tickFormatter={(v) => {
                                        if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                                        if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                                        return String(v);
                                    }}
                                    tickMargin={4}
                                />

                                <Tooltip
                                    cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload || !payload.length) return null;
                                        const data = payload[0].payload;
                                        return (
                                            <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 p-3 shadow-xl shadow-black/80 backdrop-blur-sm">
                                                <p className="font-mono text-[11px] font-semibold text-neutral-400">
                                                    {data.fullDate || data.label}
                                                </p>
                                                <div className="mt-2 space-y-1">
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-xs text-neutral-300">
                                                            Omzet:
                                                        </span>
                                                        <span className="font-mono text-xs font-bold text-orange-400">
                                                            {formatCurrency(data.revenue)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-xs text-neutral-400">
                                                            Pesanan:
                                                        </span>
                                                        <span className="font-mono text-xs font-medium text-neutral-200">
                                                            {data.orderCount} transaksi
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <span className="text-xs text-neutral-400">
                                                            Volume Produk:
                                                        </span>
                                                        <span className="font-mono text-xs font-medium text-amber-400">
                                                            {data.volume} pcs
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />

                                <Bar
                                    dataKey="revenue"
                                    fill="#EA580C"
                                    radius={[6, 6, 0, 0]}
                                    maxBarSize={48}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Footer Subtext */}
                <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-[11px] text-neutral-500">
                    <span>Diagram batang periodik teragregasi</span>
                    <span className="font-mono text-neutral-400">
                        {trendData.length} Batang Periode
                    </span>
                </div>
            </div>

            {/* ===================================================================================== */}
            {/* 2. DISTRIBUSI PENJUALAN PER KATEGORI (DIAGRAM BATANG HORIZONTAL / HORIZONTAL BAR CHART) */}
            {/* ===================================================================================== */}
            <div className="flex flex-col justify-between rounded-2xl border border-neutral-800 bg-[#141414] p-6 shadow-xl transition-all duration-200 hover:border-neutral-700">
                {/* Header Card */}
                <div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                                <Layers className="size-4.5" />
                            </div>
                            <div>
                                <h3 className="font-heading text-sm font-bold text-[#F5F2EB]">
                                    Distribusi Penjualan per Kategori
                                </h3>
                                <p className="text-[11px] text-neutral-400">
                                    Peringkat omzet terbesar dan persentase kontribusi
                                </p>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="font-mono text-xs font-bold text-emerald-400">
                                {categoryData.length} Kategori
                            </span>
                            <p className="text-[10px] text-neutral-500">Urut Omzet Terbesar</p>
                        </div>
                    </div>
                </div>

                {/* Horizontal Bar Chart Canvas & Breakdown List */}
                <div className="mt-6 flex flex-col gap-4">
                    {categoryData.length === 0 ? (
                        <div className="flex h-64 w-full flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800/80 bg-neutral-900/30 p-4 text-center">
                            <BarChart3 className="size-8 text-neutral-600" />
                            <p className="mt-2 text-xs font-semibold text-neutral-400">
                                Belum Ada Data Kategori
                            </p>
                            <p className="mt-0.5 text-[11px] text-neutral-600">
                                Tidak ada transaksi yang dapat dikelompokkan.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Horizontal Bar Chart */}
                            <div className="h-44 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        layout="vertical"
                                        data={categoryData}
                                        margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            stroke="#27272A"
                                            horizontal={false}
                                        />

                                        <XAxis
                                            type="number"
                                            stroke="#71717A"
                                            fontSize={10}
                                            tickLine={false}
                                            axisLine={{ stroke: '#27272A' }}
                                            tickFormatter={(v) => {
                                                if (v >= 1000000) return `${(v / 1000000).toFixed(1)}jt`;
                                                if (v >= 1000) return `${(v / 1000).toFixed(0)}k`;
                                                return String(v);
                                            }}
                                        />

                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            stroke="#A3A3A3"
                                            fontSize={11}
                                            tickLine={false}
                                            axisLine={{ stroke: '#27272A' }}
                                            width={95}
                                            tickMargin={4}
                                        />

                                        <Tooltip
                                            cursor={{ fill: 'rgba(255, 255, 255, 0.04)' }}
                                            content={({ active, payload }) => {
                                                if (!active || !payload || !payload.length) return null;
                                                const cat = payload[0].payload;
                                                return (
                                                    <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 p-3 shadow-xl shadow-black/80 backdrop-blur-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="size-2.5 rounded-full"
                                                                style={{ backgroundColor: cat.color }}
                                                            />
                                                            <p className="font-heading text-xs font-bold text-neutral-200">
                                                                {cat.name}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 space-y-1">
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-xs text-neutral-400">
                                                                    Total Omzet:
                                                                </span>
                                                                <span className="font-mono text-xs font-bold text-orange-400">
                                                                    {formatCurrency(cat.value)}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-xs text-neutral-400">
                                                                    Kontribusi:
                                                                </span>
                                                                <span className="font-mono text-xs font-semibold text-emerald-400">
                                                                    {cat.percentage}%
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-4">
                                                                <span className="text-xs text-neutral-400">
                                                                    Volume Produk:
                                                                </span>
                                                                <span className="font-mono text-xs text-neutral-300">
                                                                    {cat.quantity} pcs
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            }}
                                        />

                                        <Bar
                                            dataKey="value"
                                            radius={[0, 6, 6, 0]}
                                            maxBarSize={22}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cat-bar-${entry.name}-${index}`}
                                                    fill={entry.color}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Category Cards Breakdown List */}
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {categoryData.map((cat) => (
                                    <div
                                        key={cat.name}
                                        className="flex items-center justify-between rounded-lg border border-neutral-800/70 bg-neutral-900/50 px-3 py-2 text-xs transition-colors hover:border-neutral-700"
                                    >
                                        <div className="flex items-center gap-2 truncate">
                                            <span
                                                className="size-2.5 shrink-0 rounded-full"
                                                style={{ backgroundColor: cat.color }}
                                            />
                                            <span className="truncate font-medium text-neutral-200">
                                                {cat.name}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-2 font-mono text-[11px]">
                                            <span className="font-bold text-neutral-300">
                                                {formatRupiah(cat.value)}
                                            </span>
                                            <span className="rounded bg-neutral-800/80 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                                                {cat.percentage}%
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Footer Subtext */}
                <div className="mt-4 flex items-center justify-between border-t border-neutral-800/80 pt-3 text-[11px] text-neutral-500">
                    <span>Diurutkan otomatis dari omzet terbesar</span>
                    <span className="font-mono text-emerald-400">
                        {categoryData.length} Kategori Terdata
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ReportCharts;
