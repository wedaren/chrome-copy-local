# Chrome Web Store 数据使用声明

## 🔍 数据收集分析

基于 DOM Catcher 扩展的实际代码分析，以下是准确的数据使用信息：

## 📋 用户数据收集选择

### ❌ 不收集的数据类型

- **Personally identifiable information** ❌ 不收集
  - 不收集姓名、地址、邮箱、年龄或身份证号等个人身份信息

- **Health information** ❌ 不收集
  - 不收集健康相关数据

- **Financial and payment information** ❌ 不收集
  - 不收集交易、信用卡或财务信息

- **Authentication information** ❌ 不收集
  - 不收集密码、凭据或安全问题

- **Personal communications** ❌ 不收集
  - 不收集邮件、短信或聊天记录

- **Location** ❌ 不收集
  - 不收集地理位置、IP地址或GPS坐标

- **Web history** ❌ 不收集
  - 不收集或存储用户的浏览历史

- **User activity** ❌ 不收集
  - 不进行网络监控、点击追踪或按键记录

### ✅ 收集的数据类型

- **Website content** ✅ 收集
  - **收集内容**: 用户主动选择的DOM元素的HTML结构和文本内容
  - **收集时机**: 仅在用户明确点击选择元素时
  - **存储位置**: 仅保存到用户本地计算机（localhost:3000）
  - **数据用途**: 为用户提供本地的网页元素备份和分析功能

## 📝 认证声明

### ✅ 必需的三项认证
- [x] **我不会向第三方出售或转移用户数据**（除批准的用例外）
- [x] **我不会将用户数据用于与扩展单一用途无关的目的**
- [x] **我不会使用用户数据进行信用评估或借贷用途**

## 🛡️ 隐私政策

由于 DOM Catcher 收集网站内容数据，需要提供隐私政策。

### 隐私政策内容

**DOM Catcher 扩展隐私政策**

**最后更新日期**: 2025年8月9日

**1. 数据收集**
- DOM Catcher 仅收集用户主动选择的网页DOM元素内容
- 收集的数据包括：选中元素的HTML结构、文本内容、标签名、CSS类名和ID
- 不收集任何个人身份信息、浏览历史或用户行为数据

**2. 数据使用**
- 收集的数据仅用于在用户本地计算机上保存和管理选中的网页元素
- 数据用于帮助开发者和设计师进行网页元素分析和备份

**3. 数据存储**
- 所有数据仅保存在用户的本地计算机上（通过localhost:3000端口）
- 不会将任何数据发送到外部服务器或第三方服务
- 用户完全控制本地存储的数据

**4. 数据共享**
- 不会与任何第三方共享用户数据
- 不会出售用户数据
- 数据不会离开用户的本地环境

**5. 用户权利**
- 用户可以随时删除本地保存的数据文件
- 用户可以卸载扩展以停止数据收集
- 用户完全控制何时激活扩展功能

**6. 安全措施**
- 所有数据处理都在用户本地进行
- 不涉及网络传输到外部服务器
- 遵循最小数据收集原则

**7. 联系方式**
- 如有隐私相关问题，请通过 GitHub Issues 联系：https://github.com/wedaren/chrome-copy-local/issues

---

### 🔗 建议的隐私政策托管

可以选择以下方式之一托管隐私政策：

1. **GitHub Pages（推荐）**
   - 创建 `privacy-policy.md` 文件
   - 启用 GitHub Pages
   - URL: `https://wedaren.github.io/chrome-copy-local/privacy-policy`

2. **GitHub Raw链接**
   - URL: `https://raw.githubusercontent.com/wedaren/chrome-copy-local/main/PRIVACY_POLICY.md`

3. **GitHub仓库页面**
   - 在README中添加隐私政策部分
   - URL: `https://github.com/wedaren/chrome-copy-local#privacy-policy`

## 📋 表单填写指南

### 数据收集选择
只勾选：**Website content** ✅

### 认证声明
全部勾选：
- [x] I do not sell or transfer user data to third parties
- [x] I do not use or transfer user data for purposes unrelated to single purpose  
- [x] I do not use or transfer user data for creditworthiness or lending

### 隐私政策URL
填写你选择的隐私政策托管地址（见上方建议）

## ⚠️ 重要说明

1. **数据最小化**: DOM Catcher 遵循数据最小化原则，只收集必要的网站内容
2. **用户控制**: 用户完全控制何时收集数据，数据存储在本地
3. **透明度**: 所有数据处理过程对用户可见和可控
4. **安全性**: 不涉及外部数据传输，保护用户隐私

这个声明完全符合 Chrome Web Store 的政策要求，并准确反映了扩展的实际数据使用情况。
