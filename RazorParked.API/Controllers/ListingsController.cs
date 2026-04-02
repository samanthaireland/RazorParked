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
        // ===============================
        // POST /api/Listings/{id}/dates
        // Save selected dates for a listing
        // ===============================
        [HttpPost("{id}/dates")]
        public async Task<IActionResult> AddListingDates(int id, [FromBody] CreateListingDateRequest request)
        {
            if (id <= 0 || request.HostUserID <= 0 || request.Dates == null || !request.Dates.Any())
                return BadRequest(new { message = "Invalid date data." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify listing belongs to this host
            var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
        SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            if (ownerId == null) return NotFound(new { message = "Listing not found." });
            if (ownerId != request.HostUserID) return Forbid();

            foreach (var date in request.Dates)
            {
                await connection.ExecuteAsync(@"
            INSERT INTO dbo.ListingDates (ListingID, ListedDate, Label, CreatedAt)
            VALUES (@ListingID, @ListedDate, @Label, GETUTCDATE())",
                    new { ListingID = id, date.ListedDate, date.Label });
            }

            return StatusCode(201, new { message = "Dates saved successfully." });
        }

        // ===============================
        // GET /api/Listings/{id}/dates
        // Get all listed dates for a listing
        // ===============================
        [HttpGet("{id}/dates")]
        public async Task<IActionResult> GetListingDates(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid listing ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var dates = await connection.QueryAsync<dynamic>(@"
        SELECT DateID, ListingID, ListedDate, Label, CreatedAt
        FROM dbo.ListingDates
        WHERE ListingID = @ListingID
        ORDER BY ListedDate ASC",
                new { ListingID = id });

            return Ok(dates);
        }

        // ===============================
        // DELETE /api/Listings/{id}/dates/{dateId}
        // Remove a specific listed date
        // ===============================
        [HttpDelete("{id}/dates/{dateId}")]
        public async Task<IActionResult> DeleteListingDate(int id, int dateId, [FromQuery] int hostUserId)
        {
            if (id <= 0 || dateId <= 0 || hostUserId <= 0)
                return BadRequest(new { message = "Invalid request." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify listing belongs to this host
            var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
        SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            if (ownerId == null) return NotFound(new { message = "Listing not found." });
            if (ownerId != hostUserId) return Forbid();

            var affected = await connection.ExecuteAsync(@"
        DELETE FROM dbo.ListingDates
        WHERE DateID = @DateID AND ListingID = @ListingID",
                new { DateID = dateId, ListingID = id });

            if (affected == 0)
                return NotFound(new { message = "Date not found." });

            return Ok(new { message = "Date removed successfully." });
        }
        // ===============================
        // POST /api/Listings/bulk
        // Create multiple listings at once
        // ===============================
        [HttpPost("bulk")]
        public async Task<IActionResult> CreateBulkListings([FromBody] BulkListingRequest request)
        {
            if (request.HostUserID <= 0 || request.Listings == null || !request.Listings.Any())
                return BadRequest(new { message = "Invalid bulk listing data." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify host exists
            var hostExists = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT UserID FROM dbo.Users WHERE UserID = @HostUserID",
                new { request.HostUserID });

            if (hostExists == null)
                return NotFound(new { message = "Host user not found." });

            var createdIds = new List<int>();

            foreach (var listing in request.Listings)
            {
                var newId = await connection.QuerySingleAsync<int>(@"
            INSERT INTO dbo.ParkingListings 
                (HostUserID, Title, Description, Location, PricePerHour, IsAvailable, AvailableFrom, AvailableTo)
            VALUES 
                (@HostUserID, @Title, @Description, @Location, @PricePerHour, 1, @AvailableFrom, @AvailableTo);
            SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        HostUserID = request.HostUserID,
                        listing.Title,
                        listing.Description,
                        listing.Location,
                        listing.PricePerHour,
                        listing.AvailableFrom,
                        listing.AvailableTo
                    });

                createdIds.Add(newId);
            }

            return StatusCode(201, new
            {
                message = $"{createdIds.Count} listings created successfully.",
                listingIds = createdIds
            });
        }

        // ===============================
        // PATCH /api/Listings/{id}/businessHours
        // Set business hours for a listing
        // ===============================
        [HttpPatch("{id}/businessHours")]
        public async Task<IActionResult> SetBusinessHours(int id, [FromBody] BusinessHoursRequest request)
        {
            if (id <= 0 || request.HostUserID <= 0 || request.Hours == null || !request.Hours.Any())
                return BadRequest(new { message = "Invalid business hours data." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify listing belongs to this host
            var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
        SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            if (ownerId == null) return NotFound(new { message = "Listing not found." });
            if (ownerId != request.HostUserID) return Forbid();

            // Clear existing hours and replace
            await connection.ExecuteAsync(@"
        DELETE FROM dbo.BusinessHours WHERE ListingID = @ListingID",
                new { ListingID = id });

            foreach (var hour in request.Hours)
            {
                await connection.ExecuteAsync(@"
            INSERT INTO dbo.BusinessHours (ListingID, DayOfWeek, OpenTime, CloseTime, CreatedAt)
            VALUES (@ListingID, @DayOfWeek, @OpenTime, @CloseTime, GETUTCDATE())",
                    new { ListingID = id, hour.DayOfWeek, hour.OpenTime, hour.CloseTime });
            }

            return Ok(new { message = "Business hours updated successfully." });
        }

        // ===============================
        // PATCH /api/Listings/{id}/disable
        // Temporarily disable or enable a listing
        // ===============================
        [HttpPatch("{id}/disable")]
        public async Task<IActionResult> DisableListing(int id, [FromBody] DisableListingRequest request)
        {
            if (id <= 0 || request.HostUserID <= 0)
                return BadRequest(new { message = "Invalid request." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify listing belongs to this host
            var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
        SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { ListingID = id });

            if (ownerId == null) return NotFound(new { message = "Listing not found." });
            if (ownerId != request.HostUserID) return Forbid();

            await connection.ExecuteAsync(@"
        UPDATE dbo.ParkingListings
        SET IsDisabled = @IsDisabled
        WHERE ListingID = @ListingID",
                new { ListingID = id, request.IsDisabled });

            var status = request.IsDisabled ? "disabled" : "enabled";
            return Ok(new { message = $"Listing {status} successfully.", isDisabled = request.IsDisabled });
        }
    } 
}