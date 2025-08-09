# Markdown 文件生成功能说明

## 功能概述

DOM Catcher 现在会在捕获 HTML 元素的同时，自动生成对应的 Markdown 文件。Markdown 文件只包含捕获的 DOM 内容，经过格式化处理，方便阅读和编辑。

## 文件生成规则

### 文件命名
- HTML 文件：`元素标签-时间戳.html`
- Markdown 文件：`元素标签-时间戳.md`
- 两个文件具有相同的基础文件名

### Markdown 内容规则

1. **纯内容导向**：只包含捕获的 DOM 元素内容，不包含捕获报告或元数据
2. **智能标题处理**：
   - 如果捕获的元素本身包含 `<h1>` 标题，则保持原有结构
   - 如果没有一级标题，则自动添加标题，优先级顺序：
     1. **网页标题**（`document.title`）
     2. **元素文本内容**（如果内容较短且合适）
     3. **网站域名**（从 URL 提取）
     4. **默认标题**："捕获的内容"

## HTML 到 Markdown 转换规则

### 标题转换
- `<h1>` → `# 标题`
- `<h2>` → `## 标题`
- `<h3>` → `### 标题`
- 以此类推到 `<h6>`

### 文本格式
- `<strong>`, `<b>` → `**粗体**`
- `<em>`, `<i>` → `*斜体*`
- `<code>` → `\`内联代码\``
- `<pre>` → 代码块

### 链接和图片
- `<a href="url">文本</a>` → `[文本](url)`
- `<img src="url" alt="描述">` → `![描述](url)`

### 列表
- `<ul><li>项目</li></ul>` → 无序列表
- `<ol><li>项目</li></ol>` → 有序列表

### 表格
- HTML 表格转换为 Markdown 表格格式
- 自动添加表头分隔符

### 引用
- `<blockquote>` → `> 引用内容`

### 段落和换行
- `<p>` → 段落（双换行分隔）
- `<br>` → 单换行

## 使用示例

### 示例 1：捕获带标题的内容
如果捕获的元素是：
```html
<article>
  <h1>Vue.js 教程</h1>
  <p>Vue.js 是一个渐进式 JavaScript 框架。</p>
</article>
```

生成的 Markdown：
```markdown
# Vue.js 教程

Vue.js 是一个渐进式 JavaScript 框架。
```

### 示例 2：捕获无标题的内容
如果捕获的元素是：
```html
<div class="content">
  <p>这是一个没有标题的段落内容。</p>
</div>
```

生成的 Markdown（假设页面标题是"前端开发指南"）：
```markdown
# 前端开发指南

这是一个没有标题的段落内容。
```

### 示例 3：复杂内容转换
如果捕获的元素是：
```html
<section>
  <h2>功能特性</h2>
  <ul>
    <li><strong>响应式</strong>：数据变化自动更新视图</li>
    <li><em>组件化</em>：可复用的UI组件</li>
  </ul>
  <p>更多信息请访问 <a href="https://vuejs.org">官网</a>。</p>
</section>
```

生成的 Markdown：
```markdown
# 页面标题（如果没有h1）

## 功能特性

- **响应式**：数据变化自动更新视图
- *组件化*：可复用的UI组件

更多信息请访问 [官网](https://vuejs.org)。
```

## 文件存储

所有生成的文件都保存在 `captured/` 目录中：
```
captured/
├── article-2025-01-09T10-30-45-123Z.html
├── article-2025-01-09T10-30-45-123Z.md
├── div-2025-01-09T10-31-20-456Z.html
├── div-2025-01-09T10-31-20-456Z.md
└── ...
```

## API 响应

成功捕获元素后，服务器返回：
```json
{
  "success": true,
  "message": "成功保存文件: article-2025-01-09T10-30-45-123Z.html 和 article-2025-01-09T10-30-45-123Z.md",
  "files": {
    "html": {
      "filename": "article-2025-01-09T10-30-45-123Z.html",
      "filepath": "/path/to/captured/article-2025-01-09T10-30-45-123Z.html"
    },
    "markdown": {
      "filename": "article-2025-01-09T10-30-45-123Z.md", 
      "filepath": "/path/to/captured/article-2025-01-09T10-30-45-123Z.md"
    }
  }
}
```

## 优势

1. **即时可读**：Markdown 格式便于直接阅读和编辑
2. **版本控制友好**：纯文本格式适合 Git 管理
3. **跨平台兼容**：可在任何支持 Markdown 的编辑器中打开
4. **内容提取**：自动去除 HTML 标签，保留结构化内容
5. **智能标题**：确保每个文档都有合适的标题

## 技术细节

- 使用正则表达式进行 HTML 到 Markdown 的转换
- 支持嵌套元素的递归处理
- 自动清理多余的空行和格式
- 保持原有的语义结构

---

*此功能从 v1.3 开始提供*
