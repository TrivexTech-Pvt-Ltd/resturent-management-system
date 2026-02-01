namespace RestaurantBackend.Models.Dto;

public class DineinCloseDto
{
    public string Id { get; set; }
    public decimal Total { get; set; }
    public PaymentMethod PaymentMethod { get; set; }
}
