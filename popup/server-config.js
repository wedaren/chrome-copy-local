/**
 * Popup 服务器配置模块
 * 处理服务器URL配置、连接测试等功能
 */

const DEFAULT_SERVER_URL = 'http://localhost:3000';

// 服务器状态管理
const serverStatus = {
  online: false,
  url: DEFAULT_SERVER_URL,
  lastChecked: null
};

// 加载服务器配置
async function loadServerConfig() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl']);
    const savedUrl = result.serverUrl || DEFAULT_SERVER_URL;
    document.getElementById('serverUrl').value = savedUrl;
    serverStatus.url = savedUrl;
    return savedUrl;
  } catch (error) {
    console.error('加载服务器配置失败:', error);
    return DEFAULT_SERVER_URL;
  }
}

// 保存服务器配置
async function saveServerConfig(url) {
  try {
    await chrome.storage.sync.set({ serverUrl: url });
    console.log('服务器配置已保存:', url);
  } catch (error) {
    console.error('保存服务器配置失败:', error);
  }
}

// 更新服务器状态显示
function updateServerStatus(online, message) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  
  statusDot.className = online ? 'status-dot online' : 'status-dot offline';
  statusText.textContent = message || (online ? '服务器在线' : '服务器离线');
  
  serverStatus.online = online;
  serverStatus.lastChecked = new Date();
  
  // 更新按钮状态
  const startButton = document.getElementById('startSelection');
  const viewButton = document.getElementById('viewFiles');
  
  if (online) {
    startButton.disabled = false;
    startButton.textContent = '开始选择元素';
    viewButton.disabled = false;
  } else {
    startButton.disabled = true;
    startButton.textContent = '服务器离线';
    viewButton.disabled = true;
  }
}

// 测试服务器连接
async function testServerConnection() {
  const url = document.getElementById('serverUrl').value.trim();
  if (!url) return;

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
      
      // 保存有效的服务器配置
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

// 服务器URL变更处理
async function onServerUrlChange() {
  const url = document.getElementById('serverUrl').value.trim();
  if (url && url !== serverStatus.url) {
    serverStatus.url = url;
    await saveServerConfig(url);
    await testServerConnection();
  }
}

module.exports = {
  DEFAULT_SERVER_URL,
  serverStatus,
  loadServerConfig,
  saveServerConfig,
  updateServerStatus,
  testServerConnection,
  onServerUrlChange
};
