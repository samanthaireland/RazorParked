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
}