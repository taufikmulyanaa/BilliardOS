'use client';

import React from 'react';
import useSWR from 'swr';
import { Users, TrendingUp, Star, Wallet, Award, UserPlus } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

const TIER_COLORS = { GOLD: '#f59e0b', SILVER: '#94a3b8', BRONZE: '#d97706' };

export default function MemberAnalyticsPage() {
    const { data: membersData } = useSWR('/api/members', fetcher);
    const members = membersData?.data || [];

    const totalMembers = members.length;
    const activeMembers = members.filter((m: any) => m.status === 'ACTIVE').length;

    const tierCounts = members.reduce((acc: any, m: any) => { acc[m.tier] = (acc[m.tier] || 0) + 1; return acc; }, {});
    const tierData = [
        { name: 'Gold', value: tierCounts.GOLD || 0, color: TIER_COLORS.GOLD },
        { name: 'Silver', value: tierCounts.SILVER || 0, color: TIER_COLORS.SILVER },
        { name: 'Bronze', value: tierCounts.BRONZE || 0, color: TIER_COLORS.BRONZE },
    ];

    const totalPoints = members.reduce((sum: number, m: any) => sum + m.pointsBalance, 0);
    const totalWallet = members.reduce((sum: number, m: any) => sum + Number(m.walletBalance), 0);

    const topSpenders = [...members].sort((a: any, b: any) => Number(b.walletBalance) - Number(a.walletBalance)).slice(0, 5);
    const { data: trendResponse } = useSWR('/api/reports/manager/member-trend', fetcher);
    const monthlyTrend = trendResponse?.data || [];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Analisis Member</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Statistik dan insight tentang member</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                            <Users className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Member</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalMembers}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)' }}>
                            <UserPlus className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Member Aktif</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{activeMembers}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}>
                            <Star className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Poin</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{totalPoints.toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                            <Wallet className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Deposit</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalWallet)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Distribusi Tier</h3>
                    <div className="flex items-center gap-6">
                        <div className="h-48 w-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={tierData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={5} dataKey="value">
                                        {tierData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex-1 space-y-3">
                            {tierData.map((tier) => (
                                <div key={tier.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                                        <span style={{ color: 'var(--text-muted)' }}>{tier.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{tier.value}</span>
                                        <span className="text-sm ml-1" style={{ color: 'var(--text-muted)' }}>({totalMembers > 0 ? Math.round((tier.value / totalMembers) * 100) : 0}%)</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Pertumbuhan Member</h3>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={monthlyTrend}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-default)" opacity={0.5} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: '8px', color: 'var(--text-primary)' }} />
                                <Bar dataKey="new" name="Member Baru" fill="#B4E50D" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Top Spenders</h3>
                    <Award className="w-5 h-5" style={{ color: '#f59e0b' }} />
                </div>
                <div className="space-y-3">
                    {topSpenders.map((member: any, index: number) => (
                        <div key={member.id} className="flex items-center gap-4 p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                                backgroundColor: index === 0 ? 'rgba(245, 158, 11, 0.15)' : index === 1 ? 'rgba(148, 163, 184, 0.15)' : index === 2 ? 'rgba(217, 119, 6, 0.15)' : 'var(--bg-surface)',
                                color: index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#d97706' : 'var(--text-muted)'
                            }}>{index + 1}</div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{member.fullName}</p>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{member.memberCode}</p>
                            </div>
                            <div className="text-right">
                                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: TIER_COLORS[member.tier as keyof typeof TIER_COLORS] + '20', color: TIER_COLORS[member.tier as keyof typeof TIER_COLORS] }}>{member.tier}</span>
                            </div>
                            <div className="w-32 text-right">
                                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(Number(member.walletBalance))}</p>
                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{member.pointsBalance.toLocaleString()} pts</p>
                            </div>
                        </div>
                    ))}
                    {topSpenders.length === 0 && (<p className="text-center py-4" style={{ color: 'var(--text-muted)' }}>Belum ada data member</p>)}
                </div>
            </div>
        </div>
    );
}
