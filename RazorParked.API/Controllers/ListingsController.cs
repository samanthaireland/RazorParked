using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ListingsController : ControllerBase
{
    private readonly IConfiguration _config;

    public ListingsController(IConfiguration config)
    {
        _config = config;
    }

    [HttpPost]
    public async Task<IActionResult> CreateListing([FromBody] CreateListingRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            request.PricePerHour <= 0)
        {
            return BadRequest(new { message = "Invalid listing data." });
        }

        var connectionString = _config.GetConnectionString("DefaultConnection");

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        await connection.ExecuteAsync(@"
            INSERT INTO dbo.ParkingListings
            (HostUserID, Title, Description, Location, PricePerHour, IsAvailable, CreatedDate)
            VALUES
            (@HostUserID, @Title, @Description, @Location, @PricePerHour, 1, GETDATE())",
            request);

        return StatusCode(201, new { message = "Listing created successfully." });
    }
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateListing(int id, [FromBody] UpdateListingRequest request)
    {
        if (id <= 0 || request.HostUserID <= 0 || string.IsNullOrWhiteSpace(request.Title) || request.PricePerHour <= 0)
        {
            return BadRequest(new { message = "Invalid update data." });
        }

        var connectionString = _config.GetConnectionString("DefaultConnection");

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
        SELECT HostUserID
        FROM dbo.ParkingListings
        WHERE ListingID = @ListingID",
            new { ListingID = id });

        if (ownerId == null)
            return NotFound(new { message = "Listing not found." });

        if (ownerId != request.HostUserID)
            return Forbid();

        await connection.ExecuteAsync(@"
        UPDATE dbo.ParkingListings
        SET Title = @Title,
            Description = @Description,
            Location = @Location,
            PricePerHour = @PricePerHour,
            IsAvailable = @IsAvailable
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
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteListing(int id, [FromQuery] int hostUserId)
    {
        if (id <= 0 || hostUserId <= 0)
            return BadRequest(new { message = "Invalid delete request." });

        var connectionString = _config.GetConnectionString("DefaultConnection");

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        var ownerId = await connection.QuerySingleOrDefaultAsync<int?>(@"
        SELECT HostUserID
        FROM dbo.ParkingListings
        WHERE ListingID = @ListingID",
            new { ListingID = id });

        if (ownerId == null)
            return NotFound(new { message = "Listing not found." });

        if (ownerId != hostUserId)
            return Forbid();

        await connection.ExecuteAsync(@"
        DELETE FROM dbo.ParkingListings
        WHERE ListingID = @ListingID",
            new { ListingID = id });

        return Ok(new { message = "Listing deleted successfully." });
    }

}