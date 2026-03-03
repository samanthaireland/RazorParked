namespace RazorParked.API.Models;

public class CreateListingRequest
{
    public int HostUserID { get; set; }
    public string Title { get; set; } = "";
    public string? Description { get; set; }
    public string Location { get; set; } = "";
    public decimal PricePerHour { get; set; }
}