using Microsoft.AspNetCore.Mvc;
using WebFileManager.Services;

namespace WebFileManager.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ExplorerController : ControllerBase
{
    private readonly IFileExplorerService _explorerService;

    public ExplorerController(IFileExplorerService explorerService)
    {
        _explorerService = explorerService;
    }

    [HttpGet("drives")]
    public IActionResult GetDrives()
    {
        try
        {
            var drives = _explorerService.GetDrives();
            return Ok(drives);
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("browse")]
    public IActionResult Browse([FromQuery] string? path)
    {
        try
        {
            var decodedPath = string.IsNullOrEmpty(path) ? "" : Uri.UnescapeDataString(path);
            var content = _explorerService.GetDirectoryContent(decodedPath);
            return Ok(content);
        }
        catch (DirectoryNotFoundException)
        {
            return NotFound(new { error = "Directory not found" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("view")]
    public IActionResult ViewFile([FromQuery] string path)
    {
        try
        {
            var decodedPath = Uri.UnescapeDataString(path);
            var (fullPath, contentType, fileName) = _explorerService.GetFileInfo(decodedPath);
            
            return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpGet("download")]
    public IActionResult DownloadFile([FromQuery] string path)
    {
        try
        {
            var decodedPath = Uri.UnescapeDataString(path);
            var (fullPath, contentType, fileName) = _explorerService.GetFileInfo(decodedPath);
            
            return PhysicalFile(fullPath, contentType, fileName, enableRangeProcessing: true);
        }
        catch (FileNotFoundException)
        {
            return NotFound();
        }
        catch (Exception ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}
