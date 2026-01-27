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
                new MenuItem { Id = "1", Name = "Classic Burger", Price = 8.99m, Category = "Burgers" },
                new MenuItem { Id = "2", Name = "Cheese Burger", Price = 9.99m, Category = "Burgers" },
                new MenuItem { Id = "3", Name = "French Fries", Price = 3.99m, Category = "Sides" },
                new MenuItem { Id = "4", Name = "Coke", Price = 1.99m, Category = "Drinks" },
                new MenuItem { Id = "5", Name = "Pizza Margherita", Price = 12.99m, Category = "Pizza" },
                new MenuItem { Id = "6", Name = "Pasta Carbonara", Price = 11.99m, Category = "Pasta" }
            );
        }
    }
}
