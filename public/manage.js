/**
 * 文件管理页面脚本 (< 200行)
 */

let fileData = [];
let isLoading = false;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', () => {
  loadFiles();
  bindEvents();
});

function bindEvents() {
  document.getElementById('refreshBtn').addEventListener('click', loadFiles);
  document.getElementById('clearAllBtn').addEventListener('click', confirmClearAll);
}

async function loadFiles() {
  if (isLoading) return;
  
  isLoading = true;
  showLoading('正在加载文件列表...');
  
  try {
    const response = await fetch('/files');
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      fileData = data.files;
      updateStats(data);
      renderFileList(data.files);
    } else {
      throw new Error(data.message || '获取文件列表失败');
    }
  } catch (error) {
    console.error('加载文件失败:', error);
    showError(`加载失败: ${error.message}`);
    renderFileList([]);
  } finally {
    isLoading = false;
  }
}

function updateStats(data) {
  document.getElementById('totalFiles').textContent = data.count || 0;
  document.getElementById('htmlFiles').textContent = data.htmlFiles || 0;
  document.getElementById('markdownFiles').textContent = data.markdownFiles || 0;
}

function renderFileList(files) {
  const container = document.getElementById('fileList');
  
  if (!files || files.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h3>📁 没有找到文件</h3>
        <p>开始使用浏览器扩展捕获DOM元素吧！</p>
      </div>
    `;
    return;
  }
  
  const html = files.map(file => `
    <div class="file-item" data-basename="${file.baseName}">
      <div class="file-info">
        <h3>${file.baseName}</h3>
        <p>
          📄 HTML: ${formatFileSize(file.html.size)} | 
          📝 Markdown: ${file.markdown.exists ? formatFileSize(file.markdown.size) : '不存在'} | 
          📅 ${formatDate(file.html.created)}
        </p>
      </div>
      <div class="file-actions">
        <button class="btn btn-small" onclick="viewFile('${file.html.viewUrl}')" 
                title="查看HTML文件">👁️ 查看</button>
        <button class="btn btn-small secondary" onclick="downloadFile('${file.baseName}')" 
                title="下载文件">⬇️ 下载</button>
      </div>
    </div>
  `).join('');
  
  container.innerHTML = html;
}

function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function viewFile(viewUrl) {
  if (viewUrl) {
    window.open(viewUrl, '_blank');
  } else {
    showError('无法获取文件查看链接');
  }
}

function downloadFile(baseName) {
  const htmlUrl = `/view/${baseName}.html`;
  const link = document.createElement('a');
  link.href = htmlUrl;
  link.download = `${baseName}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function confirmClearAll() {
  if (fileData.length === 0) {
    showError('没有文件可以清空');
    return;
  }
  
  if (confirm(`确定要删除所有 ${fileData.length} 个文件吗？此操作不可恢复！`)) {
    clearAllFiles();
  }
}

async function clearAllFiles() {
  showLoading('正在清空所有文件...');
  
  try {
    // 这里需要服务器端支持删除接口
    showError('清空功能需要服务器端支持，请手动删除 captured 目录下的文件');
  } catch (error) {
    console.error('清空文件失败:', error);
    showError(`清空失败: ${error.message}`);
  }
}

function showLoading(message) {
  document.getElementById('fileList').innerHTML = `
    <div class="loading">
      <p>⏳ ${message}</p>
    </div>
  `;
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error';
  errorDiv.innerHTML = `❌ ${message}`;
  
  const container = document.querySelector('.container');
  const existing = container.querySelector('.error, .success');
  if (existing) {
    existing.remove();
  }
  
  container.insertBefore(errorDiv, container.firstChild);
  
  setTimeout(() => errorDiv.remove(), 5000);
}

function showSuccess(message) {
  const successDiv = document.createElement('div');
  successDiv.className = 'success';
  successDiv.innerHTML = `✅ ${message}`;
  
  const container = document.querySelector('.container');
  const existing = container.querySelector('.error, .success');
  if (existing) {
    existing.remove();
  }
  
  container.insertBefore(successDiv, container.firstChild);
  
  setTimeout(() => successDiv.remove(), 3000);
}
