/**
 * 文件处理模块
 * 负责文件系统操作、HTML内容生成、Markdown内容生成
 */

const fs = require('fs').promises;
const path = require('path');
const { htmlToMarkdown } = require('./html-converter');

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

// 初始化输出目录
const initializeOutputDir = async (outputDir) => {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    console.log('确保 captured 目录存在');
  } catch (error) {
    console.error(`创建目录失败: ${outputDir}`, error);
    process.exit(1);
  }
};

// 生成完整的HTML文件内容，包含元信息
function generateFullHtmlContent(html, info, htmlFilename, markdownFilename) {
  return `<!DOCTYPE html>
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
      <span class="info-label">🎨 样式统计:</span>
      <span class="info-value">
        ${info.linkStats.styledElements || 0} 个元素包含内联样式
        ${info.linkStats.pseudoElements ? ` | ${info.linkStats.pseudoElements} 个伪元素` : ''}
        ${info.linkStats.animatedElements ? ` | ${info.linkStats.animatedElements} 个动画元素` : ''}
        ${info.linkStats.hasKeyframes ? ' | 包含关键帧动画' : ''}
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
}

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

// 保存HTML和Markdown文件
async function saveFiles(outputDir, html, info) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const safeTagName = info?.tagName || 'element';
  const baseFilename = `${timestamp}-${safeTagName}`;
  const htmlFilename = `${baseFilename}.html`;
  const markdownFilename = `${baseFilename}.md`;
  
  const htmlFilepath = path.join(outputDir, htmlFilename);
  const markdownFilepath = path.join(outputDir, markdownFilename);

  // 创建完整的HTML文件内容，包含元信息
  const fullHtmlContent = generateFullHtmlContent(html, info, htmlFilename, markdownFilename);

  // 生成 Markdown 内容
  const markdownContent = generateMarkdownContent(html, info, baseFilename);

  // 同时保存 HTML 和 Markdown 文件
  await Promise.all([
    fs.writeFile(htmlFilepath, fullHtmlContent, 'utf8'),
    fs.writeFile(markdownFilepath, markdownContent, 'utf8')
  ]);
  
  return {
    htmlFilename,
    markdownFilename,
    htmlFilepath,
    markdownFilepath,
    baseFilename
  };
}

// 获取文件列表详情
async function getFileDetails(outputDir) {
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
  
  return {
    htmlFiles: htmlFiles.length,
    markdownFiles: markdownFiles.length,
    files: fileDetails.sort((a, b) => b.html.created - a.html.created)
  };
}

module.exports = {
  escapeHtml,
  initializeOutputDir,
  generateFullHtmlContent,
  generateMarkdownContent,
  saveFiles,
  getFileDetails
};
