using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using RazorParked.API.Models;

namespace RazorParked.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password) ||
            string.IsNullOrWhiteSpace(request.RoleName))
        {
            return BadRequest(new { message = "All fields are required." });
        }

        var connectionString = _config.GetConnectionString("DefaultConnection");

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        // Check if email exists
        var existingUser = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT UserID FROM dbo.Users WHERE Email = @Email",
            new { request.Email });

        if (existingUser != null)
            return Conflict(new { message = "Email already exists." });

        // Get RoleID
        var roleId = await connection.QueryFirstOrDefaultAsync<int?>(
            "SELECT RoleID FROM dbo.Roles WHERE RoleName = @RoleName",
            new { request.RoleName });

        if (roleId == null)
            return BadRequest(new { message = "Invalid role." });

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Insert
        await connection.ExecuteAsync(@"
            INSERT INTO dbo.Users (FullName, Email, PasswordHash, RoleID)
            VALUES (@FullName, @Email, @PasswordHash, @RoleID)",
            new
            {
                request.FullName,
                request.Email,
                PasswordHash = passwordHash,
                RoleID = roleId
            });

        return StatusCode(201, new { message = "Account created successfully." });
    }
}
