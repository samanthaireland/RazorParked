using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
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
        private readonly IConfiguration _config;

        public ListingsController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ===============================
        // GET /api/Listings
        // Search listings with filters
        // ===============================
        [HttpGet]
        public async Task<IActionResult> SearchListings(
            [FromQuery] bool? availability,
            [FromQuery] string? location,
            [FromQuery] DateTime? date,
            [FromQuery] decimal? maxPrice)
        {
            var query = _context.ParkingListings.AsQueryable();

            if (availability.HasValue)
                query = query.Where(l => l.IsAvailable == availability.Value);

            if (!string.IsNullOrEmpty(location))
                query = query.Where(l => l.Location.Contains(location));

            if (date.HasValue)
                query = query.Where(l => l.AvailableFrom <= date && l.AvailableTo >= date);

            if (maxPrice.HasValue)
                query = query.Where(l => l.PricePerHour <= maxPrice.Value);

            var listings = await query.ToListAsync();
            return Ok(listings);
        }

        // ===============================
        // GET /api/Listings/{id}
        // Get single listing by ID
        // ===============================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetListingById(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid listing ID." });

            var listing = await _context.ParkingListings
                .FirstOrDefaultAsync(l => l.ListingID == id);

            if (listing == null)
                return NotFound(new { message = "Listing not found." });

            // Return approximate location only (hide exact address before booking)
            return Ok(new
            {
                listing.ListingID,
                listing.HostUserID,
                listing.Title,
                listing.Description,
                listing.PricePerHour,
                listing.IsAvailable,
                listing.AvailableFrom,
                listing.AvailableTo,
                ApproximateLocation = listing.Location.Split(',')[0].Trim() // city/area only
            });
        }

        // ===============================
        // GET /api/Listings/host/{hostId}
        // Get all listings for a specific host
        // ===============================
        [HttpGet("host/{hostId}")]
        public async Task<IActionResult> GetListingsByHost(int hostId)
        {
            if (hostId <= 0)
                return BadRequest(new { message = "Invalid host ID." });

            var listings = await _context.ParkingListings
                .Where(l => l.HostUserID == hostId)
                .ToListAsync();

            return Ok(listings);
        }

        // ===============================
        // GET /api/Listings/locations
        // Get all listings with coordinates for map view
        // ===============================
        [HttpGet("locations")]
        public async Task<IActionResult> GetListingLocations()
        {
            var listings = await _context.ParkingListings
                .Where(l => l.IsAvailable)
                .Select(l => new
                {
                    l.ListingID,
                    l.Title,
                    l.Location,
                    l.PricePerHour,
                    l.Latitude,
                    l.Longitude
                })
                .ToListAsync();

            return Ok(listings);
        }

        // ===============================
        // POST /api/Listings
        // Create a new listing
        // ===============================
        [HttpPost]
        public async Task<IActionResult> CreateListing([FromBody] CreateListingRequest request)
        {
            if (request.HostUserID <= 0 ||
                string.IsNullOrWhiteSpace(request.Title) ||
                string.IsNullOrWhiteSpace(request.Location) ||
                request.PricePerHour <= 0)
                return BadRequest(new { message = "Invalid listing data." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify host exists
            var hostExists = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT UserID FROM dbo.Users WHERE UserID = @HostUserID",
                new { request.HostUserID });

            if (hostExists == null)
                return NotFound(new { message = "Host user not found." });

            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.ParkingListings 
                    (HostUserID, Title, Description, Location, PricePerHour, IsAvailable, AvailableFrom, AvailableTo)
                VALUES 
                    (@HostUserID, @Title, @Description, @Location, @PricePerHour, 1, @AvailableFrom, @AvailableTo);
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.HostUserID,
                    request.Title,
                    request.Description,
                    request.Location,
                    request.PricePerHour,
                    AvailableFrom = request.AvailableFrom,
                    AvailableTo = request.AvailableTo
                });

            return StatusCode(201, new { message = "Listing created successfully.", listingId = newId });
        }

        // ===============================
        // PUT /api/Listings/{id}
        // Update an existing listing
        // ===============================
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateListing(int id, [FromBody] UpdateListingRequest request)
        {
            if (id <= 0 || request.HostUserID <= 0 ||
                string.IsNullOrWhiteSpace(request.Title) ||
                request.PricePerHour <= 0)
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
                new
                {
                    ListingID = id,
                    request.Title,
                    request.Description,
                    request.Location,
                    request.PricePerHour,
                    request.IsAvailable
                });

            return Ok(new { message = "Listing updated successfully." });
        }

        // ===============================
        // DELETE /api/Listings/{id}
        // Delete a listing (owner only)
        // ===============================
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