using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class TowingContactsController : ControllerBase
    {
        private readonly IConfiguration _config;

        public TowingContactsController(IConfiguration config)
        {
            _config = config;
        }

        // ===============================
        // GET /api/TowingContacts
        // Criteria 13: Display local towing companies
        // ===============================
        [HttpGet]
        public async Task<IActionResult> GetTowingContacts()
        {
            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Ensure table exists
            await connection.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TowingContacts')
                BEGIN
                    CREATE TABLE dbo.TowingContacts (
                        TowingContactID INT IDENTITY(1,1) PRIMARY KEY,
                        CompanyName NVARCHAR(200) NOT NULL,
                        Phone NVARCHAR(30) NOT NULL,
                        ServiceArea NVARCHAR(200) NOT NULL,
                        HoursOfOperation NVARCHAR(100) NULL,
                        IsActive BIT NOT NULL DEFAULT 1
                    );
                    -- Seed Fayetteville-area towing companies
                    INSERT INTO dbo.TowingContacts (CompanyName, Phone, ServiceArea, HoursOfOperation) VALUES
                    ('Razorback Towing', '(479) 555-0101', 'Campus & Stadium Drive area', '24/7'),
                    ('Hog Country Tow', '(479) 555-0202', 'Dickson Street & Downtown Fayetteville', '24/7'),
                    ('NWA Towing Services', '(479) 555-0303', 'Greater Fayetteville & Springdale', 'Mon-Sun 6AM-Midnight'),
                    ('Fayetteville City Tow', '(479) 555-0404', 'All Fayetteville enforcement zones', '24/7 on game days'),
                    ('Ozark Roadside & Towing', '(479) 555-0505', 'Fayetteville, Bentonville, Rogers', 'Mon-Sat 7AM-10PM');
                END");

            var contacts = await connection.QueryAsync<TowingContact>(@"
                SELECT TowingContactID, CompanyName, Phone, ServiceArea, HoursOfOperation, IsActive
                FROM dbo.TowingContacts
                WHERE IsActive = 1
                ORDER BY CompanyName");

            return Ok(contacts);
        }

        // ===============================
        // POST /api/TowingContacts/request
        // Criteria 14: Log an unauthorized vehicle report
        // ===============================
        [HttpPost("request")]
        public async Task<IActionResult> RequestTow([FromBody] TowRequestDto request)
        {
            if (request.HostUserID <= 0 || request.ListingID <= 0)
                return BadRequest(new { message = "Invalid request data." });

            if (string.IsNullOrWhiteSpace(request.SpotNumber))
                return BadRequest(new { message = "Spot number is required." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Ensure table exists
            await connection.ExecuteAsync(@"
                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TowRequests')
                BEGIN
                    CREATE TABLE dbo.TowRequests (
                        TowRequestID INT IDENTITY(1,1) PRIMARY KEY,
                        HostUserID INT NOT NULL,
                        ListingID INT NOT NULL,
                        SpotNumber NVARCHAR(50) NOT NULL,
                        VehicleDescription NVARCHAR(500) NULL,
                        Status NVARCHAR(50) NOT NULL DEFAULT 'Pending',
                        CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
                    );
                END");

            // Verify listing belongs to host
            var listing = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ListingID, HostUserID, Title
                FROM dbo.ParkingListings
                WHERE ListingID = @ListingID",
                new { request.ListingID });

            if (listing == null)
                return NotFound(new { message = "Listing not found." });

            if ((int)listing.HostUserID != request.HostUserID)
                return BadRequest(new { message = "You can only report vehicles on your own listings." });

            // Insert tow request
            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.TowRequests
                    (HostUserID, ListingID, SpotNumber, VehicleDescription, Status, CreatedAt)
                VALUES
                    (@HostUserID, @ListingID, @SpotNumber, @VehicleDescription, 'Pending', GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.HostUserID,
                    request.ListingID,
                    request.SpotNumber,
                    request.VehicleDescription
                });

            // Also create a notification for the host as confirmation
            await connection.ExecuteAsync(@"
                INSERT INTO dbo.Notifications (UserID, ReservationID, Type, Message, IsRead, CreatedAt)
                VALUES (@UserID, NULL, 'TowRequested',
                    @Message, 0, GETUTCDATE());",
                new
                {
                    UserID = request.HostUserID,
                    Message = $"Tow request submitted for spot {request.SpotNumber} on \"{listing.Title}\". Status: Pending."
                });

            return Ok(new
            {
                message = "Tow request submitted successfully.",
                towRequestId = newId,
                status = "Pending"
            });
        }
    }

    // ── Request DTO ──
    public class TowRequestDto
    {
        public int HostUserID { get; set; }
        public int ListingID { get; set; }
        public string SpotNumber { get; set; } = "";
        public string? VehicleDescription { get; set; }
    }
}
