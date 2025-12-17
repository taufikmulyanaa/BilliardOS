'use client';

import React from 'react';
import useSWR from 'swr';
import {
    DollarSign, Users, Clock, TrendingUp, TrendingDown,
    AlertTriangle, Calendar, Package, Activity, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

// KPI Card Component
function KPICard({
    title,
    value,
    change,
    changeType,
    icon: Icon,
    color
}: {
    title: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    icon: any;
    color: string;
}) {
    const colorStyles: Record<string, string> = {
        emerald: 'var(--accent-primary)',
        blue: '#3b82f6',
        purple: '#8b5cf6',
        amber: '#f59e0b',
    };

    return (
        <div className="rounded-lg p-6" style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-default)'
        }}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>{title}</p>
                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                    {change && (
                        <div className={`flex items-center gap-1 mt-2 text-sm`} style={{
                            color: changeType === 'up' ? 'var(--accent-primary)' :
                                changeType === 'down' ? 'var(--danger)' : 'var(--text-muted)'
                        }}>
                            {changeType === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
                                changeType === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
                            <span>{change}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-center">
                    <Icon className="w-8 h-8" style={{ color: colorStyles[color] }} />
                </div>
            </div>
        </div>
    );
}

// Alert Card Component
function AlertCard({ type, title, description, time }: { type: 'warning' | 'info' | 'danger'; title: string; description: string; time: string }) {
    const styles = {
        warning: { bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.3)' },
        info: { bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.3)' },
        danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.3)' },
    };
    const iconColors = {
        warning: '#f59e0b',
        info: '#3b82f6',
        danger: 'var(--danger)',
    };

    return (
        <div className="p-4 rounded-md" style={{
            backgroundColor: styles[type].bg,
            border: `1px solid ${styles[type].border}`
        }}>
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 mt-0.5" style={{ color: iconColors[type] }} />
                <div className="flex-1 min-w-0">
                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{title}</p>
                    <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{description}</p>
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{time}</p>
                </div>
            </div>
        </div>
    );
}

// Revenue Chart Colors
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function ManagerDashboard() {
    // Fetch dashboard data
    const { data: statsData } = useSWR('/api/reports/manager/stats', fetcher, { refreshInterval: 30000 });
    const { data: revenueData } = useSWR('/api/reports/manager/revenue-trend', fetcher, { refreshInterval: 60000 });
    const { data: alertsData } = useSWR('/api/reports/manager/alerts', fetcher, { refreshInterval: 30000 });

    // Default empty data when API hasn't returned yet
    const weeklyRevenue = revenueData?.data || [];

    const revenueByCategory = statsData?.data?.categoryBreakdown || [];

    const stats = statsData?.data || {
        todayRevenue: 0,
        todayRevenueChange: 0,
        totalTransactions: 0,
        transactionsChange: 0,
        occupancyRate: 0,
        occupancyChange: 0,
        activeMembers: 0,
        membersChange: 0,
    };

    const alerts = alertsData?.data || [];

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
    };

    return (
        <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Pendapatan Hari Ini"
                    value={formatCurrency(stats.todayRevenue)}
                    change={`${stats.todayRevenueChange > 0 ? '+' : ''}${stats.todayRevenueChange}% dari kemarin`}
                    changeType={stats.todayRevenueChange > 0 ? 'up' : 'down'}
                    icon={DollarSign}
                    color="emerald"
                />
                <KPICard
                    title="Total Transaksi"
                    value={stats.totalTransactions.toString()}
                    change={`${stats.transactionsChange > 0 ? '+' : ''}${stats.transactionsChange}% dari kemarin`}
                    changeType={stats.transactionsChange > 0 ? 'up' : 'down'}
                    icon={Activity}
                    color="blue"
                />
                <KPICard
                    title="Occupancy Rate"
                    value={`${stats.occupancyRate}%`}
                    change={`${stats.occupancyChange > 0 ? '+' : ''}${stats.occupancyChange}% dari kemarin`}
                    changeType={stats.occupancyChange > 0 ? 'up' : 'down'}
                    icon={Clock}
                    color="purple"
                />
                <KPICard
                    title="Member Aktif"
                    value={stats.activeMembers.toString()}
                    change={`${stats.membersChange > 0 ? '+' : ''}${stats.membersChange}% bulan ini`}
                    changeType={stats.membersChange > 0 ? 'up' : 'down'}
                    icon={Users}
                    color="amber"
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 rounded-lg p-6" style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)'
                }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Trend Pendapatan Mingguan</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weeklyRevenue}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis
                                    stroke="var(--text-muted)"
                                    fontSize={12}
                                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}jt`}
                                />
                                <Tooltip
                                    formatter={(value) => [formatCurrency(Number(value)), 'Pendapatan']}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-surface)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="var(--accent-primary)"
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    strokeWidth={2}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue by Category */}
                <div className="rounded-lg p-6" style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)'
                }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Komposisi Pendapatan</h3>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueByCategory}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {revenueByCategory.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value) => [`${value}%`, '']}
                                    contentStyle={{
                                        backgroundColor: 'var(--bg-surface)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-2 mt-4">
                        {revenueByCategory.map((item) => (
                            <div key={item.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span style={{ color: 'var(--text-muted)' }}>{item.name}</span>
                                </div>
                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Alerts */}
                <div className="rounded-lg p-6" style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)'
                }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Peringatan & Notifikasi</h3>
                        <span className="px-2 py-1 text-xs font-medium rounded-full" style={{
                            backgroundColor: 'rgba(245, 158, 11, 0.15)',
                            color: '#f59e0b'
                        }}>
                            {alerts.length} baru
                        </span>
                    </div>
                    <div className="space-y-3">
                        {alerts.length > 0 ? alerts.map((alert: any, index: number) => (
                            <AlertCard key={index} {...alert} />
                        )) : (
                            <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>Tidak ada peringatan</p>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="rounded-lg p-6" style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)'
                }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Statistik Cepat</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Produk Aktif</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>52</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Reservasi Hari Ini</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>8</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Revenue Bulan Ini</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Rp 125jt</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Staff Aktif</span>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>12</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
