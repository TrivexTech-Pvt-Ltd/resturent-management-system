using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantBackend.Models
{
    public class DishEstimation
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Category { get; set; } = null!;

        /// <summary>MenuItem.Id from the menu, or "CUSTOM" for ad-hoc dishes.</summary>
        public string? MenuItemId { get; set; }

        [Required]
        public string ItemName { get; set; } = null!;

        [Required]
        public string PortionSize { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal SellingPrice { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalCost { get; set; }

        [Column(TypeName = "decimal(18,2)")]
        public decimal GrossProfit { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal ProfitMargin { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal FoodCostPercentage { get; set; }

        public string? Notes { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public ICollection<EstimationIngredient> Ingredients { get; set; } = new List<EstimationIngredient>();
    }
}
