"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    pageSizeOptions?: number[];
    className?: string;
    itemName?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
    pageSizeOptions = [5, 10, 20, 50, 100],
    className,
    itemName = "items"
}: PaginationProps) {
    if (totalItems === 0) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(totalItems, currentPage * itemsPerPage);

    // Generate page numbers array with smart ellipsis
    const getPageNumbers = (): (number | string)[] => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];

        if (currentPage <= 4) {
            pages.push(1, 2, 3, 4, 5, "...", totalPages);
        } else if (currentPage >= totalPages - 3) {
            pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    return (
        <div className={cn("p-6 bg-slate-50/50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 select-none", className)}>
            {/* Left Section: Item Count & Items per Page selector */}
            <div className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-500">
                <p>
                    Showing <span className="text-slate-900 font-extrabold">{startItem}-{endItem}</span> of{" "}
                    <span className="text-slate-900 font-extrabold">{totalItems}</span> {itemName}
                </p>

                {onItemsPerPageChange && (
                    <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                        <label htmlFor="items-per-page-select" className="text-xs text-slate-400 uppercase tracking-wider font-extrabold">
                            Per page:
                        </label>
                        <select
                            id="items-per-page-select"
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer shadow-sm hover:border-slate-300"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right Section: Pagination Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* First Page Button */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous Page Button */}
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                    {pageNumbers.map((page, index) => {
                        if (page === "...") {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="w-8 text-center text-slate-400 font-extrabold text-xs select-none"
                                >
                                    •••
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        const isActive = currentPage === pageNum;

                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={cn(
                                    "w-9 h-9 rounded-xl text-xs font-extrabold transition-all active:scale-95 cursor-pointer",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20 font-black"
                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
                                )}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                {/* Next Page Button */}
                <button
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    title="Next Page"
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page Button */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                    className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-xs"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
