import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (method: 'CASH' | 'CARD') => void;
}

export default function PaymentModal({ isOpen, onClose, total, onConfirm }: PaymentModalProps) {
    const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
    const [receivedAmount, setReceivedAmount] = useState<string>('');

    const received = parseFloat(receivedAmount) || 0;
    const balance = received - total;

    const handleConfirm = () => {
        if (method === 'CASH' && received < total) return;
        onConfirm(method);
        setReceivedAmount('');
    };

    if (!isOpen) return null;

    const denominations = [500, 1000, 5000];

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-sm rounded-4xl p-6 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold italic tracking-tight uppercase">Checkout</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-secondary cursor-pointer">✕</button>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl mb-5 text-center border border-slate-100">
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Payable</p>
                    <p className="text-4xl font-black text-primary italic tracking-tighter tabular-nums">{total.toFixed(2)}</p>
                </div>

                <div className="flex gap-3 mb-5">
                    <button
                        onClick={() => setMethod('CASH')}
                        className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${method === 'CASH' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50 text-slate-400'
                            }`}
                    >
                        <span className="text-xl">💵</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">Cash</span>
                    </button>
                    <button
                        onClick={() => setMethod('CARD')}
                        className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 transition-all cursor-pointer ${method === 'CARD' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50 text-slate-400'
                            }`}
                    >
                        <span className="text-xl">💳</span>
                        <span className="font-black uppercase text-[10px] tracking-widest">Card</span>
                    </button>
                </div>

                {method === 'CASH' && (
                    <div className="space-y-4 mb-5 animate-in slide-in-from-top-4 duration-300">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Received Amount</label>
                            <div className="relative group">
                                <input
                                    type="number"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:border-primary/30 focus:ring-4 focus:ring-primary/5 outline-none transition-all font-black text-xl text-slate-800 placeholder:text-slate-200"
                                />
                            </div>
                        </div>

                        {received > 0 && (
                            <div className={cn(
                                "p-4 rounded-xl flex justify-between items-center transition-all",
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
                        )}
                    </div>
                )}

                <button
                    onClick={handleConfirm}
                    disabled={method === 'CASH' && (received < total || !receivedAmount)}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-base hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all shadow-xl shadow-slate-200 uppercase tracking-widest cursor-pointer"
                >
                    Confirm Order
                </button>
            </div>
        </div>
    );
}
