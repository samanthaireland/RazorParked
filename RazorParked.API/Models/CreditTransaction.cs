using System.ComponentModel.DataAnnotations;

namespace RazorParked.API.Models

{

    public class CreditTransaction

    {
        [Key]
        public int TransactionID { get; set; }

        public int SenderUserID { get; set; }

        public int ReceiverUserID { get; set; }

        public string Type { get; set; } = "purchase";

        public decimal Amount { get; set; }

        public int? ReservationId { get; set; }

        public string? Note { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    }

}