using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly IConfiguration _config;

        public PaymentsController(IConfiguration config)
        {
            _config = config;
        }

        // ===============================
        // POST /api/Payments
        // Record payment for a reservation
        // ===============================
        [HttpPost]
        public async Task<IActionResult> CreatePayment([FromBody] CreatePaymentRequest request)
        {
            if (request.ReservationID <= 0 || request.DriverUserID <= 0 || request.Amount <= 0)
                return BadRequest(new { message = "Invalid payment data." });

            if (string.IsNullOrWhiteSpace(request.PaymentMethod) ||
                (request.PaymentMethod != "Venmo" && request.PaymentMethod != "InAppCredit"))
                return BadRequest(new { message = "Payment method must be Venmo or InAppCredit." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify reservation exists and belongs to this driver
            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ReservationID, DriverUserID, Status
                FROM dbo.Reservations
                WHERE ReservationID = @ReservationID",
                new { request.ReservationID });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            if ((int)reservation.DriverUserID != request.DriverUserID)
                return Forbid();

            if ((string)reservation.Status == "Cancelled")
                return BadRequest(new { message = "Cannot pay for a cancelled reservation." });

            // Check if payment already exists for this reservation
            var existingPayment = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT PaymentID FROM dbo.Payments
                WHERE ReservationID = @ReservationID AND Status = 'Confirmed'",
                new { request.ReservationID });

            if (existingPayment != null)
                return Conflict(new { message = "Payment already confirmed for this reservation." });

            // Insert payment record
            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.Payments 
                    (ReservationID, DriverUserID, Amount, PaymentMethod, Status, CreatedAt)
                VALUES 
                    (@ReservationID, @DriverUserID, @Amount, @PaymentMethod, 'Confirmed', GETUTCDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.ReservationID,
                    request.DriverUserID,
                    request.Amount,
                    request.PaymentMethod
                });

            return StatusCode(201, new
            {
                message = "Payment confirmed successfully.",
                paymentId = newId,
                reservationId = request.ReservationID,
                amount = request.Amount,
                paymentMethod = request.PaymentMethod,
                status = "Confirmed"
            });
        }
    }
}
