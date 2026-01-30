using System.ComponentModel.DataAnnotations;

namespace RestaurantBackend.Models
{
    public class MenuItem
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();

        [Required]
        public string Name { get; set; } = null!;

        [Required]
        public string Category { get; set; } = null!;

        public string? Image { get; set; }

        // NEW: Navigation
        public ICollection<MenuItemPortion> Portions { get; set; } = new List<MenuItemPortion>();
    }
}
