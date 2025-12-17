'use client';

import React, { useState } from 'react';
import useSWR, { mutate } from 'swr';
import {
    Package, AlertTriangle, Plus, Minus, Search,
    Filter, ArrowDown, ArrowUp, CheckCircle, X
} from 'lucide-react';
import { useToast } from '@/components/toast-provider';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
};

// Stock Adjustment Modal
function AdjustmentModal({ product, onClose, onSuccess }: { product: any; onClose: () => void; onSuccess: () => void; }) {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
    const [quantity, setQuantity] = useState(1);
    const [reason, setReason] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch('/api/stock-adjustments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: product.id, adjustType, quantity, reason: reason || undefined }),
            });
            if (res.ok) {
                showToast('success', `Stok berhasil ${adjustType === 'IN' ? 'ditambah' : 'dikurangi'}`);
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                showToast('error', data.error || 'Gagal mengupdate stok');
            }
        } catch {
            showToast('error', 'Terjadi kesalahan');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl w-full max-w-md shadow-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid var(--border-default)' }}>
                    <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Adjustment Stok</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]">
                        <X className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <Package className="w-10 h-10" style={{ color: 'var(--text-muted)' }} />
                        <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</p>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Stok saat ini: {product.stockQty}</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Jenis Adjustment</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setAdjustType('IN')} className="flex items-center justify-center gap-2 py-3 rounded-lg transition-all" style={{
                                backgroundColor: adjustType === 'IN' ? 'rgba(180, 229, 13, 0.15)' : 'transparent',
                                border: adjustType === 'IN' ? '1px solid var(--accent-primary)' : '1px solid var(--border-default)',
                                color: adjustType === 'IN' ? 'var(--accent-primary)' : 'var(--text-muted)'
                            }}>
                                <ArrowDown className="w-4 h-4" /> Stok Masuk
                            </button>
                            <button type="button" onClick={() => setAdjustType('OUT')} className="flex items-center justify-center gap-2 py-3 rounded-lg transition-all" style={{
                                backgroundColor: adjustType === 'OUT' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                border: adjustType === 'OUT' ? '1px solid var(--danger)' : '1px solid var(--border-default)',
                                color: adjustType === 'OUT' ? 'var(--danger)' : 'var(--text-muted)'
                            }}>
                                <ArrowUp className="w-4 h-4" /> Stok Keluar
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Jumlah</label>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]" style={{ border: '1px solid var(--border-default)' }}>
                                <Minus className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </button>
                            <input type="number" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))} min={1}
                                className="flex-1 px-4 py-2 text-center text-xl font-bold rounded-lg"
                                style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                            <button type="button" onClick={() => setQuantity(quantity + 1)} className="p-2 rounded-lg hover:bg-[var(--bg-elevated)]" style={{ border: '1px solid var(--border-default)' }}>
                                <Plus className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>Alasan (opsional)</label>
                        <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Contoh: Restok mingguan, Expired, dll"
                            className="w-full px-3 py-2 rounded-lg resize-none"
                            style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} rows={2} />
                    </div>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-elevated)' }}>
                        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>Stok Setelah Adjustment:</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            {adjustType === 'IN' ? product.stockQty + quantity : Math.max(0, product.stockQty - quantity)}
                        </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={onClose} className="flex-1 py-2.5 px-4 rounded-lg" style={{ border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>Batal</button>
                        <button type="submit" disabled={loading} className="flex-1 py-2.5 px-4 rounded-lg transition-all disabled:opacity-50" style={{
                            backgroundColor: adjustType === 'IN' ? 'var(--accent-primary)' : 'var(--danger)',
                            color: 'var(--text-inverse)'
                        }}>
                            {loading ? 'Memproses...' : 'Simpan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function InventoryControlPage() {
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [showLowStock, setShowLowStock] = useState(false);
    const [adjustingProduct, setAdjustingProduct] = useState<any>(null);

    const { data: productsData, isLoading } = useSWR('/api/products', fetcher);
    const products = productsData?.data || [];

    const filteredProducts = products.filter((p: any) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        const matchLowStock = !showLowStock || p.stockQty < 10;
        return matchSearch && matchCategory && matchLowStock && p.isActive;
    });

    const lowStockCount = products.filter((p: any) => p.stockQty < 10 && p.isActive).length;
    const outOfStockCount = products.filter((p: any) => p.stockQty === 0 && p.isActive).length;
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.stockQty * Number(p.price)), 0);

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Kontrol Inventori</h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Kelola stok produk dan adjustment</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}>
                            <Package className="w-5 h-5" style={{ color: '#3b82f6' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Produk</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{products.length}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg p-5 cursor-pointer transition-all" onClick={() => setShowLowStock(!showLowStock)}
                    style={{ backgroundColor: 'var(--bg-surface)', border: showLowStock ? '2px solid #f59e0b' : '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                            <AlertTriangle className="w-5 h-5" style={{ color: '#f59e0b' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Stok Rendah</p>
                            <p className="text-xl font-bold" style={{ color: '#f59e0b' }}>{lowStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                            <Package className="w-5 h-5" style={{ color: 'var(--danger)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Habis</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--danger)' }}>{outOfStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)' }}>
                            <CheckCircle className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <div>
                            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Nilai Stok</p>
                            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalValue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--text-muted)' }} />
                    <input type="text" placeholder="Cari produk..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg"
                        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }} />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2.5 rounded-lg"
                    style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}>
                    <option value="ALL">Semua Kategori</option>
                    <option value="FOOD">Makanan</option>
                    <option value="DRINK">Minuman</option>
                    <option value="SNACK">Snack</option>
                </select>
            </div>

            <div className="rounded-lg overflow-hidden" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
                {isLoading ? (
                    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Memuat data...</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr style={{ backgroundColor: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-default)' }}>
                                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Produk</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Kategori</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Harga</th>
                                    <th className="text-center px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Stok</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Nilai</th>
                                    <th className="text-right px-6 py-4 text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-8 text-center" style={{ color: 'var(--text-muted)' }}>Tidak ada produk ditemukan</td></tr>
                                ) : (
                                    filteredProducts.map((product: any) => (
                                        <tr key={product.id} className="hover:bg-[var(--bg-elevated)]" style={{ borderBottom: '1px solid var(--border-default)' }}>
                                            <td className="px-6 py-4 font-medium" style={{ color: 'var(--text-primary)' }}>{product.name}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{
                                                    backgroundColor: product.category === 'FOOD' ? 'rgba(245, 158, 11, 0.15)' : product.category === 'DRINK' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(139, 92, 246, 0.15)',
                                                    color: product.category === 'FOOD' ? '#f59e0b' : product.category === 'DRINK' ? '#3b82f6' : '#8b5cf6'
                                                }}>{product.category}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right" style={{ color: 'var(--text-muted)' }}>{formatCurrency(Number(product.price))}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium" style={{
                                                    backgroundColor: product.stockQty === 0 ? 'rgba(239, 68, 68, 0.15)' : product.stockQty < 10 ? 'rgba(245, 158, 11, 0.15)' : 'rgba(180, 229, 13, 0.15)',
                                                    color: product.stockQty === 0 ? 'var(--danger)' : product.stockQty < 10 ? '#f59e0b' : 'var(--accent-primary)'
                                                }}>
                                                    {product.stockQty === 0 && <AlertTriangle className="w-3 h-3" />}
                                                    {product.stockQty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(product.stockQty * Number(product.price))}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => setAdjustingProduct(product)} className="px-3 py-1.5 text-sm rounded-lg transition-colors"
                                                    style={{ backgroundColor: 'rgba(180, 229, 13, 0.15)', color: 'var(--accent-primary)' }}>Adjust</button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {adjustingProduct && (
                <AdjustmentModal product={adjustingProduct} onClose={() => setAdjustingProduct(null)} onSuccess={() => mutate('/api/products')} />
            )}
        </div>
    );
}
