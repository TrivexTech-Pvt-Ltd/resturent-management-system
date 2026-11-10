namespace RestaurantBackend.Models.Dto
{
    public class ItemSalesDto
    {
        public string Id { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string BaseName { get; set; } = string.Empty;
        public string PortionSize { get; set; } = "STANDARD";
        public string Category { get; set; } = "General";
        public int TotalQuantity { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal UnitPrice { get; set; }
        public int OrderCount { get; set; }
    }

    public class PagedItemSalesResult
    {
        public List<ItemSalesDto> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
        public decimal TotalRevenue { get; set; }
        public int TotalQuantity { get; set; }
    }
}
