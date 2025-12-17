'use client';

import React from 'react';
import useSWR from 'swr';
import { Clock, Sun, Moon, Users, TrendingUp } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatTime = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    return `${h} ${period}`;
};

const getHeatColor = (value: number) => {
    if (value >= 80) return '#ef4444';
    if (value >= 60) return '#f97316';
    if (value >= 40) return '#f59e0b';
    if (value >= 20) return '#B4E50D';
    return 'var(--bg-elevated)';
};

export default function PeakHoursPage() {
    const { data: heatmapResponse } = useSWR('/api/reports/manager/peak-hours', fetcher);

    const heatmapData = heatmapResponse?.data || [];
    const hours = Array.from({ length: 15 }, (_, i) => i + 9);
    const peakHours = heatmapResponse?.peakHours || [];

    const dayAverages = heatmapData.length > 0
        ? heatmapData.map((d: any) => ({
            day: d.day,
            avg: d.hours?.length > 0
                ? Math.round(d.hours.reduce((sum: number, h: any) => sum + (h.value || 0), 0) / d.hours.length)
                : 0
        })).sort((a: any, b: any) => b.avg - a.avg)
        : [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Analisis Jam Sibuk</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Pola keramaian untuk optimasi staffing dan operasional</p>
            </div>

            {/* Peak Hours Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {peakHours.map((peak: any) => (
                    <div key={peak.time} className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)' }}>
                                <peak.icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div>
                                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{peak.label}</p>
                                <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{peak.time}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 rounded-full h-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                <div className="h-2 rounded-full" style={{ width: peak.value, backgroundColor: 'var(--accent-primary)' }} />
                            </div>
                            <span className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{peak.value}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Heatmap */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Heatmap Keramaian</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Rendah</span>
                        <div className="flex gap-1">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--bg-elevated)' }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#B4E50D' }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f59e0b' }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#f97316' }} />
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                        </div>
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Tinggi</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                        {/* Hour Labels */}
                        <div className="flex mb-2 ml-12">
                            {hours.map((hour) => (
                                <div key={hour} className="flex-1 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
                                    {formatTime(hour)}
                                </div>
                            ))}
                        </div>

                        {/* Heatmap Grid */}
                        {heatmapData.map((day: any) => (
                            <div key={day.day} className="flex items-center gap-2 mb-1">
                                <div className="w-10 text-sm font-medium" style={{ color: 'var(--text-muted)' }}>{day.day}</div>
                                <div className="flex flex-1 gap-1">
                                    {day.hours.map((h: any) => (
                                        <div
                                            key={h.hour}
                                            className="flex-1 h-8 rounded cursor-pointer transition-transform hover:scale-110"
                                            style={{ backgroundColor: getHeatColor(h.value) }}
                                            title={`${day.day} ${formatTime(h.hour)}: ${h.value}% occupancy`}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Day Rankings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Hari Tersibuk</h3>
                    <div className="space-y-3">
                        {dayAverages.map((day: any, index: number) => (
                            <div key={day.day} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{
                                    backgroundColor: index === 0 ? 'rgba(180, 229, 13, 0.15)' :
                                        index === 1 ? 'rgba(139, 92, 246, 0.15)' :
                                            index === 2 ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-elevated)',
                                    color: index === 0 ? 'var(--accent-primary)' :
                                        index === 1 ? '#8b5cf6' :
                                            index === 2 ? '#f59e0b' : 'var(--text-muted)'
                                }}>
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{day.day}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-24 rounded-full h-2" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                                        <div className="h-2 rounded-full" style={{ width: `${day.avg}%`, backgroundColor: 'var(--accent-primary)' }} />
                                    </div>
                                    <span className="text-sm font-medium w-12 text-right" style={{ color: 'var(--text-muted)' }}>{day.avg}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-2xl p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Rekomendasi Staffing</h3>
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(180, 229, 13, 0.1)', border: '1px solid rgba(180, 229, 13, 0.3)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                                <span className="font-medium" style={{ color: 'var(--accent-primary)' }}>Jam Puncak (19:00-22:00)</span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Rekomendasikan 3-4 staff aktif untuk melayani peak hours</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-5 h-5" style={{ color: '#f59e0b' }} />
                                <span className="font-medium" style={{ color: '#f59e0b' }}>Weekend (Sab-Min)</span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Tambahkan 1 extra staff untuk weekend rush</p>
                        </div>
                        <div className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-5 h-5" style={{ color: '#3b82f6' }} />
                                <span className="font-medium" style={{ color: '#3b82f6' }}>Quiet Hours</span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Pagi hari (09:00-12:00) cukup 1-2 staff</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
