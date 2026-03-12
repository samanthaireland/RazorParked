namespace RazorParked.API.Models
{
    public class CreatePaymentRequest
    {
        public int ReservationID { get; set; }
        public int DriverUserID { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = ""; // Venmo, InAppCredit
    }
}
