namespace WebFileManager.Services;

public record FileSystemNode(string Name, string FullPath, bool IsDirectory, long? Size, DateTime LastModified, string Extension);

public interface IFileExplorerService
{
    IEnumerable<FileSystemNode> GetDrives();
    IEnumerable<FileSystemNode> GetDirectoryContent(string path);
    (string FullPath, string ContentType, string FileName) GetFileInfo(string path);
}
