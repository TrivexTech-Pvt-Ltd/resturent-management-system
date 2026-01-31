import { useState, useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { MenuItem, Portion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface MenuItemCardProps {
    item: MenuItem;
    onAdd: (product: MenuItem, portion: Portion) => void;
}

export default function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
    // Initialize state - default to Medium if available, else first available
    const [selectedPortion, setSelectedPortion] = useState<Portion | null>(null);

    useEffect(() => {
        if (item.portions && item.portions.length > 0) {
            const medium = item.portions.find(p => p.size === 'M' || p.size === 'Medium');
            const large = item.portions.find(p => p.size === 'L' || p.size === 'Large');
            // Prefer Medium, then Large, then just the first one
            setSelectedPortion(medium || large || item.portions[0]);
        }
    }, [item]);

    if (!selectedPortion) return null;

    return (
        <div
            onClick={() => onAdd(item, selectedPortion)}
            className="glass-card p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all border-transparent hover:border-primary/30 group flex flex-col h-full bg-white"
        >
            <div className="h-32 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 transition-all relative overflow-hidden">
                {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                    <img
                        src="/item-bg.jpg"
                        alt="Food placeholder"
                        className="w-full h-full object-cover opacity-80"
                    />
                )}
            </div>

            <div className="flex-1">
                <h3 className="font-bold text-lg leading-tight mb-1 text-slate-800">{item.name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-3">{item.category}</p>
            </div>

            <div className="mt-auto space-y-3">
                {item.portions.length > 1 && (
                    <div
                        className="flex bg-slate-100 p-1 rounded-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {item.portions.map(portion => (
                            <button
                                key={portion.id || portion.size}
                                onClick={() => setSelectedPortion(portion)}
                                className={cn(
                                    "flex-1 py-1.5 rounded-lg text-xs font-black transition-all uppercase",
                                    (selectedPortion.id === portion.id || selectedPortion.size === portion.size)
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                {portion.size}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex justify-between items-center bg-slate-50 p-2 rounded-xl -mx-2 mb-0">
                    <span className="text-primary font-black text-xl">{selectedPortion.price.toFixed(2)}</span>
                    <button className="bg-primary text-white p-2 rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
