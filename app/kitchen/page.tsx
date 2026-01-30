'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';
import { api } from '@/lib/api';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    const fetchOrders = async () => {
        const { data } = await api.get('/orders');
        // Only show incomplete orders
        setOrders(data.filter((o: Order) => o.status !== 'COMPLETED'));
    };

    useEffect(() => {
        setIsMounted(true);
        fetchOrders();
        const interval = setInterval(fetchOrders, 1000); // Poll every 1 second
        return () => clearInterval(interval);
    }, []);

    const updateStatus = async (id: string, newStatus: Order['status']) => {
        await api.patch(`/orders/${id}`, { status: newStatus });
        fetchOrders();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-4 md:p-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/" className="bg-slate-800 hover:bg-slate-700 p-2 rounded-full transition-colors text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic">Kitchen Display</h1>
                        <p className="text-slate-400 text-sm md:text-base">Live order queue</p>
                    </div>
                </div>
                <div className="bg-slate-800 px-4 py-2 md:px-6 md:py-3 rounded-2xl flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                        <span className="font-mono text-lg md:text-xl">{isMounted ? new Date().toLocaleTimeString() : ''}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {orders.map(order => (
                    <div key={order.id} className={`rounded-3xl p-5 md:p-6 flex flex-col h-full border-t-8 transition-all scale-100 hover:scale-[1.02] ${order.status === 'PENDING' ? 'bg-slate-800 border-accent' : 'bg-slate-800 border-primary'
                        }`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-[10px] md:text-xs uppercase tracking-widest text-slate-400 font-bold">Order No</span>
                                <h2 className="text-2xl md:text-3xl font-black">#{order.orderNumber}</h2>
                            </div>
                            <div className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-[10px] md:text-xs font-bold uppercase ${order.status === 'PENDING' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
                                }`}>
                                {order.status}
                            </div>
                        </div>

                        <div className="flex-1 space-y-2 md:space-y-3 mb-6 md:mb-8">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-base md:text-lg">
                                    <span className="text-slate-200">
                                        <span className="font-bold text-white mr-2">{item.quantity}x</span>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto space-y-2 md:space-y-3">
                            {order.status === 'PENDING' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'PREPARING')}
                                    className="w-full bg-accent text-slate-900 py-3 md:py-4 rounded-xl font-black uppercase text-xs md:text-sm hover:brightness-110 transition-all"
                                >
                                    Start Preparing
                                </button>
                            )}
                            {order.status === 'PREPARING' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'READY')}
                                    className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-black uppercase text-xs md:text-sm hover:brightness-110 transition-all"
                                >
                                    Mark as Ready
                                </button>
                            )}
                            {order.status === 'READY' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'COMPLETED')}
                                    className="w-full bg-success text-white py-3 md:py-4 rounded-xl font-black uppercase text-xs md:text-sm hover:brightness-110 transition-all"
                                >
                                    Mark as Collected
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="col-span-full h-64 md:h-96 flex flex-col items-center justify-center text-slate-600 border-4 border-dashed border-slate-800 rounded-3xl">
                        <span className="text-6xl md:text-8xl mb-4">👨‍🍳</span>
                        <p className="text-xl md:text-2xl font-bold uppercase tracking-widest text-center px-4">Everything Served</p>
                    </div>
                )}
            </div>
        </div>
    );
}
