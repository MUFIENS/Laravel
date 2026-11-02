import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Calendar,
    CalendarDays,
    CalendarRange,
    CheckCircle2,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    FileX2,
    Filter,
    Loader2,
    Package,
    RotateCcw,
    Search,
    ShoppingBag,
    Tag,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CooperativeShell } from '@/components/cooperative/CooperativeShell';
import { ReportCharts } from '@/components/cooperative/reports/ReportCharts';
import { formatRupiah } from '@/components/commerce/PriceDisplay';

export interface ReportTransaction {
    id: number;
    no: number;
    order_id: number;
    order_number: string;
    transaction_date: string;
    transaction_date_formatted: string;
    transaction_date_short: string;
    product_name: string;
    category_name: string;
    source_type: 'student' | 'cooperative';
    seller_name: string | null;
    buyer_name: string;
    quantity: number;
    unit_price: number;
    total_nominal: number;
    status_raw: string;
    status: string;
    payment_status: string;
}

interface ReportSummary {
    total_transactions: number;
    total_items: number;
    total_revenue: number;
    total_records: number;
}

interface ReportFilters {
    start_date: string;
    end_date: string;
    preset: string;
    status: string;
}

interface Props {
    transactions: ReportTransaction[];
    summary: ReportSummary;
    filters: ReportFilters;
    generated_at: string;
}

// Helpers for timezone-safe local date strings (YYYY-MM-DD)
const toLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayStr = (): string => toLocalDateString(new Date());

const getLast7DaysStr = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return toLocalDateString(d);
};

const getStartOfMonthStr = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export default function CooperativeReportsIndex({
    transactions,
    summary,
    filters,
    generated_at,
}: Props) {
    const [startDate, setStartDate] = useState(filters.start_date || getStartOfMonthStr());
    const [endDate, setEndDate] = useState(filters.end_date || getTodayStr());
    const [activePreset, setActivePreset] = useState(filters.preset || 'this_month');
    const [searchQuery, setSearchQuery] = useState('');
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);

    // Client-side quick filter for instantaneous responsiveness if user searches in table
    const displayedTransactions = useMemo(() => {
        if (!searchQuery.trim()) return transactions;
        const q = searchQuery.toLowerCase().trim();
        return transactions.filter(
            (t) =>
                t.order_number.toLowerCase().includes(q) ||
                t.product_name.toLowerCase().includes(q) ||
                t.category_name.toLowerCase().includes(q) ||
                t.status.toLowerCase().includes(q) ||
                (t.seller_name && t.seller_name.toLowerCase().includes(q))
        );
    }, [transactions, searchQuery]);

    // Active summary based on displayed rows
    const displayedSummary = useMemo(() => {
        const uniqueOrders = new Set(displayedTransactions.map((t) => t.order_id)).size;
        const totalItems = displayedTransactions.reduce((acc, t) => acc + t.quantity, 0);
        const totalRev = displayedTransactions.reduce((acc, t) => acc + t.total_nominal, 0);
        return {
            total_orders: uniqueOrders,
            total_items: totalItems,
            total_revenue: totalRev,
            count: displayedTransactions.length,
        };
    }, [displayedTransactions]);

    // Trigger Inertia visit for filter updates
    const applyFilters = (start: string, end: string, preset: string) => {
        if (start && end && start > end) {
            toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
            return;
        }

        router.get(
            '/cooperative/reports',
            {
                start_date: start,
                end_date: end,
                preset: preset,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    // Preset button click handler
    const handlePresetSelect = (presetKey: string) => {
        setActivePreset(presetKey);
        let start = '';
        let end = getTodayStr();

        if (presetKey === 'today') {
            start = getTodayStr();
            end = getTodayStr();
        } else if (presetKey === 'last_7_days') {
            start = getLast7DaysStr();
            end = getTodayStr();
        } else if (presetKey === 'this_month') {
            start = getStartOfMonthStr();
            end = getTodayStr();
        } else if (presetKey === 'custom') {
            return;
        }

        setStartDate(start);
        setEndDate(end);
        applyFilters(start, end, presetKey);
    };

    // Manual form submit
    const handleManualFilterSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) {
            toast.error('Mohon isi tanggal mulai dan tanggal akhir.');
            return;
        }
        if (startDate > endDate) {
            toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
            return;
        }
        applyFilters(startDate, endDate, 'custom');
    };

    // Reset filter
    const handleReset = () => {
        const start = getStartOfMonthStr();
        const end = getTodayStr();
        setStartDate(start);
        setEndDate(end);
        setActivePreset('this_month');
        setSearchQuery('');
        applyFilters(start, end, 'this_month');
    };

    // Export to Excel (.xlsx)
    const exportToExcel = async () => {
        if (displayedTransactions.length === 0) {
            toast.error('Tidak ada data transaksi untuk diekspor pada rentang tanggal yang dipilih.');
            return;
        }

        setIsExportingExcel(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 200));

            const startLabel = startDate || 'Awal';
            const endLabel = endDate || 'Akhir';
            const printDate = new Date().toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            // 1. Title and metadata rows
            const sheetData: (string | number)[][] = [
                ['KOPDIG - SMKN 1 CIOMAS'],
                ['LAPORAN TRANSAKSI & PEMBUKUAN KOPERASI'],
                [`Periode: ${startLabel} s/d ${endLabel}`],
                [`Tanggal Cetak: ${printDate} WIB`],
                [],
                [
                    'No',
                    'Tanggal Transaksi',
                    'ID/Kode Pesanan',
                    'Nama Produk/Titipan',
                    'Kategori',
                    'Jumlah (Qty)',
                    'Total Nominal (Rp)',
                    'Status',
                ],
            ];

            // 2. Data rows
            displayedTransactions.forEach((item, index) => {
                sheetData.push([
                    index + 1,
                    item.transaction_date,
                    item.order_number,
                    item.product_name,
                    item.category_name,
                    item.quantity,
                    item.total_nominal,
                    item.status,
                ]);
            });

            // 3. Footer summary row
            sheetData.push([]);
            sheetData.push([
                'TOTAL',
                '',
                `${displayedSummary.total_orders} Pesanan`,
                '',
                '',
                displayedSummary.total_items,
                displayedSummary.total_revenue,
                'SELESAI',
            ]);

            const ws = XLSX.utils.aoa_to_sheet(sheetData);

            // Auto column widths
            ws['!cols'] = [
                { wch: 6 },
                { wch: 20 },
                { wch: 22 },
                { wch: 36 },
                { wch: 18 },
                { wch: 14 },
                { wch: 22 },
                { wch: 18 },
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Laporan Transaksi');

            const fileName = `Laporan_KOPDIG_${startDate}_sd_${endDate}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast.success(`Berhasil mengunduh ${fileName}`);
        } catch (error) {
            console.error('Error generating Excel:', error);
            toast.error('Gagal mengekspor laporan ke Excel. Silakan coba kembali.');
        } finally {
            setIsExportingExcel(false);
        }
    };

    // Export to PDF (.pdf)
    const exportToPdf = async () => {
        if (displayedTransactions.length === 0) {
            toast.error('Tidak ada data transaksi untuk diekspor pada rentang tanggal yang dipilih.');
            return;
        }

        setIsExportingPdf(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 200));

            const startLabel = startDate || 'Awal';
            const endLabel = endDate || 'Akhir';
            const printDate = new Date().toLocaleString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4',
            });

            // Header Banner
            doc.setFillColor(18, 18, 18);
            doc.rect(0, 0, 297, 24, 'F');

            // Header Title
            doc.setTextColor(245, 242, 235);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(15);
            doc.text('KOPDIG - SMKN 1 CIOMAS', 14, 11);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(227, 74, 39);
            doc.text('Laporan Transaksi & Pembukuan Koperasi Sekolah', 14, 18);

            // Right header details
            doc.setFontSize(8);
            doc.setTextColor(190, 190, 190);
            doc.text(`Tanggal Cetak: ${printDate} WIB`, 283, 11, { align: 'right' });
            doc.text(`Periode: ${startLabel} s/d ${endLabel}`, 283, 18, { align: 'right' });

            // Subtitle
            doc.setTextColor(30, 30, 30);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Rekapitulasi Transaksi Pembukuan Koperasi', 14, 32);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(90, 90, 90);
            doc.text(
                `Total Transaksi: ${displayedSummary.total_orders} Pesanan (${displayedSummary.total_items} Qty)  |  Total Pendapatan / Perputaran Dana: Rp ${displayedSummary.total_revenue.toLocaleString('id-ID')}`,
                14,
                38
            );

            // Table Body
            const tableRows = displayedTransactions.map((item, index) => [
                String(index + 1),
                item.transaction_date,
                item.order_number,
                item.product_name,
                item.category_name,
                String(item.quantity),
                `Rp ${item.total_nominal.toLocaleString('id-ID')}`,
                item.status,
            ]);

            autoTable(doc, {
                startY: 42,
                head: [[
                    'No',
                    'Tanggal Transaksi',
                    'ID/Kode Pesanan',
                    'Nama Produk/Titipan',
                    'Kategori',
                    'Jumlah (Qty)',
                    'Total Nominal (Rp)',
                    'Status',
                ]],
                body: tableRows,
                foot: [[
                    'TOTAL',
                    '',
                    `${displayedSummary.total_orders} Pesanan`,
                    '',
                    '',
                    String(displayedSummary.total_items),
                    `Rp ${displayedSummary.total_revenue.toLocaleString('id-ID')}`,
                    '',
                ]],
                theme: 'grid',
                headStyles: {
                    fillColor: [20, 20, 20],
                    textColor: [245, 242, 235],
                    fontStyle: 'bold',
                    fontSize: 8.5,
                    halign: 'left',
                },
                footStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [20, 20, 20],
                    fontStyle: 'bold',
                    fontSize: 8.5,
                },
                bodyStyles: {
                    fontSize: 8,
                    textColor: [35, 35, 35],
                    cellPadding: 2.5,
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    1: { cellWidth: 32 },
                    2: { font: 'courier', cellWidth: 36 },
                    3: { cellWidth: 65 },
                    4: { cellWidth: 30 },
                    5: { halign: 'center', cellWidth: 20 },
                    6: { halign: 'right', fontStyle: 'bold', cellWidth: 38 },
                    7: { halign: 'center', cellWidth: 24 },
                },
                alternateRowStyles: {
                    fillColor: [248, 248, 248],
                },
                margin: { left: 14, right: 14 },
                didDrawPage: (data) => {
                    const pageCount = (doc as any).internal.getNumberOfPages();
                    doc.setFontSize(8);
                    doc.setTextColor(130, 130, 130);
                    doc.text(
                        `Halaman ${data.pageNumber} dari ${pageCount} — KOPDIG SMKN 1 Ciomas`,
                        14,
                        202
                    );
                },
            });

            const fileName = `Laporan_KOPDIG_${startDate}_sd_${endDate}.pdf`;
            doc.save(fileName);

            toast.success(`Berhasil mengunduh ${fileName}`);
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Gagal mengekspor laporan ke PDF. Silakan coba kembali.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    return (
        <CooperativeShell
            activeNav="reports"
            title="Laporan & Pembukuan"
            subtitle="Rekapitulasi transaksi penjualan, perputaran dana, dan pembukuan koperasi SMKN 1 Ciomas."
            breadcrumbs={[
                { label: 'Koperasi', href: '/cooperative' },
                { label: 'Laporan & Pembukuan' },
            ]}
        >
            <Head title="Laporan & Pembukuan — KOPDIG" />

            <div className="space-y-6">
                {/* 1. TOP STAT SUMMARY CARDS */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Card 1: Total Transaksi */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                                Total Transaksi
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg border border-[#262626] bg-[#1A1A1A] text-[#E34A27]">
                                <ShoppingBag className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 font-heading text-2xl font-black text-[#F5F2EB]">
                            {displayedSummary.total_orders}{' '}
                            <span className="text-xs font-normal text-[#737373]">Pesanan</span>
                        </p>
                        <p className="mt-1 text-[11px] text-[#A3A3A3]">
                            {displayedSummary.count} item terdaftar
                        </p>
                    </div>

                    {/* Card 2: Total Item Terjual */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                                Produk Terjual
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg border border-[#262626] bg-[#1A1A1A] text-amber-400">
                                <Package className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 font-heading text-2xl font-black text-amber-400">
                            {displayedSummary.total_items}{' '}
                            <span className="text-xs font-normal text-[#737373]">Pcs / Qty</span>
                        </p>
                        <p className="mt-1 text-[11px] text-[#A3A3A3]">
                            Volume barang keluar
                        </p>
                    </div>

                    {/* Card 3: Total Perputaran Dana */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                                Perputaran Dana
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg border border-emerald-500/25 bg-emerald-500/10 text-emerald-400">
                                <Wallet className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 truncate font-heading text-xl font-black text-emerald-400 sm:text-2xl">
                            {formatRupiah(displayedSummary.total_revenue)}
                        </p>
                        <p className="mt-1 text-[11px] text-[#A3A3A3]">
                            Total perputaran bruto
                        </p>
                    </div>

                    {/* Card 4: Rata-rata per Pesanan */}
                    <div className="rounded-xl border border-[#262626] bg-[#121212] p-4.5 transition-colors hover:border-[#383838]">
                        <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-semibold tracking-wider text-[#737373] uppercase">
                                Rata-Rata Tiket
                            </span>
                            <div className="flex size-7 items-center justify-center rounded-lg border border-sky-500/25 bg-sky-500/10 text-sky-400">
                                <TrendingUp className="size-3.5" />
                            </div>
                        </div>
                        <p className="mt-2 truncate font-heading text-xl font-black text-[#F5F2EB] sm:text-2xl">
                            {formatRupiah(
                                displayedSummary.total_orders > 0
                                    ? Math.round(displayedSummary.total_revenue / displayedSummary.total_orders)
                                    : 0
                            )}
                        </p>
                        <p className="mt-1 text-[11px] text-[#A3A3A3]">
                            Nominal belanja rata-rata
                        </p>
                    </div>
                </div>

                {/* 2. FILTER & EXPORT ACTION CONTROLS */}
                <div className="rounded-xl border border-[#262626] bg-[#121212] p-5 shadow-sm">
                    {/* Header Filter Section */}
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-[#262626] pb-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Filter className="size-4 text-[#E34A27]" />
                                <h2 className="font-heading text-sm font-bold tracking-tight text-[#F5F2EB]">
                                    Filter & Navigasi Rentang Tanggal
                                </h2>
                            </div>
                            <p className="mt-1 text-xs text-[#737373]">
                                Tentukan periode tanggal pembukuan yang ingin direkap dan diekspor.
                            </p>
                        </div>

                        {/* Export Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Ekspor Excel */}
                            <button
                                type="button"
                                onClick={exportToExcel}
                                disabled={isExportingExcel || isExportingPdf || displayedTransactions.length === 0}
                                className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-emerald-600/40 bg-emerald-600/20 px-3.5 py-2 font-mono text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 active:scale-95"
                                title="Unduh rekapitulasi ke format Excel (.xlsx)"
                            >
                                {isExportingExcel ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menyiapkan Excel...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileSpreadsheet className="size-4 text-emerald-400 group-hover:text-white" />
                                        <span>Ekspor Excel</span>
                                    </>
                                )}
                            </button>

                            {/* Ekspor PDF */}
                            <button
                                type="button"
                                onClick={exportToPdf}
                                disabled={isExportingPdf || isExportingExcel || displayedTransactions.length === 0}
                                className="inline-flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg border border-rose-600/40 bg-rose-600/20 px-3.5 py-2 font-mono text-xs font-semibold text-rose-300 transition-all hover:bg-rose-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-45 active:scale-95"
                                title="Unduh laporan resmi ke format PDF (.pdf)"
                            >
                                {isExportingPdf ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        <span>Menyiapkan PDF...</span>
                                    </>
                                ) : (
                                    <>
                                        <FileText className="size-4 text-rose-400 group-hover:text-white" />
                                        <span>Ekspor PDF</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Presets & Date Inputs */}
                    <div className="mt-4 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        {/* Preset Buttons */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[11px] text-[#737373] mr-1">
                                Preset:
                            </span>

                            {/* Hari Ini */}
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('today')}
                                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                                    activePreset === 'today'
                                        ? 'border border-[#E34A27] bg-[#E34A27] font-bold text-white shadow-sm'
                                        : 'border border-[#262626] bg-[#161616] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <Calendar className="size-3.5" />
                                <span>Hari Ini</span>
                            </button>

                            {/* 7 Hari Terakhir */}
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('last_7_days')}
                                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                                    activePreset === 'last_7_days'
                                        ? 'border border-[#E34A27] bg-[#E34A27] font-bold text-white shadow-sm'
                                        : 'border border-[#262626] bg-[#161616] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <Clock className="size-3.5" />
                                <span>7 Hari Terakhir</span>
                            </button>

                            {/* Bulan Ini */}
                            <button
                                type="button"
                                onClick={() => handlePresetSelect('this_month')}
                                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                                    activePreset === 'this_month'
                                        ? 'border border-[#E34A27] bg-[#E34A27] font-bold text-white shadow-sm'
                                        : 'border border-[#262626] bg-[#161616] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <CalendarRange className="size-3.5" />
                                <span>Bulan Ini</span>
                            </button>

                            {/* Kustom */}
                            <button
                                type="button"
                                onClick={() => setActivePreset('custom')}
                                className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-xs transition-colors ${
                                    activePreset === 'custom'
                                        ? 'border border-[#E34A27] bg-[#E34A27] font-bold text-white shadow-sm'
                                        : 'border border-[#262626] bg-[#161616] text-[#A3A3A3] hover:border-[#383838] hover:text-[#F5F2EB]'
                                }`}
                            >
                                <CalendarDays className="size-3.5" />
                                <span>Kustom</span>
                            </button>
                        </div>

                        {/* Date Range Inputs & Apply / Reset Form */}
                        <form
                            onSubmit={handleManualFilterSubmit}
                            className="flex flex-wrap items-center gap-2.5"
                        >
                            {/* Start Date */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="start_date" className="sr-only">
                                    Start Date
                                </label>
                                <input
                                    id="start_date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setActivePreset('custom');
                                    }}
                                    className="h-9 rounded-lg border border-[#262626] bg-[#0A0A0A] px-3 font-mono text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            <span className="font-mono text-xs text-[#737373]">s/d</span>

                            {/* End Date */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="end_date" className="sr-only">
                                    End Date
                                </label>
                                <input
                                    id="end_date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setActivePreset('custom');
                                    }}
                                    className="h-9 rounded-lg border border-[#262626] bg-[#0A0A0A] px-3 font-mono text-xs text-[#F5F2EB] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                                    style={{ colorScheme: 'dark' }}
                                />
                            </div>

                            {/* Terapkan Filter */}
                            <button
                                type="submit"
                                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-[#E34A27] bg-[#E34A27] px-3.5 py-1.5 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#cf3e1d] active:scale-95"
                            >
                                <Search className="size-3.5" />
                                <span>Terapkan Filter</span>
                            </button>

                            {/* Reset */}
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-[#262626] bg-[#161616] px-3 py-1.5 font-mono text-xs text-[#A3A3A3] transition-colors hover:border-[#383838] hover:text-[#F5F2EB] active:scale-95"
                                title="Reset filter tanggal ke default"
                            >
                                <RotateCcw className="size-3.5" />
                                <span>Reset</span>
                            </button>
                        </form>
                    </div>
                </div>

                {/* 3. INTERACTIVE VISUALIZATION CHARTS */}
                <ReportCharts
                    transactions={displayedTransactions}
                    startDate={startDate}
                    endDate={endDate}
                />

                {/* 4. TABLE CARD WITH QUICK SEARCH */}
                <div className="rounded-xl border border-[#262626] bg-[#121212] shadow-sm">
                    {/* Table Utility Bar */}
                    <div className="flex flex-col gap-3 border-b border-[#262626] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2.5">
                            <span className="font-heading text-xs font-bold tracking-wider text-[#F5F2EB] uppercase">
                                Rekapitulasi Transaksi
                            </span>
                            <span className="rounded-full border border-[#262626] bg-[#1A1A1A] px-2.5 py-0.5 font-mono text-[10px] text-[#A3A3A3]">
                                {displayedTransactions.length} Baris
                            </span>
                        </div>

                        {/* Live Filter Input */}
                        <div className="relative w-full sm:w-72">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#737373]" />
                            <input
                                type="text"
                                placeholder="Cari kode pesanan, produk, kategori..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="h-9 w-full rounded-lg border border-[#262626] bg-[#0A0A0A] pr-3 pl-8.5 font-mono text-xs text-[#F5F2EB] placeholder-[#525252] focus:border-[#E34A27] focus:ring-1 focus:ring-[#E34A27] focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Table or Empty State */}
                    {displayedTransactions.length === 0 ? (
                        /* Informative Empty State */
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="flex size-14 items-center justify-center rounded-2xl border border-[#262626] bg-[#161616] text-[#737373]">
                                <FileX2 className="size-7 text-[#737373]" />
                            </div>
                            <h3 className="mt-4 font-heading text-base font-bold text-[#F5F2EB]">
                                Tidak Ada Transaksi Ditemukan
                            </h3>
                            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#737373]">
                                Tidak ada data transaksi penjualan yang tercatat pada rentang tanggal{' '}
                                <span className="font-mono text-[#A3A3A3]">{startDate}</span> s/d{' '}
                                <span className="font-mono text-[#A3A3A3]">{endDate}</span>.
                                {searchQuery ? ' Coba hapus kata kunci pencarian.' : ' Coba ubah rentang tanggal atau pilih preset lain.'}
                            </p>
                            <div className="mt-5 flex gap-2.5">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="inline-flex min-h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-[#E34A27] bg-[#E34A27] px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-[#cf3e1d]"
                                >
                                    <RotateCcw className="size-3.5" />
                                    <span>Reset Rentang Tanggal</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* Data Table */
                        <div className="overflow-x-auto">
                            <table className="w-full text-left font-sans text-xs">
                                <thead>
                                    <tr className="border-b border-[#262626] bg-[#0E0E0E] text-[11px] font-semibold tracking-wider text-[#737373] uppercase">
                                        <th scope="col" className="w-12 px-4 py-3.5 text-center font-mono">
                                            No
                                        </th>
                                        <th scope="col" className="px-4 py-3.5 font-mono">
                                            Tanggal Transaksi
                                        </th>
                                        <th scope="col" className="px-4 py-3.5 font-mono">
                                            ID/Kode Pesanan
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            Nama Produk/Titipan
                                        </th>
                                        <th scope="col" className="px-4 py-3.5">
                                            Kategori
                                        </th>
                                        <th scope="col" className="px-4 py-3.5 text-center font-mono">
                                            Jumlah (Qty)
                                        </th>
                                        <th scope="col" className="px-4 py-3.5 text-right font-mono">
                                            Total Nominal (Rp)
                                        </th>
                                        <th scope="col" className="px-4 py-3.5 text-center">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1F1F1F]">
                                    {displayedTransactions.map((item, index) => (
                                        <tr
                                            key={item.id}
                                            className="transition-colors hover:bg-[#161616]/75"
                                        >
                                            {/* 1. No */}
                                            <td className="px-4 py-3 text-center font-mono text-[11px] text-[#737373]">
                                                {index + 1}
                                            </td>

                                            {/* 2. Tanggal Transaksi */}
                                            <td className="px-4 py-3 font-mono text-xs text-[#A3A3A3] whitespace-nowrap">
                                                <div>{item.transaction_date_short}</div>
                                                <div className="text-[10px] text-[#525252]">
                                                    {item.transaction_date.split(' ')[1] || ''}
                                                </div>
                                            </td>

                                            {/* 3. ID/Kode Pesanan */}
                                            <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                                                <Link
                                                    href={`/cooperative/orders/${item.order_id}`}
                                                    className="inline-block rounded border border-[#2B2B2B] bg-[#1A1A1A] px-2 py-1 text-[#F5F2EB] transition-colors hover:border-[#E34A27] hover:text-[#E34A27]"
                                                    title="Lihat detail pesanan"
                                                >
                                                    {item.order_number}
                                                </Link>
                                            </td>

                                            {/* 4. Nama Produk/Titipan */}
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-[#F5F2EB]">
                                                    {item.product_name}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[10px]">
                                                    {item.source_type === 'student' ? (
                                                        <span className="rounded border border-[#E34A27]/30 bg-[#E34A27]/10 px-1.5 py-0.2 text-[#E34A27]">
                                                            Titipan: {item.seller_name || 'Siswa'}
                                                        </span>
                                                    ) : (
                                                        <span className="rounded border border-[#262626] bg-[#161616] px-1.5 py-0.2 text-[#737373]">
                                                            Koperasi Sekolah
                                                        </span>
                                                    )}
                                                    <span className="text-[#525252]">•</span>
                                                    <span className="text-[#737373]">
                                                        @{formatRupiah(item.unit_price)}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 5. Kategori */}
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <span className="rounded-md border border-[#262626] bg-[#171717] px-2 py-0.5 text-[11px] text-[#A3A3A3]">
                                                    {item.category_name}
                                                </span>
                                            </td>

                                            {/* 6. Jumlah (Qty) */}
                                            <td className="px-4 py-3 text-center font-mono text-xs font-bold text-[#F5F2EB]">
                                                {item.quantity}
                                            </td>

                                            {/* 7. Total Nominal (Rp) */}
                                            <td className="px-4 py-3 text-right font-mono text-xs font-bold text-emerald-400 whitespace-nowrap">
                                                {formatRupiah(item.total_nominal)}
                                            </td>

                                            {/* 8. Status */}
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                                                        item.status_raw === 'completed'
                                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                                            : item.status_raw === 'ready_for_pickup'
                                                            ? 'border-[#E34A27]/30 bg-[#E34A27]/10 text-[#E34A27]'
                                                            : item.status_raw === 'paid'
                                                            ? 'border-teal-500/30 bg-teal-500/10 text-teal-400'
                                                            : item.status_raw === 'processing'
                                                            ? 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                                                            : item.status_raw === 'cancelled' || item.status_raw === 'payment_failed'
                                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                                                    }`}
                                                >
                                                    {item.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                                {/* Footer Summary Row */}
                                <tfoot>
                                    <tr className="border-t-2 border-[#262626] bg-[#0E0E0E] font-mono text-xs font-bold text-[#F5F2EB]">
                                        <td colSpan={3} className="px-4 py-3.5 text-center text-[#737373] uppercase tracking-wider">
                                            Total Rekapitulasi
                                        </td>
                                        <td colSpan={2} className="px-4 py-3.5 text-[#A3A3A3]">
                                            {displayedSummary.total_orders} Pesanan ({displayedSummary.count} Item Transaksi)
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-bold text-amber-400">
                                            {displayedSummary.total_items}
                                        </td>
                                        <td className="px-4 py-3.5 text-right font-black text-emerald-400 text-sm whitespace-nowrap">
                                            {formatRupiah(displayedSummary.total_revenue)}
                                        </td>
                                        <td className="px-4 py-3.5 text-center font-mono text-[11px] text-[#737373]">
                                            Aktif
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>

                {/* Information Callout */}
                <div className="flex items-start gap-3 rounded-xl border border-[#262626] bg-[#0E0E0E] p-4 text-xs text-[#737373]">
                    <AlertCircle className="size-4 shrink-0 text-[#E34A27] mt-0.5" />
                    <p className="leading-relaxed">
                        Data laporan ini bersumber langsung dari buku besar transaksi operasional KOPDIG.
                        Format ekspor Excel (.xlsx) dan PDF (.pdf) secara otomatis menyertakan header entitas resmi{' '}
                        <strong className="text-[#A3A3A3]">KOPDIG - SMKN 1 Ciomas</strong>, tanggal generate, dan rincian ringkasan perputaran dana sesuai rentang periode yang aktif.
                    </p>
                </div>
            </div>
        </CooperativeShell>
    );
}

