using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Data;
using RestaurantBackend.Models;

namespace RestaurantBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MenuController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public MenuController(RestaurantDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMenu()
        {
            var menu = await _context.MenuItems
         .Include(m => m.Portions)
         .Select(m => new MenuItemResponseDto
         {
             Id = m.Id,
             Name = m.Name,
             Category = m.Category,
             Image = m.Image,
             Portions = m.Portions.Select(p => new MenuItemPortionResponseDto
             {
                 Id = p.Id,
                 Size = p.Size,
                 Price = p.Price
             }).ToList()
         })
         .ToListAsync();

            return Ok(menu);
        }

        [HttpPost]
        public async Task<ActionResult<MenuItem>> CreateMenuItem(CreateMenuItemDto dto)
        {

            var menuItem = new MenuItem
            {
                Name = dto.Name,
                Category = dto.Category,
                Image = dto.Image
            };

            foreach (var p in dto.Portions)
            {
                menuItem.Portions.Add(new MenuItemPortion
                {
                    Size = p.Size,
                    Price = p.Price
                });
            }

            await _context.MenuItems.AddAsync(menuItem);

            await _context.SaveChangesAsync();


            return Ok();
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateMenuItem(string id, MenuItem item)
        {
            if (id != item.Id)
            {
                return BadRequest();
            }

            _context.Entry(item).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MenuItemExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMenuItem(string id)
        {
            var item = await _context.MenuItems.FindAsync(id);
            if (item == null)
            {
                return NotFound();
            }

            _context.MenuItems.Remove(item);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool MenuItemExists(string id)
        {
            return _context.MenuItems.Any(e => e.Id == id);
        }
    }
}
