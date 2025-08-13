/**
 * HTML 到 Markdown 转换模块
 * 包含两种转换方式：jsdom 高级转换和简单正则转换
 */

// HTML 到 Markdown 转换主函数
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

module.exports = {
  htmlToMarkdown,
  simpleHtmlToMarkdown,
  convertElementToMarkdown,
  processTable
};
