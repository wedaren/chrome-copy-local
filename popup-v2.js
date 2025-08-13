/**
 * Popup 主逻辑模块 (< 200行)
 * 整合所有核心功能，保持简洁
 */

// 默认配置
const DEFAULT_SERVER_URL = 'http://localhost:3000';
let serverStatus = { online: false, url: DEFAULT_SERVER_URL, lastChecked: null };

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  await loadServerConfig();
  bindEvents();
  await testServerConnection();
});

// 绑定事件
function bindEvents() {
  document.getElementById('serverUrl').addEventListener('change', onServerUrlChange);
  document.getElementById('testConnection').addEventListener('click', testServerConnection);
  document.getElementById('startSelection').addEventListener('click', startSelection);
  document.getElementById('viewFiles').addEventListener('click', openFileManager);
}

// 加载配置
async function loadServerConfig() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl']);
    const savedUrl = result.serverUrl || DEFAULT_SERVER_URL;
    document.getElementById('serverUrl').value = savedUrl;
    serverStatus.url = savedUrl;
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

// 保存配置
async function saveServerConfig(url) {
  try {
    await chrome.storage.sync.set({ serverUrl: url });
    console.log('配置已保存:', url);
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

// URL变更处理
async function onServerUrlChange() {
  const url = document.getElementById('serverUrl').value.trim();
  if (url && url !== serverStatus.url) {
    serverStatus.url = url;
    await saveServerConfig(url);
    await testServerConnection();
  }
}

// 更新状态显示
function updateServerStatus(online, message) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const startButton = document.getElementById('startSelection');
  const viewButton = document.getElementById('viewFiles');
  
  statusDot.className = online ? 'status-dot online' : 'status-dot offline';
  statusText.textContent = message || (online ? '服务器在线' : '服务器离线');
  
  serverStatus.online = online;
  serverStatus.lastChecked = new Date();
  
  startButton.disabled = !online;
  startButton.textContent = online ? '开始选择元素' : '服务器离线';
  viewButton.disabled = !online;
}

// 测试连接
async function testServerConnection() {
  const url = document.getElementById('serverUrl').value.trim();
  if (!url) return false;

  const testButton = document.getElementById('testConnection');
  const originalText = testButton.textContent;
  
  testButton.disabled = true;
  testButton.textContent = '测试中...';
  updateServerStatus(false, '正在连接...');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/status`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors'
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      updateServerStatus(true, `连接成功 - ${data.message || '服务器运行正常'}`);
      serverStatus.url = url;
      await saveServerConfig(url);
      return true;
    } else {
      updateServerStatus(false, `连接失败 - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    let errorMessage = '连接失败';
    
    if (error.name === 'AbortError') {
      errorMessage += ' - 连接超时';
    } else if (error.name === 'TypeError') {
      errorMessage += ' - 网络错误';
    } else {
      errorMessage += ` - ${error.message}`;
    }
    
    updateServerStatus(false, errorMessage);
    return false;
  } finally {
    testButton.disabled = false;
    testButton.textContent = originalText;
  }
}

// 开始选择元素
async function startSelection() {
  if (!serverStatus.online) {
    updateServerStatus(false, '请先测试服务器连接');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab) {
      // 注入服务器配置
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (serverUrl) => { window.DOM_CATCHER_SERVER_URL = serverUrl; },
        args: [serverStatus.url]
      });

      // 注入内容脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });

      window.close();
    }
  } catch (error) {
    console.error('启动选择失败:', error);
    updateServerStatus(false, '启动选择失败: ' + error.message);
    
    // 显示权限提示
    const permissionInfo = document.getElementById('permissionInfo');
    if (permissionInfo) {
      permissionInfo.style.display = 'block';
      permissionInfo.innerHTML = `
        <strong>⚠️ 可能需要权限:</strong><br>
        • 请确保已授予扩展必要的权限<br>
        • 某些网站（如chrome://）不支持内容脚本<br>
        • 尝试刷新页面后再试
      `;
    }
  }
}

// 打开文件管理器
async function openFileManager() {
  if (!serverStatus.online) {
    updateServerStatus(false, '请先测试服务器连接');
    return;
  }

  try {
    const manageUrl = new URL('manage', serverStatus.url).href;
    await chrome.tabs.create({ url: manageUrl });
  } catch (error) {
    console.error('打开文件管理器失败:', error);
    updateServerStatus(false, '打开文件管理器失败');
  }
}

// 错误处理
window.addEventListener('error', (event) => {
  console.error('Popup 错误:', event.error);
  updateServerStatus(false, '发生未知错误');
});

// 检查权限
chrome.permissions?.contains?.({
  permissions: ['activeTab', 'scripting'],
  origins: ['<all_urls>']
}, (result) => {
  if (!result) {
    const permissionInfo = document.getElementById('permissionInfo');
    if (permissionInfo) {
      permissionInfo.style.display = 'block';
      permissionInfo.innerHTML = `
        <strong>⚠️ 需要权限:</strong><br>
        请在扩展管理页面授予必要的权限
      `;
    }
  }
});
