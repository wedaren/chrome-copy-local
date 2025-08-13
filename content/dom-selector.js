/**
 * DOM选择器模块
 * 处理鼠标悬停高亮、点击选择等DOM交互功能
 */

const { HIGHLIGHT_CLASS } = require('./styles');
const { showNotification, createElementInfo, sendToServer } = require('./ui-helpers');
const { convertRelativeToAbsolute } = require('./link-converter');

let lastElement = null;
let cleanupHandlers = [];

// 鼠标悬浮处理函数
function handleMouseOver(event) {
  // 避免选中我们自己添加的提示元素
  if (event.target === document.body || 
      event.target === document.documentElement || 
      event.target.closest('.dom-catcher-notification')) {
    return;
  }
  
  if (lastElement) {
    lastElement.classList.remove(HIGHLIGHT_CLASS);
  }
  event.target.classList.add(HIGHLIGHT_CLASS);
  lastElement = event.target;
}

// 点击处理函数
async function handleClick(event, serverUrl) {
  // 阻止默认行为，例如链接跳转
  event.preventDefault();
  event.stopPropagation();

  // 清理工作
  cleanup();

  const targetElement = event.target;
  
  // 显示处理中消息
  showNotification('🔄 正在处理元素...', 'info');
  
  try {
    // 处理相对链接转换为绝对链接和样式提取
    const conversionResult = convertRelativeToAbsolute(targetElement);
    const elementHTML = conversionResult.html;
    
    // 获取元素的基本信息
    const elementInfo = createElementInfo(targetElement);
    elementInfo.linkStats = conversionResult.linkStats;
    
    console.log('📋 元素信息:', elementInfo);
    console.log('🔗 链接统计:', conversionResult.linkStats);
    
    // 发送到服务器
    await sendToServer(serverUrl, elementHTML, elementInfo);
    
  } catch (error) {
    console.error('处理元素时发生错误:', error);
    showNotification('❌ 处理元素失败: ' + error.message, 'error');
  }
}

// ESC键处理函数
function handleEscape(event) {
  if (event.key === 'Escape') {
    cleanup();
    showNotification('已取消元素选择模式');
  }
}

// 清理函数，移除所有监听器和样式
function cleanup() {
  if (lastElement) {
    lastElement.classList.remove(HIGHLIGHT_CLASS);
  }
  
  // 移除所有事件监听器
  cleanupHandlers.forEach(handler => handler());
  cleanupHandlers = [];
  
  window.hasDOMCatcher = false;
}

// 启动DOM选择器
function startDOMSelector(serverUrl) {
  // 创建事件处理器
  const mouseoverHandler = (event) => handleMouseOver(event);
  const clickHandler = (event) => handleClick(event, serverUrl);
  const escapeHandler = (event) => handleEscape(event);
  
  // 添加事件监听器
  document.addEventListener('mouseover', mouseoverHandler, true);
  document.addEventListener('click', clickHandler, true);
  document.addEventListener('keydown', escapeHandler);
  
  // 记录清理函数
  cleanupHandlers.push(
    () => document.removeEventListener('mouseover', mouseoverHandler, true),
    () => document.removeEventListener('click', clickHandler, true),
    () => document.removeEventListener('keydown', escapeHandler)
  );
  
  // 显示开始提示
  showNotification('🎯 元素选择模式已激活\n悬停查看元素，点击选择，按ESC退出\n✨ 高级样式提取：支持伪元素和动画\n📝 同时生成 HTML 和 Markdown 文件');
}

module.exports = {
  startDOMSelector,
  cleanup,
  handleMouseOver,
  handleClick,
  handleEscape
};
