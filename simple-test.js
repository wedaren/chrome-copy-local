const jsdom = require('jsdom');
const { JSDOM } = jsdom;

console.log('开始测试递归 Markdown 转换...');

// 简化版本的转换函数，专门用于测试
function testConvert(element) {
  if (!element) return '';
  
  if (element.nodeType === 3) {
    return element.textContent || '';
  }
  
  if (element.nodeType !== 1) {
    return '';
  }
  
  const tagName = element.tagName?.toLowerCase();
  
  let childContent = '';
  for (let child of element.childNodes) {
    childContent += testConvert(child);
  }
  
  switch (tagName) {
    case 'p': 
      return childContent + '\n\n';
    case 'strong':
    case 'b': 
      return `**${childContent}**`;
    case 'em':
    case 'i': 
      return `*${childContent}*`;
    default:
      return childContent;
  }
}

// 测试用例
const testHTML = '<p>Hello <strong>world</strong> with <em>formatting</em></p>';
console.log('测试HTML:', testHTML);

const dom = new JSDOM(testHTML);
const element = dom.window.document.body.firstChild;

console.log('Element tag:', element.tagName);
console.log('Element children count:', element.childNodes.length);

const result = testConvert(element).trim();
console.log('结果:', JSON.stringify(result));
console.log('期望:', 'Hello **world** with *formatting*');

if (result === 'Hello **world** with *formatting*') {
    console.log('✅ 递归转换测试通过！');
} else {
    console.log('❌ 递归转换测试失败！');
}
