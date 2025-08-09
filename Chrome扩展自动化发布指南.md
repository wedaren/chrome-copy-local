# Chrome 扩展自动化发布指南

## 概述

本指南将帮助你通过 GitHub Actions 自动化发布 Chrome 扩展到 Chrome Web Store。

## 前置条件

### 1. Chrome Web Store 开发者账户
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 使用你的 Google 账户登录
3. 支付一次性注册费用（5美元）
4. 完成开发者资料设置

### 1.5. 完成账户配置（重要！）
在开始发布流程之前，必须先完成以下账户配置：

#### 📧 设置联系邮箱
1. 在开发者控制台主页，点击右上角账户设置
2. 转到 **"Account"** 标签页
3. 输入有效的联系邮箱地址
4. 点击保存

#### ✅ 验证联系邮箱
1. 在 Account 页面点击 **"Send verification email"**
2. 检查邮箱（包括垃圾邮件文件夹）
3. 点击验证邮件中的确认链接
4. 确认验证状态显示为已验证

> ⚠️ **重要提醒**: 如果没有完成邮箱设置和验证，将无法发布扩展。详细步骤请参考：`发布前必须完成的步骤.md`

### 2. 获取 Chrome Web Store API 密钥

#### 步骤 1: 创建 Google Cloud 项目
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建一个新项目或选择现有项目
3. 记下你的项目 ID
4. Project number: 232544749349 Project ID: dom-catcher

#### 步骤 2: 启用 Chrome Web Store API
1. 在 Google Cloud Console 中，转到"API 和服务" → "库"
2. 搜索"Chrome Web Store API"
3. 点击启用

#### 步骤 3: 创建服务账户
1. 转到"API 和服务" → "凭据"
2. 点击"创建凭据" → "服务账户"
3. 填写服务账户详情：
   - 名称: `chrome-webstore-publisher`
   - 说明: `用于自动发布Chrome扩展`
4. 点击"创建并继续"
5. 分配角色：选择"编辑者"或创建自定义角色
6. 点击"完成"

#### 步骤 4: 生成密钥文件
1. 在凭据页面，找到刚创建的服务账户
2. 点击服务账户邮箱
3. 转到"密钥"选项卡
4. 点击"添加密钥" → "创建新密钥"
5. 选择"JSON"格式
6. 下载密钥文件（保存为 `credentials.json`）

#### 步骤 5: 获取刷新令牌
由于 Chrome Web Store API 需要 OAuth2 认证，你需要获取刷新令牌：

1. 安装 Google 的 OAuth2 工具：
```bash
npm install -g google-auth-cli
```

2. 运行认证流程：
```bash
google-auth-cli --scope=https://www.googleapis.com/auth/chromewebstore
```

3. 按照提示完成认证，获取刷新令牌

### 3. 首次手动发布扩展

在设置自动化之前，需要先手动发布一次：

1. 打包你的扩展：
   - 在 Chrome 中打开 `chrome://extensions/`
   - 开启开发者模式
   - 点击"打包扩展程序"
   - 选择你的扩展目录
   - 生成 `.crx` 文件和 `.pem` 私钥文件（保存好私钥！）

2. 上传到 Chrome Web Store：
   - 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - 点击"添加新项"
   - 上传打包好的 `.zip` 文件（包含所有源文件）
   - 填写扩展详情（名称、描述、截图等）
   - 提交审核

3. 记录扩展 ID：
   - 发布后，从 URL 中获取你的扩展 ID（形如：`abcdefghijklmnopqrstuvwxyz123456`）

### 3.5. 完成发布前检查
在获得扩展 ID 后，必须完成以下步骤才能正式发布：

#### 🔒 完成隐私政策认证
1. 进入扩展编辑页面
2. 点击 **"Privacy practices"** 标签页
3. 填写数据使用信息（参考已提供的指南）
4. 填写隐私政策URL: `https://raw.githubusercontent.com/wedaren/chrome-copy-local/main/PRIVACY_POLICY.md`
5. 勾选所有必需的认证声明
6. 点击保存

> 📋 **检查清单**: 确保联系邮箱已设置并验证，隐私政策已完成认证，否则无法提交发布。

### 4. 填写扩展详细信息

首次发布时，需要在 Chrome Web Store 开发者控制台填写详细的扩展信息：

#### 隐私政策相关信息
Chrome Web Store 要求所有扩展提供以下信息以符合开发者政策：

**🎯 单一用途描述**
```
DOM Catcher 是一个网页元素捕获工具，专门用于帮助开发者和设计师快速选择并提取网页中的 DOM 元素。用户可以通过点击扩展图标，进入元素选择模式，然后通过鼠标悬停高亮和点击操作来选择目标元素，选中的元素将被完整保存到本地服务器。该扩展的唯一目的是简化网页元素的捕获和本地存储过程。
```

**🔐 权限说明**
- **activeTab**: 用于访问当前标签页，注入元素选择脚本，仅在用户主动点击扩展时激活
- **scripting**: 用于向网页注入内容脚本，实现元素选择和高亮功能
- **localhost权限**: 用于连接本地服务器保存数据，确保数据不离开用户设备

**📝 远程代码使用**
选择 "No, I am not using Remote code"，因为所有代码都包含在扩展包内。

**🔒 数据使用声明**
需要准确填写数据收集信息：
- **唯一勾选**：Website content（因为扩展收集用户选择的DOM元素内容）
- **不勾选**：其他所有数据类型（个人信息、位置、浏览历史等）
- **全部勾选**：三项认证声明（不出售数据、不用于无关目的、不用于信贷）
- **隐私政策**：提供隐私政策URL（已创建PRIVACY_POLICY.md）

> 📄 完整的表单填写内容请参考：`Chrome Web Store 发布信息.md` 和 `数据使用表单填写指南.md`

#### 其他必需信息
- **扩展描述**: 详细说明扩展功能和使用方法
- **图标**: 准备 16x16, 48x48, 128x128 像素的图标
- **截图**: 提供 1-5 张扩展使用截图
- **隐私政策**: 如果收集数据需提供隐私政策链接
- **分类**: 选择合适的扩展分类（如：开发者工具）

## GitHub Actions 配置

### 1. 设置 GitHub Secrets

在你的 GitHub 仓库中，转到 Settings → Secrets and variables → Actions，添加以下 secrets：

| Secret 名称 | 描述 | 示例值 |
|------------|------|--------|
| `GOOGLE_CLIENT_ID` | OAuth2 客户端 ID | `123456789-abc.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | OAuth2 客户端密钥 | `GOCSPX-abcdefghijk` |
| `GOOGLE_REFRESH_TOKEN` | OAuth2 刷新令牌 | `1//04abcdefghijk...` |
| `EXTENSION_ID` | Chrome 扩展 ID | `abcdefghijklmnopqrstuvwxyz123456` |

### 2. 创建 GitHub Actions 工作流

工作流文件已自动创建在 `.github/workflows/release.yml`

### 3. 准备发布

#### 自动发布（推荐）
当你推送新的版本标签时，会自动触发发布：

```bash
# 更新 manifest.json 中的版本号
# 提交更改
git add .
git commit -m "bump version to 1.1.0"

# 创建并推送标签
git tag v1.1.0
git push origin v1.1.0
```

#### 手动发布
你也可以在 GitHub Actions 页面手动触发工作流。

## 版本管理

### 自动版本更新

为了简化版本管理，建议在发布前自动更新版本号：

1. 安装版本管理工具：
```bash
npm install --save-dev standard-version
```

2. 添加 npm 脚本到 `package.json`：
```json
{
  "scripts": {
    "release": "standard-version && git push --follow-tags origin main"
  }
}
```

3. 使用命令发布新版本：
```bash
npm run release
```

### 手动版本更新

1. 更新 `manifest.json` 中的版本号
2. 更新 `package.json` 中的版本号（如果有）
3. 提交更改并创建标签

## 最佳实践

### 1. 版本号规范
遵循语义化版本控制：
- `MAJOR.MINOR.PATCH` (如：1.0.0, 1.1.0, 1.1.1)
- 主版本号：不兼容的 API 修改
- 次版本号：向下兼容的功能性新增
- 修订号：向下兼容的问题修正

### 2. 发布检查清单
- [ ] 测试扩展功能
- [ ] 更新版本号
- [ ] 更新更新日志
- [ ] 检查权限配置
- [ ] 验证图标和截图
- [ ] 运行自动化测试

### 3. 安全考虑
- 不要在代码中包含 API 密钥
- 定期轮换访问令牌
- 使用最小权限原则
- 审查第三方依赖

### 4. 监控和维护
- 监控发布状态
- 关注用户反馈
- 定期更新依赖
- 备份私钥文件

## 常见问题

### Q: 发布失败，显示权限错误
A: 检查以下项目：
- 确保服务账户有正确的权限
- 验证扩展 ID 是否正确
- 确认你是扩展的所有者

### Q: API 调用超时
A: 可能的原因：
- 网络连接问题
- Google API 服务异常
- 请求频率过高

### Q: 扩展在商店中显示"待审核"
A: Chrome Web Store 的审核过程通常需要：
- 新扩展：1-3 个工作日
- 更新版本：几小时到1天
- 涉及新权限：可能需要更长时间

### Q: 如何处理审核被拒绝？
A: 
1. 查看拒绝原因
2. 修复相关问题
3. 重新提交审核
4. 如有疑问，联系 Chrome Web Store 支持

### Q: 首次发布需要注意什么？
A: 首次发布通常审核更严格，需要：
- 详细填写扩展用途和权限说明
- 提供清晰的使用截图和描述
- 确保扩展功能与描述完全一致
- 遵循所有 Chrome Web Store 政策

### Q: 如何提高审核通过率？
A: 
1. **准确填写表单信息**：使用提供的标准化描述
2. **权限最小化**：只请求必需的权限
3. **功能单一化**：确保扩展有明确的单一用途  
4. **本地化处理**：强调数据本地存储，不涉及外部服务
5. **开源透明**：在描述中提及代码开源可查看

### Q: 提示"Unable to publish"怎么办？
A: Chrome Web Store 可能显示以下必须完成的步骤：

**📧 联系邮箱问题**：
- 在 Account 标签页设置联系邮箱
- 发送并点击验证邮件确认邮箱

**🔒 隐私政策问题**：
- 在 Privacy practices 标签页完成数据使用认证
- 填写隐私政策URL并勾选所有认证声明

**📋 信息不完整**：
- 检查所有必填字段是否完成
- 确保扩展描述、截图等信息完整

> 📄 **详细解决步骤**：查看 `发布前必须完成的步骤.md` 获取完整指引

## 审核时间预期

- **首次发布**: 通常需要 2-7 个工作日
- **更新版本**: 几小时到 2 个工作日
- **权限变更**: 可能需要更长审核时间
- **节假日期间**: 审核时间可能延长

## 提交前检查清单

### � 账户配置检查
- [ ] Chrome Web Store 开发者账户已注册
- [ ] 联系邮箱已设置并保存
- [ ] 邮箱验证已完成（检查邮件并点击确认链接）
- [ ] 开发者控制台没有红色警告提示

### �📋 技术检查
- [ ] manifest.json 格式正确
- [ ] 所有文件路径有效
- [ ] 扩展在不同网站上正常工作
- [ ] 没有控制台错误
- [ ] 权限使用恰当

### 📝 信息检查  
- [ ] 扩展名称和描述准确
- [ ] 版本号符合规范
- [ ] 权限说明详细完整
- [ ] 截图清晰展示功能
- [ ] 分类选择合适

### 🔐 政策合规
- [ ] 遵循单一用途原则
- [ ] 隐私政策完备（PRIVACY_POLICY.md已创建）
- [ ] 隐私政策URL可正常访问
- [ ] Privacy practices 标签页已完成认证
- [ ] 数据使用信息已正确填写
- [ ] 三项认证声明已全部勾选
- [ ] 不使用误导性描述
- [ ] 符合内容政策要求

## 参考链接

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Chrome Web Store API Reference](https://developer.chrome.com/docs/webstore/api/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)

## 更新日志

- **2025-08-08**: 初始版本，包含完整的自动化发布配置
- 支持基于 Git 标签的自动版本检测
- 包含详细的前置条件和配置说明
- 添加最佳实践和故障排除指南
