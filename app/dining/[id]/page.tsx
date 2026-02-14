"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
    ArrowLeft,
    Search,
    UtensilsCrossed,
    Trash2,
    X,
    LayoutGrid,
    LayoutList,
    Loader2,
    Save,
    CreditCard,
    Banknote,
} from "lucide-react";

import { api } from "@/lib/api";
import { MenuItem, Portion } from "@/lib/types";
import MenuItemCard from "@/components/MenuItemCard";
import { cn } from "@/lib/utils";
import BillPrinter from "@/components/BillPrinter";
import { LastOrder } from "@/lib/types";

interface DiningTable {
    id: string;
    tableNo: number;
    status?: string;
}

interface OrderItem {
    id?: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    image: string;
}

interface DiningOrder {
    id: string;
    orderType: string;
    tableNo: number;
    status: string;
    items: OrderItem[];
}

export default function DiningDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const tableId = params.id as string;

    const [isMounted, setIsMounted] = useState(false);

    // State to hold the FULL order object
    // Initialize with a default structure to avoid null checks everywhere
    const [currentOrder, setCurrentOrder] = useState<DiningOrder>({
        id: tableId,
        orderType: "DINEIN",
        tableNo: 0,
        status: "PENDING",
        items: []
    });

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [cols, setCols] = useState(2);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Fetch all tables to get the table number
    const { data: tables = [] } = useQuery({
        queryKey: ["dining-tables"],
        queryFn: async () => {
            const response = await api.get("/dinein/table-list");
            return response.data || [];
        },
    });

    // Find the current table from the list
    const table = tables.find((t: DiningTable) => t.id === tableId);

    // Fetch menu items
    const { data: menu = [], isLoading: isLoadingMenu } = useQuery<MenuItem[]>({
        queryKey: ["menu"],
        queryFn: async () => {
            const response = await api.get("/Menu");
            return (response.data || []) as MenuItem[];
        },
    });

    // Fetch existing order for this table (if any)
    // Fetch existing order for this table (if any)
    const { data: existingOrder, isLoading: isLoadingOrder } = useQuery({
        queryKey: ["dining-order", tableId],
        queryFn: async () => {
            try {
                const response = await api.get(`/dinein/dinein-order/${tableId}`);
                return response.data as DiningOrder;
            } catch (error) {
                console.error("Failed to fetch order", error);
                return null;
            }
        },
        staleTime: 0,
        refetchOnWindowFocus: true, // Prevent overwriting local state on focus
    });

    const [isInitialized, setIsInitialized] = useState(false);

    // Reset state when tableId changes
    useEffect(() => {
        setIsInitialized(false);
        setCurrentOrder({
            id: tableId,
            orderType: "DINEIN",
            tableNo: 0,
            status: "PENDING",
            items: []
        });
    }, [tableId]);

    // Sync existing order to local state when loaded
    useEffect(() => {
        if (isLoadingOrder) return;

        if (existingOrder) {
            setCurrentOrder(existingOrder);
            setIsInitialized(true);
        } else if (table && !isInitialized) {
            // Only initialize as new if we start with no existing order AND we have table info
            // And strictly only if we are sure existingOrder is null (fetch finished)
            setCurrentOrder(prev => ({
                ...prev,
                tableNo: table.tableNo
            }));
            setIsInitialized(true);
        }
    }, [existingOrder, table, isLoadingOrder, isInitialized]);

    useEffect(() => {
        console.log("Current Cart Items:", currentOrder.items);
    }, [currentOrder.items]);

    // Save order mutation
    const saveOrderMutation = useMutation({
        mutationFn: async (orderData: DiningOrder) => {
            console.log("Saving Order Payload:", orderData);
            return await api.post("/dinein/update-order-details", orderData);
        },
        onSuccess: (data) => {
            // Update local state with the returned (saved) order, 
            // which will have new IDs for any newly added items
            if (data.data) {
                setCurrentOrder(data.data);
            }

            // Reset success state after 2 seconds
            setTimeout(() => {
                saveOrderMutation.reset();
            }, 2000);
        },
    });

    // Close order mutation
    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"CASH" | "CARD">("CASH");
    const [cashAmount, setCashAmount] = useState<string>("");
    const [orderToPrint, setOrderToPrint] = useState<LastOrder | null>(null);

    const closeOrderMutation = useMutation({
        mutationFn: async (payload: { Id: string; Total: number; PaymentMethod: string }) => {
            return await api.post("/dinein/close-dinein-order", payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dining-tables"] });

            // Prepare order for printing
            const printOrder: LastOrder = {
                orderNo: currentOrder.tableNo.toString(),
                total: total,
                items: currentOrder.items.map(item => ({
                    name: item.name,
                    qty: item.quantity,
                    price: item.price
                }))
            };

            setOrderToPrint(printOrder);
            setIsSettleModalOpen(false);
        },
    });

    const handlePrintComplete = () => {
        setOrderToPrint(null);
        router.push("/dining");
    };

    const confirmSettle = () => {
        if (!currentOrder.id) return;

        const payload = {
            Id: currentOrder.id,
            Total: total,
            PaymentMethod: paymentMethod
        };
        closeOrderMutation.mutate(payload);
    };

    const addToCart = (product: MenuItem, portion: Portion) => {
        const itemName = `${product.name} ${portion.size}`;

        setCurrentOrder((prev) => {
            const existingItemIndex = prev.items.findIndex((i) => i.name === itemName);

            let newItems = [...prev.items];

            if (existingItemIndex > -1) {
                // Update existing item
                const existingItem = newItems[existingItemIndex];
                newItems[existingItemIndex] = {
                    ...existingItem,
                    quantity: existingItem.quantity + 1
                };
            } else {
                // Add new item
                newItems.push({
                    // No ID for new items
                    name: itemName,
                    price: portion.price,
                    quantity: 1,
                    category: product.category,
                    image: product.image || "default.png",
                });
            }

            return {
                ...prev,
                items: newItems
            };
        });
    };

    const removeFromCart = (name: string) => {
        setCurrentOrder((prev) => ({
            ...prev,
            items: prev.items.filter((i) => i.name !== name)
        }));
    };

    const incrementQuantity = (name: string) => {
        setCurrentOrder((prev) => ({
            ...prev,
            items: prev.items.map((i) =>
                i.name === name ? { ...i, quantity: i.quantity + 1 } : i
            )
        }));
    };

    const decrementQuantity = (name: string) => {
        setCurrentOrder((prev) => {
            const newItems = prev.items.map((i) => {
                if (i.name === name) {
                    if (i.quantity === 1) return i;
                    return { ...i, quantity: i.quantity - 1 };
                }
                return i;
            });

            return { ...prev, items: newItems };
        });
    };

    const handleSaveOrder = () => {
        if (currentOrder.items.length === 0) return;

        // Remove id from items before sending to ensure backend handles them as new/updates correctly
        // complying with User request to not send item IDs
        const itemsWithoutId = currentOrder.items.map(item => {
            const { id, ...rest } = item;
            return rest;
        });

        const payload = {
            ...currentOrder,
            items: itemsWithoutId
        };

        saveOrderMutation.mutate(payload as DiningOrder);
    };

    const total = currentOrder.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const categories: string[] = ["All", ...Array.from(new Set(menu.map((item: MenuItem) => item.category)))];

    const filteredMenu = menu.filter((item: MenuItem) => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (!isInitialized) {
        return (
            <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 gap-4">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Loading Order Details...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="px-4 md:px-8 py-3 md:py-4 glass-card border-b flex justify-between items-center z-10">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dining"
                        className="bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors text-slate-600"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-primary">
                            Table {table?.tableNo || currentOrder.tableNo || "..."}
                        </h1>
                        <p className="text-xs text-slate-500">Dine-in Order</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <span className="text-xs md:text-sm font-medium bg-slate-100 px-3 py-1 rounded-full">
                        {isMounted ? new Date().toLocaleDateString() : ""}
                    </span>
                </div>
            </header>

            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
                {/* Menu Section */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50">
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
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
                                    <button
                                        onClick={() => setCols(1)}
                                        className={cn(
                                            "p-2.5 rounded-xl transition-all cursor-pointer",
                                            cols === 1
                                                ? "bg-primary text-white shadow-md"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                        title="1 Column View"
                                    >
                                        <LayoutList className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => setCols(2)}
                                        className={cn(
                                            "p-2.5 rounded-xl transition-all cursor-pointer",
                                            cols === 2
                                                ? "bg-primary text-white shadow-md"
                                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                                        )}
                                        title="2 Column View"
                                    >
                                        <LayoutGrid className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="flex flex-wrap gap-2 pb-2">
                                {categories.map((category: string) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={cn(
                                            "px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all cursor-pointer",
                                            selectedCategory === category
                                                ? "bg-primary text-white shadow-lg shadow-primary/25 scale-105"
                                                : "bg-white text-slate-600 border border-slate-200 hover:border-primary/40 active:scale-95"
                                        )}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {filteredMenu.length === 0 && !isLoadingMenu ? (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                                <div className="bg-slate-100 p-6 rounded-full mb-4">
                                    <UtensilsCrossed className="w-12 h-12 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">No items found</h3>
                                <p>Try adjusting your search or category filter</p>
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("All");
                                    }}
                                    className="mt-4 text-primary font-semibold hover:underline cursor-pointer"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        ) : (
                            <div
                                className={cn(
                                    "grid grid-cols-1 gap-3",
                                    cols === 2 ? "xl:grid-cols-2" : "xl:grid-cols-1"
                                )}
                            >
                                {isLoadingMenu
                                    ? [...Array(8)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="glass-card p-4 rounded-2xl h-16 animate-pulse bg-slate-200"
                                        />
                                    ))
                                    : filteredMenu.map((item: MenuItem) => (
                                        <MenuItemCard key={item.id} item={item} onAdd={addToCart} />
                                    ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Order Sidebar */}
                <aside className="w-full lg:w-[420px] xl:w-[480px] h-[45vh] lg:h-auto glass-card border-t lg:border-t-0 lg:border-l flex flex-col p-4 md:p-6 overflow-hidden bg-white shadow-2xl lg:shadow-none z-20">
                    <div className="flex items-center justify-between mb-4 md:mb-6">
                        <h2 className="text-lg md:text-xl font-bold flex items-center gap-2 text-slate-800">
                            Current Order
                            <span className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                                {currentOrder.items.length}
                            </span>
                        </h2>
                        {currentOrder.items.length > 0 && (
                            <button
                                onClick={() => setCurrentOrder(prev => ({ ...prev, items: [] }))}
                                className="flex items-center gap-1.5 text-xs font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider cursor-pointer"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear All
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 mb-4 md:mb-6 pr-1">
                        {currentOrder.items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <span className="text-4xl md:text-6xl mb-2 md:mb-4">🛒</span>
                                <p className="text-sm md:text-base">Empty cart</p>
                            </div>
                        ) : (
                            currentOrder.items.map((item, index) => (
                                <div
                                    key={`${item.name}-${index}`}
                                    className="glass-card p-3 md:p-4 rounded-2xl border border-slate-100 group hover:border-primary/20 transition-all relative"
                                >
                                    <button
                                        onClick={() => removeFromCart(item.name)}
                                        className="ml-auto w-6 h-6 flex items-center justify-center text-red-500 bg-red-50 hover:scale-110 rounded-lg transition-all absolute top-2 right-2 md:static cursor-pointer"
                                        title="Remove item"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>

                                    <div className="flex items-center justify-between gap-2 md:gap-4 mt-1 md:mt-0">
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 mb-1 truncate text-sm md:text-base">
                                                {item.name}
                                            </h4>
                                            <p className="text-xs text-slate-400 font-medium">
                                                {item.price.toFixed(2)} each
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 bg-slate-50 rounded-lg px-1 py-0.5">
                                            <button
                                                onClick={() => decrementQuantity(item.name)}
                                                disabled={item.quantity === 1}
                                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded text-slate-600 hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed font-bold text-xs md:text-sm shadow-sm cursor-pointer"
                                            >
                                                −
                                            </button>
                                            <span className="w-6 md:w-8 text-center font-bold text-xs md:text-sm text-slate-900">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => incrementQuantity(item.name)}
                                                className="w-5 h-5 md:w-6 md:h-6 flex items-center justify-center bg-white rounded text-slate-600 hover:bg-primary hover:text-white transition-all font-bold text-xs md:text-sm shadow-sm cursor-pointer"
                                            >
                                                +
                                            </button>
                                        </div>

                                        <p className="font-black text-sm md:text-lg text-primary min-w-[60px] md:min-w-[80px] text-right">
                                            {(item.price * item.quantity).toFixed(2)}
                                        </p>
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

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                disabled={currentOrder.items.length === 0 || saveOrderMutation.isPending}
                                onClick={handleSaveOrder}
                                className="w-full bg-primary text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-primary-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 cursor-pointer flex items-center justify-center gap-2"
                            >
                                {saveOrderMutation.isPending ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : saveOrderMutation.isSuccess ? (
                                    <>
                                        <Save className="h-5 w-5" />
                                        Saved ✓
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5" />
                                        {existingOrder ? "Update" : "Save"}
                                    </>
                                )}
                            </button>

                            <button
                                disabled={currentOrder.items.length === 0}
                                onClick={() => {
                                    setCashAmount("");
                                    setIsSettleModalOpen(true);
                                }}
                                className="w-full bg-emerald-500 text-white py-3 md:py-4 rounded-xl font-bold text-base md:text-lg hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <CreditCard className="h-5 w-5" />
                                Settle
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Settle Bill Modal */}
            {isSettleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-900">Settle Bill</h3>
                                <button onClick={() => setIsSettleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="text-center mb-8">
                                <p className="text-slate-500 text-sm mb-1">Total Amount</p>
                                <p className="text-4xl font-black text-primary">{total.toFixed(2)}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => {
                                        setCashAmount("");
                                        setPaymentMethod("CASH");
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                        paymentMethod === "CASH"
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    <Banknote className="w-8 h-8" />
                                    <span className="font-bold">Cash</span>
                                </button>
                                <button
                                    onClick={() => {
                                        setCashAmount("");
                                        setPaymentMethod("CARD");
                                    }}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                        paymentMethod === "CARD"
                                            ? "border-primary bg-primary/5 text-primary"
                                            : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                                    )}
                                >
                                    <CreditCard className="w-8 h-8" />
                                    <span className="font-bold">Card</span>
                                </button>
                            </div>

                            {/* Cash Amount Input - Only show when CASH is selected */}
                            {paymentMethod === "CASH" && (
                                <div className="mb-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Cash Received
                                        </label>
                                        <input
                                            type="number"
                                            value={cashAmount}
                                            onChange={(e) => setCashAmount(e.target.value)}
                                            placeholder="Enter amount"
                                            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-lg font-semibold"
                                            step="0.01"
                                            min="0"
                                        />
                                    </div>

                                    {/* Balance Display */}
                                    {cashAmount && parseFloat(cashAmount) >= total && (
                                        <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                                            <p className="text-sm text-emerald-700 font-medium mb-1">Balance to Return</p>
                                            <p className="text-3xl font-black text-emerald-600">
                                                {(parseFloat(cashAmount) - total).toFixed(2)}
                                            </p>
                                        </div>
                                    )}

                                    {/* Warning if cash amount is less than total */}
                                    {cashAmount && parseFloat(cashAmount) < total && (
                                        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                                            <p className="text-sm text-amber-700 font-medium mb-1">Insufficient Amount</p>
                                            <p className="text-lg font-bold text-amber-600">
                                                Short by: {(total - parseFloat(cashAmount)).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={confirmSettle}
                                disabled={closeOrderMutation.isPending}
                                className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer"
                            >
                                {closeOrderMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        Complete Payment
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BillPrinter order={orderToPrint} endPoint="print-dienein" onComplete={handlePrintComplete} />
        </div>
    );
}