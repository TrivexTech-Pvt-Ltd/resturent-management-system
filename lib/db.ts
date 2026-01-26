import { Order, MenuItem } from './types';

const API_BASE_URL = 'http://localhost:5071/api';

export const getOrders = async (): Promise<Order[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders`);
        if (!response.ok) throw new Error('Failed to fetch orders');
        return await response.json();
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
};

export const saveOrder = async (order: Partial<Order>) => {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order),
        });
        if (!response.ok) throw new Error('Failed to save order');
        return await response.json();
    } catch (error: any) {
        console.error('Error saving order to .NET Backend:', error);
        // Log the error message to the console for easier debugging
        if (error.message) console.error('Error message:', error.message);
        throw error;
    }
};

export const updateOrderStatus = async (orderId: string, status: Order['status']) => {
    try {
        const response = await fetch(`${API_BASE_URL}/Orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(status),
        });
        if (!response.ok) throw new Error('Failed to update status');
        return true;
    } catch (error) {
        console.error('Error updating status:', error);
        return null;
    }
};

export const getMenu = async (): Promise<MenuItem[]> => {
    try {
        const response = await fetch(`${API_BASE_URL}/Menu`);
        if (!response.ok) throw new Error('Failed to fetch menu');
        return await response.json();
    } catch (error) {
        console.error('Error fetching menu:', error);
        return [];
    }
};
