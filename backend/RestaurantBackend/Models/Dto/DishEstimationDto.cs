namespace RestaurantBackend.Models.Dto
{
    public class EstimationIngredientDto
    {
        public string? Id { get; set; }
        public string Name { get; set; } = null!;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;
        public decimal Cost { get; set; }
        public string? MasterIngredientId { get; set; }
    }

    public class CreateDishEstimationDto
    {
        public string Category { get; set; } = null!;
        public string? MenuItemId { get; set; }
        public string ItemName { get; set; } = null!;
        public string PortionSize { get; set; } = null!;
        public decimal SellingPrice { get; set; }
        public decimal TotalCost { get; set; }
        public decimal GrossProfit { get; set; }
        public decimal ProfitMargin { get; set; }
        public decimal FoodCostPercentage { get; set; }
        public string? Notes { get; set; }
        public List<EstimationIngredientDto> Ingredients { get; set; } = new();
    }

    public class UpdateDishEstimationDto : CreateDishEstimationDto
    {
        public string Id { get; set; } = null!;
    }

    public class DishEstimationResponseDto
    {
        public string Id { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string? MenuItemId { get; set; }
        public string ItemName { get; set; } = null!;
        public string PortionSize { get; set; } = null!;
        public decimal SellingPrice { get; set; }
        public decimal TotalCost { get; set; }
        public decimal GrossProfit { get; set; }
        public decimal ProfitMargin { get; set; }
        public decimal FoodCostPercentage { get; set; }
        public string? Notes { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<EstimationIngredientResponseDto> Ingredients { get; set; } = new();
    }

    public class EstimationIngredientResponseDto
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public decimal Quantity { get; set; }
        public string Unit { get; set; } = null!;
        public decimal Cost { get; set; }
        public string? MasterIngredientId { get; set; }
    }
}
