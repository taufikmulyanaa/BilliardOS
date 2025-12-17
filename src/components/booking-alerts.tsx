'use client';

import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Bell, Clock, AlertTriangle, Check, X, Play } from 'lucide-react';
import { useToast } from './toast-provider';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Alert {
    type: 'upcoming' | 'waiting_confirmation' | 'auto_cancelled';
    reservation?: any;
    reservationId?: number;
    message: string;
    minutesUntilStart?: number;
    minutesPast?: number;
}

export function BookingAlerts() {
    const { showToast } = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [confirming, setConfirming] = useState<number | null>(null);

    // Poll every 30 seconds for booking alerts
    const { data, mutate } = useSWR<{ success: boolean; alerts: Alert[] }>(
        '/api/reservations/check',
        fetcher,
        { refreshInterval: 30000 }
    );

    const { data: tablesData } = useSWR('/api/tables', fetcher);
    const availableTables = (tablesData?.data || []).filter(
        (t: any) => t.status === 'AVAILABLE' || t.status === 'BOOKED'
    );

    const alerts = data?.alerts || [];
    const hasAlerts = alerts.length > 0;

    // Play notification sound for upcoming bookings
    useEffect(() => {
        const upcomingAlerts = alerts.filter(a => a.type === 'upcoming');
        if (upcomingAlerts.length > 0) {
            // Show toast for each upcoming alert
            upcomingAlerts.forEach(alert => {
                showToast('info', alert.message);
            });
        }
    }, [alerts.length]);

    const handleConfirmStart = async (reservationId: number, tableId: string) => {
        setConfirming(reservationId);
        try {
            const res = await fetch('/api/reservations/confirm-start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reservationId, tableId })
            });

            if (res.ok) {
                const data = await res.json();
                showToast('success', data.message);
                mutate(); // Refresh alerts
                setIsOpen(false);
            } else {
                const err = await res.json();
                showToast('error', err.error || 'Gagal memulai booking');
            }
        } catch (e) {
            showToast('error', 'Error memulai booking');
        }
        setConfirming(null);
    };

    return (
        <div className="relative">
            {/* Bell Icon Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-lg transition-colors"
                style={{
                    backgroundColor: hasAlerts ? 'var(--accent-primary)' : 'var(--bg-surface)',
                    color: hasAlerts ? 'var(--text-inverse)' : 'var(--text-primary)'
                }}
            >
                <Bell size={20} />
                {hasAlerts && (
                    <span className="absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ backgroundColor: '#ef4444', color: 'white' }}>
                        {alerts.length}
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-96 max-h-[400px] overflow-y-auto rounded-lg shadow-2xl z-50"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-default)'
                    }}>
                    <div className="p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
                        <h3 className="font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                            <Bell size={18} /> Notifikasi Booking
                        </h3>
                    </div>

                    {alerts.length === 0 ? (
                        <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={32} className="mx-auto mb-2 opacity-50" />
                            <p>Tidak ada booking yang perlu diproses</p>
                        </div>
                    ) : (
                        <div className="divide-y" style={{ borderColor: 'var(--border-default)' }}>
                            {alerts.map((alert, idx) => (
                                <div key={idx} className="p-4">
                                    {/* Alert Header */}
                                    <div className="flex items-start gap-3 mb-3">
                                        {alert.type === 'upcoming' && (
                                            <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
                                        )}
                                        {alert.type === 'waiting_confirmation' && (
                                            <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                                        )}
                                        {alert.type === 'auto_cancelled' && (
                                            <X size={20} style={{ color: '#ef4444' }} />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                                                {alert.message}
                                            </p>
                                            {alert.reservation && (
                                                <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                                                    {alert.reservation.pax} orang • {alert.reservation.tableType}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons for waiting_confirmation */}
                                    {alert.type === 'waiting_confirmation' && alert.reservation && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                                                Pilih meja untuk memulai:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {availableTables.slice(0, 4).map((table: any) => (
                                                    <button
                                                        key={table.id}
                                                        onClick={() => handleConfirmStart(alert.reservation.id, table.id)}
                                                        disabled={confirming === alert.reservation.id}
                                                        className="px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors"
                                                        style={{
                                                            backgroundColor: 'var(--accent-primary)',
                                                            color: 'var(--text-inverse)'
                                                        }}
                                                    >
                                                        <Play size={12} /> {table.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
