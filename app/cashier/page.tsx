'use client';

import { useState, useEffect } from 'react';
import { MenuItem, OrderItem, Order } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import PaymentModal from '@/components/PaymentModal';
import BillPrinter from '@/components/BillPrinter';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function CashierPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);

    useEffect(() => {
        setIsMounted(true);
        fetch('/api/menu')
            .then(res => res.json())
            .then(data => {
                setMenu(data);
                setIsLoading(false);
            });
    }, []);

    const addToCart = (item: MenuItem) => {
        setCart(prev => {
            const existing = prev.find(i => i.id === item.id);
            if (existing) {
                return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, quantity: 1 }];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const incrementQuantity = (id: string) => {
        setCart(prev => prev.map(i =>
            i.id === id ? { ...i, quantity: i.quantity + 1 } : i
        ));
    };

    const decrementQuantity = (id: string) => {
        setCart(prev => prev.map(i => {
            if (i.id === id) {
                if (i.quantity === 1) {
                    return i; // Don't go below 1
                }
                return { ...i, quantity: i.quantity - 1 };
            }
            return i;
        }));
    };

    useEffect(() => {
        localStorage.setItem('current_cart', JSON.stringify(cart));
    }, [cart]);

    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const handlePlaceOrder = async (paymentMethod: 'CASH' | 'CARD') => {
        const orderData = {
            items: cart,
            total,
            paymentMethod,
        };

        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
        });

        if (res.ok) {
            const newOrder = await res.json();
            setLastOrder(newOrder);
            setCart([]);
            localStorage.setItem('last_order_status', 'success');
            localStorage.removeItem('current_cart');
            setIsPaymentOpen(false);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="px-4 md:px-8 py-3 md:py-4 glass-card border-b flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <Link href="/" className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl md:text-2xl font-bold text-primary">NextServe</h1>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs md:text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                        {isMounted ? new Date().toLocaleDateString() : ''}
                    </span>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Menu Section */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {isLoading ? (
                            [...Array(8)].map((_, i) => (
                                <div key={i} className="glass-card p-4 rounded-2xl h-64 animate-pulse bg-slate-200" />
                            ))
                        ) : (
                            menu.map(item => (
                                <MenuItemCard key={item.id} item={item} onAdd={addToCart} />
                            ))
                        )}
                    </div>
                </main>

                {/* Order Sidebar */}
                <aside className="w-full lg:w-[420px] xl:w-[480px] h-[45vh] lg:h-auto glass-card border-t lg:border-t-0 lg:border-l flex flex-col p-4 md:p-6 overflow-hidden bg-white shadow-2xl lg:shadow-none z-20">
                    <h2 className="text-lg md:text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
                        Current Order
                        <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">{cart.length}</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 md:mb-6 pr-1">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-4xl md:text-6xl mb-2 md:mb-4">🛒</span>
                                <p className="text-sm md:text-base">Empty cart</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="glass-card p-3 md:p-4 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all relative">
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="ml-auto w-6 h-6 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100 absolute top-2 right-2 md:static"
                                        title="Remove item"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                    </button>

                                    <div className="flex items-center justify-between gap-2 md:gap-4 mt-1 md:mt-0">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 mb-1 truncate text-sm md:text-base">{item.name}</h4>
                                            <p className="text-xs text-slate-400 font-medium">${item.price.toFixed(2)} each</p>
                                        </div>

                                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-1 py-0.5">
                                            <button
                                                onClick={() => decrementQuantity(item.id)}
                                                disabled={item.quantity === 1}
                                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded text-slate-600 hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs md:text-sm shadow-sm"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 md:w-8 text-center font-bold text-xs md:text-sm text-slate-900">{item.quantity}</span>
                                            <button
                                                onClick={() => incrementQuantity(item.id)}
                                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded text-slate-600 hover:bg-primary hover:text-white transition-all font-bold text-xs md:text-sm shadow-sm"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="font-black text-sm md:text-lg text-primary min-w-[60px] md:min-w-[80px] text-right">${(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t shrink-0">
                        <div className="flex justify-between text-secondary text-sm md:text-base">
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-secondary text-sm md:text-base">
                            <span>Tax (0%)</span>
                            <span>$0.00</span>
                        </div>
                        <div className="flex justify-between text-xl md:text-2xl font-bold text-slate-900 pt-1 md:pt-2">
                            <span>Total</span>
                            <span className="text-primary">${total.toFixed(2)}</span>
                        </div>

                        <button
                            disabled={cart.length === 0}
                            onClick={() => setIsPaymentOpen(true)}
                            className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
                        >
                            Checkout
                        </button>
                    </div>
                </aside>
            </div>

            <PaymentModal
                isOpen={isPaymentOpen}
                onClose={() => setIsPaymentOpen(false)}
                total={total}
                onConfirm={handlePlaceOrder}
            />
            <BillPrinter order={lastOrder} />
        </div>
    );
}
