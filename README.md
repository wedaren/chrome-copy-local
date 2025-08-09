# DOM Catcher - Chrome插件 + 自定义服务器

一个强大的工具，允许你在任何网页上一键选择DOM元素，并自动发送到自定义服务器进行保存。

## 🎯 功能特性

- **一键选择**: 点击插件图标，即可进入元素选择模式
- **可视化高亮**: 鼠标悬停时实时高亮显示元素  
- **完整保存**: 保存选中元素的完整HTML结构和元信息
- **自定义服务器**: 支持配置任意HTTP/HTTPS服务器地址
- **服务器检测**: 自动检测服务器在线状态
- **本地存储**: 默认本地服务器，确保隐私安全
- **友好界面**: 美观的通知提示和保存的HTML文件界面

## 🤖 AI 代码辅助

本项目集成了 **Gemini Code Assist** 智能代码审查功能：

- **🔍 自动代码审查**: PR 创建时自动进行代码质量检查
- **📝 智能摘要**: 自动生成代码变更摘要和影响分析  
- **🇨🇳 中文支持**: 使用中文进行代码审查和建议
- **🛡️ 安全检查**: 专注 Chrome 插件安全性和最佳实践
- **📋 风格检查**: 确保代码符合项目编码规范

> 详细配置和使用说明请参考 [GEMINI-ASSIST.md](GEMINI-ASSIST.md)

## ✨ v1.1 新功能

- **🔧 自定义服务器配置**: 在扩展弹窗中配置任意服务器地址
- **🔍 服务器状态检测**: 实时显示服务器连接状态
- **⚡ 智能连接测试**: 自动和手动测试服务器连接
- **💾 配置记忆**: 自动保存服务器配置
- **🛡️ 错误处理**: 详细的连接错误信息提示

## 📦 项目结构

```
chrome-copy-local/
├── manifest.json          # Chrome插件配置文件
├── popup.html             # 插件弹出界面
├── popup.js              # 弹出界面逻辑
├── content.js            # 内容脚本(核心功能)
├── server.js             # Node.js本地服务器
├── package.json          # Node.js项目配置
├── README.md             # 项目说明文档
├── GEMINI-ASSIST.md      # Gemini Code Assist 使用说明
├── .gemini/              # Gemini AI 配置目录
│   ├── config.yaml       # Gemini 审查配置
│   └── styleguide.md     # 项目编码风格指南
└── captured/             # 保存捕获元素的目录(自动创建)
```

## 🚀 快速开始

### 1. 安装本地服务器依赖

```bash
# 进入项目目录
cd chrome-copy-local

# 安装依赖
npm install

# 启动服务器
npm start
```

服务器启动后，你会看到：
```
🚀 DOM Catcher 本地服务已启动！

📡 服务地址: http://localhost:3000
📁 保存目录: /path/to/captured
🔍 状态检查: http://localhost:3000/status
📋 文件列表: http://localhost:3000/files
```

### 2. 安装Chrome插件

1. 打开Chrome浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择本项目目录 `chrome-copy-local`
6. 插件安装成功！

### 3. 使用插件

1. **启动服务器**: 确保目标服务器正在运行
2. **配置服务器**: 
   - 点击Chrome工具栏中的"DOM Catcher"图标
   - 在"服务器地址"输入框中输入服务器地址（默认: http://localhost:3000）
   - 点击"测试连接"确保服务器在线
3. **访问网页**: 打开任意你想要捕获元素的网页  
4. **开始选择**: 在弹出窗口中点击"开始选择元素"
5. **选择元素**: 鼠标悬停查看高亮，点击选择目标元素
6. **查看结果**: 元素会自动发送到配置的服务器

## 📋 API接口

### POST /receive-dom
接收捕获的DOM元素数据

**请求体:**
```json
{
  "html": "<div>元素的完整HTML</div>",
  "info": {
    "tagName": "div",
    "className": "example-class",
    "id": "example-id",
    "textContent": "元素文本内容...",
    "url": "https://example.com",
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

### GET /status
检查服务器状态

### GET /files
获取已捕获的文件列表

## 🛠 开发模式

使用nodemon进行开发，文件修改时自动重启：

```bash
npm run dev
```

## 📁 保存的文件格式

每个捕获的元素都会保存为一个完整的HTML文件，包含：

- **元素信息面板**: 显示标签名、ID、Class、文本内容等
- **来源信息**: 捕获时的URL和时间戳
- **原始HTML**: 完整的元素HTML结构

文件命名格式: `{tagName}-{timestamp}.html`

## 🔧 自定义配置

### 服务器配置示例

- **本地开发**: `http://localhost:3000`
- **远程服务器**: `https://your-domain.com:8080`
- **局域网服务**: `http://192.168.1.100:3000`

### 自定义服务器要求

你的服务器需要提供以下端点：

1. **状态检查** - `GET /status`: 返回服务器状态信息
2. **接收数据** - `POST /receive-dom`: 接收DOM元素数据

服务器需要支持CORS跨域请求。

### 修改默认服务器端口

编辑 `server.js` 文件中的 `port` 变量：

```javascript
const port = 3000; // 改为你想要的端口
```

### 修改保存目录

编辑 `server.js` 文件中的 `outputDir` 路径：

```javascript
const outputDir = path.join(__dirname, 'captured'); // 修改保存路径
```

## 🔒 安全说明

- 所有数据都保存在本地，不会上传到任何服务器
- 插件只在用户主动点击时才激活
- 本地服务器只监听localhost，外部无法访问
- 支持CORS以允许浏览器跨域请求

## 🐛 故障排除

### 问题: 插件提示"连接失败"

**解决方案:**
1. 检查服务器地址是否正确（包含 http:// 或 https://）
2. 确认目标服务器正在运行
3. 点击"测试连接"按钮验证连接状态
4. 检查防火墙设置

### 问题: 服务器在线但无法发送数据

**解决方案:**
1. 确认服务器支持 CORS 跨域请求
2. 检查服务器是否提供 `/receive-dom` 端点
3. 查看浏览器控制台的网络请求错误信息

### 问题: HTTPS页面无法连接HTTP服务器

**解决方案:**
1. 浏览器安全限制：HTTPS 页面只能连接 HTTPS 服务器
2. 使用 HTTPS 服务器或在 HTTP 页面上测试

### 问题: 插件无法注入到某些网页

**解决方案:**
1. 某些网页有严格的CSP策略，可能阻止脚本注入
2. 尝试在其他网页上使用
3. 检查浏览器控制台是否有错误信息

### 问题: 选择模式无法退出

**解决方案:**
1. 按 `ESC` 键退出选择模式
2. 刷新页面也可以清除选择状态

## 🤝 贡献

欢迎提交Issues和Pull Requests来改进这个项目！

## 📄 许可证

MIT License - 详见LICENSE文件
