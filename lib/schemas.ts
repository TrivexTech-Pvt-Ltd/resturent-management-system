import { z } from "zod";

export const menuItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    price: z.number().optional(),
    image: z.string().optional(),
    portionSize: z.string().optional(),
    portions: z.array(z.object({
        id: z.string().optional(),
        size: z.string().min(1, "Portion size is required"),
        price: z.number().min(0.01, "Price must be greater than 0")
    })).min(1, "At least one portion is required"),
});

export type MenuItemFormData = z.infer<typeof menuItemSchema>;
