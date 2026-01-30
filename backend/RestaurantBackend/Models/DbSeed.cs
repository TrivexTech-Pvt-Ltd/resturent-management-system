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
        }

    }
}
