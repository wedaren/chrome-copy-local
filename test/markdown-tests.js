#!/usr/bin/env node

/**
 * Markdown 转换测试用例 (< 200行)
 * 测试各种HTML结构的Markdown转换
 */

const { testHtmlToMarkdown } = require('./markdown-converter');

// 测试用例
const testCases = [
  {
    name: '基本标题测试',
    html: '<h1>主标题</h1><h2>副标题</h2><p>段落内容</p>',
    expected: '# 主标题\n\n## 副标题\n\n段落内容\n\n'
  },
  {
    name: '文本格式测试',
    html: '<p><strong>粗体</strong>和<em>斜体</em>以及<code>代码</code></p>',
    expected: '**粗体**和*斜体*以及`代码`\n\n'
  },
  {
    name: '链接和图片测试', 
    html: '<p><a href="https://example.com">链接</a></p><img src="image.jpg" alt="图片">',
    expected: '[链接](https://example.com)\n\n![图片](image.jpg)'
  },
  {
    name: '列表测试',
    html: '<ul><li>项目1</li><li>项目2</li></ul><ol><li>编号1</li><li>编号2</li></ol>',
    expected: '\n- 项目1\n- 项目2\n\n\n1. 编号1\n2. 编号2\n\n'
  },
  {
    name: '引用测试',
    html: '<blockquote><p>这是一个引用</p></blockquote>',
    expected: '\n> 这是一个引用\n\n\n\n'
  },
  {
    name: '代码块测试',
    html: '<pre><code>console.log("Hello World");</code></pre>',
    expected: '\n```\n`console.log("Hello World");`\n```\n\n'
  },
  {
    name: '复杂嵌套测试',
    html: `
      <article>
        <h1>文章标题</h1>
        <section>
          <h2>章节1</h2>
          <p>这是第一段，包含<strong>粗体</strong>和<a href="#">链接</a>。</p>
          <ul>
            <li>列表项目1</li>
            <li>列表项目2</li>
          </ul>
        </section>
      </article>
    `,
    expected: expect => expect.includes('# 文章标题') && expect.includes('## 章节1')
  }
];

// 运行测试
function runTests() {
  console.log('🧪 开始 Markdown 转换测试...\n');
  
  let passed = 0;
  let failed = 0;
  
  testCases.forEach((testCase, index) => {
    try {
      console.log(`测试 ${index + 1}: ${testCase.name}`);
      const result = testHtmlToMarkdown(testCase.html);
      
      let success;
      if (typeof testCase.expected === 'function') {
        success = testCase.expected(result);
      } else {
        success = result.trim() === testCase.expected.trim();
      }
      
      if (success) {
        console.log('✅ 通过\n');
        passed++;
      } else {
        console.log('❌ 失败');
        console.log('期望:', JSON.stringify(testCase.expected));
        console.log('实际:', JSON.stringify(result));
        console.log('');
        failed++;
      }
    } catch (error) {
      console.log(`❌ 错误: ${error.message}\n`);
      failed++;
    }
  });
  
  console.log(`\n📊 测试完成: ${passed} 通过, ${failed} 失败`);
  
  // 性能测试
  console.log('\n⚡ 性能测试...');
  const complexHtml = `
    <div>
      ${'<p>测试段落</p>'.repeat(100)}
      <ul>${'<li>列表项</li>'.repeat(50)}</ul>
    </div>
  `;
  
  const start = Date.now();
  for (let i = 0; i < 10; i++) {
    testHtmlToMarkdown(complexHtml);
  }
  const end = Date.now();
  
  console.log(`转换100段+50列表项 x10次: ${end - start}ms`);
  
  return failed === 0;
}

// 如果直接运行此文件
if (require.main === module) {
  const success = runTests();
  process.exit(success ? 0 : 1);
}

module.exports = { runTests, testCases };
