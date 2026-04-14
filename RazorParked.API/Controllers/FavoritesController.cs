using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FavoritesController : ControllerBase
    {
        private readonly IConfiguration _config;

        public FavoritesController(IConfiguration config)
        {
            _config = config;
        }

        // ===============================
        // POST /api/Favorites
        // Save a listing to favorites
        // ===============================
        [HttpPost]
        public async Task<IActionResult> AddFavorite([FromBody] CreateFavoriteRequest request)
        {
            if (request.UserID <= 0 || request.ListingID <= 0)
                return BadRequest(new { message = "Invalid favorite data." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Check if already favorited
            var existing = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT FavoriteID FROM dbo.Favorites
                WHERE UserID = @UserID AND ListingID = @ListingID",
                new { request.UserID, request.ListingID });

            if (existing != null)
                return Conflict(new { message = "Listing already in favorites." });

            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.Favorites (UserID, ListingID, CreatedAt)
                VALUES (@UserID, @ListingID, GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new { request.UserID, request.ListingID });

            return StatusCode(201, new { message = "Added to favorites.", favoriteId = newId });
        }

        // ===============================
        // GET /api/Favorites/user/{userId}
        // Get all favorites for a user
        // ===============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetFavoritesByUser(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var favorites = await connection.QueryAsync<dynamic>(@"
                SELECT f.FavoriteID, f.UserID, f.ListingID, f.CreatedAt,
                       p.Title, p.Location, p.PricePerHour, p.IsAvailable
                FROM dbo.Favorites f
                INNER JOIN dbo.ParkingListings p ON f.ListingID = p.ListingID
                WHERE f.UserID = @UserID
                ORDER BY f.CreatedAt DESC",
                new { UserID = userId });

            return Ok(favorites);
        }

        // ===============================
        // DELETE /api/Favorites/{favoriteId}
        // Remove a listing from favorites
        // ===============================
        [HttpDelete("{favoriteId}")]
        public async Task<IActionResult> DeleteFavorite(int favoriteId, [FromQuery] int userId)
        {
            if (favoriteId <= 0 || userId <= 0)
                return BadRequest(new { message = "Invalid request." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var ownerId = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT UserID FROM dbo.Favorites WHERE FavoriteID = @FavoriteID",
                new { FavoriteID = favoriteId });

            if (ownerId == null)
                return NotFound(new { message = "Favorite not found." });

            if (ownerId != userId)
                return Forbid();

            await connection.ExecuteAsync(@"
                DELETE FROM dbo.Favorites WHERE FavoriteID = @FavoriteID",
                new { FavoriteID = favoriteId });

            return Ok(new { message = "Removed from favorites." });
        }
    }
}