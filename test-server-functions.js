#!/usr/bin/env node

// 直接测试 server.js 中的转换函数
const fs = require('fs');

// 读取并执行 server.js 中的函数定义
const serverContent = fs.readFileSync('./server.js', 'utf8');

// 提取转换函数（简化的方法）
eval(`
const jsdom = require('jsdom');
const { JSDOM } = jsdom;

${serverContent.match(/function convertElementToMarkdown\([\s\S]*?(?=\n\n\/\/|function |const |$)/)[0]}

// 处理表格的辅助函数
${serverContent.match(/function processTable\([\s\S]*?(?=\n\n|function |const |$)/)[0]}

${serverContent.match(/function htmlToMarkdown\([\s\S]*?(?=\n\n\/\/|function |const |$)/)[0]}
`);

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
  }
];

console.log('🧪 测试递归 Markdown 转换功能...\n');

testCases.forEach((testCase, index) => {
  console.log(`📝 测试 ${index + 1}: ${testCase.name}`);
  console.log(`输入: ${testCase.html}`);
  
  try {
    const result = htmlToMarkdown(testCase.html, {}).trim();
    console.log(`输出: "${result}"`);
    console.log(`期望: "${testCase.expected}"`);
    
    if (result === testCase.expected) {
      console.log('✅ 通过\n');
    } else {
      console.log('❌ 失败\n');
    }
  } catch (error) {
    console.log(`❌ 错误: ${error.message}\n`);
  }
});
