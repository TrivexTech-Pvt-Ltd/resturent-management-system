using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Data;
using RestaurantBackend.Models;
using RestaurantBackend.Models.Dto;

namespace RestaurantBackend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DineinController : ControllerBase
{
    private readonly RestaurantDbContext _context;

    public DineinController(RestaurantDbContext context)
    {
        _context = context;
    }

    [HttpGet("table-list")]
    public async Task<IActionResult> GetTableList()
    {
        var tableList = await _context.Orders.
                    Where(x=>x.OrderType==OrderType.DINEIN && x.Status==OrderStatus.PENDING)
                    .OrderBy(x=>x.TableNo)
                    .ToListAsync();

        return Ok(tableList);
    }

    [HttpGet("dinein-order/{id}")]
    public async Task<IActionResult> GetDineinOrderById(string id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.OrderType == OrderType.DINEIN);
        if (order == null)
        {
            return NotFound("Dine-in order not found.");
        }
        return Ok(order);
    }

    [HttpPost("dinein-create")]
    public async Task<IActionResult> CreateDineninOrder([FromBody]Order order)
    {
        if (order.TableNo != 0)
        {
            var existingTable = await _context.Orders
                .AnyAsync(o => o.TableNo == order.TableNo && o.OrderType == OrderType.DINEIN && o.Status == OrderStatus.PENDING);

            if (existingTable)
            {
                return BadRequest($"Table {order.TableNo} is already occupied with a pending order.");
            }
        }

        order.OrderType = OrderType.DINEIN;
        order.Status = OrderStatus.PENDING;
        order.CreatedAt = DateTime.UtcNow;

        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);
        if (string.IsNullOrEmpty(order.OrderNumber))
        {
            var todayCount = await _context.Orders
                    .CountAsync(o => o.CreatedAt >= today && o.CreatedAt < tomorrow);
            order.OrderNumber = (todayCount + 5001).ToString();
        }


        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(order);
    }

    [HttpPost("update-order-details")]
    public async Task<IActionResult> UpdateOrderDetails([FromBody] Order updatedOrder)
    {
        var existingOrder = await _context.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == updatedOrder.Id);
        if (existingOrder == null)
        {
            return NotFound("Order not found.");
        }

        // Update order properties
        existingOrder.Status = updatedOrder.Status;
        existingOrder.Total = updatedOrder.Total;
        existingOrder.PaymentMethod = updatedOrder.PaymentMethod;
        existingOrder.TableNo = updatedOrder.TableNo;

        var itemtoRemove=await _context.OrderItems
            .Where(i => i.OrderId == existingOrder.Id)
            .ToListAsync();
        _context.OrderItems.RemoveRange(itemtoRemove);

        foreach (var incomingItem in updatedOrder.Items)
        {
            var existingItem = existingOrder.Items
                .FirstOrDefault(i => i.Id == incomingItem.Id);

            if (existingItem != null)
            {
                // Update existing item
                existingItem.Name = incomingItem.Name;
                existingItem.Price = incomingItem.Price;
                existingItem.Quantity = incomingItem.Quantity;
                existingItem.Category = incomingItem.Category;
                existingItem.Image = incomingItem.Image;
            }
            else
            {
                // Add new item
                existingOrder.Items.Add(new OrderItem
                {
                    Id = Guid.NewGuid().ToString(),
                    Name = incomingItem.Name,
                    Price = incomingItem.Price,
                    Quantity = incomingItem.Quantity,
                    Category = incomingItem.Category,
                    Image = incomingItem.Image,
                    OrderId = existingOrder.Id
                });
            }
        }

        await _context.SaveChangesAsync();

        // Refetch to ensure we return the complete state as saved in DB
        var savedOrder = await _context.Orders
            .Include(o => o.Items)
            .AsNoTracking() // Ensure we get fresh data
            .FirstOrDefaultAsync(o => o.Id == existingOrder.Id);

        return Ok(savedOrder);
    }

    [HttpPost("close-dinein-order")]
    public async Task<IActionResult> CloseDineinOrder([FromBody] DineinCloseDto model)
    {
        var existingOrder = await _context.Orders.Include(x=>x.Items)
            .FirstOrDefaultAsync(o => o.Id == model.Id && o.OrderType == OrderType.DINEIN);
       
        if (existingOrder == null)
        {
            return NotFound("Dine-in order not found.");
        }

        existingOrder.Status = OrderStatus.COMPLETED;
        existingOrder.Total = model.Total;
        existingOrder.PaymentMethod = model.PaymentMethod;
        existingOrder.TableNo = null;

        await _context.SaveChangesAsync();

        // Deduct stock for all items in the dine-in order
        await DeductStockForOrderAsync(existingOrder.Items);

        InvoiceDto invoice = new InvoiceDto
        {
            Items = existingOrder.Items.Select(i => new InvoiceItemDto
            {
                Name = i.Name,
                Price = i.Price,
                Qty = i.Quantity
            }).ToList(),
            Total = existingOrder.Total,
            OrderNo = existingOrder.OrderNumber
        };

        return new OkObjectResult(invoice);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDineinOrder(string id)
    {
        var existingOrder = await _context.Orders
            .FirstOrDefaultAsync(o => o.Id == id && o.OrderType == OrderType.DINEIN);
        if (existingOrder == null)
        {
            return NotFound("Dine-in order not found.");
        }
        _context.Orders.Remove(existingOrder);
        await _context.SaveChangesAsync();
        return Ok("Dine-in order deleted successfully.");
    }

    /// <summary>Deducts ingredient stock for each item in an order based on DishEstimation linkage.</summary>
    private async Task DeductStockForOrderAsync(ICollection<OrderItem> items)
    {
        if (items == null || !items.Any()) return;

        var allEstimations = await _context.DishEstimations
            .Include(e => e.Ingredients)
            .ToListAsync();

        if (!allEstimations.Any()) return;

        foreach (var item in items)
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

                var totalDeduct = ing.Quantity * item.Quantity;
                var converted = ConvertUnits(totalDeduct, ing.Unit, stockItem.Unit);
                stockItem.StockQuantity = Math.Max(0, stockItem.StockQuantity - converted);
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
