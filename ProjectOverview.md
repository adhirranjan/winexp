# Web File Explorer Project Overview

## Introduction
The **Web File Explorer** is a web-based file management application that allows users to securely browse, preview, and download files from the host machine's file system. It uses a modern decoupled architecture, separating the backend API from the frontend user interface.

## Architecture
- **Backend**: Built with **C# ASP.NET Core** (targeting `.NET 10.0`). It serves as a RESTful API handling file system interactions, authentication, and file streaming.
- **Frontend**: A single-page application built with **Vanilla HTML, CSS, and JavaScript**. It utilizes **Bootstrap 5** for a responsive UI and integrates **Monaco Editor** for in-browser code previews.

## Directory Structure
- `/backend`: Contains the .NET Web API source code.
- `/frontend`: Contains the static web assets (HTML, JS, CSS).

---

## Backend Details

### 1. Controllers
- **`ExplorerController.cs`**: The core API controller for file operations.
  - `GET /api/explorer/drives`: Lists available drives on the host machine.
  - `GET /api/explorer/browse?path=...`: Lists directories and files for a given path.
  - `GET /api/explorer/view?path=...`: Streams a file for preview (e.g., images or text).
  - `GET /api/explorer/download?path=...`: Streams a file as an attachment for downloading.
- **`AuthController.cs`**: Handles security and API Key verification.
  - `GET /api/auth/status`: Checks if authentication is enabled on the server.
  - `POST /api/auth/verify`: Verifies the client's API Key against the server's configured key.

### 2. Services
- **`FileExplorerService.cs`**: Implements `IFileExplorerService`. It performs the low-level file system interactions using `System.IO` (e.g., `DriveInfo.GetDrives()`, `DirectoryInfo.EnumerateDirectories()`). It gracefully handles access permissions by skipping hidden/system files and ignoring `UnauthorizedAccessException`.

### 3. Security & Configuration
- **Authentication**: Secured via a custom `[ApiKeyAuth]` attribute. The API key is stored in `appsettings.json`.
- **CORS**: Configured in `Program.cs` to allow cross-origin requests, which is essential since the frontend and backend likely run on different ports/servers during development or deployment.

---

## Frontend Details

### 1. User Interface (`index.html`)
- **Login Modal**: Prompts the user for an API Key if the server requires authentication.
- **Navigation Toolbar**: Includes breadcrumb navigation, "Up" directory button, and a refresh button.
- **Sidebar**: Displays a list of available drives (e.g., C:\, D:\).
- **Main Content Area**: Displays files and folders in a tabular format with sortable columns (Name, Date modified, Type, Size).
- **Preview Modal**: A modal that dynamically loads file contents when a user double-clicks a file.

### 2. Application Logic (`js/app.js`)
- **API Communication**: Uses `fetch` to communicate with the backend, automatically attaching the `X-Api-Key` header if authenticated.
- **State Management**: Keeps track of `currentPath`, `currentDrives`, `fileNodes`, and sorting preferences (`currentSort`).
- **File Previewing**: 
  - **Images**: Loaded directly into an `<img>` tag via the `/view` endpoint.
  - **Code/Text**: Fetched and loaded into an embedded **Monaco Editor** instance with syntax highlighting based on the file extension.
  - **Unsupported Files**: Provides a fallback UI to download the file directly.

### 3. Styling (`css/site.css`)
- Leverages Bootstrap 5 classes heavily.
- Custom CSS is likely used to create a dark mode "glass-panel" aesthetic and handle specific layout constraints (like the sticky header for the file table and sidebar scrolling).

## Key Features
1. **API Key Protection**: Simple but effective security mechanism to prevent unauthorized access to the host's file system.
2. **Rich File Previews**: Integration with Monaco Editor provides a VS Code-like reading experience for source code files.
3. **Responsive Design**: Bootstrap 5 ensures the file explorer is usable across different screen sizes.
4. **Robust File System Handling**: The backend safely ignores hidden and system files and handles permission errors smoothly.

