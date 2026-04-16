namespace RazorParked.API.Models
{
    public class AddAvailabilitySlotRequest
    {
        public int HostUserID { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime EndDateTime { get; set; }
    }
}