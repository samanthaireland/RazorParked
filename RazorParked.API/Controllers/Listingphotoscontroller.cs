using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace RazorParked.API.Controllers
{
    [Route("api/Listings/{listingId}/photos")]
    [ApiController]
    public class ListingPhotosController : ControllerBase
    {
        private readonly IConfiguration _config;
        private readonly IWebHostEnvironment _env;

        public ListingPhotosController(IConfiguration config, IWebHostEnvironment env)
        {
            _config = config;
            _env = env;
        }

        // ══════════════════════════════════════
        // GET /api/Listings/{listingId}/photos
        // Returns all photos for a listing
        // ══════════════════════════════════════
        [HttpGet]
        public async Task<IActionResult> GetPhotos(int listingId)
        {
            var cs = _config.GetConnectionString("DefaultConnection");
            using var conn = new SqlConnection(cs);
            var photos = await conn.QueryAsync<dynamic>(@"
                SELECT PhotoID, ListingID, FileName, OriginalName, SortOrder, UploadedAt
                FROM dbo.ListingPhotos
                WHERE ListingID = @ListingID
                ORDER BY SortOrder ASC, UploadedAt ASC",
                new { ListingID = listingId });

            // Build public URLs
            var result = photos.Select(p => new {
                p.PhotoID,
                p.ListingID,
                p.FileName,
                p.OriginalName,
                p.SortOrder,
                p.UploadedAt,
                Url = $"/images/listings/{p.FileName}"
            });

            return Ok(result);
        }

        // ══════════════════════════════════════
        // POST /api/Listings/{listingId}/photos
        // Upload one or more photos
        // Form field name: "photos"
        // Query param:     hostUserId (for auth check)
        // ══════════════════════════════════════
        [HttpPost]
        public async Task<IActionResult> UploadPhotos(
            int listingId,
            [FromQuery] int hostUserId,
            IList<IFormFile> photos)
        {
            if (photos == null || photos.Count == 0)
                return BadRequest(new { message = "No files uploaded." });

            var cs = _config.GetConnectionString("DefaultConnection");
            using var conn = new SqlConnection(cs);

            // Verify the listing belongs to this host
            var listing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ListingID FROM dbo.ParkingListings
                WHERE ListingID = @ListingID AND HostUserID = @HostUserID",
                new { ListingID = listingId, HostUserID = hostUserId });

            if (listing == null)
                return Forbid();

            // Get current max sort order so new photos go at the end
            var maxSort = await conn.QuerySingleAsync<int?>(@"
                SELECT MAX(SortOrder) FROM dbo.ListingPhotos WHERE ListingID = @ListingID",
                new { ListingID = listingId }) ?? -1;

            // Ensure the upload directory exists
            var uploadDir = Path.Combine(_env.WebRootPath, "images", "listings");
            Directory.CreateDirectory(uploadDir);

            var allowedTypes = new[] { "image/jpeg", "image/png", "image/webp", "image/gif" };
            var uploaded = new List<object>();

            foreach (var file in photos)
            {
                if (file.Length == 0) continue;
                if (!allowedTypes.Contains(file.ContentType.ToLower()))
                    return BadRequest(new { message = $"File type {file.ContentType} is not allowed." });
                if (file.Length > 10 * 1024 * 1024) // 10 MB limit
                    return BadRequest(new { message = "Each file must be under 10 MB." });

                // Generate a unique filename to avoid collisions
                var ext = Path.GetExtension(file.FileName).ToLower();
                var uniqueName = $"{listingId}_{Guid.NewGuid():N}{ext}";
                var filePath = Path.Combine(uploadDir, uniqueName);

                using (var stream = System.IO.File.Create(filePath))
                    await file.CopyToAsync(stream);

                maxSort++;
                var photoId = await conn.QuerySingleAsync<int>(@"
                    INSERT INTO dbo.ListingPhotos (ListingID, FileName, OriginalName, SortOrder, UploadedAt)
                    VALUES (@ListingID, @FileName, @OriginalName, @SortOrder, GETUTCDATE());
                    SELECT CAST(SCOPE_IDENTITY() AS INT);",
                    new
                    {
                        ListingID = listingId,
                        FileName = uniqueName,
                        OriginalName = file.FileName,
                        SortOrder = maxSort
                    });

                uploaded.Add(new
                {
                    photoId,
                    fileName = uniqueName,
                    originalName = file.FileName,
                    url = $"/images/listings/{uniqueName}",
                    sortOrder = maxSort
                });
            }

            return StatusCode(201, new { message = "Photos uploaded.", photos = uploaded });
        }

        // ══════════════════════════════════════
        // DELETE /api/Listings/{listingId}/photos/{photoId}
        // Delete a single photo
        // ══════════════════════════════════════
        [HttpDelete("{photoId}")]
        public async Task<IActionResult> DeletePhoto(
            int listingId,
            int photoId,
            [FromQuery] int hostUserId)
        {
            var cs = _config.GetConnectionString("DefaultConnection");
            using var conn = new SqlConnection(cs);

            // Verify ownership
            var photo = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT lp.PhotoID, lp.FileName
                FROM dbo.ListingPhotos lp
                JOIN dbo.ParkingListings pl ON pl.ListingID = lp.ListingID
                WHERE lp.PhotoID = @PhotoID
                  AND lp.ListingID = @ListingID
                  AND pl.HostUserID = @HostUserID",
                new { PhotoID = photoId, ListingID = listingId, HostUserID = hostUserId });

            if (photo == null)
                return NotFound(new { message = "Photo not found or not authorised." });

            // Delete file from disk
            var filePath = Path.Combine(_env.WebRootPath, "images", "listings", (string)photo.FileName);
            if (System.IO.File.Exists(filePath))
                System.IO.File.Delete(filePath);

            await conn.ExecuteAsync(@"
                DELETE FROM dbo.ListingPhotos WHERE PhotoID = @PhotoID",
                new { PhotoID = photoId });

            return Ok(new { message = "Photo deleted." });
        }

        // ══════════════════════════════════════
        // PATCH /api/Listings/{listingId}/photos/reorder
        // Body: [{ photoId: 1, sortOrder: 0 }, ...]
        // ══════════════════════════════════════
        [HttpPatch("reorder")]
        public async Task<IActionResult> ReorderPhotos(
            int listingId,
            [FromQuery] int hostUserId,
            [FromBody] List<PhotoOrderItem> items)
        {
            var cs = _config.GetConnectionString("DefaultConnection");
            using var conn = new SqlConnection(cs);

            // Verify ownership
            var listing = await conn.QueryFirstOrDefaultAsync<dynamic>(@"
                SELECT ListingID FROM dbo.ParkingListings
                WHERE ListingID = @ListingID AND HostUserID = @HostUserID",
                new { ListingID = listingId, HostUserID = hostUserId });

            if (listing == null) return Forbid();

            foreach (var item in items)
            {
                await conn.ExecuteAsync(@"
                    UPDATE dbo.ListingPhotos
                    SET SortOrder = @SortOrder
                    WHERE PhotoID = @PhotoID AND ListingID = @ListingID",
                    new { item.PhotoId, item.SortOrder, ListingID = listingId });
            }

            return Ok(new { message = "Order updated." });
        }
    }

    public class PhotoOrderItem
    {
        public int PhotoId { get; set; }
        public int SortOrder { get; set; }
    }
}
