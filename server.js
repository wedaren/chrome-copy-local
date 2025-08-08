const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const port = 3000;

// 使用 cors 中间件允许跨域请求
app.use(cors({
  origin: '*', // 允许所有来源
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// 使用 express.json() 中间件来解析 JSON 请求体
app.use(express.json({ limit: '50mb' }));

// 确保 'captured' 目录存在
const outputDir = path.join(__dirname, 'captured');

// HTML转义函数，防止XSS攻击
function escapeHtml(unsafe) {
  if (!unsafe) return 'N/A';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const initializeOutputDir = async () => {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log('确保 captured 目录存在');
  } catch (error) {
    console.error(`创建目录失败: ${outputDir}`, error);
    process.exit(1);
  }
};

// 定义接收数据的路由
app.post('/receive-dom', async (req, res) => {
  try {
    const { html, info } = req.body;

    if (!html) {
      return res.status(400).send('没有收到 HTML 数据。');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeTagName = info?.tagName || 'element';
    const filename = `${safeTagName}-${timestamp}.html`;
    const filepath = path.join(outputDir, filename);

    // 创建完整的HTML文件内容，包含元信息
    const fullHtmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Captured DOM Element - ${escapeHtml(info?.tagName)}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .info-panel {
      background: white;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .info-panel h2 {
      margin: 0 0 16px 0;
      color: #333;
      border-bottom: 2px solid #4285f4;
      padding-bottom: 8px;
    }
    .info-item {
      margin: 8px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .info-label {
      font-weight: 600;
      color: #555;
      display: inline-block;
      width: 120px;
    }
    .info-value {
      color: #333;
      word-break: break-all;
    }
    .captured-element {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-top: 20px;
    }
    .captured-element h3 {
      margin: 0 0 16px 0;
      color: #333;
      border-bottom: 2px solid #ff4444;
      padding-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="info-panel">
    <h2>📋 元素信息</h2>
    <div class="info-item">
      <span class="info-label">标签名:</span>
      <span class="info-value">${escapeHtml(info?.tagName)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">ID:</span>
      <span class="info-value">${escapeHtml(info?.id)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Class:</span>
      <span class="info-value">${escapeHtml(info?.className)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">文本内容:</span>
      <span class="info-value">${escapeHtml(info?.textContent)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">来源URL:</span>
      <span class="info-value"><a href="${escapeHtml(info?.url)}" target="_blank">${escapeHtml(info?.url)}</a></span>
    </div>
    <div class="info-item">
      <span class="info-label">捕获时间:</span>
      <span class="info-value">${escapeHtml(info?.timestamp)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">文件名:</span>
      <span class="info-value">${escapeHtml(filename)}</span>
    </div>
  </div>

  <div class="captured-element">
    <h3>🎯 捕获的元素</h3>
    ${html}
  </div>
</body>
</html>`;

    await fs.writeFile(filepath, fullHtmlContent, 'utf8');
    
    const logInfo = {
      timestamp: new Date().toISOString(),
      filename,
      elementInfo: info,
      success: true
    };
    
    console.log('✅ 成功保存元素:', logInfo);
    
    res.status(200).json({
      success: true,
      message: `成功保存文件: ${filename}`,
      filename: filename,
      filepath: filepath
    });
    
  } catch (error) {
    console.error('❌ 文件保存失败:', error);
    res.status(500).json({
      success: false,
      message: '文件保存失败',
      error: error.message
    });
  }
});

// 添加一个简单的状态检查端点
app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    message: 'DOM Catcher 本地服务运行中',
    timestamp: new Date().toISOString(),
    outputDir: outputDir
  });
});

// 添加一个列出已捕获文件的端点
app.get('/files', async (req, res) => {
  try {
    const files = await fs.readdir(outputDir);
    const htmlFiles = files.filter(file => file.endsWith('.html'));
    
    const fileDetails = await Promise.all(
      htmlFiles.map(async (file) => {
        const filepath = path.join(outputDir, file);
        const stats = await fs.stat(filepath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        };
      })
    );
    
    res.json({
      success: true,
      count: fileDetails.length,
      files: fileDetails.sort((a, b) => b.created - a.created)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '无法获取文件列表',
      error: error.message
    });
  }
});

// 启动服务器
const startServer = async () => {
  await initializeOutputDir();
  
  app.listen(port, () => {
    console.log(`
🚀 DOM Catcher 本地服务已启动！

📡 服务地址: http://localhost:${port}
📁 保存目录: ${outputDir}
🔍 状态检查: http://localhost:${port}/status
📋 文件列表: http://localhost:${port}/files

准备接收来自 Chrome 插件的 DOM 元素...
    `);
  });
};

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 正在关闭服务器...');
  process.exit(0);
});

startServer().catch(console.error);
