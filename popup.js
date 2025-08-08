// 默认服务器配置
const DEFAULT_SERVER_URL = 'http://localhost:3000';

// DOM 元素
let serverUrlInput;
let testConnectionButton;
let startSelectionButton;
let statusDot;
let statusText;

// 服务器状态管理
let serverStatus = {
  online: false,
  url: DEFAULT_SERVER_URL,
  lastChecked: null
};

// 初始化函数
document.addEventListener('DOMContentLoaded', async () => {
  // 获取DOM元素
  serverUrlInput = document.getElementById('serverUrl');
  testConnectionButton = document.getElementById('testConnection');
  startSelectionButton = document.getElementById('startSelection');
  statusDot = document.getElementById('statusDot');
  statusText = document.getElementById('statusText');

  // 加载保存的服务器配置
  await loadServerConfig();

  // 绑定事件
  serverUrlInput.addEventListener('input', onServerUrlChange);
  testConnectionButton.addEventListener('click', testServerConnection);
  startSelectionButton.addEventListener('click', startSelection);

  // 自动测试连接
  await testServerConnection();
});

// 加载服务器配置
async function loadServerConfig() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl']);
    const savedUrl = result.serverUrl || DEFAULT_SERVER_URL;
    serverUrlInput.value = savedUrl;
    serverStatus.url = savedUrl;
  } catch (error) {
    console.error('加载服务器配置失败:', error);
    serverUrlInput.value = DEFAULT_SERVER_URL;
  }
}

// 保存服务器配置
async function saveServerConfig(url) {
  try {
    await chrome.storage.sync.set({ serverUrl: url });
    serverStatus.url = url;
  } catch (error) {
    console.error('保存服务器配置失败:', error);
  }
}

// 当服务器URL输入变化时
function onServerUrlChange() {
  const url = serverUrlInput.value.trim();
  if (url && isValidUrl(url)) {
    saveServerConfig(url);
    updateStatus('offline', '未连接');
    startSelectionButton.disabled = true;
  }
}

// 验证URL格式
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

// 测试服务器连接
async function testServerConnection() {
  const url = serverUrlInput.value.trim();
  
  if (!url) {
    updateStatus('offline', '请输入服务器地址');
    return;
  }

  if (!isValidUrl(url)) {
    updateStatus('offline', '无效的URL格式');
    return;
  }

  updateStatus('checking', '正在测试连接...');
  testConnectionButton.disabled = true;

  try {
    const statusUrl = url.endsWith('/') ? `${url}status` : `${url}/status`;
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json'
      },
      // 5秒超时
      signal: AbortSignal.timeout(5000)
    });

    if (response.ok) {
      const data = await response.json();
      updateStatus('online', '连接成功');
      serverStatus.online = true;
      serverStatus.lastChecked = new Date();
      startSelectionButton.disabled = false;
      
      // 保存有效的服务器配置
      await saveServerConfig(url);
      
      console.log('服务器状态:', data);
    } else {
      throw new Error(`服务器返回错误: ${response.status}`);
    }
  } catch (error) {
    console.error('连接测试失败:', error);
    
    let errorMessage = '连接失败';
    if (error.name === 'TypeError') {
      errorMessage = '无法连接到服务器';
    } else if (error.name === 'AbortError') {
      errorMessage = '连接超时';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    updateStatus('offline', errorMessage);
    serverStatus.online = false;
    startSelectionButton.disabled = true;
  } finally {
    testConnectionButton.disabled = false;
  }
}

// 更新状态显示
function updateStatus(status, message) {
  statusDot.className = `status-dot status-${status}`;
  statusText.textContent = message;
  
  // 更新按钮状态
  if (status === 'online') {
    startSelectionButton.disabled = false;
  } else {
    startSelectionButton.disabled = true;
  }
}

// 开始选择元素
async function startSelection() {
  if (!serverStatus.online) {
    updateStatus('offline', '请先测试服务器连接');
    return;
  }

  // 获取当前激活的标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (tab) {
    try {
      // 向内容脚本传递服务器配置
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectServerConfig,
        args: [serverStatus.url]
      });

      // 注入内容脚本
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (err) {
      console.error(`注入脚本失败: ${err}`);
      updateStatus('offline', '注入脚本失败');
      return;
    }
  }

  // 关闭 popup 窗口
  window.close();
}

// 向页面注入服务器配置
function injectServerConfig(serverUrl) {
  window.DOM_CATCHER_SERVER_URL = serverUrl;
}
