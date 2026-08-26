// Configure API Base URL. Change this when deploying frontend to Vercel and backend to IIS.
//https://59.95.101.93:8935
//https://192.168.0.140:6001
const API_BASE_URL = 'https://59.95.101.93:8935'; // Public reverse-proxy IP for Vercel/Mobile
//const API_BASE_URL = 'https://192.168.0.140:6001'; // Public reverse-proxy IP for Vercel/Mobile

let currentPath = '';
let currentDrives = [];
let fileNodes = [];
let monacoEditor = null;
let currentSort = { column: 'name', asc: true };

// Bootstrap elements

const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));

// Helper for making API requests
async function apiFetch(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    return fetch(url, options);
}

// Wait for DOM
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    initMonaco();
});

// Setup Monaco Editor
function initMonaco() {
    require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }});
    require(['vs/editor/editor.main'], function() {
        monacoEditor = monaco.editor.create(document.getElementById('editorContainer'), {
            value: '',
            language: 'plaintext',
            theme: 'vs-dark',
            readOnly: true,
            automaticLayout: true,
            minimap: { enabled: false }
        });
    });
}

// Start App
function initializeApp() {
    document.getElementById('appContainer').classList.remove('d-none');
    loadDrives();
    loadDirectory('');
}

// Navigation & Data Loading
function setupEventListeners() {
    document.getElementById('btnUp').addEventListener('click', () => {
        if (!currentPath) return;
        const lastSlash = Math.max(currentPath.lastIndexOf('\\'), currentPath.lastIndexOf('/'));
        if (lastSlash > 0) {
            if (lastSlash === 2 && currentPath[1] === ':') {
                loadDirectory('');
            } else {
                loadDirectory(currentPath.substring(0, lastSlash));
            }
        } else {
            loadDirectory('');
        }
    });

    document.getElementById('btnRefresh').addEventListener('click', () => {
        loadDirectory(currentPath);
    });

    document.querySelectorAll('.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (currentSort.column === col) {
                currentSort.asc = !currentSort.asc;
            } else {
                currentSort.column = col;
                currentSort.asc = true;
            }
            renderFileList();
        });
    });
}

async function loadDrives() {
    try {
        const res = await apiFetch('/api/explorer/drives');
        if (res.status === 401) { location.reload(); return; }
        
        currentDrives = await res.json();
        renderSidebar();
    } catch (err) {
        console.error('Failed to load drives', err);
    }
}

async function loadDirectory(path) {
    try {
        const url = `/api/explorer/browse?path=${encodeURIComponent(path)}`;
        const res = await apiFetch(url);
        if (res.status === 401) { location.reload(); return; }
        
        if (res.ok) {
            currentPath = path;
            fileNodes = await res.json();
            renderBreadcrumb();
            renderFileList();
            highlightSidebar();
        } else {
            alert('Failed to open directory. It might be inaccessible.');
        }
    } catch (err) {
        console.error('Failed to load directory', err);
    }
}

// Rendering
function renderSidebar() {
    const list = document.getElementById('driveList');
    list.innerHTML = '';
    
    currentDrives.forEach(drive => {
        const li = document.createElement('li');
        li.className = 'nav-item';
        
        const a = document.createElement('a');
        a.className = 'nav-link';
        a.dataset.path = drive.fullPath;
        a.innerHTML = `<i class="bi bi-hdd-network text-light me-2"></i> ${drive.name} (${formatBytes(drive.size)})`;
        
        a.addEventListener('click', () => loadDirectory(drive.fullPath));
        
        li.appendChild(a);
        list.appendChild(li);
    });
}

function highlightSidebar() {
    document.querySelectorAll('#driveList .nav-link').forEach(a => {
        a.classList.remove('active');
        if (currentPath && currentPath.startsWith(a.dataset.path)) {
            a.classList.add('active');
        }
    });
}

function renderBreadcrumb() {
    const bc = document.getElementById('breadcrumb');
    bc.innerHTML = '';
    
    if (!currentPath) {
        const item = document.createElement('div');
        item.className = 'breadcrumb-item fw-bold';
        item.textContent = 'This PC';
        bc.appendChild(item);
        return;
    }
    
    const pc = document.createElement('div');
    pc.className = 'breadcrumb-item';
    pc.textContent = 'This PC';
    pc.addEventListener('click', () => loadDirectory(''));
    bc.appendChild(pc);
    
    const parts = currentPath.split(/[/\\]/).filter(p => p);
    let buildPath = '';
    
    parts.forEach((part, index) => {
        const sep = document.createElement('div');
        sep.className = 'breadcrumb-separator';
        sep.innerHTML = '<i class="bi bi-chevron-right fs-7"></i>';
        bc.appendChild(sep);
        
        buildPath += (index === 0 ? part + '\\' : (index === 1 ? part : '\\' + part));
        const currPath = buildPath;
        
        const item = document.createElement('div');
        item.className = 'breadcrumb-item' + (index === parts.length - 1 ? ' fw-bold' : '');
        item.textContent = part;
        item.addEventListener('click', () => loadDirectory(currPath));
        bc.appendChild(item);
    });
}

function renderFileList() {
    const tbody = document.getElementById('fileList');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';
    
    if (fileNodes.length === 0) {
        tbody.parentElement.classList.add('d-none');
        emptyState.classList.remove('d-none');
        return;
    }
    
    tbody.parentElement.classList.remove('d-none');
    emptyState.classList.add('d-none');

    let sorted = [...fileNodes];
    sorted.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory && currentSort.column !== 'size') {
            return a.isDirectory ? -1 : 1;
        }
        
        let valA, valB;
        switch (currentSort.column) {
            case 'name': valA = a.name.toLowerCase(); valB = b.name.toLowerCase(); break;
            case 'date': valA = new Date(a.lastModified); valB = new Date(b.lastModified); break;
            case 'type': valA = (a.isDirectory ? 'folder' : a.extension).toLowerCase(); valB = (b.isDirectory ? 'folder' : b.extension).toLowerCase(); break;
            case 'size': valA = a.size || 0; valB = b.size || 0; break;
        }
        
        if (valA < valB) return currentSort.asc ? -1 : 1;
        if (valA > valB) return currentSort.asc ? 1 : -1;
        return 0;
    });
    
    sorted.forEach(node => {
        const tr = document.createElement('tr');
        const iconInfo = getIconInfo(node);
        
        tr.innerHTML = `
            <td class="text-center"><i class="${iconInfo.icon} file-icon"></i></td>
            <td>${node.name}</td>
            <td class="d-none d-md-table-cell">${node.lastModified !== '0001-01-01T00:00:00' ? new Date(node.lastModified).toLocaleString() : ''}</td>
            <td class="d-none d-md-table-cell">${node.isDirectory ? 'File folder' : (node.extension ? node.extension.substring(1).toUpperCase() + ' File' : 'File')}</td>
            <td class="d-none d-md-table-cell">${node.size != null ? formatBytes(node.size) : ''}</td>
        `;
        
        tr.addEventListener('click', () => {
            if (node.isDirectory) {
                loadDirectory(node.fullPath);
            } else {
                openPreview(node);
            }
        });
        
        tbody.appendChild(tr);
    });
}

const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'];
const codeExts = ['.cs', '.vb', '.js', '.ts', '.html', '.css', '.json', '.xml', '.sql', '.md', '.yml', '.yaml', '.py', '.txt', '.ps1', '.ini', '.config', '.sln', '.csproj'];

function getIconInfo(node) {
    if (node.isDirectory) return { icon: 'bi bi-folder-fill icon-folder', type: 'folder' };
    
    const ext = node.extension.toLowerCase();
    if (imageExts.includes(ext)) return { icon: 'bi bi-file-image icon-image', type: 'image' };
    if (codeExts.includes(ext)) return { icon: 'bi bi-file-code icon-code', type: 'code' };
    if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(ext)) return { icon: 'bi bi-file-zip icon-archive', type: 'archive' };
    if (['.mp4', '.avi', '.mkv'].includes(ext)) return { icon: 'bi bi-file-play icon-video', type: 'video' };
    if (['.mp3', '.wav', '.ogg'].includes(ext)) return { icon: 'bi bi-file-music icon-audio', type: 'audio' };
    if (['.exe', '.dll', '.msi'].includes(ext)) return { icon: 'bi bi-window-sidebar icon-exe', type: 'exe' };
    
    return { icon: 'bi bi-file-earmark icon-text', type: 'unknown' };
}

function getMonacoLang(ext) {
    const map = {
        '.cs': 'csharp', '.vb': 'vb', '.js': 'javascript', '.ts': 'typescript', 
        '.html': 'html', '.css': 'css', '.json': 'json', 
        '.xml': 'xml', '.sql': 'sql', '.md': 'markdown', 
        '.yml': 'yaml', '.yaml': 'yaml', '.py': 'python', 
        '.txt': 'plaintext', '.ps1': 'powershell', '.ini': 'ini', 
        '.config': 'xml', '.csproj': 'xml'
    };
    return map[ext] || 'plaintext';
}

function getAuthQueryString() {
    return '';
}

async function openPreview(node) {
    const ext = node.extension.toLowerCase();
    const isImage = imageExts.includes(ext);
    const isCode = codeExts.includes(ext);
    const isPdf = ext === '.pdf';
    
    const viewUrl = `${API_BASE_URL}/api/explorer/view?path=${encodeURIComponent(node.fullPath)}${getAuthQueryString()}`;
    const downloadUrl = `${API_BASE_URL}/api/explorer/download?path=${encodeURIComponent(node.fullPath)}${getAuthQueryString()}`;
    
    document.getElementById('previewFilename').textContent = node.name;
    document.getElementById('previewIcon').className = getIconInfo(node).icon + ' me-2';
    document.getElementById('btnDownload').href = downloadUrl;
    document.getElementById('btnDownloadLarge').href = downloadUrl;
    
    document.getElementById('imagePreview').classList.add('d-none');
    document.getElementById('editorContainer').classList.add('d-none');
    document.getElementById('iframePreview').classList.add('d-none');
    document.getElementById('unsupportedPreview').classList.add('d-none');
    document.getElementById('previewLoading').classList.remove('d-none');
    
    previewModal.show();
    
    if (isImage) {
        const img = document.getElementById('imgPreviewTag');
        img.onload = () => document.getElementById('previewLoading').classList.add('d-none');
        img.onerror = () => showUnsupported(); 
        img.src = viewUrl;
        document.getElementById('imagePreview').classList.remove('d-none');
    } 
    else if (isPdf) {
        const iframe = document.getElementById('iframePreview');
        iframe.onload = () => document.getElementById('previewLoading').classList.add('d-none');
        iframe.src = viewUrl;
        document.getElementById('iframePreview').classList.remove('d-none');
    }
    else if (isCode || node.size < 1024 * 500) { 
        try {
            const fetchUrl = `/api/explorer/view?path=${encodeURIComponent(node.fullPath)}`;
            const res = await apiFetch(fetchUrl);
            
            if (!res.ok) throw new Error('Preview fetch failed');
            
            const text = await res.text();
            
            document.getElementById('previewLoading').classList.add('d-none');
            document.getElementById('editorContainer').classList.remove('d-none');
            
            if (monacoEditor) {
                const lang = getMonacoLang(ext);
                monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);
                monacoEditor.setValue(text);
            }
        } catch (e) {
            showUnsupported();
        }
    } 
    else {
        showUnsupported();
    }
}

function showUnsupported() {
    document.getElementById('previewLoading').classList.add('d-none');
    document.getElementById('unsupportedPreview').classList.remove('d-none');
}

function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
