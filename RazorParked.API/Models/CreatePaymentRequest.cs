namespace RazorParked.API.Models
{
    public class CreatePaymentRequest
    {
        public int ReservationID { get; set; }
        public int DriverUserID { get; set; }
        public decimal Amount { get; set; }
        public string PaymentMethod { get; set; } = ""; // Venmo, InAppCredit
        public string? CardNumber { get; set; }
        public string? CardName { get; set; }
        public string? CardExpiry { get; set; }
        public string? CardCvv { get; set; }
        public string? VenmoHandle { get; set; }
    }
}
