const jsdom = require('jsdom');
const { JSDOM } = jsdom;

function convertElementToMarkdown(element) {
  if (!element) return '';
  
  if (element.nodeType === 3) {
    return element.textContent || '';
  }
  
  if (element.nodeType !== 1) {
    return '';
  }
  
  const tagName = element.tagName?.toLowerCase();
  
  const processChildren = () => {
    let result = '';
    for (let child of element.childNodes) {
      result += convertElementToMarkdown(child);
    }
    return result;
  };
  
  switch (tagName) {
    case 'p': 
      return `${processChildren()}\n\n`;
    case 'strong':
    case 'b': 
      return `**${processChildren()}**`;
    case 'em':
    case 'i': 
      return `*${processChildren()}*`;
    default:
      return processChildren();
  }
}

// 测试
const html = '<p>Hello <strong>world</strong> with <em>formatting</em></p>';
const dom = new JSDOM(html);
const element = dom.window.document.body.firstChild;
const result = convertElementToMarkdown(element);

console.log('输入HTML:', html);
console.log('输出Markdown:', JSON.stringify(result));
console.log('预期结果:', 'Hello **world** with *formatting*');

if (result.trim() === 'Hello **world** with *formatting*') {
    console.log('✅ 测试通过！');
} else {
    console.log('❌ 测试失败！');
}
