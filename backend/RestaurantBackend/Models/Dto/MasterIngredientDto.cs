using System.ComponentModel.DataAnnotations;

namespace RestaurantBackend.Models.Dto
{
    public class MasterIngredientDto
    {
        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string Unit { get; set; } = "kg";

        /// <summary>Reference quantity for cost calculation (e.g. 1 kg = UnitCost LKR)</summary>
        public decimal StandardQuantity { get; set; } = 1;

        public decimal UnitCost { get; set; }

        /// <summary>Current physical stock on hand</summary>
        public decimal StockQuantity { get; set; } = 0;

        public string? Category { get; set; }
    }

    public class MasterIngredientResponseDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal StandardQuantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal StockQuantity { get; set; }
        public string? Category { get; set; }
    }

    public class AdjustStockDto
    {
        public decimal Delta { get; set; }  // positive = add, negative = deduct
    }
}
