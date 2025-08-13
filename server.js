/**
 * 服务器主入口文件 - 兼容性保持
 * 使用新的模块化结构，保持向后兼容
 */

// 导入新的模块化应用
const { main } = require('./server/app');

// 启动服务器，保持与原版本的完全兼容
main().catch(console.error);
