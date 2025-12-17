'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Calendar, Clock, DollarSign, AlertTriangle, CheckCircle, XCircle, Search, Filter, Eye, X, User } from 'lucide-react';
import { useToast } from '@/components/toast-provider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatCurrency = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
const formatDateTime = (date: string) => new Date(date).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

function ShiftDetailModal({ shift, onClose }: { shift: any; onClose: () => void }) {
    const variance = Number(shift.variance);
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl w-full max-w-lg shadow-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Detail Shift Report</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]"><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg" style={{ background: 'linear-gradient(to bottom-right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>{shift.staff?.fullName?.charAt(0) || 'S'}</div>
                        <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{shift.staff?.fullName || 'Unknown'}</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{shift.staff?.role || 'Staff'}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Waktu Buka</p>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatDateTime(shift.openedAt)}</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Waktu Tutup</p>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{shift.closedAt ? formatDateTime(shift.closedAt) : 'Masih Aktif'}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[{ label: 'Kas Awal', value: shift.openingCash }, { label: 'Kas Sistem', value: shift.systemCash }, { label: 'Kas Aktual', value: shift.actualCash }].map(item => (
                            <div key={item.label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(item.value))}</span>
                            </div>
                        ))}
                        <div className="flex justify-between items-center py-3 px-3 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <span className="font-medium" style={{ color: 'var(--text-primary)' }}>Variance</span>
                            <span className="font-bold" style={{ color: variance > 0 ? 'var(--accent-primary)' : variance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{variance > 0 ? '+' : ''}{formatCurrency(variance)}</span>
                        </div>
                    </div>
                    {shift.varianceReason && (
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            <p className="text-sm font-medium mb-1" style={{ color: '#f59e0b' }}>Alasan Variance:</p>
                            <p style={{ color: 'var(--text-secondary)' }}>{shift.varianceReason}</p>
                        </div>
                    )}
                </div>
                <div className="p-5" style={{ borderTop: '1px solid var(--border-default)' }}>
                    <button onClick={onClose} className="w-full py-2.5 rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>Tutup</button>
                </div>
            </div>
        </div>
    );
}

export default function ShiftReportsPage() {
    const [dateFilter, setDateFilter] = useState('');
    const [staffFilter, setStaffFilter] = useState('');
    const [selectedShift, setSelectedShift] = useState<any>(null);

    const { data: shiftsData, isLoading } = useSWR('/api/shifts', fetcher);
    const shifts = shiftsData?.data || [];

    const filteredShifts = shifts.filter((shift: any) => {
        const matchDate = !dateFilter || shift.openedAt.startsWith(dateFilter);
        const matchStaff = !staffFilter || shift.staff?.fullName?.toLowerCase().includes(staffFilter.toLowerCase());
        return matchDate && matchStaff;
    });

    const totalShifts = filteredShifts.length;
    const openShifts = filteredShifts.filter((s: any) => !s.closedAt).length;
    const totalVariance = filteredShifts.reduce((sum: number, s: any) => sum + Number(s.variance || 0), 0);
    const flaggedShifts = filteredShifts.filter((s: any) => Math.abs(Number(s.variance)) > 50000).length;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}><Calendar className="w-5 h-5" style={{ color: '#3b82f6' }} /></div>
                        <div><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Shift</p><p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalShifts}</p></div>
                    </div>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)' }}><Clock className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} /></div>
                        <div><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Shift Aktif</p><p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{openShifts}</p></div>
                    </div>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: totalVariance >= 0 ? 'rgba(180, 229, 13, 0.15)' : 'rgba(239, 68, 68, 0.15)' }}>
                            <DollarSign className="w-5 h-5" style={{ color: totalVariance >= 0 ? 'var(--accent-primary)' : 'var(--danger)' }} />
                        </div>
                        <div><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Variance</p><p className="text-xl font-bold" style={{ color: totalVariance >= 0 ? 'var(--accent-primary)' : 'var(--danger)' }}>{totalVariance >= 0 ? '+' : ''}{formatCurrency(totalVariance)}</p></div>
                    </div>
                </div>
                <div className="rounded-xl p-4" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}><AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} /></div>
                        <div><p className="text-sm" style={{ color: 'var(--text-muted)' }}>Perlu Review</p><p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{flaggedShifts}</p></div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Cari staff..." value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                </div>
                <input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                {isLoading ? (<div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                                    {['Staff', 'Waktu Buka', 'Waktu Tutup', 'Kas Awal', 'Kas Akhir', 'Variance', 'Status', 'Aksi'].map((h, i) => (
                                        <th key={h} className={`px-6 py-4 text-sm font-semibold ${i >= 3 && i <= 5 ? 'text-right' : i === 6 ? 'text-center' : 'text-left'}`} style={{ color: 'var(--text-secondary)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredShifts.length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Tidak ada data shift</td></tr>
                                ) : (filteredShifts.map((shift: any) => {
                                    const variance = Number(shift.variance);
                                    const isFlagged = Math.abs(variance) > 50000;
                                    const status = !shift.closedAt ? 'OPEN' : isFlagged ? 'FLAGGED' : 'CLOSED';
                                    return (
                                        <tr key={shift.id} className="hover:bg-[var(--bg-elevated)]" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                            <td className="px-6 py-4"><div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm" style={{ background: 'linear-gradient(to bottom-right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>{shift.staff?.fullName?.charAt(0) || 'S'}</div>
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{shift.staff?.fullName || 'Unknown'}</span>
                                            </div></td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{formatDateTime(shift.openedAt)}</td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{shift.closedAt ? formatDateTime(shift.closedAt) : <span style={{ color: 'var(--accent-primary)' }}>Aktif</span>}</td>
                                            <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--text-muted)' }}>{formatCurrency(Number(shift.openingCash))}</td>
                                            <td className="px-6 py-4 text-right text-sm" style={{ color: 'var(--text-muted)' }}>{formatCurrency(Number(shift.actualCash))}</td>
                                            <td className="px-6 py-4 text-right"><span className="font-medium" style={{ color: variance > 0 ? 'var(--accent-primary)' : variance < 0 ? 'var(--danger)' : 'var(--text-muted)' }}>{variance > 0 ? '+' : ''}{formatCurrency(variance)}</span></td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" style={{
                                                    backgroundColor: status === 'OPEN' ? 'rgba(180, 229, 13, 0.15)' : status === 'FLAGGED' ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-elevated)',
                                                    color: status === 'OPEN' ? 'var(--accent-primary)' : status === 'FLAGGED' ? 'var(--danger)' : 'var(--text-muted)'
                                                }}>{status === 'OPEN' ? 'Aktif' : status === 'FLAGGED' ? 'Perlu Review' : 'Selesai'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right"><button onClick={() => setSelectedShift(shift)} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}><Eye className="w-4 h-4" /></button></td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedShift && <ShiftDetailModal shift={selectedShift} onClose={() => setSelectedShift(null)} />}
        </div>
    );
}
