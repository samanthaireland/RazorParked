using Microsoft.EntityFrameworkCore;
using RazorParked.API.Models;

namespace RazorParked.API.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }

        public DbSet<ParkingListing> ParkingListings { get; set; }
    }
}