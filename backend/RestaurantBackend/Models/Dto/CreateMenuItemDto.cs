namespace RestaurantBackend.Models.Dto;

public class CreateMenuItemDto
{
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Image { get; set; }

    public List<MenuItemPortionDto> Portions { get; set; } = [];
}

public class MenuItemPortionDto
{
    public string Size { get; set; } = null!;
    public decimal Price { get; set; }
}