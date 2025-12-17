'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    AlertTriangle, Printer, FileText, ArrowRight, CheckCircle, Calculator, Banknote, History, Receipt, Search, Calendar, Filter, X, Download
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function ReportsPage() {
    const { data: shiftData, mutate } = useSWR('/api/reports/shift', fetcher);
    const shift = shiftData?.data;

    // View State: 'SHIFT' | 'TRANSACTIONS'
    const [activeView, setActiveView] = useState<'SHIFT' | 'TRANSACTIONS'>('SHIFT');

    // Shift Report State
    const [step, setStep] = useState<number>(1);
    const [actualCash, setActualCash] = useState<number>(0);
    const [varianceReason, setVarianceReason] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Transactions State
    const [page, setPage] = useState(1);
    const limit = 20;

    // Filters State
    const [search, setSearch] = useState('');
    const [paymentFilter, setPaymentFilter] = useState('ALL');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0], // Start of current month
        end: new Date().toISOString().split('T')[0]
    });
    const [exportScope, setExportScope] = useState<'ALL' | 'PAGE'>('ALL');

    // Debounce search
    const [debouncedSearch, setDebouncedSearch] = useState('');
    React.useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    // Reset page on filter change
    React.useEffect(() => {
        setPage(1);
    }, [debouncedSearch, paymentFilter, dateRange]);

    const { data: transactionsData } = useSWR(
        activeView === 'TRANSACTIONS'
            ? `/api/transactions?page=${page}&limit=${limit}&search=${debouncedSearch}&paymentMethod=${paymentFilter}&startDate=${dateRange.start}&endDate=${dateRange.end}`
            : null,
        fetcher
    );

    // Export Handlers
    const handleExportPDF = async () => {
        if (!transactionsData?.data) return;

        // Fetch all data for export (simple approach: fetch with large limit or specific export endpoint)
        // For MVP, we'll fetch a larger set or just current view. Ideally, separate endpoint.
        // Let's re-fetch without limit for export
        const query = `?limit=1000&search=${search}&paymentMethod=${paymentFilter}&startDate=${dateRange.start}&endDate=${dateRange.end}`;
        const res = await fetch(`/api/transactions${query}`);
        const data = await res.json();

        if (!data.success) return alert("Failed to fetch data for export");

        const doc = new jsPDF();
        doc.text("Laporan Transaksi - BilliardPOS", 14, 15);
        doc.setFontSize(10);
        doc.text(`Periode: ${dateRange.start} - ${dateRange.end}`, 14, 22);

        const tableData = data.data.map((t: any) => [
            t.invoiceNo,
            new Date(t.createdAt).toLocaleString(),
            t.resolvedCustomerName,
            t.items.length,
            Number(t.totalAmount).toLocaleString(),
            t.paymentMethod
        ]);

        autoTable(doc, {
            head: [['Invoice', 'Waktu', 'Customer', 'Items', 'Total', 'Metode']],
            body: tableData,
            startY: 30,
        });

        doc.save(`transactions-${Date.now()}.pdf`);
    };

    const handleExportExcel = async () => {
        const query = `?limit=1000&search=${search}&paymentMethod=${paymentFilter}&startDate=${dateRange.start}&endDate=${dateRange.end}`;
        const res = await fetch(`/api/transactions${query}`);
        const data = await res.json();

        if (!data.success) return alert("Failed to fetch data for export");

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Transactions');

        sheet.columns = [
            { header: 'Invoice', key: 'invoiceNo', width: 25 },
            { header: 'Waktu', key: 'createdAt', width: 20 },
            { header: 'Customer', key: 'customer', width: 20 },
            { header: 'Total', key: 'totalAmount', width: 15 },
            { header: 'Metode', key: 'paymentMethod', width: 10 },
            { header: 'Status', key: 'status', width: 10 },
        ];

        data.data.forEach((t: any) => {
            sheet.addRow({
                invoiceNo: t.invoiceNo,
                createdAt: new Date(t.createdAt).toLocaleString(),
                customer: t.resolvedCustomerName,
                totalAmount: Number(t.totalAmount),
                paymentMethod: t.paymentMethod,
                status: 'PAID'
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `transactions-${Date.now()}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    if (!shiftData) return <div className="p-10 text-[var(--text-muted)]">Loading Report Module...</div>;

    // Derived Shift State
    const hasOpenShift = !!shift;
    const systemCash = shift ? (Number(shift.openingCash) + Number(shift.cashSales)) : 0;
    const variance = actualCash - systemCash;

    const handleCloseShift = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reports/shift/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shiftId: shift.shiftId,
                    actualCash,
                    varianceReason
                })
            });

            if (!res.ok) throw new Error("Failed to close shift");

            setStep(4); // Success Step
            mutate(); // Refresh data
        } catch (error) {
            alert("Error closing shift");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrintZReport = () => {
        window.print();
    };

    // --- STEPS UI (Shift Report) ---

    const renderStep1_Overview = () => (
        <div className="space-y-6">
            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-default)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">Ringkasan Shift Berjalan</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-[var(--text-muted)] text-sm">Shift ID</p>
                        <p className="text-[var(--text-primary)] font-mono">#{shift?.shiftId}</p>
                    </div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm">Dibuka</p>
                        <p className="text-[var(--text-primary)] font-mono">{new Date(shift?.openedAt).toLocaleTimeString()}</p>
                    </div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm">Kas Awal</p>
                        <p className="text-[var(--text-primary)] font-mono">Rp {Number(shift?.openingCash).toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-[var(--text-muted)] text-sm">Penjualan Tunai (Sistem)</p>
                        <p className="text-[var(--accent-primary)] font-bold font-mono">Rp {Number(shift?.cashSales).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => setStep(2)}
                    className="bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2"
                >
                    Mulai Tutup Shift <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderStep2_CashCount = () => (
        <div className="space-y-6">
            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-default)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Hitung Uang Fisik (Cash Count)</h3>
                <p className="text-[var(--text-muted)] text-sm mb-6">Silakan hitung total uang tunai yang ada di laci kasir saat ini.</p>

                <div className="mb-6">
                    <label className="block text-[var(--text-muted)] text-xs font-bold uppercase mb-2">Total Uang di Laci</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] font-bold">Rp</span>
                        <input
                            type="number"
                            autoFocus
                            className="w-full bg-black border border-[var(--border-default)] rounded-lg py-4 pl-12 pr-4 text-3xl text-[var(--text-primary)] font-mono focus:border-[var(--accent-primary)] outline-none"
                            value={actualCash || ''}
                            onChange={(e) => setActualCash(Number(e.target.value))}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-between">
                <button onClick={() => setStep(1)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium">Kembali</button>
                <button
                    onClick={() => setStep(3)}
                    disabled={actualCash <= 0}
                    className="bg-[var(--accent-secondary)] hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    Lanjut: Review Selisih <ArrowRight size={20} />
                </button>
            </div>
        </div>
    );

    const renderStep3_Review = () => (
        <div className="space-y-6">
            <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-default)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6">Review & Validasi</h3>

                <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg p-4 space-y-3 mb-6">
                    <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Total System (Start + Sales)</span>
                        <span className="text-[var(--text-primary)] font-mono">Rp {systemCash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-[var(--text-muted)]">Actual Cash (Input)</span>
                        <span className="text-[var(--text-primary)] font-mono">Rp {actualCash.toLocaleString()}</span>
                    </div>
                    <div className="h-px bg-[var(--bg-elevated)] my-2"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-[var(--text-primary)]">Variance (Selisih)</span>
                        <span className={`text-xl font-bold font-mono ${variance === 0 ? 'text-[var(--accent-primary)]' : 'text-red-500'}`}>
                            {variance > 0 ? '+' : ''}Rp {variance.toLocaleString()}
                        </span>
                    </div>
                </div>

                {variance !== 0 && (
                    <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-red-500 mb-2 font-bold">
                            <AlertTriangle size={20} />
                            <span>Terjadi Selisih!</span>
                        </div>
                        <p className="text-sm text-[var(--text-muted)] mb-3">Mohon berikan alasan untuk selisih ini sebelum menutup shift.</p>
                        <textarea
                            className="w-full bg-[var(--bg-overlay)] border border-red-500/30 rounded p-3 text-[var(--text-primary)] text-sm focus:border-red-500 outline-none"
                            placeholder="Contoh: Salah kembalian, uang hilang, dll..."
                            rows={3}
                            value={varianceReason}
                            onChange={(e) => setVarianceReason(e.target.value)}
                        />
                    </div>
                )}
            </div>

            <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] font-medium">Kembali Hitung</button>
                <button
                    onClick={handleCloseShift}
                    disabled={variance !== 0 && varianceReason.length < 5 || isSubmitting}
                    className="bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 disabled:opacity-50"
                >
                    {isSubmitting ? 'Memproses...' : 'Konfirmasi & Tutup Shift'} <CheckCircle size={20} />
                </button>
            </div>
        </div>
    );

    const renderStep4_Success = () => (
        <div className="text-center py-10">
            <div className="size-20 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={48} />
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2">Shift Berhasil Ditutup!</h2>
            <p className="text-[var(--text-muted)] mb-8 max-w-md mx-auto">Laporan Z-Report telah dibuat. Silakan cetak laporan ini untuk arsip fisik.</p>

            <div className="flex justify-center gap-4 print:hidden">
                <button onClick={handlePrintZReport} className="bg-[var(--accent-secondary)] hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-yellow-500/20">
                    <Printer size={20} /> Cetak Z-Report
                </button>
                <a href="/dashboard" className="bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-black text-[var(--text-primary)] px-6 py-3 rounded-lg font-bold flex items-center gap-2">
                    Kembali ke Dashboard
                </a>
            </div>

            {/* Print Preview Area */}
            <div className="hidden print:block mt-10 text-left border p-4 font-mono text-black">
                <h1 className="text-center font-bold text-xl border-b pb-2 mb-4">Z-REPORT</h1>
                <p>Shift ID: #{shift?.shiftId}</p>
                <p>Date: {new Date().toLocaleDateString()}</p>
                <hr className="my-2" />
                <div className="flex justify-between"><span>Opening</span><span>{Number(shift?.openingCash).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Sales (Cash)</span><span>{Number(shift?.cashSales).toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Total Expected</span><span>{systemCash.toLocaleString()}</span></div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold"><span>ACTUAL COUNT</span><span>{actualCash.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Variance</span><span>{variance.toLocaleString()}</span></div>
                {varianceReason && <p className="mt-2 text-xs italic">Note: {varianceReason}</p>}
                <hr className="my-4" />
                <p className="text-center text-xs">** END OF REPORT **</p>
                <p className="text-center text-xs">{new Date().toLocaleString()}</p>
            </div>
        </div>
    );

    // --- TRANSACTIONS UI ---

    const renderTransactions = () => {
        if (!transactionsData) return <div className="text-[var(--text-muted)] p-8">Loading transactions...</div>;

        return (
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Riwayat Transaksi</h2>
                        <div className="text-sm text-[var(--text-muted)]">
                            Total {transactionsData?.meta?.total || 0} transaksi •
                            <span className="text-[var(--accent-primary)] font-bold ml-1">
                                Pendapatan: Rp {Number(transactionsData?.summary?.totalRevenue || 0).toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        <select
                            value={exportScope}
                            onChange={(e) => setExportScope(e.target.value as 'ALL' | 'PAGE')}
                            className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-sm px-3 py-2 text-[var(--text-primary)] text-xs focus:border-[var(--accent-primary)] outline-none"
                        >
                            <option value="ALL">Semua Data</option>
                            <option value="PAGE">Halaman Ini</option>
                        </select>
                        <button onClick={handleExportPDF} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/50 px-3 py-2 rounded text-xs font-bold flex items-center gap-2">
                            <FileText size={16} /> PDF
                        </button>
                        <button onClick={handleExportExcel} className="bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/50 px-3 py-2 rounded text-xs font-bold flex items-center gap-2">
                            <Download size={16} /> Excel
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-[var(--bg-card)] p-4 rounded-sm border border-[var(--border-default)] mb-6 flex flex-col xl:flex-row xl:items-end gap-4">
                    <div className="flex-1 w-full xl:w-auto">
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">Cari Invoice / Customer</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 text-[var(--text-muted)]" size={16} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-sm pl-10 pr-4 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">Metode Bayar</label>
                        <select
                            value={paymentFilter}
                            onChange={(e) => setPaymentFilter(e.target.value)}
                            className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-sm px-4 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                        >
                            <option value="ALL">Semua</option>
                            <option value="CASH">Cash</option>
                            <option value="QRIS">QRIS</option>
                            <option value="DEBIT">Debit</option>
                            <option value="CREDIT">Credit</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Dari Tanggal</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-sm px-3 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] mb-1 block">Sampai Tanggal</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-sm px-3 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-sm border border-[var(--border-default)] flex flex-col">
                    <div className="overflow-x-auto rounded-t-sm">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] border-b border-[var(--border-default)] text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="p-2 font-medium">Invoice</th>
                                    <th className="p-2 font-medium">Waktu</th>
                                    <th className="p-2 font-medium">Customer</th>
                                    <th className="p-2 font-medium text-center">Items</th>
                                    <th className="p-2 font-medium text-right">Total</th>
                                    <th className="p-2 font-medium text-center">Metode</th>
                                    <th className="p-2 font-medium text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-[var(--text-primary)] divide-y divide-[#1e3328] text-xs opacity-90">
                                {transactionsData.data?.map((trx: any) => (
                                    <tr key={trx.id} className="hover:bg-[var(--bg-elevated)]/50 transition-colors">
                                        <td className="p-2 font-mono text-[var(--accent-primary)]">{trx.invoiceNo}</td>
                                        <td className="p-2 text-[var(--text-muted)]">{new Date(trx.createdAt).toLocaleString()}</td>
                                        <td className="p-2 font-medium">{trx.resolvedCustomerName || trx.member?.fullName || 'Guest'}</td>
                                        <td className="p-2 text-center">
                                            <span className="px-1.5 py-0.5 bg-[var(--bg-base)] rounded-sm text-[10px] border border-[var(--border-default)]">
                                                {trx.items?.length || 0} items
                                            </span>
                                        </td>
                                        <td className="p-2 text-right font-mono font-bold">
                                            Rp {Number(trx.totalAmount).toLocaleString()}
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm border border-[var(--border-default)] uppercase text-[var(--text-muted)]">
                                                {trx.paymentMethod}
                                            </span>
                                        </td>
                                        <td className="p-2 text-center">
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/20 font-bold">
                                                PAID
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {transactionsData.data?.length === 0 && (
                        <div className="p-8 text-center text-[var(--text-muted)] border-b border-[var(--border-default)]">
                            Belum ada data transaksi untuk periode ini.
                        </div>
                    )}

                    {/* Pagination Controls - Numbered */}
                    {transactionsData && (
                        <div className="bg-[var(--bg-surface)] border-t border-[var(--border-default)] p-3 flex items-center justify-between rounded-b-sm">
                            <div className="text-xs text-[var(--text-muted)]">
                                Total {transactionsData.meta?.total || 0} results
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={!transactionsData.meta?.hasPrevPage}
                                    className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-sm text-xs text-[var(--text-primary)] disabled:opacity-30 hover:bg-[var(--accent-primary)] hover:text-black hover:border-transparent transition-all"
                                >
                                    Prev
                                </button>

                                {Array.from({ length: Math.min(5, transactionsData.meta?.totalPages || 1) }, (_, i) => {
                                    // Logic to show a window of pages around current page
                                    let pNum = i + 1;
                                    const total = transactionsData.meta?.totalPages || 1;

                                    if (total > 5) {
                                        if (page > 3) pNum = page - 2 + i;
                                        // Clamp to max
                                        if (pNum > total) pNum = total - (4 - i);
                                    }

                                    // Safety check if pNum becomes invalid (e.g. total < 5 loop logic)
                                    if (pNum <= 0) return null;

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setPage(pNum)}
                                            className={`w-8 h-7 flex items-center justify-center rounded-sm text-xs border transition-all
                                                ${page === pNum
                                                    ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)] font-bold'
                                                    : 'bg-[var(--bg-card)] text-[var(--text-muted)] border-[var(--border-default)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)]'
                                                }`}
                                        >
                                            {pNum}
                                        </button>
                                    );
                                })}

                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!transactionsData.meta?.hasNextPage}
                                    className="px-3 py-1 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-sm text-xs text-[var(--text-primary)] disabled:opacity-30 hover:bg-[var(--accent-primary)] hover:text-black hover:border-transparent transition-all"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div >
        );
    };

    return (
        <div className="flex min-h-screen bg-[var(--bg-base)]">
            {/* Sidebar */}
            <div className="w-64 bg-[var(--bg-surface)] border-r border-[var(--border-default)] p-4 hidden md:block print:hidden">
                <nav className="space-y-1 mt-4">
                    <button
                        onClick={() => setActiveView('SHIFT')}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeView === 'SHIFT'
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                            }`}
                    >
                        <FileText size={18} />
                        Laporan Shift
                    </button>
                    <button
                        onClick={() => setActiveView('TRANSACTIONS')}
                        className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors ${activeView === 'TRANSACTIONS'
                            ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] font-bold border border-[var(--accent-primary)]/20'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                            }`}
                    >
                        <History size={18} />
                        Riwayat Transaksi
                    </button>
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-32">
                    {activeView === 'SHIFT' ? (
                        <>
                            {/* Shift Report Content */}
                            {!hasOpenShift && step !== 4 ? (
                                <div className="flex h-full items-center justify-center text-[var(--text-muted)] pt-20">
                                    <div className="text-center">
                                        <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
                                        <h2 className="text-xl font-bold">Tidak ada Shift Aktif</h2>
                                        <p>Buka shift baru dari Dashboard untuk memulai laporan.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="max-w-3xl mx-auto">
                                    {/* Steps Indicator */}
                                    {step !== 4 && (
                                        <div className="flex items-center justify-between mb-8 print:hidden">
                                            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[var(--accent-primary)]' : 'text-slate-600'}`}>
                                                <div className="size-8 rounded-full border-2 flex items-center justify-center font-bold border-current">1</div>
                                                <span className="font-bold hidden sm:inline">Overview</span>
                                            </div>
                                            <div className="h-0.5 flex-1 bg-[var(--bg-elevated)] mx-4"></div>
                                            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[var(--accent-secondary)]' : 'text-slate-600'}`}>
                                                <div className="size-8 rounded-full border-2 flex items-center justify-center font-bold border-current">2</div>
                                                <span className="font-bold hidden sm:inline">Cash Count</span>
                                            </div>
                                            <div className="h-0.5 flex-1 bg-[var(--bg-elevated)] mx-4"></div>
                                            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[var(--text-primary)]' : 'text-slate-600'}`}>
                                                <div className="size-8 rounded-full border-2 flex items-center justify-center font-bold border-current">3</div>
                                                <span className="font-bold hidden sm:inline">Review</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Step Content */}
                                    {step === 1 && renderStep1_Overview()}
                                    {step === 2 && renderStep2_CashCount()}
                                    {step === 3 && renderStep3_Review()}
                                    {step === 4 && renderStep4_Success()}
                                </div>
                            )}
                        </>
                    ) : (
                        renderTransactions()
                    )}
                </main>
            </div>
        </div>
    );
}
