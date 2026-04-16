using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RazorParked.API.Data;

namespace RazorParked.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AnalyticsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/Analytics/business/{businessId}
        [HttpGet("business/{businessId}")]
        public async Task<IActionResult> GetBusinessAnalytics(int businessId)
        {
            var listings = await _context.ParkingListings
                .Where(l => l.HostUserID == businessId)
                .ToListAsync();

            if (!listings.Any())
            {
                return Ok(new List<object>());
            }

            var listingIds = listings.Select(l => l.ListingID).ToList();

            var reservations = await _context.Reservations
                .Where(r => listingIds.Contains(r.ListingID))
                .ToListAsync();

            var result = listings.Select(l => new
            {
                listingId = l.ListingID,
                listingName = l.Title,
                totalReservations = reservations.Count(r => r.ListingID == l.ListingID),
                confirmedReservations = reservations.Count(r => r.ListingID == l.ListingID && r.Status == "Confirmed"),
                cancelledReservations = reservations.Count(r => r.ListingID == l.ListingID && r.Status == "Cancelled"),
                estimatedRevenue = reservations.Count(r => r.ListingID == l.ListingID && r.Status == "Confirmed") * l.PricePerHour
            });

            return Ok(result);
        }
    }
}