using Microsoft.AspNetCore.Mvc;

namespace WebFileManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _configuration;

    public AuthController(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public record VerifyRequest(string ApiKey);

    [HttpGet("status")]
    public IActionResult Status()
    {
        return Ok(new { requireAuth = false });
    }

    [HttpPost("verify")]
    public IActionResult Verify([FromBody] VerifyRequest request)
    {
        var configuredApiKey = _configuration.GetValue<string>("Authentication:ApiKey");
        
        if (string.IsNullOrWhiteSpace(configuredApiKey))
            return Ok(new { success = true });

        if (configuredApiKey == request.ApiKey)
        {
            return Ok(new { success = true });
        }

        return Unauthorized(new { success = false, message = "Invalid API Key" });
    }
}
