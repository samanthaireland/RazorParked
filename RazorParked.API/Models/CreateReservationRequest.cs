namespace RazorParked.API.Models
{
    public class CreateReservationRequest
    {
        public int ListingID { get; set; }
        public int DriverUserID { get; set; }
        public DateTime ReservationStart { get; set; }
        public DateTime ReservationEnd { get; set; }
    }
}
