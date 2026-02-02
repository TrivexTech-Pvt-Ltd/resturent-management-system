import { useState, useEffect } from 'react';
import { UtensilsCrossed, Plus } from 'lucide-react';
import { MenuItem, Portion } from '@/lib/types';

interface MenuItemCardProps {
    item: MenuItem;
    onAdd: (product: MenuItem, portion: Portion) => void;
}

export default function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
    const [selectedPortion, setSelectedPortion] = useState<Portion | null>(null);

    useEffect(() => {
        if (item.portions && item.portions.length > 0) {
            const medium = item.portions.find(p => p.size === 'M' || p.size === 'Medium');
            const large = item.portions.find(p => p.size === 'L' || p.size === 'Large');
            setSelectedPortion(medium || large || item.portions[0]);
        }
    }, [item]);

    if (!selectedPortion) return null;

    return (
        <div
            onClick={() => onAdd(item, selectedPortion)}
            className="glass-card p-2 rounded-xl cursor-pointer hover:scale-[1.01] transition-all border-transparent hover:border-primary/30 group flex items-center gap-4 bg-white"
        >
            <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:bg-primary/5 shrink-0 overflow-hidden relative border border-slate-100">
                <img
                    src={item.image || "/item-bg.png"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = "/item-bg.png";
                    }}
                />
            </div>

            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-slate-800 truncate">{item.name}</h3>
                <p className="text-[10px] font-bold text-primary/60 uppercase tracking-tight">{item.category}</p>
            </div>

            <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                {item.portions.length > 1 && (
                    <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        {item.portions.map(p => {
                            const isSelected = (selectedPortion.id || selectedPortion.size) === (p.id || p.size);
                            return (
                                <button
                                    key={p.id || p.size}
                                    onClick={() => setSelectedPortion(p)}
                                    className={`px-2 py-1 rounded-md text-[10px] font-black transition-all uppercase cursor-pointer ${isSelected
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    {p.size === 'Medium' ? 'M' : p.size === 'Large' ? 'L' : p.size.substring(0, 2)}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className="text-right min-w-[70px]">
                    <span className="text-primary font-black text-sm">{selectedPortion.price.toFixed(2)}</span>
                </div>

                <button
                    onClick={() => onAdd(item, selectedPortion)}
                    className="bg-primary text-white p-2 rounded-lg shadow-md shadow-primary/10 hover:bg-primary/90 transition-all cursor-pointer"
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    );
}
