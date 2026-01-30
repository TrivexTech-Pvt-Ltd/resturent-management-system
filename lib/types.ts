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

export interface Portion {
    id: string;
    size: string;
    price: number;
}

export interface MenuItem {
    id: string;
    name: string;
    category: string;
    image?: string;
    portions: Portion[];
}

export type UserRole = 'Admin' | 'User';

export interface User {
    id: string;
    username: string;
    role: UserRole;
    fullName?: string;
}


export interface LastOrder {
    orderNo: string;
    total: number;
    items: {
        name: string;
        qty: number;
        price: number;
    }[];
}