'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { Plus, Search, Edit2, Trash2, Key, MoreVertical, UserCheck, UserX, Shield, X } from 'lucide-react';
import { useToast } from '@/components/toast-provider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const getRoleColor = (role: string) => {
    if (role === 'ADMIN') return { bg: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6' };
    if (role === 'MANAGER') return { bg: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' };
    return { bg: 'rgba(180, 229, 13, 0.15)', color: 'var(--accent-primary)' };
};

function StaffModal({ staff, onClose, onSuccess }: { staff?: any; onClose: () => void; onSuccess: () => void }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        username: staff?.username || '', fullName: staff?.fullName || '', role: staff?.role || 'CASHIER', password: '', pinCode: staff?.pinCode || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const url = staff ? `/api/users/${staff.id}` : '/api/users';
            const method = staff ? 'PUT' : 'POST';
            const body: any = { username: formData.username, fullName: formData.fullName, role: formData.role, pinCode: formData.pinCode || null };
            if (!staff || formData.password) body.password = formData.password;
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await res.json();
            if (data.success) { showToast('success', staff ? 'Staff berhasil diupdate' : 'Staff berhasil ditambahkan'); onSuccess(); onClose(); }
            else showToast('error', data.error || 'Gagal menyimpan data');
        } catch { showToast('error', 'Terjadi kesalahan'); }
        finally { setLoading(false); }
    };

    const inputStyle = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-lg w-full max-w-md shadow-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{staff ? 'Edit Staff' : 'Tambah Staff Baru'}</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]"><X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {[{ label: 'Username', key: 'username', type: 'text' }, { label: 'Nama Lengkap', key: 'fullName', type: 'text' }].map(f => (
                        <div key={f.key}><label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                            <input type={f.type} value={(formData as any)[f.key]} onChange={(e) => setFormData({ ...formData, [f.key]: e.target.value })} className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} required /></div>
                    ))}
                    <div><label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Role</label>
                        <select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle}>
                            <option value="CASHIER">Kasir</option><option value="MANAGER">Manager</option><option value="ADMIN">Admin</option>
                        </select></div>
                    <div><label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Password {staff && '(kosongkan jika tidak diganti)'}</label>
                        <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} required={!staff} /></div>
                    <div><label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>PIN Code (opsional)</label>
                        <input type="text" value={formData.pinCode} onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })} placeholder="4-6 digit" maxLength={6} className="w-full px-3 py-2 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} /></div>
                    <div className="flex gap-3 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg transition-colors" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>Batal</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2.5 px-4 rounded-lg transition-all disabled:opacity-50" style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function StaffManagementPage() {
    const { showToast } = useToast();
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<any>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

    const { data: usersData, isLoading } = useSWR('/api/users', fetcher);
    const users = usersData?.data || [];

    const filteredUsers = users.filter((user: any) => {
        const matchSearch = user.fullName.toLowerCase().includes(search.toLowerCase()) || user.username.toLowerCase().includes(search.toLowerCase());
        const matchRole = roleFilter === 'ALL' || user.role === roleFilter;
        return matchSearch && matchRole;
    });

    const handleDelete = async (id: number) => {
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.success) { showToast('success', 'Staff berhasil dihapus'); mutate('/api/users'); }
            else showToast('error', data.error || 'Gagal menghapus staff');
        } catch { showToast('error', 'Terjadi kesalahan'); }
        setShowDeleteConfirm(null);
    };

    const handleEdit = (staff: any) => { setEditingStaff(staff); setShowModal(true); };
    const handleAdd = () => { setEditingStaff(null); setShowModal(true); };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Daftar Staff</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola akun staff dan hak akses</p>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all" style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>
                    <Plus className="w-5 h-5" /><span>Tambah Staff</span>
                </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Cari staff..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                </div>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                    <option value="ALL">Semua Role</option><option value="ADMIN">Admin</option><option value="MANAGER">Manager</option><option value="CASHIER">Kasir</option>
                </select>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                {isLoading ? (<div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                                    {['Staff', 'Username', 'Role', 'PIN', 'Bergabung', 'Aksi'].map((h, i) => (
                                        <th key={h} className={`px-6 py-4 text-sm font-semibold ${i === 5 ? 'text-right' : 'text-left'}`} style={{ color: 'var(--text-secondary)' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Tidak ada staff ditemukan</td></tr>
                                ) : (filteredUsers.map((user: any) => {
                                    const roleStyle = getRoleColor(user.role);
                                    return (
                                        <tr key={user.id} className="hover:bg-[var(--bg-elevated)]" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                            <td className="px-6 py-4"><div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold" style={{ background: 'linear-gradient(to bottom-right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>{user.fullName.charAt(0)}</div>
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{user.fullName}</span>
                                            </div></td>
                                            <td className="px-6 py-4" style={{ color: 'var(--text-muted)' }}>{user.username}</td>
                                            <td className="px-6 py-4"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: roleStyle.bg, color: roleStyle.color }}>{user.role}</span></td>
                                            <td className="px-6 py-4">{user.pinCode ? (<span className="flex items-center gap-1 text-sm" style={{ color: 'var(--accent-primary)' }}><Key className="w-4 h-4" />Set</span>) : (<span className="text-sm" style={{ color: 'var(--text-muted)' }}>-</span>)}</td>
                                            <td className="px-6 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{new Date(user.createdAt).toLocaleDateString('id-ID')}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => handleEdit(user)} className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-muted)' }}><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => setShowDeleteConfirm(user.id)} className="p-2 rounded-lg transition-colors hover:bg-[rgba(239,68,68,0.15)]" style={{ color: 'var(--danger)' }}><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                }))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && <StaffModal staff={editingStaff} onClose={() => setShowModal(false)} onSuccess={() => mutate('/api/users')} />}

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="rounded-lg p-6 max-w-sm w-full shadow-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Hapus Staff?</h3>
                        <p className="mb-6" style={{ color: 'var(--text-muted)' }}>Aksi ini tidak dapat dibatalkan. Staff akan dihapus permanen.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 px-4 rounded-lg" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>Batal</button>
                            <button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 py-2.5 px-4 rounded-lg" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
