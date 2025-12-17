'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    TrendingUp, TrendingDown, DollarSign, Calendar,
    ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const COLORS = ['#B4E50D', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444'];

export default function RevenueAnalyticsPage() {
    const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('7d');

    const { data: trendData } = useSWR('/api/reports/manager/revenue-trend', fetcher);
    const { data: statsData } = useSWR('/api/reports/manager/stats', fetcher);

    const revenueData = trendData?.data || [];

    const totalRevenue = revenueData.reduce((sum: number, d: any) => sum + (d.revenue || 0), 0);
    const totalFnb = revenueData.reduce((sum: number, d: any) => sum + (d.fnb || 0), 0);
    const avgDaily = revenueData.length > 0 ? totalRevenue / revenueData.length : 0;

    const categoryData = statsData?.data?.categoryBreakdown || [];

    const stats = statsData?.data || { todayRevenue: 0, todayRevenueChange: 0 };
    const isUp = stats.todayRevenueChange > 0;

    return (
        <div className="space-y-6">
            {/* Period Filter */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Analisis Pendapatan</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Trend dan breakdown pendapatan bisnis</p>
                </div>
                <div className="flex gap-2 rounded-lg p-1" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                    {(['7d', '30d', '90d'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                            style={{
                                backgroundColor: period === p ? 'var(--bg-surface)' : 'transparent',
                                color: period === p ? 'var(--text-primary)' : 'var(--text-muted)'
                            }}
                        >
                            {p === '7d' ? '7 Hari' : p === '30d' ? '30 Hari' : '90 Hari'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Pendapatan</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)' }}>
                            <DollarSign className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalRevenue)}</p>
                    <div className="flex items-center gap-1 mt-2 text-sm" style={{ color: isUp ? 'var(--accent-primary)' : 'var(--danger)' }}>
                        {isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        <span>{isUp ? '+' : ''}{stats.todayRevenueChange}% vs periode lalu</span>
                    </div>
                </div>
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Rata-rata Harian</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                            <TrendingUp className="w-4 h-4" style={{ color: '#3b82f6' }} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(avgDaily)}</p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>{revenueData.length} hari data</p>
                </div>
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Pendapatan Meja</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                            <Calendar className="w-4 h-4" style={{ color: '#8b5cf6' }} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(categoryData.find((c: any) => c.name === 'Jam Main')?.amount || 0)}
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                        {categoryData.find((c: any) => c.name === 'Jam Main')?.value || 0}% dari total
                    </p>
                </div>
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Pendapatan F&B</span>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                            <DollarSign className="w-4 h-4" style={{ color: '#f59e0b' }} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        {formatCurrency(categoryData.find((c: any) => c.name === 'F&B')?.amount || 0)}
                    </p>
                    <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
                        {categoryData.find((c: any) => c.name === 'F&B')?.value || 0}% dari total
                    </p>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend */}
                <div className="lg:col-span-2 rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Trend Pendapatan</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#B4E50D" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#B4E50D" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(Number(value)), 'Pendapatan']}
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#B4E50D" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Breakdown */}
                <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Komposisi Pendapatan</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                    {categoryData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value, name, props) => [`${value}% (${formatCurrency(props.payload.amount)})`, props.payload.name]}
                                    contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                        {categoryData.map((item: any, index: number) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                                    <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                                </div>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Comparison Bar Chart */}
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Perbandingan Meja vs F&B</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                            <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                            <YAxis stroke="var(--text-muted)" fontSize={12} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`} />
                            <Tooltip
                                formatter={(value) => [formatCurrency(Number(value))]}
                                contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="Meja" fill="#B4E50D" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="fnb" name="F&B" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
