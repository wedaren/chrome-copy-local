// 防止重复注入
if (!window.hasDOMCatcher) {
  window.hasDOMCatcher = true;

  // 获取服务器配置，如果没有则使用默认值
  const SERVER_URL = window.DOM_CATCHER_SERVER_URL || 'http://localhost:3000';

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
      white-space: pre-line;
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
    if (event.target === document.body || event.target === document.documentElement || event.target.closest('.dom-catcher-notification')) {
      return;
    }
    
    if (lastElement) {
      lastElement.classList.remove(highlightClass);
    }
    event.target.classList.add(highlightClass);
    lastElement = event.target;
  };

  // 2.5. 处理相对链接转绝对链接的函数
  const convertRelativeToAbsolute = (element) => {
    const clone = element.cloneNode(true);
    const baseUrl = window.location.origin;
    const currentPath = window.location.href;
    
    // 处理所有图片的src属性
    const images = clone.querySelectorAll('img[src]');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && !src.startsWith('http') && !src.startsWith('data:') && !src.startsWith('//')) {
        try {
          const absoluteUrl = new URL(src, currentPath).href;
          img.setAttribute('src', absoluteUrl);
        } catch (e) {
          console.warn('无法转换图片链接:', src, e);
        }
      }
    });
    
    // 处理所有链接的href属性
    const links = clone.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('//')) {
        try {
          const absoluteUrl = new URL(href, currentPath).href;
          link.setAttribute('href', absoluteUrl);
        } catch (e) {
          console.warn('无法转换链接:', href, e);
        }
      }
    });
    
    // 处理CSS背景图片
    const elementsWithBg = clone.querySelectorAll('*[style*="background"]');
    elementsWithBg.forEach(el => {
      const style = el.getAttribute('style');
      if (style && style.includes('url(')) {
        const updatedStyle = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
          if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('//')) {
            try {
              const absoluteUrl = new URL(url, currentPath).href;
              return `url('${absoluteUrl}')`;
            } catch (e) {
              console.warn('无法转换CSS背景图片:', url, e);
              return match;
            }
          }
          return match;
        });
        el.setAttribute('style', updatedStyle);
      }
    });
    
    // 处理其他可能包含URL的属性
    const urlAttributes = ['srcset', 'data-src', 'data-original', 'data-lazy'];
    urlAttributes.forEach(attr => {
      const elements = clone.querySelectorAll(`[${attr}]`);
      elements.forEach(el => {
        const value = el.getAttribute(attr);
        if (value && !value.startsWith('http') && !value.startsWith('data:') && !value.startsWith('//')) {
          try {
            // 处理srcset可能包含多个URL的情况
            if (attr === 'srcset') {
              const srcsetValue = value.replace(/(\S+)(\s+\S+)?/g, (match, url, descriptor) => {
                if (!url.startsWith('http') && !url.startsWith('data:') && !url.startsWith('//')) {
                  try {
                    const absoluteUrl = new URL(url, currentPath).href;
                    return absoluteUrl + (descriptor || '');
                  } catch (e) {
                    return match;
                  }
                }
                return match;
              });
              el.setAttribute(attr, srcsetValue);
            } else {
              const absoluteUrl = new URL(value, currentPath).href;
              el.setAttribute(attr, absoluteUrl);
            }
          } catch (e) {
            console.warn(`无法转换${attr}属性:`, value, e);
          }
        }
      });
    });
    
    return clone;
  };

  // 3. 监听点击，捕获并发送数据
  const clickHandler = async (event) => {
    // 阻止默认行为，例如链接跳转
    event.preventDefault();
    event.stopPropagation();

    const targetElement = event.target;
    
    // 处理相对链接转换为绝对链接
    const processedElement = convertRelativeToAbsolute(targetElement);
    const elementHTML = processedElement.outerHTML;
    
    // 获取元素的基本信息
    const text = targetElement.textContent || '';
    const elementInfo = {
      tagName: targetElement.tagName.toLowerCase(),
      className: targetElement.className,
      id: targetElement.id,
      textContent: text.length > 100 ? `${text.substring(0, 100)}...` : text,
      url: window.location.href,
      baseUrl: window.location.origin,
      pageTitle: document.title || '',
      timestamp: new Date().toISOString(),
      // 统计转换的链接信息
      linkStats: {
        totalImages: processedElement.querySelectorAll('img').length,
        totalLinks: processedElement.querySelectorAll('a[href]').length,
        hasBackgroundImages: processedElement.querySelectorAll('*[style*="background"]').length > 0
      }
    };

    console.log('捕获到元素:', elementInfo);

    // 显示成功提示
    showNotification('正在发送元素到服务器并生成文件...');

    // 清理工作
    cleanup();

    // 发送到配置的服务器
    try {
      const apiUrl = new URL('receive-dom', SERVER_URL).href;
      
      const response = await fetch(apiUrl, {
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
        const result = await response.json();
        const message = `✅ 成功生成文件！\n📄 HTML: ${result.files?.html?.filename}\n📝 Markdown: ${result.files?.markdown?.filename}`;
        showNotification(message, 'success');
        console.log('成功发送到服务器！', result);
      } else {
        throw new Error(`服务器返回错误: ${response.status}`);
      }
    } catch (error) {
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
  };

  // 4. 显示通知函数
  const showNotification = (message, type = 'info') => {
    const notification = document.createElement('div');
    notification.className = `dom-catcher-notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 5秒后自动移除（成功消息稍长展示）
    const timeout = type === 'success' ? 5000 : 3000;
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, timeout);
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
  showNotification('🎯 元素选择模式已激活\n悬停查看元素，点击选择，按ESC退出\n现在会同时生成 HTML 和 Markdown 文件');
}
