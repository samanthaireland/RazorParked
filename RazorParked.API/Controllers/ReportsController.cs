using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RazorParked.API.Data;

namespace RazorParked.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ReportsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // =========================
        // 1. Earnings Report
        // =========================
        // GET: api/Reports/host/{hostId}/earnings
        [HttpGet("host/{hostId}/earnings")]
        public async Task<IActionResult> GetEarnings(int hostId)
        {
            var earnings = await _context.Payments
                .Include(p => p.Reservation)
                .ThenInclude(r => r.Listing)
                .Where(p => p.Reservation.Listing.HostUserID == hostId
                            && p.Status == "Confirmed")
                .ToListAsync();

            var total = earnings.Sum(e => e.Amount);

            var perListing = earnings
                .GroupBy(e => e.Reservation.Listing.Title)
                .Select(g => new
                {
                    listing = g.Key,
                    total = g.Sum(x => x.Amount)
                });

            return Ok(new
            {
                totalEarnings = total,
                breakdown = perListing
            });
        }

        // =========================
        // 2. Reservations Report
        // =========================
        // GET: api/Reports/host/{hostId}/reservations
        [HttpGet("host/{hostId}/reservations")]
        public async Task<IActionResult> GetReservations(int hostId)
        {
            var reservations = await _context.Reservations
                .Include(r => r.Listing)
                .Where(r => r.Listing.HostUserID == hostId)
                .Select(r => new
                {
                    reservationId = r.ReservationID,
                    listing = r.Listing.Title,
                    start = r.ReservationStart,
                    end = r.ReservationEnd,
                    status = r.Status
                })
                .ToListAsync();

            return Ok(reservations);
        }

        // =========================
        // 3. Usage Report
        // =========================
        // GET: api/Reports/host/{hostId}/usage
        [HttpGet("host/{hostId}/usage")]
        public async Task<IActionResult> GetUsage(int hostId)
        {
            var reservations = await _context.Reservations
                .Include(r => r.Listing)
                .Where(r => r.Listing.HostUserID == hostId)
                .ToListAsync();

            var totalReservations = reservations.Count;
            var confirmed = reservations.Count(r => r.Status == "Confirmed");
            var cancelled = reservations.Count(r => r.Status == "Cancelled");

            return Ok(new
            {
                totalReservations,
                confirmed,
                cancelled
            });
        }
    }
}