'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    Calendar, ChevronLeft, ChevronRight, Phone,
    Plus, Filter, MoreVertical, X, Check, Trash2, Edit2
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Create/Edit Modal
const ReservationModal = ({ reservation, onClose, onSave }: { reservation?: any, onClose: () => void, onSave: () => void }) => {
    const isEdit = !!reservation;
    const [formData, setFormData] = useState({
        customerName: reservation?.customerName || '',
        phone: reservation?.phone || '',
        bookingDate: reservation?.bookingDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        bookingTime: reservation?.bookingTime ? new Date(reservation.bookingTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '14:00',
        pax: reservation?.pax || 2,
        tableType: reservation?.tableType || 'REGULAR',
        notes: reservation?.notes || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = isEdit ? `/api/reservations/${reservation.id}` : '/api/reservations';
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');
            onSave();
        } catch (error) {
            alert('Gagal menyimpan reservasi');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{isEdit ? 'Edit Reservasi' : 'Buat Reservasi Baru'}</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Nama Customer</label>
                        <input
                            type="text"
                            required
                            value={formData.customerName}
                            onChange={e => setFormData({ ...formData, customerName: e.target.value })}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">No. Telepon</label>
                        <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Tanggal</label>
                            <input
                                type="date"
                                required
                                value={formData.bookingDate}
                                onChange={e => setFormData({ ...formData, bookingDate: e.target.value })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Waktu</label>
                            <input
                                type="time"
                                required
                                value={formData.bookingTime}
                                onChange={e => setFormData({ ...formData, bookingTime: e.target.value })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Jumlah Orang</label>
                            <input
                                type="number"
                                min={1}
                                required
                                value={formData.pax}
                                onChange={e => setFormData({ ...formData, pax: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Tipe Meja</label>
                            <select
                                value={formData.tableType}
                                onChange={e => setFormData({ ...formData, tableType: e.target.value })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                            >
                                <option value="REGULAR">Regular</option>
                                <option value="VIP">VIP</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Catatan (Opsional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={2}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-white text-sm focus:border-[var(--accent-primary)] outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-black font-bold rounded-lg disabled:opacity-50"
                    >
                        {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Buat Reservasi')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function ReservationsPage() {
    const { data: reservationsData, mutate } = useSWR('/api/reservations', fetcher);
    const reservations = reservationsData?.data || [];

    const [showModal, setShowModal] = useState(false);
    const [editingReservation, setEditingReservation] = useState<any>(null);

    const handleConfirm = async (id: number) => {
        await fetch(`/api/reservations/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'CONFIRMED' })
        });
        mutate();
    };

    const handleCancel = async (id: number) => {
        if (!confirm('Yakin ingin membatalkan reservasi ini?')) return;
        await fetch(`/api/reservations/${id}`, { method: 'DELETE' });
        mutate();
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'CONFIRMED': return 'bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] border-[var(--accent-primary)]/20';
            case 'PENDING': return 'bg-[#eab308]/20 text-[#eab308] border-[#eab308]/20';
            case 'CANCELLED': return 'bg-red-500/20 text-red-500 border-red-500/20';
            case 'COMPLETED': return 'bg-[var(--text-muted)]/20 text-[var(--text-muted)] border-slate-500/20';
            default: return 'bg-[var(--text-muted)]/20 text-[var(--text-muted)] border-slate-500/20';
        }
    };

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-base)] h-full">
            <div className="px-6 py-6 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">Jadwal Reservasi</h2>
                    <p className="text-[var(--text-muted)] text-sm">Kelola booking meja untuk hari ini dan mendatang.</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 bg-[var(--bg-surface)] border border-[var(--border-default)] text-white px-4 py-2 rounded text-sm font-medium hover:border-[var(--accent-primary)] transition-colors">
                        <Filter size={16} /> Filter
                    </button>
                    <button
                        onClick={() => { setEditingReservation(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] text-black px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                        <Plus size={16} /> Buat Reservasi
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Date Selector */}
                <div className="flex items-center gap-4 mb-6">
                    <button className="p-2 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white transition-colors border border-[var(--border-default)]"><ChevronLeft size={20} /></button>
                    <div className="flex items-center gap-2 text-white font-bold text-lg">
                        <Calendar size={20} className="text-[var(--accent-primary)]" />
                        <span>{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
                    </div>
                    <button className="p-2 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-white transition-colors border border-[var(--border-default)]"><ChevronRight size={20} /></button>
                </div>

                {/* Reservation Table */}
                <div className="rounded border border-[var(--border-default)] overflow-hidden bg-[var(--bg-card)]">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-3 border-b border-[var(--border-default)]">Waktu / Tanggal</th>
                                <th className="px-6 py-3 border-b border-[var(--border-default)]">Nama Customer</th>
                                <th className="px-6 py-3 border-b border-[var(--border-default)]">Kontak</th>
                                <th className="px-6 py-3 border-b border-[var(--border-default)]">Detail</th>
                                <th className="px-6 py-3 border-b border-[var(--border-default)] text-center">Status</th>
                                <th className="px-6 py-3 border-b border-[var(--border-default)] text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-[var(--border-default)]">
                            {reservations.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-[var(--text-muted)]">Tidak ada reservasi ditemukan.</td>
                                </tr>
                            ) : (
                                reservations.map((res: any) => (
                                    <tr key={res.id} className="hover:bg-[var(--bg-surface)]/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{new Date(res.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                            <div className="text-xs text-[var(--text-muted)]">{new Date(res.bookingDate).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-white">{res.customerName}</div>
                                            {res.notes && <div className="text-xs text-[#eab308] mt-1 italic">{res.notes}</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                                <Phone size={14} className="text-[var(--text-muted)]" />
                                                {res.phone}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[var(--text-secondary)]">{res.pax} Org • {res.tableType}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(res.status)}`}>{res.status}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {res.status === 'PENDING' && (
                                                    <button onClick={() => handleConfirm(res.id)} className="p-1.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20" title="Konfirmasi">
                                                        <Check size={14} />
                                                    </button>
                                                )}
                                                <button onClick={() => { setEditingReservation(res); setShowModal(true); }} className="p-1.5 rounded bg-[#eab308]/10 text-[#eab308] hover:bg-[#eab308]/20" title="Edit">
                                                    <Edit2 size={14} />
                                                </button>
                                                {res.status !== 'CANCELLED' && (
                                                    <button onClick={() => handleCancel(res.id)} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20" title="Batalkan">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <ReservationModal
                    reservation={editingReservation}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); mutate(); }}
                />
            )}
        </div>
    );
}
