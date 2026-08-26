using Microsoft.AspNetCore.StaticFiles;

namespace WebFileManager.Services;

public class FileExplorerService : IFileExplorerService
{
    private readonly FileExtensionContentTypeProvider _contentTypeProvider = new();

    public IEnumerable<FileSystemNode> GetDrives()
    {
        return DriveInfo.GetDrives()
            .Where(d => d.IsReady)
            .Select(d => new FileSystemNode(
                Name: d.Name,
                FullPath: d.RootDirectory.FullName,
                IsDirectory: true,
                Size: d.TotalSize,
                LastModified: DateTime.MinValue,
                Extension: ""
            ));
    }

    public IEnumerable<FileSystemNode> GetDirectoryContent(string path)
    {
        if (string.IsNullOrWhiteSpace(path))
            return GetDrives();

        var directory = new DirectoryInfo(path);
        if (!directory.Exists)
            throw new DirectoryNotFoundException($"Directory not found: {path}");

        var nodes = new List<FileSystemNode>();

        try
        {
            foreach (var dir in directory.EnumerateDirectories())
            {
                // Skip hidden/system directories
                if ((dir.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden ||
                    (dir.Attributes & FileAttributes.System) == FileAttributes.System)
                    continue;

                nodes.Add(new FileSystemNode(
                    Name: dir.Name,
                    FullPath: dir.FullName,
                    IsDirectory: true,
                    Size: null,
                    LastModified: dir.LastWriteTime,
                    Extension: ""
                ));
            }

            foreach (var file in directory.EnumerateFiles())
            {
                // Skip hidden/system files
                if ((file.Attributes & FileAttributes.Hidden) == FileAttributes.Hidden ||
                    (file.Attributes & FileAttributes.System) == FileAttributes.System)
                    continue;

                nodes.Add(new FileSystemNode(
                    Name: file.Name,
                    FullPath: file.FullName,
                    IsDirectory: false,
                    Size: file.Length,
                    LastModified: file.LastWriteTime,
                    Extension: file.Extension
                ));
            }
        }
        catch (UnauthorizedAccessException)
        {
            // Ignore items we can't access
        }

        return nodes.OrderByDescending(n => n.IsDirectory).ThenBy(n => n.Name);
    }

    public (string FullPath, string ContentType, string FileName) GetFileInfo(string path)
    {
        var fileInfo = new FileInfo(path);
        if (!fileInfo.Exists)
            throw new FileNotFoundException($"File not found: {path}");

        if (!_contentTypeProvider.TryGetContentType(fileInfo.Name, out var contentType))
        {
            contentType = "application/octet-stream";
        }

        return (fileInfo.FullName, contentType, fileInfo.Name);
    }
}
