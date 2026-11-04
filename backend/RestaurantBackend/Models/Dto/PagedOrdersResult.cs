namespace RestaurantBackend.Models.Dto
{
    public class PagedOrdersResult
    {
        public List<Order> Data { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages { get; set; }
    }
}
