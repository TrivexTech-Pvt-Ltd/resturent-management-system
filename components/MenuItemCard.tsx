import { MenuItem } from '@/lib/types';

interface MenuItemCardProps {
    item: MenuItem;
    onAdd: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAdd }: MenuItemCardProps) {
    return (
        <div
            onClick={() => onAdd(item)}
            className="glass-card p-4 rounded-2xl cursor-pointer hover:scale-[1.02] transition-all border-transparent hover:border-primary/30 group"
        >
            <div className="h-32 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 transition-all">
                {/* Simplified icon if no image */}
                <span className="text-4xl">🍔</span>
            </div>
            <h3 className="font-semibold text-lg">{item.name}</h3>
            <p className="text-secondary text-sm mb-2">{item.category}</p>
            <div className="flex justify-between items-center">
                <span className="text-primary font-bold">${item.price.toFixed(2)}</span>
                <button className="bg-primary text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
