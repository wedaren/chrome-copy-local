// 防止重复注入
if (!window.hasDOMCatcher) {
  window.hasDOMCatcher = true;

  const highlightClass = 'dom-catcher-highlight';

  // 1. 添加高亮样式和通知样式
  const style = document.createElement('style');
  style.innerHTML = `
    .${highlightClass} {
      outline: 3px dashed #ff4444 !important;
      background-color: rgba(255, 68, 68, 0.1) !important;
      cursor: crosshair !important;
      position: relative !important;
    }
    
    .${highlightClass}::before {
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
    }
    .dom-catcher-notification.info { background: #2196f3; }
    .dom-catcher-notification.success { background: #4caf50; }
    .dom-catcher-notification.error { background: #f44336; }
  `;
  document.head.appendChild(style);

  let lastElement = null;

  // 2. 监听鼠标悬浮，添加高亮
  const mouseoverHandler = (event) => {
    // 避免选中我们自己添加的提示元素
    if (event.target === document.body || event.target === document.documentElement) {
      return;
    }
    
    if (lastElement) {
      lastElement.classList.remove(highlightClass);
    }
    event.target.classList.add(highlightClass);
    lastElement = event.target;
  };

  // 3. 监听点击，捕获并发送数据
  const clickHandler = async (event) => {
    // 阻止默认行为，例如链接跳转
    event.preventDefault();
    event.stopPropagation();

    const targetElement = event.target;
    const elementHTML = targetElement.outerHTML;
    
    // 获取元素的基本信息
    const text = targetElement.textContent || '';
    const elementInfo = {
      tagName: targetElement.tagName.toLowerCase(),
      className: targetElement.className,
      id: targetElement.id,
      textContent: text.length > 100 ? `${text.substring(0, 100)}...` : text,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };

    console.log('捕获到元素:', elementInfo);

    // 显示成功提示
    showNotification('正在发送元素到本地服务器...');

    // 清理工作
    cleanup();

    // 发送到本地服务
    try {
      const response = await fetch('http://localhost:3000/receive-dom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors', // 明确指定CORS模式
        body: JSON.stringify({ 
          html: elementHTML,
          info: elementInfo
        }),
      });
      
      if (response.ok) {
        const result = await response.text();
        showNotification('✅ 成功发送到本地服务！', 'success');
        console.log('成功发送到本地服务！', result);
      } else {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
    } catch (error) {
      console.error('发送失败:', error);
      showNotification('❌ 无法连接到本地服务，请确保服务已启动。', 'error');
    }
  };

  // 4. 显示通知函数
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `dom-catcher-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  };

  // 5. 清理函数，移除所有监听器和样式
  const cleanup = () => {
    if (lastElement) {
      lastElement.classList.remove(highlightClass);
    }
    document.removeEventListener('mouseover', mouseoverHandler, true);
    document.removeEventListener('click', clickHandler, true);
    document.removeEventListener('keydown', escapeHandler);
    window.hasDOMCatcher = false;
  };

  // 6. 按ESC键退出选择模式
  const escapeHandler = (event) => {
    if (event.key === 'Escape') {
      cleanup();
      showNotification('已取消元素选择模式');
    }
  };

  // 7. 启动监听
  document.addEventListener('mouseover', mouseoverHandler, true);
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', escapeHandler);
  
  // 显示开始提示
  showNotification('元素选择模式已激活，悬停查看元素，点击选择，按ESC退出');
}
