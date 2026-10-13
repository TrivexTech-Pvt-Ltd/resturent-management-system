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
        public async Task<ActionResult<IEnumerable<Order>>> GetOrders()
        {
            return await _context.Orders.Include(o => o.Items).OrderBy(x => x.OrderNumber).ThenBy(x => x.CreatedAt).ToListAsync();
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
