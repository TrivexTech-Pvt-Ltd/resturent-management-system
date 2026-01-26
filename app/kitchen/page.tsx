'use client';

import { useState, useEffect } from 'react';
import { Order } from '@/lib/types';

export default function KitchenPage() {
    const [orders, setOrders] = useState<Order[]>([]);

    const [isMounted, setIsMounted] = useState(false);

    const fetchOrders = async () => {
        const res = await fetch('/api/orders');
        const data = await res.json();
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
        await fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        fetchOrders();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">Kitchen Display</h1>
                    <p className="text-slate-400">Live order queue</p>
                </div>
                <div className="bg-slate-800 px-6 py-3 rounded-2xl flex items-center gap-4">
                    <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
                    <span className="font-mono text-xl">{isMounted ? new Date().toLocaleTimeString() : ''}</span>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {orders.map(order => (
                    <div key={order.id} className={`rounded-3xl p-6 flex flex-col h-full border-t-8 transition-all scale-100 hover:scale-[1.02] ${order.status === 'PENDING' ? 'bg-slate-800 border-accent' : 'bg-slate-800 border-primary'
                        }`}>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="text-xs uppercase tracking-widest text-slate-400 font-bold">Order No</span>
                                <h2 className="text-3xl font-black">#{order.orderNumber}</h2>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'PENDING' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'
                                }`}>
                                {order.status}
                            </div>
                        </div>

                        <div className="flex-1 space-y-3 mb-8">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center text-lg">
                                    <span className="text-slate-200">
                                        <span className="font-bold text-white mr-2">{item.quantity}x</span>
                                        {item.name}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto space-y-3">
                            {order.status === 'PENDING' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'PREPARING')}
                                    className="w-full bg-accent text-slate-900 py-4 rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all"
                                >
                                    Start Preparing
                                </button>
                            )}
                            {order.status === 'PREPARING' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'READY')}
                                    className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all"
                                >
                                    Mark as Ready
                                </button>
                            )}
                            {order.status === 'READY' && (
                                <button
                                    onClick={() => updateStatus(order.id, 'COMPLETED')}
                                    className="w-full bg-success text-white py-4 rounded-xl font-black uppercase text-sm hover:brightness-110 transition-all"
                                >
                                    Mark as Collected
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {orders.length === 0 && (
                    <div className="col-span-full h-96 flex flex-col items-center justify-center text-slate-600 border-4 border-dashed border-slate-800 rounded-3xl">
                        <span className="text-8xl mb-4">👨‍🍳</span>
                        <p className="text-2xl font-bold uppercase tracking-widest">Everything Served</p>
                    </div>
                )}
            </div>
        </div>
    );
}
