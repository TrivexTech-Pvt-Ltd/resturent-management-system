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
        <div className={cn("px-6 py-4 bg-white border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 select-none", className)}>
            {/* Left Section: Item Count */}
            <div className="text-xs font-semibold text-slate-500">
                Showing <span className="text-slate-900 font-bold">{startItem}-{endItem}</span> of{" "}
                <span className="text-slate-900 font-bold">{totalItems}</span> {itemName}
            </div>

            {/* Center Section: Rows per page selector */}
            {onItemsPerPageChange && (
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span>Rows per page:</span>
                    <div className="relative">
                        <select
                            id="items-per-page-select"
                            value={itemsPerPage}
                            onChange={(e) => {
                                onItemsPerPageChange(Number(e.target.value));
                                onPageChange(1);
                            }}
                            className="bg-white border border-slate-200/80 hover:border-slate-300 rounded-xl pl-3 pr-7 py-1.5 text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer shadow-2xs appearance-none"
                        >
                            {pageSizeOptions.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 rotate-90 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                </div>
            )}

            {/* Right Section: Pagination Controls */}
            <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {/* First Page Button */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                    className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                    <ChevronsLeft className="h-4 w-4" />
                </button>

                {/* Previous Page Button */}
                <button
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                    className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
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
                                    className="w-7 text-center text-slate-400 font-bold text-xs select-none"
                                >
                                    ...
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
                                    "w-8 h-8 rounded-xl text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-black"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
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
                    className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                {/* Last Page Button */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Last Page"
                    className="w-8 h-8 rounded-xl border border-slate-200/80 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                    <ChevronsRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
