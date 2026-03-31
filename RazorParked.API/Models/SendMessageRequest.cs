namespace RazorParked.API.Models
{
    public class SendMessageRequest
    {
        public int SenderUserID { get; set; }
        public int ReceiverUserID { get; set; }
        public int ListingID { get; set; }
        public string Body { get; set; } = string.Empty;
    }
}