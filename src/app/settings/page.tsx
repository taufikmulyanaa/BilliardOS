'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    Settings, Users, Table2, Printer, Plus, Edit2, Trash2, X, Save, Shield
} from 'lucide-react';
import { useToast } from '@/components/toast-provider';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// User Modal
const UserModal = ({ user, onClose, onSave }: { user?: any, onClose: () => void, onSave: () => void }) => {
    const { showToast } = useToast();
    const [form, setForm] = useState({
        username: user?.username || '',
        fullName: user?.fullName || '',
        role: user?.role || 'CASHIER',
        password: '',
        pinCode: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = user ? `/api/users/${user.id}` : '/api/users';
            const method = user ? 'PATCH' : 'POST';

            const body: any = {
                fullName: form.fullName,
                role: form.role,
            };

            if (!user) {
                body.username = form.username;
                body.password = form.password;
            } else if (form.password) {
                body.password = form.password;
            }

            if (form.pinCode) body.pinCode = form.pinCode;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save user');
            }

            showToast('success', user ? 'User updated successfully' : 'User created successfully');
            onSave();
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl w-full max-w-md">
                <div className="p-4 border-b border-[#1e3328] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{user ? 'Edit User' : 'Add User'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {!user && (
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Username</label>
                            <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required
                                className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Full Name</label>
                        <input type="text" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Role</label>
                        <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white">
                            <option value="CASHIER">Cashier</option>
                            <option value="MANAGER">Manager</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">
                            {user ? 'New Password (leave empty to keep)' : 'Password'}
                        </label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                            required={!user} minLength={6}
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">PIN Code (Optional)</label>
                        <input type="text" value={form.pinCode} onChange={e => setForm({ ...form, pinCode: e.target.value })} maxLength={6}
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white" />
                    </div>
                    <button type="submit" disabled={isSubmitting}
                        className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save User'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Table Modal
const TableModal = ({ table, onClose, onSave }: { table?: any, onClose: () => void, onSave: () => void }) => {
    const { showToast } = useToast();
    const [form, setForm] = useState({
        id: table?.id || '',
        name: table?.name || '',
        type: table?.type || 'REGULAR',
        hourlyRate: table?.hourlyRate || 50000,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = table ? `/api/tables/${table.id}` : '/api/tables';
            const method = table ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save table');
            }

            showToast('success', table ? 'Table updated successfully' : 'Table created successfully');
            onSave();
        } catch (error: any) {
            showToast('error', error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl w-full max-w-md">
                <div className="p-4 border-b border-[#1e3328] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">{table ? 'Edit Table' : 'Add Table'}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    {!table && (
                        <div>
                            <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Table ID</label>
                            <input type="text" disabled value="Auto-generated"
                                className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-slate-500 italic cursor-not-allowed" />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Table Name</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required
                            placeholder="e.g., Table 1, VIP Room A"
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white" />
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Type</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white">
                            <option value="REGULAR">Regular</option>
                            <option value="VIP">VIP</option>
                            <option value="SNOOKER">Snooker</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-slate-500 uppercase font-bold block mb-1">Hourly Rate (Rp)</label>
                        <input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: Number(e.target.value) })} required
                            className="w-full bg-[#050a07] border border-[#1e3328] rounded p-2 text-white" />
                    </div>
                    <button type="submit" disabled={isSubmitting}
                        className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded disabled:opacity-50">
                        {isSubmitting ? 'Saving...' : 'Save Table'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function SettingsPage() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'users' | 'tables' | 'printers'>('users');

    // Data
    const { data: usersData, mutate: mutateUsers } = useSWR('/api/users', fetcher);
    const { data: tablesData, mutate: mutateTables } = useSWR('/api/tables', fetcher);

    const users = usersData?.data || [];
    const tables = tablesData?.data || [];

    // Modals
    const [showUserModal, setShowUserModal] = useState(false);
    const [showTableModal, setShowTableModal] = useState(false);
    const [editUser, setEditUser] = useState<any>(null);
    const [editTable, setEditTable] = useState<any>(null);

    // Printer settings (localStorage)
    const [printerSettings, setPrinterSettings] = useState({
        barPrinter: '',
        kitchenPrinter: '',
        cashierPrinter: '',
    });

    const handleDeleteUser = async (id: number) => {
        if (!confirm('Are you sure you want to delete this user?')) return;

        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed to delete user');
            showToast('success', 'User deleted successfully');
            mutateUsers();
        } catch (error) {
            showToast('error', 'Failed to delete user');
        }
    };

    const handleDeleteTable = async (id: string) => {
        if (!confirm('Are you sure you want to delete this table?')) return;

        try {
            const res = await fetch(`/api/tables/${id}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to delete table');
            }
            showToast('success', 'Table deleted successfully');
            mutateTables();
        } catch (error: any) {
            showToast('error', error.message);
        }
    };

    const handleSavePrinters = () => {
        localStorage.setItem('printer_settings', JSON.stringify(printerSettings));
        showToast('success', 'Printer settings saved');
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            ADMIN: 'bg-purple-500/20 text-purple-500 border-purple-500/30',
            MANAGER: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
            CASHIER: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
        };
        return colors[role] || colors.CASHIER;
    };

    return (
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-[#0f1a14] border-r border-[#1e3328] p-4">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <Settings size={24} className="text-[#22c55e]" /> Settings
                </h2>
                <nav className="space-y-2">
                    {[
                        { key: 'users', icon: Users, label: 'User Management' },
                        { key: 'tables', icon: Table2, label: 'Table Management' },
                        { key: 'printers', icon: Printer, label: 'Printer Config' },
                    ].map(item => (
                        <button
                            key={item.key}
                            onClick={() => setActiveTab(item.key as any)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors ${activeTab === item.key
                                ? 'bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/30'
                                : 'text-slate-400 hover:text-white hover:bg-[#16261d]'
                                }`}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-6">
                {/* Users Tab */}
                {activeTab === 'users' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">User Management</h3>
                            <button onClick={() => { setEditUser(null); setShowUserModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded">
                                <Plus size={18} /> Add User
                            </button>
                        </div>
                        <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[#16261d]">
                                    <tr>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">Username</th>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">Full Name</th>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">Role</th>
                                        <th className="text-right p-4 text-xs text-slate-500 uppercase font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user: any) => (
                                        <tr key={user.id} className="border-t border-[#1e3328] hover:bg-[#16261d]">
                                            <td className="p-4 text-white font-medium">{user.username}</td>
                                            <td className="p-4 text-slate-300">{user.fullName}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold border ${getRoleBadge(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => { setEditUser(user); setShowUserModal(true); }}
                                                    className="p-2 text-slate-400 hover:text-white"><Edit2 size={16} /></button>
                                                <button onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tables Tab */}
                {activeTab === 'tables' && (
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-white">Table Management</h3>
                            <button onClick={() => { setEditTable(null); setShowTableModal(true); }}
                                className="flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded">
                                <Plus size={18} /> Add Table
                            </button>
                        </div>

                        {/* Rate Management Section */}
                        <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl p-6 mb-6">
                            <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Shield size={18} className="text-[#eab308]" /> Global Rate Configuration
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-[#16261d] p-4 rounded-lg border border-[#1e3328]">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-bold text-[#eab308]">VIP Tables</h5>
                                        <span className="text-xs text-slate-400">Apply to all VIP tables</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Hourly Rate (Rp)"
                                            className="flex-1 bg-[#050a07] border border-[#1e3328] rounded p-2 text-white"
                                            id="vip-rate-input"
                                        />
                                        <button
                                            onClick={async () => {
                                                const input = document.getElementById('vip-rate-input') as HTMLInputElement;
                                                const rate = Number(input.value);
                                                if (!rate) return showToast('error', 'Please enter a valid rate');
                                                if (!confirm(`Update ALL VIP tables to Rp ${rate.toLocaleString()}?`)) return;

                                                try {
                                                    const res = await fetch('/api/tables/update-rates', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ type: 'VIP', rate })
                                                    });
                                                    if (!res.ok) throw new Error('Failed to update');
                                                    showToast('success', 'VIP rates updated');
                                                    mutateTables();
                                                } catch (e) { showToast('error', 'Failed to update rates'); }
                                            }}
                                            className="px-4 py-2 bg-[#eab308] hover:bg-yellow-500 text-black font-bold rounded text-sm"
                                        >
                                            Update All
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-[#16261d] p-4 rounded-lg border border-[#1e3328]">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-bold text-slate-300">REGULAR Tables</h5>
                                        <span className="text-xs text-slate-400">Apply to all Regular tables</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Hourly Rate (Rp)"
                                            className="flex-1 bg-[#050a07] border border-[#1e3328] rounded p-2 text-white"
                                            id="regular-rate-input"
                                        />
                                        <button
                                            onClick={async () => {
                                                const input = document.getElementById('regular-rate-input') as HTMLInputElement;
                                                const rate = Number(input.value);
                                                if (!rate) return showToast('error', 'Please enter a valid rate');
                                                if (!confirm(`Update ALL REGULAR tables to Rp ${rate.toLocaleString()}?`)) return;

                                                try {
                                                    const res = await fetch('/api/tables/update-rates', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ type: 'REGULAR', rate })
                                                    });
                                                    if (!res.ok) throw new Error('Failed to update');
                                                    showToast('success', 'Regular rates updated');
                                                    mutateTables();
                                                } catch (e) { showToast('error', 'Failed to update rates'); }
                                            }}
                                            className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded text-sm"
                                        >
                                            Update All
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-[#16261d] p-4 rounded-lg border border-[#1e3328]">
                                    <div className="flex justify-between items-center mb-3">
                                        <h5 className="font-bold text-red-400">SNOOKER Tables</h5>
                                        <span className="text-xs text-slate-400">Apply to all Snooker tables</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            placeholder="Hourly Rate (Rp)"
                                            className="flex-1 bg-[#050a07] border border-[#1e3328] rounded p-2 text-white"
                                            id="snooker-rate-input"
                                        />
                                        <button
                                            onClick={async () => {
                                                const input = document.getElementById('snooker-rate-input') as HTMLInputElement;
                                                const rate = Number(input.value);
                                                if (!rate) return showToast('error', 'Please enter a valid rate');
                                                if (!confirm(`Update ALL SNOOKER tables to Rp ${rate.toLocaleString()}?`)) return;

                                                try {
                                                    const res = await fetch('/api/tables/update-rates', {
                                                        method: 'POST',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ type: 'SNOOKER', rate })
                                                    });
                                                    if (!res.ok) throw new Error('Failed to update');
                                                    showToast('success', 'Snooker rates updated');
                                                    mutateTables();
                                                } catch (e) { showToast('error', 'Failed to update rates'); }
                                            }}
                                            className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white font-bold rounded text-sm"
                                        >
                                            Update All
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table List View */}
                        <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-[#16261d]">
                                    <tr>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">ID</th>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">Name</th>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">Type</th>
                                        <th className="text-left p-4 text-xs text-slate-500 uppercase font-bold">Hourly Rate</th>
                                        <th className="text-right p-4 text-xs text-slate-500 uppercase font-bold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tables.map((table: any) => (
                                        <tr key={table.id} className="border-t border-[#1e3328] hover:bg-[#16261d]">
                                            <td className="p-4 text-slate-500 font-mono text-sm">{table.id}</td>
                                            <td className="p-4 text-white font-bold">{table.name}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold 
                                                    ${table.type === 'VIP' ? 'bg-[#eab308]/20 text-[#eab308]' :
                                                        table.type === 'SNOOKER' ? 'bg-red-500/20 text-red-500' :
                                                            'bg-slate-500/20 text-slate-400'}`}>
                                                    {table.type}
                                                </span>
                                            </td>
                                            <td className="p-4 text-[#22c55e] font-mono">
                                                Rp {table.hourlyRate?.toLocaleString()} / jam
                                            </td>
                                            <td className="p-4 text-right">
                                                <button onClick={() => { setEditTable(table); setShowTableModal(true); }}
                                                    className="p-2 text-slate-400 hover:text-white mr-2">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDeleteTable(table.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Printers Tab */}
                {activeTab === 'printers' && (
                    <div className="max-w-xl">
                        <h3 className="text-2xl font-bold text-white mb-6">Printer Configuration</h3>
                        <div className="bg-[#0f1a14] border border-[#1e3328] rounded-xl p-6 space-y-4">
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Bar Printer (Drinks)</label>
                                <input type="text" value={printerSettings.barPrinter}
                                    onChange={e => setPrinterSettings({ ...printerSettings, barPrinter: e.target.value })}
                                    placeholder="IP Address e.g., 192.168.1.101"
                                    className="w-full bg-[#050a07] border border-[#1e3328] rounded p-3 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Kitchen Printer (Food)</label>
                                <input type="text" value={printerSettings.kitchenPrinter}
                                    onChange={e => setPrinterSettings({ ...printerSettings, kitchenPrinter: e.target.value })}
                                    placeholder="IP Address e.g., 192.168.1.102"
                                    className="w-full bg-[#050a07] border border-[#1e3328] rounded p-3 text-white" />
                            </div>
                            <div>
                                <label className="text-xs text-slate-500 uppercase font-bold block mb-2">Cashier Printer (Receipts)</label>
                                <input type="text" value={printerSettings.cashierPrinter}
                                    onChange={e => setPrinterSettings({ ...printerSettings, cashierPrinter: e.target.value })}
                                    placeholder="USB Port e.g., USB-001"
                                    className="w-full bg-[#050a07] border border-[#1e3328] rounded p-3 text-white" />
                            </div>
                            <button onClick={handleSavePrinters}
                                className="w-full py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded flex items-center justify-center gap-2">
                                <Save size={18} /> Save Configuration
                            </button>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {showUserModal && (
                <UserModal
                    user={editUser}
                    onClose={() => setShowUserModal(false)}
                    onSave={() => { setShowUserModal(false); mutateUsers(); }}
                />
            )}
            {showTableModal && (
                <TableModal
                    table={editTable}
                    onClose={() => setShowTableModal(false)}
                    onSave={() => { setShowTableModal(false); mutateTables(); }}
                />
            )}
        </div>
    );
}
