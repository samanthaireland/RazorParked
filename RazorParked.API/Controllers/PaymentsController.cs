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

            var validMethods = new[] { "Venmo", "InAppCredit", "CreditCard" };
            if (string.IsNullOrWhiteSpace(request.PaymentMethod) || !validMethods.Contains(request.PaymentMethod))
                return BadRequest(new { message = "Payment method must be Venmo, CreditCard, or InAppCredit." });

            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            // Verify reservation exists and belongs to this driver
            var reservation = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT r.ReservationID, r.DriverUserID, r.Status, r.ReservationStart, r.ReservationEnd,
                       r.AssignedSpotNumber, r.ListingID,
                       p.Title, p.Location, p.PricePerHour,
                       u.FullName AS HostName
                FROM dbo.Reservations r
                JOIN dbo.ParkingListings p ON p.ListingID = r.ListingID
                JOIN dbo.Users u ON u.UserID = p.HostUserID
                WHERE r.ReservationID = @ReservationID",
                new { request.ReservationID });

            if (reservation == null)
                return NotFound(new { message = "Reservation not found." });

            if ((int)reservation.DriverUserID != request.DriverUserID)
                return Forbid();

            if ((string)reservation.Status == "Cancelled")
                return BadRequest(new { message = "Cannot pay for a cancelled reservation." });

            // Check if payment already exists
            var existingPayment = await connection.QueryFirstOrDefaultAsync<int?>(@"
                SELECT PaymentID FROM dbo.Payments
                WHERE ReservationID = @ReservationID AND Status = 'Confirmed'",
                new { request.ReservationID });

            if (existingPayment != null)
                return Conflict(new { message = "Payment already confirmed for this reservation." });

            // Calculate duration and amounts
            var start = (DateTime)reservation.ReservationStart;
            var end = (DateTime)reservation.ReservationEnd;
            var hours = (end - start).TotalHours;
            var pricePerHour = (decimal)reservation.PricePerHour;
            var baseAmount = Math.Round((decimal)hours * pricePerHour, 2);
            var serviceFee = Math.Round(baseAmount * 0.10m, 2);
            var totalAmount = baseAmount + serviceFee;

            // Extract last 4 digits of card if credit card
            string? cardLastFour = null;
            if (request.PaymentMethod == "CreditCard" && !string.IsNullOrEmpty(request.CardNumber))
            {
                var clean = new string(request.CardNumber.Where(char.IsDigit).ToArray());
                cardLastFour = clean.Length >= 4 ? clean[^4..] : null;
            }

            // Insert payment record
            var newId = await connection.QuerySingleAsync<int>(@"
                INSERT INTO dbo.Payments 
                    (ReservationID, DriverUserID, Amount, PaymentMethod, Status, CreatedAt, ServiceFee, TotalAmount, CardLastFour, VenmoHandle)
                VALUES 
                    (@ReservationID, @DriverUserID, @Amount, @PaymentMethod, 'Confirmed', GETUTCDATE(), @ServiceFee, @TotalAmount, @CardLastFour, @VenmoHandle);
                SELECT CAST(SCOPE_IDENTITY() AS INT);",
                new
                {
                    request.ReservationID,
                    request.DriverUserID,
                    Amount = baseAmount,
                    request.PaymentMethod,
                    ServiceFee = serviceFee,
                    TotalAmount = totalAmount,
                    CardLastFour = cardLastFour,
                    VenmoHandle = request.VenmoHandle
                });

            return StatusCode(201, new
            {
                message = "Payment confirmed successfully.",
                paymentId = newId,
                reservationId = request.ReservationID,
                listingTitle = reservation.Title,
                listingAddress = reservation.Location,
                hostName = reservation.HostName,
                spotNumber = reservation.AssignedSpotNumber,
                reservationStart = reservation.ReservationStart,
                reservationEnd = reservation.ReservationEnd,
                hours = Math.Round(hours, 2),
                pricePerHour = pricePerHour,
                baseAmount = baseAmount,
                serviceFee = serviceFee,
                totalAmount = totalAmount,
                paymentMethod = request.PaymentMethod,
                cardLastFour = cardLastFour,
                venmoHandle = request.VenmoHandle,
                paidAt = DateTime.UtcNow,
                status = "Confirmed"
            });
        }

        // ===============================
        // GET /api/Payments/reservation/{reservationId}
        // Get payment receipt for a reservation
        // ===============================
        [HttpGet("reservation/{reservationId}")]
        public async Task<IActionResult> GetPaymentByReservation(int reservationId)
        {
            var connectionString = _config.GetConnectionString("DefaultConnection");
            using var connection = new SqlConnection(connectionString);
            await connection.OpenAsync();

            var payment = await connection.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT pay.PaymentID, pay.Amount, pay.ServiceFee, pay.TotalAmount,
                       pay.PaymentMethod, pay.CardLastFour, pay.VenmoHandle,
                       pay.Status, pay.CreatedAt AS PaidAt,
                       r.ReservationID, r.AssignedSpotNumber, r.ReservationStart, r.ReservationEnd,
                       p.Title, p.Location, p.PricePerHour,
                       u.FullName AS HostName,
                       d.FullName AS DriverName
                FROM dbo.Payments pay
                JOIN dbo.Reservations r ON r.ReservationID = pay.ReservationID
                JOIN dbo.ParkingListings p ON p.ListingID = r.ListingID
                JOIN dbo.Users u ON u.UserID = p.HostUserID
                JOIN dbo.Users d ON d.UserID = r.DriverUserID
                WHERE pay.ReservationID = @ReservationID AND pay.Status = 'Confirmed'",
                new { ReservationID = reservationId });

            if (payment == null)
                return NotFound(new { message = "No confirmed payment found for this reservation." });

            var start = (DateTime)payment.ReservationStart;
            var end = (DateTime)payment.ReservationEnd;
            var hours = Math.Round((end - start).TotalHours, 2);

            return Ok(new
            {
                payment.PaymentID,
                payment.ReservationID,
                payment.Title,
                payment.Location,
                payment.HostName,
                payment.DriverName,
                payment.AssignedSpotNumber,
                payment.ReservationStart,
                payment.ReservationEnd,
                hours,
                payment.PricePerHour,
                payment.Amount,
                payment.ServiceFee,
                payment.TotalAmount,
                payment.PaymentMethod,
                payment.CardLastFour,
                payment.VenmoHandle,
                payment.PaidAt,
                payment.Status
            });
        }
    }
}