using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RestaurantBackend.Models;

public class MenuItemPortion
{
    [Key]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Required]
    public string MenuItemId { get; set; } = null!;

    [ForeignKey(nameof(MenuItemId))]
    public MenuItem MenuItem { get; set; } = null!;

    [Required]
    public string Size { get; set; } = null!; // M, L, XL

    [Required]
    public decimal Price { get; set; }

    public bool IsAvailable { get; set; } = true;
}