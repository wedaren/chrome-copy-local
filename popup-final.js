/**
 * Popup 主文件 (< 200行)
 * 整合服务器配置、连接测试、元素选择等核心功能
 */

const DEFAULT_SERVER_URL = 'http://localhost:3000';
let serverStatus = { online: false, url: DEFAULT_SERVER_URL };

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  bindEvents();
  await testConnection();
});

function bindEvents() {
  const $ = id => document.getElementById(id);
  $('serverUrl').addEventListener('change', onUrlChange);
  $('testConnection').addEventListener('click', testConnection);
  $('startSelection').addEventListener('click', startSelection);
  $('viewFiles').addEventListener('click', openFiles);
}

async function loadConfig() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl']);
    const url = result.serverUrl || DEFAULT_SERVER_URL;
    document.getElementById('serverUrl').value = url;
    serverStatus.url = url;
  } catch (error) {
    console.error('加载配置失败:', error);
  }
}

async function saveConfig(url) {
  try {
    await chrome.storage.sync.set({ serverUrl: url });
  } catch (error) {
    console.error('保存配置失败:', error);
  }
}

async function onUrlChange() {
  const url = document.getElementById('serverUrl').value.trim();
  if (url && url !== serverStatus.url) {
    serverStatus.url = url;
    await saveConfig(url);
    await testConnection();
  }
}

function updateStatus(online, message) {
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const startBtn = document.getElementById('startSelection');
  const viewBtn = document.getElementById('viewFiles');
  
  statusDot.className = online ? 'status-dot online' : 'status-dot offline';
  statusText.textContent = message || (online ? '服务器在线' : '服务器离线');
  serverStatus.online = online;
  
  startBtn.disabled = !online;
  startBtn.textContent = online ? '开始选择元素' : '服务器离线';
  viewBtn.disabled = !online;
}

async function testConnection() {
  const url = document.getElementById('serverUrl').value.trim();
  if (!url) return false;

  const testBtn = document.getElementById('testConnection');
  const originalText = testBtn.textContent;
  
  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  updateStatus(false, '正在连接...');

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
      updateStatus(true, `连接成功 - ${data.message || '服务器运行正常'}`);
      serverStatus.url = url;
      await saveConfig(url);
      return true;
    } else {
      updateStatus(false, `连接失败 - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    let errorMessage = '连接失败';
    
    switch (error.name) {
      case 'AbortError':
        errorMessage += ' - 连接超时';
        break;
      case 'TypeError':
        errorMessage += ' - 网络错误';
        break;
      default:
        errorMessage += ` - ${error.message}`;
    }
    
    updateStatus(false, errorMessage);
    return false;
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = originalText;
  }
}

async function startSelection() {
  if (!serverStatus.online) {
    updateStatus(false, '请先测试服务器连接');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      throw new Error('无法获取当前标签页');
    }

    // 注入服务器配置和内容脚本
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (serverUrl) => { window.DOM_CATCHER_SERVER_URL = serverUrl; },
      args: [serverStatus.url]
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    window.close();
  } catch (error) {
    console.error('启动选择失败:', error);
    updateStatus(false, '启动失败: ' + error.message);
    
    // 显示权限提示
    showPermissionInfo(`
      <strong>⚠️ 可能需要权限:</strong><br>
      • 请确保已授予扩展必要的权限<br>
      • 某些网站（如chrome://）不支持内容脚本<br>
      • 尝试刷新页面后再试
    `);
  }
}

async function openFiles() {
  if (!serverStatus.online) {
    updateStatus(false, '请先测试服务器连接');
    return;
  }

  try {
    const manageUrl = new URL('manage', serverStatus.url).href;
    await chrome.tabs.create({ url: manageUrl });
  } catch (error) {
    console.error('打开文件管理器失败:', error);
    updateStatus(false, '打开文件管理器失败');
  }
}

function showPermissionInfo(content) {
  const permissionInfo = document.getElementById('permissionInfo');
  if (permissionInfo) {
    permissionInfo.style.display = 'block';
    permissionInfo.innerHTML = content;
  }
}

// 检查权限
if (chrome.permissions) {
  chrome.permissions.contains({
    permissions: ['activeTab', 'scripting'],
    origins: ['<all_urls>']
  }, (result) => {
    if (!result) {
      showPermissionInfo(`
        <strong>⚠️ 需要权限:</strong><br>
        请在扩展管理页面授予必要的权限
      `);
    }
  });
}

// 全局错误处理
window.addEventListener('error', (event) => {
  console.error('Popup 错误:', event.error);
  updateStatus(false, '发生未知错误');
});
