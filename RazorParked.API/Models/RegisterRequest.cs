namespace RazorParked.API.Models;

public class RegisterRequest
{
    public string FullName { get; set; } = "";
    public string Email { get; set; } = "";
    public string Password { get; set; } = "";
    public List<string> RoleNames { get; set; } = new(); // now supports multiple
}