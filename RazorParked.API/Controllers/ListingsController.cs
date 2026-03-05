using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RazorParked.API.Data;
using RazorParked.API.Models;

namespace RazorParked.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ListingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ListingsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Listings
        [HttpGet]
        public async Task<IActionResult> SearchListings(
            [FromQuery] bool? availability,
            [FromQuery] string? location,
            [FromQuery] DateTime? date)
        {
            var query = _context.ParkingListings.AsQueryable();

            // Filter by availability
            if (availability.HasValue)
            {
                query = query.Where(l => l.IsAvailable == availability.Value);
            }

            // Filter by location
            if (!string.IsNullOrEmpty(location))
            {
                query = query.Where(l => l.Location.Contains(location));
            }

            // Filter by date
            if (date.HasValue)
            {
                query = query.Where(l =>
                    l.AvailableFrom <= date &&
                    l.AvailableTo >= date);
            }

            var listings = await query.ToListAsync();

            return Ok(listings);
        }
    }
}