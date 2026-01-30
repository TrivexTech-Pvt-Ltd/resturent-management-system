using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Models;

namespace RestaurantBackend.Data
{
    public class RestaurantDbContext : DbContext
    {
        public RestaurantDbContext(DbContextOptions<RestaurantDbContext> options)
            : base(options)
        {
        }

        public DbSet<MenuItem> MenuItems { get; set; }
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderItem> OrderItems { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .HasMany(o => o.Items)
                .WithOne()
                .HasForeignKey(oi => oi.OrderId);
                
            modelBuilder.Entity<Order>()
                .Property(o => o.PaymentMethod)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .Property(o => o.Status)
                .HasConversion<string>();

            // Seed Menu Items
            modelBuilder.Entity<MenuItem>().HasData(
                new MenuItem { Id = "1", Name = "Classic Burger",  Category = "Burgers" },
                new MenuItem { Id = "2", Name = "Cheese Burger",  Category = "Burgers" },
                new MenuItem { Id = "3", Name = "French Fries",  Category = "Sides" },
                new MenuItem { Id = "4", Name = "Coke", Category = "Drinks" },
                new MenuItem { Id = "5", Name = "Pizza Margherita", Category = "Pizza" },
                new MenuItem { Id = "6", Name = "Pasta Carbonara",  Category = "Pasta" }
            );

            modelBuilder.Entity<MenuItem>().HasData(
           new MenuItem { Id = "CR", Name = "Chicken Rice", Category = "Rice" }
       );

            modelBuilder.Entity<MenuItemPortion>().HasData(
                new MenuItemPortion { Id = "CR-M", MenuItemId = "CR", Size = "M", Price = 650 },
                new MenuItemPortion { Id = "CR-L", MenuItemId = "CR", Size = "L", Price = 850 }
            );

        }
    }
}
