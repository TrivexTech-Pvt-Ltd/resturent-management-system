using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantBackend.Models
{
    public class EstimationIngredient
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string DishEstimationId { get; set; } = null!;

        [ForeignKey(nameof(DishEstimationId))]
        public DishEstimation DishEstimation { get; set; } = null!;

        [Required]
        public string Name { get; set; } = null!;

        [Column(TypeName = "decimal(18,4)")]
        public decimal Quantity { get; set; }

        [Required]
        public string Unit { get; set; } = null!;

        [Column(TypeName = "decimal(18,2)")]
        public decimal Cost { get; set; }

        /// <summary>Optional FK to MasterIngredient for automatic stock deduction</summary>
        public string? MasterIngredientId { get; set; }
    }
}
