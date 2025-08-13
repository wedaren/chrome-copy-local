#!/usr/bin/env node

// 测试递归 Markdown 转换功能

const jsdom = require('jsdom');
const { JSDOM } = jsdom;

// 复制 server.js 中的函数以便测试
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

function htmlToMarkdown(html, info = {}) {  
  const dom = new JSDOM(html);  
  
  // 处理 body 中的所有子元素，而不仅仅是第一个
  let result = '';
  for (let child of dom.window.document.body.childNodes) {
    result += convertElementToMarkdown(child, info);
  }
  
  return result.trim();
}

// 测试用例
const testCases = [
  {
    name: '简单段落带粗体',
    html: '<p>Hello <strong>world</strong></p>',
    expected: 'Hello **world**'
  },
  {
    name: '复杂嵌套格式',
    html: '<p>Hello <strong>bold <em>italic</em></strong> text</p>',
    expected: 'Hello **bold *italic*** text'
  },
  {
    name: '标题带格式',
    html: '<h1>Title with <strong>bold</strong></h1>',
    expected: '# Title with **bold**'
  },
  {
    name: '链接带格式',
    html: '<p><a href="https://example.com">Visit <strong>this</strong> site</a></p>',
    expected: '[Visit **this** site](https://example.com)'
  },
  {
    name: '列表项带格式',
    html: '<ul><li>Item <strong>one</strong></li><li>Item <em>two</em></li></ul>',
    expected: '- Item **one**\n- Item *two*'
  },
  {
    name: '引用带格式',
    html: '<blockquote>This is <strong>important</strong> quote</blockquote>',
    expected: '> This is **important** quote'
  },
  {
    name: '代码带周围文本',
    html: '<p>Use the <code>console.log()</code> function</p>',
    expected: 'Use the `console.log()` function'
  }
];

console.log('🧪 开始测试递归 Markdown 转换功能...\n');

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`📝 测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: ${testCase.html}`);
  
  try {
    const result = htmlToMarkdown(testCase.html);
    const normalizedResult = result.replace(/\n+/g, '\n').trim();
    const normalizedExpected = testCase.expected.replace(/\n+/g, '\n').trim();
    
    console.log(`输出: "${normalizedResult}"`);
    console.log(`期望: "${normalizedExpected}"`);
    
    if (normalizedResult === normalizedExpected) {
      console.log('✅ 通过\n');
      passedTests++;
    } else {
      console.log('❌ 失败\n');
      failedTests++;
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}\n`);
    failedTests++;
  }
});

console.log(`🎯 测试总结:`);
console.log(`✅ 通过: ${passedTests}`);
console.log(`❌ 失败: ${failedTests}`);
console.log(`📊 成功率: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 所有测试都通过了！递归转换功能正常工作。');
  process.exit(0);
} else {
  console.log('\n⚠️  有测试失败，请检查实现。');
  process.exit(1);
}
