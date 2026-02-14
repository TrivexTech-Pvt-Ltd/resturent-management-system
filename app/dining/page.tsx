"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
    Search,
    Plus, Trash2,
    Loader2,
    UtensilsCrossed,
    ArrowLeft,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { z } from "zod";

import { api } from "@/lib/api";
import Modal from "@/components/ui/Modal";
import DeleteConfirmModal from "@/components/ui/DeleteConfirmModal";
import { cn } from "@/lib/utils";

// Types
interface DiningTable {
    id: string;
    tableNo: number;
    status?: string;
    capacity?: number;
}

// Schema
const diningTableSchema = z.object({
    tableNo: z.number().min(1, "Table number must be at least 1"),
});

type DiningTableFormData = z.infer<typeof diningTableSchema>;

export default function DiningPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState("");
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<DiningTable | null>(null);
    const [deletingTable, setDeletingTable] = useState<DiningTable | null>(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DiningTableFormData>({
        resolver: zodResolver(diningTableSchema),
        defaultValues: {
            tableNo: 1,
        }
    });

    // Queries
    const { data: tables = [], isLoading } = useQuery({
        queryKey: ["dining-tables"],
        queryFn: async () => {
            const response = await api.get("/dinein/table-list");
            return response.data || [];
        },
    });

    // Mutations
    const createMutation = useMutation({
        mutationFn: async (data: DiningTableFormData) => {
            return await api.post("/dinein/dinein-create", data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dining-tables"] });
            closeFormModal();
            toast.success("Table created successfully");
        },
        onError: (error: Error) => {
            toast.error(error.message || "Failed to create table");
        },
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: DiningTableFormData }) => {
            return await api.put(`/dinein/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dining-tables"] });
            closeFormModal();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await api.delete(`/dinein/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["dining-tables"] });
            setIsDeleteModalOpen(false);
            setDeletingTable(null);
        },
    });

    // Handlers
    const openAddModal = () => {
        setEditingTable(null);
        reset({
            tableNo: tables.length > 0 ? Math.max(...tables.map((t: DiningTable) => t.tableNo)) + 1 : 1,
        });
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingTable(null);
        reset();
    };

    const onSubmit = (data: DiningTableFormData) => {
        if (editingTable) {
            updateMutation.mutate({
                id: editingTable.id,
                data
            });
        } else {
            if (tables.some((table: DiningTable) => table.tableNo === data.tableNo)) {
                toast.error(`Table ${data.tableNo} already exists`);
                return;
            }
            createMutation.mutate(data);
        }
    };

    const confirmDelete = (table: DiningTable) => {
        setDeletingTable(table);
        setIsDeleteModalOpen(true);
    };

    const filteredTables = tables.filter((table: DiningTable) =>
        table.tableNo.toString().includes(searchQuery)
    );

    // Pagination Calculations
    const totalPages = Math.ceil(filteredTables.length / itemsPerPage);
    const paginatedTables = filteredTables.slice(
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
                            DINING TABLES
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">Manage your restaurant dining tables</p>
                    </div>
                    <button
                        onClick={openAddModal}
                        className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-xl shadow-primary/20 flex items-center gap-2 w-fit active:scale-95"
                    >
                        <Plus className="h-5 w-5" />
                        Add New Table
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="glass-card p-4 rounded-3xl mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search by table number..."
                            className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border-none rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none font-medium text-slate-700 placeholder:text-slate-400 transition-all"
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>
                </div>

                {/* Tables Grid */}
                <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white p-6">
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">Loading Tables...</span>
                            </div>
                        </div>
                    ) : filteredTables.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                                    <Search className="text-slate-300 h-8 w-8" />
                                </div>
                                <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">No tables found</span>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {paginatedTables.map((table: DiningTable) => (
                                    <div
                                        key={table.id}
                                        className="glass-card rounded-2xl p-6 border border-slate-100 hover:shadow-xl transition-all group"
                                    >
                                        <Link href={`/dining/${table.id}`} className="flex flex-col items-center gap-4 cursor-pointer">
                                            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary/10 to-primary/20 flex items-center justify-center text-3xl shadow-inner border-2 border-white">
                                                <UtensilsCrossed className="h-10 w-10 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <h3 className="font-black text-slate-900 text-xl">Table {table.tableNo}</h3>
                                            </div>
                                        </Link>
                                        <div className="flex gap-2 w-full mt-4">
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    confirmDelete(table);
                                                }}
                                                className="flex-1 cursor-pointer flex items-center justify-center bg-red-400 text-white hover:shadow-lg border border-red-400 rounded-xl transition-all hover:scale-105 py-2"
                                                title="Delete Table"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination UI */}
                            {filteredTables.length > itemsPerPage && (
                                <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                                    <p className="text-sm font-bold text-slate-500">
                                        Showing <span className="text-slate-900">{Math.min(filteredTables.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredTables.length, currentPage * itemsPerPage)}</span> of <span className="text-slate-900">{filteredTables.length}</span> tables
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
                        </>
                    )}
                </div>
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isFormModalOpen}
                onClose={closeFormModal}
                title={editingTable ? "Update Table" : "Add Table"}
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Table Number</label>
                        <input
                            {...register("tableNo", { valueAsNumber: true })}
                            type="number"
                            min="1"
                            className={cn(
                                "w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-slate-800",
                                errors.tableNo && "border-red-500 bg-red-50"
                            )}
                            placeholder="Enter Table Number"
                        />
                        {errors.tableNo && <p className="mt-1 text-xs font-bold text-red-500">{errors.tableNo.message}</p>}
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={closeFormModal}
                            className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-400 font-bold rounded-2xl hover:bg-slate-50 transition-all uppercase text-xs tracking-[0.2em]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex-2 bg-primary text-white font-black rounded-2xl py-4 hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center uppercase text-xs tracking-[0.2em] disabled:opacity-50"
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                editingTable ? "Update Table" : "Add Table"
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={() => deletingTable && deleteMutation.mutate(deletingTable.id)}
                title="Delete Table"
                description={`This will permanently delete Table ${deletingTable?.tableNo} from the database. This action is irreversible.`}
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}