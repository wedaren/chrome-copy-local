/**
 * Content Script 主入口
 * 初始化和协调各个模块
 */

const { injectStyles } = require('./styles');
const { startDOMSelector } = require('./dom-selector');

// 防止重复注入
if (!window.hasDOMCatcher) {
  window.hasDOMCatcher = true;

  // 获取服务器配置，如果没有则使用默认值
  const SERVER_URL = window.DOM_CATCHER_SERVER_URL || 'http://localhost:3000';

  // 初始化
  function initialize() {
    try {
      // 注入样式
      injectStyles();
      
      // 启动DOM选择器
      startDOMSelector(SERVER_URL);
      
      console.log('🎯 DOM Catcher 已初始化，服务器地址:', SERVER_URL);
    } catch (error) {
      console.error('❌ DOM Catcher 初始化失败:', error);
    }
  }

  // 启动应用
  initialize();
}

module.exports = {
  // 导出一些可能需要的功能
  initialized: () => window.hasDOMCatcher
};
