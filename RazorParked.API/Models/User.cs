using System.ComponentModel.DataAnnotations;

using System.ComponentModel.DataAnnotations.Schema;



namespace RazorParked.API.Models

{

    public class User

    {

        [Key]

        [Column("UserID")]

        public int UserID { get; set; }



        [Column("FullName")]

        public string Username { get; set; } = string.Empty;



        public string Email { get; set; } = string.Empty;

        public string PasswordHash { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public bool IsActive { get; set; }

        public string? Bio { get; set; }

        public string? ProfilePicUrl { get; set; }

        public bool PromoOptIn { get; set; }

        public decimal Credits { get; set; } = 0.00m;

    }

}