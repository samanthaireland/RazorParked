using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class EnforcementController : ControllerBase
    {
        private readonly IConfiguration _config;

        public EnforcementController(IConfiguration config)
        {
            _config = config;
        }

        // ===============================
        // GET /api/Enforcement/zones
        // Criteria 10: Fetch enforcement zones relevant to a listing's location
        // Simulates integration with city parking enforcement data
        // ===============================
        [HttpGet("zones")]
        public IActionResult GetEnforcementZones([FromQuery] string? location)
        {
            // Simulated Fayetteville enforcement zones
            // In production this would call a city parking enforcement API
            var zones = new[]
            {
                new {
                    ZoneID = 1,
                    ZoneName = "Campus Core – Stadium Drive",
                    Description = "Strictly enforced on game days. Towing begins 4 hours before kickoff.",
                    EnforcementLevel = "High",
                    EnforcementHours = "Game days: 6 AM – Midnight",
                    Latitude = 36.0685,
                    Longitude = -94.1785,
                    Radius = 0.3
                },
                new {
                    ZoneID = 2,
                    ZoneName = "Dickson Street District",
                    Description = "Metered parking enforced Mon–Sat. Event-day restrictions apply.",
                    EnforcementLevel = "High",
                    EnforcementHours = "Mon–Sat: 8 AM – 10 PM",
                    Latitude = 36.0660,
                    Longitude = -94.1609,
                    Radius = 0.2
                },
                new {
                    ZoneID = 3,
                    ZoneName = "Razorback Road Residential",
                    Description = "Residential permit zone. Non-permit vehicles ticketed within 2 hours.",
                    EnforcementLevel = "Medium",
                    EnforcementHours = "Daily: 7 AM – 6 PM",
                    Latitude = 36.0720,
                    Longitude = -94.1740,
                    Radius = 0.25
                },
                new {
                    ZoneID = 4,
                    ZoneName = "Martin Luther King Jr. Blvd",
                    Description = "No-parking zones near intersections. Tow-away zone during events.",
                    EnforcementLevel = "High",
                    EnforcementHours = "Event days: 4 hours before – 2 hours after",
                    Latitude = 36.0645,
                    Longitude = -94.1655,
                    Radius = 0.15
                },
                new {
                    ZoneID = 5,
                    ZoneName = "Maple Street / Garland Ave",
                    Description = "Light enforcement. Permit-only during weekday business hours.",
                    EnforcementLevel = "Low",
                    EnforcementHours = "Mon–Fri: 8 AM – 5 PM",
                    Latitude = 36.0700,
                    Longitude = -94.1680,
                    Radius = 0.2
                },
                new {
                    ZoneID = 6,
                    ZoneName = "Baum-Walker Stadium Area",
                    Description = "Enforced during baseball and special events. Free parking otherwise.",
                    EnforcementLevel = "Medium",
                    EnforcementHours = "Event days only",
                    Latitude = 36.0630,
                    Longitude = -94.1820,
                    Radius = 0.2
                }
            };

            // Filter by location keyword if provided
            if (!string.IsNullOrWhiteSpace(location))
            {
                var keyword = location.ToLower();
                var filtered = zones.Where(z =>
                    z.ZoneName.ToLower().Contains(keyword) ||
                    z.Description.ToLower().Contains(keyword)
                ).ToArray();
                return Ok(filtered);
            }

            return Ok(zones);
        }

        // ===============================
        // POST /api/Enforcement/notify
        // Criteria 11: Trigger a notification alert for a detected violation
        // ===============================
        [HttpPost("notify")]
        public async Task<IActionResult> NotifyViolation([FromBody] EnforcementNotifyRequest request)
        {
            if (request.ReservationID <= 0 || request.ReporterUserID <= 0)
                return BadRequest(new { message = "Invalid notification data." });

            if (string.IsNullOrWhiteSpace(request.ViolationType))
                return BadRequest(new { message = "Violation type is required." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify reservation exists
            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ReservationID, ListingID, DriverUserID, Status
                FROM dbo.Reservations
                WHERE ReservationID = @ReservationID",
                new { request.ReservationID });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            // Ensure the EnforcementNotifications table exists
            await connection.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EnforcementNotifications')
                BEGIN
                    CREATE TABLE dbo.EnforcementNotifications (
                        NotificationID INT IDENTITY(1,1) PRIMARY KEY,
                        ReservationID INT NOT NULL,
                        ReporterUserID INT NOT NULL,
                        ViolationType NVARCHAR(100) NOT NULL,
                        Description NVARCHAR(500) NULL,
                        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                    );
                END");

            // Insert notification
            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.EnforcementNotifications
                    (ReservationID, ReporterUserID, ViolationType, Description, Status, CreatedAt)
                VALUES
                    (@ReservationID, @ReporterUserID, @ViolationType, @Description, 'Pending', GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.ReservationID,
                    request.ReporterUserID,
                    request.ViolationType,
                    request.Description
                });

            return Ok(new
            {
                message = "Violation notification submitted successfully.",
                notificationId = newId,
                reservationId = request.ReservationID,
                violationType = request.ViolationType,
                status = "Pending"
            });
        }

        // ===============================
        // GET /api/Enforcement/status/{reservationId}
        // Criteria 12: Show current enforcement status for a reservation
        // ===============================
        [HttpGet("status/{reservationId}")]
        public async Task<IActionResult> GetEnforcementStatus(int reservationId)
        {
            if (reservationId <= 0)
                return BadRequest(new { message = "Invalid reservation ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify reservation exists and get details
            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT r.ReservationID, r.ListingID, r.DriverUserID, r.AssignedSpotNumber,
                       r.ReservationStart, r.ReservationEnd, r.Status,
                       p.Title, p.Location
                FROM dbo.Reservations r
                INNER JOIN dbo.ParkingListings p ON r.ListingID = p.ListingID
                WHERE r.ReservationID = @ReservationID",
                new { ReservationID = reservationId });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            // Ensure table exists before querying
            await connection.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EnforcementNotifications')
                BEGIN
                    CREATE TABLE dbo.EnforcementNotifications (
                        NotificationID INT IDENTITY(1,1) PRIMARY KEY,
                        ReservationID INT NOT NULL,
                        ReporterUserID INT NOT NULL,
                        ViolationType NVARCHAR(100) NOT NULL,
                        Description NVARCHAR(500) NULL,
                        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                    );
                END");

            // Get any enforcement notifications for this reservation
            var notifications = await connection.QueryAsync<dynamic>(@"
                SELECT NotificationID, ViolationType, Description, Status, CreatedAt
                FROM dbo.EnforcementNotifications
                WHERE ReservationID = @ReservationID
                ORDER BY CreatedAt DESC",
                new { ReservationID = reservationId });

            var notificationList = notifications.ToList();
            var hasViolations = notificationList.Any();
            var pendingCount = notificationList.Count(n => (string)n.Status == "Pending");

            // Determine overall enforcement status
            string enforcementStatus;
            if (!hasViolations)
                enforcementStatus = "Clear";
            else if (pendingCount > 0)
                enforcementStatus = "Under Review";
            else
                enforcementStatus = "Resolved";

            return Ok(new
            {
                reservationId = reservationId,
                title = (string)reservation.Title,
                location = (string)reservation.Location,
                assignedSpotNumber = (string)reservation.AssignedSpotNumber,
                reservationStatus = (string)reservation.Status,
                enforcementStatus = enforcementStatus,
                totalNotifications = notificationList.Count,
                pendingNotifications = pendingCount,
                notifications = notificationList
            });
        }
    }

    // ── Request model for POST /api/Enforcement/notify ──
    public class EnforcementNotifyRequest
    {
        public int ReservationID { get; set; }
        public int ReporterUserID { get; set; }
        public string ViolationType { get; set; } = "";
        public string? Description { get; set; }
    }
}
