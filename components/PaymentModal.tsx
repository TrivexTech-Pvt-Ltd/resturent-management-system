'use client';

import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { Banknote, CreditCard, X, Check, ArrowRight, Loader2 } from 'lucide-react';

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    onConfirm: (method: 'CASH' | 'CARD') => void;
    isLoading?: boolean;
    initialAmount?: number | null;
}

function PaymentModal({
    isOpen,
    onClose,
    total,
    onConfirm,
    isLoading = false,
    initialAmount = null,
}: PaymentModalProps) {
    const [method, setMethod] = useState<'CASH' | 'CARD'>('CASH');
    const [receivedAmount, setReceivedAmount] = useState<string>('');

    // Reset or initialize form when modal opens
    useEffect(() => {
        if (isOpen) {
            setMethod('CASH');
            setReceivedAmount(initialAmount ? initialAmount.toString() : '');
        }
    }, [isOpen, initialAmount]);

    const received = parseFloat(receivedAmount) || 0;
    const balance = received - total;

    const handleConfirm = () => {
        if (method === 'CASH' && received < total) return;
        onConfirm(method);
    };

    const handleQuickAdd = (addVal: number) => {
        const cur = parseFloat(receivedAmount) || 0;
        setReceivedAmount((cur + addVal).toString());
    };

    const handleSetExact = () => {
        setReceivedAmount(total.toFixed(2));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-3xl p-6 overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-sm">
                            $
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-800 tracking-tight">Checkout Payment</h2>
                            <p className="text-xs text-slate-400 font-medium">Select method & finalize transaction</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-700 cursor-pointer disabled:opacity-50"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Payable Amount Highlight */}
                <div className="bg-gradient-to-br from-indigo-50/70 via-indigo-50/40 to-violet-50/70 p-5 rounded-2xl mb-5 text-center border border-indigo-100/60 shadow-inner">
                    <p className="text-indigo-600/80 text-[11px] font-black uppercase tracking-widest mb-1">
                        Total Amount Payable
                    </p>
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-sm font-black text-indigo-400">LKR</span>
                        <span className="text-4xl font-black text-indigo-600 tracking-tight tabular-nums">
                            {total.toFixed(2)}
                        </span>
                    </div>
                </div>

                {/* Payment Method Tabs */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button
                        type="button"
                        onClick={() => setMethod('CASH')}
                        disabled={isLoading}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider ${
                            method === 'CASH'
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-sm shadow-indigo-100'
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:text-slate-700'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Banknote className="w-5 h-5 text-emerald-600" />
                        <span>Cash Tender</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMethod('CARD')}
                        disabled={isLoading}
                        className={`p-3.5 rounded-2xl border-2 flex items-center justify-center gap-2.5 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider ${
                            method === 'CARD'
                                ? 'border-indigo-600 bg-indigo-50/60 text-indigo-700 shadow-sm shadow-indigo-100'
                                : 'border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200 hover:text-slate-700'
                        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <CreditCard className="w-5 h-5 text-indigo-600" />
                        <span>Card Payment</span>
                    </button>
                </div>

                {/* Cash Options */}
                {method === 'CASH' && (
                    <div className="space-y-4 mb-5">
                        <div>
                            <div className="flex justify-between items-center mb-1.5 px-1">
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                    Cash Tendered
                                </label>
                                <button
                                    type="button"
                                    onClick={handleSetExact}
                                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer hover:underline"
                                >
                                    Exact: {total.toFixed(2)}
                                </button>
                            </div>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">
                                    LKR
                                </span>
                                <input
                                    type="number"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    placeholder="0.00"
                                    autoFocus
                                    disabled={isLoading}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && received >= total) {
                                            handleConfirm();
                                        }
                                    }}
                                    className="w-full pl-14 pr-4 py-3 bg-slate-50 border-2 border-slate-200/80 rounded-2xl focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-black text-xl text-slate-800 placeholder:text-slate-300 disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5">
                            <button
                                type="button"
                                onClick={handleSetExact}
                                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                            >
                                Exact
                            </button>
                            {[500, 1000, 2000, 5000].map((amt) => (
                                <button
                                    key={amt}
                                    type="button"
                                    onClick={() => setReceivedAmount(amt.toString())}
                                    className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                                >
                                    {amt}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => setReceivedAmount('')}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-500 text-xs font-bold transition-all cursor-pointer ml-auto"
                            >
                                Clear
                            </button>
                        </div>

                        {/* Change / Due calculation banner */}
                        <div
                            className={cn(
                                'p-3.5 rounded-2xl flex justify-between items-center transition-all duration-200 border',
                                received > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none',
                                balance >= 0
                                    ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900'
                                    : 'bg-rose-50/80 border-rose-200/80 text-rose-900'
                            )}
                        >
                            <div>
                                <p
                                    className={cn(
                                        'text-[10px] font-black uppercase tracking-widest leading-none mb-1',
                                        balance >= 0 ? 'text-emerald-600' : 'text-rose-500'
                                    )}
                                >
                                    {balance >= 0 ? 'Change to Return' : 'Amount Still Due'}
                                </p>
                                <p
                                    className={cn(
                                        'text-2xl font-black tabular-nums leading-none',
                                        balance >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                    )}
                                >
                                    LKR {Math.abs(balance).toFixed(2)}
                                </p>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg">
                                {balance >= 0 ? '🤝' : '⚠️'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Confirm button */}
                <button
                    onClick={handleConfirm}
                    disabled={
                        (method === 'CASH' && (received < total || !receivedAmount)) || isLoading
                    }
                    className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-500/20 active:scale-[0.99] cursor-pointer flex justify-center items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Processing Order...</span>
                        </>
                    ) : (
                        <>
                            <span>Complete & Print Bill</span>
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

export default memo(PaymentModal);
