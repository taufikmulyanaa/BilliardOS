'use client';

import React, { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Building, Phone, Mail, Clock, DollarSign, Save, Printer, FileText, Download, Globe, Loader } from 'lucide-react';
import { useToast } from '@/components/toast-provider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function SettingsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);

    const { data: configData, isLoading } = useSWR('/api/config', fetcher);

    const [settings, setSettings] = useState({
        businessName: 'BilliardOS', address: 'Jl. Billiard No. 123, Jakarta', phone: '021-1234567',
        email: 'info@billiardos.com', taxRate: '10', openTime: '10:00', closeTime: '23:00',
        receiptHeader: 'Terima kasih telah berkunjung!', receiptFooter: 'Sampai jumpa kembali!',
    });

    useEffect(() => {
        if (configData?.data) setSettings(prev => ({ ...prev, ...configData.data }));
    }, [configData]);

    const handleChange = (key: string, value: string) => setSettings({ ...settings, [key]: value });

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/config', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(settings) });
            if (res.ok) showToast('success', 'Pengaturan berhasil disimpan');
            else showToast('error', 'Gagal menyimpan pengaturan');
        } catch { showToast('error', 'Terjadi kesalahan'); }
        setLoading(false);
    };

    const handleExport = async (type: string) => {
        setExporting(type);
        try {
            const res = await fetch(`/api/export?type=${type}`);
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
                showToast('success', `Export ${type} berhasil`);
            } else showToast('error', 'Gagal export data');
        } catch { showToast('error', 'Terjadi kesalahan'); }
        setExporting(null);
    };

    if (isLoading) return <div className="flex items-center justify-center h-64"><Loader className="w-8 h-8 animate-spin" style={{ color: 'var(--accent-primary)' }} /></div>;

    const inputStyle = { backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Pengaturan Sistem</h2>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Konfigurasi bisnis dan aplikasi</p>
                </div>
                <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all disabled:opacity-50"
                    style={{ background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))', color: 'var(--text-inverse)' }}>
                    {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
                </button>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <Building className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Informasi Bisnis</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Nama Bisnis</label>
                        <input type="text" value={settings.businessName} onChange={(e) => handleChange('businessName', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}><Phone className="w-4 h-4 inline mr-1" />Telepon</label>
                        <input type="text" value={settings.phone} onChange={(e) => handleChange('phone', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}><Globe className="w-4 h-4 inline mr-1" />Alamat</label>
                        <textarea value={settings.address} onChange={(e) => handleChange('address', e.target.value)} className="w-full px-4 py-2.5 rounded-lg resize-none focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} rows={2} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}><Mail className="w-4 h-4 inline mr-1" />Email</label>
                        <input type="email" value={settings.email} onChange={(e) => handleChange('email', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                </div>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <Clock className="w-5 h-5" style={{ color: '#3b82f6' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Jam Operasional</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Jam Buka</label>
                        <input type="time" value={settings.openTime} onChange={(e) => handleChange('openTime', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Jam Tutup</label>
                        <input type="time" value={settings.closeTime} onChange={(e) => handleChange('closeTime', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                </div>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <DollarSign className="w-5 h-5" style={{ color: '#f59e0b' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Pengaturan Pajak</h3>
                </div>
                <div className="max-w-xs">
                    <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Tarif PPN (%)</label>
                    <div className="relative">
                        <input type="number" value={settings.taxRate} onChange={(e) => handleChange('taxRate', e.target.value)} min={0} max={100} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>%</span>
                    </div>
                </div>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <Printer className="w-5 h-5" style={{ color: '#8b5cf6' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Pengaturan Struk</h3>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Header Struk</label>
                        <input type="text" value={settings.receiptHeader} onChange={(e) => handleChange('receiptHeader', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Footer Struk</label>
                        <input type="text" value={settings.receiptFooter} onChange={(e) => handleChange('receiptFooter', e.target.value)} className="w-full px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-[var(--accent-primary)]" style={inputStyle} />
                    </div>
                </div>
            </div>

            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                <div className="flex items-center gap-2 mb-6">
                    <FileText className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Export Data</h3>
                </div>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Download data dalam format Excel untuk backup atau analisis eksternal.</p>
                <div className="flex flex-wrap gap-3">
                    {['transactions', 'members', 'inventory', 'shifts'].map((type) => (
                        <button key={type} onClick={() => handleExport(type)} disabled={exporting !== null} className="flex items-center gap-2 px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50"
                            style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>
                            {exporting === type ? <Loader className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                            Export {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
