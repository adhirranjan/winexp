using WebFileManager.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register custom services
builder.Services.AddSingleton<IFileExplorerService, FileExplorerService>();

var app = builder.Build();

app.UseRouting();

// Enable CORS
app.UseCors("AllowAll");

app.MapControllers();

app.Run();
