namespace RazorParked.API.Models
{
    public class TowingContact
    {
        public int TowingContactID { get; set; }
        public string CompanyName { get; set; } = "";
        public string Phone { get; set; } = "";
        public string ServiceArea { get; set; } = "";
        public string? HoursOfOperation { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
