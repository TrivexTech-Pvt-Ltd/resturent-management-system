import { useState } from 'react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (method: 'CASH' | 'CARD') => void;
}

export default function PaymentModal({ isOpen, onClose, total, onConfirm }: PaymentModalProps) {
    const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-card w-full max-w-md rounded-3xl p-8 overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-2xl font-bold">Checkout</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-all text-secondary">✕</button>
                </div>

                <div className="text-center mb-8">
                    <p className="text-secondary text-sm uppercase tracking-wider mb-2 font-medium">Total Amount</p>
                    <p className="text-5xl font-black text-primary">{total.toFixed(2)}</p>
                </div>

                <div className="flex gap-4 mb-8">
                    <button
                        onClick={() => setMethod('CASH')}
                        className={`flex-1 p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === 'CASH' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50'
                            }`}
                    >
                        <span className="text-3xl">💵</span>
                        <span className="font-bold">Cash</span>
                    </button>
                    <button
                        onClick={() => setMethod('CARD')}
                        className={`flex-1 p-6 rounded-2xl border-2 flex flex-col items-center gap-3 transition-all ${method === 'CARD' ? 'border-primary bg-primary/5 text-primary' : 'border-transparent bg-slate-50'
                            }`}
                    >
                        <span className="text-3xl">💳</span>
                        <span className="font-bold">Card</span>
                    </button>
                </div>

                <button
                    onClick={() => onConfirm(method)}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all"
                >
                    Confirm Payment
                </button>
            </div>
        </div>
    );
}
