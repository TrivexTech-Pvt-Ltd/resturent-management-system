import { z } from "zod";

export const menuItemSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    price: z.coerce.number().min(0.01, "Price must be greater than 0"),
    image: z.string().optional().nullable(),
});

export type MenuItemFormData = z.infer<typeof menuItemSchema>;
