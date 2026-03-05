using System.ComponentModel.DataAnnotations;

namespace RazorParked.API.Models
{
    public class ParkingListing
    {
        [Key]
        public int Id { get; set; }

        public int HostId { get; set; }

        public string Location { get; set; }

        public bool IsAvailable { get; set; }

        public DateTime AvailableFrom { get; set; }

        public DateTime AvailableTo { get; set; }

        public decimal PricePerHour { get; set; }
    }
}