# DOM Catcher v1.2 - Markdown 生成功能

## 🎯 新功能概述

DOM Catcher v1.2 新增了**自动 Markdown 生成**功能！现在捕获 DOM 元素时，会同时生成两个文件：

- 📄 **HTML 文件**：包含完整的元素信息和样式化展示
- 📝 **Markdown 文件**：将 HTML 内容转换为 Markdown 格式，便于文档编写

## ✨ 功能特性

### 同时生成两种格式文件
```
例如捕获一个 <h1> 元素：
├── h1-2025-08-09T12-30-45-123Z.html
└── h1-2025-08-09T12-30-45-123Z.md
```

### 智能 HTML 到 Markdown 转换
- **标题转换**：`<h1>` → `# 标题`
- **段落转换**：`<p>` → 普通文本
- **格式化**：`<strong>` → `**粗体**`，`<em>` → `*斜体*`
- **链接转换**：`<a href="url">文本</a>` → `[文本](url)`
- **代码块**：`<pre>` → \`\`\`代码块\`\`\`
- **列表转换**：`<ul>`/`<ol>` → Markdown 列表
- **表格转换**：`<table>` → Markdown 表格

### 完整的元数据信息
每个 Markdown 文件都包含：
- 📋 元素信息表格（标签名、ID、Class等）
- 🎯 转换后的 Markdown 内容
- 📄 原始 HTML 代码块
- ⏰ 捕获时间和来源信息

## 📋 Markdown 文件结构

```markdown
# DOM 元素捕获报告

## 📋 元素信息

| 项目 | 值 |
|------|-----|
| 标签名 | `h1` |
| ID | `main-title` |
| Class | `header-title primary` |
| 文本内容 | `欢迎使用 DOM Catcher` |
| 来源URL | [https://example.com](https://example.com) |
| 捕获时间 | 2025-08-09 12:30:45 |
| 文件名 | `h1-2025-08-09T12-30-45-123Z` |

## 🎯 捕获的元素内容

# 欢迎使用 DOM Catcher

## 📄 原始HTML

\`\`\`html
<h1 id="main-title" class="header-title primary">欢迎使用 DOM Catcher</h1>
\`\`\`

---

*此文件由 DOM Catcher 自动生成*
```

## 🚀 使用方法

1. **启动服务器**
   ```bash
   node server.js
   ```

2. **使用扩展**
   - 点击扩展图标
   - 测试服务器连接
   - 点击"开始选择元素"
   - 在网页上选择任意元素

3. **查看生成的文件**
   - 检查 `captured/` 目录
   - 每个元素会生成两个同名文件（.html 和 .md）

## 📊 文件管理 API

### 获取文件列表
```bash
curl http://localhost:3000/files
```

**响应示例**：
```json
{
  "success": true,
  "count": 3,
  "htmlFiles": 3,
  "markdownFiles": 3,
  "files": [
    {
      "baseName": "h1-2025-08-09T12-30-45-123Z",
      "html": {
        "name": "h1-2025-08-09T12-30-45-123Z.html",
        "size": 2048,
        "created": "2025-08-09T12:30:45.123Z",
        "exists": true
      },
      "markdown": {
        "name": "h1-2025-08-09T12-30-45-123Z.md",
        "size": 1024,
        "created": "2025-08-09T12:30:45.124Z",
        "exists": true
      }
    }
  ]
}
```

## 🔧 转换引擎

### 简单模式（默认）
使用内置的正则表达式进行快速转换，不依赖外部库。

### 高级模式（可选）
如果安装了 `jsdom`，会使用更精确的 DOM 解析：
```bash
npm install jsdom  # 可选
```

## 📝 应用场景

### 文档编写
- 快速提取网页内容到 Markdown
- 创建技术文档和教程
- 博客内容收集

### 内容分析
- 网页结构分析
- A/B 测试内容对比
- 设计元素收集

### 开发调试
- 前端组件文档化
- UI 样式参考
- 测试用例生成

## 🎨 自定义选项

### 修改转换规则
编辑 `server.js` 中的 `simpleHtmlToMarkdown` 函数来自定义转换逻辑。

### 文件命名模式
当前格式：`{tagName}-{timestamp}.{ext}`
可以修改 `receive-dom` 路由中的命名逻辑。

## 🐛 已知限制

1. **复杂表格**：复杂嵌套的表格可能转换不完美
2. **内联样式**：CSS 样式信息会丢失
3. **嵌套列表**：深层嵌套的列表可能格式不正确
4. **特殊字符**：某些特殊字符可能需要手动调整

## 🔄 更新记录

### v1.2 (2025-08-09)
- ✅ 新增 Markdown 文件自动生成
- ✅ 改进通知显示，显示生成的文件名
- ✅ 更新文件列表 API
- ✅ 增强错误处理

### v1.1 (2025-08-08)
- ✅ 自定义服务器配置
- ✅ 服务器在线状态检测

### v1.0 (2025-08-07)
- ✅ 基础 DOM 元素捕获功能

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests：
- 🐛 Bug 报告
- 💡 功能建议
- 🔧 转换规则改进
- 📚 文档完善

---

**DOM Catcher** - 让网页内容捕获变得简单高效！ 🚀
