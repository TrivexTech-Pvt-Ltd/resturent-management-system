"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    Calendar,
    CreditCard,
    DollarSign,
    Filter,
    PieChart,
    TrendingUp,
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
    CalendarDays,
    ArrowUpRight,
    ArrowDownRight,
    Download,
    Eye,
    X,
    Package,
    Tag,
    Layers,
    Search,
    ShoppingBag,
    Trophy,
    SlidersHorizontal,
    FileSpreadsheet,
    ChefHat
} from "lucide-react";
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    isWithinInterval,
    subWeeks,
    subMonths,
    eachDayOfInterval,
    isSameDay
} from "date-fns";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from "recharts";

import { getOrders, getMenu } from "@/lib/db";
import { Order, MenuItem, OrderItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type ReportView = 'financials' | 'items';
type TimeRange = 'daily' | 'weekly' | 'monthly' | 'custom';
type PaymentFilter = 'ALL' | 'CASH' | 'CARD';
type SortOption = 'revenue_desc' | 'qty_desc' | 'name_asc';

// Portion color mappings
const PORTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'S': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'M': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    'L': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    'XL': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    'STANDARD': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

// Helper to parse backend dates as UTC and convert to local browser time
const parseOrderDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    let normalized = dateStr.trim();
    if (normalized.includes(' ') && !normalized.includes('T')) {
        normalized = normalized.replace(' ', 'T');
    }
    const hasTimezone = normalized.endsWith('Z') || 
                        normalized.includes('+') || 
                        (normalized.includes('T') && normalized.split('T')[1].includes('-'));
    return new Date(hasTimezone ? normalized : `${normalized}Z`);
};

// Robust Portion & Item Name Parser
const parseItemDetails = (item: { name: string; category?: string; price: number }, menuList: MenuItem[] = []) => {
    let name = item.name.trim();
    let baseName = name;
    let portionSize = "STANDARD";

    // 1. Check parenthesized size e.g., "Rice (S)", "Special Basmati (M)", "Kottu (XL)"
    const parenMatch = name.match(/^(.*?)\s*\((S|M|L|XL|Small|Medium|Large|Extra Large|[A-Za-z0-9\s]+)\)$/i);
    if (parenMatch) {
        baseName = parenMatch[1].trim();
        portionSize = parenMatch[2].trim().toUpperCase();
    } else {
        // 2. Check space separated trailing size e.g., "Rice S", "Rice M", "Rice L", "Rice XL"
        const spaceMatch = name.match(/^(.*?)\s+(S|M|L|XL|Small|Medium|Large|Extra Large)$/i);
        if (spaceMatch) {
            baseName = spaceMatch[1].trim();
            portionSize = spaceMatch[2].trim().toUpperCase();
        }
    }

    // Standardize portion size keys
    if (portionSize === "SMALL") portionSize = "S";
    if (portionSize === "MEDIUM") portionSize = "M";
    if (portionSize === "LARGE") portionSize = "L";
    if (portionSize === "EXTRA LARGE") portionSize = "XL";

    // Resolve category
    let category = item.category || "";
    if (!category && menuList.length > 0) {
        const found = menuList.find(m => 
            m.name.toLowerCase() === baseName.toLowerCase() || 
            m.name.toLowerCase() === name.toLowerCase()
        );
        if (found) category = found.category;
    }

    if (!category) category = "General";

    return { baseName, portionSize, category, fullName: name };
};

export default function SalesReportPage() {
    const [activeView, setActiveView] = useState<ReportView>('items');
    const [timeRange, setTimeRange] = useState<TimeRange>('daily');
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [selectedItemName, setSelectedItemName] = useState<string>('ALL');
    const [selectedPortion, setSelectedPortion] = useState<string>('ALL');
    const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
    const [sortBy, setSortBy] = useState<SortOption>('revenue_desc');
    
    const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemPage, setItemPage] = useState(1);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const ITEMS_PER_PAGE = 10;
    const ITEM_TABLE_PER_PAGE = 10;

    // Queries
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["orders-report"],
        queryFn: getOrders,
    });

    const { data: menuList = [] } = useQuery({
        queryKey: ["menu"],
        queryFn: getMenu,
    });

    // Date interval calculation
    const dateInterval = useMemo(() => {
        let now = new Date();
        let startLimit: Date;

        switch (timeRange) {
            case 'daily':
                startLimit = startOfDay(now);
                break;
            case 'weekly':
                startLimit = subWeeks(now, 1);
                break;
            case 'monthly':
                startLimit = subMonths(now, 1);
                break;
            case 'custom':
                startLimit = startOfDay(new Date(customStartDate));
                break;
            default:
                startLimit = startOfDay(now);
        }

        let endLimit = timeRange === 'custom' ? endOfDay(new Date(customEndDate)) : endOfDay(now);
        return { start: startLimit, end: endLimit };
    }, [timeRange, customStartDate, customEndDate]);

    // Filtered orders list
    const filteredOrders = useMemo(() => {
        const filtered = orders.filter(order => {
            const orderDate = parseOrderDate(order.createdAt);
            const matchesDate = isWithinInterval(orderDate, dateInterval);
            const matchesPayment = paymentFilter === 'ALL' || order.paymentMethod === paymentFilter;
            return matchesDate && matchesPayment;
        });

        return filtered.sort((a, b) => {
            if (timeRange === 'weekly' || timeRange === 'monthly' || timeRange === 'custom') {
                const dateA = parseOrderDate(a.createdAt).getTime();
                const dateB = parseOrderDate(b.createdAt).getTime();
                return dateA - dateB;
            }
            return Number(a.orderNumber) - Number(b.orderNumber);
        });
    }, [orders, dateInterval, paymentFilter, timeRange]);

    // Aggregate Item-wise Sales Data
    const itemSalesData = useMemo(() => {
        const aggregated: Record<string, {
            id: string;
            fullName: string;
            baseName: string;
            portionSize: string;
            category: string;
            totalQuantity: number;
            totalRevenue: number;
            unitPrice: number;
            orderCount: number;
        }> = {};

        filteredOrders.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;

            order.items.forEach(item => {
                const details = parseItemDetails(item, menuList);
                const key = `${details.baseName}___${details.portionSize}`;

                if (!aggregated[key]) {
                    aggregated[key] = {
                        id: key,
                        fullName: details.fullName,
                        baseName: details.baseName,
                        portionSize: details.portionSize,
                        category: details.category,
                        totalQuantity: 0,
                        totalRevenue: 0,
                        unitPrice: item.price || 0,
                        orderCount: 0
                    };
                }

                aggregated[key].totalQuantity += (item.quantity || 1);
                aggregated[key].totalRevenue += ((item.price || 0) * (item.quantity || 1));
                aggregated[key].orderCount += 1;
            });
        });

        let itemList = Object.values(aggregated);

        // Filter by Category
        if (selectedCategory !== 'ALL') {
            itemList = itemList.filter(i => i.category.toLowerCase() === selectedCategory.toLowerCase());
        }

        // Filter by Specific Item Name
        if (selectedItemName !== 'ALL') {
            itemList = itemList.filter(i => i.baseName.toLowerCase() === selectedItemName.toLowerCase());
        }

        // Filter by Portion Size
        if (selectedPortion !== 'ALL') {
            itemList = itemList.filter(i => i.portionSize.toUpperCase() === selectedPortion.toUpperCase());
        }

        // Search Filter
        if (itemSearchQuery.trim()) {
            const query = itemSearchQuery.toLowerCase();
            itemList = itemList.filter(i => 
                i.baseName.toLowerCase().includes(query) || 
                i.fullName.toLowerCase().includes(query) ||
                i.category.toLowerCase().includes(query) ||
                i.portionSize.toLowerCase().includes(query)
            );
        }

        // Sorting
        itemList.sort((a, b) => {
            if (sortBy === 'revenue_desc') return b.totalRevenue - a.totalRevenue;
            if (sortBy === 'qty_desc') return b.totalQuantity - a.totalQuantity;
            if (sortBy === 'name_asc') return a.baseName.localeCompare(b.baseName);
            return b.totalRevenue - a.totalRevenue;
        });

        return itemList;
    }, [filteredOrders, menuList, selectedCategory, selectedItemName, selectedPortion, itemSearchQuery, sortBy]);

    // Categories list for dropdown
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        menuList.forEach(m => { if (m.category) cats.add(m.category); });
        filteredOrders.forEach(o => {
            o.items?.forEach(i => {
                const parsed = parseItemDetails(i, menuList);
                if (parsed.category) cats.add(parsed.category);
            });
        });
        return Array.from(cats).sort();
    }, [menuList, filteredOrders]);

    // Distinct Item Base Names list for dropdown filter
    const availableItemNames = useMemo(() => {
        const names = new Set<string>();
        menuList.forEach(m => { if (m.name) names.add(m.name.trim()); });
        filteredOrders.forEach(o => {
            o.items?.forEach(i => {
                const parsed = parseItemDetails(i, menuList);
                if (parsed.baseName) names.add(parsed.baseName);
            });
        });
        return Array.from(names).sort();
    }, [menuList, filteredOrders]);

    // Portions list for dropdown
    const availablePortions = useMemo(() => {
        const portions = new Set<string>();
        filteredOrders.forEach(o => {
            o.items?.forEach(i => {
                const parsed = parseItemDetails(i, menuList);
                if (parsed.portionSize) portions.add(parsed.portionSize);
            });
        });
        return Array.from(portions).sort();
    }, [filteredOrders, menuList]);

    // Financial Statistics
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const cashSales = filteredOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
    const cardSales = filteredOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0);

    // Item Statistics
    const totalItemQty = itemSalesData.reduce((sum, i) => sum + i.totalQuantity, 0);
    const totalItemRevenue = itemSalesData.reduce((sum, i) => sum + i.totalRevenue, 0);
    const topCategoryName = useMemo(() => {
        const catMap: Record<string, number> = {};
        itemSalesData.forEach(i => {
            catMap[i.category] = (catMap[i.category] || 0) + i.totalRevenue;
        });
        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0] : 'N/A';
    }, [itemSalesData]);

    const mostPopularPortion = useMemo(() => {
        const portionMap: Record<string, number> = {};
        itemSalesData.forEach(i => {
            portionMap[i.portionSize] = (portionMap[i.portionSize] || 0) + i.totalQuantity;
        });
        const sorted = Object.entries(portionMap).sort((a, b) => b[1] - a[1]);
        return sorted.length > 0 ? sorted[0][0] : 'N/A';
    }, [itemSalesData]);

    // PDF Export Logic
    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header Banner
        doc.setFontSize(22);
        doc.setTextColor(99, 102, 241);
        doc.text("NEXTSERVE SALES & ITEM REPORT", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text(`Range: ${timeRange.toUpperCase()} (${format(dateInterval.start, 'MMM dd, yyyy')} - ${format(dateInterval.end, 'MMM dd, yyyy')})`, 14, 30);
        doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 36);

        // Financial Summary Section
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text("Financial Summary", 14, 48);

        doc.setFontSize(10);
        doc.text(`Total Revenue: ${totalSales.toFixed(2)}`, 14, 56);
        doc.text(`Total Transactions: ${totalOrders}`, 14, 63);
        doc.text(`Average Order Value: ${avgOrderValue.toFixed(2)}`, 14, 70);
        doc.text(`Payment Mix: Cash ${cashSales.toFixed(2)} / Card ${cardSales.toFixed(2)}`, 14, 77);

        // Item-wise Breakdown Section
        doc.setFontSize(14);
        doc.text("Item-Wise Sales Breakdown", 14, 90);

        autoTable(doc, {
            startY: 96,
            head: [['#', 'Item Name', 'Category', 'Portion', 'Qty Sold', 'Unit Price', 'Total Sales', 'Share %']],
            body: itemSalesData.map((item, idx) => [
                idx + 1,
                item.baseName,
                item.category,
                item.portionSize,
                item.totalQuantity,
                item.unitPrice.toFixed(2),
                item.totalRevenue.toFixed(2),
                `${((item.totalRevenue / Math.max(1, totalItemRevenue)) * 100).toFixed(1)}%`
            ]),
            headStyles: { fillColor: [99, 102, 241], fontSize: 9, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 96 },
        });

        // Transactions Log Table on new page if needed
        const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : 180;
        
        doc.setFontSize(14);
        doc.text("Transaction Logs", 14, finalY < 250 ? finalY : 20);
        if (finalY >= 250) doc.addPage();

        autoTable(doc, {
            startY: finalY < 250 ? finalY + 6 : 26,
            head: [['Order ID', 'Timestamp', 'Method', 'Amount', 'Status']],
            body: filteredOrders.map(o => [
                `#${o.orderNumber}`,
                format(parseOrderDate(o.createdAt), 'MMM dd, HH:mm'),
                o.paymentMethod,
                o.total.toFixed(2),
                o.status
            ]),
            headStyles: { fillColor: [30, 41, 59], fontSize: 9, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`Sales_Report_${timeRange}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    // Chart Data Preparation (Daily / Date chart)
    const chartData = useMemo(() => {
        const days = eachDayOfInterval(dateInterval);
        return days.map(day => {
            const dayOrders = orders.filter(o => isSameDay(parseOrderDate(o.createdAt), day));
            const sales = dayOrders.reduce((sum, o) => sum + (o.paymentMethod === paymentFilter || paymentFilter === 'ALL' ? o.total : 0), 0);
            return {
                date: format(day, 'MMM dd'),
                sales: sales
            };
        });
    }, [orders, dateInterval, paymentFilter]);

    // Portion Chart Data
    const portionChartData = useMemo(() => {
        const portionMap: Record<string, { qty: number; revenue: number }> = {};
        itemSalesData.forEach(item => {
            const p = item.portionSize;
            if (!portionMap[p]) portionMap[p] = { qty: 0, revenue: 0 };
            portionMap[p].qty += item.totalQuantity;
            portionMap[p].revenue += item.totalRevenue;
        });

        return Object.entries(portionMap).map(([portion, data]) => ({
            portion,
            qty: data.qty,
            revenue: data.revenue
        })).sort((a, b) => b.qty - a.qty);
    }, [itemSalesData]);

    // Top 5 Items Chart
    const topItemsChartData = useMemo(() => {
        return itemSalesData.slice(0, 5).map(item => ({
            name: `${item.baseName} (${item.portionSize})`,
            revenue: item.totalRevenue,
            qty: item.totalQuantity
        }));
    }, [itemSalesData]);

    // Pagination calculations
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const totalItemPages = Math.ceil(itemSalesData.length / ITEM_TABLE_PER_PAGE);
    const paginatedItems = itemSalesData.slice(
        (itemPage - 1) * ITEM_TABLE_PER_PAGE,
        itemPage * ITEM_TABLE_PER_PAGE
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemPageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalItemPages) {
            setItemPage(newPage);
        }
    };

    const openOrderDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
    };

    const closeOrderDetails = () => {
        setIsModalOpen(false);
        setSelectedOrder(null);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-primary transition-colors text-sm font-bold gap-1 mb-2">
                            <ArrowLeft className="h-4 w-4" />
                            DASHBOARD
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
                            <TrendingUp className="text-primary h-10 w-10 not-italic" />
                            SALES & ITEM REVENUE
                        </h1>
                        <p className="text-slate-500 font-medium">Detailed item-wise portion sales & financial performance analytics</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToPDF}
                            className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
                        >
                            <Download className="h-4 w-4 text-primary" />
                            Export Report PDF
                        </button>
                    </div>
                </div>

                {/* View Switcher & Time Range Bar */}
                <div className="glass-card p-6 rounded-[2.5rem] flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between border border-white">
                    
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                        <button
                            onClick={() => setActiveView('items')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                                activeView === 'items'
                                    ? "bg-primary text-white shadow-md shadow-primary/20"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <Package className="h-4 w-4" />
                            Item-Wise Sales
                        </button>
                        <button
                            onClick={() => setActiveView('financials')}
                            className={cn(
                                "px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                                activeView === 'financials'
                                    ? "bg-slate-900 text-white shadow-md shadow-slate-200"
                                    : "text-slate-500 hover:text-slate-800"
                            )}
                        >
                            <BarChart3 className="h-4 w-4" />
                            Revenue Overview
                        </button>
                    </div>

                    {/* Time Range Selector */}
                    <div className="flex flex-wrap items-center gap-2">
                        {(['daily', 'weekly', 'monthly', 'custom'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => {
                                    setTimeRange(range);
                                    setCurrentPage(1);
                                    setItemPage(1);
                                }}
                                className={cn(
                                    "px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest cursor-pointer",
                                    timeRange === range
                                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {range}
                            </button>
                        ))}

                        {timeRange === 'custom' && (
                            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => {
                                        setCustomStartDate(e.target.value);
                                        setItemPage(1);
                                    }}
                                    className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30"
                                />
                                <span className="text-slate-400"><ChevronRight className="h-4 w-4" /></span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => {
                                        setCustomEndDate(e.target.value);
                                        setItemPage(1);
                                    }}
                                    className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30"
                                />
                            </div>
                        )}

                        <div className="relative group min-w-[150px]">
                            <select
                                value={paymentFilter}
                                onChange={(e) => {
                                    setPaymentFilter(e.target.value as PaymentFilter);
                                    setCurrentPage(1);
                                    setItemPage(1);
                                }}
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-100 rounded-xl font-bold text-xs text-slate-700 appearance-none outline-none hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                <option value="ALL">All Payments</option>
                                <option value="CASH">Cash Only</option>
                                <option value="CARD">Card Only</option>
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <CreditCard className="h-3.5 w-3.5" />
                            </div>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Filter className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* -------------------- VIEW 1: ITEM-WISE SALES ANALYSIS -------------------- */}
                {activeView === 'items' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        
                        {/* Item KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'TOTAL UNITS SOLD', value: totalItemQty.toLocaleString(), sub: 'Items across orders', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'TOTAL ITEM REVENUE', value: `${totalItemRevenue.toFixed(2)}`, sub: 'Gross item sales', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'TOP CATEGORY', value: topCategoryName, sub: 'Highest sales volume', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: 'POPULAR PORTION', value: mostPopularPortion === 'STANDARD' ? 'Standard Size' : `Size (${mostPopularPortion})`, sub: 'Most requested size', icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                        <h3 className="text-2xl font-black text-slate-900 mt-1 truncate">{isLoadingOrders ? "---" : stat.value}</h3>
                                        <p className="text-xs text-slate-400 font-medium mt-1">{stat.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Item Filters Bar */}
                        <div className="glass-card p-6 rounded-[2.5rem] border border-white flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                            
                            {/* Search input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search by item name or portion size (e.g. Rice, S, M, XL)..."
                                    value={itemSearchQuery}
                                    onChange={(e) => {
                                        setItemSearchQuery(e.target.value);
                                        setItemPage(1);
                                    }}
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {itemSearchQuery && (
                                    <button
                                        onClick={() => setItemSearchQuery('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            {/* Dropdowns */}
                            <div className="flex flex-wrap items-center gap-3">
                                
                                {/* Category Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Category:</span>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setItemPage(1);
                                        }}
                                        className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <option value="ALL">All Categories</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Item Name Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Item:</span>
                                    <select
                                        value={selectedItemName}
                                        onChange={(e) => {
                                            setSelectedItemName(e.target.value);
                                            setItemPage(1);
                                        }}
                                        className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer max-w-[180px] truncate"
                                    >
                                        <option value="ALL">All Items</option>
                                        {availableItemNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Portion Size Filter */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">Portion:</span>
                                    <select
                                        value={selectedPortion}
                                        onChange={(e) => {
                                            setSelectedPortion(e.target.value);
                                            setItemPage(1);
                                        }}
                                        className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <option value="ALL">All Sizes</option>
                                        <option value="S">S (Small)</option>
                                        <option value="M">M (Medium)</option>
                                        <option value="L">L (Large)</option>
                                        <option value="XL">XL (Extra Large)</option>
                                        <option value="STANDARD">Standard</option>
                                    </select>
                                </div>

                                {/* Sort Option */}
                                <div className="flex items-center gap-2">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as SortOption)}
                                        className="px-4 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs outline-none cursor-pointer shadow-sm"
                                    >
                                        <option value="revenue_desc">Highest Revenue</option>
                                        <option value="qty_desc">Most Quantity Sold</option>
                                        <option value="name_asc">Item Name (A-Z)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Top Selling & Portion Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* Top 5 Best Sellers Chart */}
                            <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-white">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 italic flex items-center gap-2 uppercase">
                                            <Trophy className="h-5 w-5 text-amber-500" />
                                            TOP SELLING ITEMS REVENUE
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">Ranked by overall sales generated</p>
                                    </div>
                                </div>
                                <div className="h-[300px] w-full">
                                    {topItemsChartData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            No sales data available
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={topItemsChartData} layout="vertical" margin={{ left: 30, right: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }} />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#334155', fontSize: 11, fontWeight: 800 }} width={140} />
                                                <Tooltip
                                                    formatter={(val: any) => [`${Number(val).toFixed(2)}`, 'Revenue']}
                                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                                />
                                                <Bar dataKey="revenue" fill="#6366f1" radius={[0, 12, 12, 0]} barSize={24} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Portion Size Distribution */}
                            <div className="glass-card p-8 rounded-[2.5rem] border border-white flex flex-col justify-between">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 italic mb-2 uppercase flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-primary" />
                                        PORTION MIX
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium mb-6">Quantity breakdown by portion size (S, M, L, XL)</p>
                                </div>

                                <div className="space-y-4">
                                    {portionChartData.length === 0 ? (
                                        <p className="text-center text-slate-400 text-xs font-bold uppercase py-10">No portion data</p>
                                    ) : (
                                        portionChartData.map(p => {
                                            const totalQtyAll = Math.max(1, totalItemQty);
                                            const pct = ((p.qty / totalQtyAll) * 100).toFixed(1);
                                            const style = PORTION_COLORS[p.portion] || PORTION_COLORS['STANDARD'];

                                            return (
                                                <div key={p.portion} className="space-y-1.5">
                                                    <div className="flex justify-between items-center text-xs font-bold">
                                                        <span className={cn("px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase", style.bg, style.text, style.border)}>
                                                            Size: {p.portion}
                                                        </span>
                                                        <span className="text-slate-700 font-black">{p.qty} units ({pct}%)</span>
                                                    </div>
                                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-primary rounded-full transition-all duration-700"
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                        Total Items Evaluated: {itemSalesData.length}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Item Sales Data Table */}
                        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white shadow-sm">
                            <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                                        ITEM-WISE PORTION SALES TABLE
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium">Detailed sales breakdown by food item and portion size</p>
                                </div>
                                <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                    {itemSalesData.length} ITEMS FOUND
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#F8FAFC]/50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">No.</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Item Name</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Category</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Portion Size</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-center">Qty Sold</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Unit Price</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Total Revenue</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Revenue Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingOrders ? (
                                            <tr>
                                                <td colSpan={8} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                                    Calculating Item Performance...
                                                </td>
                                            </tr>
                                        ) : itemSalesData.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                                    No item sales recorded for the selected range and filters
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedItems.map((item, index) => {
                                                const portionStyle = PORTION_COLORS[item.portionSize] || PORTION_COLORS['STANDARD'];
                                                const sharePct = totalItemRevenue > 0 ? (item.totalRevenue / totalItemRevenue) * 100 : 0;

                                                return (
                                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-6 font-bold text-slate-400 text-sm">
                                                            {(itemPage - 1) * ITEM_TABLE_PER_PAGE + index + 1}
                                                        </td>
                                                        <td className="p-6">
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-base">{item.baseName}</span>
                                                                <span className="text-[11px] font-medium text-slate-400">{item.fullName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td className="p-6">
                                                            <span className={cn(
                                                                "px-3 py-1.5 rounded-xl text-xs font-black uppercase border tracking-wider",
                                                                portionStyle.bg,
                                                                portionStyle.text,
                                                                portionStyle.border
                                                            )}>
                                                                {item.portionSize === 'STANDARD' ? 'Standard' : item.portionSize}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            <span className="inline-flex items-center justify-center px-4 py-1 bg-slate-100 font-black text-slate-900 rounded-xl text-sm">
                                                                {item.totalQuantity}
                                                            </span>
                                                        </td>
                                                        <td className="p-6 text-right font-medium text-slate-600">
                                                            {item.unitPrice.toFixed(2)}
                                                        </td>
                                                        <td className="p-6 text-right font-black text-slate-900 text-base">
                                                            {item.totalRevenue.toFixed(2)}
                                                        </td>
                                                        <td className="p-6 text-right">
                                                            <div className="flex flex-col items-end gap-1">
                                                                <span className="font-bold text-xs text-primary">{sharePct.toFixed(1)}%</span>
                                                                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-primary rounded-full" style={{ width: `${sharePct}%` }} />
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Item Table Pagination */}
                            {!isLoadingOrders && itemSalesData.length > 0 && (
                                <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50">
                                    <p className="text-sm font-bold text-slate-500">
                                        Showing <span className="text-slate-900">{(itemPage - 1) * ITEM_TABLE_PER_PAGE + 1}</span> to <span className="text-slate-900">{Math.min(itemPage * ITEM_TABLE_PER_PAGE, itemSalesData.length)}</span> of <span className="text-slate-900">{itemSalesData.length}</span> item variations
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleItemPageChange(itemPage - 1)}
                                            disabled={itemPage === 1}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalItemPages }, (_, i) => i + 1)
                                                .filter(page => page === 1 || page === totalItemPages || Math.abs(page - itemPage) <= 1)
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="text-slate-400 font-bold px-1">...</span>
                                                        )}
                                                        <button
                                                            onClick={() => handleItemPageChange(page)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                                                                itemPage === page
                                                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                                                    : "text-slate-600 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {page}
                                                        </button>
                                                    </div>
                                                ))
                                            }
                                        </div>

                                        <button
                                            onClick={() => handleItemPageChange(itemPage + 1)}
                                            disabled={itemPage === totalItemPages}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                    </div>
                )}

                {/* -------------------- VIEW 2: FINANCIALS OVERVIEW -------------------- */}
                {activeView === 'financials' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'GROSS REVENUE', value: `${totalSales.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12.5%', isUp: true },
                                { label: 'TRANSACTIONS', value: totalOrders.toString(), icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+5.2%', isUp: true },
                                { label: 'AVG ORDER VAL', value: `${avgOrderValue.toFixed(2)}`, icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-1.4%', isUp: false },
                                { label: 'CASH vs CARD', value: `${((cashSales / Math.max(1, totalSales)) * 100).toFixed(0)}% / ${((cardSales / Math.max(1, totalSales)) * 100).toFixed(0)}%`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Neutral', isUp: null },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                                        </div>
                                        {stat.trend !== 'Neutral' && (
                                            <div className={cn(
                                                "flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg",
                                                stat.isUp ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                                            )}>
                                                {stat.isUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                {stat.trend}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                        <h3 className="text-3xl font-black text-slate-900 mt-1">{isLoadingOrders ? "---" : stat.value}</h3>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart & Payment Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                            <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-white">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-900 italic uppercase">REVENUE TREND</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-400">
                                            <span className="w-2.5 h-2.5 bg-primary rounded-full" />
                                            Sales
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis
                                                dataKey="date"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94A3B8', fontSize: 12, fontWeight: 700 }}
                                            />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontWeight: 'bold' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="sales"
                                                stroke="#6366f1"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorSales)"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="glass-card p-8 rounded-[2.5rem] border border-white">
                                <h2 className="text-xl font-black text-slate-900 italic mb-8 uppercase">PAYMENT DISTRIBUTION</h2>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="text-slate-500 uppercase">Cash Transactions</span>
                                            <span className="text-slate-900">{cashSales.toFixed(2)}</span>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(cashSales / Math.max(1, totalSales) * 100)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between font-bold text-sm">
                                            <span className="text-slate-500 uppercase">Card Transactions</span>
                                            <span className="text-slate-900">{cardSales.toFixed(2)}</span>
                                        </div>
                                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                style={{ width: `${(cardSales / Math.max(1, totalSales) * 100)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Transactions Table */}
                        <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h2 className="text-xl font-black text-slate-900 italic uppercase">TRANSACTION LOG</h2>
                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                    {filteredOrders.length} ENTRIES FOUND
                                </span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#F8FAFC]/50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">No.</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Order ID</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Timestamp</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Method</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Amount</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Status</th>
                                            <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Order Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingOrders ? (
                                            <tr>
                                                <td colSpan={7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                                    Synchronizing Ledger...
                                                </td>
                                            </tr>
                                        ) : filteredOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                                    Zero records for selected parameters
                                                </td>
                                            </tr>
                                        ) : (
                                            paginatedOrders.map((order, index) => (
                                                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-6">
                                                        <span className="font-bold text-slate-500">{(currentPage - 1) * ITEMS_PER_PAGE + index + 1}</span>
                                                    </td>
                                                    <td className="p-6">
                                                        <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                                                    </td>
                                                    <td className="p-6 text-slate-500 font-medium">
                                                        {format(parseOrderDate(order.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            order.paymentMethod === 'CARD' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                                        )}>
                                                            {order.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 font-black text-slate-900">
                                                        {order.total.toFixed(2)}
                                                    </td>
                                                    <td className="p-6">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            order.status === 'COMPLETED' || order.status === 'PAID'
                                                                ? "bg-emerald-50 text-emerald-600"
                                                                : order.status === 'PENDING'
                                                                    ? "bg-amber-50 text-amber-600"
                                                                    : order.status === 'CANCELLED'
                                                                        ? "bg-rose-50 text-rose-600"
                                                                        : "bg-slate-100 text-slate-500"
                                                        )}>
                                                            {order.status}
                                                        </span>
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <button
                                                            onClick={() => openOrderDetails(order)}
                                                            className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-primary cursor-pointer"
                                                        >
                                                            <Eye className="h-5 w-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Transactions Pagination */}
                            {!isLoadingOrders && filteredOrders.length > 0 && (
                                <div className="p-6 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/50">
                                    <p className="text-sm font-bold text-slate-500">
                                        Showing <span className="text-slate-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of <span className="text-slate-900">{filteredOrders.length}</span> transactions
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>

                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                                                .map((page, index, array) => (
                                                    <div key={page} className="flex items-center gap-1">
                                                        {index > 0 && array[index - 1] !== page - 1 && (
                                                            <span className="text-slate-400 font-bold px-1">...</span>
                                                        )}
                                                        <button
                                                            onClick={() => handlePageChange(page)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-xl font-bold text-sm transition-all",
                                                                currentPage === page
                                                                    ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                                                    : "text-slate-600 hover:bg-slate-50"
                                                            )}
                                                        >
                                                            {page}
                                                        </button>
                                                    </div>
                                                ))
                                            }
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 overflow-hidden shadow-2xl border border-white animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tight uppercase text-slate-900">Order Details</h2>
                                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Ref: #{selectedOrder.orderNumber}</p>
                            </div>
                            <button
                                onClick={closeOrderDetails}
                                className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-slate-50 rounded-3xl p-6 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ordered Items</p>
                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-50 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-400">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800">{item.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit: {item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-slate-900">{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                    <p className="font-bold text-slate-700">{format(parseOrderDate(selectedOrder.createdAt), 'HH:mm • MMM dd')}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                                    <p className="font-bold text-slate-700">{selectedOrder.paymentMethod}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                                <span className="text-3xl font-black text-white italic tracking-tighter tabular-nums">{selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
