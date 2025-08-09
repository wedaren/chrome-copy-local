# Chrome Web Store API 配置脚本

这个脚本帮助你快速获取 Chrome Web Store API 所需的认证信息。

## 使用方法

### 1. 安装依赖
```bash
npm install googleapis inquirer
```

### 2. 运行配置脚本
```bash
node scripts/setup-webstore-auth.js
```

### 3. 按照提示完成配置
脚本将引导你完成以下步骤：
1. 创建 Google Cloud 项目
2. 启用 Chrome Web Store API
3. 配置 OAuth2 凭据
4. 获取访问令牌

### 4. 保存配置到 GitHub Secrets
脚本完成后，将生成的信息添加到你的 GitHub 仓库 Secrets 中。

## 生成的文件

- `auth-config.json`: 包含认证配置（不要提交到版本控制）
- `.env.example`: 环境变量示例文件

## 安全提醒

⚠️ **重要**: 
- 不要将认证信息提交到版本控制系统
- 定期轮换访问令牌
- 仅在可信环境中运行此脚本
