namespace RazorParked.API.Models
{
    public class Review
    {
        public int ReviewID { get; set; }
        public int ListingID { get; set; }
        public int UserID { get; set; }
        public int ReservationID { get; set; }
        public int StarRating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateReviewRequest
    {
        public int ListingID { get; set; }
        public int UserID { get; set; }
        public int ReservationID { get; set; }
        public int StarRating { get; set; }
        public string? Comment { get; set; }
    }

    public class Favorite
    {
        public int FavoriteID { get; set; }
        public int UserID { get; set; }
        public int ListingID { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateFavoriteRequest
    {
        public int UserID { get; set; }
        public int ListingID { get; set; }
    }
}