using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using RazorParked.API.Data;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReservationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public ReservationsController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ===============================
        // POST /api/Reservations
        // Create a new reservation
        // ===============================
        [HttpPost]
        public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
        {
            if (request.ListingID <= 0 || request.DriverUserID <= 0)
                return BadRequest(new { message = "Invalid reservation data." });

            if (request.ReservationStart >= request.ReservationEnd)
                return BadRequest(new { message = "Reservation end time must be after start time." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Check listing exists and is available
            var listing = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ListingID, Title, IsAvailable, HostUserID 
                FROM dbo.ParkingListings 
                WHERE ListingID = @ListingID",
                new { request.ListingID });

            if (listing == null)
                return NotFound(new { message = "Listing not found." });

            if (!(bool)listing.IsAvailable)
                return BadRequest(new { message = "This listing is not available." });

            // Check driver is not the host
            if ((int)listing.HostUserID == request.DriverUserID)
                return BadRequest(new { message = "Hosts cannot reserve their own listing." });

            // Check for conflicting reservations
            var conflict = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ReservationID FROM dbo.Reservations
                WHERE ListingID = @ListingID
                AND Status = 'Confirmed'
                AND NOT (@ReservationEnd <= ReservationStart OR @ReservationStart >= ReservationEnd)",
                new
                {
                    request.ListingID,
                    request.ReservationStart,
                    request.ReservationEnd
                });

            if (conflict != null)
                return Conflict(new { message = "This listing is already reserved for that time." });

            // Generate assigned spot number
            var spotCount = await connection.QuerySingleAsync<int>(@"
                SELECT COUNT(*) FROM dbo.Reservations WHERE ListingID = @ListingID",
                new { request.ListingID });

            var assignedSpot = $"SPOT-{request.ListingID}-{spotCount + 1}";

            // Insert reservation
            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.Reservations 
                    (ListingID, DriverUserID, AssignedSpotNumber, ReservationStart, ReservationEnd, Status, CreatedAt)
                VALUES 
                    (@ListingID, @DriverUserID, @AssignedSpotNumber, @ReservationStart, @ReservationEnd, 'Confirmed', GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.ListingID,
                    request.DriverUserID,
                    AssignedSpotNumber = assignedSpot,
                    request.ReservationStart,
                    request.ReservationEnd
                });

            // Carter: Auto-create notification for driver on reservation
            await connection.ExecuteAsync(@"
                INSERT INTO dbo.Notifications (UserID, ReservationID, Type, Message, IsRead, CreatedAt)
                VALUES (@UserID, @ReservationID, 'ReservationConfirmed', 
                    @Message, 0, GETUTCDATE());",
                new
                {
                    UserID = request.DriverUserID,
                    ReservationID = newId,
                    Message = $"Your reservation has been confirmed! Spot {assignedSpot} is ready."
                });

            // ── Auto-message: create/find conversation and post system message ──
            // Get driver's name
            var driver = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT FullName FROM dbo.Users WHERE UserID = @UserID",
                new { UserID = request.DriverUserID });

            string driverName = driver?.FullName ?? "A driver";
            string listingTitle = (string)listing.Title;
            int hostUserId = (int)listing.HostUserID;

            // Format: "DRIVER reserved LISTING for MMMM d from h:mm tt – h:mm tt"
            string dateStr = request.ReservationStart.ToString("MMMM d");
            string startTime = request.ReservationStart.ToString("h:mm tt");
            string endTime = request.ReservationEnd.ToString("h:mm tt");
            string autoMsg = $"📋 {driverName} reserved {listingTitle} for {dateStr} from {startTime} – {endTime}";

            // Find existing conversation or create one
            var existingConv = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ConversationID FROM dbo.Conversations
                WHERE ListingID = @ListingID AND DriverUserID = @DriverUserID AND HostUserID = @HostUserID",
                new { request.ListingID, request.DriverUserID, HostUserID = hostUserId });

            int convId;
            if (existingConv != null)
            {
                convId = (int)existingConv.ConversationID;
            }
            else
            {
                convId = await connection.QuerySingleAsync<int>(@"
                    INSERT INTO dbo.Conversations (ListingID, DriverUserID, HostUserID, CreatedAt)
                    VALUES (@ListingID, @DriverUserID, @HostUserID, GETUTCDATE());
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new { request.ListingID, request.DriverUserID, HostUserID = hostUserId });
            }

            // Insert the auto-message into the conversation
            await connection.ExecuteAsync(@"
                INSERT INTO dbo.Messages (ConversationID, SenderUserID, ReceiverUserID, Body, SentAt, IsRead)
                VALUES (@ConversationID, @SenderUserID, @ReceiverUserID, @Body, GETUTCDATE(), 0);",
                new
                {
                    ConversationID = convId,
                    SenderUserID = request.DriverUserID,
                    ReceiverUserID = hostUserId,
                    Body = autoMsg
                });

            return StatusCode(201, new
            {
                message = "Reservation created successfully.",
                reservationId = newId,
                assignedSpotNumber = assignedSpot
            });
        }

        // ===============================
        // GET /api/Reservations/{id}
        // Get reservation by ID (with full listing address)
        // ===============================
        [HttpGet("{id}")]
        public async Task<IActionResult> GetReservationById(int id)
        {
            if (id <= 0)
                return BadRequest(new { message = "Invalid reservation ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT r.ReservationID, r.ListingID, r.DriverUserID, r.AssignedSpotNumber,
                       r.ReservationStart, r.ReservationEnd, r.Status, r.CreatedAt,
                       p.Title, p.Location AS FullAddress, p.PricePerHour
                FROM dbo.Reservations r
                INNER JOIN dbo.ParkingListings p ON r.ListingID = p.ListingID
                WHERE r.ReservationID = @ReservationID",
                new { ReservationID = id });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            return Ok(reservation);
        }

        // ===============================
        // GET /api/Reservations/user/{userId}
        // Get all reservations for a driver
        // ===============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetReservationsByUser(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var reservations = await connection.QueryAsync<dynamic>(@"
                SELECT r.ReservationID, r.ListingID, r.DriverUserID, r.AssignedSpotNumber,
                       r.ReservationStart, r.ReservationEnd, r.Status, r.CreatedAt,
                       p.Title, p.Location AS FullAddress, p.PricePerHour
                FROM dbo.Reservations r
                INNER JOIN dbo.ParkingListings p ON r.ListingID = p.ListingID
                WHERE r.DriverUserID = @DriverUserID
                ORDER BY r.ReservationStart DESC",
                new { DriverUserID = userId });

            return Ok(reservations);
        }

        // ===============================
        // PATCH /api/Reservations/{id}/cancel
        // Cancel a reservation (free if >12hrs before start)
        // ===============================
        [HttpPatch("{id}/cancel")]
        public async Task<IActionResult> CancelReservation(int id, [FromQuery] int driverUserId)
        {
            if (id <= 0 || driverUserId <= 0)
                return BadRequest(new { message = "Invalid cancellation request." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ReservationID, DriverUserID, ReservationStart, Status
                FROM dbo.Reservations
                WHERE ReservationID = @ReservationID",
                new { ReservationID = id });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            if ((int)reservation.DriverUserID != driverUserId)
                return Forbid();

            if ((string)reservation.Status == "Cancelled")
                return BadRequest(new { message = "Reservation is already cancelled." });

            // Check cancellation policy — free if more than 12 hours before start
            var hoursUntilStart = ((DateTime)reservation.ReservationStart - DateTime.UtcNow).TotalHours;
            var isFreeCancellation = hoursUntilStart > 12;

            await connection.ExecuteAsync(@"
                UPDATE dbo.Reservations
                SET Status = 'Cancelled'
                WHERE ReservationID = @ReservationID",
                new { ReservationID = id });

            return Ok(new
            {
                message = "Reservation cancelled successfully.",
                freeCancellation = isFreeCancellation,
                refundEligible = isFreeCancellation
            });
        }
    }
}