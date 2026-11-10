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
        public DbSet<MenuItemPortion> MenuItemPortions { get; set; }
        public DbSet<DishEstimation> DishEstimations { get; set; }
        public DbSet<EstimationIngredient> EstimationIngredients { get; set; }
        public DbSet<MasterIngredient> MasterIngredients { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .Property(u => u.Role)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .HasMany(o => o.Items)
                .WithOne()
                .HasForeignKey(oi => oi.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order>()
                .Property(o => o.PaymentMethod)
                .HasConversion<string>();

            modelBuilder.Entity<Order>()
                .Property(o => o.Status)
                .HasConversion<string>();

            // Performance indexes for report date-range and payment filters
            modelBuilder.Entity<Order>()
                .HasIndex(o => o.CreatedAt)
                .HasDatabaseName("IX_Orders_CreatedAt");

            modelBuilder.Entity<Order>()
                .HasIndex(o => o.PaymentMethod)
                .HasDatabaseName("IX_Orders_PaymentMethod");

            modelBuilder.Entity<Order>()
                .HasIndex(o => new { o.CreatedAt, o.PaymentMethod })
                .HasDatabaseName("IX_Orders_CreatedAt_PaymentMethod");

            // Speed up order items lookup by parent order
            modelBuilder.Entity<OrderItem>()
                .HasIndex(oi => oi.OrderId)
                .HasDatabaseName("IX_OrderItems_OrderId");

            modelBuilder.Entity<DishEstimation>()
                .HasMany(d => d.Ingredients)
                .WithOne(i => i.DishEstimation)
                .HasForeignKey(i => i.DishEstimationId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
