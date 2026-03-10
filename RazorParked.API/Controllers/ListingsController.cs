using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Data.SqlClient;
using Dapper;
using RazorParked.API.Data;
using RazorParked.API.Models;

namespace RazorParked.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ListingsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public ListingsController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        [HttpGet]
        public async Task<IActionResult> SearchListings(
            [FromQuery] bool? availability,
            [FromQuery] string? location,
            [FromQuery] DateTime? date)
        {
            var query = _context.ParkingListings.AsQueryable();

            if (availability.HasValue)
                query = query.Where(l => l.IsAvailable == availability.Value);

            if (!string.IsNullOrEmpty(location))
                query = query.Where(l => l.Location.Contains(location));

            if (date.HasValue)
                query = query.Where(l => l.AvailableFrom <= date && l.AvailableTo >= date);

            var listings = await query.ToListAsync();
            return Ok(listings);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateListing(int id, [FromBody] UpdateListingRequest request)
        {
            if (id <= 0 || request.HostUserID <= 0 || string.IsNullOrWhiteSpace(request.Title) || request.PricePerHour <= 0)
                return BadRequest(new { message = "Invalid update data." });

            var connectionString = _config.GetConnectionString("DefaultConnection");

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
                SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            if (ownerId == null) return NotFound(new { message = "Listing not found." });
            if (ownerId != request.HostUserID) return Forbid();

            await connection.ExecuteAsync(@"
                UPDATE dbo.ParkingListings
                SET Title = @Title, Description = @Description, Location = @Location,
                    PricePerHour = @PricePerHour, IsAvailable = @IsAvailable
                WHERE ListingID = @ListingID",
                new { ListingID = id, request.Title, request.Description, request.Location, request.PricePerHour, request.IsAvailable });

            return Ok(new { message = "Listing updated successfully." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteListing(int id, [FromQuery] int hostUserId)
        {
            if (id <= 0 || hostUserId <= 0)
                return BadRequest(new { message = "Invalid delete request." });

            var connectionString = _config.GetConnectionString("DefaultConnection");

            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
                SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            if (ownerId == null) return NotFound(new { message = "Listing not found." });
            if (ownerId != hostUserId) return Forbid();

            await connection.ExecuteAsync(@"
                DELETE FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            return Ok(new { message = "Listing deleted successfully." });
        }

    }
}