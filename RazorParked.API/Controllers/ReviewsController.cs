using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly IConfiguration _config;

        public ReviewsController(IConfiguration config)
        {
            _config = config;
        }

        // ===============================
        // POST /api/Reviews
        // Submit a review for a listing
        // ===============================
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
        {
            if (request.ListingID <= 0 || request.UserID <= 0 || request.ReservationID <= 0)
                return BadRequest(new { message = "Invalid review data." });

            if (request.StarRating < 1 || request.StarRating > 5)
                return BadRequest(new { message = "Star rating must be between 1 and 5." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify reservation exists, belongs to this user, and is completed
            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ReservationID, DriverUserID, Status
                FROM dbo.Reservations
                WHERE ReservationID = @ReservationID",
                new { request.ReservationID });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            if ((int)reservation.DriverUserID != request.UserID)
                return Forbid();

            if ((string)reservation.Status != "Confirmed" && (string)reservation.Status != "Completed")
                return BadRequest(new { message = "You can only review completed reservations." });

            // Check if user already reviewed this listing for this reservation
            var existing = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ReviewID FROM dbo.Reviews
                WHERE ReservationID = @ReservationID AND UserID = @UserID",
                new { request.ReservationID, request.UserID });

            if (existing != null)
                return Conflict(new { message = "You have already reviewed this reservation." });

            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.Reviews (ListingID, UserID, ReservationID, StarRating, Comment, CreatedAt)
                VALUES (@ListingID, @UserID, @ReservationID, @StarRating, @Comment, GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.ListingID,
                    request.UserID,
                    request.ReservationID,
                    request.StarRating,
                    request.Comment
                });

            return StatusCode(201, new { message = "Review submitted successfully.", reviewId = newId });
        }

        // ===============================
        // GET /api/Reviews/listing/{listingId}
        // Get all reviews for a listing
        // ===============================
        [HttpGet("listing/{listingId}")]
        public async Task<IActionResult> GetReviewsByListing(int listingId)
        {
            if (listingId <= 0)
                return BadRequest(new { message = "Invalid listing ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var reviews = await connection.QueryAsync<dynamic>(@"
                SELECT r.ReviewID, r.ListingID, r.UserID, r.StarRating, r.Comment, r.CreatedAt,
                       u.FullName AS ReviewerName
                FROM dbo.Reviews r
                INNER JOIN dbo.Users u ON r.UserID = u.UserID
                WHERE r.ListingID = @ListingID
                ORDER BY r.CreatedAt DESC",
                new { ListingID = listingId });

            var reviewList = reviews.ToList();
            var avgRating = reviewList.Any()
                ? reviewList.Average(r => (double)r.StarRating)
                : 0;

            return Ok(new
            {
                listingId,
                averageRating = Math.Round(avgRating, 1),
                totalReviews = reviewList.Count,
                reviews = reviewList
            });
        }
    }
}