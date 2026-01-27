import { api } from "./axios";
import { Order, MenuItem, User } from "./types";

export const getOrders = async (): Promise<Order[]> => {
    try {
        const response = await api.get("/Orders");
        return response.data;
    } catch (error) {
        console.error("Error fetching orders:", error);
        return [];
    }
};

export const saveOrder = async (order: Partial<Order>) => {
    try {
        const response = await api.post("/Orders", order);
        return response.data;
    } catch (error: any) {
        console.error("Error saving order to .NET Backend:", error);
        throw error;
    }
};

export const updateOrderStatus = async (
    orderId: string,
    status: Order["status"],
) => {
    try {
        await api.patch(`/Orders/${orderId}/status`, JSON.stringify(status));
        return true;
    } catch (error) {
        console.error("Error updating status:", error);
        return null;
    }
};

export const getMenu = async (): Promise<MenuItem[]> => {
    try {
        const response = await api.get("/Menu");
        return response.data;
    } catch (error) {
        console.error("Error fetching menu:", error);
        return [];
    }
};

export const addMenuItem = async (item: Partial<MenuItem>) => {
    try {
        const response = await api.post("/Menu", item);
        return response.data;
    } catch (error) {
        console.error("Error adding menu item:", error);
        throw error;
    }
};

export const updateMenuItem = async (id: string, item: MenuItem) => {
    try {
        await api.put(`/Menu/${id}`, item);
        return true;
    } catch (error) {
        console.error("Error updating menu item:", error);
        throw error;
    }
};

export const deleteMenuItem = async (id: string) => {
    try {
        await api.delete(`/Menu/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting menu item:", error);
        throw error;
    }
};

export const login = async (credentials: any): Promise<User> => {
    const response = await api.post("/Auth/login", credentials);
    return response.data;
};

export const register = async (userData: any): Promise<User> => {
    const response = await api.post("/Auth/register", userData);
    return response.data;
};
