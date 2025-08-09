# DOM Catcher - AI 编程助手指南

## 架构概览

DOM Catcher 是一个 Chrome 扩展 + Node.js 服务器系统，用于从网页中捕获 DOM 元素。系统包含三个核心组件：

1. **Chrome 扩展** (`manifest.json`, `popup.html/js`, `content.js`)
2. **Express 服务器** (`server.js`) - 处理 DOM 数据并生成 HTML/Markdown 文件  
3. **链接处理管道** - 将相对链接转换为绝对链接

## 关键组件与数据流

```
用户点击扩展 → popup.js 配置服务器 → 注入 content.js → 
选择 DOM 元素 → convertRelativeToAbsolute() → POST 到服务器 → 
服务器生成 HTML + Markdown 文件
```

### 核心文件：
- `content.js`: 核心 DOM 捕获逻辑，包含链接转换 (`convertRelativeToAbsolute()`)
- `popup.js`: 服务器配置界面，包含连接测试 (`DEFAULT_SERVER_URL`)
- `server.js`: Express 端点 `/receive-dom`, `/status`，双重 HTML/Markdown 生成

## 开发工作流程

**启动开发环境：**
```bash
npm install
npm start  # 或使用 npm run dev 进行自动重载
```

**Chrome 扩展加载：**
1. 打开 `chrome://extensions/`
2. 启用开发者模式
3. 从项目根目录加载解压的扩展程序

**测试流程：**
- 使用 `test-page.html` 测试相对链接转换功能
- 服务器默认在 `http://localhost:3000` 运行
- 检查 `captured/` 目录查看生成的文件

## 项目特有模式

### 语言和国际化
**重要：此项目不需要考虑国际化**
- 所有文本、界面、文档统一使用中文
- 无需添加多语言支持或本地化文件
- 删除了 `_locales` 目录和相关配置
- manifest.json 中无需 `default_locale` 设置

### 服务器配置模式
```javascript
// popup.js - 动态服务器 URL 注入
window.DOM_CATCHER_SERVER_URL = serverUrl;

// content.js - 回退到默认值
const SERVER_URL = window.DOM_CATCHER_SERVER_URL || 'http://localhost:3000';
```

### 链接转换算法
`content.js` 中的核心函数 `convertRelativeToAbsolute()`:
- 克隆 DOM 元素（非破坏性）
- 处理 `src`, `href`, `style[background]`, `srcset`, `data-*` 属性
- 智能过滤：跳过 `http://`, `data:`, `mailto:`, `#anchor` 等 URL
- 生成 `linkStats` 供界面显示

### 双重输出生成
服务器同时生成 HTML 和 Markdown 文件：
```javascript
// server.js 模式
const htmlFilename = `${baseFilename}.html`;
const markdownFilename = `${baseFilename}.md`;
await Promise.all([
  fs.writeFile(htmlFilepath, fullHtmlContent),
  fs.writeFile(markdownFilepath, markdownContent)
]);
```

### Chrome 扩展注入防护
```javascript
// content.js - 防止重复注入
if (!window.hasDOMCatcher) {
  window.hasDOMCatcher = true;
  // ... 扩展逻辑
}
```

## 集成点

- **CORS 配置**: 服务器使用 `cors()` 中间件，设置 `origin: '*'` 允许跨域请求
- **Chrome 权限**: manifest.json 中的 `activeTab`, `scripting`, `storage`
- **主机权限**: `http://localhost:*/`, `http://127.0.0.1:*/` 用于本地服务器访问

## 文件命名约定

生成的文件使用模式: `{tagName}-{timestamp}.{html|md}`
示例: `div-2025-01-09T10-30-45-123Z.html`

## 错误处理模式

内容脚本通过 `showNotification()` 函数向用户显示通知。
服务器验证输入并提供带状态码的详细错误响应。

## 关键依赖

- **express + cors**: 服务器框架，支持跨域
- **Chrome Extension Manifest V3**: 使用现代 `chrome.scripting` API
- **无外部 DOM 解析器**: 使用基于正则表达式的 HTML→Markdown 转换，提高可移植性

在修改此代码库时，请务必测试完整流程：扩展弹窗 → 内容注入 → 服务器处理 → 文件生成。
