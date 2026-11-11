using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Data;
using RestaurantBackend.Models;
using RestaurantBackend.Models.Dto;


namespace RestaurantBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class OrdersController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public OrdersController(RestaurantDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders(
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null,
            [FromQuery] string? paymentMethod = null)
        {
            var query = _context.Orders.AsNoTracking().Include(o => o.Items).AsQueryable();

            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
                query = query.Where(o => o.CreatedAt >= start.ToUniversalTime());

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
                query = query.Where(o => o.CreatedAt <= end.ToUniversalTime());

            if (!string.IsNullOrEmpty(paymentMethod) && paymentMethod != "ALL"
                && Enum.TryParse<PaymentMethod>(paymentMethod, true, out var parsedMethod))
                query = query.Where(o => o.PaymentMethod == parsedMethod);

            return await query.OrderBy(x => x.OrderNumber).ThenBy(x => x.CreatedAt).ToListAsync();
        }

        [HttpGet("paged")]
        public async Task<ActionResult<PagedOrdersResult>> GetOrdersPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null,
            [FromQuery] string? paymentMethod = null)
        {
            var query = _context.Orders.Include(o => o.Items).AsQueryable();

            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
                query = query.Where(o => o.CreatedAt >= start.ToUniversalTime());

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
                query = query.Where(o => o.CreatedAt <= end.ToUniversalTime());

            if (!string.IsNullOrEmpty(paymentMethod) && paymentMethod != "ALL"
                && Enum.TryParse<PaymentMethod>(paymentMethod, true, out var parsedMethod))
                query = query.Where(o => o.PaymentMethod == parsedMethod);

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderByDescending(o => o.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new PagedOrdersResult
            {
                Data = data,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
            });
        }

        private static readonly Regex ItemParenRegex = new(@"^(.*?)\s*\((S|M|L|XL|Small|Medium|Large|Extra Large|[A-Za-z0-9\s]+)\)$", RegexOptions.IgnoreCase | RegexOptions.Compiled);
        private static readonly Regex ItemSpaceRegex = new(@"^(.*?)\s+(S|M|L|XL|Small|Medium|Large|Extra Large)$", RegexOptions.IgnoreCase | RegexOptions.Compiled);

        private static (string baseName, string portionSize, string category, string fullName) ParseItemDetails(
            string? rawName, string? rawCategory, List<MenuItem> menuList)
        {
            string name = (rawName ?? string.Empty).Trim();
            string baseName = name;
            string portionSize = "STANDARD";

            var parenMatch = ItemParenRegex.Match(name);
            if (parenMatch.Success)
            {
                baseName = parenMatch.Groups[1].Value.Trim();
                portionSize = parenMatch.Groups[2].Value.Trim().ToUpperInvariant();
            }
            else
            {
                var spaceMatch = ItemSpaceRegex.Match(name);
                if (spaceMatch.Success)
                {
                    baseName = spaceMatch.Groups[1].Value.Trim();
                    portionSize = spaceMatch.Groups[2].Value.Trim().ToUpperInvariant();
                }
            }

            if (portionSize == "SMALL") portionSize = "S";
            else if (portionSize == "MEDIUM") portionSize = "M";
            else if (portionSize == "LARGE") portionSize = "L";
            else if (portionSize == "EXTRA LARGE") portionSize = "XL";

            string category = rawCategory ?? string.Empty;
            if (string.IsNullOrWhiteSpace(category) && menuList.Count > 0)
            {
                var found = menuList.FirstOrDefault(m =>
                    m.Name.Equals(baseName, StringComparison.OrdinalIgnoreCase) ||
                    m.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (found != null && !string.IsNullOrWhiteSpace(found.Category))
                {
                    category = found.Category;
                }
            }

            if (string.IsNullOrWhiteSpace(category)) category = "General";

            return (baseName, portionSize, category, name);
        }

        [HttpGet("item-sales-paged")]
        public async Task<ActionResult<PagedItemSalesResult>> GetItemSalesPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? startDate = null,
            [FromQuery] string? endDate = null,
            [FromQuery] string? paymentMethod = null,
            [FromQuery] string? category = null,
            [FromQuery] string? itemName = null,
            [FromQuery] string? portionSize = null,
            [FromQuery] string? search = null,
            [FromQuery] string? sortBy = "revenue_desc")
        {
            // Build a lightweight projection query — avoids loading full Order entities
            var orderQuery = _context.Orders.AsNoTracking().AsQueryable();

            if (!string.IsNullOrEmpty(startDate) && DateTime.TryParse(startDate, out var start))
                orderQuery = orderQuery.Where(o => o.CreatedAt >= start.ToUniversalTime());

            if (!string.IsNullOrEmpty(endDate) && DateTime.TryParse(endDate, out var end))
                orderQuery = orderQuery.Where(o => o.CreatedAt <= end.ToUniversalTime());

            if (!string.IsNullOrEmpty(paymentMethod) && paymentMethod != "ALL"
                && Enum.TryParse<PaymentMethod>(paymentMethod, true, out var parsedMethod))
                orderQuery = orderQuery.Where(o => o.PaymentMethod == parsedMethod);

            // Project to only the fields needed for aggregation — no full entity materialization
            var rawItems = await orderQuery
                .SelectMany(o => o.Items.Select(oi => new
                {
                    oi.Name,
                    oi.Category,
                    oi.Price,
                    Quantity = oi.Quantity > 0 ? oi.Quantity : 1,
                }))
                .ToListAsync();

            var menuList = await _context.MenuItems.AsNoTracking()
                .Select(m => new MenuItem { Name = m.Name, Category = m.Category })
                .ToListAsync();

            var aggregated = new Dictionary<string, ItemSalesDto>();

            foreach (var item in rawItems)
            {
                var (bName, pSize, cat, fName) = ParseItemDetails(item.Name, item.Category, menuList);
                var key = $"{bName}___{pSize}";

                if (!aggregated.TryGetValue(key, out var dto))
                {
                    dto = new ItemSalesDto
                    {
                        Id = key,
                        FullName = fName,
                        BaseName = bName,
                        PortionSize = pSize,
                        Category = cat,
                        TotalQuantity = 0,
                        TotalRevenue = 0,
                        UnitPrice = item.Price,
                        OrderCount = 0
                    };
                    aggregated[key] = dto;
                }

                dto.TotalQuantity += item.Quantity;
                dto.TotalRevenue += item.Price * item.Quantity;
                dto.OrderCount += 1;
            }

            var items = aggregated.Values.AsEnumerable();

            if (!string.IsNullOrEmpty(category) && category != "ALL")
            {
                items = items.Where(i => i.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(itemName) && itemName != "ALL")
            {
                items = items.Where(i => i.BaseName.Equals(itemName, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrEmpty(portionSize) && portionSize != "ALL")
            {
                items = items.Where(i => i.PortionSize.Equals(portionSize, StringComparison.OrdinalIgnoreCase));
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim();
                items = items.Where(i =>
                    i.BaseName.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    i.FullName.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    i.Category.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                    i.PortionSize.Contains(q, StringComparison.OrdinalIgnoreCase));
            }

            var filteredList = items.ToList();
            var totalCount = filteredList.Count;
            var totalRevenue = filteredList.Sum(i => i.TotalRevenue);
            var totalQuantity = filteredList.Sum(i => i.TotalQuantity);

            IEnumerable<ItemSalesDto> sorted = sortBy switch
            {
                "qty_desc" => filteredList.OrderByDescending(i => i.TotalQuantity),
                "name_asc" => filteredList.OrderBy(i => i.BaseName, StringComparer.OrdinalIgnoreCase),
                _ => filteredList.OrderByDescending(i => i.TotalRevenue)
            };

            var pagedData = sorted
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();

            return Ok(new PagedItemSalesResult
            {
                Data = pagedData,
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)totalCount / pageSize),
                TotalRevenue = totalRevenue,
                TotalQuantity = totalQuantity
            });
        }


        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] Order order)
        {
            try
            {
                if (string.IsNullOrEmpty(order.Id) || order.Id == "0")
                    order.Id = Guid.NewGuid().ToString();

                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                if (string.IsNullOrEmpty(order.OrderNumber))
                {
                    var todayCount = await _context.Orders
                        .CountAsync(o => o.CreatedAt >= today && o.CreatedAt < tomorrow);
                    order.OrderNumber = (todayCount + 101).ToString();
                }

                order.CreatedAt = DateTime.UtcNow;
                order.Status = OrderStatus.PREPARING;

                if (order.Items != null)
                {
                    foreach (var item in order.Items)
                    {
                        item.OrderId = order.Id;
                        item.Id = Guid.NewGuid().ToString();
                    }
                }

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Deduct stock based on dish estimations
                await DeductStockForOrderAsync(order);

                InvoiceDto invoice = new InvoiceDto
                {
                    Items = order.Items?.Select(i => new InvoiceItemDto
                    {
                        Name = i.Name,
                        Price = i.Price,
                        Qty = i.Quantity
                    }).ToList() ?? new(),
                    Total = order.Total,
                    OrderNo = order.OrderNumber
                };

                return new OkObjectResult(invoice);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error creating order: {ex.Message}");
                if (ex.InnerException != null)
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                return StatusCode(500, "An error occurred while saving the order.");
            }
        }

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateStatus(string id, [FromBody] UpdateOrderStatusDto dto)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound();

            order.Status = dto.Status;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("today-orders")]
        public async Task<ActionResult<List<InvoiceDto>>> GetTodayOrders()
        {
            var today = DateTime.UtcNow.Date;
            var tomorrow = today.AddDays(1);
            var orders = await _context.Orders
                .Where(o => o.CreatedAt >= today && o.CreatedAt < tomorrow)
                .Include(o => o.Items)
                .ToListAsync();

            return orders.Select(order => new InvoiceDto
            {
                Items = order.Items?.Select(i => new InvoiceItemDto
                {
                    Name = i.Name,
                    Price = i.Price,
                    Qty = i.Quantity
                }).ToList() ?? new(),
                Total = order.Total,
                OrderNo = order.OrderNumber
            }).ToList();
        }

        /// <summary>
        /// Matches each order item to a DishEstimation and deducts ingredient stock.
        /// Matches by exact name, "ItemName (Portion)", "ItemName Portion", or base item name.
        /// </summary>
        private async Task DeductStockForOrderAsync(Order order)
        {
            if (order.Items == null || !order.Items.Any()) return;

            var allEstimations = await _context.DishEstimations
                .Include(e => e.Ingredients)
                .ToListAsync();

            if (!allEstimations.Any()) return;

            foreach (var item in order.Items)
            {
                var estimation = FindMatchingEstimation(allEstimations, item.Name);
                if (estimation == null) continue;

                foreach (var ing in estimation.Ingredients)
                {
                    MasterIngredient? stockItem = null;
                    if (!string.IsNullOrEmpty(ing.MasterIngredientId))
                    {
                        stockItem = await _context.MasterIngredients.FindAsync(ing.MasterIngredientId);
                    }

                    if (stockItem == null && !string.IsNullOrWhiteSpace(ing.Name))
                    {
                        var ingNameLower = ing.Name.Trim().ToLower();
                        stockItem = await _context.MasterIngredients
                            .FirstOrDefaultAsync(m => m.Name.ToLower() == ingNameLower);
                    }

                    if (stockItem == null) continue;

                    // Scale by order quantity
                    var totalDeduct = ing.Quantity * item.Quantity;
                    var deductInStockUnit = ConvertUnits(totalDeduct, ing.Unit, stockItem.Unit);

                    stockItem.StockQuantity = Math.Max(0, stockItem.StockQuantity - deductInStockUnit);
                }
            }

            await _context.SaveChangesAsync();
        }

        private static DishEstimation? FindMatchingEstimation(List<DishEstimation> estimations, string? rawItemName)
        {
            if (string.IsNullOrWhiteSpace(rawItemName)) return null;

            string cleanName = rawItemName.Trim();

            // 1. Exact match on ItemName
            var match = estimations.FirstOrDefault(e =>
                e.ItemName.Equals(cleanName, StringComparison.OrdinalIgnoreCase));
            if (match != null) return match;

            // 2. If name has parentheses: e.g. "Chicken Fried Rice (Large)"
            if (cleanName.EndsWith(")") && cleanName.Contains("("))
            {
                int openParen = cleanName.LastIndexOf('(');
                string baseName = cleanName.Substring(0, openParen).Trim();
                string portionName = cleanName.Substring(openParen + 1).Replace(")", "").Trim();

                match = estimations.FirstOrDefault(e =>
                    e.ItemName.Equals(baseName, StringComparison.OrdinalIgnoreCase) &&
                    e.PortionSize.Equals(portionName, StringComparison.OrdinalIgnoreCase));
                if (match != null) return match;

                match = estimations.FirstOrDefault(e =>
                    e.ItemName.Equals(baseName, StringComparison.OrdinalIgnoreCase));
                if (match != null) return match;
            }

            // 3. If name ends with portion size separated by space: "Chicken Fried Rice Large"
            foreach (var e in estimations)
            {
                if (string.IsNullOrWhiteSpace(e.PortionSize)) continue;
                string combined = $"{e.ItemName} {e.PortionSize}".Trim();
                if (combined.Equals(cleanName, StringComparison.OrdinalIgnoreCase))
                {
                    return e;
                }
            }

            // 4. Try match by base name prefix (if cleanName starts with e.ItemName)
            match = estimations
                .Where(e => cleanName.StartsWith(e.ItemName, StringComparison.OrdinalIgnoreCase))
                .OrderByDescending(e => e.ItemName.Length)
                .FirstOrDefault();

            return match;
        }

        private static decimal ConvertUnits(decimal qty, string fromUnit, string toUnit)
        {
            if (fromUnit == toUnit) return qty;

            var from = fromUnit.ToLower();
            var to = toUnit.ToLower();

            if (from == "g" && to == "kg") return qty / 1000m;
            if (from == "kg" && to == "g") return qty * 1000m;
            if (from == "ml" && to == "l") return qty / 1000m;
            if (from == "l" && to == "ml") return qty * 1000m;

            return qty;
        }
    }
}
