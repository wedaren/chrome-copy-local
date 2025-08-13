/**
 * UI辅助函数模块
 * 处理通知显示、用户交互等UI相关功能
 */

// 显示通知函数
function showNotification(message, type = 'info', viewUrl = null) {
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
}

// 创建元素信息对象
function createElementInfo(element) {
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || '',
    className: element.className || '',
    textContent: element.textContent?.substring(0, 200) || '',
    url: window.location.href,
    pageTitle: document.title,
    timestamp: new Date().toISOString(),
    linkStats: null // 将在链接转换模块中填充
  };
}

// 发送数据到服务器
async function sendToServer(serverUrl, elementHTML, elementInfo) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时

  try {
    const response = await fetch(`${serverUrl}/receive-dom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      mode: 'cors', // 明确指定CORS模式
      body: JSON.stringify({ 
        html: elementHTML,
        info: elementInfo
      }),
    });
    
    clearTimeout(timeoutId);
    
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

module.exports = {
  showNotification,
  createElementInfo,
  sendToServer
};
