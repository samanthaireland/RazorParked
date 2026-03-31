using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Data;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MessagesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _config;

        public MessagesController(ApplicationDbContext context, IConfiguration config)
        {
            _context = context;
            _config = config;
        }

        // ===============================
        // GET /api/Messages/{conversationId}
        // Get full message thread for a conversation
        // ===============================
        [HttpGet("{conversationId}")]
        public async Task<IActionResult> GetMessageThread(int conversationId)
        {
            if (conversationId <= 0)
                return BadRequest(new { message = "Invalid conversation ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify conversation exists
            var conversation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT c.ConversationID, c.ListingID, c.DriverUserID, c.HostUserID,
                       u_driver.FullName AS DriverName,
                       u_host.FullName   AS HostName,
                       p.Title           AS ListingTitle
                FROM dbo.Conversations c
                INNER JOIN dbo.Users u_driver ON c.DriverUserID = u_driver.UserID
                INNER JOIN dbo.Users u_host   ON c.HostUserID   = u_host.UserID
                INNER JOIN dbo.ParkingListings p ON c.ListingID = p.ListingID
                WHERE c.ConversationID = @ConversationID",
                new { ConversationID = conversationId });

            if (conversation == null)
                return NotFound(new { message = "Conversation not found." });

            // Fetch all messages in thread, oldest first
            var messages = await connection.QueryAsync<dynamic>(@"
                SELECT m.MessageID, m.ConversationID, m.SenderUserID, m.ReceiverUserID,
                       m.Body, m.IsRead, m.SentAt,
                       u.FullName AS SenderName
                FROM dbo.Messages m
                INNER JOIN dbo.Users u ON m.SenderUserID = u.UserID
                WHERE m.ConversationID = @ConversationID
                ORDER BY m.SentAt ASC",
                new { ConversationID = conversationId });

            return Ok(new
            {
                conversation,
                messages
            });
        }

        // ===============================
        // GET /api/Messages/user/{userId}
        // Get all conversations for a user (for dashboard badge)
        // ===============================
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetUserConversations(int userId)
        {
            if (userId <= 0)
                return BadRequest(new { message = "Invalid user ID." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var conversations = await connection.QueryAsync<dynamic>(@"
                SELECT c.ConversationID, c.ListingID, c.DriverUserID, c.HostUserID,
                       p.Title AS ListingTitle,
                       u_other.FullName AS OtherPartyName,
                       (SELECT TOP 1 Body FROM dbo.Messages
                        WHERE ConversationID = c.ConversationID
                        ORDER BY SentAt DESC) AS LastMessage,
                       (SELECT TOP 1 SentAt FROM dbo.Messages
                        WHERE ConversationID = c.ConversationID
                        ORDER BY SentAt DESC) AS LastMessageAt,
                       (SELECT COUNT(*) FROM dbo.Messages
                        WHERE ConversationID = c.ConversationID
                          AND ReceiverUserID = @UserID
                          AND IsRead = 0) AS UnreadCount
                FROM dbo.Conversations c
                INNER JOIN dbo.ParkingListings p ON c.ListingID = p.ListingID
                INNER JOIN dbo.Users u_other
                    ON u_other.UserID = CASE
                        WHEN c.DriverUserID = @UserID THEN c.HostUserID
                        ELSE c.DriverUserID
                    END
                WHERE c.DriverUserID = @UserID OR c.HostUserID = @UserID
                ORDER BY LastMessageAt DESC",
                new { UserID = userId });

            // Total unread count across all conversations (for dashboard badge)
            var totalUnread = await connection.QuerySingleAsync<int>(@"
                SELECT COUNT(*)
                FROM dbo.Messages m
                INNER JOIN dbo.Conversations c ON m.ConversationID = c.ConversationID
                WHERE m.ReceiverUserID = @UserID AND m.IsRead = 0",
                new { UserID = userId });

            return Ok(new { conversations, totalUnread });
        }

        // ===============================
        // POST /api/Messages
        // Send a new message; creates conversation if none exists
        // ===============================
        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            // ── Validation ──
            if (request.SenderUserID <= 0 || request.ReceiverUserID <= 0)
                return BadRequest(new { message = "Invalid sender or receiver ID." });

            if (request.SenderUserID == request.ReceiverUserID)
                return BadRequest(new { message = "Cannot send a message to yourself." });

            if (request.ListingID <= 0)
                return BadRequest(new { message = "A listing ID is required to start a conversation." });

            if (string.IsNullOrWhiteSpace(request.Body))
                return BadRequest(new { message = "Message body cannot be empty." });

            if (request.Body.Trim().Length > 2000)
                return BadRequest(new { message = "Message exceeds the 2000 character limit." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify both users exist
            var senderExists = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT UserID FROM dbo.Users WHERE UserID = @UserID",
                new { UserID = request.SenderUserID });

            if (senderExists == null)
                return NotFound(new { message = "Sender not found." });

            var receiverExists = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT UserID FROM dbo.Users WHERE UserID = @UserID",
                new { UserID = request.ReceiverUserID });

            if (receiverExists == null)
                return NotFound(new { message = "Receiver not found." });

            // Verify listing exists
            var listingExists = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT ListingID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { request.ListingID });

            if (listingExists == null)
                return NotFound(new { message = "Listing not found." });

            // Get or create conversation for this listing + driver/host pair
            // Determine who is driver vs host based on listing ownership
            var hostUserID = await connection.QuerySingleAsync<int>(
                "SELECT HostUserID FROM dbo.ParkingListings WHERE ListingID = @ListingID",
                new { request.ListingID });

            var driverUserID = request.SenderUserID == hostUserID
                ? request.ReceiverUserID
                : request.SenderUserID;

            var conversationId = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT ConversationID FROM dbo.Conversations
                WHERE ListingID = @ListingID
                  AND DriverUserID = @DriverUserID
                  AND HostUserID   = @HostUserID",
                new { request.ListingID, DriverUserID = driverUserID, HostUserID = hostUserID });

            if (conversationId == null)
            {
                conversationId = await connection.QuerySingleAsync<int>(@"
                    INSERT INTO dbo.Conversations (ListingID, DriverUserID, HostUserID, CreatedAt)
                    VALUES (@ListingID, @DriverUserID, @HostUserID, GETUTCDATE());
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new { request.ListingID, DriverUserID = driverUserID, HostUserID = hostUserID });
            }

            // Insert message
            var newMessageId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.Messages
                    (ConversationID, SenderUserID, ReceiverUserID, Body, IsRead, SentAt)
                VALUES
                    (@ConversationID, @SenderUserID, @ReceiverUserID, @Body, 0, GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    ConversationID = conversationId,
                    request.SenderUserID,
                    request.ReceiverUserID,
                    Body = request.Body.Trim()
                });

            return StatusCode(201, new
            {
                message = "Message sent successfully.",
                messageId = newMessageId,
                conversationId
            });
        }

        // ===============================
        // PATCH /api/Messages/{conversationId}/read
        // Mark all messages in a conversation as read for a user
        // ===============================
        [HttpPatch("{conversationId}/read")]
        public async Task<IActionResult> MarkAsRead(int conversationId, [FromQuery] int userId)
        {
            if (conversationId <= 0 || userId <= 0)
                return BadRequest(new { message = "Invalid request." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            await connection.ExecuteAsync(@"
                UPDATE dbo.Messages
                SET IsRead = 1
                WHERE ConversationID = @ConversationID
                  AND ReceiverUserID = @UserID
                  AND IsRead = 0",
                new { ConversationID = conversationId, UserID = userId });

            return Ok(new { message = "Messages marked as read." });
        }
    }
}