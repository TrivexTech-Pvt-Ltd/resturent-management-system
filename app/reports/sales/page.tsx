"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart3,
    Calendar,
    CreditCard,
    DollarSign,
    Filter,
    PieChart,
    TrendingUp,
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

import { getOrders, getMenu, getOrdersPaged, getItemSalesPaged } from "@/lib/db";
import { Order, MenuItem, OrderItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import Pagination from "@/components/ui/Pagination";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useDebounce } from "@/hooks/useDebounce";

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
const parseItemDetails = (item: { name?: string; category?: string; price?: number }, menuList: MenuItem[] = []) => {
    let name = (item?.name || "").trim();
    if (!name) return { baseName: "Unknown", portionSize: "STANDARD", category: "General", fullName: "Unknown" };
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
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);
    
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [itemTablePerPage, setItemTablePerPage] = useState(10);

    // Debounce search query to avoid firing API requests on every keystroke
    const debouncedSearchQuery = useDebounce(itemSearchQuery, 350);

    // Date range boundaries for server-side queries
    const pagedStartDate = timeRange === 'custom'
        ? (customStartDate ? `${customStartDate}T00:00:00` : format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss"))
        : timeRange === 'daily'
            ? format(startOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss")
            : timeRange === 'weekly'
                ? format(subWeeks(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss")
                : format(subMonths(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss");
    const pagedEndDate = timeRange === 'custom'
        ? `${customEndDate}T23:59:59`
        : format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss");

    // Scoped orders query (only fetches orders for the active date range & payment method)
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["orders-report", pagedStartDate, pagedEndDate, paymentFilter],
        queryFn: () => getOrders({
            startDate: pagedStartDate,
            endDate: pagedEndDate,
            paymentMethod: paymentFilter === 'ALL' ? undefined : paymentFilter,
        }),
    });

    const { data: menuList = [] } = useQuery({
        queryKey: ["menu"],
        queryFn: getMenu,
    });

    const { data: pagedOrdersResult, isLoading: isLoadingPagedOrders } = useQuery({
        queryKey: ["orders-paged", currentPage, itemsPerPage, pagedStartDate, pagedEndDate, paymentFilter],
        queryFn: () => getOrdersPaged({
            page: currentPage,
            pageSize: itemsPerPage,
            startDate: pagedStartDate,
            endDate: pagedEndDate,
            paymentMethod: paymentFilter === 'ALL' ? undefined : paymentFilter,
        }),
        placeholderData: (prev) => prev,
    });

    const pagedOrders = pagedOrdersResult?.data ?? [];
    const serverTotalCount = pagedOrdersResult?.totalCount ?? 0;
    const serverTotalPages = pagedOrdersResult?.totalPages ?? 1;

    // Server-side paged item sales query (used for Item-wise table in items view)
    const { data: pagedItemResult, isLoading: isLoadingPagedItems } = useQuery({
        queryKey: [
            "item-sales-paged",
            itemPage,
            itemTablePerPage,
            pagedStartDate,
            pagedEndDate,
            paymentFilter,
            selectedCategory,
            selectedItemName,
            selectedPortion,
            debouncedSearchQuery,
            sortBy,
        ],
        queryFn: () => getItemSalesPaged({
            page: itemPage,
            pageSize: itemTablePerPage,
            startDate: pagedStartDate,
            endDate: pagedEndDate,
            paymentMethod: paymentFilter,
            category: selectedCategory,
            itemName: selectedItemName,
            portionSize: selectedPortion,
            search: debouncedSearchQuery,
            sortBy: sortBy,
        }),
        placeholderData: (prev) => prev,
    });

    const pagedItems = pagedItemResult?.data ?? [];
    const serverItemTotalCount = pagedItemResult?.totalCount ?? 0;
    const serverItemTotalPages = pagedItemResult?.totalPages ?? 1;
    const serverItemTotalRevenue = pagedItemResult?.totalRevenue ?? 0;


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
        if (!Array.isArray(orders)) return [];
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

    // Consolidated dropdown options list for category, item name, and portion in a single pass
    const { availableCategories, availableItemNames, availablePortions } = useMemo(() => {
        const cats = new Set<string>();
        const names = new Set<string>();
        const portions = new Set<string>();

        menuList.forEach(m => {
            if (m.category) cats.add(m.category);
            if (m.name) names.add(m.name.trim());
        });

        filteredOrders.forEach(o => {
            o.items?.forEach(i => {
                const parsed = parseItemDetails(i, menuList);
                if (parsed.category) cats.add(parsed.category);
                if (parsed.baseName) names.add(parsed.baseName);
                if (parsed.portionSize) portions.add(parsed.portionSize);
            });
        });

        return {
            availableCategories: Array.from(cats).sort(),
            availableItemNames: Array.from(names).sort(),
            availablePortions: Array.from(portions).sort(),
        };
    }, [menuList, filteredOrders]);

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
            const dayOrders = filteredOrders.filter(o => isSameDay(parseOrderDate(o.createdAt), day));
            const sales = dayOrders.reduce((sum, o) => sum + o.total, 0);
            return {
                date: format(day, 'MMM dd'),
                sales: sales
            };
        });
    }, [filteredOrders, dateInterval]);

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

    // Top 5 Items Chart (Ranked by overall sales generated)
    const topItemsChartData = useMemo(() => {
        const source = (itemSalesData && itemSalesData.length > 0) ? itemSalesData : (pagedItems || []);
        return [...source]
            .sort((a, b) => (Number(b.totalRevenue) || 0) - (Number(a.totalRevenue) || 0))
            .slice(0, 5)
            .map(item => ({
                name: item.portionSize && item.portionSize !== 'STANDARD'
                    ? `${item.baseName} (${item.portionSize})`
                    : item.baseName,
                revenue: Number(item.totalRevenue) || 0,
                qty: Number(item.totalQuantity) || 0
            }));
    }, [itemSalesData, pagedItems]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= serverTotalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleItemPageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= serverItemTotalPages) {
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


    // Full-page skeleton loader
    if (isLoadingOrders) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10">
                <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 animate-pulse w-full">

                    {/* Header skeleton */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 w-full">
                        <div className="space-y-3">
                            <div className="h-4 w-28 bg-slate-200 rounded-full" />
                            <div className="h-10 w-full sm:w-80 bg-slate-200 rounded-2xl" />
                            <div className="h-3 w-56 bg-slate-100 rounded-full" />
                        </div>
                        <div className="h-12 w-full sm:w-44 bg-slate-200 rounded-2xl" />
                    </div>

                    {/* Controls bar skeleton */}
                    <div className="glass-card p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col xl:flex-row gap-6 items-stretch xl:items-center justify-between border border-white w-full">
                        <div className="h-10 w-full xl:w-64 bg-slate-200 rounded-2xl" />
                        <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="h-10 flex-1 sm:w-20 bg-slate-200 rounded-xl" />
                            ))}
                        </div>
                    </div>

                    {/* KPI cards skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="glass-card p-6 rounded-4xl border border-white shadow-sm space-y-4 w-full">
                                <div className="flex justify-between items-start">
                                    <div className="h-14 w-14 bg-slate-200 rounded-2xl" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-3 w-24 bg-slate-200 rounded-full" />
                                    <div className="h-8 w-32 bg-slate-300 rounded-xl" />
                                    <div className="h-3 w-20 bg-slate-100 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Chart area skeleton */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
                        <div className="lg:col-span-2 glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white w-full">
                            <div className="h-6 w-56 bg-slate-200 rounded-xl mb-6" />
                            <div className="h-[300px] bg-slate-100 rounded-2xl w-full" />
                        </div>
                        <div className="glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white space-y-4 w-full">
                            <div className="h-6 w-36 bg-slate-200 rounded-xl mb-2" />
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <div className="h-4 w-20 bg-slate-200 rounded-lg" />
                                        <div className="h-4 w-24 bg-slate-200 rounded-lg" />
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Table skeleton */}
                    <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white shadow-sm w-full">
                        <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="h-6 w-56 bg-slate-200 rounded-xl" />
                            <div className="h-6 w-28 bg-slate-100 rounded-full" />
                        </div>
                        <div className="p-6 space-y-3">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="flex gap-4 items-center py-2">
                                    <div className="h-5 w-6 bg-slate-100 rounded" />
                                    <div className="h-5 flex-1 bg-slate-100 rounded-lg" />
                                    <div className="h-5 w-24 bg-slate-100 rounded-lg" />
                                    <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                                    <div className="h-5 w-16 bg-slate-100 rounded-lg" />
                                    <div className="h-5 w-20 bg-slate-100 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        );
    }
    return (
        <AppLayout>
        <div className="bg-transparent p-4 sm:p-6 md:p-10 w-full">
            <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 w-full">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 w-full">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
                            <TrendingUp className="text-primary h-8 w-8 sm:h-10 sm:w-10 not-italic shrink-0" />
                            SALES & ITEM REVENUE
                        </h1>
                        <p className="text-slate-500 font-medium text-xs sm:text-sm">Detailed item-wise portion sales & financial performance analytics</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={exportToPDF}
                            className="w-full md:w-auto justify-center bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm cursor-pointer active:scale-95"
                        >
                            <Download className="h-4 w-4 text-primary" />
                            Export Report PDF
                        </button>
                    </div>
                </div>

                {/* View Switcher & Time Range Bar */}
                <div className="glass-card p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border border-white w-full">
                    
                    {/* View Switcher */}
                    <div className="flex flex-row items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50 w-full md:w-auto gap-0">
                        <button
                            onClick={() => setActiveView('items')}
                            className={cn(
                                "flex-1 md:flex-none justify-center px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
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
                                "flex-1 md:flex-none justify-center px-4 sm:px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
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
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
                            {(['daily', 'weekly', 'monthly', 'custom'] as TimeRange[]).map((range) => (
                                <button
                                    key={range}
                                    onClick={() => {
                                        setTimeRange(range);
                                        setCurrentPage(1);
                                        setItemPage(1);
                                    }}
                                    className={cn(
                                        "px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs transition-all uppercase tracking-widest cursor-pointer text-center w-full sm:w-auto",
                                        timeRange === range
                                            ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                            : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                    )}
                                >
                                    {range}
                                </button>
                            ))}
                        </div>

                        {timeRange === 'custom' && (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => {
                                        setCustomStartDate(e.target.value);
                                        setCurrentPage(1);
                                        setItemPage(1);
                                    }}
                                    className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30 w-full sm:w-auto"
                                />
                                <span className="text-slate-400 hidden sm:inline"><ChevronRight className="h-4 w-4" /></span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => {
                                        setCustomEndDate(e.target.value);
                                        setCurrentPage(1);
                                        setItemPage(1);
                                    }}
                                    className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30 w-full sm:w-auto"
                                />
                            </div>
                        )}

                        <div className="relative group w-full sm:w-auto sm:min-w-[150px]">
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
                    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full">
                        
                        {/* Item KPI Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                            {[
                                { label: 'TOTAL UNITS SOLD', value: totalItemQty.toLocaleString(), sub: 'Items across orders', icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                { label: 'TOTAL ITEM REVENUE', value: `${totalItemRevenue.toFixed(2)}`, sub: 'Gross item sales', icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                                { label: 'TOP CATEGORY', value: topCategoryName, sub: 'Highest sales volume', icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
                                { label: 'POPULAR PORTION', value: mostPopularPortion === 'STANDARD' ? 'Standard Size' : `Size (${mostPopularPortion})`, sub: 'Most requested size', icon: Tag, color: 'text-amber-600', bg: 'bg-amber-50' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-5 sm:p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform w-full">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={cn("p-4 rounded-2xl", stat.bg)}>
                                            <stat.icon className={cn("h-6 w-6", stat.color)} />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</span>
                                        {isLoadingOrders ? <div className="h-8 w-28 bg-slate-200 rounded-xl animate-pulse mt-1" /> : <h3 className="text-2xl font-black text-slate-900 mt-1 truncate">{stat.value}</h3>}
                                        <p className="text-xs text-slate-400 font-medium mt-1">{stat.sub}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Item Filters Bar */}
                        <div className="glass-card p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border border-white flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center w-full">
                            
                            {/* Search input */}
                            <div className="relative flex-1 w-full">
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
                            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                                
                                {/* Category Filter */}
                                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Category:</span>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => {
                                            setSelectedCategory(e.target.value);
                                            setItemPage(1);
                                        }}
                                        className="flex-1 md:flex-none md:w-auto px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                        <option value="ALL">All Categories</option>
                                        {availableCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Item Name Filter */}
                                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Item:</span>
                                    <select
                                        value={selectedItemName}
                                        onChange={(e) => {
                                            setSelectedItemName(e.target.value);
                                            setItemPage(1);
                                        }}
                                        className="flex-1 md:flex-none md:w-auto px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer md:max-w-[180px] truncate"
                                    >
                                        <option value="ALL">All Items</option>
                                        {availableItemNames.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Portion Size Filter */}
                                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Portion:</span>
                                    <select
                                        value={selectedPortion}
                                        onChange={(e) => {
                                            setSelectedPortion(e.target.value);
                                            setItemPage(1);
                                        }}
                                        className="flex-1 md:flex-none md:w-auto px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
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
                                <div className="flex flex-row items-center gap-2 w-full md:w-auto">
                                    <select
                                        value={sortBy}
                                        onChange={(e) => {
                                            setSortBy(e.target.value as SortOption);
                                            setItemPage(1);
                                        }}
                                        className="flex-1 md:flex-none md:w-auto px-4 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs outline-none cursor-pointer shadow-sm"
                                    >
                                        <option value="revenue_desc">Highest Revenue</option>
                                        <option value="qty_desc">Most Quantity Sold</option>
                                        <option value="name_asc">Item Name (A-Z)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Top Selling & Portion Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">
                            
                            {/* Top 5 Best Sellers Chart */}
                            <div className="lg:col-span-2 glass-card p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white w-full min-w-0">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-lg sm:text-xl font-black text-slate-900 italic flex items-center gap-2 uppercase">
                                            <Trophy className="h-5 w-5 text-amber-500 shrink-0" />
                                            TOP SELLING ITEMS REVENUE
                                        </h2>
                                        <p className="text-xs text-slate-400 font-medium">Ranked by overall sales generated</p>
                                    </div>
                                </div>
                                <div className="h-[280px] sm:h-[300px] w-full min-w-0">
                                    {!isMounted || (isLoadingOrders && isLoadingPagedItems) ? (
                                        <div className="h-full flex flex-col justify-around py-4 animate-pulse">
                                            {[85, 70, 55, 40, 25].map((w, idx) => (
                                                <div key={idx} className="flex items-center gap-4">
                                                    <div className="w-24 sm:w-28 h-4 bg-slate-200 rounded-lg shrink-0" />
                                                    <div className="h-6 bg-indigo-100 rounded-r-xl" style={{ width: `${w}%` }} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : topItemsChartData.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                                            No sales data available
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                                            <BarChart data={topItemsChartData} layout="vertical" margin={{ left: 10, right: 25, top: 0, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                                <XAxis
                                                    type="number"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 700 }}
                                                    tickFormatter={(val: any) => Number(val).toLocaleString()}
                                                />
                                                <YAxis
                                                    dataKey="name"
                                                    type="category"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: '#334155', fontSize: 10, fontWeight: 800 }}
                                                    width={125}
                                                    tickFormatter={(val: string) => val && val.length > 18 ? `${val.substring(0, 16)}...` : val}
                                                />
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
                            <div className="glass-card p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white flex flex-col justify-between w-full">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 italic mb-2 uppercase flex items-center gap-2">
                                        <Tag className="h-5 w-5 text-primary shrink-0" />
                                        PORTION MIX
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium mb-6">Quantity breakdown by portion size (S, M, L, XL)</p>
                                </div>

                                <div className="space-y-4">
                                    {isLoadingOrders ? (
                                        <div className="space-y-4 animate-pulse">
                                            {[...Array(4)].map((_, idx) => (
                                                <div key={idx} className="space-y-1.5">
                                                    <div className="flex justify-between items-center">
                                                        <div className="h-4 w-16 bg-slate-200 rounded-lg" />
                                                        <div className="h-4 w-20 bg-slate-200 rounded-lg" />
                                                    </div>
                                                    <div className="h-3 w-full bg-slate-100 rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : portionChartData.length === 0 ? (
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
                        <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white shadow-sm w-full">
                            <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                                        <FileSpreadsheet className="h-5 w-5 text-primary shrink-0" />
                                        ITEM-WISE PORTION SALES TABLE
                                    </h2>
                                    <p className="text-xs text-slate-400 font-medium">Detailed sales breakdown by food item and portion size</p>
                                </div>
                                <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                    {serverItemTotalCount} ITEMS FOUND
                                </span>
                            </div>

                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-[#F8FAFC]/50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">No.</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Item Name</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Category</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Portion Size</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-center">Qty Sold</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Unit Price</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Total Revenue</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Revenue Share</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingPagedItems ? (
                                            <>
                                                {[...Array(5)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse border-b border-slate-50">
                                                        {[...Array(8)].map((__, j) => (
                                                            <td key={j} className="p-4 sm:p-6">
                                                                <div className="h-4 bg-slate-100 rounded-lg" style={{ width: j === 1 ? '80%' : j === 7 ? '60%' : '70%' }} />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </>
                                        ) : serverItemTotalCount === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-12 sm:p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                                    No item sales recorded for the selected range and filters
                                                </td>
                                            </tr>
                                        ) : (
                                            pagedItems.map((item, index) => {
                                                const portionStyle = PORTION_COLORS[item.portionSize] || PORTION_COLORS['STANDARD'];
                                                const baselineRevenue = serverItemTotalRevenue > 0 ? serverItemTotalRevenue : totalItemRevenue;
                                                const sharePct = baselineRevenue > 0 ? (item.totalRevenue / baselineRevenue) * 100 : 0;

                                                return (
                                                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-4 sm:p-6 font-bold text-slate-400 text-sm">
                                                            {(itemPage - 1) * itemTablePerPage + index + 1}
                                                        </td>
                                                        <td className="p-4 sm:p-6">
                                                            <div>
                                                                <span className="font-bold text-slate-900 block text-base">{item.baseName}</span>
                                                                <span className="text-[11px] font-medium text-slate-400">{item.fullName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 sm:p-6">
                                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
                                                                {item.category}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 sm:p-6">
                                                            <span className={cn(
                                                                "px-3 py-1.5 rounded-xl text-xs font-black uppercase border tracking-wider",
                                                                portionStyle.bg,
                                                                portionStyle.text,
                                                                portionStyle.border
                                                            )}>
                                                                {item.portionSize === 'STANDARD' ? 'Standard' : item.portionSize}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 sm:p-6 text-center">
                                                            <span className="inline-flex items-center justify-center px-4 py-1 bg-slate-100 font-black text-slate-900 rounded-xl text-sm">
                                                                {item.totalQuantity}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 sm:p-6 text-right font-medium text-slate-600">
                                                            {item.unitPrice.toFixed(2)}
                                                        </td>
                                                        <td className="p-4 sm:p-6 text-right font-black text-slate-900 text-base">
                                                            {item.totalRevenue.toFixed(2)}
                                                        </td>
                                                        <td className="p-4 sm:p-6 text-right">
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
                            {!isLoadingPagedItems && serverItemTotalCount > 0 && (
                                <Pagination
                                    currentPage={itemPage}
                                    totalPages={serverItemTotalPages}
                                    totalItems={serverItemTotalCount}
                                    itemsPerPage={itemTablePerPage}
                                    onPageChange={handleItemPageChange}
                                    onItemsPerPageChange={(newSize) => {
                                        setItemTablePerPage(newSize);
                                        setItemPage(1);
                                    }}
                                    pageSizeOptions={[5, 10, 20, 50, 100]}
                                    itemName="item variations"
                                />
                            )}
                        </div>

                    </div>
                )}

                {/* -------------------- VIEW 2: FINANCIALS OVERVIEW -------------------- */}
                {activeView === 'financials' && (
                    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
                            {[
                                { label: 'GROSS REVENUE', value: `${totalSales.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: '+12.5%', isUp: true },
                                { label: 'TRANSACTIONS', value: totalOrders.toString(), icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: '+5.2%', isUp: true },
                                { label: 'AVG ORDER VAL', value: `${avgOrderValue.toFixed(2)}`, icon: PieChart, color: 'text-amber-600', bg: 'bg-amber-50', trend: '-1.4%', isUp: false },
                                { label: 'CASH vs CARD', value: `${((cashSales / Math.max(1, totalSales)) * 100).toFixed(0)}% / ${((cardSales / Math.max(1, totalSales)) * 100).toFixed(0)}%`, icon: CreditCard, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Neutral', isUp: null },
                            ].map((stat, i) => (
                                <div key={i} className="glass-card p-5 sm:p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform w-full">
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
                                        {isLoadingOrders ? <div className="h-9 w-28 bg-slate-200 rounded-xl animate-pulse mt-1" /> : <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stat.value}</h3>}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Chart & Payment Distribution */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 w-full">

                            <div className="lg:col-span-2 glass-card p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white w-full min-w-0">
                                <div className="flex items-center justify-between mb-6 sm:mb-8">
                                    <h2 className="text-lg sm:text-xl font-black text-slate-900 italic uppercase">REVENUE TREND</h2>
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1.5 font-bold text-xs text-slate-400">
                                            <span className="w-2.5 h-2.5 bg-primary rounded-full" />
                                            Sales
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[280px] sm:h-[350px] w-full min-w-0">
                                    {!isMounted || isLoadingOrders ? (
                                        <div className="h-full flex items-end gap-3 px-6 pb-6 animate-pulse">
                                            {[40, 65, 30, 85, 50, 95, 70, 80, 60, 90, 75, 85].map((h, idx) => (
                                                <div key={idx} className="flex-1 bg-indigo-100 rounded-t-xl" style={{ height: `${h}%` }} />
                                            ))}
                                        </div>
                                    ) : (
                                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                                        <AreaChart data={chartData} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
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
                                                tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                                                dy={10}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#94A3B8', fontSize: 11, fontWeight: 700 }}
                                                width={45}
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
                                    )}
                                </div>
                            </div>

                            <div className="glass-card p-4 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-white w-full">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900 italic mb-6 sm:mb-8 uppercase">PAYMENT DISTRIBUTION</h2>
                                <div className="space-y-6">
                                    {isLoadingOrders ? (
                                        <div className="space-y-6 animate-pulse">
                                            {[...Array(2)].map((_, idx) => (
                                                <div key={idx} className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <div className="h-4 w-32 bg-slate-200 rounded-lg" />
                                                        <div className="h-4 w-16 bg-slate-200 rounded-lg" />
                                                    </div>
                                                    <div className="h-4 w-full bg-slate-100 rounded-full" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                    <>
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
                                    </>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Transactions Table */}
                        <div className="glass-card rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-white w-full shadow-sm">
                            <div className="p-6 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <h2 className="text-lg sm:text-xl font-black text-slate-900 italic uppercase">TRANSACTION LOG</h2>
                                <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
                                    {serverTotalCount} ENTRIES FOUND
                                </span>
                            </div>
                            <div className="overflow-x-auto w-full">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead className="bg-[#F8FAFC]/50 border-b border-slate-100">
                                        <tr>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">No.</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Order ID</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Timestamp</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Method</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Amount</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Status</th>
                                            <th className="p-4 sm:p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Order Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoadingPagedOrders ? (
                                            <>
                                                {[...Array(5)].map((_, i) => (
                                                    <tr key={i} className="animate-pulse border-b border-slate-50">
                                                        {[...Array(7)].map((__, j) => (
                                                            <td key={j} className="p-4 sm:p-6">
                                                                <div className="h-4 bg-slate-100 rounded-lg" style={{ width: j === 2 ? '75%' : j === 6 ? '40%' : '65%' }} />
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </>
                                        ) : pagedOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan={7} className="p-12 sm:p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                                    Zero records for selected parameters
                                                </td>
                                            </tr>
                                        ) : (
                                            pagedOrders.map((order, index) => (
                                                <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                                    <td className="p-4 sm:p-6">
                                                        <span className="font-bold text-slate-500">{(currentPage - 1) * itemsPerPage + index + 1}</span>
                                                    </td>
                                                    <td className="p-4 sm:p-6">
                                                        <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                                                    </td>
                                                    <td className="p-4 sm:p-6 text-slate-500 font-medium text-xs sm:text-sm">
                                                        {format(parseOrderDate(order.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                    </td>
                                                    <td className="p-4 sm:p-6">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                                                            order.paymentMethod === 'CARD' ? "bg-indigo-50 text-indigo-600" : "bg-emerald-50 text-emerald-600"
                                                        )}>
                                                            {order.paymentMethod}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 sm:p-6 font-black text-slate-900">
                                                        {order.total.toFixed(2)}
                                                    </td>
                                                    <td className="p-4 sm:p-6">
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
                                                    <td className="p-4 sm:p-6 text-right">
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
                            {!isLoadingPagedOrders && serverTotalCount > 0 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={serverTotalPages}
                                    totalItems={serverTotalCount}
                                    itemsPerPage={itemsPerPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={(newSize) => {
                                        setItemsPerPage(newSize);
                                        setCurrentPage(1);
                                    }}
                                    pageSizeOptions={[5, 10, 20, 50, 100]}
                                    itemName="transactions"
                                />
                            )}
                        </div>
                    </div>
                )}

            </div>

            {/* Order Details Modal */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-[2rem] sm:rounded-[2.5rem] p-5 sm:p-8 overflow-hidden shadow-2xl border border-white animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-black italic tracking-tight uppercase text-slate-900">Order Details</h2>
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
                            <div className="bg-slate-50 rounded-3xl p-4 sm:p-6 border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Ordered Items</p>
                                <div className="space-y-3 sm:space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white p-3 sm:p-4 rounded-2xl border border-slate-50 shadow-sm">
                                            <div className="flex items-center gap-3 sm:gap-4">
                                                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-100 rounded-xl flex items-center justify-center text-xs font-black text-slate-400 shrink-0">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-800 text-sm sm:text-base">{item.name}</p>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit: {item.price.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <p className="font-black text-slate-900 text-sm sm:text-base">{(item.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time</p>
                                    <p className="font-bold text-slate-700 text-sm">{format(parseOrderDate(selectedOrder.createdAt), 'HH:mm • MMM dd')}</p>
                                </div>
                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Payment</p>
                                    <p className="font-bold text-slate-700 text-sm">{selectedOrder.paymentMethod}</p>
                                </div>
                            </div>

                            <div className="flex justify-between items-center p-5 sm:p-6 bg-slate-900 rounded-3xl shadow-xl shadow-slate-200">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Total Amount</span>
                                <span className="text-2xl sm:text-3xl font-black text-white italic tracking-tighter tabular-nums">{selectedOrder.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </AppLayout>
    );
}
