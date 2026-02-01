namespace RestaurantBackend.Models.Dto;

public class UpdateMenuItemDto
{
    public string Id { get; set; } = null!;
    public string Name { get; set; } = null!;
    public string Category { get; set; } = null!;
    public string? Image { get; set; }

    public ICollection<UpdateMenuItemPortionDto> Portions { get; set; }
        = new List<UpdateMenuItemPortionDto>();
}

public class UpdateMenuItemPortionDto
{
    public string? Id { get; set; }   // nullable = upsert
    public string Size { get; set; } = null!;
    public decimal Price { get; set; }
}
