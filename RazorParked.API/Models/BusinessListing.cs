namespace RazorParked.API.Models
{
    public class BusinessHours
    {
        public int BusinessHoursID { get; set; }
        public int ListingID { get; set; }
        public string DayOfWeek { get; set; } = "";
        public TimeSpan OpenTime { get; set; }
        public TimeSpan CloseTime { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class BulkListingRequest
    {
        public int HostUserID { get; set; }
        public List<CreateListingRequest> Listings { get; set; } = new();
    }

    public class BusinessHoursRequest
    {
        public int HostUserID { get; set; }
        public List<BusinessHoursEntry> Hours { get; set; } = new();
    }

    public class BusinessHoursEntry
    {
        public string DayOfWeek { get; set; } = "";
        public TimeSpan OpenTime { get; set; }
        public TimeSpan CloseTime { get; set; }
    }

    public class DisableListingRequest
    {
        public int HostUserID { get; set; }
        public bool IsDisabled { get; set; }
    }
}