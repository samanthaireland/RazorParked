namespace RazorParked.API.Models
{
    public class Reservation
    {
        public int ReservationID { get; set; }
        public int ListingID { get; set; }
        public int DriverUserID { get; set; }
        public string AssignedSpotNumber { get; set; } = "";
        public DateTime ReservationStart { get; set; }
        public DateTime ReservationEnd { get; set; }
        public string Status { get; set; } = "Confirmed"; // Confirmed, Cancelled
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
