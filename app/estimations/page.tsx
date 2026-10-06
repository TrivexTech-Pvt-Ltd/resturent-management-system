"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Calculator,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Printer,
  Sparkles,
  Utensils,
  Layers,
  Tag,
  DollarSign,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  Search,
  BookOpen,
  RefreshCw,
  FolderOpen,
  Loader2,
  X,
  Boxes,
  Edit2,
} from "lucide-react";
import { toast } from "react-hot-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  getMenu,
  getEstimations,
  createEstimation,
  updateEstimation,
  deleteEstimation,
  getMasterIngredients,
} from "@/lib/db";
import { MenuItem, IngredientItem, EstimationRecord, MasterIngredient } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = [
  "Fried Rice (Basmati)",
  "Fried Rice (Keeri Samba)",
  "Special Rice (Basmati)",
  "Pasta Special",
  "Cheese Pasta",
  "Kottu",
  "Cheese Kottu",
  "Dolphin Kottu",
  "Noodles",
  "Bites",
  "Beverages",
  "Tea/Coffee",
  "Desserts",
  "Rice & Curry",
  "Roti/Hoppers",
];

const UNITS = ["g", "kg", "ml", "l", "pcs", "tbsp", "tsp", "pack", "portion"];

const BLANK_INGREDIENTS: IngredientItem[] = [];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function EstimationsPage() {
  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: menuList = [], isLoading: isLoadingMenu } = useQuery({
    queryKey: ["menu"],
    queryFn: getMenu,
  });

  const { data: savedEstimations = [], isLoading: isLoadingEstimations } = useQuery({
    queryKey: ["estimations"],
    queryFn: getEstimations,
  });

  const { data: masterIngredients = [], isLoading: isLoadingMasterIng } = useQuery({
    queryKey: ["masterIngredients"],
    queryFn: getMasterIngredients,
  });

  // ── Estimation Mutations ───────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (payload: Omit<EstimationRecord, "id" | "createdAt" | "updatedAt">) =>
      createEstimation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      toast.success("Estimation saved to database!");
    },
    onError: () => toast.error("Failed to save estimation"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, record }: { id: string; record: EstimationRecord }) =>
      updateEstimation(id, record),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      toast.success("Estimation updated!");
      setEditingId(null);
    },
    onError: () => toast.error("Failed to update estimation"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEstimation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["estimations"] });
      toast.success("Estimation deleted");
    },
    onError: () => toast.error("Failed to delete estimation"),
  });

  // ── Form state ─────────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [customDishName, setCustomDishName] = useState("");
  const [selectedPortionSize, setSelectedPortionSize] = useState("");
  const [sellingPrice, setSellingPrice] = useState<number | "">(0);
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<IngredientItem[]>(BLANK_INGREDIENTS);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"calculator" | "history">("calculator");
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState("ALL");

  // ── Derived data ───────────────────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>(DEFAULT_CATEGORIES);
    menuList.forEach((m) => { if (m.category) cats.add(m.category); });
    return Array.from(cats).sort();
  }, [menuList]);

  const categoryItems = useMemo(() =>
    selectedCategory
      ? menuList.filter((m) => m.category.toLowerCase() === selectedCategory.toLowerCase())
      : [],
    [menuList, selectedCategory]
  );

  const selectedMenuItem = useMemo(() =>
    selectedItemId ? menuList.find((m) => m.id === selectedItemId) ?? null : null,
    [menuList, selectedItemId]
  );

  // ── Cost Calculation Helper ────────────────────────────────────────────────
  const calculateCost = useCallback(
    (masterIng: MasterIngredient, qty: number, unit: string) => {
      if (!masterIng || !qty || qty <= 0) return 0;

      let baseQty = qty;
      const mUnit = (masterIng.unit || "").toLowerCase();
      const cUnit = (unit || "").toLowerCase();

      if (cUnit === "g" && mUnit === "kg") baseQty = qty / 1000;
      else if (cUnit === "kg" && mUnit === "g") baseQty = qty * 1000;
      else if (cUnit === "ml" && mUnit === "l") baseQty = qty / 1000;
      else if (cUnit === "l" && mUnit === "ml") baseQty = qty * 1000;

      const stdQty = masterIng.standardQuantity > 0 ? masterIng.standardQuantity : 1;
      const pricePerUnit = masterIng.unitCost / stdQty;
      return Number((baseQty * pricePerUnit).toFixed(2));
    },
    []
  );

  // ── Calculation metrics ────────────────────────────────────────────────────
  const totalCost = useMemo(() =>
    ingredients.reduce((sum, item) => sum + (Number(item.cost) || 0), 0),
    [ingredients]
  );

  const numericSellingPrice = Number(sellingPrice) || 0;
  const grossProfit = numericSellingPrice - totalCost;
  const profitMargin = numericSellingPrice > 0 ? (grossProfit / numericSellingPrice) * 100 : 0;
  const foodCostPercentage = numericSellingPrice > 0 ? (totalCost / numericSellingPrice) * 100 : 0;

  const marginStatus = useMemo(() => {
    if (numericSellingPrice <= 0) return { label: "Price Not Set", color: "text-slate-400", bg: "bg-slate-100", border: "border-slate-200", icon: null };
    if (profitMargin >= 65) return { label: "High Margin (Excellent)", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: CheckCircle2 };
    if (profitMargin >= 40) return { label: "Healthy Margin (Good)", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200", icon: CheckCircle2 };
    if (profitMargin >= 15) return { label: "Low Margin (Tight)", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: AlertTriangle };
    return { label: "Unprofitable / Critical Loss", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: AlertTriangle };
  }, [profitMargin, numericSellingPrice]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedItemId("");
    setCustomDishName("");
    setSelectedPortionSize("");
    setSellingPrice(0);
  };

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    if (itemId === "CUSTOM") {
      setCustomDishName("");
      setSelectedPortionSize("Standard");
      setSellingPrice(0);
      return;
    }
    const item = menuList.find((m) => m.id === itemId);
    if (item) {
      setCustomDishName(item.name);
      if (item.portions?.length > 0) {
        setSelectedPortionSize(item.portions[0].size);
        setSellingPrice(item.portions[0].price || 0);
      } else {
        setSelectedPortionSize("Standard");
        setSellingPrice(0);
      }
    }
  };

  const handlePortionChange = (size: string) => {
    setSelectedPortionSize(size);
    if (selectedMenuItem?.portions) {
      const match = selectedMenuItem.portions.find(
        (p) => p.size.toUpperCase() === size.toUpperCase()
      );
      if (match) setSellingPrice(match.price);
    }
  };

  const handleAddIngredientRow = () =>
    setIngredients((prev) => [
      ...prev,
      { id: Date.now().toString(), name: "", quantity: 0, unit: "g", cost: 0, masterIngredientId: undefined },
    ]);

  const handleSelectMasterIngredient = (rowId: string, masterId: string) => {
    if (!masterId) {
      setIngredients((prev) =>
        prev.map((item) => (item.id === rowId ? { ...item, masterIngredientId: undefined, name: "" } : item))
      );
      return;
    }

    const masterIng = masterIngredients.find((m) => m.id === masterId);
    if (masterIng) {
      setIngredients((prev) =>
        prev.map((item) => {
          if (item.id !== rowId) return item;
          const qty = item.quantity > 0 ? item.quantity : masterIng.standardQuantity || 100;
          const unit = masterIng.unit || "g";
          const cost = calculateCost(masterIng, qty, unit);
          return {
            ...item,
            masterIngredientId: masterIng.id,
            name: masterIng.name,
            unit,
            quantity: qty,
            cost,
          };
        })
      );
    }
  };

  const handleUpdateIngredient = (id: string, field: keyof IngredientItem, value: any) => {
    setIngredients((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if ((field === "quantity" || field === "unit") && item.masterIngredientId) {
          const masterIng = masterIngredients.find((m) => m.id === item.masterIngredientId);
          if (masterIng) {
            updated.cost = calculateCost(masterIng, updated.quantity, updated.unit);
          }
        }
        return updated;
      })
    );
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSaveEstimation = () => {
    const dishName =
      selectedItemId === "CUSTOM" ? customDishName.trim() : selectedMenuItem?.name || customDishName.trim();

    if (!dishName) { toast.error("Please enter or select a dish name"); return; }
    if (!selectedCategory) { toast.error("Please select a category"); return; }
    if (!selectedPortionSize) { toast.error("Please select a portion size"); return; }
    if (ingredients.length === 0) { toast.error("Add at least one ingredient"); return; }

    const payload = {
      category: selectedCategory,
      itemId: selectedItemId === "CUSTOM" ? "CUSTOM" : (selectedItemId || "CUSTOM"),
      itemName: dishName,
      portionSize: selectedPortionSize,
      sellingPrice: numericSellingPrice,
      ingredients: ingredients.map((i) => ({ ...i })),
      totalCost,
      grossProfit,
      profitMargin,
      foodCostPercentage,
      notes: notes.trim(),
    };

    if (editingId) {
      const existing = savedEstimations.find((e) => e.id === editingId);
      updateMutation.mutate({
        id: editingId,
        record: {
          ...payload,
          id: editingId,
          createdAt: existing?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as EstimationRecord,
      });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const handleResetForm = () => {
    setSelectedCategory("");
    setSelectedItemId("");
    setCustomDishName("");
    setSelectedPortionSize("");
    setSellingPrice(0);
    setNotes("");
    setEditingId(null);
    setIngredients([]);
    toast.success("Form reset");
  };

  const handleLoadEstimation = (record: EstimationRecord) => {
    setEditingId(record.id);
    setSelectedCategory(record.category);
    setSelectedItemId(record.itemId || "CUSTOM");
    setCustomDishName(record.itemName);
    setSelectedPortionSize(record.portionSize);
    setSellingPrice(record.sellingPrice);
    setNotes(record.notes || "");
    setIngredients(record.ingredients.map((i) => ({ ...i })));
    setActiveTab("calculator");
    toast.success(`Loaded "${record.itemName}"`);
  };

  const handleExportPDF = () => {
    const dishName =
      selectedItemId === "CUSTOM"
        ? customDishName.trim()
        : selectedMenuItem?.name || customDishName.trim() || "Dish";
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(79, 70, 229);
    doc.text("NEXTSERVE – DISH COST ESTIMATION REPORT", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dish: ${dishName} | Portion: ${selectedPortionSize || "N/A"} | Category: ${selectedCategory || "General"}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 40, 182, 30, 3, 3, "F");

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(`COGS: ${totalCost.toFixed(2)}   |   Selling Price: ${numericSellingPrice.toFixed(2)}`, 20, 50);
    doc.text(`Gross Profit: ${grossProfit.toFixed(2)}   |   Margin: ${profitMargin.toFixed(1)}%   |   Food Cost: ${foodCostPercentage.toFixed(1)}%`, 20, 58);

    autoTable(doc, {
      startY: 78,
      head: [["#", "Ingredient", "Quantity & Unit", "Cost"]],
      body: ingredients.map((item, idx) => [
        idx + 1,
        item.name || "Unnamed",
        `${item.quantity} ${item.unit}`,
        Number(item.cost).toFixed(2),
      ]),
      headStyles: { fillColor: [79, 70, 229], fontSize: 10, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`${dishName.replace(/\s+/g, "_")}_Cost_Estimation.pdf`);
    toast.success("PDF downloaded!");
  };

  // ── Filtered History ───────────────────────────────────────────────────────
  const filteredHistory = useMemo(() =>
    savedEstimations.filter((rec) => {
      const q = historySearchQuery.toLowerCase();
      const matchSearch = !q ||
        rec.itemName.toLowerCase().includes(q) ||
        rec.category.toLowerCase().includes(q) ||
        rec.portionSize.toLowerCase().includes(q);
      const matchCat = historyCategoryFilter === "ALL" ||
        rec.category.toLowerCase() === historyCategoryFilter.toLowerCase();
      return matchSearch && matchCat;
    }),
    [savedEstimations, historySearchQuery, historyCategoryFilter]
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link href="/" className="inline-flex items-center text-slate-400 hover:text-indigo-600 transition-colors text-sm font-bold gap-1 mb-2">
              <ArrowLeft className="h-4 w-4" />
              DASHBOARD
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
              <Calculator className="text-indigo-600 h-9 w-9 not-italic" />
              DISH COST ESTIMATIONS
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Select category, dish &amp; portion — estimate ingredient costs, profit margins &amp; pricing.
            </p>
          </div>

          {/* Action Buttons & Tab Switcher */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/ingredients"
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Boxes className="h-4 w-4" />
              Stock &amp; Ingredients
              {masterIngredients.length > 0 && (
                <span className="ml-1 px-2 py-0.5 text-[10px] bg-emerald-600 text-white rounded-full font-black">
                  {masterIngredients.length}
                </span>
              )}
            </Link>

            <div className="flex items-center bg-slate-200/60 p-1.5 rounded-2xl border border-slate-200 self-start md:self-auto">
              <button
                onClick={() => setActiveTab("calculator")}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === "calculator" ? "bg-indigo-600 text-white shadow-md shadow-indigo-200" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <Sparkles className="h-4 w-4" /> Calculator
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={cn(
                  "px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer",
                  activeTab === "history" ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-slate-600 hover:text-slate-900"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Saved
                {savedEstimations.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 text-[10px] bg-indigo-500 text-white rounded-full font-black">
                    {savedEstimations.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ─── TAB: CALCULATOR ──────────────────────────────────────────────── */}
        {activeTab === "calculator" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

            {/* Left: Form */}
            <div className="lg:col-span-8 space-y-6">

              {/* STEP 1 — Select Dish & Portion */}
              <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border border-white space-y-6 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center not-italic text-sm font-black">1</span>
                    SELECT DISH &amp; PORTION
                  </h2>
                  {editingId && (
                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" /> Editing Saved Estimation
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Category */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Category *</label>
                    <div className="relative">
                      {isLoadingMenu ? (
                        <div className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2 text-slate-400 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                        </div>
                      ) : (
                        <select
                          value={selectedCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="">-- Select Category --</option>
                          {categories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      )}
                      <Layers className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Item */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Item / Dish *</label>
                    <div className="relative">
                      <select
                        value={selectedItemId}
                        onChange={(e) => handleItemChange(e.target.value)}
                        disabled={!selectedCategory || isLoadingMenu}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer disabled:opacity-50"
                      >
                        <option value="">
                          {!selectedCategory ? "Select Category First" : categoryItems.length === 0 ? "No items in DB for this category" : "-- Select Menu Item --"}
                        </option>
                        {categoryItems.map((item) => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                        <option value="CUSTOM">+ Enter Custom Dish Name</option>
                      </select>
                      <Utensils className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Portion */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Portion Size *</label>
                    <div className="relative">
                      {selectedMenuItem && selectedMenuItem.portions.length > 0 ? (
                        <select
                          value={selectedPortionSize}
                          onChange={(e) => handlePortionChange(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="">-- Select Portion --</option>
                          {selectedMenuItem.portions.map((p) => (
                            <option key={p.id || p.size} value={p.size}>
                              {p.size} — {Number(p.price).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="e.g. Medium, Large, Standard"
                          value={selectedPortionSize}
                          onChange={(e) => setSelectedPortionSize(e.target.value)}
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      )}
                      <Tag className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Custom dish name */}
                {selectedItemId === "CUSTOM" && (
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Custom Dish Name *</label>
                    <input
                      type="text"
                      placeholder="Enter custom dish or recipe name..."
                      value={customDishName}
                      onChange={(e) => setCustomDishName(e.target.value)}
                      className="w-full px-5 py-3.5 bg-indigo-50/50 border border-indigo-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                )}

                {/* Selling price */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Menu Selling Price / Portion</p>
                    <p className="text-xs text-slate-400 font-medium">Retail price charged to customers for this portion</p>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full sm:w-48 px-5 py-3 bg-slate-900 text-white font-black text-lg rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/20 text-right"
                  />
                </div>
              </div>

              {/* STEP 2 — Ingredients */}
              <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border border-white space-y-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h2 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                      <span className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center not-italic text-sm font-black">2</span>
                      INGREDIENTS &amp; COSTS
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-1">
                      Select ingredients from your{" "}
                      <Link href="/ingredients" className="text-emerald-600 font-bold hover:underline">Stock Inventory</Link>.
                      Stock is automatically deducted when an order is placed.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleAddIngredientRow}
                      disabled={masterIngredients.length === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-indigo-200 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="h-4 w-4" /> Add Ingredient Row
                    </button>
                  </div>
                </div>

                {/* Stock warning */}
                {masterIngredients.length === 0 && !isLoadingMasterIng && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-black text-amber-800">No stock ingredients found</p>
                      <p className="text-xs text-amber-700 font-medium mt-0.5">
                        Add ingredients to your{" "}
                        <Link href="/ingredients" className="underline font-bold">Stock & Ingredients</Link>{" "}
                        inventory first, then come back to link them here.
                      </p>
                    </div>
                  </div>
                )}

                {/* Ingredient Rows */}
                <div className="space-y-3">
                  {ingredients.length === 0 && masterIngredients.length > 0 && (
                    <div className="text-center py-8 text-slate-400">
                      <Boxes className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                      <p className="text-sm font-bold text-slate-500">No ingredients added yet</p>
                      <p className="text-xs">Click "Add Ingredient Row" to start linking stock ingredients to this dish.</p>
                    </div>
                  )}

                  {ingredients.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row items-stretch md:items-center gap-3 hover:bg-slate-50 transition-colors"
                    >
                      {/* Ingredient Selection Dropdown */}
                      <div className="flex-1 min-w-[200px]">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">#{index + 1} Select Ingredient from Stock</span>
                        <select
                          value={item.masterIngredientId || ""}
                          onChange={(e) => handleSelectMasterIngredient(item.id, e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
                        >
                          <option value="">-- Select from Stock Inventory --</option>
                          {masterIngredients.map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.stockQuantity} {m.unit} in stock | {m.unitCost}/{m.standardQuantity}{m.unit}
                            </option>
                          ))}
                        </select>
                        {!item.masterIngredientId && (
                          <p className="text-[10px] text-amber-600 mt-0.5 font-medium">⚠ Select a stock ingredient to auto-calculate cost and enable stock deduction.</p>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="w-full md:w-28">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Quantity Used</span>
                        <input
                          type="number"
                          step="any"
                          placeholder="Qty"
                          value={item.quantity || ""}
                          onChange={(e) => handleUpdateIngredient(item.id, "quantity", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </div>

                      {/* Unit */}
                      <div className="w-full md:w-24">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Unit</span>
                        <select
                          value={item.unit}
                          onChange={(e) => handleUpdateIngredient(item.id, "unit", e.target.value)}
                          className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-800 outline-none cursor-pointer"
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>

                      {/* Cost Amount */}
                      <div className="w-full md:w-36">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Cost Amount</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={item.cost || ""}
                          onChange={(e) => handleUpdateIngredient(item.id, "cost", parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 bg-white border border-indigo-200 rounded-xl font-black text-sm text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-500/20 text-right"
                        />
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveIngredient(item.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer self-end md:self-auto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* COGS Total */}
                {ingredients.length > 0 && (
                  <div className="p-5 bg-indigo-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white/10 rounded-xl">
                        <PieChart className="h-6 w-6 text-indigo-300" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">TOTAL INGREDIENT COST (COGS)</span>
                        <p className="text-xs text-indigo-200 font-medium">{ingredients.length} ingredient(s) summed</p>
                      </div>
                    </div>
                    <span className="text-3xl font-black text-white">{totalCost.toFixed(2)}</span>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider">Notes / Remarks</label>
                  <textarea
                    rows={2}
                    placeholder="Optional chef notes, cooking loss, packaging instructions..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSaveEstimation}
                    disabled={isSaving}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-black py-4 px-6 rounded-2xl transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer active:scale-95"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {editingId ? "Update Estimation" : "Save to Database"}
                  </button>
                  <button
                    type="button"
                    onClick={handleExportPDF}
                    className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 px-6 rounded-2xl border border-slate-200 transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-xs cursor-pointer active:scale-95"
                  >
                    <Printer className="h-4 w-4 text-indigo-600" /> Export PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleResetForm}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold py-4 px-5 rounded-2xl transition-all uppercase tracking-widest text-xs cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Profitability Panel */}
            <div className="lg:col-span-4 space-y-6 sticky top-6">
              <div className="glass-card p-6 sm:p-8 rounded-[2.5rem] border border-white space-y-6 shadow-sm">
                <h3 className="text-lg font-black text-slate-900 italic uppercase flex items-center gap-2 border-b border-slate-100 pb-4">
                  <PieChart className="text-indigo-600 h-5 w-5 not-italic" /> PROFITABILITY
                </h3>

                {/* Health Badge */}
                <div className={cn("p-4 rounded-2xl border flex items-center gap-3", marginStatus.bg, marginStatus.border)}>
                  {marginStatus.icon && <marginStatus.icon className={cn("h-5 w-5 shrink-0", marginStatus.color)} />}
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Margin Health</span>
                    <span className={cn("text-xs font-black uppercase", marginStatus.color)}>{marginStatus.label}</span>
                  </div>
                </div>

                {/* Metrics */}
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Ingredient COGS</span>
                      <span className="text-sm font-bold text-slate-600">Cost of Goods Sold</span>
                    </div>
                    <span className="text-xl font-black text-slate-900">{totalCost.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-slate-400 uppercase block">Selling Price</span>
                      <span className="text-sm font-bold text-slate-600">Retail / Menu Price</span>
                    </div>
                    <span className="text-xl font-black text-indigo-600">{numericSellingPrice.toFixed(2)}</span>
                  </div>
                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black text-emerald-700 uppercase block">Gross Profit</span>
                      <span className="text-sm font-bold text-emerald-800">Net Return</span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700">{grossProfit.toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-center">
                      <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest block">MARGIN</span>
                      <span className="text-2xl font-black text-indigo-800">{profitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 text-center">
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block">FOOD COST</span>
                      <span className="text-2xl font-black text-amber-800">{foodCostPercentage.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Stock quick-view */}
                {ingredients.some((i) => i.masterIngredientId) && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Boxes className="h-3.5 w-3.5" /> Stock Deduction Preview
                    </p>
                    <div className="space-y-1">
                      {ingredients
                        .filter((i) => i.masterIngredientId)
                        .map((i) => {
                          const stock = masterIngredients.find((m) => m.id === i.masterIngredientId);
                          return (
                            <div key={i.id} className="flex items-center justify-between text-xs font-medium text-emerald-800">
                              <span className="truncate">{i.name}</span>
                              <span className="font-black ml-2 shrink-0">−{i.quantity} {i.unit}</span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB: SAVED HISTORY ───────────────────────────────────────────── */}
        {activeTab === "history" && (
          <div className="space-y-6">
            {/* Filter Bar */}
            <div className="glass-card p-5 rounded-[2.5rem] border border-white flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by dish, category or portion..."
                  value={historySearchQuery}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {historySearchQuery && (
                  <button onClick={() => setHistorySearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <select
                value={historyCategoryFilter}
                onChange={(e) => setHistoryCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* List */}
            {isLoadingEstimations ? (
              <div className="glass-card p-16 rounded-[2.5rem] border border-white flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 text-indigo-500 animate-spin" />
                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading from database…</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="glass-card p-16 rounded-[2.5rem] border border-white text-center space-y-4">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto">
                  <BookOpen className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">No Estimations Found</h3>
                <p className="text-slate-400 text-sm max-w-md mx-auto font-medium">
                  {savedEstimations.length === 0
                    ? "No saved estimations yet. Use the calculator to build your first dish cost analysis and save it."
                    : "No estimations match your search criteria."}
                </p>
                {savedEstimations.length === 0 && (
                  <button
                    onClick={() => setActiveTab("calculator")}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md shadow-indigo-200 cursor-pointer"
                  >
                    Open Calculator
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredHistory.map((record) => (
                  <div
                    key={record.id}
                    className="glass-card p-6 rounded-[2rem] border border-white space-y-4 hover:shadow-xl transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                            {record.category}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 leading-tight">{record.itemName}</h3>
                        </div>
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-black border border-slate-200 shrink-0">
                          {record.portionSize}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">COGS</span>
                          <span className="font-black text-slate-900">{Number(record.totalCost).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Selling Price</span>
                          <span className="font-black text-indigo-600">{Number(record.sellingPrice).toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Profit Margin</span>
                          <span className={cn("font-black", record.profitMargin >= 50 ? "text-emerald-600" : "text-amber-600")}>
                            {Number(record.profitMargin).toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold uppercase block">Ingredients</span>
                          <span className="font-bold text-slate-700">{record.ingredients.length} items</span>
                        </div>
                      </div>

                      {record.notes && (
                        <p className="text-xs text-slate-500 italic line-clamp-2">"{record.notes}"</p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400 font-bold">
                        {new Date(record.updatedAt).toLocaleDateString()}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleLoadEstimation(record)}
                          className="px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Edit2 className="h-3 w-3" /> Load &amp; Edit
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(record.id)}
                          disabled={deleteMutation.isPending}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer disabled:opacity-50"
                        >
                          {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
