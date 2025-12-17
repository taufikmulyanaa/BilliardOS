'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import useSWR from 'swr';
import { useToast } from '@/components/toast-provider';
import {
    Clock, Plus, Users, Play, Pause, Square,
    Receipt, ArrowRightLeft, X, LayoutGrid, List, RefreshCw, ChevronRight,
    Banknote, QrCode, CreditCard, Coffee, Printer, Settings, Minus, ShoppingCart,
    Utensils, Cookie, Tag, Star, FileText, Trash2
} from 'lucide-react';
import { CheckoutModal } from '@/components/CheckoutModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// Real-time timer component that calculates billing client-side
const RealTimeTimer = ({
    startTime,
    endTime,
    hourlyRate,
    isPaused,
    onTimeUp,
    onWarning
}: {
    startTime: string,
    endTime?: string | null,
    hourlyRate: number,
    isPaused?: boolean,
    onTimeUp?: () => void,
    onWarning?: () => void
}) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [warned, setWarned] = useState(false);
    const [expired, setExpired] = useState(false);

    const isFixedPackage = !!endTime;
    const endTimeMs = endTime ? new Date(endTime).getTime() : 0;
    const startTimeMs = new Date(startTime).getTime();
    const totalPackageSeconds = isFixedPackage ? Math.floor((endTimeMs - startTimeMs) / 1000) : 0;

    useEffect(() => {
        if (isPaused) return;

        const updateTimer = () => {
            const now = Date.now();
            const seconds = Math.floor((now - startTimeMs) / 1000);
            setElapsedSeconds(seconds);

            // For fixed packages, check if time is almost up or expired
            if (isFixedPackage && !expired) {
                const remainingSeconds = Math.floor((endTimeMs - now) / 1000);

                // Warning at 5 minutes (300 seconds)
                if (remainingSeconds <= 300 && remainingSeconds > 0 && !warned) {
                    setWarned(true);
                    onWarning?.();
                }

                // Time's up
                if (remainingSeconds <= 0) {
                    setExpired(true);
                    onTimeUp?.();
                }
            }
        };

        updateTimer(); // Initial
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTimeMs, endTimeMs, isFixedPackage, isPaused, warned, expired, onTimeUp, onWarning]);

    const totalMinutes = Math.floor(elapsedSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = elapsedSeconds % 60;

    // For fixed package: show fixed price, for open: calculate
    const bill = isFixedPackage
        ? Math.ceil((totalPackageSeconds / 3600) * hourlyRate)
        : Math.ceil((elapsedSeconds / 3600) * hourlyRate);

    // Countdown display for fixed packages
    const remainingSeconds = isFixedPackage ? Math.max(0, totalPackageSeconds - elapsedSeconds) : 0;
    const remainMins = Math.floor(remainingSeconds / 60);
    const remainSecs = remainingSeconds % 60;

    // Time display - show elapsed or remaining based on package type
    const timeDisplay = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Determine styling based on remaining time
    const isAlmostUp = isFixedPackage && remainingSeconds <= 300 && remainingSeconds > 0;
    const isTimeUp = isFixedPackage && remainingSeconds <= 0;
    const timerColor = isTimeUp ? 'text-red-500' : isAlmostUp ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-primary)]';
    const billColor = isTimeUp ? 'text-red-500' : 'text-[var(--accent-primary)]';

    return (
        <div className="text-center w-full">
            <div className={`text-2xl font-mono font-bold tracking-widest ${timerColor} drop-shadow-md mb-1`}>
                {timeDisplay}
            </div>

            {/* Countdown info for fixed packages */}
            {isFixedPackage && (
                <div className={`text-[10px] font-mono mb-1 ${isTimeUp ? 'text-red-500 animate-pulse' : isAlmostUp ? 'text-[var(--accent-secondary)]' : 'text-[var(--text-muted)]'}`}>
                    {isTimeUp ? '⏰ WAKTU HABIS!' : `Sisa: ${remainMins}:${remainSecs.toString().padStart(2, '0')}`}
                </div>
            )}

            <div className="bg-[var(--bg-overlay)] rounded py-1 px-2 border border-white/10 w-full flex justify-between items-center">
                <span className="text-[8px] uppercase text-[var(--text-muted)] font-bold tracking-wider">
                    {isFixedPackage ? 'Paket' : 'Bill'}
                </span>
                <span className={`font-mono font-bold ${billColor} text-xs`}>
                    Rp {bill.toLocaleString()}
                </span>
            </div>
        </div>
    );
};

// Compact timer for list view
const ListViewTimer = ({ startTime, hourlyRate }: { startTime: string, hourlyRate: number }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();

        const updateTimer = () => {
            const now = Date.now();
            const seconds = Math.floor((now - start) / 1000);
            setElapsedSeconds(seconds);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const totalMinutes = Math.floor(elapsedSeconds / 60);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const secs = elapsedSeconds % 60;
    // Calculate bill per second for real-time update
    const bill = Math.ceil((elapsedSeconds / 3600) * hourlyRate);

    const timeDisplay = hours > 0
        ? `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        : `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    return (
        <>
            <div className="flex flex-col items-end">
                <span className="text-xs text-[var(--text-muted)] uppercase font-bold">Duration</span>
                <span className="font-mono font-bold text-[var(--text-primary)] text-lg">
                    {timeDisplay}
                </span>
            </div>
            <div className="flex flex-col items-end min-w-[100px]">
                <span className="text-xs text-[var(--text-muted)] uppercase font-bold">Current Bill</span>
                <span className="font-mono font-bold text-[var(--accent-primary)] text-lg">Rp {bill.toLocaleString()}</span>
            </div>
        </>
    );
};

// Real-time bill display for sidebar
const RealTimeBill = ({ startTime, hourlyRate }: { startTime: string, hourlyRate: number }) => {
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    useEffect(() => {
        const start = new Date(startTime).getTime();

        const updateTimer = () => {
            const now = Date.now();
            const seconds = Math.floor((now - start) / 1000);
            setElapsedSeconds(seconds);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const bill = Math.ceil((elapsedSeconds / 3600) * hourlyRate);

    return (
        <span className="font-bold text-lg text-[var(--accent-primary)] font-mono">
            Rp {bill.toLocaleString()}
        </span>
    );
};

const WaitingListSidebar = ({ onOpenWalkin, onOpenReservation }: { onOpenWalkin: () => void, onOpenReservation: () => void }) => {
    const { data: resData } = useSWR('/api/reservations', fetcher);
    const reservations = resData?.data || [];
    const [activeTab, setActiveTab] = useState<'walkin' | 'reservation'>('walkin');

    const walkIns = reservations.filter((r: any) => r.notes?.includes('WALK-IN') && r.status === 'PENDING');
    const futureReservations = reservations.filter((r: any) => !r.notes?.includes('WALK-IN') && r.status === 'CONFIRMED');

    const list = activeTab === 'walkin' ? walkIns : futureReservations;

    return (
        <>
            <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-card)]">
                <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">Antrian & Jadwal</h3>
                <div className="flex bg-[var(--bg-base)] rounded p-1 border border-[var(--border-default)]">
                    <button
                        onClick={() => setActiveTab('walkin')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'walkin' ? 'bg-[var(--accent-primary)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        Walk-In ({walkIns.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('reservation')}
                        className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${activeTab === 'reservation' ? 'bg-[var(--accent-secondary)] text-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                    >
                        Reservasi ({futureReservations.length})
                    </button>
                </div>
            </div>

            <div className="p-4 border-b border-[var(--border-default)]">
                <button
                    onClick={() => activeTab === 'walkin' ? onOpenWalkin() : onOpenReservation()}
                    className="w-full py-2 bg-[var(--bg-elevated)] hover:bg-[var(--accent-primary)] hover:text-black text-[var(--text-primary)] text-sm font-bold rounded border border-[var(--accent-primary)]/30 transition-colors flex items-center justify-center gap-2"
                >
                    <Plus size={16} /> {activeTab === 'walkin' ? 'Tambah Walk-In' : 'Buat Reservasi'}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {list.length === 0 ? (
                    <div className="text-center text-[var(--text-muted)] py-8 text-sm italic">
                        Belum ada data.
                    </div>
                ) : (
                    list.map((item: any, idx: number) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border-b border-[var(--border-default)] hover:bg-[var(--bg-card)] rounded transition-colors group">
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold border 
                            ${activeTab === 'walkin' ? 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-default)]' : 'bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] border-[var(--accent-secondary)]/30'}`}>
                                {activeTab === 'walkin' ? idx + 1 : <Clock size={14} />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between mb-0.5">
                                    <span className="font-bold text-sm text-[var(--text-primary)]">{item.customerName}</span>
                                    <span className="text-xs font-mono text-[var(--accent-secondary)]">{new Date(item.bookingTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex gap-2 text-xs text-[var(--text-muted)]">
                                    <span>{item.pax} Org</span>
                                    <span>•</span>
                                    <span>{item.tableType}</span>
                                </div>
                            </div>
                            <button className="p-2 hover:bg-[var(--accent-primary)]/20 hover:text-[var(--accent-primary)] rounded text-[var(--text-muted)] transition-colors">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </>
    );
};


const fetchMembers = async (query: string) => {
    if (!query) return [];
    const res = await fetch(`/api/members?q=${query}`);
    const data = await res.json();
    return data.data || [];
};

// Billing Options Modal - Fixed Hours or Open Bill
const BillingOptionsModal = ({
    hourlyRate,
    onClose,
    onSelect
}: {
    hourlyRate: number,
    onClose: () => void,
    onSelect: (type: 'open' | number, customerName: string) => void
}) => {
    const [customerName, setCustomerName] = useState('');

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-5 border-b border-[var(--border-default)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Mulai Sesi Baru</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* Customer Name Input */}
                    <div>
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2 block">
                            Nama Customer (Opsional)
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder="Isi nama customer..."
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg p-3 text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none transition-colors"
                        />
                    </div>

                    <div className="border-t border-[var(--border-default)] my-4"></div>

                    <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                        Pilih Mode Billing
                    </h4>

                    {/* Open Bill Option */}
                    <button
                        onClick={() => onSelect('open', customerName)}
                        className="w-full p-4 bg-[var(--bg-card)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-primary)] transition-all flex items-center gap-4 group"
                    >
                        <div className="p-3 bg-[var(--accent-primary)]/20 rounded-lg text-[var(--accent-primary)] group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-colors">
                            <Clock size={24} />
                        </div>
                        <div className="text-left flex-1">
                            <h4 className="font-bold text-[var(--text-primary)]">Open Bill</h4>
                            <p className="text-xs text-[var(--text-muted)]">Bayar sesuai durasi bermain</p>
                        </div>
                        <span className="text-xs text-[var(--accent-primary)] font-mono">Rp {hourlyRate.toLocaleString()}/jam</span>
                    </button>

                    {/* Fixed Hours Options */}
                    <div className="pt-2">
                        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                            Paket Jam (Fixed)
                        </h4>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((hours) => (
                                <button
                                    key={hours}
                                    onClick={() => onSelect(hours, customerName)}
                                    className="p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg hover:border-[var(--accent-secondary)] hover:bg-[var(--accent-secondary)]/10 transition-all flex flex-col items-center group"
                                >
                                    <span className="text-xl font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-secondary)]">{hours}</span>
                                    <span className="text-[10px] text-[var(--text-muted)]">JAM</span>
                                    <span className="text-[10px] text-[var(--accent-secondary)] font-mono mt-1">
                                        Rp {(hours * hourlyRate).toLocaleString()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// CheckoutModal imported from @/components/CheckoutModal
const TableTransferModal = ({ sourceTable, tables, onClose, onConfirm }: { sourceTable: any, tables: any[], onClose: () => void, onConfirm: (targetId: string) => void }) => {
    const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
    const availableTables = tables.filter(t => t.status === 'AVAILABLE' && t.id !== sourceTable.id);

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Pindah Meja</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <p className="text-[var(--text-muted)] text-sm mb-4">Pindahkan sesi dari <strong className="text-[var(--text-primary)]">{sourceTable.name}</strong> ke:</p>

                    <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto mb-6">
                        {availableTables.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setSelectedTarget(t.id)}
                                className={`p-3 rounded border text-left transition-all
                                    ${selectedTarget === t.id ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--text-primary)]' : 'bg-[var(--bg-base)] border-[var(--border-default)] text-[var(--text-muted)] hover:border-slate-500'}
                                `}
                            >
                                <span className="font-bold block">{t.name}</span>
                                <span className="text-xs opacity-70">{t.type}</span>
                            </button>
                        ))}
                        {availableTables.length === 0 && (
                            <div className="col-span-2 text-center text-[var(--text-muted)] py-4 italic">
                                Tidak ada meja kosong tersedia.
                            </div>
                        )}
                    </div>

                    <button
                        onClick={() => selectedTarget && onConfirm(selectedTarget)}
                        disabled={!selectedTarget}
                        className="w-full py-3 bg-[var(--accent-secondary)] hover:bg-yellow-500 text-black font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Konfirmasi Pindah
                    </button>
                </div>
            </div>
        </div>
    );
};

const PinModal = ({ validPin, onClose, onSuccess }: { validPin: string, onClose: () => void, onSuccess: () => void }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (pin === validPin) {
            onSuccess();
        } else {
            setError(true);
            setPin('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-card)] border border-[var(--border-default)] rounded-xl p-6 w-80">
                <h3 className="text-[var(--text-primary)] font-bold text-center mb-4">Manager PIN Required</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="password"
                        maxLength={6}
                        autoFocus
                        className={`w-full bg-black border rounded-lg text-center text-2xl tracking-widest py-3 text-[var(--text-primary)] outline-none ${error ? 'border-red-500' : 'border-[var(--border-default)] focus:border-[var(--accent-primary)]'}`}
                        value={pin}
                        onChange={e => { setPin(e.target.value); setError(false); }}
                        placeholder="••••••"
                    />
                    {error && <p className="text-red-500 text-xs text-center">PIN Salah</p>}
                    <div className="grid grid-cols-2 gap-2">
                        <button type="button" onClick={onClose} className="py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
                        <button type="submit" className="py-2 bg-[var(--accent-primary)] text-black font-bold rounded hover:bg-[#16a34a]">Enter</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const PrinterSettingsModal = ({ onClose }: { onClose: () => void }) => {
    const [saved, setSaved] = useState(false);

    // Simulate settings (in real app, useLocalStorage)
    const [settings, setSettings] = useState({
        barPrinter: '192.168.1.101',
        kitchenPrinter: '192.168.1.102',
        cashierPrinter: 'USB-001'
    });

    const handleSave = () => {
        // localStorage.setItem('printer_settings', JSON.stringify(settings)); 
        setSaved(true);
        setTimeout(() => { setSaved(false); onClose(); }, 1500);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2"><Printer size={20} /> Printer Configuration</h3>

                <div className="space-y-4 mb-8">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Bar Printer (Drinks)</label>
                        <input type="text" value={settings.barPrinter} onChange={e => setSettings({ ...settings, barPrinter: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Kitchen Printer (Food)</label>
                        <input type="text" value={settings.kitchenPrinter} onChange={e => setSettings({ ...settings, kitchenPrinter: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Cashier Printer (Receipts)</label>
                        <input type="text" value={settings.cashierPrinter} onChange={e => setSettings({ ...settings, cashierPrinter: e.target.value })} className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)] text-sm" />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 py-3 text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold border border-[var(--border-default)] rounded-lg">Cancel</button>
                    <button onClick={handleSave} className="flex-1 py-3 bg-[var(--accent-primary)] text-black font-bold rounded-lg hover:bg-[#16a34a]">
                        {saved ? 'Saved!' : 'Save Configuration'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Add Order Modal (F&B)
const AddOrderModal = ({ sessionId, onClose, onSuccess }: { sessionId: number, onClose: () => void, onSuccess: () => void }) => {
    const { data: productsData } = useSWR('/api/products', fetcher);
    const products = productsData?.data || [];
    const [cart, setCart] = useState<{ [id: string]: { product: any, qty: number } }>({});
    const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev[product.id];
            return {
                ...prev,
                [product.id]: {
                    product,
                    qty: existing ? existing.qty + 1 : 1
                }
            };
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => {
            const existing = prev[id];
            if (!existing) return prev;
            const newQty = existing.qty + delta;
            if (newQty <= 0) {
                const { [id]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [id]: { ...existing, qty: newQty } };
        });
    };

    const cartItems = Object.values(cart);
    const total = cartItems.reduce((sum, item) => sum + (Number(item.product.price) * item.qty), 0);

    const filteredProducts = products.filter((p: any) => categoryFilter === 'ALL' || p.category === categoryFilter);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'FOOD': return <Utensils size={16} />;
            case 'DRINK': return <Coffee size={16} />;
            case 'SNACK': return <Cookie size={16} />;
            default: return <Coffee size={16} />;
        }
    };

    const handleSubmit = async () => {
        if (cartItems.length === 0) return;
        setIsSubmitting(true);

        try {
            const items = cartItems.map(item => ({
                id: item.product.id,
                name: item.product.name,
                price: Number(item.product.price),
                qty: item.qty,
                type: 'PRODUCT'
            }));

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    paymentMethod: 'CASH', // Quick order, payment later at checkout
                    items
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to create order');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Order failed:', error);
            alert('Gagal membuat pesanan: ' + (error.message || 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-4xl h-[600px] flex overflow-hidden">
                {/* Products Grid */}
                <div className="flex-1 flex flex-col border-r border-[var(--border-default)]">
                    <div className="p-4 border-b border-[var(--border-default)] bg-[var(--bg-card)] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Tambah Pesanan F&B</h3>
                        <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                    </div>

                    {/* Category Tabs */}
                    <div className="p-3 border-b border-[var(--border-default)] flex gap-2">
                        {['ALL', 'FOOD', 'DRINK', 'SNACK'].map(cat => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1.5 text-xs font-bold rounded transition-colors
                                    ${categoryFilter === cat ? 'bg-[var(--accent-primary)] text-black' : 'bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Products */}
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-3 gap-3 content-start">
                        {filteredProducts.map((p: any) => (
                            <button
                                key={p.id}
                                onClick={() => addToCart(p)}
                                className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded-lg p-3 text-left hover:border-[var(--accent-primary)] transition-colors group"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 rounded bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                        {getCategoryIcon(p.category)}
                                    </div>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold">{p.category}</span>
                                </div>
                                <h4 className="font-bold text-[var(--text-primary)] text-sm truncate mb-1 group-hover:text-[var(--accent-primary)]">{p.name}</h4>
                                <p className="text-[var(--accent-primary)] font-mono text-sm">Rp {Number(p.price).toLocaleString()}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cart */}
                <div className="w-[280px] flex flex-col bg-[var(--bg-base)]">
                    <div className="p-4 border-b border-[var(--border-default)] flex items-center gap-2">
                        <ShoppingCart size={18} className="text-[var(--accent-primary)]" />
                        <h4 className="font-bold text-[var(--text-primary)]">Keranjang ({cartItems.length})</h4>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cartItems.length === 0 ? (
                            <p className="text-center text-[var(--text-muted)] text-sm py-8 italic">Keranjang kosong</p>
                        ) : (
                            cartItems.map(item => (
                                <div key={item.product.id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded p-2">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-medium text-[var(--text-primary)] text-sm truncate flex-1">{item.product.name}</span>
                                        <span className="text-[var(--accent-primary)] font-mono text-xs">Rp {(Number(item.product.price) * item.qty).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => updateQty(item.product.id, -1)} className="p-1 bg-[var(--bg-elevated)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Minus size={12} /></button>
                                        <span className="text-[var(--text-primary)] text-sm font-mono w-6 text-center">{item.qty}</span>
                                        <button onClick={() => updateQty(item.product.id, 1)} className="p-1 bg-[var(--bg-elevated)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"><Plus size={12} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-[var(--border-default)]">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[var(--text-muted)]">Total</span>
                            <span className="text-xl font-bold text-[var(--accent-primary)] font-mono">Rp {total.toLocaleString()}</span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={cartItems.length === 0 || isSubmitting}
                            className="w-full py-3 bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black font-bold rounded-lg disabled:opacity-50"
                        >
                            {isSubmitting ? 'Memproses...' : 'Tambah ke Bill'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Walk-in Modal
const WalkinModal = ({ tables, onClose, onSuccess }: { tables: any[], onClose: () => void, onSuccess: () => void }) => {
    const [customerName, setCustomerName] = useState('');
    const [pax, setPax] = useState(2);
    const [tableType, setTableType] = useState<'REGULAR' | 'VIP' | 'SNOOKER'>('REGULAR');
    const [selectedTable, setSelectedTable] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableTables = tables.filter((t: any) => t.status === 'AVAILABLE' && t.type === tableType);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTable || !customerName) return;

        setIsSubmitting(true);
        try {
            // Create reservation with WALK-IN note
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    phone: '-',
                    pax,
                    tableType,
                    bookingDate: new Date().toISOString().split('T')[0],
                    bookingTime: new Date().toTimeString().slice(0, 5), // HH:MM format
                    notes: 'WALK-IN'
                })
            });

            if (!res.ok) throw new Error('Failed to create walk-in');

            // Start the session immediately
            const startRes = await fetch(`/api/tables/${selectedTable}/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    billingType: 'open'
                })
            });

            if (!startRes.ok) throw new Error('Failed to start session');

            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Gagal membuat walk-in');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-md">
                <div className="p-4 border-b border-[var(--border-default)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Tambah Walk-In</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Nama Customer</label>
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Jumlah Orang</label>
                            <input type="number" min="1" value={pax} onChange={e => setPax(Number(e.target.value))}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Tipe Meja</label>
                            <select value={tableType} onChange={e => setTableType(e.target.value as any)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]">
                                <option value="REGULAR">Regular</option>
                                <option value="VIP">VIP</option>
                                <option value="SNOOKER">Snooker</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-2">Pilih Meja</label>
                        <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                            {availableTables.map((t: any) => (
                                <button
                                    key={t.id}
                                    type="button"
                                    onClick={() => setSelectedTable(t.id)}
                                    className={`p-3 border rounded text-sm font-bold transition-colors ${selectedTable === t.id
                                        ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]'
                                        : 'bg-[var(--bg-base)] text-[var(--text-primary)] border-[var(--border-default)] hover:border-[var(--accent-primary)]/50'
                                        }`}
                                >
                                    {t.name}
                                </button>
                            ))}
                        </div>
                        {availableTables.length === 0 && (
                            <p className="text-sm text-[var(--text-muted)] text-center py-4">Tidak ada meja tersedia</p>
                        )}
                    </div>
                    <button type="submit" disabled={!selectedTable || !customerName || isSubmitting}
                        className="w-full py-3 bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black font-bold rounded disabled:opacity-50">
                        {isSubmitting ? 'Memproses...' : 'Start Session'}
                    </button>
                </form>
            </div>
        </div>
    );
};

// Reservation Modal
const ReservationModal = ({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) => {
    const [customerName, setCustomerName] = useState('');
    const [phone, setPhone] = useState('');
    const [pax, setPax] = useState(2);
    const [tableType, setTableType] = useState<'REGULAR' | 'VIP' | 'SNOOKER'>('REGULAR');
    const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
    const [bookingTime, setBookingTime] = useState('19:00');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const res = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerName,
                    phone,
                    pax,
                    tableType,
                    bookingDate,
                    bookingTime // Just send the time string (HH:MM)
                })
            });

            if (!res.ok) throw new Error('Failed to create reservation');
            onSuccess();
        } catch (error) {
            console.error(error);
            alert('Gagal membuat reservasi');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl w-full max-w-md">
                <div className="p-4 border-b border-[var(--border-default)] flex justify-between items-center">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Buat Reservasi</h3>
                    <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Nama Customer</label>
                        <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} required
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                    </div>
                    <div>
                        <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">No. HP</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Jumlah Orang</label>
                            <input type="number" min="1" value={pax} onChange={e => setPax(Number(e.target.value))}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Tipe Meja</label>
                            <select value={tableType} onChange={e => setTableType(e.target.value as any)}
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]">
                                <option value="REGULAR">Regular</option>
                                <option value="VIP">VIP</option>
                                <option value="SNOOKER">Snooker</option>
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Tanggal</label>
                            <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                        </div>
                        <div>
                            <label className="text-xs text-[var(--text-muted)] uppercase font-bold block mb-1">Jam</label>
                            <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} required
                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-[var(--text-primary)]" />
                        </div>
                    </div>
                    <button type="submit" disabled={isSubmitting}
                        className="w-full py-3 bg-[var(--accent-secondary)] hover:bg-yellow-500 text-black font-bold rounded disabled:opacity-50">
                        {isSubmitting ? 'Memproses...' : 'Buat Reservasi'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default function DashboardPage() {
    const { showToast } = useToast();
    const { data: tablesData, mutate } = useSWR('/api/tables', fetcher, { refreshInterval: 15000 }); // Reduced polling
    const tables = tablesData?.data || [];

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showCheckout, setShowCheckout] = useState(false);
    const [showTransfer, setShowTransfer] = useState(false);
    const [showAddOrder, setShowAddOrder] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any>(null);
    const [customerName, setCustomerName] = useState<string>('');
    const [showBillingOptions, setShowBillingOptions] = useState(false);
    const [billingType, setBillingType] = useState<'open' | number>('open'); // 'open' or fixed hours (1-5)
    const [showWalkinModal, setShowWalkinModal] = useState(false);
    const [showReservationModal, setShowReservationModal] = useState(false);

    // Auth & Settings States
    const [showPin, setShowPin] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Loading states for instant feedback
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [isPending, startTransition] = useTransition();

    const selectedTable = tables.find((t: any) => t.id === selectedId);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AVAILABLE': return 'bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-primary)] hover:border-[var(--accent-primary)]/50';
            case 'ACTIVE': return 'bg-[#0f391e] border-[var(--accent-primary)] text-[var(--text-primary)] ring-1 ring-[#f07000]/50';
            case 'BOOKED': return 'bg-[#3f2e0b] border-[var(--accent-secondary)] text-[var(--accent-secondary)]';
            case 'CLEANING': return 'bg-[#2a1b3d] border-[#a855f7] text-[#a855f7]';
            case 'MAINTENANCE': return 'bg-[#0e2a36] border-[#0ea5e9] text-[#0ea5e9]';
            default: return 'bg-[var(--bg-card)] border-[var(--border-default)] text-[var(--text-primary)]';
        }
    };

    const handleAction = useCallback(async (action: 'start' | 'stop', billingType?: 'open' | number, nameOverride?: string) => {
        if (!selectedId || isActionLoading) return;

        setIsActionLoading(true);

        // Optimistic UI update - instantly update the table status
        const optimisticData = {
            ...tablesData,
            data: tables.map((t: any) =>
                t.id === selectedId
                    ? { ...t, status: action === 'start' ? 'ACTIVE' : 'AVAILABLE' }
                    : t
            )
        };

        // Update UI immediately
        startTransition(() => {
            mutate(optimisticData, false); // Optimistic update without revalidation
        });

        const nameToUse = selectedMember?.fullName || nameOverride || customerName || '';
        const body = action === 'start' ? {
            customerName: nameToUse || undefined,
            memberId: selectedMember?.id,
            billingType: billingType || 'open',
            fixedHours: typeof billingType === 'number' ? billingType : undefined
        } : {};

        try {
            const res = await fetch(`/api/tables/${selectedId}/${action}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                // Revert on error
                mutate();
                const err = await res.json();
                console.error('Action failed:', err);
            } else {
                // Sync with server data
                mutate();
            }
        } catch (e: any) {
            console.error('Action error:', e);
            showToast('error', e.message || 'Gagal melakukan aksi');
            mutate(); // Revert on error
        } finally {
            setIsActionLoading(false);
            setSelectedMember(null);
            setCustomerName('');
        }
    }, [selectedId, isActionLoading, tablesData, tables, selectedMember, customerName, mutate]);

    return (
        <div className="flex flex-1 overflow-hidden relative h-full">
            {/* Billing Options Modal */}
            {showBillingOptions && selectedTable && (
                <BillingOptionsModal
                    hourlyRate={selectedTable.hourlyRate || 50000}
                    onClose={() => setShowBillingOptions(false)}
                    onSelect={(type, name) => {
                        setBillingType(type);
                        if (name) setCustomerName(name);
                        handleAction('start', type, name);
                        setShowBillingOptions(false);
                    }}
                />
            )}

            {/* Visual Floor Plan */}
            <main className="flex-1 flex flex-col bg-[var(--bg-base)] overflow-hidden">
                {/* Top Control Bar */}
                <div className="px-6 py-4 border-b border-[var(--border-default)] bg-[var(--bg-surface)] flex justify-between items-center z-20 shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-bold text-[var(--text-primary)]">Lantai 1 - Main Hall</h2>
                            <button onClick={() => setShowPin(true)} className="p-1.5 hover:bg-[var(--bg-card)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-default)] transition-all"><Settings size={18} /></button>
                        </div>
                        <div className="flex items-center gap-2 text-xs bg-[var(--bg-card)] px-2 py-1 rounded border border-[var(--border-default)]">
                            <div className="size-2 rounded-full bg-[var(--accent-primary)]"></div> Active
                            <div className="size-2 rounded-full bg-[var(--accent-secondary)] ml-2"></div> Booked
                            <div className="size-2 rounded-full bg-slate-500 ml-2"></div> Available
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 border px-3 py-2 rounded text-sm font-medium transition-colors
                                    ${viewMode === 'grid' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--accent-primary)]/50' : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:bg-[var(--bg-card)]'}
                                `}
                        >
                            <LayoutGrid size={16} /> Grid View
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 border px-3 py-2 rounded text-sm font-medium transition-colors
                                    ${viewMode === 'list' ? 'bg-[var(--bg-card)] text-[var(--text-primary)] border-[var(--accent-primary)]/50' : 'bg-transparent text-[var(--text-muted)] border-[var(--border-default)] hover:bg-[var(--bg-card)]'}
                                `}
                        >
                            <List size={16} /> List View
                        </button>
                    </div>
                </div>

                {/* Grid Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {tables.map((table: any) => (
                                <div
                                    key={table.id}
                                    onClick={() => {
                                        // Special handling for CLEANING tables - click to set AVAILABLE
                                        if (table.status === 'CLEANING') {
                                            (async () => {
                                                try {
                                                    await fetch(`/api/tables/${table.id}`, {
                                                        method: 'PATCH',
                                                        headers: { 'Content-Type': 'application/json' },
                                                        body: JSON.stringify({ status: 'AVAILABLE' })
                                                    });
                                                    await mutate();
                                                    showToast('success', `${table.name} siap digunakan`);
                                                } catch (e) {
                                                    showToast('error', 'Gagal mengubah status');
                                                }
                                            })();
                                        } else {
                                            setSelectedId(table.id);
                                        }
                                    }}
                                    className={`relative p-4 rounded-xl border transition-all hover:scale-[1.02] flex flex-col justify-between h-48 shadow-lg group cursor-pointer
                          ${getStatusColor(table.status)}
                          ${selectedId === table.id ? 'ring-2 ring-transparent' : ''}
                        `}
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xl leading-none">{table.name}</span>
                                            <span className={`text-[10px] mt-1.5 uppercase tracking-wide font-bold px-2 py-0.5 rounded border w-fit ${(table.type === 'VIP')
                                                ? 'text-[#c084fc] border-[#c084fc]/30 bg-[#c084fc]/10'
                                                : 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10'
                                                }`}>
                                                {table.type || 'REGULAR'}
                                            </span>
                                        </div>
                                        {table.status === 'ACTIVE' && <div className="animate-pulse size-3 rounded-full bg-[var(--accent-primary)] shadow-[0_0_10px_#f07000]"></div>}
                                    </div>

                                    {/* Body */}
                                    <div className="flex flex-col items-center justify-center flex-1 w-full">
                                        {table.status === 'ACTIVE' && table.activeSession ? (
                                            <RealTimeTimer
                                                startTime={table.activeSession.startTime}
                                                endTime={table.activeSession.endTime}
                                                hourlyRate={table.hourlyRate || 50000}
                                                isPaused={table.activeSession.status === 'PAUSED'}
                                                onWarning={() => {
                                                    if (selectedId === table.id) {
                                                        alert('⏰ Peringatan: Waktu tersisa 5 menit!');
                                                    }
                                                }}
                                                onTimeUp={() => {
                                                    if (selectedId === table.id || !selectedId) {
                                                        setSelectedId(table.id);
                                                        setShowCheckout(true);
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center opacity-30 group-hover:opacity-60 transition-opacity">
                                                <div className="size-12 rounded-full border-2 border-dashed border-white flex items-center justify-center mb-1">
                                                    <Plus size={20} />
                                                </div>
                                                <span className="text-xs font-medium">{table.status}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex justify-between items-center text-sm opacity-90 border-t border-white/10 pt-3 mt-1">
                                        <div className="flex items-center gap-2 truncate max-w-[60%]">
                                            <Users size={16} />
                                            <span className="font-semibold truncate">{table.activeSession?.customerName || '-'}</span>
                                        </div>
                                        {table.activeSession && (
                                            <div className="flex items-center gap-1.5 text-slate-300">
                                                <Clock size={14} />
                                                <span className="font-mono text-xs font-medium">
                                                    {new Date(table.activeSession.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {tables.map((table: any) => (
                                <div
                                    key={table.id}
                                    onClick={() => setSelectedId(table.id)}
                                    className={`flex items-center justify-between p-4 rounded-lg border transition-all cursor-pointer hover:bg-[var(--bg-card)]
                                            ${selectedId === table.id ? 'border-[var(--accent-primary)] bg-[var(--bg-card)]' : 'border-[var(--border-default)] bg-[var(--bg-surface)]'}
                                        `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`size-3 rounded-full ${table.status === 'ACTIVE' ? 'bg-[var(--accent-primary)] animate-pulse' :
                                            table.status === 'BOOKED' ? 'bg-[var(--accent-secondary)]' :
                                                table.status === 'MAINTENANCE' ? 'bg-[#0ea5e9]' : 'bg-slate-500'
                                            }`}></div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-primary)] text-lg">{table.name}</h3>
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${(table.type === 'VIP')
                                                ? 'text-[#c084fc] border-[#c084fc]/30 bg-[#c084fc]/10'
                                                : 'text-[#4ade80] border-[#4ade80]/30 bg-[#4ade80]/10'
                                                }`}>
                                                {table.type || 'REGULAR'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        {table.status === 'ACTIVE' && table.activeSession && (
                                            <ListViewTimer
                                                startTime={table.activeSession.startTime}
                                                hourlyRate={table.hourlyRate || 50000}
                                            />
                                        )}
                                        <div className="flex items-center gap-2 text-[var(--text-muted)] min-w-[150px] justify-end">
                                            <Users size={16} />
                                            <span className="text-sm font-medium">{table.activeSession?.customerName || '-'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Smart Context Sidebar */}
            <aside className="w-[360px] bg-[var(--bg-surface)] border-l border-[var(--border-default)] flex flex-col shrink-0 z-30 shadow-xl">
                {selectedTable ? (
                    // TABLE CONTROL MODE
                    <>
                        <div className="p-5 border-b border-[var(--border-default)] bg-[var(--bg-card)]">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="text-2xl font-bold text-[var(--text-primary)]">{selectedTable.name}</h3>
                                    <p className="text-sm text-[var(--text-muted)]">{selectedTable.type || 'REGULAR'} Table • Kapasitas {selectedTable.capacity || 6}</p>
                                </div>
                                <button onClick={() => setSelectedId(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={20} /></button>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                                <div
                                    onClick={async () => {
                                        if (selectedTable.status === 'CLEANING') {
                                            try {
                                                await fetch(`/api/tables/${selectedId}`, {
                                                    method: 'PATCH',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ status: 'AVAILABLE' })
                                                });
                                                await mutate();
                                                showToast('success', 'Meja siap digunakan');
                                            } catch (e) {
                                                showToast('error', 'Gagal mengubah status');
                                            }
                                        }
                                    }}
                                    className={`px-2 py-1 rounded text-xs font-bold border ${getStatusColor(selectedTable.status)} bg-opacity-20 ${selectedTable.status === 'CLEANING' ? 'cursor-pointer hover:bg-[var(--accent-primary)]/30 transition-colors' : ''}`}
                                >
                                    {selectedTable.status}
                                </div>
                                {selectedTable.status === 'ACTIVE' && <span className="text-[var(--accent-primary)] text-sm font-mono font-bold">Billing berjalan</span>}
                                {selectedTable.status === 'CLEANING' && <span className="text-yellow-500 text-xs">Klik untuk set Available</span>}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {/* Member Search - Only when Available */}
                            {selectedTable.status === 'AVAILABLE' && (
                                <div className="mb-4">
                                    <label className="text-xs text-[var(--text-muted)] uppercase font-bold mb-1 block">Nama Customer / Cari Member</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Ketik nama customer..."
                                            value={selectedMember?.fullName || customerName}
                                            className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-2 text-sm text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none"
                                            onChange={async (e) => {
                                                const value = e.target.value;
                                                setCustomerName(value);
                                                setSelectedMember(null);

                                                // Try to find member if typing
                                                if (value.length > 2) {
                                                    const members = await fetchMembers(value);
                                                    if (members.length > 0) setSelectedMember(members[0]);
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && selectedTable.status !== 'ACTIVE' && !isActionLoading) {
                                                    setShowBillingOptions(true);
                                                }
                                            }}
                                        />
                                        {selectedMember && (
                                            <div className="absolute right-2 top-2 text-xs text-[var(--accent-primary)] font-bold flex items-center gap-1">
                                                <Users size={12} /> Member
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 mb-6">
                                <button
                                    onClick={() => setShowBillingOptions(true)}
                                    disabled={selectedTable.status === 'ACTIVE' || isActionLoading}
                                    className="flex flex-col items-center justify-center p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isActionLoading ? (
                                        <RefreshCw size={24} className="text-[var(--accent-primary)] mb-1 animate-spin" />
                                    ) : (
                                        <Play size={24} className="text-[var(--accent-primary)] mb-1" />
                                    )}
                                    <span className="text-xs font-medium text-slate-300">Start</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!selectedId || isActionLoading) return;
                                        setIsActionLoading(true);
                                        try {
                                            await fetch(`/api/tables/${selectedId}/pause`, { method: 'POST' });
                                            mutate();
                                        } finally {
                                            setIsActionLoading(false);
                                        }
                                    }}
                                    disabled={(selectedTable.status !== 'ACTIVE' && selectedTable.status !== 'BOOKED') || isActionLoading}
                                    className="flex flex-col items-center justify-center p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isActionLoading ? (
                                        <RefreshCw size={24} className="text-[var(--accent-secondary)] mb-1 animate-spin" />
                                    ) : (
                                        <Pause size={24} className="text-[var(--accent-secondary)] mb-1" />
                                    )}
                                    <span className="text-xs font-medium text-slate-300">
                                        {selectedTable.activeSession?.status === 'PAUSED' ? 'Resume' : 'Pause'}
                                    </span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!selectedTable.activeSession) return;
                                        setShowCheckout(true);
                                    }}
                                    disabled={selectedTable.status !== 'ACTIVE' || isActionLoading}
                                    className="flex flex-col items-center justify-center p-3 bg-[var(--bg-card)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Square size={24} className="text-[#ef4444] mb-1" />
                                    <span className="text-xs font-medium text-slate-300">Stop</span>

                                </button>
                            </div>

                            <button
                                onClick={() => setShowTransfer(true)}
                                className="w-full flex items-center justify-center gap-2 p-2 mb-4 bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
                            >
                                <ArrowRightLeft size={16} />
                                <span className="text-sm font-medium">Pindah Meja</span>
                            </button>

                            <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Quick Actions</h4>
                            <div className="space-y-2 mb-6">
                                <button
                                    onClick={() => setShowAddOrder(true)}
                                    disabled={selectedTable.status !== 'ACTIVE'}
                                    className="w-full flex items-center justify-between p-3 bg-[var(--bg-base)] border border-[var(--border-default)] rounded hover:border-[var(--accent-primary)] transition-colors group disabled:opacity-50"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-[var(--accent-primary)]/10 rounded text-[var(--accent-primary)]"><Coffee size={18} /></div>
                                        <span className="text-sm font-medium text-slate-300 group-hover:text-[var(--text-primary)]">Tambah Pesanan F&B</span>
                                    </div>
                                </button>
                            </div>

                            <button
                                onClick={() => setShowCheckout(true)}
                                disabled={selectedTable.status !== 'ACTIVE'}
                                className="w-full mb-6 py-3 bg-[var(--accent-secondary)] hover:bg-yellow-500 text-black font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Receipt size={20} />
                                Checkout & Bayar
                            </button>

                            {selectedTable.status === 'ACTIVE' && selectedTable.activeSession && (
                                <div className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded p-4">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-[var(--text-primary)]">Total Tagihan</span>
                                        <RealTimeBill
                                            startTime={selectedTable.activeSession.startTime}
                                            hourlyRate={selectedTable.hourlyRate || 50000}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // WAITING LIST & RESERVATIONS SIDEBAR
                    <WaitingListSidebar
                        onOpenWalkin={() => setShowWalkinModal(true)}
                        onOpenReservation={() => setShowReservationModal(true)}
                    />
                )}
            </aside>

            {showCheckout && selectedTable && (
                <CheckoutModal
                    table={selectedTable}
                    onClose={() => setShowCheckout(false)}
                    onConfirm={async (method, cash, total, items) => {
                        try {
                            // 1. Stop Session (Required to close main loop)
                            const stopRes = await fetch(`/api/tables/${selectedTable.id}/stop`, { method: 'POST' });
                            const stopData = await stopRes.json();

                            if (!stopRes.ok || !stopData.success) {
                                throw new Error(stopData.error || 'Gagal menghentikan sesi');
                            }

                            const sessionId = stopData.data?.sessionId;

                            // 2. Create Transaction with REAL items
                            const transRes = await fetch('/api/transactions', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    sessionId,
                                    customerName: selectedTable.activeSession?.customerName,
                                    paymentMethod: method,
                                    items: items // Use the items passed from CheckoutModal
                                })
                            });

                            const transData = await transRes.json();
                            console.log("Transaction Response:", transData); // Debug

                            if (!transRes.ok || !transData.success) {
                                // Show detailed error message
                                const errMsg = transData.details
                                    ? JSON.stringify(transData.details)
                                    : transData.error || 'Gagal memproses transaksi';
                                throw new Error(errMsg);
                            }

                            await mutate();
                            setShowCheckout(false);
                            setSelectedId(null);
                            showToast('success', `Pembayaran Berhasil Rp ${total.toLocaleString()}! Struk dicetak.`);
                        } catch (e: any) {
                            console.error("Checkout failed", e);
                            showToast('error', e.message || 'Pembayaran Gagal');
                        }
                    }}
                />
            )}

            {showTransfer && selectedTable && (
                <TableTransferModal
                    sourceTable={selectedTable}
                    tables={tables}
                    onClose={() => setShowTransfer(false)}
                    onConfirm={async (targetId) => {
                        try {
                            const res = await fetch('/api/tables/transfer', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ fromTableId: selectedTable.id, toTableId: targetId })
                            });

                            if (!res.ok) {
                                const err = await res.json();
                                alert(err.error || 'Gagal memindahkan meja');
                                return;
                            }

                            await mutate(); // Refresh data
                            setShowTransfer(false);
                            setSelectedId(null);
                        } catch (e) {
                            console.error("Transfer failed", e);
                            alert('Terjadi kesalahan saat memindahkan meja');
                        }
                    }}
                />
            )}

            {showPin && (
                <PinModal
                    validPin="123456"
                    onClose={() => setShowPin(false)}
                    onSuccess={() => { setShowPin(false); setShowSettings(true); }}
                />
            )}
            {showSettings && <PrinterSettingsModal onClose={() => setShowSettings(false)} />}

            {showAddOrder && selectedTable?.activeSession && (
                <AddOrderModal
                    sessionId={selectedTable.activeSession.id}
                    onClose={() => setShowAddOrder(false)}
                    onSuccess={() => { setShowAddOrder(false); mutate(); }}
                />
            )}

            {showWalkinModal && (
                <WalkinModal
                    tables={tables}
                    onClose={() => setShowWalkinModal(false)}
                    onSuccess={() => {
                        setShowWalkinModal(false);
                        mutate();
                    }}
                />
            )}

            {showReservationModal && (
                <ReservationModal
                    onClose={() => setShowReservationModal(false)}
                    onSuccess={() => {
                        setShowReservationModal(false);
                        mutate();
                    }}
                />
            )}
        </div>
    );
}
