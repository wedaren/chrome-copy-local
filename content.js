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

  // 2.5. 样式提取相关函数
  
  // 重要样式属性列表 - 这些属性对视觉效果最重要
  const IMPORTANT_STYLE_PROPERTIES = [
    // 布局相关
    'display', 'position', 'top', 'left', 'right', 'bottom',
    'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
    'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'border', 'border-width', 'border-style', 'border-color',
    'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'box-sizing', 'overflow', 'overflow-x', 'overflow-y',
    'float', 'clear', 'z-index',
    
    // 字体和文本相关
    'font-family', 'font-size', 'font-weight', 'font-style', 'font-variant',
    'line-height', 'text-align', 'text-decoration', 'text-transform',
    'text-indent', 'text-shadow', 'letter-spacing', 'word-spacing',
    'color', 'white-space', 'word-wrap', 'word-break',
    
    // 背景相关
    'background', 'background-color', 'background-image', 'background-repeat',
    'background-position', 'background-size', 'background-attachment',
    
    // 视觉效果
    'opacity', 'visibility', 'transform', 'transform-origin',
    'box-shadow', 'text-shadow', 'filter',
    
    // 弹性布局
    'flex', 'flex-direction', 'flex-wrap', 'flex-basis', 'flex-grow', 'flex-shrink',
    'justify-content', 'align-items', 'align-self', 'align-content',
    
    // 网格布局
    'grid', 'grid-template-columns', 'grid-template-rows', 'grid-gap',
    'grid-column', 'grid-row'
  ];

  // 检查样式值是否为有意义的非默认值
  const isSignificantStyleValue = (property, value, element) => {
    if (['font-family'].includes(property)){
      return false;
    }

    if (!value || value === '' || value === 'auto' || value === 'none' || value === 'normal') {
      return false;
    }
    
    // 检查一些常见的默认值
    const defaultValues = {
      'margin': '0px',
      'margin-top': '0px', 'margin-right': '0px', 'margin-bottom': '0px', 'margin-left': '0px',
      'padding': '0px',
      'padding-top': '0px', 'padding-right': '0px', 'padding-bottom': '0px', 'padding-left': '0px',
      'border-width': '0px',
      'opacity': '1',
      'font-weight': '400',
      'text-decoration': 'none solid rgb(0, 0, 0)',
      'text-align': 'start',
      'position': 'static',
      'display': element.tagName === 'DIV' ? 'block' : (element.tagName === 'SPAN' ? 'inline' : ''),
      'background-color': 'rgba(0, 0, 0, 0)',
      'color': 'rgb(0, 0, 0)'
    };
    
    return value !== defaultValues[property];
  };

  // 提取并内联样式到元素
  const extractAndInlineStyles = (element, clone) => {
    try {
      const elementsToProcess = [element, ...element.querySelectorAll('*')];
      const cloneElementsToProcess = [clone, ...clone.querySelectorAll('*')];
      let processedCount = 0;
      
      elementsToProcess.forEach((el,index) => {
        try {
          const cloneEl = cloneElementsToProcess[index];
          // 获取计算后的样式
          const computedStyle = window.getComputedStyle(el);
          const inlineStyles = [];
          
          // // 保存现有的内联样式
          // const existingStyle = el.getAttribute('style') || '';
          // if (existingStyle) {
          //   inlineStyles.push(existingStyle);
          // }
          
          // 遍历重要样式属性
          IMPORTANT_STYLE_PROPERTIES.forEach(property => {
            const value = computedStyle.getPropertyValue(property);
            if (isSignificantStyleValue(property, value, el)) {
              inlineStyles.push(`${property}: ${value}`);
            }
          });
          
          // 应用内联样式
          if (inlineStyles.length > 0) {
            // 去重和合并样式
            const styleString = inlineStyles.join('; ');
            cloneEl.setAttribute('style', styleString);
          }
          
          // 删除 class和id属性
          cloneEl.removeAttribute('class');
          cloneEl.removeAttribute('id');

          processedCount++;
        } catch (err) {
          console.warn('处理元素样式时出错:', err, cloneEl);
        }
      });
      
      console.log(`✅ 样式提取完成，处理了 ${processedCount} 个元素`);
      return element;
      
    } catch (error) {
      console.error('样式提取过程中出现错误:', error);
      // 如果样式提取失败，返回原元素以保证基本功能
      return element;
    }
  };

  // 处理相对链接转绝对链接的函数 - 优化版本（单次遍历）
  const convertRelativeToAbsolute = (element) => {
    const clone = element.cloneNode(true);
    // 先提取并内联样式
    console.log('🎨 开始提取样式...');
    extractAndInlineStyles(element,clone);

    const currentPath = window.location.href;
    
    // 辅助函数：检查URL是否需要转换
    const needsConversion = (url) => {
      return url && 
             !url.startsWith('http') && 
             !url.startsWith('data:') && 
             !url.startsWith('//') && 
             !url.startsWith('mailto:') && 
             !url.startsWith('tel:') && 
             !url.startsWith('#') && 
             !url.startsWith('javascript:');
    };
    
    // 辅助函数：安全地转换URL
    const convertUrl = (url, context = '') => {
      try {
        return new URL(url, currentPath).href;
      } catch (e) {
        console.warn(`无法转换${context}:`, url, e);
        return url; // 返回原始URL
      }
    };
    
    
    // 然后处理链接转换
    console.log('🔗 开始转换链接...');
    
    // 单次遍历处理所有元素
    const elementsToProcess = [clone, ...clone.querySelectorAll('*')];
    elementsToProcess.forEach(el => {
      // 处理 img 标签的 src 属性
      if (el.tagName === 'IMG') {
        const src = el.getAttribute('src');
        if (needsConversion(src)) {
          el.setAttribute('src', convertUrl(src, 'img src'));
        }
      }
      
      // 处理 a 标签的 href 属性
      if (el.tagName === 'A') {
        const href = el.getAttribute('href');
        if (needsConversion(href)) {
          el.setAttribute('href', convertUrl(href, 'a href'));
        }
      }
      
      // 处理 CSS 背景图片
      const style = el.getAttribute('style');
      if (style && style.includes('url(')) {
        const updatedStyle = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
          if (needsConversion(url)) {
            const absoluteUrl = convertUrl(url, 'CSS background');
            return `url('${absoluteUrl}')`;
          }
          return match;
        });
        el.setAttribute('style', updatedStyle);
      }
      
      // 处理其他URL属性
      const urlAttributes = ['srcset', 'data-src', 'data-original', 'data-lazy'];
      urlAttributes.forEach(attr => {
        const value = el.getAttribute(attr);
        if (needsConversion(value)) {
          if (attr === 'srcset') {
            // 处理srcset可能包含多个URL的情况
            const srcsetValue = value.replace(/(\S+)(\s+\S+)?/g, (match, url, descriptor) => {
              if (needsConversion(url)) {
                const absoluteUrl = convertUrl(url, `srcset ${attr}`);
                return absoluteUrl + (descriptor || '');
              }
              return match;
            });
            el.setAttribute(attr, srcsetValue);
          } else {
            el.setAttribute(attr, convertUrl(value, attr));
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
      // 统计转换的链接信息和样式信息
      linkStats: {
        totalImages: processedElement.querySelectorAll('img[src]').length,  
        totalLinks: processedElement.querySelectorAll('a[href]').length,
        hasBackgroundImages: processedElement.querySelectorAll('*[style*="background-image"]').length > 0,
        styledElements: processedElement.querySelectorAll('*[style]').length
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
        let message = `✅ 成功生成文件！\n📄 HTML: ${result.files?.html?.filename}\n📝 Markdown: ${result.files?.markdown?.filename}`;
        
        // 如果有查看链接，添加到消息中
        if (result.files?.html?.viewUrl) {
          message += `\n\n👁️ 点击查看: ${result.files.html.viewUrl}`;
        }
        
        showNotification(message, 'success', result.files?.html?.viewUrl);
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
  const showNotification = (message, type = 'info', viewUrl = null) => {
    const notification = document.createElement('div');
    notification.className = `dom-catcher-notification ${type}`;
    
    if (viewUrl && type === 'success') {
      // 为成功消息创建可点击的通知
      const textPart = message.split('\n\n👁️')[0]; // 分离文本和链接部分
      const textDiv = document.createElement('div');
      textDiv.textContent = textPart;
      
      const linkDiv = document.createElement('div');
      linkDiv.style.marginTop = '8px';
      linkDiv.style.borderTop = '1px solid rgba(255,255,255,0.3)';
      linkDiv.style.paddingTop = '8px';
      
      const linkButton = document.createElement('a');
      linkButton.textContent = '👁️ 点击查看 HTML 文件';
      linkButton.href = viewUrl;
      linkButton.target = '_blank';
      linkButton.style.cssText = `
        color: white;
        text-decoration: underline;
        cursor: pointer;
        font-weight: bold;
      `;
      
      linkDiv.appendChild(linkButton);
      notification.appendChild(textDiv);
      notification.appendChild(linkDiv);
    } else {
      notification.textContent = message;
    }
    
    document.body.appendChild(notification);

    // 成功消息延长展示时间
    const timeout = type === 'success' ? 8000 : 3000;
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
  showNotification('🎯 元素选择模式已激活\n悬停查看元素，点击选择，按ESC退出\n✨ 新功能：自动提取并保留样式\n📝 同时生成 HTML 和 Markdown 文件');
}
