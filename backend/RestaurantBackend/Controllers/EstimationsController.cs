using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RestaurantBackend.Data;
using RestaurantBackend.Models;
using RestaurantBackend.Models.Dto;

namespace RestaurantBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstimationsController : ControllerBase
    {
        private readonly RestaurantDbContext _context;

        public EstimationsController(RestaurantDbContext context)
        {
            _context = context;
        }

        // GET: api/Estimations
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var estimations = await _context.DishEstimations
                .Include(e => e.Ingredients)
                .OrderByDescending(e => e.UpdatedAt)
                .Select(e => MapToResponse(e))
                .ToListAsync();

            return Ok(estimations);
        }

        // GET: api/Estimations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(string id)
        {
            var estimation = await _context.DishEstimations
                .Include(e => e.Ingredients)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (estimation == null)
                return NotFound();

            return Ok(MapToResponse(estimation));
        }

        // POST: api/Estimations
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateDishEstimationDto dto)
        {
            var estimation = new DishEstimation
            {
                Category = dto.Category,
                MenuItemId = string.IsNullOrWhiteSpace(dto.MenuItemId) ? null : dto.MenuItemId,
                ItemName = dto.ItemName,
                PortionSize = dto.PortionSize,
                SellingPrice = dto.SellingPrice,
                TotalCost = dto.TotalCost,
                GrossProfit = dto.GrossProfit,
                ProfitMargin = dto.ProfitMargin,
                FoodCostPercentage = dto.FoodCostPercentage,
                Notes = dto.Notes,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            foreach (var ing in dto.Ingredients)
            {
                estimation.Ingredients.Add(new EstimationIngredient
                {
                    Name = ing.Name,
                    Quantity = ing.Quantity,
                    Unit = ing.Unit,
                    Cost = ing.Cost,
                    MasterIngredientId = string.IsNullOrWhiteSpace(ing.MasterIngredientId) ? null : ing.MasterIngredientId
                });
            }

            _context.DishEstimations.Add(estimation);
            await _context.SaveChangesAsync();

            return Ok(MapToResponse(estimation));
        }

        // PUT: api/Estimations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(string id, [FromBody] UpdateDishEstimationDto dto)
        {
            if (id != dto.Id)
                return BadRequest("ID mismatch");

            var estimation = await _context.DishEstimations
                .Include(e => e.Ingredients)
                .FirstOrDefaultAsync(e => e.Id == id);

            if (estimation == null)
                return NotFound();

            estimation.Category = dto.Category;
            estimation.MenuItemId = string.IsNullOrWhiteSpace(dto.MenuItemId) ? null : dto.MenuItemId;
            estimation.ItemName = dto.ItemName;
            estimation.PortionSize = dto.PortionSize;
            estimation.SellingPrice = dto.SellingPrice;
            estimation.TotalCost = dto.TotalCost;
            estimation.GrossProfit = dto.GrossProfit;
            estimation.ProfitMargin = dto.ProfitMargin;
            estimation.FoodCostPercentage = dto.FoodCostPercentage;
            estimation.Notes = dto.Notes;
            estimation.UpdatedAt = DateTime.UtcNow;

            // Remove old ingredients and replace
            _context.EstimationIngredients.RemoveRange(estimation.Ingredients);
            estimation.Ingredients.Clear();

            foreach (var ing in dto.Ingredients)
            {
                estimation.Ingredients.Add(new EstimationIngredient
                {
                    Name = ing.Name,
                    Quantity = ing.Quantity,
                    Unit = ing.Unit,
                    Cost = ing.Cost,
                    MasterIngredientId = string.IsNullOrWhiteSpace(ing.MasterIngredientId) ? null : ing.MasterIngredientId
                });
            }

            await _context.SaveChangesAsync();
            return Ok(MapToResponse(estimation));
        }

        // DELETE: api/Estimations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var estimation = await _context.DishEstimations.FindAsync(id);
            if (estimation == null)
                return NotFound();

            _context.DishEstimations.Remove(estimation);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private static DishEstimationResponseDto MapToResponse(DishEstimation e) => new()
        {
            Id = e.Id,
            Category = e.Category,
            MenuItemId = e.MenuItemId,
            ItemName = e.ItemName,
            PortionSize = e.PortionSize,
            SellingPrice = e.SellingPrice,
            TotalCost = e.TotalCost,
            GrossProfit = e.GrossProfit,
            ProfitMargin = e.ProfitMargin,
            FoodCostPercentage = e.FoodCostPercentage,
            Notes = e.Notes,
            CreatedAt = e.CreatedAt,
            UpdatedAt = e.UpdatedAt,
            Ingredients = e.Ingredients.Select(i => new EstimationIngredientResponseDto
            {
                Id = i.Id,
                Name = i.Name,
                Quantity = i.Quantity,
                Unit = i.Unit,
                Cost = i.Cost,
                MasterIngredientId = i.MasterIngredientId
            }).ToList()
        };
    }
}
