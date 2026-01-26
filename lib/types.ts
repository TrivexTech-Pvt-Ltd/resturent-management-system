export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'COMPLETED';

export interface OrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    items: OrderItem[];
    total: number;
    paymentMethod: 'CASH' | 'CARD';
    status: OrderStatus;
    createdAt: string;
}

export interface MenuItem {
    id: string;
    name: string;
    price: number;
    category: string;
    image?: string;
}
