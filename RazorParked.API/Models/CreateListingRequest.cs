namespace RazorParked.API.Models
{
    public class CreateListingRequest
    {
        public int HostUserID { get; set; }
        public string Title { get; set; } = "";
        public string? Description { get; set; }
        public string Location { get; set; } = "";
        public decimal PricePerHour { get; set; }
        public DateTime AvailableFrom { get; set; }
        public DateTime AvailableTo { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}