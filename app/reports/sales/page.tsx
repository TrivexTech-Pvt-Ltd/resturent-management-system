"use client";

import { useState } from "react";
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
    Download
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
    Bar
} from "recharts";

import { getOrders } from "@/lib/db";
import { Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'custom';
type PaymentFilter = 'ALL' | 'CASH' | 'CARD';

export default function SalesReportPage() {
    const [timeRange, setTimeRange] = useState<TimeRange>('daily');
    const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');
    const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const { data: orders = [], isLoading } = useQuery({
        queryKey: ["orders-report"],
        queryFn: getOrders,
    });

    // Filter logic
    const getFilteredOrders = () => {
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

        return orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            const matchesDate = isWithinInterval(orderDate, { start: startLimit, end: endLimit });
            const matchesPayment = paymentFilter === 'ALL' || order.paymentMethod === paymentFilter;
            return matchesDate && matchesPayment;
        });
    };

    const filteredOrders = getFilteredOrders();

    // Statistics
    const totalSales = filteredOrders.reduce((sum, o) => sum + o.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    const cashSales = filteredOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
    const cardSales = filteredOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.total, 0);

    // PDF Export Logic
    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(99, 102, 241); // Primary color
        doc.text("NEXTSERVE SALES REPORT", 14, 22);

        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184); // Slate 400
        doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 30);

        // Summary Section
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42); // Slate 900
        doc.text("Financial Summary", 14, 45);

        doc.setFontSize(10);
        doc.text(`Total Revenue: ${totalSales.toFixed(2)}`, 14, 55);
        doc.text(`Total Transactions: ${totalOrders}`, 14, 62);
        doc.text(`Average Order Value: ${avgOrderValue.toFixed(2)}`, 14, 69);
        doc.text(`Payment Mix: Cash ${cashSales.toFixed(2)} / Card ${cardSales.toFixed(2)}`, 14, 76);

        // Table Section
        autoTable(doc, {
            startY: 85,
            head: [['Order ID', 'Timestamp', 'Method', 'Amount', 'Status']],
            body: filteredOrders.map(o => [
                `#${o.orderNumber}`,
                format(new Date(o.createdAt), 'MMM dd, HH:mm'),
                o.paymentMethod,
                o.total.toFixed(2),
                o.status
            ]),
            headStyles: { fillColor: [99, 102, 241], fontSize: 10, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { top: 85 },
        });

        doc.save(`Sales_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    // Chart Data preparation
    const getChartData = () => {
        let interval: { start: Date, end: Date };
        const now = new Date();

        if (timeRange === 'custom') {
            interval = { start: new Date(customStartDate), end: new Date(customEndDate) };
        } else if (timeRange === 'daily') {
            // For daily, we show hours? No, let's keep it simple with days for now
            interval = { start: subDays(now, 6), end: now };
        } else if (timeRange === 'weekly') {
            interval = { start: subWeeks(now, 1), end: now };
        } else {
            interval = { start: subMonths(now, 1), end: now };
        }

        const days = eachDayOfInterval(interval);

        return days.map(day => {
            const dayOrders = orders.filter(o => isSameDay(new Date(o.createdAt), day));
            const sales = dayOrders.reduce((sum, o) => sum + (o.paymentMethod === paymentFilter || paymentFilter === 'ALL' ? o.total : 0), 0);
            return {
                date: format(day, 'MMM dd'),
                sales: sales
            };
        });
    };

    const chartData = getChartData();

    // Pagination calculations
    const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
    const paginatedOrders = [...filteredOrders].reverse().slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
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
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic">
                            <TrendingUp className="text-primary h-10 w-10 not-italic" />
                            SALES REVENUE
                        </h1>
                        <p className="text-slate-500 font-medium">Detailed financial analytics and transaction reports</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToPDF}
                            className="bg-white border border-slate-200 text-slate-600 px-5 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <Download className="h-4 w-4" />
                            Export
                        </button>
                    </div>
                </div>

                {/* Filters Bar */}
                <div className="glass-card p-6 rounded-[2.5rem] flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between border border-white">
                    <div className="flex flex-wrap items-center gap-2">
                        {(['daily', 'weekly', 'monthly', 'custom'] as TimeRange[]).map((range) => (
                            <button
                                key={range}
                                onClick={() => {
                                    setTimeRange(range);
                                    setCurrentPage(1); // Reset to first page on filter change
                                }}
                                className={cn(
                                    "px-6 py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-widest cursor-pointer",
                                    timeRange === range
                                        ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                            >
                                {range}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
                        {timeRange === 'custom' && (
                            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="bg-white px-3 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30"
                                />
                                <span className="text-slate-400"><ChevronRight className="h-4 w-4" /></span>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="bg-white px-3 py-2 rounded-xl text-sm font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30"
                                />
                            </div>
                        )}

                        <div className="relative group w-full md:w-auto">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                <CreditCard className="h-4 w-4" />
                            </div>
                            <select
                                value={paymentFilter}
                                onChange={(e) => {
                                    setPaymentFilter(e.target.value as PaymentFilter);
                                    setCurrentPage(1); // Reset to first page on filter change
                                }}
                                className="w-full md:w-48 pl-11 pr-4 py-3 bg-slate-100 rounded-2xl font-bold text-sm text-slate-700 appearance-none outline-none hover:bg-slate-200 transition-colors cursor-pointer"
                            >
                                <option value="ALL">All Payments</option>
                                <option value="CASH">Cash Only</option>
                                <option value="CARD">Card Only</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <Filter className="h-3 w-3" />
                            </div>
                        </div>
                    </div>
                </div>

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
                                <h3 className="text-3xl font-black text-slate-900 mt-1">{isLoading ? "---" : stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chart & Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    <div className="lg:col-span-2 glass-card p-8 rounded-[2.5rem] border border-white">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-900 italic">REVENUE CLASSIFICATION</h2>
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
                        <h2 className="text-xl font-black text-slate-900 italic mb-8">PAYMENT DISTRIBUTION</h2>
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

                            <div className="pt-8 border-t border-slate-100 hidden">
                                <div className="bg-slate-50 p-6 rounded-3xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <CalendarDays className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Best Selling Day</span>
                                            <span className="text-sm font-bold text-slate-700">Friday, Oct 24</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Peak Hour</span>
                                            <span className="text-sm font-bold text-slate-700">19:00 - 20:00</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Transactions Table */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white">
                    <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-900 italic">TRANSACTION LOG</h2>
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap">
                            {filteredOrders.length} ENTRIES FOUND
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F8FAFC]/50 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Order ID</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Timestamp</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Method</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Amount</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                            Synchronizing Ledger...
                                        </td>
                                    </tr>
                                ) : filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                            Zero records for selected parameters
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedOrders.map((order) => (
                                        <tr key={order.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6">
                                                <span className="font-bold text-slate-900">#{order.orderNumber}</span>
                                            </td>
                                            <td className="p-6 text-slate-500 font-medium">
                                                {format(new Date(order.createdAt), 'MMM dd, yyyy • HH:mm')}
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
                                            <td className="p-6 text-right">
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
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination UI */}
                    {!isLoading && filteredOrders.length > 0 && (
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
        </div>
    );
}
