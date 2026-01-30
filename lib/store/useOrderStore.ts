import { create } from 'zustand';
import { LastOrder } from '@/lib/types';

interface OrderState {
    lastOrder: LastOrder | null;
    setLastOrder: (order: LastOrder | null) => void;
    clearLastOrder: () => void;
}

export const useOrderStore = create<OrderState>((set) => ({
    lastOrder: null,
    setLastOrder: (order) => set({ lastOrder: order }),
    clearLastOrder: () => set({ lastOrder: null }),
}));
