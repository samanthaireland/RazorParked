namespace RazorParked.API.Models;

public class UpdateListingRequest
{
    public int HostUserID { get; set; }   // used for ownership validation
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Location { get; set; } = "";
    public decimal PricePerHour { get; set; }
    public bool IsAvailable { get; set; }
}