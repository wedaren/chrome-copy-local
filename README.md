# DOM Catcher - Chrome插件 + 本地服务器

一个强大的工具，允许你在任何网页上一键选择DOM元素，并自动保存到本地文件系统。

## 🎯 功能特性

- **一键选择**: 点击插件图标，即可进入元素选择模式
- **可视化高亮**: 鼠标悬停时实时高亮显示元素
- **完整保存**: 保存选中元素的完整HTML结构和元信息
- **本地存储**: 所有数据保存在本地，确保隐私安全
- **友好界面**: 美观的通知提示和保存的HTML文件界面

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

1. **启动服务器**: 确保本地服务器正在运行 (`npm start`)
2. **访问网页**: 打开任意你想要捕获元素的网页
3. **激活插件**: 点击Chrome工具栏中的"DOM Catcher"图标
4. **开始选择**: 在弹出窗口中点击"开始选择元素"
5. **选择元素**: 鼠标悬停查看高亮，点击选择目标元素
6. **查看结果**: 元素会自动保存到 `captured/` 目录

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

### 修改服务器端口

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

### 问题: 插件提示"无法连接到本地服务"

**解决方案:**
1. 确认本地服务器正在运行 (`npm start`)
2. 检查端口3000是否被占用
3. 确认防火墙没有阻止本地连接

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

## 🚀 自动化发布

本项目已配置完整的 GitHub Actions 自动化发布流程，支持一键发布到 Chrome Web Store。

### 📦 发布功能
- **自动构建**: 推送版本标签时自动构建扩展包
- **自动上传**: 自动上传到 Chrome Web Store 并发布
- **版本管理**: 自动创建 GitHub Release
- **错误处理**: 完整的错误提示和故障排除

### 🛠 发布工具
- **[Chrome扩展自动化发布指南.md](Chrome扩展自动化发布指南.md)**: 完整的配置和使用指南
- **[scripts/](scripts/)**: 本地发布脚本和认证配置工具
- **[自定义服务器功能说明.md](自定义服务器功能说明.md)**: 扩展功能详细说明

### ⚡ 快速发布

```bash
# 1. 首次配置（仅需一次）
node scripts/setup-webstore-auth.js

# 2. 完成 Chrome Web Store 账户配置
# - 设置并验证联系邮箱
# - 完成隐私政策认证
# 详见：发布前必须完成的步骤.md

# 3. 本地测试构建
./scripts/test-build.sh

# 4. 快速发布新版本
./scripts/release.sh 1.1.0

# 5. 推送标签触发自动发布
git tag v1.1.0 && git push origin v1.1.0
```

### ⚠️ 发布前必读
如果遇到 "Unable to publish" 错误，请查看：
- **发布前必须完成的步骤.md** - 解决发布阻塞问题
- **Chrome Web Store 故障排除指南.md** - 快速故障排除

### 📋 配置要求
需要在 GitHub 仓库设置中添加以下 Secrets：
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET` 
- `GOOGLE_REFRESH_TOKEN`
- `EXTENSION_ID`

详细配置步骤请参考 **Chrome扩展自动化发布指南.md**。
