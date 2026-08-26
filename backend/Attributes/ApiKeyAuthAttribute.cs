using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace WebFileManager.Attributes;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public class ApiKeyAuthAttribute : Attribute, IAuthorizationFilter
{
    private const string ApiKeyHeaderName = "X-Api-Key";
    private const string ApiKeyQueryName = "key";

    public void OnAuthorization(AuthorizationFilterContext context)
    {
        var configuration = context.HttpContext.RequestServices.GetRequiredService<IConfiguration>();
        var configuredApiKey = configuration.GetValue<string>("Authentication:ApiKey");

        if (string.IsNullOrWhiteSpace(configuredApiKey))
        {
            // If no API key is configured, we allow anonymous access
            return;
        }

        // Check header first
        string? extractedApiKey = context.HttpContext.Request.Headers[ApiKeyHeaderName];

        if (string.IsNullOrEmpty(extractedApiKey))
        {
            // Fallback to Query String (for <img> and <a> tags)
            extractedApiKey = context.HttpContext.Request.Query[ApiKeyQueryName];
            
            if (string.IsNullOrEmpty(extractedApiKey))
            {
                context.Result = new UnauthorizedObjectResult("API Key is missing");
                return;
            }
        }

        if (!configuredApiKey.Equals(extractedApiKey))
        {
            context.Result = new UnauthorizedObjectResult("Invalid API Key");
            return;
        }
    }
}
