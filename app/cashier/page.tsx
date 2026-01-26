'use client';

import { useState, useEffect } from 'react';
import { MenuItem, OrderItem, Order } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import PaymentModal from '@/components/PaymentModal';
import BillPrinter from '@/components/BillPrinter';

export default function CashierPage() {
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [lastOrder, setLastOrder] = useState<Order | null>(null);

    useEffect(() => {
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

            // Trigger print after a short delay for state update
            setTimeout(() => {
                window.print();
            }, 500);
        }
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="px-8 py-4 glass-card border-b flex justify-between items-center z-10">
                <h1 className="text-2xl font-bold text-primary">FoodShop POS</h1>
                <div className="flex gap-4 items-center">
                    <span className="text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">{new Date().toLocaleDateString()}</span>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Menu Section */}
                <main className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                <aside className="w-96 glass-card border-l flex flex-col p-6 overflow-hidden">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                        Current Order
                        <span className="bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">{cart.length}</span>
                    </h2>

                    <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                        {cart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-6xl mb-4">🛒</span>
                                <p>Empty cart</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="flex justify-between items-start group">
                                    <div>
                                        <h4 className="font-medium text-slate-800">{item.name}</h4>
                                        <p className="text-sm text-slate-500">x{item.quantity} @ ${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-danger text-xs opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t">
                        <div className="flex justify-between text-secondary">
                            <span>Subtotal</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-secondary">
                            <span>Tax (0%)</span>
                            <span>$0.00</span>
                        </div>
                        <div className="flex justify-between text-2xl font-bold text-slate-900 pt-2">
                            <span>Total</span>
                            <span className="text-primary">${total.toFixed(2)}</span>
                        </div>

                        <button
                            disabled={cart.length === 0}
                            onClick={() => setIsPaymentOpen(true)}
                            className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
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
