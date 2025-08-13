/**
 * Popup 主文件 (精简版 < 200行)
 */

const DEFAULT_URL = 'http://localhost:3000';
let status = { online: false, url: DEFAULT_URL };

document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  bindEvents();
  testConnection();
});

function bindEvents() {
  const $ = id => document.getElementById(id);
  $('serverUrl').onchange = onUrlChange;
  $('testConnection').onclick = testConnection;
  $('startSelection').onclick = startSelection;
  $('viewFiles').onclick = openFiles;
}

async function loadConfig() {
  try {
    const result = await chrome.storage.sync.get(['serverUrl']);
    const url = result.serverUrl || DEFAULT_URL;
    document.getElementById('serverUrl').value = url;
    status.url = url;
  } catch (e) { console.error('加载配置失败:', e); }
}

async function saveConfig(url) {
  try {
    await chrome.storage.sync.set({ serverUrl: url });
  } catch (e) { console.error('保存配置失败:', e); }
}

async function onUrlChange() {
  const url = document.getElementById('serverUrl').value.trim();
  if (url && url !== status.url) {
    status.url = url;
    await saveConfig(url);
    testConnection();
  }
}

function updateStatus(online, message) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  const startBtn = document.getElementById('startSelection');
  const viewBtn = document.getElementById('viewFiles');
  
  dot.className = online ? 'status-dot online' : 'status-dot offline';
  text.textContent = message || (online ? '服务器在线' : '服务器离线');
  status.online = online;
  
  startBtn.disabled = viewBtn.disabled = !online;
  startBtn.textContent = online ? '开始选择元素' : '服务器离线';
}

async function testConnection() {
  const url = document.getElementById('serverUrl').value.trim();
  if (!url) return false;

  const btn = document.getElementById('testConnection');
  const originalText = btn.textContent;
  
  btn.disabled = true;
  btn.textContent = '测试中...';
  updateStatus(false, '正在连接...');

  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${url}/status`, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors'
    });

    if (response.ok) {
      const data = await response.json();
      updateStatus(true, `连接成功 - ${data.message || '服务器运行正常'}`);
      status.url = url;
      await saveConfig(url);
      return true;
    } else {
      updateStatus(false, `连接失败 - HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.error('测试连接失败:', error);
    const errorMsg = error.name === 'AbortError' ? '连接超时' : 
                    error.name === 'TypeError' ? '网络错误' : error.message;
    updateStatus(false, `连接失败 - ${errorMsg}`);
    return false;
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function startSelection() {
  if (!status.online) {
    updateStatus(false, '请先测试服务器连接');
    return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) throw new Error('无法获取当前标签页');

    // 注入配置和脚本
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (serverUrl) => { window.DOM_CATCHER_SERVER_URL = serverUrl; },
      args: [status.url]
    });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });

    window.close();
  } catch (error) {
    console.error('启动失败:', error);
    updateStatus(false, '启动失败: ' + error.message);
    showInfo(`
      <strong>⚠️ 可能需要权限:</strong><br>
      • 请确保已授予扩展必要的权限<br>
      • 某些网站不支持内容脚本<br>
      • 尝试刷新页面后再试
    `);
  }
}

async function openFiles() {
  if (!status.online) {
    updateStatus(false, '请先测试服务器连接');
    return;
  }

  try {
    const manageUrl = new URL('manage', status.url).href;
    await chrome.tabs.create({ url: manageUrl });
  } catch (error) {
    console.error('打开文件管理器失败:', error);
    updateStatus(false, '打开失败');
  }
}

function showInfo(content) {
  const info = document.getElementById('permissionInfo');
  if (info) {
    info.style.display = 'block';
    info.innerHTML = content;
  }
}

// 权限检查
chrome.permissions?.contains?.({
  permissions: ['activeTab', 'scripting'],
  origins: ['<all_urls>']
}, (result) => {
  if (!result) {
    showInfo('<strong>⚠️ 需要权限:</strong><br>请在扩展管理页面授予必要的权限');
  }
});

// 错误处理
window.onerror = (msg, file, line, col, error) => {
  console.error('Popup 错误:', error);
  updateStatus(false, '发生未知错误');
};
