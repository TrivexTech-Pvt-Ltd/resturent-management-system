using Microsoft.AspNetCore.Identity;
using RestaurantBackend.Common;
using RestaurantBackend.Data;

namespace RestaurantBackend.Models;

public static class DbSeed
{
    public async static Task SeedData(WebApplication app)
    {
        using (var scope = app.Services.CreateScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<RestaurantDbContext>();

            if (!context.Users.Any())
            {
                context.Users.Add(new User
                {
                    Username = "Admin",
                    PasswordHash = CustomPasswordHasher.HashPassword("Admin@123"),
                    Role = UserRole.Admin,
                    FullName = "Administrator",
                });
                context.SaveChanges();
            }

            if (!context.MasterIngredients.Any())
            {
                context.MasterIngredients.AddRange(
                    new MasterIngredient { Name = "Basmati Rice", Unit = "kg", StandardQuantity = 1, UnitCost = 450, Category = "Grains" },
                    new MasterIngredient { Name = "Keeri Samba Rice", Unit = "kg", StandardQuantity = 1, UnitCost = 320, Category = "Grains" },
                    new MasterIngredient { Name = "Chicken Breast", Unit = "kg", StandardQuantity = 1, UnitCost = 1400, Category = "Meat" },
                    new MasterIngredient { Name = "Egg", Unit = "pcs", StandardQuantity = 1, UnitCost = 35, Category = "Poultry" },
                    new MasterIngredient { Name = "Vegetable Oil", Unit = "l", StandardQuantity = 1, UnitCost = 900, Category = "Oils" },
                    new MasterIngredient { Name = "Garlic", Unit = "kg", StandardQuantity = 1, UnitCost = 650, Category = "Vegetables" },
                    new MasterIngredient { Name = "Ginger", Unit = "kg", StandardQuantity = 1, UnitCost = 700, Category = "Vegetables" },
                    new MasterIngredient { Name = "Onion", Unit = "kg", StandardQuantity = 1, UnitCost = 280, Category = "Vegetables" },
                    new MasterIngredient { Name = "Tomato", Unit = "kg", StandardQuantity = 1, UnitCost = 350, Category = "Vegetables" },
                    new MasterIngredient { Name = "Salt", Unit = "kg", StandardQuantity = 1, UnitCost = 120, Category = "Spices" },
                    new MasterIngredient { Name = "Black Pepper", Unit = "g", StandardQuantity = 100, UnitCost = 350, Category = "Spices" },
                    new MasterIngredient { Name = "Chili Powder", Unit = "g", StandardQuantity = 100, UnitCost = 250, Category = "Spices" },
                    new MasterIngredient { Name = "Mozzarella Cheese", Unit = "kg", StandardQuantity = 1, UnitCost = 2800, Category = "Dairy" },
                    new MasterIngredient { Name = "Fresh Milk", Unit = "l", StandardQuantity = 1, UnitCost = 420, Category = "Dairy" },
                    new MasterIngredient { Name = "Butter", Unit = "g", StandardQuantity = 250, UnitCost = 850, Category = "Dairy" },
                    new MasterIngredient { Name = "Packaging Box", Unit = "pcs", StandardQuantity = 1, UnitCost = 45, Category = "Packaging" }
                );

                context.SaveChanges();
            }
        }
    }
}
