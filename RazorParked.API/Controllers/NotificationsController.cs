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
    }
}
