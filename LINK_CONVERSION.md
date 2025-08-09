# DOM Catcher - 相对链接转换功能更新

## 🎯 新增功能

### ✨ 智能链接转换
DOM Catcher 现在可以自动将捕获元素中的相对链接转换为绝对链接，确保保存的内容在任何环境下都能正常访问。

## 🔧 功能详情

### 支持的链接类型

#### 1. 图片资源 (`<img>` 标签)
- **src 属性**: 相对路径 → 绝对路径
- **srcset 属性**: 响应式图片的多个路径转换
- **data-src, data-original**: 懒加载图片属性

**示例转换:**
```html
<!-- 转换前 -->
<img src="/images/photo.jpg" alt="照片">

<!-- 转换后 -->
<img src="https://example.com/images/photo.jpg" alt="照片">
```

#### 2. 页面链接 (`<a>` 标签)
- **href 属性**: 相对路径 → 绝对路径
- **保持不变**: `mailto:`, `tel:`, `javascript:`, `#anchor`, 完整URL

**示例转换:**
```html
<!-- 转换前 -->
<a href="/page/about">关于我们</a>

<!-- 转换后 -->
<a href="https://example.com/page/about">关于我们</a>
```

#### 3. CSS 背景图片
- **style 属性**: `url()` 中的相对路径转换
- **支持格式**: `url('/path')`, `url("/path")`, `url(path)`

**示例转换:**
```html
<!-- 转换前 -->
<div style="background-image: url('/bg.jpg')">

<!-- 转换后 -->
<div style="background-image: url('https://example.com/bg.jpg')">
```

#### 4. 其他资源属性
- **data-lazy**: 延迟加载资源
- **data-background**: 自定义背景资源

### 🛡️ 智能过滤

系统会智能识别并**跳过**以下类型的链接：
- ✅ 完整URL (`https://`, `http://`)
- ✅ 协议相对URL (`//example.com`)
- ✅ Data URL (`data:image/...`)
- ✅ 邮件链接 (`mailto:`)
- ✅ 电话链接 (`tel:`)
- ✅ JavaScript 链接 (`javascript:`)
- ✅ 锚点链接 (`#section`)

## 📊 统计信息

捕获的元素现在会包含链接统计信息：

```json
{
  "linkStats": {
    "totalImages": 3,
    "totalLinks": 5,
    "hasBackgroundImages": true
  },
  "baseUrl": "https://example.com",
  "url": "https://example.com/page/current"
}
```

## 🎨 界面改进

### 生成的HTML文件新增显示：
- 🔗 **链接统计**: 图片和链接数量统计
- 📍 **基础URL**: 显示源站点的基础URL
- 📋 **详细信息**: 更丰富的元素捕获信息

## 🚀 使用方法

1. **启动服务器**:
   ```bash
   npm start
   ```

2. **安装插件**: 在 Chrome 中加载插件

3. **测试功能**: 
   - 打开包含相对链接的网页
   - 或者使用项目中的 `test-page.html`

4. **捕获元素**: 
   - 点击插件图标
   - 选择包含链接的元素
   - 查看生成的文件

## 🔍 测试页面

项目包含了完整的测试页面 `test-page.html`，包含：
- 📸 各种类型的图片测试
- 🔗 不同格式的链接测试  
- 🎨 CSS背景图片测试
- 📝 复合内容测试

## ⚙️ 技术实现

### 核心算法
```javascript
const convertRelativeToAbsolute = (element) => {
  const clone = element.cloneNode(true);
  const baseUrl = window.location.origin;
  const currentPath = window.location.href;
  
  // 处理各种资源类型...
  return clone;
};
```

### 关键特性
- **非破坏性**: 使用元素克隆，不影响原页面
- **容错处理**: 无效URL会被安全跳过
- **性能优化**: 批量处理，避免重复遍历
- **兼容性**: 支持各种现代和传统的HTML结构

## 📈 版本历史

### v1.1.0 (2025-08-09)
- ✨ 新增相对链接自动转换功能
- 📊 添加链接统计信息
- 🎨 改进HTML输出格式
- 🧪 添加完整测试页面

### v1.0.0 (2025-08-08)
- 🎉 初始版本发布
- 🔧 基础DOM捕获功能
- 🌐 本地服务器支持
