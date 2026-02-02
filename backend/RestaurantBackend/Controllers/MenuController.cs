using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Data;
using RestaurantBackend.Models;
using RestaurantBackend.Models.Dto;

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
        public async Task<IActionResult> UpdateMenuItem(string id, UpdateMenuItemDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var menuItem = await _context.MenuItems
                .Include(m => m.Portions)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
                return NotFound();

            // Update MenuItem
            menuItem.Name = dto.Name;
            menuItem.Category = dto.Category;
            menuItem.Image = dto.Image;

            // DTO portion IDs (existing only)
            var dtoPortionIds = dto.Portions
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .Select(p => p.Id!)
                .ToHashSet();

            foreach (var portionDto in dto.Portions)
            {
                if (!string.IsNullOrWhiteSpace(portionDto.Id))
                {
                    var portion = menuItem.Portions
                        .FirstOrDefault(p => p.Id == portionDto.Id);

                    if (portion == null)
                        return BadRequest($"Invalid portion id: {portionDto.Id}");

                    portion.Size = portionDto.Size;
                    portion.Price = portionDto.Price;
                    portion.IsAvailable = true;
                }
                else
                {
                    menuItem.Portions.Add(new MenuItemPortion
                    {
                        Size = portionDto.Size,
                        Price = portionDto.Price,
                        IsAvailable = true
                    });
                }
            }

            await _context.MenuItemPortions
                .Where(p =>
                    p.MenuItemId == menuItem.Id &&
                    !dtoPortionIds.Contains(p.Id))
                .ExecuteDeleteAsync();

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                return Conflict("Menu item was modified by another user.");
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
