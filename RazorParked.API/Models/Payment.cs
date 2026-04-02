namespace RazorParked.API.Models
{
    public class Payment
    {
        public int PaymentID { get; set; }
        public int ReservationID { get; set; }
        public int DriverUserID { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = ""; // Venmo, InAppCredit
        public string Status { get; set; } = "Pending"; // Pending, Confirmed
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Reservation Reservation { get; set; }
    }
}
