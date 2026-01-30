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
        public async Task<IActionResult> UpdateMenuItem(
      string id,
      UpdateMenuItemDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            // Load existing MenuItem with portions
            var menuItem = await _context.MenuItems
                .Include(m => m.Portions)
                .FirstOrDefaultAsync(m => m.Id == id);

            if (menuItem == null)
                return NotFound();

            // Update MenuItem fields
            menuItem.Name = dto.Name;
            menuItem.Category = dto.Category;
            menuItem.Image = dto.Image;

            // ================================
            // Update / Add Portions
            // ================================
            foreach (var portionDto in dto.Portions)
            {
                // UPDATE existing portion
                if (!string.IsNullOrWhiteSpace(portionDto.Id))
                {
                    var existingPortion = menuItem.Portions
                        .FirstOrDefault(p => p.Id == portionDto.Id);

                    if (existingPortion == null)
                        return BadRequest($"Invalid portion id: {portionDto.Id}");

                    existingPortion.Size = portionDto.Size;
                    existingPortion.Price = portionDto.Price;
                }
                // ADD new portion
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

            // OPTIONAL: remove deleted portions
            var dtoPortionIds = dto.Portions
                .Where(p => !string.IsNullOrWhiteSpace(p.Id))
                .Select(p => p.Id!)
                .ToHashSet();

            var portionsToRemove = menuItem.Portions
                .Where(p => !dtoPortionIds.Contains(p.Id))
                .ToList();

            foreach (var p in portionsToRemove)
            {
                _context.MenuItemPortions.Remove(p);
            }

            await _context.SaveChangesAsync();

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
