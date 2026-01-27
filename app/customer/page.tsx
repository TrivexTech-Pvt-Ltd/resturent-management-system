'use client';

import { useState, useEffect } from 'react';
import { OrderItem, Order } from '@/lib/types';

export default function CustomerDisplay() {
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [total, setTotal] = useState(0);
    const [isOrdered, setIsOrdered] = useState(false);
    const [readyOrders, setReadyOrders] = useState<Order[]>([]);

    const fetchReadyOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            const data: Order[] = await res.json();
            setReadyOrders(data.filter(o => o.status === 'READY'));
        } catch (error) {
            console.error('Failed to fetch orders:', error);
        }
    };

    useEffect(() => {
        fetchReadyOrders();
        const interval = setInterval(fetchReadyOrders, 2000);
        return () => clearInterval(interval);
    }, []);


    useEffect(() => {
        const handleStorage = () => {
            const savedCart = localStorage.getItem('current_cart');
            const lastOrder = localStorage.getItem('last_order_status');

            if (savedCart) {
                setCart(JSON.parse(savedCart));
            }

            if (lastOrder === 'success') {
                setIsOrdered(true);
                setTimeout(() => {
                    setIsOrdered(false);
                    localStorage.removeItem('last_order_status');
                }, 5000);
            }
        };

        window.addEventListener('storage', handleStorage);
        handleStorage(); // Initial load

        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        setTotal(cart.reduce((sum, item) => sum + (item.price * item.quantity), 0));
    }, [cart]);

    if (isOrdered) {
        return (
            <div className="h-screen bg-primary flex flex-col items-center justify-center text-white p-12 text-center">
                <span className="text-9xl mb-8 animate-bounce">🎉</span>
                <h1 className="text-7xl font-black mb-4 uppercase">Thank You!</h1>
                <p className="text-3xl font-medium opacity-90">Please wait for your order number on the screen.</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                <h1 className="text-4xl font-black italic"><span className="text-indigo-600">Next</span>Serve</h1>
                <div className="text-right">
                    <p className="text-slate-400 text-sm uppercase font-bold tracking-widest">Customer Display</p>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Ad / Promo Section */}
                <div className="flex-[2] bg-slate-100 p-12 flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="relative z-10 text-center">
                        <span className="text-8xl mb-6 block">🥤</span>
                        <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Happy Hour!</h2>
                        <p className="text-2xl text-slate-600 mb-8 max-w-md mx-auto">Get 50% off all drinks between 2 PM and 4 PM.</p>
                        <div className="bg-primary text-white px-8 py-3 rounded-full text-xl font-bold inline-block">Order Now</div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/4" />
                </div>

                {/* Cart Review Section */}
                <div className="flex-1 border-l-4 border-slate-100 flex flex-col p-10 bg-white">
                    <h3 className="text-2xl font-bold mb-8 text-slate-400 uppercase tracking-widest border-b pb-4">Your Order</h3>

                    <div className="flex-1 overflow-y-auto space-y-6">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <span className="text-8xl mb-4 opacity-20">🍽️</span>
                                <p className="text-xl font-medium italic">Welcome! We're ready to take your order.</p>
                            </div>
                        ) : (
                            cart.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center animate-in slide-in-from-right duration-300">
                                    <div className="flex items-center gap-4">
                                        <span className="bg-slate-100 w-10 h-10 flex items-center justify-center rounded-lg font-bold text-slate-600">
                                            {item.quantity}
                                        </span>
                                        <span className="text-xl font-bold text-slate-800">{item.name}</span>
                                    </div>
                                    <span className="text-xl font-mono text-slate-500">${(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="mt-8 pt-8 border-t-4 border-slate-900">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xl text-slate-500 font-bold uppercase">Tax</span>
                            <span className="text-xl font-mono">$0.00</span>
                        </div>
                        <div className="flex justify-between items-end">
                            <span className="text-3xl font-black uppercase text-slate-900">Total</span>
                            <div className="text-right">
                                <span className="text-6xl font-black text-primary font-mono tracking-tighter">${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ready Orders Ticker */}
            {readyOrders.length > 0 && (
                <div className="bg-success py-4 overflow-hidden relative border-t-4 border-white/20">
                    <div className="flex items-center">
                        <div className="bg-white text-success px-6 py-2 font-black uppercase italic ml-8 rounded-lg shadow-lg z-10 flex items-center gap-3">
                            <span className="animate-pulse">🔔</span> READY FOR PICKUP
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <div className="flex gap-12 animate-marquee-fast whitespace-nowrap pl-12">
                                {readyOrders.map(order => (
                                    <span key={order.id} className="text-white text-4xl font-black drop-shadow-md">
                                        #{order.orderNumber}
                                    </span>
                                ))}
                                {/* Repeat for seamless loop if few orders */}
                                {readyOrders.length < 5 && readyOrders.map(order => (
                                    <span key={order.id + '_dup'} className="text-white text-4xl font-black drop-shadow-md">
                                        #{order.orderNumber}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes marquee-fast {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-100%); }
                }
                .animate-marquee-fast {
                    animation: marquee-fast 15s linear infinite;
                }
            `}</style>
        </div>
    );
}
