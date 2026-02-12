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
                    Where(x=>x.OrderType==OrderType.DINEIN && x.Status==OrderStatus.PENDING).ToListAsync();

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
}
