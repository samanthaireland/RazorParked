namespace RazorParked.API.Models
{
    public class ListingDate
    {
        public int DateID { get; set; }
        public int ListingID { get; set; }
        public DateTime ListedDate { get; set; }
        public string? Label { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateListingDateRequest
    {
        public int HostUserID { get; set; }
        public List<ListingDateEntry> Dates { get; set; } = new();
    }

    public class ListingDateEntry
    {
        public DateTime ListedDate { get; set; }
        public string? Label { get; set; }
    }

}
