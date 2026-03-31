using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RazorParked.API.Models
{
    public class Message
    {
        [Key]
        public int MessageID { get; set; }

        [Required]
        public int ConversationID { get; set; }

        [Required]
        public int SenderUserID { get; set; }

        [Required]
        public int ReceiverUserID { get; set; }

        [Required]
        [MaxLength(2000)]
        public string Body { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        public DateTime SentAt { get; set; } = DateTime.UtcNow;
    }

    public class Conversation
    {
        [Key]
        public int ConversationID { get; set; }

        [Required]
        public int ListingID { get; set; }

        [Required]
        public int DriverUserID { get; set; }

        [Required]
        public int HostUserID { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}