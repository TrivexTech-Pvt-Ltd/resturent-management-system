import { api } from "./api";
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
        await api.patch(`/Orders/${orderId}`, { status });
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

// ─── Dish Estimations ────────────────────────────────────────────────────────

import { EstimationRecord } from "./types";

export const getEstimations = async (): Promise<EstimationRecord[]> => {
    try {
        const response = await api.get("/Estimations");
        // Normalise decimal numbers coming as strings from the backend
        return (response.data as any[]).map(normalizeEstimation);
    } catch (error) {
        console.error("Error fetching estimations:", error);
        return [];
    }
};

export const createEstimation = async (
    record: Omit<EstimationRecord, "id" | "createdAt" | "updatedAt">
): Promise<EstimationRecord> => {
    const response = await api.post("/Estimations", record);
    return normalizeEstimation(response.data);
};

export const updateEstimation = async (
    id: string,
    record: EstimationRecord
): Promise<EstimationRecord> => {
    const response = await api.put(`/Estimations/${id}`, { ...record, id });
    return normalizeEstimation(response.data);
};

export const deleteEstimation = async (id: string): Promise<boolean> => {
    try {
        await api.delete(`/Estimations/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting estimation:", error);
        throw error;
    }
};

/** Convert string numerics returned by the backend into JS numbers */
function normalizeEstimation(raw: any): EstimationRecord {
    return {
        ...raw,
        sellingPrice: Number(raw.sellingPrice ?? 0),
        totalCost: Number(raw.totalCost ?? 0),
        grossProfit: Number(raw.grossProfit ?? 0),
        profitMargin: Number(raw.profitMargin ?? 0),
        foodCostPercentage: Number(raw.foodCostPercentage ?? 0),
        ingredients: (raw.ingredients ?? []).map((i: any) => ({
            ...i,
            quantity: Number(i.quantity ?? 0),
            cost: Number(i.cost ?? 0),
        })),
    };
}

// ─── Master Ingredients ──────────────────────────────────────────────────────

import { MasterIngredient } from "./types";

export const getMasterIngredients = async (): Promise<MasterIngredient[]> => {
    try {
        const response = await api.get("/Ingredients");
        return (response.data as any[]).map((i: any) => ({
            ...i,
            standardQuantity: Number(i.standardQuantity ?? 1),
            unitCost: Number(i.unitCost ?? 0),
            stockQuantity: Number(i.stockQuantity ?? 0),
        }));
    } catch (error) {
        console.error("Error fetching master ingredients:", error);
        return [];
    }
};

export const createMasterIngredient = async (
    ingredient: Omit<MasterIngredient, "id">
): Promise<MasterIngredient> => {
    const response = await api.post("/Ingredients", ingredient);
    return {
        ...response.data,
        standardQuantity: Number(response.data.standardQuantity ?? 1),
        unitCost: Number(response.data.unitCost ?? 0),
        stockQuantity: Number(response.data.stockQuantity ?? 0),
    };
};

export const updateMasterIngredient = async (
    id: string,
    ingredient: Partial<MasterIngredient>
): Promise<MasterIngredient> => {
    const response = await api.put(`/Ingredients/${id}`, ingredient);
    return {
        ...response.data,
        standardQuantity: Number(response.data.standardQuantity ?? 1),
        unitCost: Number(response.data.unitCost ?? 0),
        stockQuantity: Number(response.data.stockQuantity ?? 0),
    };
};

export const adjustIngredientStock = async (
    id: string,
    delta: number
): Promise<MasterIngredient> => {
    const response = await api.patch(`/Ingredients/${id}/adjust-stock`, { delta });
    return {
        ...response.data,
        standardQuantity: Number(response.data.standardQuantity ?? 1),
        unitCost: Number(response.data.unitCost ?? 0),
        stockQuantity: Number(response.data.stockQuantity ?? 0),
    };
};

export const deleteMasterIngredient = async (id: string): Promise<boolean> => {
    try {
        await api.delete(`/Ingredients/${id}`);
        return true;
    } catch (error) {
        console.error("Error deleting master ingredient:", error);
        throw error;
    }
};

