using System.ComponentModel.DataAnnotations;

namespace RestaurantBackend.Models
{
    public class MenuItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public required string Name { get; set; }
        public decimal Price { get; set; }
        public required string Category { get; set; }
        public string? Image { get; set; }
    }
}
