'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    Package, Plus, Search, Edit2, Trash2, X, AlertTriangle,
    Utensils, Coffee, Cookie
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

const ProductModal = ({ product, onClose, onSave }: { product?: any, onClose: () => void, onSave: () => void }) => {
    const isEdit = !!product;
    const [formData, setFormData] = useState({
        id: product?.id || `P${Date.now()}`,
        name: product?.name || '',
        category: product?.category || 'FOOD',
        price: product?.price || 0,
        stockQty: product?.stockQty || 0,
        imageUrl: product?.imageUrl || ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const url = isEdit ? `/api/products/${product.id}` : '/api/products';
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to save');
            onSave();
        } catch (error) {
            alert('Gagal menyimpan produk');
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">{isEdit ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {!isEdit && (
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Kode Produk</label>
                            <input
                                type="text"
                                required
                                value={formData.id}
                                onChange={e => setFormData({ ...formData, id: e.target.value })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none font-mono"
                            />
                        </div>
                    )}

                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Nama Produk</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Kategori</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                        >
                            <option value="FOOD">Food</option>
                            <option value="DRINK">Drink</option>
                            <option value="SNACK">Snack</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Harga (Rp)</label>
                            <input
                                type="number"
                                min={0}
                                required
                                value={formData.price}
                                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Stok</label>
                            <input
                                type="number"
                                min={0}
                                required
                                value={formData.stockQty}
                                onChange={e => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-3 bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black font-bold rounded-lg disabled:opacity-50"
                    >
                        {isSubmitting ? 'Menyimpan...' : (isEdit ? 'Simpan Perubahan' : 'Tambah Produk')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function InventoryPage() {
    const { data: productsData, mutate } = useSWR('/api/products', fetcher);
    const products = productsData?.data || [];

    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<any>(null);
    const [search, setSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus produk ini?')) return;
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        mutate();
    };

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'FOOD': return <Utensils size={16} />;
            case 'DRINK': return <Coffee size={16} />;
            case 'SNACK': return <Cookie size={16} />;
            default: return <Package size={16} />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'FOOD': return 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10';
            case 'DRINK': return 'text-[#0ea5e9] bg-[#0ea5e9]/10';
            case 'SNACK': return 'text-[var(--accent-secondary)] bg-[#eab308]/10';
            default: return 'text-[var(--text-muted)] bg-slate-400/10';
        }
    };

    const filteredProducts = products.filter((p: any) => {
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase());
        const matchCategory = categoryFilter === 'ALL' || p.category === categoryFilter;
        return matchSearch && matchCategory;
    });

    const lowStockCount = products.filter((p: any) => p.stockQty < 10).length;

    return (
        <div className="flex flex-1 flex-col overflow-hidden bg-[var(--bg-base)] h-full">
            <div className="px-6 py-6 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-1">Inventory Management</h2>
                    <p className="text-[var(--text-muted)] text-sm">Kelola produk F&B dan stok.</p>
                </div>
                <div className="flex gap-3">
                    {lowStockCount > 0 && (
                        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 px-3 py-2 rounded text-sm font-medium">
                            <AlertTriangle size={16} /> {lowStockCount} Low Stock
                        </div>
                    )}
                    <button
                        onClick={() => { setEditingProduct(null); setShowModal(true); }}
                        className="flex items-center gap-2 bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black px-4 py-2 rounded text-sm font-bold transition-colors"
                    >
                        <Plus size={16} /> Tambah Produk
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            placeholder="Cari produk..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg pl-10 pr-4 py-2 text-[var(--text-primary)] text-sm focus:border-[var(--accent-primary)] outline-none"
                        />
                    </div>
                    <div className="flex gap-2">
                        {['ALL', 'FOOD', 'DRINK', 'SNACK'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-4 py-2 rounded text-sm font-medium border transition-colors
                                    ${categoryFilter === cat ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]' : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-default)] hover:border-slate-500'}
                                `}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredProducts.map((product: any) => (
                        <div key={product.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-4 hover:border-[var(--accent-primary)]/50 transition-colors group">
                            <div className="flex justify-between items-start mb-3">
                                <div className={`p-2 rounded ${getCategoryColor(product.category)}`}>
                                    {getCategoryIcon(product.category)}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditingProduct(product); setShowModal(true); }} className="p-1.5 rounded bg-[#eab308]/10 text-[var(--accent-secondary)] hover:bg-[#eab308]/20">
                                        <Edit2 size={12} />
                                    </button>
                                    <button onClick={() => handleDelete(product.id)} className="p-1.5 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-[var(--text-primary)] mb-1 truncate">{product.name}</h3>
                            <p className="text-xs text-[var(--text-muted)] font-mono mb-3">{product.id}</p>

                            <div className="flex justify-between items-end">
                                <span className="text-[var(--accent-primary)] font-bold font-mono">Rp {Number(product.price).toLocaleString()}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${product.stockQty < 10 ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/20 text-[var(--text-muted)]'}`}>
                                    Stok: {product.stockQty}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-12 text-[var(--text-muted)]">
                        <Package size={48} className="mx-auto mb-4 opacity-50" />
                        <p>Tidak ada produk ditemukan.</p>
                    </div>
                )}
            </div>

            {showModal && (
                <ProductModal
                    product={editingProduct}
                    onClose={() => setShowModal(false)}
                    onSave={() => { setShowModal(false); mutate(); }}
                />
            )}
        </div>
    );
}
