using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class NotificationsController : ControllerBase
    {
        private readonly IConfiguration _config;

        public NotificationsController(IConfiguration config)
        {
            _config = config;
        }

        // ===============================
        // GET /api/Notifications/user/{userId}
        // Get all notifications for a user
        // ===============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserNotifications(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var notifications = await connection.QueryAsync<Notification>(@"
                SELECT NotificationID, UserID, ReservationID, Type, Message, IsRead, CreatedAt
                FROM dbo.Notifications
                WHERE UserID = @UserID
                ORDER BY CreatedAt DESC",
                new { UserID = userId });

            return Ok(notifications);
        }

        // ===============================
        // GET /api/Notifications/user/{userId}/unread-count
        // Get unread notification count for badge
        // ===============================
        [HttpGet("user/{userId}/unread-count")]
        public async Task<IActionResult> GetUnreadCount(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var count = await connection.ExecuteScalarAsync<int>(@"
                SELECT COUNT(*) FROM dbo.Notifications
                WHERE UserID = @UserID AND IsRead = 0",
                new { UserID = userId });

            return Ok(new { unreadCount = count });
        }

        // ===============================
        // PATCH /api/Notifications/{notificationId}/read
        // Mark a single notification as read
        // ===============================
        [HttpPatch("{notificationId}/read")]
        public async Task<IActionResult> MarkAsRead(int notificationId)
        {
            if (notificationId <= 0)
                return BadRequest(new { message = "Invalid notification ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var rows = await connection.ExecuteAsync(@"
                UPDATE dbo.Notifications
                SET IsRead = 1
                WHERE NotificationID = @NotificationID",
                new { NotificationID = notificationId });

            if (rows == 0)
                return NotFound(new { message = "Notification not found." });

            return Ok(new { message = "Notification marked as read." });
        }

        // ===============================
        // POST /api/Notifications/broadcast
        // Criteria 16: Send platform announcement to opted-in users
        // Carter — Sprint 6
        // ===============================
        [HttpPost("broadcast")]
        public async Task<IActionResult> BroadcastAnnouncement([FromBody] BroadcastRequest request)
        {
            if (request.SenderUserID <= 0)
                return BadRequest(new { message = "Invalid sender." });

            if (string.IsNullOrWhiteSpace(request.Subject) || string.IsNullOrWhiteSpace(request.MessageBody))
                return BadRequest(new { message = "Subject and message are required." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify sender is an Admin
            var isAdmin = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ur.UserID FROM dbo.UserRoles ur
                JOIN dbo.Roles r ON ur.RoleID = r.RoleID
                WHERE ur.UserID = @UserID AND r.RoleName = 'Admin'",
                new { UserID = request.SenderUserID });

            if (isAdmin == null)
                return Forbid();

            // Ensure PromoOptIn column exists on Users table
            await connection.ExecuteAsync(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns
                    WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'PromoOptIn'
                )
                ALTER TABLE dbo.Users ADD PromoOptIn BIT NOT NULL DEFAULT 0;");

            // Get all opted-in users
            var optedInUsers = await connection.QueryAsync<int>(@"
                SELECT UserID FROM dbo.Users
                WHERE PromoOptIn = 1 AND UserID != @SenderUserID",
                new { request.SenderUserID });

            var userList = optedInUsers.ToList();
            var broadcastMessage = $"📢 {request.Subject}: {request.MessageBody}";

            // Insert a notification for each opted-in user
            foreach (var userId in userList)
            {
                await connection.ExecuteAsync(@"
                    INSERT INTO dbo.Notifications (UserID, ReservationID, Type, Message, IsRead, CreatedAt)
                    VALUES (@UserID, NULL, 'Broadcast', @Message, 0, GETUTCDATE());",
                    new { UserID = userId, Message = broadcastMessage });
            }

            return Ok(new
            {
                message = "Broadcast sent successfully.",
                recipientCount = userList.Count,
                subject = request.Subject
            });
        }
    }

    // ── Request model for broadcast ──
    public class BroadcastRequest
    {
        public int SenderUserID { get; set; }
        public string Subject { get; set; } = "";
        public string MessageBody { get; set; } = "";
    }
}
