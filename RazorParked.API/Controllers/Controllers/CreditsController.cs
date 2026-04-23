using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RazorParked.API.Models;
using RazorParked.API.Data;

namespace RazorParked.API.Controllers
{
    [ApiController]
    [Route("api/Users/{userId}/credits")]
    public class CreditsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;
        public CreditsController(ApplicationDbContext context) => _db = context;

        // GET /api/Users/{userId}/credits
        [HttpGet]
        public async Task<IActionResult> GetBalance(int userId)
        {
            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });
            return Ok(new { balance = user.Credits });
        }

        // POST /api/Users/{userId}/credits/purchase
        [HttpPost("purchase")]
        public async Task<IActionResult> Purchase(int userId, [FromBody] PurchaseRequest req)
        {
            if (req.Amount <= 0)
                return BadRequest(new { message = "Amount must be greater than zero." });

            var user = await _db.Users.FindAsync(userId);
            if (user == null) return NotFound(new { message = "User not found." });

            user.Credits += req.Amount;

            _db.CreditTransactions.Add(new CreditTransaction
            {
                SenderUserID = userId,
                ReceiverUserID = userId,
                Type = "purchase",
                Amount = req.Amount
            });

            await _db.SaveChangesAsync();
            return Ok(new { balance = user.Credits, message = "Credits added." });
        }

        // POST /api/Users/{userId}/credits/gift
        [HttpPost("gift")]
        public async Task<IActionResult> Gift(int userId, [FromBody] GiftRequest req)
        {
            if (req.Amount <= 0)
                return BadRequest(new { message = "Amount must be greater than zero." });

            var sender = await _db.Users.FindAsync(userId);
            if (sender == null) return NotFound(new { message = "Sender not found." });

            if (sender.Credits < req.Amount)
                return BadRequest(new { message = "Insufficient balance." });

            var recipient = await _db.Users.FindAsync(req.RecipientUserId);
            if (recipient == null) return NotFound(new { message = "Recipient not found." });

            sender.Credits -= req.Amount;
            recipient.Credits += req.Amount;

            _db.CreditTransactions.Add(new CreditTransaction
            {
                SenderUserID = userId,
                ReceiverUserID = req.RecipientUserId,
                Type = "gift",
                Amount = req.Amount,
                ReservationId = req.ReservationId,
                Note = req.Note
            });

            await _db.SaveChangesAsync();
            return Ok(new { balance = sender.Credits, message = "Credits gifted." });
        }
    }

    public class PurchaseRequest
    {
        public decimal Amount { get; set; }
    }

    public class GiftRequest
    {
        public int RecipientUserId { get; set; }
        public int ReservationId { get; set; }
        public decimal Amount { get; set; }
        public string? Note { get; set; }
    }
}