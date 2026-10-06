using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantBackend.Models
{
    public class MasterIngredient
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string Unit { get; set; } = "g";

        /// <summary>Reference quantity used for cost estimation (e.g. 1 kg = UnitCost LKR)</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal StandardQuantity { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitCost { get; set; }

        /// <summary>Actual current stock level in the same unit as Unit field</summary>
        [Column(TypeName = "decimal(18,4)")]
        public decimal StockQuantity { get; set; } = 0;

        public string? Category { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
