'use client';

import { useOrderStore } from '@/lib/store/useOrderStore';
import { LastOrder, Order } from '@/lib/types';

interface BillPrinterProps {
    order: LastOrder | null;
}

export default function BillPrinter({ order }: BillPrinterProps) {

    const lastOrder = useOrderStore(s => s.lastOrder);
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md transition-all duration-500 ${order ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="bg-white w-full max-w-[400px] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500 relative no-print">
                {/* Decorative Header */}
                <div className="bg-gradient-to-br from-primary to-indigo-600 p-8 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[radial-gradient(circle_at_30%_20%,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-lg rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-xl animate-bounce-slow">
                            <span className="text-3xl">✨</span>
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-widest italic">Success!</h2>
                        <p className="text-indigo-100 text-sm font-medium">Order #{order.orderNo} has been placed</p>
                    </div>
                </div>

                {/* Receipt Body */}
                <div className="p-8 bg-white relative">
                    {/* Jagged Edge Simulation Top */}
                    <div className="absolute top-0 left-0 w-full flex overflow-hidden -translate-y-1/2 opacity-5">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="min-w-[20px] h-4 bg-slate-900 rotate-45 mx-[-5px]" />
                        ))}
                    </div>

                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Bill Details</h3>
                            <div className="flex gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                <span>#{order.orderNo}</span>
                                <span>•</span>
                                {/* <span>{new Date(order.createdAt).toLocaleDateString()}</span> */}
                            </div>
                        </div>
                        <div className="text-right">
                            {/* <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${order.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {order.paymentMethod}
                            </span> */}
                        </div>
                    </div>

                    <div className="space-y-4 mb-8 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center group transition-all hover:translate-x-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs">
                                        {item.qty}x
                                    </div>
                                    <span className="font-semibold text-slate-700">{item.name}</span>
                                </div>
                                <span className="font-mono text-slate-500">{(item.price * item.qty).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="border-t-2 border-dashed border-slate-100 pt-6 space-y-3">
                        <div className="flex justify-between text-slate-400 text-sm">
                            <span>Subtotal</span>
                            <span className="font-mono">{order.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-2xl font-black text-slate-900 pt-2">
                            <span className="italic tracking-tighter">TOTAL PAID</span>
                            <span className="text-primary tabular-nums">{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-8 bg-slate-50 flex gap-3 border-t border-slate-100">
                    <button
                        onClick={() => window.location.reload()}
                        className="flex-1 py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        <span>Done</span>
                    </button>
                    <button
                        onClick={() => sendPrint(order)}
                        className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black text-lg hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                        <span>Print Bill</span>
                        <span className="text-xl">🖨️</span>
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
                        <div className="flex gap-[1px] justify-center h-8 items-end mb-1 px-4 border-l border-r border-black/10">
                            {[...Array(40)].map((_, i) => (
                                <div
                                    key={i}
                                    className="bg-black w-[1px]"
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
