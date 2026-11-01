'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { MenuItem, Portion, OrderItem } from '@/lib/types';
import MenuItemCard from '@/components/MenuItemCard';
import PaymentModal from '@/components/PaymentModal';
import BillPrinter from '@/components/BillPrinter';
import AppLayout from '@/components/AppLayout';
import {
    Search,
    UtensilsCrossed,
    Trash2,
    X,
    LayoutGrid,
    LayoutList,
    Clock,
    Printer,
    ShoppingBag,
    Receipt,
} from 'lucide-react';
import { getMenu, saveOrder } from '@/lib/db';
import { useOrderStore } from '@/lib/store/useOrderStore';
import toast from 'react-hot-toast';

export default function CashierPage() {
    const [isMounted, setIsMounted] = useState(false);
    const [menu, setMenu] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<OrderItem[]>([]);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Zustand store for order management
    const { lastOrder, setLastOrder } = useOrderStore();

    // Live Clock
    useEffect(() => {
        setIsMounted(true);
        const updateClock = () => {
            const now = new Date();
            setCurrentTime(
                now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            );
            setCurrentDate(
                now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })
            );
        };
        updateClock();
        const interval = setInterval(updateClock, 1000);
        return () => clearInterval(interval);
    }, []);

    // Load menu from backend
    useEffect(() => {
        getMenu()
            .then((data) => {
                setMenu(data);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching menu:', error);
                setIsLoading(false);
                toast.error('Failed to load menu items');
            });
    }, []);

    // Restore cached cart if exists
    useEffect(() => {
        try {
            const saved = localStorage.getItem('current_cart');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setCart(parsed);
                }
            }
        } catch {
            // ignore JSON parse errors
        }
    }, []);

    // Save cart updates to localStorage
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('current_cart', JSON.stringify(cart));
        }
    }, [cart, isMounted]);

    // Keyboard shortcuts: / to search, Esc to clear
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
                setSearchQuery('');
                searchInputRef.current?.blur();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const addToCart = (product: MenuItem, portion: Portion) => {
        const orderItemId = portion.id || `${product.id}-${portion.size}`;

        setCart((prev) => {
            const existing = prev.find((i) => i.id === orderItemId);
            if (existing) {
                return prev.map((i) =>
                    i.id === orderItemId ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [
                ...prev,
                {
                    id: orderItemId,
                    name: `${product.name} (${portion.size || 'Standard'})`,
                    price: portion.price,
                    quantity: 1,
                },
            ];
        });
    };

    const removeFromCart = (id: string) => {
        setCart((prev) => prev.filter((i) => i.id !== id));
    };

    const incrementQuantity = (id: string) => {
        setCart((prev) =>
            prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + 1 } : i))
        );
    };

    const decrementQuantity = (id: string) => {
        setCart((prev) =>
            prev.map((i) => {
                if (i.id === id) {
                    if (i.quantity === 1) return i;
                    return { ...i, quantity: i.quantity - 1 };
                }
                return i;
            })
        );
    };

    const clearCart = () => {
        if (cart.length === 0) return;
        setCart([]);
        localStorage.removeItem('current_cart');
        toast.success('Order cleared');
    };

    const total = useMemo(
        () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [cart]
    );

    const totalItemCount = useMemo(
        () => cart.reduce((sum, item) => sum + item.quantity, 0),
        [cart]
    );

    // Map item ID to count in cart (for showing "✓ 2 in cart" badges on menu items)
    const cartCountsByItemId = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const item of cart) {
            const match = menu.find(
                (m) =>
                    m.portions.some((p) => (p.id || `${m.id}-${p.size}`) === item.id) ||
                    item.name.startsWith(m.name)
            );
            if (match) {
                counts[match.id] = (counts[match.id] || 0) + item.quantity;
            }
        }
        return counts;
    }, [cart, menu]);

    // Categories with item counts
    const categoriesWithCount = useMemo(() => {
        const counts: Record<string, number> = { All: menu.length };
        menu.forEach((item) => {
            counts[item.category] = (counts[item.category] || 0) + 1;
        });
        const list = ['All', ...Array.from(new Set(menu.map((m) => m.category)))];
        return list.map((cat) => ({
            name: cat,
            count: counts[cat] || 0,
        }));
    }, [menu]);

    const filteredMenu = useMemo(() => {
        return menu.filter((item) => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [menu, searchQuery, selectedCategory]);

    const handlePlaceOrder = async (paymentMethod: 'CASH' | 'CARD') => {
        setIsProcessing(true);
        const orderData = {
            items: cart,
            total,
            paymentMethod,
            orderType: 'TAKEAWAY' as const,
        };

        try {
            const data = await saveOrder(orderData);

            // Close payment modal first
            setIsPaymentOpen(false);

            // Clear cart and localStorage
            setCart([]);
            localStorage.setItem('last_order_status', 'success');
            localStorage.removeItem('current_cart');
            toast.success('Order completed successfully!');

            // Wait for payment modal to close before showing bill printer
            setTimeout(() => {
                setLastOrder(data);
            }, 300);
        } catch (error) {
            console.error('Error placing order:', error);
            toast.error('Failed to save order. Please retry.');
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <AppLayout className="!flex-row">
            <div className="flex flex-col flex-1 overflow-hidden h-[calc(100vh-105px)]">
                {/* ── POS SUB-HEADER BAR ────────────────────────────────────── */}
                <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 md:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 z-10">
                    {/* Left: POS Status & Real-time Clock */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 bg-emerald-50/70 border border-emerald-200/60 rounded-xl px-3 py-1.5 shadow-xs">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                            <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">
                                POS Active
                            </span>
                        </div>

                        {currentTime && (
                            <div className="flex items-center gap-2 bg-slate-50/70 border border-slate-200/60 rounded-xl px-3 py-1.5 text-slate-600">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-xs font-bold tabular-nums">{currentTime}</span>
                                <span className="text-[10px] text-slate-400 hidden sm:inline">
                                    • {currentDate}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Right: Quick actions (Reprint Last Bill) */}
                    <div className="flex items-center gap-2">
                        {lastOrder && (
                            <button
                                type="button"
                                onClick={() => setLastOrder(lastOrder)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all cursor-pointer active:scale-95"
                                title="Reprint Last Completed Receipt"
                            >
                                <Printer className="w-3.5 h-3.5" />
                                <span className="hidden md:inline">Reprint Receipt</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ── MAIN CONTENT (MENU + CART) ───────────────────────────── */}
                <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                    {/* Menu Left Section */}
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50/70">
                        <div className="max-w-7xl mx-auto space-y-4">
                            {/* Search bar & View Controls */}
                            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                                {/* Search Input */}
                                <div className="relative flex-1 group">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                    <input
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder="Search menu items by name... (Press '/' to focus)"
                                        className="w-full pl-11 pr-20 py-2.5 bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 transition-all shadow-xs text-sm font-medium text-slate-800 placeholder:text-slate-400"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        {searchQuery ? (
                                            <button
                                                onClick={() => setSearchQuery('')}
                                                className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600 cursor-pointer"
                                                title="Clear search"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
                                                /
                                            </kbd>
                                        )}
                                    </div>
                                </div>

                                {/* Layout View Controls */}
                                <div className="flex items-center gap-2 shrink-0">
                                    {/* View Mode Toggle (Grid vs List) */}
                                    <div className="flex bg-white p-1 rounded-2xl border border-slate-200/90 shadow-xs">
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('grid')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                viewMode === 'grid'
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                            title="Visual Grid Cards"
                                        >
                                            <LayoutGrid className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Cards</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setViewMode('list')}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                viewMode === 'list'
                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                    : 'text-slate-400 hover:text-slate-700'
                                            }`}
                                            title="Dense Compact List"
                                        >
                                            <LayoutList className="w-3.5 h-3.5" />
                                            <span className="hidden sm:inline">Compact</span>
                                        </button>
                                    </div>

                                </div>
                            </div>

                            {/* Categories - All displayed with wrapping (no horizontal sliding) */}
                            <div className="flex flex-wrap items-center gap-2 select-none">
                                {categoriesWithCount.map((cat) => {
                                    const isSelected = selectedCategory === cat.name;
                                    return (
                                        <button
                                            key={cat.name}
                                            type="button"
                                            onClick={() => setSelectedCategory(cat.name)}
                                            className={`group px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer flex items-center gap-2 ${
                                                isSelected
                                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/25 scale-[1.02]'
                                                    : 'bg-white text-slate-700 border border-slate-200/80 hover:border-indigo-300 hover:bg-indigo-50/30 active:scale-95'
                                            }`}
                                        >
                                            <span>{cat.name}</span>
                                            <span
                                                className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                                                    isSelected
                                                        ? 'bg-white/20 text-white'
                                                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-700'
                                                }`}
                                            >
                                                {cat.count}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Menu Grid / List */}
                            {filteredMenu.length === 0 && !isLoading ? (
                                <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl border border-dashed border-slate-200 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-3 shadow-inner">
                                        <UtensilsCrossed className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="text-base font-bold text-slate-800 mb-1">
                                        No menu items match your filter
                                    </h3>
                                    <p className="text-xs text-slate-400 max-w-sm mb-4">
                                        We couldn't find anything matching &ldquo;{searchQuery || selectedCategory}&rdquo;. Try adjusting your search query or category.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSelectedCategory('All');
                                        }}
                                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                                    >
                                        Reset All Filters
                                    </button>
                                </div>
                            ) : (
                                <div
                                    className={
                                        viewMode === 'grid'
                                            ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 pb-8'
                                            : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-8'
                                    }
                                >
                                    {isLoading
                                        ? [...Array(8)].map((_, i) => (
                                              <div
                                                  key={i}
                                                  className={`bg-white rounded-2xl border border-slate-100 p-4 animate-pulse ${
                                                      viewMode === 'grid' ? 'h-56' : 'h-20'
                                                  }`}
                                              >
                                                  <div className="bg-slate-200 rounded-xl w-full h-full" />
                                              </div>
                                          ))
                                        : filteredMenu.map((item) => (
                                              <MenuItemCard
                                                  key={item.id}
                                                  item={item}
                                                  onAdd={addToCart}
                                                  inCartCount={cartCountsByItemId[item.id] || 0}
                                                  viewMode={viewMode}
                                              />
                                          ))}
                                </div>
                            )}
                        </div>
                    </main>

                    {/* ── ORDER SIDEBAR (RIGHT CONSOLE) ─────────────────────── */}
                    <aside className="w-full lg:w-[400px] xl:w-[440px] 2xl:w-[480px] h-[48vh] lg:h-auto border-t lg:border-t-0 lg:border-l border-slate-200/80 flex flex-col overflow-hidden bg-white shadow-xl lg:shadow-none z-20">
                        {/* Sidebar Header */}
                        <div className="p-4 md:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/40">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-black text-slate-800 leading-tight">
                                        Current Order
                                    </h2>
                                    <span className="bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                                        {totalItemCount}
                                    </span>
                                </div>
                            </div>

                            {cart.length > 0 && (
                                <button
                                    type="button"
                                    onClick={clearCart}
                                    className="flex items-center gap-1 text-[11px] font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer"
                                    title="Clear all items in cart"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Clear</span>
                                </button>
                            )}
                        </div>

                        {/* Cart Items List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                                    <div className="w-20 h-20 rounded-3xl bg-indigo-50/50 flex items-center justify-center text-3xl mb-3 shadow-inner border border-indigo-100/50">
                                        🛒
                                    </div>
                                    <h4 className="font-bold text-slate-700 text-sm mb-1">
                                        Order is Empty
                                    </h4>
                                    <p className="text-xs text-slate-400 max-w-[200px]">
                                        Tap dishes from the menu on the left to start billing
                                    </p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div
                                        key={item.id}
                                        className="p-3 rounded-2xl border border-slate-200/80 bg-white hover:border-indigo-300 transition-all shadow-xs flex items-center gap-3 group"
                                    >
                                        {/* Details */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-xs truncate">
                                                {item.name}
                                            </h4>
                                            <p className="text-[11px] text-slate-400 font-semibold tabular-nums mt-0.5">
                                                {item.price.toFixed(2)} each
                                            </p>
                                        </div>

                                        {/* Stepper (+ / -) */}
                                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/70 rounded-xl p-0.5 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => decrementQuantity(item.id)}
                                                disabled={item.quantity === 1}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs shadow-xs cursor-pointer"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 text-center font-black text-xs text-slate-800 tabular-nums">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => incrementQuantity(item.id)}
                                                className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-slate-600 hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs shadow-xs cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>

                                        {/* Line Total */}
                                        <div className="text-right min-w-[65px] shrink-0">
                                            <span className="font-black text-xs text-indigo-600 tabular-nums">
                                                {(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Delete Action */}
                                        <button
                                            type="button"
                                            onClick={() => removeFromCart(item.id)}
                                            className="w-6 h-6 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0 cursor-pointer"
                                            title="Remove item"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Order Calculation & Checkout Box */}
                        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 space-y-3 shrink-0">
                            {/* Subtotal & Total Breakdown */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between text-xs text-slate-500 font-semibold">
                                    <span>Items Subtotal ({totalItemCount})</span>
                                    <span className="tabular-nums">LKR {total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-200/60">
                                    <span className="text-sm font-black text-slate-800 uppercase tracking-wider">
                                        Total Due
                                    </span>
                                    <div className="text-right">
                                        <span className="text-xs font-black text-indigo-400 mr-1">LKR</span>
                                        <span className="text-2xl font-black text-indigo-600 tabular-nums">
                                            {total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Main Checkout Button */}
                            <button
                                type="button"
                                disabled={cart.length === 0}
                                onClick={() => setIsPaymentOpen(true)}
                                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 group"
                            >
                                <Receipt className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span>Proceed to Checkout</span>
                                {total > 0 && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-lg text-xs font-bold ml-1">
                                        LKR {total.toFixed(2)}
                                    </span>
                                )}
                            </button>
                        </div>
                    </aside>
                </div>

                {/* ── MODALS & PRINT DIALOGS ───────────────────────────────── */}
                <PaymentModal
                    isOpen={isPaymentOpen}
                    onClose={() => setIsPaymentOpen(false)}
                    total={total}
                    onConfirm={handlePlaceOrder}
                    isLoading={isProcessing}
                />

                <BillPrinter order={lastOrder} endPoint="print" />
            </div>
        </AppLayout>
    );
}
