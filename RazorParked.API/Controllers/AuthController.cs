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
            request.RoleNames == null || request.RoleNames.Count == 0)
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
        {
            // Email exists — just ADD the new roles to the existing account
            foreach (var roleName in request.RoleNames)
            {
                var roleId = await connection.QueryFirstOrDefaultAsync<int?>(
                    "SELECT RoleID FROM dbo.Roles WHERE RoleName = @RoleName",
                    new { RoleName = roleName });

                if (roleId == null) continue;

                // Insert only if not already assigned
                await connection.ExecuteAsync(@"
                    IF NOT EXISTS (
                        SELECT 1 FROM dbo.UserRoles 
                        WHERE UserID = @UserID AND RoleID = @RoleID
                    )
                    INSERT INTO dbo.UserRoles (UserID, RoleID) 
                    VALUES (@UserID, @RoleID)",
                    new { UserID = existingUser, RoleID = roleId });
            }

            return Ok(new { message = "Role added to existing account." });
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Insert new user
        var newUserId = await connection.QuerySingleAsync<int>(@"
            INSERT INTO dbo.Users (FullName, Email, PasswordHash)
            OUTPUT INSERTED.UserID
            VALUES (@FullName, @Email, @PasswordHash)",
            new
            {
                request.FullName,
                request.Email,
                PasswordHash = passwordHash
            });

        // Insert all selected roles into UserRoles
        foreach (var roleName in request.RoleNames)
        {
            var roleId = await connection.QueryFirstOrDefaultAsync<int?>(
                "SELECT RoleID FROM dbo.Roles WHERE RoleName = @RoleName",
                new { RoleName = roleName });

            if (roleId == null) continue;

            await connection.ExecuteAsync(@"
                INSERT INTO dbo.UserRoles (UserID, RoleID) 
                VALUES (@UserID, @RoleID)",
                new { UserID = newUserId, RoleID = roleId });
        }

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

        bool isValidPassword = BCrypt.Net.BCrypt.Verify(
            request.Password,
            (string)user.PasswordHash);

        if (!isValidPassword)
            return Unauthorized(new { message = "Invalid email or password." });

        // Fetch all roles for this user
        var roles = await connection.QueryAsync<string>(
            @"SELECT r.RoleName 
              FROM dbo.UserRoles ur
              JOIN dbo.Roles r ON ur.RoleID = r.RoleID
              WHERE ur.UserID = @UserID",
            new { UserID = user.UserID });

        var roleList = roles.ToList();

        return Ok(new
        {
            message = "Login successful.",
            userId = user.UserID,
            fullName = user.FullName,
            email = user.Email,
            roles = roleList,                          // e.g. ["Customer", "Host"]
            role = roleList.Contains("Host") ? "Host" : "Customer"  // primary role
        });
    }
}