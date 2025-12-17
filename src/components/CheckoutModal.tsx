'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import {
    X, Clock, Coffee, Plus, Minus, Banknote, QrCode, CreditCard,
    Printer, Trash2, Tag, Star, FileText, Loader2
} from 'lucide-react';

interface CheckoutModalProps {
    table: any;
    onClose: () => void;
    onConfirm: (method: string, cash: number, total: number, items: any[], pointsRedeemed: number) => void;
}

export const CheckoutModal = ({ table, onClose, onConfirm }: CheckoutModalProps) => {
    // State Management
    const [splitMode, setSplitMode] = useState<'none' | 'item' | 'person'>('none');
    const [splitCount, setSplitCount] = useState(2);
    const [paymentMethods, setPaymentMethods] = useState<{ method: string, amount: number }[]>([
        { method: 'CASH', amount: 0 }
    ]);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [pointsRedeemed, setPointsRedeemed] = useState<number>(0);
    const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [receiptNo] = useState(`INV-${Date.now().toString(36).toUpperCase()}`);
    const [isProcessing, setIsProcessing] = useState(false);

    // Member Info - memoized
    const member = useMemo(() => table.activeSession?.member, [table.activeSession?.member]);
    const maxPoints = useMemo(() => member?.pointsBalance || 0, [member?.pointsBalance]);
    const pointsDiscount = useMemo(() => pointsRedeemed * 1000, [pointsRedeemed]);

    // Memoize duration calculations - only recalculate when table changes
    const durationData = useMemo(() => {
        const startTime = table.activeSession?.startTime ? new Date(table.activeSession.startTime).getTime() : Date.now();
        const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
        const durationCost = Math.ceil((elapsedSeconds / 3600) * table.hourlyRate);
        const durationMinutes = Math.floor(elapsedSeconds / 60);
        const durationHours = Math.floor(durationMinutes / 60);
        const durationMins = durationMinutes % 60;
        return { startTime, elapsedSeconds, durationCost, durationMinutes, durationHours, durationMins };
    }, [table.activeSession?.startTime, table.hourlyRate]);

    const { durationCost, durationHours, durationMins } = durationData;

    // Memoize F&B items - only recompute when orders change
    const fnbItems = useMemo(() => {
        const fnbOrders = table.activeSession?.orders || [];
        return fnbOrders.flatMap((o: any) => o.items.map((i: any) => ({ ...i, orderId: o.id })));
    }, [table.activeSession?.orders]);

    // Initialize selection
    useEffect(() => {
        const allIds = new Set(['duration']);
        fnbItems.forEach((i: any) => allIds.add(`item-${i.id}`));
        setSelectedItems(allIds);
    }, [fnbItems]);

    // Memoize subtotal calculation
    const subtotal = useMemo(() => {
        let sub = 0;
        if (splitMode === 'none' || selectedItems.has('duration')) sub += durationCost;
        fnbItems.forEach((i: any) => {
            if (splitMode === 'none' || selectedItems.has(`item-${i.id}`)) sub += (Number(i.unitPrice) * i.quantity);
        });
        return sub;
    }, [splitMode, selectedItems, durationCost, fnbItems]);

    // Memoize other calculations
    const discountAmount = useMemo(() =>
        discountType === 'percent' ? Math.floor(subtotal * (discountValue / 100)) : discountValue,
        [discountType, subtotal, discountValue]
    );

    const afterDiscount = useMemo(() =>
        Math.max(0, subtotal - discountAmount - pointsDiscount),
        [subtotal, discountAmount, pointsDiscount]
    );

    const tax = useMemo(() => Math.floor(afterDiscount * 0.1), [afterDiscount]);
    const grandTotal = useMemo(() => afterDiscount + tax, [afterDiscount, tax]);
    const perPersonAmount = useMemo(() =>
        splitMode === 'person' ? Math.ceil(grandTotal / splitCount) : grandTotal,
        [splitMode, grandTotal, splitCount]
    );

    const totalPaid = useMemo(() => paymentMethods.reduce((sum, p) => sum + p.amount, 0), [paymentMethods]);
    const remainingAmount = useMemo(() => grandTotal - totalPaid, [grandTotal, totalPaid]);
    const change = useMemo(() => Math.max(0, totalPaid - grandTotal), [totalPaid, grandTotal]);

    const toggleItem = useCallback((id: string) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    }, []);

    const addPaymentMethod = useCallback(() => {
        setPaymentMethods(prev => [...prev, { method: 'QRIS', amount: 0 }]);
    }, []);

    const updatePayment = useCallback((index: number, field: 'method' | 'amount', value: string | number) => {
        setPaymentMethods(prev => {
            const updated = [...prev];
            if (field === 'method') updated[index].method = value as string;
            else updated[index].amount = Number(value);
            return updated;
        });
    }, []);

    const removePayment = useCallback((index: number) => {
        setPaymentMethods(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
    }, []);

    const handlePrint = () => {
        const printContent = document.getElementById('receipt-print-area')?.innerHTML;
        const win = window.open('', '', 'width=400,height=600');
        if (win && printContent) {
            win.document.write(`
                <html>
                <head>
                    <title>INV-${receiptNo}</title>
                    <style>
                        @page { margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 58mm; 
                            margin: 0; 
                            padding: 5px 5px 20px 5px; 
                            font-size: 10px; 
                            line-height: 1.2;
                            color: black;
                        }
                        .header { text-align: center; margin-bottom: 10px; }
                        .title { font-size: 14px; font-weight: bold; margin-bottom: 2px; text-transform: uppercase; }
                        .address { font-size: 9px; margin-bottom: 2px; }
                        .meta { font-size: 9px; margin-bottom: 5px; text-align: left; }
                        .divider { border-bottom: 1px dashed #000; margin: 5px 0; width: 100%; }
                        .double-divider { border-bottom: 3px double #000; margin: 5px 0; width: 100%; }
                        .item-row { margin-bottom: 2px; }
                        .item-name { font-weight: bold; display: block; }
                        .item-details { display: flex; justify-content: space-between; padding-left: 0; }
                        .flex-between { display: flex; justify-content: space-between; }
                        .font-bold { font-weight: bold; }
                        .text-lg { font-size: 12px; }
                        .footer { text-align: center; margin-top: 15px; font-size: 9px; }
                        .text-right { text-align: right; }
                        .print-hidden { display: none; }
                        
                        /* Layout adjustments */
                        table { width: 100%; border-collapse: collapse; }
                        td { vertical-align: top; }
                        td.price { text-align: right; white-space: nowrap; }
                    </style>
                </head>
                <body>
                    ${printContent}
                    <script>
                        window.onload = function() { window.print(); window.close(); }
                    </script>
                </body>
                </html>
            `);
            win.document.close();
        }
    };

    const handleConfirm = useCallback(() => {
        if (isProcessing) return;
        setIsProcessing(true);

        const itemsToPay: any[] = [];
        if (splitMode === 'none' || selectedItems.has('duration')) {
            itemsToPay.push({ type: 'TABLE_BILL', name: 'Table Duration', price: Number(durationCost), qty: 1 });
        }
        fnbItems.forEach((i: any) => {
            if (splitMode === 'none' || selectedItems.has(`item-${i.id}`)) {
                itemsToPay.push({ type: 'PRODUCT', id: i.productId, name: i.itemName, price: Number(i.unitPrice), qty: i.quantity });
            }
        });
        onConfirm(paymentMethods[0]?.method || 'CASH', totalPaid, grandTotal, itemsToPay, pointsRedeemed);
    }, [isProcessing, splitMode, selectedItems, durationCost, fnbItems, paymentMethods, totalPaid, grandTotal, pointsRedeemed, onConfirm]);

    const PrintPreviewContent = () => (
        <div id="receipt-print-area" className="bg-white text-black p-6 rounded-lg max-w-sm mx-auto font-mono text-sm">
            {/* Header */}
            <div className="text-center border-b-2 border-dashed border-gray-400 pb-3 mb-3">
                <h1 className="text-2xl font-bold tracking-wide">BILLIARD POS</h1>
                <p className="text-xs text-gray-600 mt-1">Jl. Contoh No. 123, Jakarta</p>
                <p className="text-xs text-gray-600">Telp: (021) 1234-5678</p>
            </div>

            {/* Receipt Info */}
            <div className="text-xs space-y-0.5 mb-3 border-b border-gray-300 pb-3">
                <div className="flex justify-between">
                    <span className="text-gray-600">No:</span>
                    <span className="font-semibold">{receiptNo}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Tanggal:</span>
                    <span className="font-semibold">{new Date().toLocaleString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Meja:</span>
                    <span className="font-semibold">{table.name}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-semibold">{table.activeSession?.customerName || 'Guest'}</span>
                </div>
            </div>

            {/* Items */}
            <div className="mb-3 border-b border-gray-300 pb-3">
                {/* Table Duration */}
                <div className="mb-2">
                    <div className="flex justify-between font-semibold">
                        <span>Sewa Meja ({durationHours > 0 ? `${durationHours}j ` : ''}{durationMins}m)</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                        <span className="uppercase">{table.type}</span>
                        <span className="font-bold text-black">Rp {durationCost.toLocaleString()}</span>
                    </div>
                </div>

                {/* F&B Items */}
                {fnbItems.map((item: any) => (
                    <div key={item.id} className="mb-2">
                        <div className="flex justify-between font-semibold">
                            <span>{item.itemName}</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mt-0.5">
                            <span>{item.quantity} x Rp {Number(item.unitPrice).toLocaleString()}</span>
                            <span className="font-bold text-black">Rp {(Number(item.unitPrice) * item.quantity).toLocaleString()}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Subtotal & Tax */}
            <div className="text-xs space-y-1 mb-3 pb-3 border-b border-gray-300">
                <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span>Rp {subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                        <span>Diskon</span>
                        <span>-Rp {discountAmount.toLocaleString()}</span>
                    </div>
                )}
                {pointsDiscount > 0 && (
                    <div className="flex justify-between text-yellow-600">
                        <span>Poin Member</span>
                        <span>-Rp {pointsDiscount.toLocaleString()}</span>
                    </div>
                )}
                <div className="flex justify-between">
                    <span className="text-gray-600">Tax (10%)</span>
                    <span>Rp {tax.toLocaleString()}</span>
                </div>
            </div>

            {/* Total */}
            <div className="text-lg font-bold flex justify-between mb-3 pb-3 border-b-2 border-gray-800">
                <span>TOTAL</span>
                <span>Rp {grandTotal.toLocaleString()}</span>
            </div>

            {/* Payment */}
            <div className="text-xs space-y-1 mb-3 pb-3 border-b border-dashed border-gray-400">
                {paymentMethods.map((p, i) => (
                    <div key={i} className="flex justify-between">
                        <span className="text-gray-600">{p.method}</span>
                        <span className="font-semibold">Rp {p.amount.toLocaleString()}</span>
                    </div>
                ))}
                {change > 0 && (
                    <div className="flex justify-between font-bold">
                        <span>Kembalian</span>
                        <span>Rp {change.toLocaleString()}</span>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-600 space-y-1">
                <p className="font-semibold">Terima kasih atas kunjungan Anda!</p>
                <p>Wifi: BilliardGuest / Pass: 12345678</p>
                <p className="text-[10px] mt-2">--- Struk ini sah tanpa tanda tangan ---</p>
            </div>
        </div>
    );


    return (
        <div className="fixed inset-0 bg-[var(--bg-overlay)] backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex overflow-hidden">

                {/* LEFT PANEL: Bill Details */}
                <div className="w-1/2 flex flex-col border-r border-[var(--border-default)] bg-[var(--bg-base)]">
                    <div className="p-4 border-b border-[var(--border-default)] flex justify-between items-center">
                        <div>
                            <h2 className="text-lg font-bold text-[var(--text-primary)]">Checkout: {table.name}</h2>
                            <p className="text-xs text-[var(--text-muted)]">
                                {member ? <span className="text-[var(--accent-secondary)] font-bold">{member.fullName} ({member.pointsBalance} pts)</span> : `Receipt: ${receiptNo}`}
                            </p>
                        </div>
                        <div className="flex gap-1">
                            {['none', 'item', 'person'].map((mode) => (
                                <button key={mode} onClick={() => setSplitMode(mode as any)}
                                    className={`px-2 py-1 text-[10px] font-bold rounded border ${splitMode === mode ? 'bg-[var(--accent-primary)] text-black border-[var(--accent-primary)]' : 'text-[var(--text-muted)] border-[var(--border-default)]'}`}>
                                    {mode === 'none' ? 'Full' : mode === 'item' ? 'Item' : 'Person'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Split by Person */}
                    {splitMode === 'person' && (
                        <div className="px-4 py-2 bg-[var(--bg-card)] border-b border-[var(--border-default)] flex items-center gap-3">
                            <span className="text-xs text-[var(--text-muted)]">Bagi ke</span>
                            <button onClick={() => setSplitCount(Math.max(2, splitCount - 1))} className="p-1 bg-[var(--bg-elevated)] rounded text-[var(--text-primary)]"><Minus size={14} /></button>
                            <span className="text-[var(--text-primary)] font-bold w-6 text-center">{splitCount}</span>
                            <button onClick={() => setSplitCount(splitCount + 1)} className="p-1 bg-[var(--bg-elevated)] rounded text-[var(--text-primary)]"><Plus size={14} /></button>
                            <span className="text-xs text-[var(--text-muted)]">orang</span>
                            <span className="ml-auto text-sm text-[var(--accent-primary)] font-mono">@ Rp {perPersonAmount.toLocaleString()}</span>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto p-4">
                        {/* Duration Item */}
                        <button onClick={() => splitMode === 'item' && toggleItem('duration')}
                            className={`w-full flex justify-between items-start text-left p-3 rounded mb-2 transition-colors ${splitMode === 'item' && selectedItems.has('duration') ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/50' : 'bg-[var(--bg-card)] border border-[var(--border-default)]'}`}>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--bg-elevated)] rounded text-[var(--accent-primary)]"><Clock size={16} /></div>
                                <div>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">Durasi ({durationHours}h {durationMins}m)</p>
                                    <p className="text-[10px] text-[var(--text-muted)]">{table.type} @ Rp {Number(table.hourlyRate).toLocaleString()}/jam</p>
                                </div>
                            </div>
                            <span className="font-mono text-[var(--text-primary)]">Rp {durationCost.toLocaleString()}</span>
                        </button>

                        {/* F&B Items */}
                        {fnbItems.length > 0 ? (
                            <div className="space-y-2">
                                <h4 className="text-[10px] text-[var(--text-muted)] uppercase font-bold mt-4 mb-2">Pesanan F&B</h4>
                                {fnbItems.map((item: any) => (
                                    <button key={item.id} onClick={() => splitMode === 'item' && toggleItem(`item-${item.id}`)}
                                        className={`w-full flex justify-between items-center text-left p-2 rounded transition-colors ${splitMode === 'item' && selectedItems.has(`item-${item.id}`) ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/50' : 'bg-[var(--bg-surface)] border border-[var(--border-default)]'}`}>
                                        <div className="flex items-center gap-2">
                                            <Coffee size={14} className="text-[var(--accent-secondary)]" />
                                            <span className="text-xs text-[var(--text-primary)]">{item.itemName}</span>
                                            <span className="text-[10px] text-[var(--text-muted)]">x{item.quantity}</span>
                                        </div>
                                        <span className="font-mono text-xs text-[var(--text-primary)]">Rp {(Number(item.unitPrice) * item.quantity).toLocaleString()}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-[var(--text-muted)] text-xs py-4">Tidak ada pesanan F&B</p>
                        )}

                        {/* Discount Section */}
                        <div className="mt-4 p-3 bg-[var(--bg-card)] rounded border border-[var(--border-default)]">
                            <h4 className="text-[10px] text-[var(--text-muted)] uppercase font-bold mb-2 flex items-center gap-1">
                                <Tag size={12} /> Diskon / Promo
                            </h4>
                            <div className="flex gap-2">
                                <select value={discountType} onChange={(e) => setDiscountType(e.target.value as any)}
                                    className="bg-[var(--bg-base)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)]">
                                    <option value="percent">%</option>
                                    <option value="fixed">Rp</option>
                                </select>
                                <input type="number" value={discountValue || ''} onChange={(e) => setDiscountValue(Number(e.target.value))}
                                    placeholder={discountType === 'percent' ? '0-100' : 'Nominal'}
                                    className="flex-1 bg-[var(--bg-base)] border border-[var(--border-default)] rounded px-2 py-1 text-xs text-[var(--text-primary)] w-20" />
                                {discountAmount > 0 && <span className="text-xs text-[var(--accent-primary)] font-mono self-center">-Rp {discountAmount.toLocaleString()}</span>}
                            </div>
                        </div>

                        {/* Points Redeem */}
                        {member && maxPoints > 0 && (
                            <div className="mt-3 p-3 bg-[var(--bg-elevated)] rounded border border-[var(--accent-secondary)]/30">
                                <h4 className="text-[10px] text-[var(--accent-secondary)] uppercase font-bold mb-2 flex items-center gap-1">
                                    <Star size={12} /> Redeem Points ({maxPoints} tersedia)
                                </h4>
                                <div className="flex items-center gap-2">
                                    <input type="range" min="0" max={Math.min(maxPoints, Math.floor(subtotal / 1000))} value={pointsRedeemed}
                                        onChange={(e) => setPointsRedeemed(Number(e.target.value))} className="flex-1" />
                                    <span className="text-xs text-[var(--accent-secondary)] font-mono w-20 text-right">{pointsRedeemed} pts</span>
                                </div>
                                {pointsRedeemed > 0 && <p className="text-[10px] text-[var(--accent-secondary)] mt-1">Potongan: Rp {pointsDiscount.toLocaleString()}</p>}
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    <div className="p-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            <div className="flex justify-between text-[var(--text-muted)]"><span>Subtotal</span><span>Rp {subtotal.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[var(--text-muted)]"><span>Tax (10%)</span><span>Rp {tax.toLocaleString()}</span></div>
                            {discountAmount > 0 && <div className="flex justify-between text-[var(--accent-primary)]"><span>Diskon</span><span>-Rp {discountAmount.toLocaleString()}</span></div>}
                            {pointsDiscount > 0 && <div className="flex justify-between text-[var(--accent-secondary)]"><span>Points</span><span>-Rp {pointsDiscount.toLocaleString()}</span></div>}
                        </div>
                        <div className="h-px bg-[var(--bg-elevated)] my-2"></div>
                        <div className="flex justify-between text-lg font-bold text-[var(--text-primary)]">
                            <span>TOTAL</span>
                            <span className="text-[var(--accent-primary)]">Rp {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Payment Methods */}
                <div className="w-1/2 flex flex-col bg-[var(--bg-surface)]">
                    <div className="p-4 border-b border-[var(--border-default)] flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Pembayaran</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setShowPrintPreview(!showPrintPreview)} className="p-2 bg-[var(--bg-card)] rounded hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                                <FileText size={18} />
                            </button>
                            <button onClick={onClose} className="p-2 hover:bg-[var(--bg-card)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"><X size={18} /></button>
                        </div>
                    </div>

                    {showPrintPreview ? (
                        <div className="flex-1 overflow-y-auto p-4">
                            <PrintPreviewContent />
                            <button onClick={handlePrint} className="w-full mt-4 py-3 bg-[var(--accent-primary)] text-black font-bold rounded flex items-center justify-center gap-2">
                                <Printer size={18} /> Cetak Struk
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {paymentMethods.map((payment, index) => (
                                    <div key={index} className="bg-[var(--bg-card)] rounded-lg border border-[var(--border-default)] p-3">
                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-xs text-[var(--text-muted)]">Metode {index + 1}</span>
                                            {paymentMethods.length > 1 && (
                                                <button onClick={() => removePayment(index)} className="text-red-500 hover:text-red-400"><Trash2 size={14} /></button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            {[
                                                { method: 'CASH', icon: Banknote, color: 'text-[var(--accent-primary)]' },
                                                { method: 'QRIS', icon: QrCode, color: 'text-[#3b82f6]' },
                                                { method: 'DEBIT', icon: CreditCard, color: 'text-[#a855f7]' }
                                            ].map(({ method, icon: Icon, color }) => (
                                                <button key={method} onClick={() => updatePayment(index, 'method', method)}
                                                    className={`p-3 rounded border flex flex-col items-center gap-1 transition-all ${payment.method === method ? 'bg-[var(--accent-primary)]/10 border-[var(--accent-primary)]' : 'border-[var(--border-default)] hover:border-[var(--accent-primary)]/50'}`}>
                                                    <Icon size={20} className={payment.method === method ? 'text-[var(--accent-primary)]' : color} />
                                                    <span className={`text-[10px] font-bold ${payment.method === method ? 'text-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`}>{method}</span>
                                                </button>
                                            ))}
                                        </div>

                                        {/* QRIS QR Code */}
                                        {payment.method === 'QRIS' && (
                                            <div className="bg-white rounded p-4 mb-3 flex flex-col items-center">
                                                <div className="bg-black/10 p-4 rounded"><QrCode size={80} className="text-black" /></div>
                                                <p className="text-xs text-gray-600 mt-2">Scan untuk membayar</p>
                                                <p className="text-lg font-bold text-black">Rp {(index === 0 ? grandTotal : remainingAmount).toLocaleString()}</p>
                                            </div>
                                        )}

                                        {/* Amount Input */}
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">Rp</span>
                                            <input type="number" value={payment.amount || ''} onChange={(e) => updatePayment(index, 'amount', e.target.value)}
                                                placeholder={(index === 0 ? grandTotal : remainingAmount).toString()}
                                                className="w-full bg-[var(--bg-base)] border border-[var(--border-default)] rounded py-2 pl-10 pr-3 text-xl font-mono text-[var(--text-primary)] focus:border-[var(--accent-primary)] outline-none" />
                                        </div>

                                        {/* Quick Amount Buttons */}
                                        {payment.method === 'CASH' && (
                                            <div className="grid grid-cols-4 gap-2 mt-2">
                                                {[20000, 50000, 100000, grandTotal].map((amt, i) => (
                                                    <button key={i} onClick={() => updatePayment(index, 'amount', amt)}
                                                        className="py-1.5 bg-[var(--bg-base)] rounded text-[10px] text-[var(--accent-primary)] font-mono border border-[var(--border-default)] hover:border-[var(--accent-primary)]">
                                                        {i === 3 ? 'Pas' : `${(amt / 1000)}k`}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {/* Add Payment Method */}
                                {remainingAmount > 0 && paymentMethods.length < 3 && (
                                    <button onClick={addPaymentMethod} className="w-full py-2 border border-dashed border-[var(--border-default)] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--accent-primary)] text-xs flex items-center justify-center gap-1">
                                        <Plus size={14} /> Tambah Metode Pembayaran
                                    </button>
                                )}

                                {/* Payment Summary */}
                                <div className="bg-[var(--bg-base)] rounded-lg border border-[var(--border-default)] p-3 space-y-2">
                                    <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>Total Tagihan</span><span>Rp {grandTotal.toLocaleString()}</span></div>
                                    <div className="flex justify-between text-xs text-[var(--text-muted)]"><span>Diterima</span><span className={totalPaid >= grandTotal ? 'text-[var(--accent-primary)]' : 'text-[var(--accent-secondary)]'}>Rp {totalPaid.toLocaleString()}</span></div>
                                    {remainingAmount > 0 && <div className="flex justify-between text-xs text-red-500"><span>Kurang</span><span>Rp {remainingAmount.toLocaleString()}</span></div>}
                                    {change > 0 && <div className="flex justify-between text-sm font-bold text-[var(--accent-primary)]"><span>Kembalian</span><span>Rp {change.toLocaleString()}</span></div>}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 border-t border-[var(--border-default)]">
                                <button onClick={handleConfirm} disabled={totalPaid < grandTotal || isProcessing}
                                    className="w-full py-4 bg-[var(--accent-primary)] hover:bg-[#16a34a] text-black font-bold text-lg rounded-lg shadow-lg shadow-[#f07000]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                                    {isProcessing ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" /> Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Printer size={20} /> Proses & Cetak
                                        </>
                                    )}
                                </button>
                                <button onClick={onClose} className="w-full mt-2 py-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-sm">Batal</button>
                            </div>
                        </>
                    )}
                </div>
            </div >
        </div >
    );
};
