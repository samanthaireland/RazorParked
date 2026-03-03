using Dapper;
using Microsoft.AspNetCore.Identity.Data;
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

    // ===============================
    // REGISTER
    // ===============================
    [HttpPost("register")]
    public async Task<IActionResult> Register(
    [FromBody] RazorParked.API.Models.RegisterRequest request)
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

        // Check if email already exists
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

        // Hash password using BCrypt
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Insert user
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

    // ===============================
    // LOGIN
    // ===============================
    [HttpPost("login")]
    public async Task<IActionResult> Login(
    [FromBody] RazorParked.API.Models.LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var connectionString = _config.GetConnectionString("DefaultConnection");

        using var connection = new SqlConnection(connectionString);
        await connection.OpenAsync();

        var user = await connection.QueryFirstOrDefaultAsync<dynamic>(
            @"SELECT UserID, FullName, Email, PasswordHash 
              FROM dbo.Users 
              WHERE Email = @Email",
            new { request.Email });

        if (user == null)
            return Unauthorized(new { message = "Invalid email or password." });

        // BCrypt password verification (Criteria 3)
        bool isValidPassword = BCrypt.Net.BCrypt.Verify(
            request.Password,
            (string)user.PasswordHash
        );

        if (!isValidPassword)
            return Unauthorized(new { message = "Invalid email or password." });

        return Ok(new
        {
            message = "Login successful.",
            userId = user.UserID,
            fullName = user.FullName,
            email = user.Email
        });
    }
}