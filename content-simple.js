/**
 * Content Script - 简化版本 (< 200 行)
 * 兼容版本，整合了核心功能
 */

// 防止重复注入
if (!window.hasDOMCatcher) {
  window.hasDOMCatcher = true;

  // 获取服务器配置
  const SERVER_URL = window.DOM_CATCHER_SERVER_URL || 'http://localhost:3000';
  const HIGHLIGHT_CLASS = 'dom-catcher-highlight';

  let lastElement = null;
  let cleanupHandlers = [];

  // 注入样式
  const style = document.createElement('style');
  style.innerHTML = `
    .${HIGHLIGHT_CLASS} {
      outline: 3px dashed #ff4444 !important;
      background-color: rgba(255, 68, 68, 0.1) !important;
      cursor: crosshair !important;
      position: relative !important;
    }
    
    .${HIGHLIGHT_CLASS}::before {
      content: "点击选择此元素";
      position: absolute;
      top: -25px;
      left: 0;
      background: #ff4444;
      color: white;
      padding: 2px 6px;
      font-size: 11px;
      border-radius: 3px;
      z-index: 10000;
      pointer-events: none;
    }

    .dom-catcher-notification {
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10001;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      max-width: 300px;
      word-wrap: break-word;
      white-space: pre-line;
    }
    .dom-catcher-notification.info { background: #2196f3; }
    .dom-catcher-notification.success { background: #4caf50; }
    .dom-catcher-notification.error { background: #f44336; }
  `;
  document.head.appendChild(style);

  // 显示通知
  function showNotification(message, type = 'info', viewUrl = null) {
    const notification = document.createElement('div');
    notification.className = `dom-catcher-notification ${type}`;
    
    if (viewUrl && type === 'success') {
      const parts = message.split('\\n\\n👁️');
      const textDiv = document.createElement('div');
      textDiv.textContent = parts[0];
      
      const linkDiv = document.createElement('div');
      linkDiv.style.cssText = 'margin-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 8px;';
      
      const linkButton = document.createElement('a');
      linkButton.textContent = '👁️ 点击查看 HTML 文件';
      linkButton.href = viewUrl;
      linkButton.target = '_blank';
      linkButton.style.cssText = 'color: white; text-decoration: underline; cursor: pointer; font-weight: bold;';
      
      linkDiv.appendChild(linkButton);
      notification.appendChild(textDiv);
      notification.appendChild(linkDiv);
    } else {
      notification.textContent = message;
    }
    
    document.body.appendChild(notification);
    const timeout = type === 'success' ? 8000 : 3000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, timeout);
  }

  // 简化的链接转换
  function convertRelativeToAbsolute(element) {
    const clone = element.cloneNode(true);
    const currentPath = window.location.href;
    const stats = { totalImages: 0, totalLinks: 0, convertedImages: 0, convertedLinks: 0 };
    
    const needsConversion = (url) => {
      return url && !url.startsWith('http') && !url.startsWith('data:') && 
             !url.startsWith('//') && !url.startsWith('mailto:') && 
             !url.startsWith('tel:') && !url.startsWith('#') && !url.startsWith('javascript:');
    };
    
    const convertUrl = (url) => {
      try {
        return new URL(url, currentPath).href;
      } catch (e) {
        console.warn('无法转换URL:', url, e);
        return url;
      }
    };
    
    // 转换链接
    const elements = [clone, ...clone.querySelectorAll('*')];
    elements.forEach(el => {
      if (el.tagName === 'IMG') {
        stats.totalImages++;
        const src = el.getAttribute('src');
        if (needsConversion(src)) {
          el.setAttribute('src', convertUrl(src));
          stats.convertedImages++;
        }
      }
      
      if (el.tagName === 'A') {
        stats.totalLinks++;
        const href = el.getAttribute('href');
        if (needsConversion(href)) {
          el.setAttribute('href', convertUrl(href));
          stats.convertedLinks++;
        }
      }
    });
    
    return { element: clone, linkStats: stats };
  }

  // 发送到服务器
  async function sendToServer(elementHTML, elementInfo) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`${SERVER_URL}/receive-dom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        mode: 'cors',
        body: JSON.stringify({ html: elementHTML, info: elementInfo }),
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const result = await response.json();
        let message = `✅ 成功生成文件！\\n📄 HTML: ${result.files?.html?.filename}\\n📝 Markdown: ${result.files?.markdown?.filename}`;
        
        if (result.files?.html?.viewUrl) {
          message += `\\n\\n👁️ 点击查看: ${result.files.html.viewUrl}`;
        }
        
        showNotification(message, 'success', result.files?.html?.viewUrl);
        console.log('成功发送到服务器！', result);
      } else {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('发送失败:', error);
      let errorMessage = '❌ 发送失败：';
      if (error.name === 'TypeError') {
        errorMessage += '无法连接到服务器';
      } else if (error.name === 'AbortError') {
        errorMessage += '请求超时';
      } else {
        errorMessage += error.message;
      }
      showNotification(errorMessage, 'error');
    }
  }

  // 事件处理
  const handleMouseOver = (event) => {
    if (event.target === document.body || event.target === document.documentElement || 
        event.target.closest('.dom-catcher-notification')) {
      return;
    }
    
    if (lastElement) {
      lastElement.classList.remove(HIGHLIGHT_CLASS);
    }
    event.target.classList.add(HIGHLIGHT_CLASS);
    lastElement = event.target;
  };

  const handleClick = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    cleanup();

    const targetElement = event.target;
    showNotification('🔄 正在处理元素...', 'info');
    
    try {
      const result = convertRelativeToAbsolute(targetElement);
      const elementHTML = result.element.outerHTML;
      
      const elementInfo = {
        tagName: targetElement.tagName.toLowerCase(),
        id: targetElement.id || '',
        className: targetElement.className || '',
        textContent: targetElement.textContent?.substring(0, 200) || '',
        url: window.location.href,
        pageTitle: document.title,
        timestamp: new Date().toISOString(),
        linkStats: result.linkStats
      };
      
      await sendToServer(elementHTML, elementInfo);
    } catch (error) {
      console.error('处理元素时发生错误:', error);
      showNotification('❌ 处理元素失败: ' + error.message, 'error');
    }
  };

  const handleEscape = (event) => {
    if (event.key === 'Escape') {
      cleanup();
      showNotification('已取消元素选择模式');
    }
  };

  const cleanup = () => {
    if (lastElement) {
      lastElement.classList.remove(HIGHLIGHT_CLASS);
    }
    cleanupHandlers.forEach(handler => handler());
    cleanupHandlers = [];
    window.hasDOMCatcher = false;
  };

  // 启动
  document.addEventListener('mouseover', handleMouseOver, true);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleEscape);
  
  cleanupHandlers.push(
    () => document.removeEventListener('mouseover', handleMouseOver, true),
    () => document.removeEventListener('click', handleClick, true),
    () => document.removeEventListener('keydown', handleEscape)
  );
  
  showNotification('🎯 元素选择模式已激活\\n悬停查看元素，点击选择，按ESC退出\\n📝 同时生成 HTML 和 Markdown 文件');
}
