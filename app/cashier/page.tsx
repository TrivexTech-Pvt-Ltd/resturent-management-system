'use client';

import { useState, useEffect } from 'react';
import { MenuItem, Portion, OrderItem } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import PaymentModal from '@/components/PaymentModal';
import BillPrinter from '@/components/BillPrinter';
import AppLayout from '@/components/AppLayout';
import Link from 'next/link';
import { Search, UtensilsCrossed, Trash2, X, LayoutGrid, LayoutList } from 'lucide-react';
import { getMenu, saveOrder } from '@/lib/db';
import { useOrderStore } from '@/lib/store/useOrderStore';

export default function CashierPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [cols, setCols] = useState(2);

    // Zustand store for order management
    const { lastOrder, setLastOrder } = useOrderStore();

    console.log(lastOrder, "lastOrder");


    useEffect(() => {
        setIsMounted(true);
        getMenu()
            .then(data => {
                setMenu(data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching menu:', error);
                setIsLoading(false);
            });
    }, []);

    const addToCart = (product: MenuItem, portion: Portion) => {
        const orderItemId = portion.id || `${product.id}-${portion.size}`;

        setCart(prev => {
            const existing = prev.find(i => i.id === orderItemId);
            if (existing) {
                return prev.map(i => i.id === orderItemId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, {
                id: orderItemId,
                name: `${product.name} (${portion.size})`,
                price: portion.price,
                quantity: 1
            }];
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

    const categories = ['All', ...Array.from(new Set(menu.map(item => item.category)))];

    const filteredMenu = menu.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handlePlaceOrder = async (paymentMethod: 'CASH' | 'CARD') => {
        setIsProcessing(true);
        const orderData = {
            items: cart,
            total,
            paymentMethod,
        };

        try {
            const data = await saveOrder(orderData);
            console.log(data, "res");

            // Close payment modal first
            setIsPaymentOpen(false);

            // Clear cart and localStorage
            setCart([]);
            localStorage.setItem('last_order_status', 'success');
            localStorage.removeItem('current_cart');

            // Wait for payment modal to close before showing bill printer
            setTimeout(() => {
                setLastOrder(data);
            }, 300);
        } catch (error) {
            console.error('Error placing order:', error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex flex-col lg:flex-row flex-1 animate-pulse min-h-[calc(100vh-120px)]">
                    {/* Menu section skeleton */}
                    <main className="flex-1 p-4 md:p-6 lg:p-8 bg-slate-50/50">
                        <div className="max-w-7xl mx-auto space-y-6">
                            {/* Search + toggles skeleton */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="h-12 w-full md:w-96 bg-slate-200 rounded-2xl" />
                                <div className="h-12 w-24 bg-slate-200 rounded-2xl" />
                            </div>
                            {/* Category pills skeleton */}
                            <div className="flex flex-wrap gap-2">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-10 bg-slate-200 rounded-2xl" style={{ width: `${60 + i * 15}px` }} />
                                ))}
                            </div>
                            {/* Menu cards skeleton */}
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="glass-card p-4 rounded-2xl h-20 bg-slate-200" />
                                ))}
                            </div>
                        </div>
                    </main>

                    {/* Sidebar skeleton */}
                    <aside className="w-full lg:w-[420px] xl:w-[480px] glass-card border-t lg:border-t-0 lg:border-l flex flex-col p-4 md:p-6 bg-white shrink-0">
                        <div className="h-7 w-36 bg-slate-200 rounded-xl mb-6" />
                        <div className="flex-1 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-16 bg-slate-100 rounded-2xl" />
                            ))}
                        </div>
                        <div className="pt-4 border-t space-y-4 mt-4">
                            <div className="h-5 w-full bg-slate-100 rounded-lg" />
                            <div className="h-7 w-full bg-slate-200 rounded-lg" />
                            <div className="h-14 w-full bg-slate-200 rounded-xl" />
                        </div>
                    </aside>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col lg:flex-row flex-1 min-h-[calc(100vh-120px)]">
                {/* Menu Section */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 bg-slate-50/50 min-w-0">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col gap-6 mb-8">
                            {/* Search and View Toggles */}
                            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full md:w-96 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Search menu items..."
                                        className="w-full pl-11 pr-10 py-3 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all shadow-sm text-sm font-medium"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => setCols(1)}
                                        className={`p-2.5 rounded-xl transition-all cursor-pointer ${cols === 1 ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                        title="1 Column View"
                                    >
                                        <LayoutList className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCols(2)}
                                        className={`p-2.5 rounded-xl transition-all cursor-pointer ${cols === 2 ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                        title="2 Column View"
                                    >
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Categories - Horizontal Scroll */}
                            <div className="flex flex-wrap gap-2 pb-2">
                                {isLoading ? (
                                    [...Array(6)].map((_, i) => (
                                        <div key={i} className="h-10 bg-slate-200 rounded-2xl animate-pulse" style={{ width: `${80 + (i % 3) * 20}px` }} />
                                    ))
                                ) : (
                                categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${selectedCategory === category
                                            ? 'bg-primary text-white shadow-lg shadow-primary/25 scale-105'
                                            : 'bg-white text-slate-600 border border-slate-200 hover:border-primary/40 active:scale-95'
                                            }`}
                                    >
                                        {category}
                                    </button>
                                ))
                                )}
                            </div>
                        </div>

                        {filteredMenu.length === 0 && !isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="bg-slate-100 p-6 rounded-full mb-4">
                                    <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">No items found</h3>
                                <p>Try adjusting your search or category filter</p>
                                <button
                                    onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                                    className="mt-4 text-primary font-semibold hover:underline cursor-pointer"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div className={`grid grid-cols-1 ${cols === 2 ? 'xl:grid-cols-2' : 'xl:grid-cols-1'} gap-3`}>
                                {isLoading ? (
                                    [...Array(8)].map((_, i) => (
                                        <div key={i} className="glass-card p-4 rounded-2xl border border-slate-100 flex items-center justify-between gap-4 animate-pulse">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 bg-slate-200 rounded-xl shrink-0" />
                                                <div className="space-y-2">
                                                    <div className="h-4 w-32 bg-slate-200 rounded-lg" />
                                                    <div className="h-3 w-20 bg-slate-100 rounded-lg" />
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="h-8 w-14 bg-slate-100 rounded-xl" />
                                                <div className="h-8 w-14 bg-slate-100 rounded-xl" />
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    filteredMenu.map(item => (
                                        <MenuItemCard key={item.id} item={item} onAdd={addToCart} />
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </main>

                {/* Order Sidebar */}
                <aside className="w-full lg:w-[420px] xl:w-[480px] glass-card border-t lg:border-t-0 lg:border-l flex flex-col p-4 md:p-6 bg-white shadow-2xl lg:shadow-none z-20 shrink-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)]">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800">
                            Current Order
                            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">{cart.length}</span>
                        </h2>
                        {cart.length > 0 && (
                            <button
                                onClick={() => setCart([])}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 md:mb-6 pr-1 max-h-[45vh] lg:max-h-none min-h-[160px]">
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
                                        className="ml-auto w-6 h-6 flex items-center justify-center text-red-500 bg-red-50 hover:scale-110 rounded-lg transition-all absolute top-2 right-2 md:static cursor-pointer"
                                        title="Remove item"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex items-center justify-between gap-2 md:gap-4 mt-1 md:mt-0">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 mb-1 truncate text-sm md:text-base">{item.name}</h4>
                                            <p className="text-xs text-slate-400 font-medium">{item.price.toFixed(2)} each</p>
                                        </div>

                                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-1 py-0.5">
                                            <button
                                                onClick={() => decrementQuantity(item.id)}
                                                disabled={item.quantity === 1}
                                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded text-slate-600 hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs md:text-sm shadow-sm cursor-pointer"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 md:w-8 text-center font-bold text-xs md:text-sm text-slate-900">{item.quantity}</span>
                                            <button
                                                onClick={() => incrementQuantity(item.id)}
                                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded text-slate-600 hover:bg-primary hover:text-white transition-all font-bold text-xs md:text-sm shadow-sm cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="font-black text-sm md:text-lg text-primary min-w-[60px] md:min-w-[80px] text-right">{(item.price * item.quantity).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="space-y-3 md:space-y-4 pt-3 md:pt-4 border-t shrink-0">
                        <div className="flex justify-between text-secondary text-sm md:text-base">
                            <span>Subtotal</span>
                            <span>{total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xl md:text-2xl font-bold text-slate-900 pt-1 md:pt-2">
                            <span>Total</span>
                            <span className="text-primary">{total.toFixed(2)}</span>
                        </div>

                        <button
                            disabled={cart.length === 0}
                            onClick={() => setIsPaymentOpen(true)}
                            className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer"
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
                isLoading={isProcessing}
            />
            <BillPrinter order={lastOrder} endPoint="print" />
        </AppLayout>
    );
}
