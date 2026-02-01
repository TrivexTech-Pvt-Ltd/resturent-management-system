using System.ComponentModel.DataAnnotations;

namespace RestaurantBackend.Models
{
    public enum OrderStatus
    {
        PENDING,
        PREPARING,
        READY,
        COMPLETED
    }

    public enum PaymentMethod
    {
        CASH,
        CARD
    }

    public enum OrderType
    {
        TAKEAWAY,
        DINEIN,
        DELIVERY
    }

    public class OrderItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public required string Name { get; set; }
        public decimal Price { get; set; }
        public int Quantity { get; set; }
        public string? Category { get; set; }
        public string? Image { get; set; }
        
        // Relationship - Hidden from API validation
        [System.Text.Json.Serialization.JsonIgnore]
        public string? OrderId { get; set; }
    }

    public class Order
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string? OrderNumber { get; set; }
        public List<OrderItem> Items { get; set; } = new();
        public decimal Total { get; set; }
        public PaymentMethod PaymentMethod { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public OrderType OrderType { get; set; }
        public int? TableNo { get; set; }
    }
}
