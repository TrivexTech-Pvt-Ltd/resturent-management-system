using System.ComponentModel.DataAnnotations;

namespace RestaurantBackend.Models
{
    public enum UserRole
    {
        Admin,
        User
    }

    public class User
    {
        [Key]
        public string Id { get; set; } = Guid.NewGuid().ToString();
        
        [Required]
        public required string Username { get; set; }
        
        [Required]
        public required string PasswordHash { get; set; }
        
        [Required]
        public UserRole Role { get; set; } = UserRole.User;
        
        public string? FullName { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class RegisterDto
    {
        [Required]
        public required string Username { get; set; }
        
        [Required]
        public required string Password { get; set; }
        
        public string? FullName { get; set; }
        
        public UserRole Role { get; set; } = UserRole.User;
    }

    public class LoginDto
    {
        [Required]
        public required string Username { get; set; }
        
        [Required]
        public required string Password { get; set; }
    }

    public class UserResponseDto
    {
        public required string Id { get; set; }
        public required string Username { get; set; }
        public required string Role { get; set; }
        public string? FullName { get; set; }
    }
}
