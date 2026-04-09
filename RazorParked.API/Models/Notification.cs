namespace RazorParked.API.Models
{
    public class Notification
    {
        public int NotificationID { get; set; }
        public int UserID { get; set; }
        public int? ReservationID { get; set; }
        public string Type { get; set; } = "ReservationConfirmed"; // ReservationConfirmed, ReservationCancelled, PaymentReceived
        public string Message { get; set; } = "";
        public bool IsRead { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
