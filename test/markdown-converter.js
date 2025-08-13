#!/usr/bin/env node

/**
 * Markdown 转换核心函数 (< 200行)
 * 从server模块中提取，用于独立测试
 */

// 导入现有的HTML转换器
const { htmlToMarkdown } = require('./server/html-converter');

// 简化的HTML到Markdown转换（用于测试）
function convertElementToMarkdown(element, info = {}) {
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
    case 'h1': return `# ${processChildren()}\n\n`;
    case 'h2': return `## ${processChildren()}\n\n`;
    case 'h3': return `### ${processChildren()}\n\n`;
    case 'h4': return `#### ${processChildren()}\n\n`;
    case 'h5': return `##### ${processChildren()}\n\n`;
    case 'h6': return `###### ${processChildren()}\n\n`;
    case 'p': return `${processChildren()}\n\n`;
    case 'strong':
    case 'b': return `**${processChildren()}**`;
    case 'em':
    case 'i': return `*${processChildren()}*`;
    case 'code': return `\`${processChildren()}\``;
    case 'pre': return `\n\`\`\`\n${processChildren()}\n\`\`\`\n\n`;
    case 'br': return '\n';
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
    case 'li': return processChildren();
    case 'blockquote':
      const quoteContent = processChildren().trim();
      return '\n> ' + quoteContent.replace(/\n/g, '\n> ') + '\n\n';
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
    case 'span': return processChildren(); // 内联元素，直接返回子内容
    default: return processChildren(); // 对于未知元素，仍然递归处理子元素
  }
}

// HTML到Markdown转换的包装函数
function testHtmlToMarkdown(html, info) {
  try {
    const jsdom = require('jsdom');
    const { JSDOM } = jsdom;
    const dom = new JSDOM(html);
    
    let result = '';
    for (let child of dom.window.document.body.childNodes) {
      result += convertElementToMarkdown(child, info);
    }
    
    return result.trim();
  } catch (error) {
    console.log('jsdom转换失败，使用服务器模块:', error.message);
    return htmlToMarkdown(html, info);
  }
}

module.exports = {
  convertElementToMarkdown,
  testHtmlToMarkdown
};
