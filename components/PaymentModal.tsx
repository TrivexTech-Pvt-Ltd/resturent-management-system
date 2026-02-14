import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (method: 'CASH' | 'CARD') => void;
    isLoading?: boolean;
}

function PaymentModal({ isOpen, onClose, total, onConfirm, isLoading = false }: PaymentModalProps) {
    const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
    const [receivedAmount, setReceivedAmount] = useState<string>('');

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setMethod('CASH');
            setReceivedAmount('');
        }
    }, [isOpen]);

    const received = parseFloat(receivedAmount) || 0;
    const balance = received - total;

    const handleConfirm = () => {
        if (method === 'CASH' && received < total) return;
        onConfirm(method);
        // Don't clear immediately, let parent handle close
    };

    if (!isOpen) return null;

    const denominations = [500, 1000, 5000];

    return (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4" style={{ willChange: 'opacity' }}>
            <div className="bg-white w-full max-w-sm rounded-4xl p-6 overflow-hidden shadow-2xl" style={{ willChange: 'transform' }}>
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold italic tracking-tight uppercase">Checkout</h2>
                    <button onClick={onClose} disabled={isLoading} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-secondary cursor-pointer disabled:opacity-50">✕</button>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl mb-5 text-center border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Payable</p>
                    <p className="text-4xl font-black text-primary italic tracking-tighter tabular-nums">{total.toFixed(2)}</p>
                </div>

                <div className="flex gap-3 mb-5">
                    <button
                        onClick={() => setMethod('CASH')}
                        disabled={isLoading}
                        className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${method === 'CASH' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50 text-slate-400'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="text-xl">💵</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">Cash</span>
                    </button>
                    <button
                        onClick={() => setMethod('CARD')}
                        disabled={isLoading}
                        className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${method === 'CARD' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50 text-slate-400'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <span className="text-xl">💳</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">Card</span>
                    </button>
                </div>

                {method === 'CASH' && (
                    <div className="space-y-4 mb-5">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Received Amount</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                    disabled={isLoading}
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-black text-xl text-slate-800 placeholder:text-slate-200 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className={cn(
                            "p-4 rounded-xl flex justify-between items-center transition-all duration-200",
                            received > 0 ? "opacity-100" : "opacity-0 pointer-events-none",
                            balance >= 0 ? "bg-emerald-50 border border-emerald-100" : "bg-rose-50 border border-rose-100"
                        )}>
                            <div>
                                <p className={cn("text-[9px] font-black uppercase tracking-widest leading-none mb-1", balance >= 0 ? "text-emerald-400" : "text-rose-400")}>
                                    {balance >= 0 ? "Change" : "Required"}
                                </p>
                                <p className={cn("text-xl font-black tabular-nums leading-none", balance >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                    {Math.abs(balance).toFixed(2)}
                                </p>
                            </div>
                            <div className={cn("text-xl", balance >= 0 ? "opacity-100" : "opacity-30")}>
                                {balance >= 0 ? "🤝" : "⌛"}
                            </div>
                        </div>
                    </div>
                )}

                <button
                    onClick={handleConfirm}
                    disabled={(method === 'CASH' && (received < total || !receivedAmount)) || isLoading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-base hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 uppercase tracking-widest cursor-pointer flex justify-center items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <span className="animate-spin">⏳</span>
                            Processing...
                        </>
                    ) : "Confirm Order"}
                </button>
            </div>
        </div>
    );
}

export default memo(PaymentModal);
