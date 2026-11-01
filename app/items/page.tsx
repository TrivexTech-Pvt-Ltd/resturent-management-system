"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import AppLayout from "@/components/AppLayout";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    UtensilsCrossed,
    LayoutGrid,
    ArrowUpDown,
    ChevronDown,
    ChevronRight,
    Home,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/db";
import { MenuItem } from "@/lib/types";
import { menuItemSchema, MenuItemFormData } from "@/lib/schemas";
import Pagination from "@/components/ui/Pagination";
import Modal from "@/components/ui/Modal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/utils";


export default function ItemsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortOption, setSortOption] = useState("name-asc");

    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);

    // React Hook Form
    const {
        register,
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<MenuItemFormData>({
        resolver: zodResolver(menuItemSchema),
        defaultValues: {
            portions: [{ size: "", price: 0 }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "portions",
    });

    // Queries
    const { data: items = [], isLoading } = useQuery({
        queryKey: ["menu"],
        queryFn: getMenu,
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: addMenuItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Item added successfully");
            closeFormModal();
        },
        onError: () => {
            toast.error("Failed to add item");
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: MenuItem }) => updateMenuItem(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Item updated successfully");
            closeFormModal();
        },
        onError: () => {
            toast.error("Failed to update item");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteMenuItem(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["menu"] });
            toast.success("Item deleted successfully");
            setIsDeleteModalOpen(false);
            setDeletingItem(null);
        },
        onError: () => {
            toast.error("Failed to delete item");
        }
    });

    // Handlers
    const openAddModal = () => {
        setEditingItem(null);
        reset({
            name: "",
            category: "",
            image: "",
            portions: [{ size: "", price: 0 }]
        });
        setIsFormModalOpen(true);
    };

    const openEditModal = (item: MenuItem) => {
        setEditingItem(item);
        reset({
            name: item.name,
            category: item.category,
            image: item.image || "",
            portions: item.portions.map(p => ({ id: p.id, size: p.size, price: p.price }))
        });
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingItem(null);
        reset();
    };

    const onSubmit = (data: MenuItemFormData) => {
        const payload = {
            name: data.name,
            category: data.category,
            image: data.image,
            portions: data.portions?.map(p => ({
                id: p.id,
                size: p.size,
                price: p.price,
                MenuItemId: editingItem?.id || ""
            })) || []
        };
        if (editingItem) {
            updateMutation.mutate({
                id: editingItem.id,
                data: {
                    id: editingItem.id,
                    ...payload
                } as any
            });
        } else {
            createMutation.mutate(payload as any);
        }
    };

    const confirmDelete = (item: MenuItem) => {
        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    // Extract unique categories
    const categories = useMemo(() => {
        const set = new Set<string>();
        items.forEach(item => {
            if (item.category) set.add(item.category);
        });
        return Array.from(set).sort();
    }, [items]);

    // Filter and sort items
    const filteredItems = useMemo(() => {
        return items
            .filter(item => {
                const matchesSearch =
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.id.toLowerCase().includes(searchQuery.toLowerCase());

                const matchesCategory =
                    selectedCategory === "all" ||
                    item.category.toLowerCase() === selectedCategory.toLowerCase();

                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                if (sortOption === "name-asc") {
                    return a.name.localeCompare(b.name);
                }
                if (sortOption === "name-desc") {
                    return b.name.localeCompare(a.name);
                }
                if (sortOption === "price-asc") {
                    const minA = Math.min(...(a.portions?.map(p => p.price) || [0]));
                    const minB = Math.min(...(b.portions?.map(p => p.price) || [0]));
                    return minA - minB;
                }
                if (sortOption === "price-desc") {
                    const maxA = Math.max(...(a.portions?.map(p => p.price) || [0]));
                    const maxB = Math.max(...(b.portions?.map(p => p.price) || [0]));
                    return maxB - maxA;
                }
                return 0;
            });
    }, [items, searchQuery, selectedCategory, sortOption]);

    // Pagination Calculations
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <AppLayout>
            <div className="min-h-[calc(100vh-64px)] p-6 md:p-8 bg-transparent">
                <div className="max-w-[1400px] mx-auto">
                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
                        <Link href="/" className="hover:text-indigo-600 transition-colors">
                            <Home className="h-3.5 w-3.5" />
                        </Link>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <span className="text-slate-500">Dashboard</span>
                        <ChevronRight className="h-3 w-3 text-slate-300" />
                        <span className="text-slate-600 font-bold">Menu Items</span>
                    </div>

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center text-indigo-600 shadow-xs">
                                <UtensilsCrossed className="h-6 w-6" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight italic uppercase">
                                    <span className="text-black">MENU</span>{" "}
                                    <span className="text-blue-600">ITEMS</span>
                                </h1>
                                <p className="text-xs md:text-sm font-semibold text-slate-400 mt-0.5">
                                    Manage your professional restaurant catalog
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={openAddModal}
                            className="bg-[#4338CA] hover:bg-[#3730A3] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 w-fit active:scale-95 cursor-pointer text-sm"
                        >
                            <Plus className="h-4 w-4" />
                            Add New Item
                        </button>
                    </div>

                    {/* Search and Filters Bar */}
                    <div className="bg-white rounded-2xl p-2.5 border border-slate-100 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mb-6">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by item name or category..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50/70 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Filter & Sort Controls */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Category Filter */}
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="appearance-none bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs transition-all"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>
                                            {cat}
                                        </option>
                                    ))}
                                </select>
                                <LayoutGrid className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>



                            {/* Sort Option */}
                            <div className="relative">
                                <select
                                    value={sortOption}
                                    onChange={(e) => {
                                        setSortOption(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="appearance-none bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl pl-8 pr-8 py-2 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-2xs transition-all"
                                >
                                    <option value="name-asc">Name (A - Z)</option>
                                    <option value="name-desc">Name (Z - A)</option>
                                    <option value="price-asc">Price (Low to High)</option>
                                    <option value="price-desc">Price (High to Low)</option>
                                </select>
                                <ArrowUpDown className="h-3.5 w-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Items Table Card */}
                    <div className="bg-white rounded-2xl shadow-xs border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-slate-100/80 border-b border-slate-200/80">
                                    <tr>
                                        <th className="w-14 px-5 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">#</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Item Details</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Category</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Portions</th>
                                        <th className="px-4 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider">Price (Rs.)</th>
                                        <th className="px-6 py-3.5 text-xs font-bold text-slate-700 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                                                    <span className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Menu Items...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-20 text-center">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
                                                        <Search className="text-slate-300 h-6 w-6" />
                                                    </div>
                                                    <span className="text-slate-400 font-bold text-xs">No items match your criteria</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item, index) => {
                                            const itemNumber = String((currentPage - 1) * itemsPerPage + index + 1).padStart(2, "0");

                                            return (
                                                <tr
                                                    key={item.id}
                                                    className="border-b border-slate-50/80 hover:bg-slate-50/50 transition-colors group"
                                                >
                                                    {/* # Column */}
                                                    <td className="px-5 py-4 text-xs font-semibold text-slate-400">
                                                        {itemNumber}
                                                    </td>

                                                    {/* Item Details */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 shadow-2xs shrink-0 flex items-center justify-center">
                                                                {item.image ? (
                                                                    <img
                                                                        src={item.image}
                                                                        alt={item.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full bg-linear-to-br from-indigo-50 to-slate-100 flex items-center justify-center text-indigo-400">
                                                                        <UtensilsCrossed className="h-5 w-5 opacity-60" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <span className="font-bold text-slate-900 block text-sm tracking-tight truncate max-w-[220px]">
                                                                    {item.name}
                                                                </span>
                                                                <span className="text-[11px] font-semibold text-slate-400 tracking-wider">
                                                                    ID: {item.id.slice(0, 8).toUpperCase()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Category */}
                                                    <td className="px-4 py-4">
                                                        <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200/70">
                                                            {item.category}
                                                        </span>
                                                    </td>

                                                    {/* Portions */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            {item.portions && item.portions.length > 0 ? (
                                                                item.portions.map((p, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-slate-50 border border-slate-200/80 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs"
                                                                    >
                                                                        {p.size}
                                                                    </span>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-slate-400">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Price (Rs.) */}
                                                    <td className="px-4 py-4">
                                                        <div className="flex flex-col gap-1">
                                                            {item.portions && item.portions.length > 0 ? (
                                                                item.portions.map((p, idx) => (
                                                                    <div key={idx} className="flex items-center gap-3">
                                                                        <span className="text-slate-400 font-semibold text-xs w-5 text-left">
                                                                            {p.size}
                                                                        </span>
                                                                        <span className="font-bold text-slate-800 text-sm tracking-tight">
                                                                            {p.price.toLocaleString("en-US", {
                                                                                minimumFractionDigits: 2,
                                                                                maximumFractionDigits: 2,
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <span className="text-xs text-slate-400">-</span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Actions */}
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => openEditModal(item)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50/80 hover:bg-indigo-100 text-indigo-600 border border-indigo-100/80 font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-2xs"
                                                                title="Edit Item"
                                                            >
                                                                <Edit2 className="h-3.5 w-3.5" />
                                                                <span>Edit</span>
                                                            </button>
                                                            <button
                                                                onClick={() => confirmDelete(item)}
                                                                className="p-2 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-500 border border-rose-100/80 transition-all active:scale-95 cursor-pointer shadow-2xs flex items-center justify-center"
                                                                title="Delete Item"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination UI */}
                        {filteredItems.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filteredItems.length}
                                itemsPerPage={itemsPerPage}
                                onPageChange={setCurrentPage}
                                onItemsPerPageChange={setItemsPerPage}
                                pageSizeOptions={[5, 8, 10, 20, 50, 100]}
                                itemName="menu items"
                            />
                        )}
                    </div>
                </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={closeFormModal}
                title={editingItem ? "Update Item" : "Add Item"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Item Name</label>
                        <input
                            {...register("name")}
                            className={cn(
                                "w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800",
                                errors.name && "border-red-500 bg-red-50"
                            )}
                            placeholder="Enter Item Name"
                        />
                        {errors.name && <p className="mt-1 text-xs font-bold text-red-500">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                        <select
                            {...register("category")}
                            className={cn(
                                "w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800",
                                errors.category && "border-red-500 bg-red-50"
                            )}
                        >
                            <option value="">Select Category</option>
                            <option value="Fried Rice (Basmati)">Fried Rice (Basmati)</option>
                            <option value="Fried Rice (Keeri Samba)">Fried Rice (Keeri Samba)</option>
                            <option value="Special Rice (Basmati)">Special Rice (Basmati)</option>
                            <option value="Pasta Special">Pasta Special</option>
                            <option value="Cheese Pasta">Cheese Pasta</option>
                            <option value="Kottu">Kottu</option>
                            <option value="Cheese Kottu">Cheese Kottu</option>
                            <option value="Dolphin Kottu">Dolphin Kottu</option>
                            <option value="Dolphin Kottu - Cheese">Dolphin Kottu - Cheese</option>
                            <option value="Noodles">Noodles</option>
                            <option value="Bites">Bites</option>
                            <option value="Beverages">Beverages</option>
                            <option value="Tea/Coffee">Tea/Coffee</option>
                            <option value="Desserts">Desserts</option>
                            <option value="Rice & Curry">Rice & Curry</option>
                            <option value="Roti/Hoppers">Roti/Hoppers</option>
                        </select>
                        {errors.category && <p className="mt-1 text-xs font-bold text-red-500">{errors.category.message}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Portions & Pricing</label>
                        <div className="space-y-3">
                            {(() => {
                                // Watch all portion sizes to prevent duplicates - moved outside map
                                const watchedPortions = useWatch({ control, name: "portions" });

                                return fields.map((field, index) => {
                                    const selectedSizes = watchedPortions
                                        ?.map((p, idx) => idx !== index ? p?.size : null)
                                        .filter(Boolean) || [];

                                    return (
                                        <div key={field.id} className="flex gap-3 items-start">
                                            <input type="hidden" {...register(`portions.${index}.id` as const)} />
                                            <div className="flex-1">
                                                <select
                                                    {...register(`portions.${index}.size` as const)}
                                                    className={cn(
                                                        "w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800 text-sm",
                                                        errors.portions?.[index]?.size && "border-red-500 bg-red-50"
                                                    )}
                                                >
                                                    <option value="">Select Size</option>
                                                    {!selectedSizes.includes("M") && <option value="M">Medium</option>}
                                                    {!selectedSizes.includes("L") && <option value="L">Large</option>}
                                                    {!selectedSizes.includes("XL") && <option value="XL">Extra Large</option>}
                                                </select>
                                                {errors.portions?.[index]?.size && (
                                                    <p className="mt-1 text-xs font-bold text-red-500">{errors.portions[index]?.size?.message}</p>
                                                )}
                                            </div>
                                            <div className="flex-1 relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300"></span>
                                                <input
                                                    {...register(`portions.${index}.price` as const, { valueAsNumber: true })}
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    className={cn(
                                                        "w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-black text-slate-800 text-sm",
                                                        errors.portions?.[index]?.price && "border-red-500 bg-red-50"
                                                    )}
                                                />
                                                {errors.portions?.[index]?.price && (
                                                    <p className="mt-1 text-xs font-bold text-red-500">{errors.portions[index]?.price?.message}</p>
                                                )}
                                            </div>
                                            {fields.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => remove(index)}
                                                    className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                        {errors.portions && typeof errors.portions.message === 'string' && (
                            <p className="mt-2 text-xs font-bold text-red-500">{errors.portions.message}</p>
                        )}
                        <button
                            type="button"
                            onClick={() => append({ size: "", price: 0 })}
                            disabled={fields.length >= 3}
                            className={cn(
                                "mt-3 text-xs font-bold flex items-center gap-1 uppercase tracking-wider transition-all",
                                fields.length >= 3
                                    ? "text-slate-300 cursor-not-allowed"
                                    : "text-primary hover:text-primary/80"
                            )}
                        >
                            <Plus className="h-4 w-4" />
                            Add Portion Variant {fields.length >= 3 && "(Max Reached)"}
                        </button>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={closeFormModal}
                            className="flex-1 cursor-pointer px-6 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all uppercase text-xs tracking-[0.2em]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-2 cursor-pointer bg-primary text-white font-black rounded-2xl py-4 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center uppercase text-xs tracking-[0.2em] disabled:opacity-50"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                editingItem ? "Update Item" : "Add Item"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => deletingItem && deleteMutation.mutate(deletingItem.id)}
                title="Delete Item"
                description={`This will permanently delete "${deletingItem?.name}" from the database. This action cannot be undone.`}
                isLoading={deleteMutation.isPending}
            />
        </div>
        </AppLayout>
    );
}
