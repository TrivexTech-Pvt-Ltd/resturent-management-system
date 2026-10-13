using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Data;
using RestaurantBackend.Models;
using RestaurantBackend.Models.Dto;

namespace RestaurantBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class IngredientsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public IngredientsController(RestaurantDbContext context)
        {
            _context = context;
        }

        // GET: api/Ingredients
        [HttpGet]
        public async Task<ActionResult<IEnumerable<MasterIngredientResponseDto>>> GetIngredients()
        {
            var ingredients = await _context.MasterIngredients
                .OrderBy(i => i.Name)
                .ToListAsync();

            return Ok(ingredients.Select(ToResponseDto));
        }

        // GET: api/Ingredients/5
        [HttpGet("{id}")]
        public async Task<ActionResult<MasterIngredientResponseDto>> GetIngredient(string id)
        {
            var ingredient = await _context.MasterIngredients.FindAsync(id);
            if (ingredient == null)
                return NotFound();

            return Ok(ToResponseDto(ingredient));
        }

        // POST: api/Ingredients
        [HttpPost]
        public async Task<ActionResult<MasterIngredientResponseDto>> CreateIngredient(MasterIngredientDto dto)
        {
            var ingredient = new MasterIngredient
            {
                Name = dto.Name.Trim(),
                Unit = dto.Unit,
                StandardQuantity = dto.StandardQuantity <= 0 ? 1 : dto.StandardQuantity,
                UnitCost = dto.UnitCost,
                StockQuantity = dto.StockQuantity < 0 ? 0 : dto.StockQuantity,
                Category = dto.Category?.Trim()
            };

            _context.MasterIngredients.Add(ingredient);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetIngredient), new { id = ingredient.Id }, ToResponseDto(ingredient));
        }

        // PUT: api/Ingredients/5
        [HttpPut("{id}")]
        public async Task<ActionResult<MasterIngredientResponseDto>> UpdateIngredient(string id, MasterIngredientDto dto)
        {
            var ingredient = await _context.MasterIngredients.FindAsync(id);
            if (ingredient == null)
                return NotFound();

            ingredient.Name = dto.Name.Trim();
            ingredient.Unit = dto.Unit;
            ingredient.StandardQuantity = dto.StandardQuantity <= 0 ? 1 : dto.StandardQuantity;
            ingredient.UnitCost = dto.UnitCost;
            ingredient.StockQuantity = dto.StockQuantity < 0 ? 0 : dto.StockQuantity;
            ingredient.Category = dto.Category?.Trim();

            await _context.SaveChangesAsync();

            return Ok(ToResponseDto(ingredient));
        }

        // PATCH: api/Ingredients/5/adjust-stock
        // Adds (positive delta) or deducts (negative delta) from StockQuantity
        [HttpPatch("{id}/adjust-stock")]
        public async Task<ActionResult<MasterIngredientResponseDto>> AdjustStock(string id, [FromBody] AdjustStockDto dto)
        {
            var ingredient = await _context.MasterIngredients.FindAsync(id);
            if (ingredient == null)
                return NotFound();

            ingredient.StockQuantity = Math.Max(0, ingredient.StockQuantity + dto.Delta);
            await _context.SaveChangesAsync();

            return Ok(ToResponseDto(ingredient));
        }

        // DELETE: api/Ingredients/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIngredient(string id)
        {
            var ingredient = await _context.MasterIngredients.FindAsync(id);
            if (ingredient == null)
                return NotFound();

            _context.MasterIngredients.Remove(ingredient);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private static MasterIngredientResponseDto ToResponseDto(MasterIngredient i) => new()
        {
            Id = i.Id,
            Name = i.Name,
            Unit = i.Unit,
            StandardQuantity = i.StandardQuantity,
            UnitCost = i.UnitCost,
            StockQuantity = i.StockQuantity,
            Category = i.Category
        };
    }
}
