using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace RazorParked.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IConfiguration _config;
    public UsersController(IConfiguration config) { _config = config; }

    [HttpGet("{userId}")]
    public async Task<IActionResult> GetProfile(int userId)
    {
        var cs = _config.GetConnectionString("DefaultConnection");
        using var con = new SqlConnection(cs);
        await con.OpenAsync();

        var user = await con.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT UserID, FullName, Email, Bio, ProfilePicUrl FROM dbo.Users WHERE UserID = @UserId",
            new { UserId = userId });

        if (user == null) return NotFound(new { message = "User not found." });

        var roles = await con.QueryAsync<string>(
            @"SELECT r.RoleName FROM dbo.UserRoles ur
              JOIN dbo.Roles r ON ur.RoleID = r.RoleID
              WHERE ur.UserID = @UserId",
            new { UserId = userId });

        return Ok(new
        {
            userId = user.UserID,
            fullName = user.FullName,
            email = user.Email,
            bio = user.Bio ?? "",
            profilePicUrl = user.ProfilePicUrl ?? "",
            roles = roles.ToList()
        });
    }

    [HttpPut("{userId}")]
    public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileDto dto)
    {
        var cs = _config.GetConnectionString("DefaultConnection");
        using var con = new SqlConnection(cs);
        await con.OpenAsync();

        await con.ExecuteAsync(
            "UPDATE dbo.Users SET FullName=@FullName, Email=@Email, Bio=@Bio, ProfilePicUrl=@ProfilePicUrl WHERE UserID=@UserId",
            new { dto.FullName, dto.Email, dto.Bio, dto.ProfilePicUrl, UserId = userId });

        return Ok(new { message = "Profile updated." });
    }

    [HttpPut("{userId}/password")]
    public async Task<IActionResult> ChangePassword(int userId, [FromBody] ChangePasswordDto dto)
    {
        var cs = _config.GetConnectionString("DefaultConnection");
        using var con = new SqlConnection(cs);
        await con.OpenAsync();

        var user = await con.QueryFirstOrDefaultAsync<dynamic>(
            "SELECT PasswordHash FROM dbo.Users WHERE UserID = @UserId",
            new { UserId = userId });

        if (user == null) return NotFound(new { message = "User not found." });

        bool isValid = BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, (string)user.PasswordHash);
        if (!isValid) return BadRequest(new { message = "Current password is incorrect." });

        if (dto.NewPassword != dto.ConfirmPassword)
            return BadRequest(new { message = "Passwords do not match." });

        var newHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);

        await con.ExecuteAsync(
            "UPDATE dbo.Users SET PasswordHash=@Hash WHERE UserID=@UserId",
            new { Hash = newHash, UserId = userId });

        return Ok(new { message = "Password updated." });
    }
}

public class UpdateProfileDto
{
    public string? FullName { get; set; }
    public string? Email { get; set; }
    public string? Bio { get; set; }
    public string? ProfilePicUrl { get; set; }
}

public class ChangePasswordDto
{
    public string CurrentPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
    public string ConfirmPassword { get; set; } = "";
}
