'use client';

import { useOrderStore } from '@/lib/store/useOrderStore';
import { LastOrder, Order } from '@/lib/types';

interface BillPrinterProps {
    order: LastOrder | null;
}

export default function BillPrinter({ order }: BillPrinterProps) {

    const clearLastOrder = useOrderStore(s => s.clearLastOrder);

    async function handlePrint() {
        if (!order) return;
        try {
            await sendPrint(order);
            // Optional: wait a bit or just close
            clearLastOrder();
        } catch (error) {
            console.error("Print failed:", error);
            // Maybe don't close if it fails? Or notify user?
            // For now, let's just close as requested.
            clearLastOrder();
        }
    }

    async function sendPrint(data: any) {
        await fetch(`http://localhost:5000/print`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-API-KEY": "trivex-resturent-7090"
            },
            body: JSON.stringify(data)
        });
    }

    if (!order) return null;

    return (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[2px] transition-all duration-500 ${order ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-white w-full max-w-[340px] rounded-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 relative no-print">
                {/* Decorative Header */}
                <div className="bg-linear-to-br from-primary to-indigo-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_30%_20%,var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    <div className="relative z-10 text-center">
                        <div className="w-12 h-12 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30 shadow-xl animate-bounce-slow">
                            <span className="text-2xl">✨</span>
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-widest italic">Success!</h2>
                        <p className="text-indigo-100 text-[10px] font-medium uppercase tracking-wider">Order #{order.orderNo} Placed</p>
                    </div>
                </div>

                {/* Receipt Body */}
                <div className="p-6 bg-white relative">
                    {/* Jagged Edge Simulation Top */}
                    <div className="absolute top-0 left-0 w-full flex overflow-hidden -translate-y-1/2 opacity-5">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="min-w-[20px] h-4 bg-slate-900 rotate-45 mx-[-5px]" />
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-50">
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bill Details</h3>
                            <p className="text-[10px] text-slate-400 font-bold">#{order.orderNo}</p>
                        </div>
                    </div>

                    <div className="space-y-3 mb-4 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group transition-all">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-[10px]">
                                        {item.qty}x
                                    </div>
                                    <span className="font-bold text-slate-700 text-xs truncate max-w-[140px] uppercase">{item.name}</span>
                                </div>
                                <span className="font-mono text-slate-500 text-xs">{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-slate-100 pt-4 space-y-2">
                        <div className="flex justify-between text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span className="font-mono">{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xl font-black text-slate-900 pt-1">
                            <span className="italic tracking-tighter uppercase text-sm">Total Paid</span>
                            <span className="text-primary tabular-nums">{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-5 bg-slate-50 border-t border-slate-100">
                    <button
                        onClick={handlePrint}
                        className="w-full bg-primary text-white py-3 rounded-2xl font-black text-base hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest cursor-pointer"
                    >
                        <span>Print Bill</span>
                    </button>
                </div>
            </div>

            <div className="print-only p-6 w-[80mm] mx-auto text-black font-sans leading-tight bg-white">
                {/* Stylized Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-2">
                        <div className="border-4 border-black p-1 px-2">
                            <h2 className="text-2xl font-black uppercase tracking-tighter italic">FS</h2>
                        </div>
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-widest">NextServe</h2>
                    <p className="text-[10px] font-bold uppercase opacity-60 italic tracking-widest">Premium Quality Service</p>
                    <div className="mt-2 text-[10px] space-y-0.5">
                        <p>123 KITCHEN STREET, CITY CENTRE</p>
                        <p>PHONE: +94 11 234 5678</p>
                    </div>
                </div>

                <div className="border-b-[3px] border-black my-4" />

                {/* Order Meta Info */}
                <div className="flex justify-between items-center mb-1 text-[11px] font-bold">
                    <span>ORDER NO:</span>
                    <span className="text-sm">#{order.orderNo}</span>
                </div>
                {/* <div className="flex justify-between items-center mb-1 text-[11px]">
                    <span>DATE:</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                </div> */}
                {/* <div className="flex justify-between items-center mb-4 text-[11px]">
                    <span>PAY METHOD:</span>
                    <span className="uppercase">{order.paymentMethod}</span>
                </div> */}

                <div className="border-b border-black my-4" />

                {/* Table Header */}
                <div className="flex justify-between text-[10px] font-black uppercase mb-2 border-b border-black/10 pb-1">
                    <span>Description / Qty</span>
                    <span>Amount</span>
                </div>

                {/* Items List */}
                <div className="space-y-4">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="font-bold text-[11px] uppercase">{item.name}</span>
                                <span className="text-[9px] italic opacity-70">
                                    {item.qty} x {item.price.toFixed(2)}
                                </span>
                            </div>
                            <span className="font-bold text-[11px] align-bottom">
                                {(item.price * item.qty).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                <div className="border-b-2 border-black my-4" />

                {/* Totals Section */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                        <span>Subtotal:</span>
                        <span>{order.total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-black italic mt-2 pt-2 border-t border-black/5">
                        <span>TOTAL:</span>
                        <span>{order.total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="border-b border-black my-6" />

                <div className="text-center">
                    <p className="font-black tracking-[4px] text-[12px] uppercase mb-1">Thank You!</p>
                    <p className="text-[10px] opacity-70 italic mb-6 uppercase">Visit us again soon</p>

                    {/* Simulated Barcode with ID */}
                    <div className="inline-block">
                        <div className="flex gap-px justify-center h-8 items-end mb-1 px-4 border-l border-r border-black/10">
                            {[...Array(40)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-black w-px"
                                    style={{ height: `${20 + Math.random() * 15}px`, opacity: Math.random() > 0.1 ? 1 : 0.4 }}
                                />
                            ))}
                        </div>
                        <p className="text-[9px] font-mono tracking-[3px] uppercase mt-1">{(order.orderNo || '000000000000').substring(0, 12)}</p>
                    </div>
                </div>

                <div className="text-[8px] text-center mt-6 opacity-40 uppercase tracking-tighter">
                    Generated by NextServe System
                </div>
            </div>

            <style jsx>{`
                .animate-bounce-slow {
                    animation: bounce-slow 3s ease-in-out infinite;
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
}
