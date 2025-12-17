'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { useToast } from '@/components/toast-provider';
import {
    Search, Plus, Minus, ShoppingCart, Trash2,
    Utensils, Coffee, Pizza, CreditCard, Banknote, QrCode, X, Table2
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Product {
    id: string;
    name: string;
    category: string;
    price: number;
    stockQty: number;
    imageUrl?: string;
    description?: string;
}

interface CartItem extends Product {
    qty: number;
}

// Order Options Modal
const OrderOptionsModal = ({
    cart,
    onClose,
    onPayDirect,
    onAddToTable
}: {
    cart: CartItem[],
    onClose: () => void,
    onPayDirect: () => void,
    onAddToTable: (tableId: string, sessionId: number) => void
}) => {
    const { data: tablesData } = useSWR('/api/tables', fetcher);
    const activeTables = (tablesData?.data || []).filter((t: any) =>
        t.status === 'ACTIVE' && t.activeSession
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-[var(--border-default)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Pilih Tujuan Pesanan</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-white">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Option 1: Pay Directly */}
                    <button
                        onClick={onPayDirect}
                        className="w-full p-4 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-primary)] transition-all flex items-center gap-4"
                    >
                        <div className="p-3 bg-[var(--accent-primary)]/20 rounded-lg text-[var(--accent-primary)]">
                            <Banknote size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-white">Bayar Langsung</h4>
                            <p className="text-xs text-[var(--text-muted)]">Pesanan tanpa meja, bayar sekarang</p>
                        </div>
                    </button>

                    {/* Option 2: Add to Table */}
                    <div className="pt-2">
                        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                            Atau Tambah ke Meja Aktif
                        </h4>
                        {activeTables.length === 0 ? (
                            <div className="text-center py-6 text-[var(--text-muted)]">
                                <Table2 size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">Tidak ada meja aktif saat ini</p>
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {activeTables.map((table: any) => (
                                    <button
                                        key={table.id}
                                        onClick={() => onAddToTable(table.id, table.activeSession.id)}
                                        className="w-full p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-primary)] transition-all flex items-center justify-between"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-[#0f391e] rounded text-[var(--accent-primary)]">
                                                <Table2 size={18} />
                                            </div>
                                            <div className="text-left">
                                                <h5 className="font-bold text-white text-sm">{table.name}</h5>
                                                <p className="text-xs text-[var(--text-muted)]">{table.activeSession.customerName}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-[var(--accent-primary)] font-mono">
                                            +{cart.length} item
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default function POSPage() {
    const { showToast } = useToast();
    const { data: productsData } = useSWR('/api/products', fetcher);
    const products: Product[] = productsData?.data || [];

    const [activeCategory, setActiveCategory] = useState('Semua');
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showOptions, setShowOptions] = useState(false);

    // Category mapping
    const categoryMap: Record<string, string> = {
        'Semua': 'ALL',
        'Makanan': 'FOOD',
        'Minuman': 'DRINK',
        'Snack': 'SNACK'
    };

    const filteredProducts = products.filter(p => {
        const targetCat = categoryMap[activeCategory];
        const matchCat = activeCategory === 'Semua' || p.category === targetCat;
        const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const addToCart = (product: Product) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(p => {
            if (p.id === id) return { ...p, qty: Math.max(0, p.qty + delta) };
            return p;
        }).filter(p => p.qty > 0));
    };

    const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
    const tax = subtotal * 0.11;
    const total = subtotal + tax;

    const handlePayDirect = async () => {
        try {
            const payload = {
                paymentMethod: 'CASH',
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    qty: item.qty,
                    type: 'PRODUCT'
                }))
            };
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast('success', 'Pesanan berhasil diproses! Pembayaran selesai.');
                setCart([]);
                setShowOptions(false);
            } else {
                const errData = await res.json();
                showToast('error', 'Gagal: ' + (errData.error || 'Unknown error'));
            }
        } catch (e) {
            showToast('error', 'Error memproses pesanan');
        }
    };

    const handleAddToTable = async (tableId: string, sessionId: number) => {
        try {
            const payload = {
                sessionId,
                paymentMethod: 'CASH',
                items: cart.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    qty: item.qty,
                    type: 'PRODUCT'
                }))
            };
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                showToast('success', 'Pesanan ditambahkan ke meja! Akan dibayar saat checkout.');
                setCart([]);
                setShowOptions(false);
            } else {
                const errData = await res.json();
                showToast('error', 'Gagal: ' + (errData.error || 'Unknown error'));
            }
        } catch (e) {
            showToast('error', 'Error menambah pesanan ke meja');
        }
    };

    return (
        <div className="flex flex-1 overflow-hidden relative h-full bg-[var(--bg-base)]">
            {/* Order Options Modal */}
            {showOptions && (
                <OrderOptionsModal
                    cart={cart}
                    onClose={() => setShowOptions(false)}
                    onPayDirect={handlePayDirect}
                    onAddToTable={handleAddToTable}
                />
            )}

            {/* Main Menu Grid */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar */}
                <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex justify-between items-center z-20 shadow-md">
                    <div className="flex gap-2 bg-[var(--bg-base)] p-1 rounded border border-[var(--border-default)]">
                        {['Semua', 'Makanan', 'Minuman', 'Snack'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4 py-1.5 text-sm font-medium rounded transition-all flex items-center gap-2
                      ${activeCategory === cat ? 'bg-[var(--accent-primary)] text-black shadow-sm' : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--bg-surface)]'}
                    `}
                            >
                                {cat === 'Makanan' && <Utensils size={14} />}
                                {cat === 'Minuman' && <Coffee size={14} />}
                                {cat === 'Snack' && <Pizza size={14} />}
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative group min-w-[300px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent-primary)]">
                            <Search size={18} />
                        </span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-full py-2 pl-10 pr-4 text-sm text-white focus:ring-1 focus:ring-[var(--accent-primary)] focus:border-[var(--accent-primary)] placeholder:text-[var(--text-muted)] outline-none transition-all"
                            placeholder="Cari menu..."
                        />
                    </div>
                </div>

                {/* Menu Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map(item => (
                            <div key={item.id} className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg overflow-hidden flex flex-col group hover:border-[var(--accent-primary)]/50 transition-all">
                                <div className="aspect-square bg-cover bg-center relative" style={{ backgroundImage: `url("${item.imageUrl || '/api/placeholder/400/320'}")` }}>
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="bg-[var(--accent-primary)] text-black font-bold py-2 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all flex items-center gap-2"
                                        >
                                            <Plus size={18} /> Tambah
                                        </button>
                                    </div>
                                </div>
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-white text-lg line-clamp-1" title={item.name}>{item.name}</h4>
                                    </div>
                                    <p className="text-xs text-[var(--text-muted)] mb-3 line-clamp-2 min-h-[2.5em]">{item.description || 'Menu favorit pelanggan.'}</p>
                                    <div className="mt-auto flex items-center justify-between">
                                        <span className="text-[var(--accent-primary)] font-bold text-lg">Rp {Number(item.price).toLocaleString()}</span>
                                        <button onClick={() => addToCart(item)} className="p-2 bg-[var(--bg-surface)] rounded-full text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-black transition-colors border border-[var(--border-default)]">
                                            <Plus size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            {/* Cart Sidebar */}
            <aside className="w-[360px] bg-[var(--bg-card)] border-l border-[var(--border-default)] flex flex-col shrink-0 z-30 shadow-xl">
                <div className="p-5 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <ShoppingCart size={20} className="text-[var(--accent-primary)]" /> Pesanan Baru
                    </h3>
                    <span className="text-xs bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-1 rounded font-mono">
                        #M01
                    </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-50">
                            <ShoppingCart size={48} className="mb-2" />
                            <p className="text-sm">Keranjang kosong</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.id} className="flex gap-3 bg-[var(--bg-base)] p-3 rounded border border-[var(--border-default)]">
                                <div className="size-14 bg-cover bg-center rounded border border-[var(--border-default)]" style={{ backgroundImage: `url("${item.imageUrl}")` }}></div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-white text-sm truncate mb-1">{item.name}</h4>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-[var(--accent-primary)]">Rp {(Number(item.price) * item.qty).toLocaleString()}</span>
                                        <div className="flex items-center gap-3 bg-[var(--bg-surface)] rounded px-1 py-0.5 border border-[var(--border-default)]">
                                            <button onClick={() => updateQty(item.id, -1)} className="text-[var(--text-muted)] hover:text-white p-0.5"><Minus size={12} /></button>
                                            <span className="text-xs font-bold w-4 text-center">{item.qty}</span>
                                            <button onClick={() => updateQty(item.id, 1)} className="text-[var(--accent-primary)] p-0.5"><Plus size={12} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-5 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
                    <div className="space-y-2 mb-4 text-sm">
                        <div className="flex justify-between text-[var(--text-muted)]">
                            <span>Subtotal</span>
                            <span>Rp {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[var(--text-muted)]">
                            <span>Pajak (11%)</span>
                            <span>Rp {tax.toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-[var(--border-default)] my-2"></div>
                        <div className="flex justify-between text-lg font-bold text-white">
                            <span>Total</span>
                            <span className="text-[var(--accent-primary)]">Rp {total.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            className="flex-1 py-3 bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-white border border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/20 rounded font-bold transition-all"
                            onClick={() => setCart([])}
                        >
                            Batal
                        </button>
                        <button
                            disabled={cart.length === 0}
                            onClick={() => setShowOptions(true)}
                            className="flex-[2] py-3 bg-[var(--accent-primary)] hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-elevated)] disabled:text-[var(--text-muted)] text-black font-bold rounded shadow-lg shadow-[var(--accent-primary)]/20 transition-all active:scale-95"
                        >
                            Proses Pesanan
                        </button>
                    </div>
                </div>
            </aside>
        </div>
    );
}
