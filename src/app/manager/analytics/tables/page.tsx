'use client';

import React from 'react';
import useSWR from 'swr';
import { Clock, TrendingUp, DollarSign, Users } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, RadialBarChart, RadialBar, Legend
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const COLORS = ['#B4E50D', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

export default function TablePerformancePage() {
    const { data: tablesData } = useSWR('/api/tables', fetcher);
    const { data: performanceData } = useSWR('/api/reports/manager/table-performance', fetcher);

    const tablePerformance: any[] = performanceData?.data || [];
    const tableTypeData: any[] = performanceData?.typeBreakdown || [];

    const occupancyData = tablePerformance.map((t: any) => ({
        name: t.name,
        occupancy: t.occupancy || 0,
        fill: t.occupancy >= 75 ? '#B4E50D' : t.occupancy >= 50 ? '#f59e0b' : '#ef4444'
    }));

    const totalRevenue = tablePerformance.reduce((sum: number, t: any) => sum + (t.revenue || 0), 0);
    const totalSessions = tablePerformance.reduce((sum: number, t: any) => sum + (t.sessions || 0), 0);
    const avgOccupancy = tablePerformance.length > 0
        ? Math.round(tablePerformance.reduce((sum: number, t: any) => sum + (t.occupancy || 0), 0) / tablePerformance.length)
        : 0;
    const totalHours = tablePerformance.reduce((sum: number, t: any) => sum + (t.hours || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Performa Meja</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Analisis penggunaan dan pendapatan per meja</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)' }}>
                            <DollarSign className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Revenue</p>
                            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalRevenue)}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                            <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Session</p>
                            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{totalSessions}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                            <TrendingUp className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Avg Occupancy</p>
                            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{avgOccupancy}%</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                            <Clock className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Jam Main</p>
                            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{totalHours} jam</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue per Table */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue per Meja</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={tablePerformance} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                                <XAxis type="number" stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={12} width={50} />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                />
                                <Bar dataKey="revenue" fill="#B4E50D" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Type */}
                <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue per Tipe</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={tableTypeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={5} dataKey="value">
                                    {tableTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-2">
                        {tableTypeData.map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }} />
                                    <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                                </div>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table Detail */}
            <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="p-6" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Detail Performa Meja</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                                <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Meja</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Session</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Jam</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Revenue</th>
                                <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Revenue/Jam</th>
                                <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Occupancy</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tablePerformance.map((table) => (
                                <tr key={table.name} className="hover:bg-[var(--bg-elevated)]" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                    <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>{table.name}</td>
                                    <td className="px-6 py-4 text-right" style={{ color: 'var(--text-muted)' }}>{table.sessions}</td>
                                    <td className="px-6 py-4 text-right" style={{ color: 'var(--text-muted)' }}>{table.hours}</td>
                                    <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(table.revenue)}</td>
                                    <td className="px-6 py-4 text-right" style={{ color: 'var(--text-muted)' }}>{formatCurrency(table.revenue / table.hours)}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="flex-1 max-w-[80px] rounded-full h-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                                <div
                                                    className="h-2 rounded-full"
                                                    style={{
                                                        width: `${table.occupancy}%`,
                                                        backgroundColor: table.occupancy >= 75 ? '#B4E50D' : table.occupancy >= 50 ? '#f59e0b' : '#ef4444'
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{table.occupancy}%</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
