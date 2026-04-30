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
        // CHANGED: Checks RemainingSpots on the matching slot,
        //          decrements it, hides listing when all slots full
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

            var listing = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ListingID, Title, IsAvailable, HostUserID 
                FROM dbo.ParkingListings 
                WHERE ListingID = @ListingID",
                new { request.ListingID });

            if (listing == null)
                return NotFound(new { message = "Listing not found." });

            if (!(bool)listing.IsAvailable)
                return BadRequest(new { message = "This listing is not available." });

            if ((int)listing.HostUserID == request.DriverUserID)
                return BadRequest(new { message = "Hosts cannot reserve their own listing." });

            // CHANGED: Find matching slot and check it has spots remaining
            var slotMatch = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT SlotID, RemainingSpots FROM dbo.AvailabilitySlots
                WHERE ListingID = @ListingID
                AND StartDateTime <= @ReservationStart
                AND EndDateTime >= @ReservationEnd
                AND RemainingSpots > 0",
                new
                {
                    request.ListingID,
                    request.ReservationStart,
                    request.ReservationEnd
                });

            if (slotMatch == null)
                return BadRequest(new { message = "Your selected time does not fall within any available time slot set by the host, or that slot is fully booked. Please choose another time." });

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

            var spotCount = await connection.QuerySingleAsync<int>(@"
                SELECT COUNT(*) FROM dbo.Reservations WHERE ListingID = @ListingID",
                new { request.ListingID });

            var assignedSpot = $"SPOT-{request.ListingID}-{spotCount + 1}";

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

            // CHANGED: Decrement RemainingSpots on the matched slot
            int slotId = (int)slotMatch.SlotID;
            await connection.ExecuteAsync(@"
                UPDATE dbo.AvailabilitySlots
                SET RemainingSpots = RemainingSpots - 1
                WHERE SlotID = @SlotID",
                new { SlotID = slotId });

            // CHANGED: If no slots have remaining spots, mark listing unavailable
            var activeSlots = await connection.QuerySingleAsync<int>(@"
                SELECT COUNT(*) FROM dbo.AvailabilitySlots
                WHERE ListingID = @ListingID AND RemainingSpots > 0",
                new { request.ListingID });

            if (activeSlots == 0)
            {
                await connection.ExecuteAsync(@"
                    UPDATE dbo.ParkingListings SET IsAvailable = 0 WHERE ListingID = @ListingID",
                    new { request.ListingID });
            }

            await connection.ExecuteAsync(@"
                INSERT INTO dbo.Notifications (UserID, ReservationID, Type, Message, IsRead, CreatedAt)
                VALUES (@UserID, @ReservationID, 'ReservationConfirmed', @Message, 0, GETUTCDATE());",
                new
                {
                    UserID = request.DriverUserID,
                    ReservationID = newId,
                    Message = $"Your reservation has been confirmed! Spot {assignedSpot} is ready."
                });

            var driver = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT FullName FROM dbo.Users WHERE UserID = @UserID",
                new { UserID = request.DriverUserID });

            string driverName = driver?.FullName ?? "A driver";
            string listingTitle = (string)listing.Title;
            int hostUserId = (int)listing.HostUserID;

            string dateStr = request.ReservationStart.ToString("MMMM d");
            string startTime = request.ReservationStart.ToString("h:mm tt");
            string endTime = request.ReservationEnd.ToString("h:mm tt");
            string autoMsg = $"📋 {driverName} reserved {listingTitle} for {dateStr} from {startTime} – {endTime}";

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
        // GET /api/Reservations/listing/{listingId}/blocked
        // CHANGED: Only returns dates from slots with spots > 0
        // ===============================
        [HttpGet("listing/{listingId}/blocked")]
        public async Task<IActionResult> GetBlockedSlots(int listingId)
        {
            if (listingId <= 0)
                return BadRequest(new { message = "Invalid listing ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var availSlots = await connection.QueryAsync<dynamic>(@"
                SELECT StartDateTime, EndDateTime
                FROM dbo.AvailabilitySlots
                WHERE ListingID = @ListingID AND RemainingSpots > 0
                ORDER BY StartDateTime ASC",
                new { ListingID = listingId });

            var confirmedReservations = await connection.QueryAsync<dynamic>(@"
                SELECT ReservationStart, ReservationEnd
                FROM dbo.Reservations
                WHERE ListingID = @ListingID AND Status = 'Confirmed'",
                new { ListingID = listingId });

            var availableDates = new HashSet<string>();
            foreach (var slot in availSlots)
            {
                var start = (DateTime)slot.StartDateTime;
                var end = (DateTime)slot.EndDateTime;
                for (var d = start.Date; d <= end.Date; d = d.AddDays(1))
                    availableDates.Add(d.ToString("yyyy-MM-dd"));
            }

            var blockedSlots = new Dictionary<string, List<string>>();
            foreach (var res in confirmedReservations)
            {
                var start = (DateTime)res.ReservationStart;
                var end = (DateTime)res.ReservationEnd;
                var dateKey = start.ToString("yyyy-MM-dd");
                if (!blockedSlots.ContainsKey(dateKey))
                    blockedSlots[dateKey] = new List<string>();

                for (var t = start; t < end; t = t.AddHours(1))
                {
                    var timeStr = t.ToString("h:00 tt").TrimStart('0');
                    if (!blockedSlots[dateKey].Contains(timeStr))
                        blockedSlots[dateKey].Add(timeStr);
                }
            }

            return Ok(new
            {
                availableDates = availableDates.OrderBy(d => d).ToList(),
                blockedSlots = blockedSlots
            });
        }

        // ===============================
        // GET /api/Reservations/{id}
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
                       p.Title, p.Location AS FullAddress, p.PricePerHour, p.HostUserID
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
                       p.Title, p.Location AS FullAddress, p.PricePerHour, p.HostUserID
                FROM dbo.Reservations r
                INNER JOIN dbo.ParkingListings p ON r.ListingID = p.ListingID
                WHERE r.DriverUserID = @DriverUserID
                ORDER BY r.ReservationStart DESC",
                new { DriverUserID = userId });

            return Ok(reservations);
        }

        // ===============================
        // GET /api/Reservations/host/{userId}
        // ===============================
        [HttpGet("host/{userId}")]
        public async Task<IActionResult> GetReservationsByHost(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var reservations = await connection.QueryAsync<dynamic>(@"
                SELECT r.ReservationID, r.DriverUserID, r.ReservationStart, r.ReservationEnd, r.Status,
                       u.FullName AS CustomerName,
                       p.Title AS ListingTitle
                FROM dbo.Reservations r
                INNER JOIN dbo.ParkingListings p ON r.ListingID = p.ListingID
                INNER JOIN dbo.Users u ON r.DriverUserID = u.UserID
                WHERE p.HostUserID = @HostUserID
                AND r.Status = 'Confirmed'
                ORDER BY r.ReservationStart DESC",
                new { HostUserID = userId });

            return Ok(reservations);
        }

        // ===============================
        // PATCH /api/Reservations/{id}/cancel
        // CHANGED: Increments RemainingSpots on the slot,
        //          re-enables listing if spots freed up
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
                SELECT ReservationID, DriverUserID, ReservationStart, ReservationEnd, Status, ListingID
                FROM dbo.Reservations
                WHERE ReservationID = @ReservationID",
                new { ReservationID = id });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            if ((int)reservation.DriverUserID != driverUserId)
                return Forbid();

            if ((string)reservation.Status == "Cancelled")
                return BadRequest(new { message = "Reservation is already cancelled." });

            var hoursUntilStart = ((DateTime)reservation.ReservationStart - DateTime.UtcNow).TotalHours;
            var isFreeCancellation = hoursUntilStart > 12;

            await connection.ExecuteAsync(@"
                UPDATE dbo.Reservations SET Status = 'Cancelled'
                WHERE ReservationID = @ReservationID",
                new { ReservationID = id });

            // CHANGED: Find the slot this reservation fell within and restore a spot
            int listingId = (int)reservation.ListingID;
            DateTime resStart = (DateTime)reservation.ReservationStart;
            DateTime resEnd = (DateTime)reservation.ReservationEnd;

            var matchingSlot = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT SlotID, TotalSpots FROM dbo.AvailabilitySlots
                WHERE ListingID = @ListingID
                AND StartDateTime <= @ReservationStart
                AND EndDateTime >= @ReservationEnd",
                new { ListingID = listingId, ReservationStart = resStart, ReservationEnd = resEnd });

            if (matchingSlot != null)
            {
                await connection.ExecuteAsync(@"
                    UPDATE dbo.AvailabilitySlots
                    SET RemainingSpots = CASE
                        WHEN RemainingSpots < TotalSpots THEN RemainingSpots + 1
                        ELSE TotalSpots
                    END
                    WHERE SlotID = @SlotID",
                    new { SlotID = (int)matchingSlot.SlotID });
            }

            // Re-enable listing if spots are available again
            var activeSlots = await connection.QuerySingleAsync<int>(@"
                SELECT COUNT(*) FROM dbo.AvailabilitySlots
                WHERE ListingID = @ListingID AND RemainingSpots > 0",
                new { ListingID = listingId });

            if (activeSlots > 0)
            {
                await connection.ExecuteAsync(@"
                    UPDATE dbo.ParkingListings SET IsAvailable = 1 WHERE ListingID = @ListingID",
                    new { ListingID = listingId });
            }

            return Ok(new
            {
                message = "Reservation cancelled successfully.",
                freeCancellation = isFreeCancellation,
                refundEligible = isFreeCancellation
            });
        }
    }
}