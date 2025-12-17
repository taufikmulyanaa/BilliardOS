'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { DollarSign, Edit2, Save, X, Tag } from 'lucide-react';
import { useToast } from '@/components/toast-provider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

export default function PricingManagementPage() {
    const { showToast } = useToast();
    const [editingTable, setEditingTable] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const { data: tablesData, isLoading } = useSWR('/api/tables', fetcher);
    const tables = tablesData?.data || [];

    const handleEdit = (table: any) => { setEditingTable(table.id); setEditValue(table.hourlyRate.toString()); };

    const handleSave = async (tableId: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/tables/${tableId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hourlyRate: parseFloat(editValue) }),
            });
            if (res.ok) { showToast('success', 'Harga berhasil diupdate'); mutate('/api/tables'); setEditingTable(null); }
            else { showToast('error', 'Gagal mengupdate harga'); }
        } catch { showToast('error', 'Terjadi kesalahan'); }
        setLoading(false);
    };

    const handleCancel = () => { setEditingTable(null); setEditValue(''); };

    const tablesByType = tables.reduce((acc: any, table: any) => {
        if (!acc[table.type]) acc[table.type] = [];
        acc[table.type].push(table);
        return acc;
    }, {});

    const getTypeColor = (type: string) => {
        if (type === 'VIP') return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
        if (type === 'SNOOKER') return { bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
        return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Tarif Meja</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola harga per jam untuk setiap meja</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(tablesByType).map(([type, typeTables]: [string, any]) => {
                    const avgRate = typeTables.reduce((sum: number, t: any) => sum + Number(t.hourlyRate), 0) / typeTables.length;
                    const typeStyle = getTypeColor(type);
                    return (
                        <div key={type} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>{type}</span>
                                <Tag className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(avgRate)}/jam</p>
                            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{typeTables.length} meja</p>
                        </div>
                    );
                })}
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                {isLoading ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Meja</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Tipe</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Status</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Tarif per Jam</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tables.map((table: any) => {
                                    const typeStyle = getTypeColor(table.type);
                                    return (
                                        <tr key={table.id} className="hover:bg-[var(--bg-elevated)]" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold" style={{ background: 'linear-gradient(to bottom-right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>
                                                        {table.name.charAt(0)}
                                                    </div>
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{table.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: typeStyle.bg, color: typeStyle.color }}>{table.type}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                                                    backgroundColor: table.status === 'AVAILABLE' ? 'rgba(180, 229, 13, 0.15)' : table.status === 'ACTIVE' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-elevated)',
                                                    color: table.status === 'AVAILABLE' ? 'var(--accent-primary)' : table.status === 'ACTIVE' ? '#3b82f6' : 'var(--text-muted)'
                                                }}>{table.status}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {editingTable === table.id ? (
                                                    <div className="flex items-center justify-end gap-2">
                                                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Rp</span>
                                                        <input type="number" value={editValue} onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-32 px-3 py-1.5 rounded-lg text-right focus:ring-2 focus:ring-[var(--accent-primary)]"
                                                            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                                                    </div>
                                                ) : (
                                                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(table.hourlyRate))}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    {editingTable === table.id ? (
                                                        <>
                                                            <button onClick={() => handleSave(table.id)} disabled={loading} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)', color: 'var(--accent-primary)' }}>
                                                                <Save className="w-4 h-4" />
                                                            </button>
                                                            <button onClick={handleCancel} className="p-2 rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button onClick={() => handleEdit(table)} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}>
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="rounded-2xl p-6" style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text-inverse)' }}>🎉 Promo & Happy Hour</h3>
                        <p style={{ color: 'rgba(0, 0, 0, 0.6)' }}>Fitur promo sedang dalam pengembangan</p>
                    </div>
                    <button className="px-4 py-2 rounded-lg text-sm font-medium transition-colors" style={{ backgroundColor: 'rgba(0, 0, 0, 0.15)', color: 'var(--text-inverse)' }}>
                        Segera Hadir
                    </button>
                </div>
            </div>
        </div>
    );
}
