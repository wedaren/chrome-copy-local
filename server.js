const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

// HTML 到 Markdown 转换函数
function htmlToMarkdown(html, info) {  
  try {  
    const jsdom = require('jsdom');  
    const { JSDOM } = jsdom;  
    const dom = new JSDOM(html);  
    
    // 处理 body 中的所有子元素，而不仅仅是第一个
    let result = '';
    for (let child of dom.window.document.body.childNodes) {
      result += convertElementToMarkdown(child, info);
    }
    
    return result.trim();
  } catch (error) {  
    console.log('jsdom 转换失败或未安装，回退到简单转换方案:', error.message);  
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
      const items = content.replace(/<li[^>]*>(.*?)<\/li>/gi, (match, itemContent) => {
        return `${counter++}. ${itemContent.trim()}\n`;
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

// 使用 jsdom 的高级转换（如果可用）- 递归遍历DOM树
function convertElementToMarkdown(element, info) {
  if (!element) return '';
  
  // 处理文本节点
  if (element.nodeType === 3) { // TEXT_NODE
    return element.textContent || '';
  }
  
  // 处理元素节点
  if (element.nodeType !== 1) { // 不是 ELEMENT_NODE
    return '';
  }
  
  const tagName = element.tagName?.toLowerCase();
  
  // 递归处理子元素的辅助函数
  const processChildren = () => {
    let result = '';
    for (let child of element.childNodes) {
      result += convertElementToMarkdown(child, info);
    }
    return result;
  };
  
  // 根据标签类型处理
  switch (tagName) {
    case 'h1': 
      return `# ${processChildren()}\n\n`;
    case 'h2': 
      return `## ${processChildren()}\n\n`;
    case 'h3': 
      return `### ${processChildren()}\n\n`;
    case 'h4': 
      return `#### ${processChildren()}\n\n`;
    case 'h5': 
      return `##### ${processChildren()}\n\n`;
    case 'h6': 
      return `###### ${processChildren()}\n\n`;
    case 'p': 
      return `${processChildren()}\n\n`;
    case 'strong':
    case 'b': 
      return `**${processChildren()}**`;
    case 'em':
    case 'i': 
      return `*${processChildren()}*`;
    case 'code': 
      return `\`${processChildren()}\``;
    case 'pre': 
      return `\n\`\`\`\n${processChildren()}\n\`\`\`\n\n`;
    case 'br':
      return '\n';
    case 'a':
      const href = element.getAttribute('href');
      const linkText = processChildren();
      return href ? `[${linkText}](${href})` : linkText;
    case 'img':
      const src = element.getAttribute('src');
      const alt = element.getAttribute('alt') || 'Image';
      return src ? `![${alt}](${src})` : '';
    case 'ul':
      let ulResult = '\n';
      for (let child of element.childNodes) {
        if (child.tagName?.toLowerCase() === 'li') {
          ulResult += `- ${convertElementToMarkdown(child, info).trim()}\n`;
        }
      }
      return ulResult + '\n';
    case 'ol':
      let olResult = '\n';
      let counter = 1;
      for (let child of element.childNodes) {
        if (child.tagName?.toLowerCase() === 'li') {
          olResult += `${counter++}. ${convertElementToMarkdown(child, info).trim()}\n`;
        }
      }
      return olResult + '\n';
    case 'li':
      return processChildren();
    case 'blockquote':
      const quoteContent = processChildren().trim();
      return '\n> ' + quoteContent.replace(/\n/g, '\n> ') + '\n\n';
    case 'table':
      return processTable(element, info);
    case 'thead':
    case 'tbody':
    case 'tfoot':
      return processChildren();
    case 'tr':
      return processChildren();
    case 'th':
    case 'td':
      return processChildren();
    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'header':
    case 'footer':
    case 'nav':
    case 'aside':
      // 容器元素，直接处理子元素，添加适当的间距
      const childContent = processChildren();
      return childContent ? childContent + (childContent.endsWith('\n\n') ? '' : '\n') : '';
    case 'span':
      // 内联元素，直接返回子内容
      return processChildren();
    default:
      // 对于未知元素，仍然递归处理子元素
      return processChildren();
  }
}

// 处理表格的辅助函数
function processTable(tableElement, info) {
  let tableMarkdown = '\n';
  const rows = [];
  
  // 收集所有行
  for (let child of tableElement.childNodes) {
    if (child.tagName?.toLowerCase() === 'tr') {
      rows.push(child);
    } else if (['thead', 'tbody', 'tfoot'].includes(child.tagName?.toLowerCase())) {
      for (let grandChild of child.childNodes) {
        if (grandChild.tagName?.toLowerCase() === 'tr') {
          rows.push(grandChild);
        }
      }
    }
  }
  
  // 处理每一行
  rows.forEach((row, rowIndex) => {
    const cells = [];
    for (let cell of row.childNodes) {
      if (['th', 'td'].includes(cell.tagName?.toLowerCase())) {
        const cellContent = convertElementToMarkdown(cell, info).trim();
        cells.push(cellContent || ' ');
      }
    }
    
    if (cells.length > 0) {
      tableMarkdown += '| ' + cells.join(' | ') + ' |\n';
      
      // 为第一行添加分隔符（表头）
      if (rowIndex === 0) {
        tableMarkdown += '|' + cells.map(() => ' --- ').join('|') + '|\n';
      }
    }
  });
  
  return tableMarkdown + '\n';
}

const app = express();
const port = process.env.PORT || 3000;

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

// 提供静态文件服务，用于查看保存的 HTML 文件
app.use('/view', express.static(outputDir));

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
    ${info?.linkStats ? `
    <div class="info-item">
      <span class="info-label">🔗 链接统计:</span>
      <span class="info-value">
        图片: ${info.linkStats.totalImages || 0} 个 | 
        链接: ${info.linkStats.totalLinks || 0} 个
        ${info.linkStats.hasBackgroundImages ? ' | 包含背景图片' : ''}
      </span>
    </div>
    <div class="info-item">
      <span class="info-label">📍 基础URL:</span>
      <span class="info-value">${escapeHtml(info.baseUrl || info.url)}</span>
    </div>
    ` : ''}
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
    
    const baseUrl = `http://localhost:${port}`;
    
    res.status(200).json({
      success: true,
      message: `成功保存文件: ${htmlFilename} 和 ${markdownFilename}`,
      files: {
        html: {
          filename: htmlFilename,
          filepath: htmlFilepath,
          viewUrl: `${baseUrl}/view/${htmlFilename}`
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

  const MAX_TITLE_LENGTH_FROM_CONTENT = 60;

  // 转换 HTML 到 Markdown - 使用改进的 jsdom 转换
  let markdownBody = htmlToMarkdown(html, info);
  
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
    else if (info?.textContent && info.textContent.length > 0 && info.textContent.length < MAX_TITLE_LENGTH_FROM_CONTENT) {
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
    const baseUrl = `http://localhost:${port}`;
    
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
            exists: true,
            viewUrl: `${baseUrl}/view/${file}`
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
      files: fileDetails.sort((a, b) => b.html.created - a.html.created),
      baseUrl: baseUrl
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '无法获取文件列表',
      error: error.message
    });
  }
});

// 添加文件管理界面
app.get('/manage', (req, res) => {
  const manageHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DOM Catcher - 文件管理</title>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 30px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      text-align: center;
    }
    .header h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2.5rem;
      font-weight: 300;
    }
    .header .subtitle {
      color: #7f8c8d;
      margin: 10px 0 0 0;
      font-size: 1.1rem;
    }
    .stats {
      display: flex;
      gap: 20px;
      margin-bottom: 30px;
      flex-wrap: wrap;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      flex: 1;
      min-width: 200px;
      text-align: center;
    }
    .stat-number {
      font-size: 2rem;
      font-weight: bold;
      color: #3498db;
      display: block;
    }
    .stat-label {
      color: #7f8c8d;
      margin-top: 5px;
    }
    .files-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .files-header {
      background: #f8f9fa;
      padding: 20px 30px;
      border-bottom: 1px solid #dee2e6;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .files-header h2 {
      margin: 0;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .refresh-btn {
      background: #3498db;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
    }
    .refresh-btn:hover {
      background: #2980b9;
    }
    .files-list {
      max-height: 600px;
      overflow-y: auto;
    }
    .file-item {
      padding: 20px 30px;
      border-bottom: 1px solid #f1f3f4;
      transition: background 0.2s;
    }
    .file-item:hover {
      background: #f8f9fa;
    }
    .file-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .file-name {
      font-weight: 600;
      color: #2c3e50;
      font-size: 1.1rem;
    }
    .file-time {
      color: #7f8c8d;
      font-size: 0.9rem;
    }
    .file-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.2s;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .btn-primary {
      background: #3498db;
      color: white;
    }
    .btn-primary:hover {
      background: #2980b9;
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: #95a5a6;
      color: white;
    }
    .btn-secondary:hover {
      background: #7f8c8d;
    }
    .loading {
      text-align: center;
      padding: 40px;
      color: #7f8c8d;
    }
    .error {
      text-align: center;
      padding: 40px;
      color: #e74c3c;
    }
    @media (max-width: 768px) {
      .stats {
        flex-direction: column;
      }
      .file-info {
        flex-direction: column;
        align-items: flex-start;
        gap: 10px;
      }
      .file-actions {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📁 DOM Catcher</h1>
      <p class="subtitle">文件管理中心</p>
    </div>

    <div class="stats" id="stats">
      <div class="stat-card">
        <span class="stat-number" id="totalFiles">-</span>
        <div class="stat-label">HTML 文件</div>
      </div>
      <div class="stat-card">
        <span class="stat-number" id="totalMarkdown">-</span>
        <div class="stat-label">Markdown 文件</div>
      </div>
      <div class="stat-card">
        <span class="stat-number" id="totalPairs">-</span>
        <div class="stat-label">配对文件</div>
      </div>
    </div>

    <div class="files-container">
      <div class="files-header">
        <h2>📋 已捕获的文件</h2>
        <button class="refresh-btn" onclick="loadFiles()">🔄 刷新</button>
      </div>
      <div class="files-list" id="filesList">
        <div class="loading">正在加载文件列表...</div>
      </div>
    </div>
  </div>

  <script>
    async function loadFiles() {
      const filesList = document.getElementById('filesList');
      const totalFilesEl = document.getElementById('totalFiles');
      const totalMarkdownEl = document.getElementById('totalMarkdown');
      const totalPairsEl = document.getElementById('totalPairs');
      
      filesList.innerHTML = '<div class="loading">正在加载文件列表...</div>';
      
      try {
        const response = await fetch('/files');
        const data = await response.json();
        
        if (data.success) {
          // 更新统计数据
          totalFilesEl.textContent = data.htmlFiles || 0;
          totalMarkdownEl.textContent = data.markdownFiles || 0;
          totalPairsEl.textContent = data.count || 0;
          
          if (data.files && data.files.length > 0) {
            filesList.innerHTML = data.files.map(file => {
              const createdDate = new Date(file.html.created).toLocaleString('zh-CN');
              return \`
                <div class="file-item">
                  <div class="file-info">
                    <div class="file-name">📄 \${file.html.name}</div>
                    <div class="file-time">创建于 \${createdDate}</div>
                  </div>
                  <div class="file-actions">
                    <a href="\${file.html.viewUrl}" target="_blank" class="btn btn-primary">
                      👁️ 查看 HTML
                    </a>
                    \${file.markdown.exists ? 
                      \`<a href="/view/\${file.markdown.name}" target="_blank" class="btn btn-secondary">
                        📝 查看 Markdown
                      </a>\` : 
                      '<span class="btn btn-secondary" style="opacity: 0.5;">📝 无 Markdown</span>'
                    }
                  </div>
                </div>
              \`;
            }).join('');
          } else {
            filesList.innerHTML = '<div class="loading">暂无捕获的文件</div>';
          }
        } else {
          throw new Error(data.message || '加载失败');
        }
      } catch (error) {
        console.error('加载文件列表失败:', error);
        filesList.innerHTML = \`<div class="error">❌ 加载失败: \${error.message}</div>\`;
      }
    }
    
    // 页面加载完成后自动加载文件列表
    document.addEventListener('DOMContentLoaded', loadFiles);
    
    // 每30秒自动刷新一次
    setInterval(loadFiles, 30000);
  </script>
</body>
</html>`;
  
  res.send(manageHtml);
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
startServer()
  .then((server) => {
    // 监听关闭信号
    process.on('SIGINT', gracefulShutdown(server));
    process.on('SIGTERM', gracefulShutdown(server));
  })
  .catch(console.error);
