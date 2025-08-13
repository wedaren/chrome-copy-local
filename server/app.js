/**
 * Express 应用主入口
 * 配置中间件、初始化服务器、处理优雅关闭
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeOutputDir } = require('./file-handler');
const { setupRoutes } = require('./routes');

// 创建并配置 Express 应用
function createApp(outputDir) {
  const app = express();

  // 使用 cors 中间件允许跨域请求
  app.use(cors({
    origin: '*', // 允许所有来源
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }));

  // 使用 express.json() 中间件来解析 JSON 请求体
  app.use(express.json({ limit: '50mb' }));

  // 设置路由
  setupRoutes(app, outputDir);

  return app;
}

// 启动服务器
const startServer = async (port = 3000, outputDir = path.join(__dirname, '..', 'captured')) => {
  await initializeOutputDir(outputDir);
  
  const app = createApp(outputDir);
  
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`
📡 服务地址: http://localhost:${port}
📁 保存目录: ${outputDir}
🔍 状态检查: http://localhost:${port}/status
📋 文件列表: http://localhost:${port}/files
🎯 文件管理: http://localhost:${port}/manage

🎯 新功能: 支持查看 HTML 文件
准备接收来自 Chrome 插件的 DOM 元素...
    `);
  });
  
  return server;
};

// 优雅关闭函数
const gracefulShutdown = (server) => {
  return (signal) => {
    console.log(`\n👋 收到 ${signal} 信号，正在优雅地关闭服务器...`);
    
    server.close((err) => {
      if (err) {
        console.error('❌ 关闭服务器时发生错误:', err);
        process.exit(1);
      }
      console.log('✅ 服务器已优雅关闭');
      process.exit(0);
    });
    
    // 如果在10秒内没有完成关闭，强制退出
    setTimeout(() => {
      console.log('⚠️  强制关闭服务器');
      process.exit(1);
    }, 10000);
  };
};

// 启动服务器并设置优雅关闭
const main = async () => {
  const port = process.env.PORT || 3000;
  const outputDir = path.join(__dirname, '..', 'captured');
  
  try {
    const server = await startServer(port, outputDir);
    
    // 监听关闭信号
    process.on('SIGINT', gracefulShutdown(server));
    process.on('SIGTERM', gracefulShutdown(server));
    
    return server;
  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
};

module.exports = {
  createApp,
  startServer,
  gracefulShutdown,
  main
};

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  main().catch(console.error);
}
