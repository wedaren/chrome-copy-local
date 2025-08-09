const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// HTML 到 Markdown 转换函数
function htmlToMarkdown(html, info) {
  // 创建一个简单的 DOM 解析器
  const jsdom = require('jsdom');
  const { JSDOM } = jsdom;
  
  // 如果 jsdom 不可用，使用简单的正则替换
  if (!jsdom) {
    return simpleHtmlToMarkdown(html, info);
  }
  
  try {
    const dom = new JSDOM(html);
    const element = dom.window.document.body.firstChild;
    return convertElementToMarkdown(element, info);
  } catch (error) {
    console.log('使用 jsdom 转换失败，回退到简单转换方案:', error.message);
    return simpleHtmlToMarkdown(html, info);
  }
}

// 简单的 HTML 到 Markdown 转换（不依赖外部库）
function simpleHtmlToMarkdown(html, info) {
  let markdown = html
    // 处理标题
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
    .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
    .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
    
    // 处理段落
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    
    // 处理换行
    .replace(/<br\s*\/?>/gi, '\n')
    
    // 处理粗体和斜体
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    
    // 处理链接
    .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
    
    // 处理图片
    .replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')
    .replace(/<img[^>]*src="([^"]*)"[^>]*>/gi, '![Image]($1)')
    
    // 处理代码
    .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
    .replace(/<pre[^>]*>(.*?)<\/pre>/gi, '\n```\n$1\n```\n')
    
    // 处理列表
    .replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
      const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n');
      return '\n' + items + '\n';
    })
    .replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
      let counter = 1;
      const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, () => {
        return `${counter++}. $1\n`;
      });
      return '\n' + items + '\n';
    })
    
    // 处理表格（简单处理）
    .replace(/<table[^>]*>(.*?)<\/table>/gis, (match, content) => {
      let tableMarkdown = '\n';
      const rows = content.match(/<tr[^>]*>(.*?)<\/tr>/gis);
      if (rows) {
        rows.forEach((row, index) => {
          const cells = row.match(/<t[hd][^>]*>(.*?)<\/t[hd]>/gis);
          if (cells) {
            const cellContents = cells.map(cell => 
              cell.replace(/<t[hd][^>]*>(.*?)<\/t[hd]>/gi, '$1').trim()
            );
            tableMarkdown += '| ' + cellContents.join(' | ') + ' |\n';
            
            // 添加表头分隔符
            if (index === 0) {
              tableMarkdown += '|' + cellContents.map(() => ' --- ').join('|') + '|\n';
            }
          }
        });
      }
      return tableMarkdown + '\n';
    })
    
    // 处理引用
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gis, (match, content) => {
      return '\n> ' + content.replace(/\n/g, '\n> ') + '\n\n';
    })
    
    // 移除剩余的 HTML 标签
    .replace(/<[^>]*>/g, '')
    
    // 清理多余的空行
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();

  return markdown;
}

// 使用 jsdom 的高级转换（如果可用）
function convertElementToMarkdown(element, info) {
  if (!element) return '';
  
  const tagName = element.tagName?.toLowerCase();
  const textContent = element.textContent || '';
  
  switch (tagName) {
    case 'h1': return `# ${textContent}\n\n`;
    case 'h2': return `## ${textContent}\n\n`;
    case 'h3': return `### ${textContent}\n\n`;
    case 'h4': return `#### ${textContent}\n\n`;
    case 'h5': return `##### ${textContent}\n\n`;
    case 'h6': return `###### ${textContent}\n\n`;
    case 'p': return `${textContent}\n\n`;
    case 'strong':
    case 'b': return `**${textContent}**`;
    case 'em':
    case 'i': return `*${textContent}*`;
    case 'code': return `\`${textContent}\``;
    case 'pre': return `\n\`\`\`\n${textContent}\n\`\`\`\n\n`;
    case 'a':
      const href = element.getAttribute('href');
      return href ? `[${textContent}](${href})` : textContent;
    case 'img':
      const src = element.getAttribute('src');
      const alt = element.getAttribute('alt') || 'Image';
      return src ? `![${alt}](${src})` : '';
    default:
      return textContent;
  }
}

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
    const baseFilename = `${safeTagName}-${timestamp}`;
    const htmlFilename = `${baseFilename}.html`;
    const markdownFilename = `${baseFilename}.md`;
    
    const htmlFilepath = path.join(outputDir, htmlFilename);
    const markdownFilepath = path.join(outputDir, markdownFilename);

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
      <span class="info-value">${escapeHtml(htmlFilename)}</span>
    </div>
    <div class="info-item">
      <span class="info-label">Markdown文件:</span>
      <span class="info-value">${escapeHtml(markdownFilename)}</span>
    </div>
  </div>

  <div class="captured-element">
    <h3>🎯 捕获的元素</h3>
    ${html}
  </div>
</body>
</html>`;

    // 生成 Markdown 内容
    const markdownContent = generateMarkdownContent(html, info, baseFilename);

    // 同时保存 HTML 和 Markdown 文件
    await Promise.all([
      fs.writeFile(htmlFilepath, fullHtmlContent, 'utf8'),
      fs.writeFile(markdownFilepath, markdownContent, 'utf8')
    ]);
    
    const logInfo = {
      timestamp: new Date().toISOString(),
      htmlFilename,
      markdownFilename,
      elementInfo: info,
      success: true
    };
    
    console.log('✅ 成功保存元素 (HTML + Markdown):', logInfo);
    
    res.status(200).json({
      success: true,
      message: `成功保存文件: ${htmlFilename} 和 ${markdownFilename}`,
      files: {
        html: {
          filename: htmlFilename,
          filepath: htmlFilepath
        },
        markdown: {
          filename: markdownFilename,
          filepath: markdownFilepath
        }
      }
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

// 生成 Markdown 内容的函数
function generateMarkdownContent(html, info, baseFilename) {
  // 转换 HTML 到 Markdown
  let markdownBody = simpleHtmlToMarkdown(html, info);
  
  // 检查是否已经有一级标题
  const hasH1 = markdownBody.includes('# ');
  
  // 如果没有一级标题，使用网页标题或默认标题
  if (!hasH1) {
    let title = '捕获的内容';
    
    // 优先使用页面标题
    if (info?.pageTitle && info.pageTitle.trim()) {
      title = info.pageTitle.trim();
    } 
    // 其次使用元素的文本内容（如果较短且合适）
    else if (info?.textContent && info.textContent.length > 0 && info.textContent.length < 60) {
      title = info.textContent.trim();
    }
    // 最后使用 URL 域名
    else if (info?.url) {
      try {
        const url = new URL(info.url);
        title = url.hostname || '捕获的内容';
      } catch (e) {
        title = '捕获的内容';
      }
    }
    
    markdownBody = `# ${title}\n\n${markdownBody}`;
  }
  
  return markdownBody.trim();
}

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
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const fileDetails = await Promise.all(
      htmlFiles.map(async (file) => {
        const filepath = path.join(outputDir, file);
        const stats = await fs.stat(filepath);
        const baseName = path.parse(file).name;
        const markdownFile = `${baseName}.md`;
        
        // 检查对应的 Markdown 文件是否存在
        const markdownExists = markdownFiles.includes(markdownFile);
        let markdownStats = null;
        if (markdownExists) {
          const markdownPath = path.join(outputDir, markdownFile);
          markdownStats = await fs.stat(markdownPath);
        }
        
        return {
          baseName,
          html: {
            name: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            exists: true
          },
          markdown: markdownExists ? {
            name: markdownFile,
            size: markdownStats.size,
            created: markdownStats.birthtime,
            modified: markdownStats.mtime,
            exists: true
          } : {
            exists: false
          }
        };
      })
    );
    
    res.json({
      success: true,
      count: fileDetails.length,
      htmlFiles: htmlFiles.length,
      markdownFiles: markdownFiles.length,
      files: fileDetails.sort((a, b) => b.html.created - a.html.created)
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
  
  const server = app.listen(port, '127.0.0.1', () => {
    console.log(`
📡 服务地址: http://localhost:${port}
📁 保存目录: ${outputDir}
🔍 状态检查: http://localhost:${port}/status
📋 文件列表: http://localhost:${port}/files

🎯 新功能: 自动生成 HTML 和 Markdown 文件
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
startServer()
  .then((server) => {
    // 监听关闭信号
    process.on('SIGINT', gracefulShutdown(server));
    process.on('SIGTERM', gracefulShutdown(server));
  })
  .catch(console.error);
