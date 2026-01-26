import fs from 'fs';
import path from 'path';
import { Order, MenuItem } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'orders.json');
const MENU_PATH = path.join(process.cwd(), 'data', 'menu.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(process.cwd(), 'data'))) {
    fs.mkdirSync(path.join(process.cwd(), 'data'));
}

// Initial Menu Data
const defaultMenu: MenuItem[] = [
    { id: '1', name: 'Classic Burger', price: 8.99, category: 'Burgers' },
    { id: '2', name: 'Cheese Burger', price: 9.99, category: 'Burgers' },
    { id: '3', name: 'French Fries', price: 3.99, category: 'Sides' },
    { id: '4', name: 'Coke', price: 1.99, category: 'Drinks' },
    { id: '5', name: 'Pizza Margherita', price: 12.99, category: 'Pizza' },
    { id: '6', name: 'Pasta Carbonara', price: 11.99, category: 'Pasta' },
];

if (!fs.existsSync(MENU_PATH)) {
    fs.writeFileSync(MENU_PATH, JSON.stringify(defaultMenu, null, 2));
}

if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([], null, 2));
}

export const getOrders = (): Order[] => {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
};

export const saveOrder = (order: Order) => {
    const orders = getOrders();
    orders.push(order);
    fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2));
    return order;
};

export const updateOrderStatus = (orderId: string, status: Order['status']) => {
    const orders = getOrders();
    const index = orders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        orders[index].status = status;
        fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2));
        return orders[index];
    }
    return null;
};

export const getMenu = (): MenuItem[] => {
    const data = fs.readFileSync(MENU_PATH, 'utf-8');
    return JSON.parse(data);
};
