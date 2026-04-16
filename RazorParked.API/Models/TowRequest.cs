namespace RazorParked.API.Models
{
    public class TowRequest
    {
        public int TowRequestID { get; set; }
        public int HostUserID { get; set; }
        public int ListingID { get; set; }
        public string SpotNumber { get; set; } = "";
        public string? VehicleDescription { get; set; }
        public string Status { get; set; } = "Pending"; // Pending, Dispatched, Resolved
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
