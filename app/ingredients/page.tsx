"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Boxes,
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  PackagePlus,
  DollarSign,
  Layers,
  X,
  Loader2,
  TrendingDown,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getMasterIngredients,
  createMasterIngredient,
  updateMasterIngredient,
  deleteMasterIngredient,
} from "@/lib/db";
import { MasterIngredient } from "@/lib/types";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "All Categories",
  "Grains & Flour",
  "Meat & Seafood",
  "Dairy & Eggs",
  "Vegetables & Produce",
  "Spices & Seasonings",
  "Oils & Sauces",
  "Beverages",
  "Packaging",
  "Other",
];

const UNITS = ["kg", "g", "l", "ml", "pcs", "pack", "portion", "tbsp", "tsp"];

export default function IngredientsPage() {
  const queryClient = useQueryClient();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ["masterIngredients"],
    queryFn: getMasterIngredients,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: createMasterIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masterIngredients"] });
      toast.success("Ingredient added to stock successfully!");
      closeModal();
    },
    onError: (err: any) => toast.error("Failed to save: " + (err.message || "")),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ingredient }: { id: string; ingredient: Partial<MasterIngredient> }) =>
      updateMasterIngredient(id, ingredient),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masterIngredients"] });
      toast.success("Stock ingredient updated!");
      closeModal();
    },
    onError: (err: any) => toast.error("Failed to update: " + (err.message || "")),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMasterIngredient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["masterIngredients"] });
      toast.success("Ingredient deleted from inventory!");
    },
    onError: () => toast.error("Failed to delete ingredient"),
  });

  // ── Filter State ───────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK">("ALL");

  // ── Modal / Form State ─────────────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState<number | "">(100);
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState<number | "">(0);
  const [category, setCategory] = useState("Grains & Flour");

  // Quick Restock state
  const [quickRestockItem, setQuickRestockItem] = useState<MasterIngredient | null>(null);
  const [addQty, setAddQty] = useState<number | "">(10);

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setQuantity(100);
    setUnit("kg");
    setPrice(0);
    setCategory("Grains & Flour");
  };

  const openModal = (item?: MasterIngredient) => {
    if (item) {
      setEditingId(item.id);
      setName(item.name);
      setQuantity(item.stockQuantity ?? 0);
      setUnit(item.unit || "kg");
      setPrice(item.unitCost ?? 0);
      setCategory(item.category || "Grains & Flour");
    } else {
      resetForm();
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please enter ingredient name");
      return;
    }

    const payload = {
      name: name.trim(),
      standardQuantity: 1,       // reference unit for costing
      unitCost: Number(price) || 0,
      stockQuantity: Number(quantity) || 0,  // actual stock on hand
      unit,
      category: category.trim() || undefined,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ingredient: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleQuickRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickRestockItem) return;
    const addVal = Number(addQty) || 0;
    if (addVal === 0) return;

    const newQty = Math.max(0, Number(quickRestockItem.stockQuantity || 0) + addVal);
    updateMutation.mutate(
      {
        id: quickRestockItem.id,
        ingredient: {
          name: quickRestockItem.name,
          unit: quickRestockItem.unit,
          unitCost: quickRestockItem.unitCost,
          category: quickRestockItem.category,
          stockQuantity: newQty,
        },
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${quickRestockItem.name} stock to ${newQty} ${quickRestockItem.unit}`);
          setQuickRestockItem(null);
        },
      }
    );
  };

  // ── Derived Data ───────────────────────────────────────────────────────────
  const filteredIngredients = useMemo(() => {
    return ingredients.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat =
        selectedCategoryFilter === "All Categories" ||
        (item.category && item.category.toLowerCase() === selectedCategoryFilter.toLowerCase());

      const qty = item.stockQuantity ?? 0;
      let matchesStatus = true;
      if (statusFilter === "OUT_OF_STOCK") matchesStatus = qty <= 0;
      else if (statusFilter === "LOW_STOCK") matchesStatus = qty > 0 && qty <= 10;
      else if (statusFilter === "IN_STOCK") matchesStatus = qty > 10;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [ingredients, searchQuery, selectedCategoryFilter, statusFilter]);

  const stats = useMemo(() => {
    const totalItems = ingredients.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalValuation = 0;

    ingredients.forEach((item) => {
      const q = item.stockQuantity ?? 0;
      const c = item.unitCost ?? 0;
      totalValuation += q * c;
      if (q <= 0) outOfStockCount++;
      else if (q <= 10) lowStockCount++;
    });

    return { totalItems, lowStockCount, outOfStockCount, totalValuation };
  }, [ingredients]);

  const getStatusBadge = (qty: number) => {
    if (qty <= 0) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
          <XCircle className="h-3.5 w-3.5" /> Out of Stock
        </span>
      );
    }
    if (qty <= 10) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1 w-fit">
          <AlertTriangle className="h-3.5 w-3.5" /> Low Stock ({qty})
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3.5 w-3.5" /> In Stock ({qty})
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="inline-flex items-center text-slate-400 hover:text-indigo-600 transition-colors text-sm font-bold gap-1 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              DASHBOARD
            </Link>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3 italic uppercase">
              <Boxes className="text-emerald-600 h-9 w-9 not-italic" />
              STOCK &amp; INGREDIENT INVENTORY
            </h1>
            <p className="text-slate-500 font-medium text-sm mt-1">
              Manage ingredient stock levels, unit prices, and auto-deduct usage upon order completion.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/estimations"
              className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 px-4 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            >
              <Layers className="h-4 w-4" />
              Dish Estimations
            </Link>
            <button
              onClick={() => openModal()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="h-4.5 w-4.5" />
              Add Stock Ingredient
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Stock Items</p>
              <h3 className="text-3xl font-black text-slate-900 mt-1">{stats.totalItems}</h3>
            </div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold">
              <Boxes className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Low Stock Warnings</p>
              <h3 className="text-3xl font-black text-amber-600 mt-1">{stats.lowStockCount}</h3>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Out of Stock</p>
              <h3 className="text-3xl font-black text-red-600 mt-1">{stats.outOfStockCount}</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center font-bold">
              <XCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-wider">Total Stock Value</p>
              <h3 className="text-3xl font-black text-emerald-700 mt-1">
                LKR {stats.totalValuation.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4 md:space-y-0 md:flex md:items-center md:justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ingredient by name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Category dropdown filter */}
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 outline-none cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  statusFilter === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("IN_STOCK")}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  statusFilter === "IN_STOCK" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                In Stock
              </button>
              <button
                onClick={() => setStatusFilter("LOW_STOCK")}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  statusFilter === "LOW_STOCK" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Low
              </button>
              <button
                onClick={() => setStatusFilter("OUT_OF_STOCK")}
                className={cn(
                  "px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all",
                  statusFilter === "OUT_OF_STOCK" ? "bg-red-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Out
              </button>
            </div>
          </div>
        </div>

        {/* Ingredients Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-emerald-600" />
              <p className="font-bold text-sm">Loading stock inventory...</p>
            </div>
          ) : filteredIngredients.length === 0 ? (
            <div className="p-16 text-center text-slate-400 space-y-3">
              <Boxes className="h-12 w-12 mx-auto text-slate-300" />
              <p className="font-bold text-base text-slate-700">No stock ingredients found</p>
              <p className="text-xs text-slate-400">Add ingredients or adjust your filters above.</p>
              <button
                onClick={() => openModal()}
                className="mt-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold uppercase inline-flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add First Ingredient
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Ingredient Name</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Current Stock Quantity</th>
                    <th className="py-4 px-6">Unit Price</th>
                    <th className="py-4 px-6">Total Value</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium">
                  {filteredIngredients.map((item) => {
                    const qty = item.stockQuantity ?? 0;
                    const price = item.unitCost ?? 0;
                    const totalVal = qty * price;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-900 text-base">{item.name}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold">
                            {item.category || "General"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-lg">
                              {item.stockQuantity ?? 0} <span className="text-xs font-bold text-slate-400 uppercase">{item.unit}</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700">
                          {price.toFixed(2)} / {item.unit}
                        </td>
                        <td className="py-4 px-6 font-black text-slate-900">
                          LKR {totalVal.toFixed(2)}
                        </td>
                        <td className="py-4 px-6">{getStatusBadge(qty)}</td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setQuickRestockItem(item);
                                setAddQty(10);
                              }}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs flex items-center gap-1 border border-emerald-200 cursor-pointer active:scale-95"
                              title="Quickly adjust or restock quantity"
                            >
                              <PackagePlus className="h-3.5 w-3.5" /> + Stock
                            </button>

                            <button
                              onClick={() => openModal(item)}
                              className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-xl transition-colors cursor-pointer"
                              title="Edit ingredient"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
                                  deleteMutation.mutate(item.id);
                                }
                              }}
                              className="p-2 hover:bg-red-50 text-red-600 rounded-xl transition-colors cursor-pointer"
                              title="Delete ingredient"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-white space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-black text-slate-900 italic uppercase flex items-center gap-2">
                <Boxes className="text-emerald-600 h-6 w-6 not-italic" />
                {editingId ? "Edit Stock Ingredient" : "Add Stock Ingredient"}
              </h3>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                  Ingredient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Chicken Breast, Cooking Oil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="e.g. 50"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                    Measurement Unit *
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none cursor-pointer"
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                    Price / Unit Cost (LKR) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm text-slate-800 outline-none cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-2xl font-bold text-xs uppercase text-slate-500 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PackagePlus className="h-4 w-4" />
                  )}
                  Save Stock Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── QUICK RESTOCK MODAL ────────────────────────────────────────────── */}
      {quickRestockItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-white space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-lg font-black text-slate-900">Restock {quickRestockItem.name}</h4>
                <p className="text-xs text-slate-400 font-medium">
                  Current Stock: {quickRestockItem.stockQuantity ?? 0} {quickRestockItem.unit}
                </p>
              </div>
              <button onClick={() => setQuickRestockItem(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickRestockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                  Add / Deduct Quantity ({quickRestockItem.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="Enter quantity to add (+10) or deduct (-5)"
                  value={addQty}
                  onChange={(e) => setAddQty(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1 font-medium">
                  New stock total will be:{" "}
                  <span className="font-bold text-slate-900">
                    {Math.max(0, Number(quickRestockItem.stockQuantity || 0) + (Number(addQty) || 0))}{" "}
                    {quickRestockItem.unit}
                  </span>
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setQuickRestockItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md shadow-emerald-200"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
