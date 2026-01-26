'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';

export default function StatusPage() {
    const [orders, setOrders] = useState<Order[]>([]);

    const fetchOrders = async () => {
        const res = await fetch('/api/orders');
        const data = await res.json();
        setOrders(data);
    };

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        fetchOrders();
        const interval = setInterval(fetchOrders, 1000);
        return () => clearInterval(interval);
    }, []);

    const inProgress = orders.filter(o => ['PENDING', 'PREPARING'].includes(o.status));
    const ready = orders.filter(o => o.status === 'READY');

    return (
        <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
            {/* Dynamic Header */}
            <div className="bg-primary p-6 text-white text-center shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent -translate-y-1/2 scale-150" />
                <h1 className="text-5xl font-black uppercase tracking-widest relative z-10 italic">Order Status</h1>
            </div>

            <div className="flex-1 flex gap-1 p-1">
                {/* Preparing Section */}
                <section className="flex-1 bg-slate-900 flex flex-col rounded-bl-2xl">
                    <div className="p-10 border-b border-slate-800 flex justify-between items-center">
                        <h2 className="text-4xl font-black text-slate-500 uppercase italic">Preparing</h2>
                        <div className="h-4 w-4 bg-accent rounded-full animate-ping" />
                    </div>
                    <div className="flex-1 p-10 overflow-y-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            {inProgress.map(order => (
                                <div key={order.id} className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <span className="text-7xl font-black text-white/90 tabular-nums">
                                        {order.orderNumber}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Ready Section */}
                <section className="flex-1 bg-slate-900 flex flex-col rounded-br-2xl border-l-2 border-slate-800">
                    <div className="p-10 border-b border-slate-800 flex justify-between items-center bg-success/5">
                        <h2 className="text-4xl font-black text-success uppercase italic">Ready to Pick Up</h2>
                        <div className="h-4 w-4 bg-success rounded-full" />
                    </div>
                    <div className="flex-1 p-10 overflow-y-auto">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                            {ready.map(order => (
                                <div key={order.id} className="text-center animate-bounce-slow">
                                    <span className="text-9xl font-black text-success drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] tabular-nums">
                                        {order.orderNumber}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer / Scrolling Marquee */}
            <footer className="bg-slate-900 border-t border-slate-800 p-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="text-slate-500 text-sm uppercase font-bold tracking-widest">Local Time</div>
                    <div className="text-white font-mono text-2xl">{isMounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
                <div className="flex-1 mx-12 overflow-hidden border-x border-slate-800 px-8">
                    <div className="text-slate-400 font-bold text-xl whitespace-nowrap animate-marquee">
                        ⭐ WELCOME TO OUR RESTAURANT! PLEASE HAVE YOUR ORDER NUMBER READY FOR PICKUP ⭐ FRESH FOOD PREPARED DAILY ⭐ ENJOY YOUR MEAL ⭐
                    </div>
                </div>
                <div className="text-slate-600 font-black italic text-2xl">FOODSH❤P</div>
            </footer>

            <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%) scale(1.05); }
          50% { transform: translateY(0) scale(1); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
