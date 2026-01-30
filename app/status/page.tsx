'use client';

import { useState, useEffect, useRef } from 'react';
import { Order } from '@/lib/types';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

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

    const prevStatusesRef = useRef<Map<string, string>>(new Map());

    const playNotificationSound = () => {
        try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(err => console.error("Error playing notification sound:", err));
        } catch (error) {
            console.error('Error initializing sound:', error);
        }
    };

    useEffect(() => {
        let shouldPlaySound = false;
        const newStatuses = new Map<string, string>();

        orders.forEach(order => {
            newStatuses.set(order.id, order.status);
            if (order.status === 'READY') {
                const prevStatus = prevStatusesRef.current.get(order.id);
                // Play sound only if status changed to READY from a known previous status
                if (prevStatus && prevStatus !== 'READY') {
                    shouldPlaySound = true;
                }
            }
        });

        if (shouldPlaySound) {
            playNotificationSound();
        }

        prevStatusesRef.current = newStatuses;
    }, [orders]);

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col overflow-x-hidden md:overflow-hidden">
            {/* Dynamic Header */}
            <div className="bg-primary p-4 md:p-6 text-white text-center shadow-2xl relative overflow-hidden shrink-0 flex items-center justify-center">
                <Link href="/" className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/10 hover:bg-white/20 p-2 md:p-3 rounded-full transition-all backdrop-blur-sm border border-white/10 group">
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:-translate-x-1 transition-transform" />
                </Link>
                <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent -translate-y-1/2 scale-150" />
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-widest relative z-10 italic">Order Status</h1>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-1 p-1 overflow-hidden">
                {/* Preparing Section */}
                <section className="flex-1 bg-slate-900 flex flex-col rounded-t-2xl lg:rounded-bl-2xl lg:rounded-tr-none min-h-[40vh] lg:min-h-0">
                    <div className="p-6 md:p-10 border-b border-slate-800 flex justify-between items-center shrink-0">
                        <h2 className="text-2xl md:text-4xl font-black text-slate-500 uppercase italic">Preparing</h2>
                        <div className="h-3 w-3 md:h-4 md:w-4 bg-accent rounded-full animate-ping" />
                    </div>
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto min-h-0">
                        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-4 md:gap-8">
                            {inProgress.map(order => (
                                <div key={order.id} className="text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <span className="text-4xl md:text-7xl font-black text-white/90 tabular-nums">
                                        {order.orderNumber}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Ready Section */}
                <section className="flex-1 bg-slate-900 flex flex-col rounded-b-2xl lg:rounded-br-2xl lg:rounded-bl-none border-t-2 lg:border-t-0 lg:border-l-2 border-slate-800 min-h-[40vh] lg:min-h-0">
                    <div className="p-6 md:p-10 border-b border-slate-800 flex justify-between items-center bg-success/5 shrink-0">
                        <h2 className="text-2xl md:text-4xl font-black text-success uppercase italic">Ready to Pick Up</h2>
                        <div className="h-3 w-3 md:h-4 md:w-4 bg-success rounded-full" />
                    </div>
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto min-h-0">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-8 md:gap-12">
                            {ready.map(order => (
                                <div key={order.id} className="text-center animate-bounce-slow">
                                    <span className="text-5xl md:text-7xl lg:text-8xl font-black text-success drop-shadow-[0_0_20px_rgba(16,185,129,0.3)] tabular-nums block">
                                        {order.orderNumber}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Footer / Scrolling Marquee */}
            <footer className="bg-slate-900 border-t border-slate-800 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0 shrink-0">
                <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div className="text-slate-500 text-xs md:text-sm uppercase font-bold tracking-widest">Local Time</div>
                    <div className="text-white font-mono text-xl md:text-2xl">{isMounted ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
                <div className="flex-1 mx-0 md:mx-12 overflow-hidden border-x-0 md:border-x border-slate-800 px-0 md:px-8 w-full md:w-auto">
                    <div className="text-slate-400 font-bold text-sm md:text-xl whitespace-nowrap animate-marquee">
                        ⭐ WELCOME TO OUR RESTAURANT! PLEASE HAVE YOUR ORDER NUMBER READY FOR PICKUP ⭐ FRESH FOOD PREPARED DAILY ⭐ ENJOY YOUR MEAL ⭐
                    </div>
                </div>
                <div className="text-slate-600 font-black italic text-xl md:text-2xl hidden md:block"><span className="text-indigo-600">Next</span>Serve</div>
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
