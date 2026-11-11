'use client';

import { useState, useEffect } from 'react';
import { Plus, Check, Sparkles } from 'lucide-react';
import { MenuItem, Portion } from '@/lib/types';

interface MenuItemCardProps {
    item: MenuItem;
    onAdd: (product: MenuItem, portion: Portion) => void;
    inCartCount?: number;
    viewMode?: 'grid' | 'list';
}

export default function MenuItemCard({
    item,
    onAdd,
    inCartCount = 0,
    viewMode = 'list',
}: MenuItemCardProps) {
    const [selectedPortion, setSelectedPortion] = useState<Portion | null>(null);
    const [isJustAdded, setIsJustAdded] = useState(false);

    useEffect(() => {
        if (item.portions && item.portions.length > 0) {
            const medium = item.portions.find(p => p.size === 'M' || p.size === 'Medium');
            const large = item.portions.find(p => p.size === 'L' || p.size === 'Large');
            setSelectedPortion(medium || large || item.portions[0]);
        }
    }, [item]);

    if (!selectedPortion) return null;

    const handleAddClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onAdd(item, selectedPortion);
        setIsJustAdded(true);
        setTimeout(() => setIsJustAdded(false), 400);
    };

    const formatPortionLabel = (size: string) => {
        const lower = size.toLowerCase();
        if (lower === 'medium') return 'M';
        if (lower === 'large') return 'L';
        if (lower === 'small') return 'S';
        if (lower === 'regular') return 'Reg';
        if (lower === 'full') return 'Full';
        if (lower === 'half') return 'Half';
        return size.length > 4 ? size.substring(0, 3) : size;
    };

    // ─── GRID CARD VIEW ──────────────────────────────────────────────────────────
    if (viewMode === 'grid') {
        return (
            <div
                onClick={handleAddClick}
                className={`group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer select-none active:scale-[0.98] ${
                    inCartCount > 0
                        ? 'border-indigo-400/70 shadow-md shadow-indigo-100/60 ring-2 ring-indigo-500/10'
                        : 'border-slate-200/80 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-slate-200/50'
                }`}
            >
                {/* Image Header */}
                <div className="relative w-full h-32 sm:h-36 bg-slate-100 overflow-hidden">
                    <img
                        src={item.image || '/item-bg.png'}
                        alt={item.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/item-bg.png';
                        }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                    {/* Category Pill Tag */}
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-slate-900/70 text-white backdrop-blur-md shadow-sm border border-white/10">
                        {item.category}
                    </span>

                    {/* In-Cart Badge */}
                    {inCartCount > 0 && (
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1 backdrop-blur-md animate-in fade-in zoom-in-95">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {inCartCount} in cart
                        </span>
                    )}

                    {/* Quick Added Flash Indicator */}
                    {isJustAdded && (
                        <div className="absolute inset-0 bg-indigo-600/30 backdrop-blur-[1px] flex items-center justify-center animate-out fade-out duration-300">
                            <span className="px-3 py-1 bg-white text-indigo-700 rounded-full font-bold text-xs shadow-lg flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                Added!
                            </span>
                        </div>
                    )}
                </div>

                {/* Content Body */}
                <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
                    <div>
                        <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors leading-snug">
                            {item.name}
                        </h3>
                    </div>

                    {/* Portion Selector Pills */}
                    {item.portions.length > 1 && (
                        <div
                            className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {item.portions.map((p) => {
                                const isSelected =
                                    (selectedPortion.id || selectedPortion.size) === (p.id || p.size);
                                return (
                                    <button
                                        key={p.id || p.size}
                                        type="button"
                                        onClick={() => setSelectedPortion(p)}
                                        className={`flex-1 min-w-[36px] py-1 px-1.5 rounded-lg text-[10px] font-extrabold transition-all uppercase cursor-pointer text-center ${
                                            isSelected
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
                                        }`}
                                    >
                                        {formatPortionLabel(p.size)}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Bottom Pricing & Add Action */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                {selectedPortion.size ? selectedPortion.size : 'Price'}
                            </span>
                            <span className="text-base font-black text-indigo-600 tabular-nums">
                                {selectedPortion.price.toFixed(2)}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddClick}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer ${
                                isJustAdded
                                    ? 'bg-emerald-600 text-white scale-105'
                                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white group-hover:bg-indigo-600 group-hover:text-white'
                            }`}
                        >
                            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Add</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ─── LIST VIEW (COMPACT POS ROW) ─────────────────────────────────────────────
    return (
        <div
            onClick={handleAddClick}
            className={`group relative p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 cursor-pointer bg-white active:scale-[0.99] ${
                inCartCount > 0
                    ? 'border-indigo-400/80 shadow-sm ring-1 ring-indigo-500/10 bg-indigo-50/10'
                    : 'border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
            }`}
        >
            {/* Image Thumbnail */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 bg-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative border border-slate-100">
                <img
                    src={item.image || '/item-bg.png'}
                    alt={item.name}
                    className="w-full h-full object-contain p-1 group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = '/item-bg.png';
                    }}
                />
                {inCartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md border-2 border-white">
                        {inCartCount}
                    </span>
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {item.name}
                    </h3>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {item.category}
                    </span>
                    {selectedPortion.size && (
                        <span className="text-[10px] font-semibold text-indigo-500/80 bg-indigo-50 px-1.5 py-0.2 rounded">
                            {selectedPortion.size}
                        </span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                {/* Portions */}
                {item.portions.length > 1 && (
                    <div className="flex bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/70">
                        {item.portions.map((p) => {
                            const isSelected =
                                (selectedPortion.id || selectedPortion.size) === (p.id || p.size);
                            return (
                                <button
                                    key={p.id || p.size}
                                    type="button"
                                    onClick={() => setSelectedPortion(p)}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all uppercase cursor-pointer ${
                                        isSelected
                                            ? 'bg-white text-indigo-600 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-700'
                                    }`}
                                >
                                    {formatPortionLabel(p.size)}
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Price */}
                <div className="text-right min-w-[75px]">
                    <span className="text-indigo-600 font-black text-sm tabular-nums">
                        {selectedPortion.price.toFixed(2)}
                    </span>
                </div>

                {/* Add button */}
                <button
                    type="button"
                    onClick={handleAddClick}
                    className={`p-2 rounded-xl transition-all shadow-sm cursor-pointer ${
                        isJustAdded
                            ? 'bg-emerald-600 text-white scale-110'
                            : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'
                    }`}
                    title="Add to order"
                >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                </button>
            </div>
        </div>
    );
}
