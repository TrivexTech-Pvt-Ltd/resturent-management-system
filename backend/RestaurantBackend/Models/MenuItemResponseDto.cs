namespace RestaurantBackend.Models;

public class MenuItemResponseDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Image { get; set; }

    public List<MenuItemPortionResponseDto> Portions { get; set; } = [];
}

public class MenuItemPortionResponseDto
{
    public string Id { get; set; } = null!;
    public string Size { get; set; } = null!;
    public decimal Price { get; set; }
}
