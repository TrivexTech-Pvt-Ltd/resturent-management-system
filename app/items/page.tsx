"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
    Search,
    Plus,
    Edit2,
    Trash2,
    Loader2,
    UtensilsCrossed,
    X,
    ArrowLeft,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/db";
import { MenuItem } from "@/lib/types";
import { menuItemSchema, MenuItemFormData } from "@/lib/schemas";
import Modal from "@/components/ui/Modal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/utils";

export default function ItemsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
    const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

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
        // Construct the payload with portions
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
            console.log(data, editingItem.id)
        } else {
            createMutation.mutate(payload as any);
        }
    };

    const confirmDelete = (item: MenuItem) => {
        setDeletingItem(item);
        setIsDeleteModalOpen(true);
    };

    const filteredItems = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Pagination Calculations
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when search changes
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-6 md:p-10">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-primary transition-colors text-sm font-bold gap-1 mb-2">
                            <ArrowLeft className="h-4 w-4" />
                            DASHBOARD
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic flex items-center gap-3">
                            <UtensilsCrossed className="text-primary h-8 w-8" />
                            MENU ITEMS
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage your professional restaurant catalog</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 flex items-center gap-2 w-fit active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Item
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-4 rounded-3xl mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by name or category..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-700 placeholder:text-slate-400 transition-all"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                {/* Items Table */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#F8FAFC]/50 border-b border-slate-100">
                                <tr>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Item Details</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Category</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Portions</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider">Price</th>
                                    <th className="p-6 font-bold text-slate-800 uppercase text-xs tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading Menu Library...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-4">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                                    <Search className="text-slate-300 h-8 w-8" />
                                                </div>
                                                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">No items match your search</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item) => (
                                        <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-slate-100 to-slate-200 flex items-center justify-center text-2xl shadow-inner overflow-hidden border-2 border-white">
                                                        {item.image ? (
                                                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UtensilsCrossed className="h-6 w-6 text-slate-300" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-slate-900 block text-lg">{item.name}</span>
                                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-tighter">ID: {item.id.slice(0, 8)}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-wider">
                                                    {item.category}
                                                </span>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex gap-1 flex-wrap">
                                                    {item.portions?.map((p, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200">
                                                            {p.size}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-6">
                                                <div className="flex flex-col gap-1">
                                                    {item.portions?.map((p, idx) => (
                                                        <div key={idx} className="flex items-baseline gap-1 text-sm">
                                                            <span className="text-slate-400 font-medium">{p.size}:</span>
                                                            <span className="font-black text-primary">{p.price.toFixed(2)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="w-10 h-10 cursor-pointer flex items-center justify-center bg-primary text-white hover:shadow-lg border border-primary rounded-xl transition-all hover:scale-110"
                                                        title="Edit Item"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(item)}
                                                        className="w-10 h-10 cursor-pointer flex items-center justify-center bg-red-400 text-white hover:shadow-lg border border-red-400 rounded-xl transition-all hover:scale-110"
                                                        title="Delete Item"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination UI */}
                    {filteredItems.length > 0 && (
                        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-sm font-bold text-slate-500">
                                Showing <span className="text-slate-900">{Math.min(filteredItems.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredItems.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900">{filteredItems.length}</span> items
                            </p>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={cn(
                                                "w-10 h-10 rounded-xl font-bold transition-all active:scale-95",
                                                currentPage === page
                                                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                                                    : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
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
    );
}
