"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ChefHat,
    Scale,
    Package,
    Layers,
    Search,
    Download,
    Tag,
    Filter,
    Calendar,
    DollarSign,
    AlertCircle,
    Utensils,
    ChevronRight,
    PieChart,
    BarChart3,
    FileSpreadsheet,
    Boxes,
    X,
    CheckCircle2,
    Info,
    ArrowLeft
} from "lucide-react";
import {
    format,
    subDays,
    startOfDay,
    endOfDay,
    isWithinInterval,
    subWeeks,
    subMonths,
} from "date-fns";
import {
    getOrders,
    getMenu,
    getEstimations,
    getMasterIngredients
} from "@/lib/db";
import { Order, MenuItem, EstimationRecord, MasterIngredient, IngredientItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'custom';
export type IngredientViewTab = 'summary' | 'item' | 'category' | 'portion';

// Portion color mappings
const PORTION_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'S': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    'M': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    'L': { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200' },
    'XL': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    'STANDARD': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
};

// Helper to parse backend dates
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

// Portion & Item Name Parser
const parseItemDetails = (item: { name: string; category?: string; price: number }, menuList: MenuItem[] = []) => {
    let name = item.name.trim();
    let baseName = name;
    let portionSize = "STANDARD";

    const parenMatch = name.match(/^(.*?)\s*\((S|M|L|XL|Small|Medium|Large|Extra Large|[A-Za-z0-9\s]+)\)$/i);
    if (parenMatch) {
        baseName = parenMatch[1].trim();
        portionSize = parenMatch[2].trim().toUpperCase();
    } else {
        const spaceMatch = name.match(/^(.*?)\s+(S|M|L|XL|Small|Medium|Large|Extra Large)$/i);
        if (spaceMatch) {
            baseName = spaceMatch[1].trim();
            portionSize = spaceMatch[2].trim().toUpperCase();
        }
    }

    if (portionSize === "SMALL") portionSize = "S";
    if (portionSize === "MEDIUM") portionSize = "M";
    if (portionSize === "LARGE") portionSize = "L";
    if (portionSize === "EXTRA LARGE") portionSize = "XL";

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

interface IngredientsReportProps {
    initialTimeRange?: TimeRange;
    showTitle?: boolean;
}

export default function IngredientsReport({ initialTimeRange = 'daily', showTitle = false }: IngredientsReportProps) {
    const [timeRange, setTimeRange] = useState<TimeRange>(initialTimeRange);
    const [activeTab, setActiveTab] = useState<IngredientViewTab>('summary');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('ALL');
    const [selectedPortion, setSelectedPortion] = useState('ALL');
    const [selectedItemName, setSelectedItemName] = useState('ALL');

    const [customStartDate, setCustomStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Queries
    const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
        queryKey: ["orders-report"],
        queryFn: getOrders,
    });

    const { data: menuList = [] } = useQuery({
        queryKey: ["menu"],
        queryFn: getMenu,
    });

    const { data: estimations = [], isLoading: isLoadingEstimations } = useQuery({
        queryKey: ["estimations"],
        queryFn: getEstimations,
    });

    const { data: masterIngredients = [] } = useQuery({
        queryKey: ["master-ingredients"],
        queryFn: getMasterIngredients,
    });

    // Date Interval Calculation
    const dateInterval = useMemo(() => {
        const now = new Date();
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

        const endLimit = timeRange === 'custom' ? endOfDay(new Date(customEndDate)) : endOfDay(now);
        return { start: startLimit, end: endLimit };
    }, [timeRange, customStartDate, customEndDate]);

    // Filter orders by date range
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const orderDate = parseOrderDate(order.createdAt);
            return isWithinInterval(orderDate, dateInterval);
        });
    }, [orders, dateInterval]);

    // Match helper function for Dish Estimation recipes
    const findRecipeForDish = (baseName: string, portionSize: string, fullName: string) => {
        const normBase = baseName.toLowerCase().trim();
        const normFull = fullName.toLowerCase().trim();
        const normPortion = portionSize.toUpperCase().trim();

        // 1. Match item name AND portion size
        let matched = estimations.find(e =>
            e.itemName.toLowerCase().trim() === normBase &&
            e.portionSize.toUpperCase().trim() === normPortion
        );

        // 2. Match full name e.g. "Chicken Kottu (M)"
        if (!matched) {
            matched = estimations.find(e =>
                e.itemName.toLowerCase().trim() === normFull
            );
        }

        // 3. Fallback match item name
        if (!matched) {
            matched = estimations.find(e =>
                e.itemName.toLowerCase().trim() === normBase
            );
        }

        return matched;
    };

    // Calculate Consumed Ingredients Data
    const consumptionData = useMemo(() => {
        // Aggregate sold items
        const soldItemsMap: Record<string, {
            key: string;
            baseName: string;
            portionSize: string;
            fullName: string;
            category: string;
            soldQty: number;
            totalRevenue: number;
            recipe?: EstimationRecord;
            ingredients: { name: string; quantity: number; unit: string; cost: number; masterIngredientId?: string }[];
        }> = {};

        // Aggregate raw ingredients summary
        const rawIngredientsSummaryMap: Record<string, {
            name: string;
            unit: string;
            totalQuantity: number;
            totalCost: number;
            usedInDishesCount: number;
            dishes: Set<string>;
            masterIngredient?: MasterIngredient;
        }> = {};

        // Category-wise ingredients map
        const categoryMap: Record<string, {
            categoryName: string;
            totalDishQtySold: number;
            totalCategoryCost: number;
            ingredients: Record<string, { name: string; unit: string; quantity: number; cost: number }>;
        }> = {};

        // Portion-wise ingredients map
        const portionMap: Record<string, {
            portionSize: string;
            totalDishQtySold: number;
            totalPortionCost: number;
            ingredients: Record<string, { name: string; unit: string; quantity: number; cost: number }>;
        }> = {};

        let totalDishesSold = 0;
        let unlinkedDishCount = 0;

        filteredOrders.forEach(order => {
            if (!order.items || !Array.isArray(order.items)) return;

            order.items.forEach(item => {
                const details = parseItemDetails(item, menuList);
                const soldQty = item.quantity || 1;
                const revenue = (item.price || 0) * soldQty;
                const itemKey = `${details.baseName}___${details.portionSize}`;

                totalDishesSold += soldQty;

                if (!soldItemsMap[itemKey]) {
                    const recipe = findRecipeForDish(details.baseName, details.portionSize, details.fullName);
                    soldItemsMap[itemKey] = {
                        key: itemKey,
                        baseName: details.baseName,
                        portionSize: details.portionSize,
                        fullName: details.fullName,
                        category: details.category,
                        soldQty: 0,
                        totalRevenue: 0,
                        recipe: recipe,
                        ingredients: recipe ? recipe.ingredients.map(ing => ({
                            name: ing.name,
                            quantity: ing.quantity,
                            unit: ing.unit,
                            cost: ing.cost,
                            masterIngredientId: ing.masterIngredientId
                        })) : []
                    };
                }

                soldItemsMap[itemKey].soldQty += soldQty;
                soldItemsMap[itemKey].totalRevenue += revenue;

                const currentDish = soldItemsMap[itemKey];

                if (!currentDish.recipe) {
                    unlinkedDishCount += soldQty;
                } else {
                    // Accumulate ingredients for this dish sale
                    currentDish.ingredients.forEach(ing => {
                        const totalIngQty = ing.quantity * soldQty;
                        const totalIngCost = ing.cost * soldQty;
                        const ingKey = `${ing.name.toLowerCase().trim()}___${ing.unit.toLowerCase().trim()}`;

                        // 1. Raw Ingredients Summary
                        if (!rawIngredientsSummaryMap[ingKey]) {
                            const masterMatch = masterIngredients.find(m =>
                                (ing.masterIngredientId && m.id === ing.masterIngredientId) ||
                                m.name.toLowerCase().trim() === ing.name.toLowerCase().trim()
                            );

                            rawIngredientsSummaryMap[ingKey] = {
                                name: ing.name,
                                unit: ing.unit,
                                totalQuantity: 0,
                                totalCost: 0,
                                usedInDishesCount: 0,
                                dishes: new Set<string>(),
                                masterIngredient: masterMatch
                            };
                        }

                        rawIngredientsSummaryMap[ingKey].totalQuantity += totalIngQty;
                        rawIngredientsSummaryMap[ingKey].totalCost += totalIngCost;
                        rawIngredientsSummaryMap[ingKey].dishes.add(`${details.baseName} (${details.portionSize})`);

                        // 2. Category-Wise Map
                        const catKey = details.category || "General";
                        if (!categoryMap[catKey]) {
                            categoryMap[catKey] = {
                                categoryName: catKey,
                                totalDishQtySold: 0,
                                totalCategoryCost: 0,
                                ingredients: {}
                            };
                        }
                        categoryMap[catKey].totalDishQtySold += soldQty;
                        categoryMap[catKey].totalCategoryCost += totalIngCost;

                        if (!categoryMap[catKey].ingredients[ingKey]) {
                            categoryMap[catKey].ingredients[ingKey] = {
                                name: ing.name,
                                unit: ing.unit,
                                quantity: 0,
                                cost: 0
                            };
                        }
                        categoryMap[catKey].ingredients[ingKey].quantity += totalIngQty;
                        categoryMap[catKey].ingredients[ingKey].cost += totalIngCost;

                        // 3. Portion-Wise Map
                        const portKey = details.portionSize || "STANDARD";
                        if (!portionMap[portKey]) {
                            portionMap[portKey] = {
                                portionSize: portKey,
                                totalDishQtySold: 0,
                                totalPortionCost: 0,
                                ingredients: {}
                            };
                        }
                        portionMap[portKey].totalDishQtySold += soldQty;
                        portionMap[portKey].totalPortionCost += totalIngCost;

                        if (!portionMap[portKey].ingredients[ingKey]) {
                            portionMap[portKey].ingredients[ingKey] = {
                                name: ing.name,
                                unit: ing.unit,
                                quantity: 0,
                                cost: 0
                            };
                        }
                        portionMap[portKey].ingredients[ingKey].quantity += totalIngQty;
                        portionMap[portKey].ingredients[ingKey].cost += totalIngCost;
                    });
                }
            });
        });

        // Set counts
        Object.values(rawIngredientsSummaryMap).forEach(ing => {
            ing.usedInDishesCount = ing.dishes.size;
        });

        let rawSummaryList = Object.values(rawIngredientsSummaryMap);
        let itemList = Object.values(soldItemsMap);
        let categoryList = Object.values(categoryMap);
        let portionList = Object.values(portionMap);

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            rawSummaryList = rawSummaryList.filter(ing => ing.name.toLowerCase().includes(query));
            itemList = itemList.filter(item =>
                item.baseName.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query) ||
                item.portionSize.toLowerCase().includes(query) ||
                item.ingredients.some(i => i.name.toLowerCase().includes(query))
            );
            categoryList = categoryList.filter(cat => cat.categoryName.toLowerCase().includes(query));
            portionList = portionList.filter(p => p.portionSize.toLowerCase().includes(query));
        }

        // Filter by Category
        if (selectedCategory !== 'ALL') {
            itemList = itemList.filter(item => item.category.toLowerCase() === selectedCategory.toLowerCase());
            categoryList = categoryList.filter(cat => cat.categoryName.toLowerCase() === selectedCategory.toLowerCase());
        }

        // Filter by Portion
        if (selectedPortion !== 'ALL') {
            itemList = itemList.filter(item => item.portionSize.toUpperCase() === selectedPortion.toUpperCase());
            portionList = portionList.filter(p => p.portionSize.toUpperCase() === selectedPortion.toUpperCase());
        }

        // Filter by Item Name
        if (selectedItemName !== 'ALL') {
            itemList = itemList.filter(item => item.baseName.toLowerCase() === selectedItemName.toLowerCase());
        }

        const totalIngredientCost = Object.values(rawIngredientsSummaryMap).reduce((sum, i) => sum + i.totalCost, 0);

        return {
            rawSummaryList: rawSummaryList.sort((a, b) => b.totalCost - a.totalCost),
            itemList: itemList.sort((a, b) => b.soldQty - a.soldQty),
            categoryList: categoryList.sort((a, b) => b.totalCategoryCost - a.totalCategoryCost),
            portionList: portionList.sort((a, b) => b.totalDishQtySold - a.totalDishQtySold),
            totalDishesSold,
            unlinkedDishCount,
            totalUniqueIngredients: Object.keys(rawIngredientsSummaryMap).length,
            totalIngredientCost
        };
    }, [filteredOrders, estimations, menuList, masterIngredients, searchQuery, selectedCategory, selectedPortion, selectedItemName]);

    // Unique Categories list for dropdown
    const availableCategories = useMemo(() => {
        const cats = new Set<string>();
        menuList.forEach(m => { if (m.category) cats.add(m.category); });
        return Array.from(cats).sort();
    }, [menuList]);

    // Unique Item Names list for dropdown
    const availableItemNames = useMemo(() => {
        const names = new Set<string>();
        menuList.forEach(m => { if (m.name) names.add(m.name.trim()); });
        return Array.from(names).sort();
    }, [menuList]);

    // PDF Export Logic for Ingredient Consumption Report
    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(20);
        doc.setTextColor(79, 70, 229);
        doc.text("INGREDIENTS CONSUMPTION & REQUIREMENT REPORT", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`Timeframe: ${timeRange.toUpperCase()} (${format(dateInterval.start, 'MMM dd, yyyy')} - ${format(dateInterval.end, 'MMM dd, yyyy')})`, 14, 28);
        doc.text(`Generated on: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 14, 34);

        // Summary KPIs
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Consumption Highlights", 14, 46);

        doc.setFontSize(9);
        doc.text(`Total Selling Items Sold: ${consumptionData.totalDishesSold} units`, 14, 54);
        doc.text(`Unique Ingredients Consumed: ${consumptionData.totalUniqueIngredients}`, 14, 60);
        doc.text(`Total Estimated Ingredient Cost: LKR ${consumptionData.totalIngredientCost.toFixed(2)}`, 14, 66);
        if (consumptionData.unlinkedDishCount > 0) {
            doc.setTextColor(225, 29, 72);
            doc.text(`Note: ${consumptionData.unlinkedDishCount} sold items have no linked Dish Estimation recipe`, 14, 72);
        }

        // Table 1: Raw Ingredients Summary List
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Raw Ingredients Aggregate Consumption", 14, 84);

        autoTable(doc, {
            startY: 90,
            head: [['#', 'Ingredient Name', 'Total Required Qty', 'Unit', 'Est. Cost (LKR)', 'Used in Dishes']],
            body: consumptionData.rawSummaryList.map((ing, idx) => [
                idx + 1,
                ing.name,
                ing.totalQuantity % 1 === 0 ? ing.totalQuantity.toString() : ing.totalQuantity.toFixed(2),
                ing.unit,
                ing.totalCost.toFixed(2),
                `${ing.usedInDishesCount} Dish(es)`
            ]),
            headStyles: { fillColor: [79, 70, 229], fontSize: 9, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        // Table 2: Item-wise Ingredients Breakdown
        const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 180;
        if (finalY > 230) doc.addPage();

        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text("Item-Wise Ingredient Breakdown", 14, finalY > 230 ? 20 : finalY);

        const itemTableData: any[] = [];
        consumptionData.itemList.forEach(item => {
            if (item.ingredients.length === 0) {
                itemTableData.push([
                    item.baseName,
                    item.portionSize,
                    item.category,
                    item.soldQty,
                    'No Recipe Linked',
                    '-',
                    '-'
                ]);
            } else {
                item.ingredients.forEach((ing, iIdx) => {
                    itemTableData.push([
                        iIdx === 0 ? item.baseName : '',
                        iIdx === 0 ? item.portionSize : '',
                        iIdx === 0 ? item.category : '',
                        iIdx === 0 ? item.soldQty : '',
                        ing.name,
                        `${(ing.quantity * item.soldQty).toFixed(2)} ${ing.unit}`,
                        `LKR ${(ing.cost * item.soldQty).toFixed(2)}`
                    ]);
                });
            }
        });

        autoTable(doc, {
            startY: finalY > 230 ? 26 : finalY + 6,
            head: [['Dish Name', 'Portion', 'Category', 'Units Sold', 'Ingredient', 'Total Ing Qty', 'Total Ing Cost']],
            body: itemTableData,
            headStyles: { fillColor: [30, 41, 59], fontSize: 8, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
        });

        doc.save(`Ingredients_Requirement_Report_${timeRange}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header if standalone */}
            {showTitle && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
                            <ChefHat className="text-primary h-10 w-10 not-italic" />
                            INGREDIENTS REQUIREMENT & CONSUMPTION
                        </h1>
                        <p className="text-slate-500 font-medium">Daily, weekly, monthly & custom ingredient usage breakdown by items, categories & portions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={exportToPDF}
                            className="bg-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all shadow-md shadow-primary/20 cursor-pointer active:scale-95"
                        >
                            <Download className="h-4 w-4" />
                            Export Ingredients PDF
                        </button>
                    </div>
                </div>
            )}

            {/* Timeframe Selector & Export Bar */}
            <div className="glass-card p-6 rounded-[2.5rem] flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between border border-white">
                
                {/* Views / Sub-tabs */}
                <div className="flex flex-wrap items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200/50">
                    <button
                        onClick={() => setActiveTab('summary')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === 'summary'
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <Scale className="h-4 w-4" />
                        Total Ingredients
                    </button>
                    <button
                        onClick={() => setActiveTab('item')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === 'item'
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <Utensils className="h-4 w-4" />
                        Item Wise
                    </button>
                    <button
                        onClick={() => setActiveTab('category')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === 'category'
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <Layers className="h-4 w-4" />
                        Category Wise
                    </button>
                    <button
                        onClick={() => setActiveTab('portion')}
                        className={cn(
                            "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                            activeTab === 'portion'
                                ? "bg-primary text-white shadow-md shadow-primary/20"
                                : "text-slate-500 hover:text-slate-800"
                        )}
                    >
                        <Tag className="h-4 w-4" />
                        Portion Wise
                    </button>
                </div>

                {/* Time Range Selector */}
                <div className="flex flex-wrap items-center gap-2">
                    {(['daily', 'weekly', 'monthly', 'custom'] as TimeRange[]).map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
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
                                onChange={(e) => setCustomStartDate(e.target.value)}
                                className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30"
                            />
                            <span className="text-slate-400"><ChevronRight className="h-4 w-4" /></span>
                            <input
                                type="date"
                                value={customEndDate}
                                onChange={(e) => setCustomEndDate(e.target.value)}
                                className="bg-white px-3 py-2 rounded-xl text-xs font-bold text-slate-700 outline-none border border-transparent focus:border-primary/30"
                            />
                        </div>
                    )}

                    {!showTitle && (
                        <button
                            onClick={exportToPDF}
                            className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all cursor-pointer ml-2"
                        >
                            <Download className="h-4 w-4 text-primary" />
                            PDF Report
                        </button>
                    )}
                </div>
            </div>

            {/* Ingredient Summary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                            <ChefHat className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">FOOD DISHES SOLD</span>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{isLoadingOrders ? "---" : consumptionData.totalDishesSold.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Total portions ordered</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-600">
                            <Boxes className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">UNIQUE INGREDIENTS</span>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">{isLoadingEstimations ? "---" : consumptionData.totalUniqueIngredients}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Raw items consumed</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-4 rounded-2xl bg-purple-50 text-purple-600">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TOTAL INGREDIENT COST</span>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">LKR {consumptionData.totalIngredientCost.toFixed(2)}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">Based on estimation cost</p>
                    </div>
                </div>

                <div className="glass-card p-6 rounded-4xl border border-white shadow-sm flex flex-col justify-between hover:scale-[1.02] transition-transform">
                    <div className="flex justify-between items-start mb-4">
                        <div className={cn("p-4 rounded-2xl", consumptionData.unlinkedDishCount > 0 ? "bg-amber-50 text-amber-600" : "bg-teal-50 text-teal-600")}>
                            <AlertCircle className="h-6 w-6" />
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RECIPE LINK STATUS</span>
                        <h3 className="text-2xl font-black text-slate-900 mt-1">
                            {consumptionData.unlinkedDishCount > 0 ? `${consumptionData.unlinkedDishCount} Unlinked` : "100% Linked"}
                        </h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">
                            {consumptionData.unlinkedDishCount > 0 ? "Items missing estimation recipe" : "All sold items have recipes"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Missing Recipe Warning Banner */}
            {consumptionData.unlinkedDishCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start gap-4 text-amber-800">
                    <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                        <h4 className="font-bold text-sm">Notice: Some sold items do not have linked recipes</h4>
                        <p>
                            {consumptionData.unlinkedDishCount} portion(s) sold in this timeframe do not have corresponding recipes saved in <strong>Dish Estimations</strong>. 
                            Add dish estimations with portion sizes (S, M, L, XL) to get exact raw ingredient calculations for every sold item.
                        </p>
                    </div>
                </div>
            )}

            {/* Filter Bar */}
            <div className="glass-card p-6 rounded-[2.5rem] border border-white flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
                
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search ingredient name, selling item, category, or portion..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>

                {/* Dropdown Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Category Filter */}
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <option value="ALL">All Categories</option>
                        {availableCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>

                    {/* Item Filter */}
                    <select
                        value={selectedItemName}
                        onChange={(e) => setSelectedItemName(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer max-w-[170px] truncate"
                    >
                        <option value="ALL">All Items</option>
                        {availableItemNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>

                    {/* Portion Filter */}
                    <select
                        value={selectedPortion}
                        onChange={(e) => setSelectedPortion(e.target.value)}
                        className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-xs text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <option value="ALL">All Portions</option>
                        <option value="S">S (Small)</option>
                        <option value="M">M (Medium)</option>
                        <option value="L">L (Large)</option>
                        <option value="XL">XL (Extra Large)</option>
                        <option value="STANDARD">Standard</option>
                    </select>
                </div>
            </div>

            {/* TAB 1: TOTAL RAW INGREDIENTS SUMMARY AGGREGATE */}
            {activeTab === 'summary' && (
                <div className="glass-card rounded-[2.5rem] border border-white p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                                <Scale className="h-5 w-5 text-primary" />
                                AGGREGATE RAW INGREDIENTS CONSUMPTION ({timeRange.toUpperCase()})
                            </h2>
                            <p className="text-xs text-slate-400 font-medium">Total raw materials required to fulfill all sold menu items</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                    <th className="py-4 px-4">Raw Ingredient</th>
                                    <th className="py-4 px-4">Total Consumed Qty</th>
                                    <th className="py-4 px-4">Unit</th>
                                    <th className="py-4 px-4">Total Est. Cost</th>
                                    <th className="py-4 px-4">Dish Usage</th>
                                    <th className="py-4 px-4">Master Stock Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs font-bold text-slate-700">
                                {consumptionData.rawSummaryList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                                            No ingredients consumed in this timeframe
                                        </td>
                                    </tr>
                                ) : (
                                    consumptionData.rawSummaryList.map((ing, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 font-black text-xs">
                                                        #{idx + 1}
                                                    </div>
                                                    <span className="font-black text-slate-900 text-sm">{ing.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="text-base font-black text-indigo-600">
                                                    {ing.totalQuantity % 1 === 0 ? ing.totalQuantity : ing.totalQuantity.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 uppercase text-slate-500 font-black">
                                                {ing.unit}
                                            </td>
                                            <td className="py-4 px-4 font-black text-emerald-600">
                                                LKR {ing.totalCost.toFixed(2)}
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-3 py-1 bg-slate-100 rounded-full text-slate-600 text-[11px] font-bold">
                                                    Used in {ing.usedInDishesCount} Dish(es)
                                                </span>
                                            </td>
                                            <td className="py-4 px-4">
                                                {ing.masterIngredient ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider",
                                                            ing.masterIngredient.stockQuantity >= ing.totalQuantity
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-rose-100 text-rose-700"
                                                        )}>
                                                            Stock: {ing.masterIngredient.stockQuantity} {ing.masterIngredient.unit}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 text-[11px] font-semibold italic">Not in Master Stock</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: ITEM-WISE INGREDIENT BREAKDOWN */}
            {activeTab === 'item' && (
                <div className="glass-card rounded-[2.5rem] border border-white p-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                            <Utensils className="h-5 w-5 text-primary" />
                            ITEM-WISE INGREDIENTS CONSUMPTION ({timeRange.toUpperCase()})
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">Selling items broken down by portion size with their exact ingredient consumption</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {consumptionData.itemList.length === 0 ? (
                            <div className="col-span-2 py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                                No items sold in this timeframe
                            </div>
                        ) : (
                            consumptionData.itemList.map((item) => {
                                const portionStyle = PORTION_COLORS[item.portionSize] || PORTION_COLORS['STANDARD'];
                                return (
                                    <div key={item.key} className="bg-slate-50/70 border border-slate-100 rounded-3xl p-6 space-y-4 hover:border-primary/20 transition-all">
                                        <div className="flex items-start justify-between gap-4 border-b border-slate-200/60 pb-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="text-lg font-black text-slate-900">{item.baseName}</h3>
                                                    <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black border uppercase", portionStyle.bg, portionStyle.text, portionStyle.border)}>
                                                        {item.portionSize}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-bold text-slate-400 mt-1">Category: {item.category}</p>
                                            </div>

                                            <div className="text-right">
                                                <span className="text-xs font-black text-slate-400 uppercase tracking-wider block">Units Sold</span>
                                                <span className="text-xl font-black text-indigo-600">{item.soldQty}</span>
                                            </div>
                                        </div>

                                        {/* Recipe Ingredients */}
                                        {item.ingredients.length === 0 ? (
                                            <div className="p-3 bg-amber-50/80 rounded-2xl text-amber-700 text-xs font-bold flex items-center gap-2">
                                                <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                                                No Estimation Recipe created for {item.baseName} ({item.portionSize})
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ingredients Consumed:</span>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {item.ingredients.map((ing, iIdx) => {
                                                        const ingTotalQty = ing.quantity * item.soldQty;
                                                        const ingTotalCost = ing.cost * item.soldQty;
                                                        return (
                                                            <div key={iIdx} className="bg-white p-3 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                                                                <div>
                                                                    <span className="font-black text-slate-800">{ing.name}</span>
                                                                    <span className="text-slate-400 font-semibold ml-2">({ing.quantity} {ing.unit} / portion)</span>
                                                                </div>
                                                                <div className="text-right flex items-center gap-4">
                                                                    <span className="font-black text-indigo-600">
                                                                        {ingTotalQty % 1 === 0 ? ingTotalQty : ingTotalQty.toFixed(2)} {ing.unit}
                                                                    </span>
                                                                    <span className="font-black text-emerald-600 text-[11px]">
                                                                        LKR {ingTotalCost.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* TAB 3: CATEGORY-WISE INGREDIENT BREAKDOWN */}
            {activeTab === 'category' && (
                <div className="glass-card rounded-[2.5rem] border border-white p-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                            <Layers className="h-5 w-5 text-primary" />
                            CATEGORY-WISE INGREDIENT BREAKDOWN ({timeRange.toUpperCase()})
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">Ingredients required grouped by menu dish categories</p>
                    </div>

                    <div className="space-y-6">
                        {consumptionData.categoryList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                                No sales recorded for categories in this timeframe
                            </div>
                        ) : (
                            consumptionData.categoryList.map((cat, cIdx) => (
                                <div key={cIdx} className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 space-y-4">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-primary/10 text-primary rounded-2xl font-black text-sm">
                                                #{cIdx + 1}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-900">{cat.categoryName}</h3>
                                                <p className="text-xs font-bold text-slate-400">{cat.totalDishQtySold} portions sold in category</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Est. Category Ingredient Cost</span>
                                            <span className="text-xl font-black text-emerald-600">LKR {cat.totalCategoryCost.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {Object.values(cat.ingredients).map((ing, iIdx) => (
                                            <div key={iIdx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                <div>
                                                    <h4 className="font-black text-slate-800 text-xs">{ing.name}</h4>
                                                    <span className="text-[11px] font-bold text-emerald-600">LKR {ing.cost.toFixed(2)}</span>
                                                </div>
                                                <span className="font-black text-indigo-600 text-sm">
                                                    {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)} <span className="text-xs uppercase">{ing.unit}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 4: PORTION-WISE INGREDIENT BREAKDOWN */}
            {activeTab === 'portion' && (
                <div className="glass-card rounded-[2.5rem] border border-white p-8 space-y-6">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                            <Tag className="h-5 w-5 text-primary" />
                            PORTION-WISE INGREDIENT BREAKDOWN ({timeRange.toUpperCase()})
                        </h2>
                        <p className="text-xs text-slate-400 font-medium">Ingredients required categorized by portion sizes (S, M, L, XL, Standard)</p>
                    </div>

                    <div className="space-y-6">
                        {consumptionData.portionList.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                                No sales recorded for portions in this timeframe
                            </div>
                        ) : (
                            consumptionData.portionList.map((port, pIdx) => {
                                const portionStyle = PORTION_COLORS[port.portionSize] || PORTION_COLORS['STANDARD'];
                                return (
                                    <div key={pIdx} className="bg-slate-50/80 border border-slate-100 rounded-3xl p-6 space-y-4">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-4">
                                            <div className="flex items-center gap-3">
                                                <span className={cn("px-4 py-2 rounded-2xl text-base font-black border uppercase", portionStyle.bg, portionStyle.text, portionStyle.border)}>
                                                    Portion Size: {port.portionSize}
                                                </span>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-500">{port.totalDishQtySold} portions sold in size ({port.portionSize})</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Est. Portion Cost</span>
                                                <span className="text-xl font-black text-emerald-600">LKR {port.totalPortionCost.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {Object.values(port.ingredients).map((ing, iIdx) => (
                                                <div key={iIdx} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                                                    <div>
                                                        <h4 className="font-black text-slate-800 text-xs">{ing.name}</h4>
                                                        <span className="text-[11px] font-bold text-emerald-600">LKR {ing.cost.toFixed(2)}</span>
                                                    </div>
                                                    <span className="font-black text-indigo-600 text-sm">
                                                        {ing.quantity % 1 === 0 ? ing.quantity : ing.quantity.toFixed(2)} <span className="text-xs uppercase">{ing.unit}</span>
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
