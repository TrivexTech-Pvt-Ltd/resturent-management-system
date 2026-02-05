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
            return await _context.Orders.Include(o => o.Items).ToListAsync();
        }

        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] Order order)
        {
            try
            {
                // Ensure ID is generated if not provided
                if (string.IsNullOrEmpty(order.Id) || order.Id == "0")
                {
                    order.Id = Guid.NewGuid().ToString();
                }

                var today = DateTime.UtcNow.Date;
                var tomorrow = today.AddDays(1);

                if (string.IsNullOrEmpty(order.OrderNumber))
                {
                    var todayCount = await _context.Orders
                            .CountAsync(o => o.CreatedAt >= today && o.CreatedAt < tomorrow);
                    order.OrderNumber = (todayCount + 101).ToString();
                }

                order.CreatedAt = DateTime.UtcNow;

                // Set OrderId and unique Id for each item
                if (order.Items != null)
                {
                    foreach (var item in order.Items)
                    {
                        item.OrderId = order.Id;
                        // Always generate a new unique ID for the order item record
                        item.Id = Guid.NewGuid().ToString();
                    }
                }

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                InvoiceDto invoice = new InvoiceDto
                {
                    Items = order.Items.Select(i => new InvoiceItemDto
                    {
                        Name = i.Name,
                        Price = i.Price,
                        Qty = i.Quantity
                    }).ToList(),
                    Total = order.Total,
                    OrderNo = order.OrderNumber
                };


                return new OkObjectResult(invoice);
            }
            catch (Exception ex)
            {
                // Log the exception details
                Console.WriteLine($"Error creating order: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                }
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
              //  .Where(o => o.CreatedAt >= today && o.CreatedAt < tomorrow)
                .Include(o => o.Items)
                .ToListAsync();

            return orders.Select(order => new InvoiceDto
            {
                Items = order.Items.Select(i => new InvoiceItemDto
                {
                    Name = i.Name,
                    Price = i.Price,
                    Qty = i.Quantity
                }).ToList(),
                Total = order.Total,
                OrderNo = order.OrderNumber
            }).ToList();
        }
    }

}
