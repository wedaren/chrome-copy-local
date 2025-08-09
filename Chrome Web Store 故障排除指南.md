# Chrome Web Store 发布故障排除快速指南

## 🚨 "Unable to publish" 错误解决方案

### 错误提示分析

当你看到 "Unable to publish" 错误时，Chrome Web Store 会显示具体需要完成的项目：

## 📧 邮箱相关问题

### 问题1: "You must provide a contact email"
**解决步骤**:
```
1. 登录 Chrome Web Store Developer Console
2. 点击右上角账户图标或设置
3. 选择 "Account" 标签页
4. 在 "Contact email" 字段输入有效邮箱
5. 点击 "Save" 保存
```

### 问题2: "You must verify your contact email"
**解决步骤**:
```
1. 在 Account 页面找到邮箱验证部分
2. 点击 "Send verification email" 或 "发送验证邮件"
3. 检查邮箱收件箱（包括垃圾邮件文件夹）
4. 点击验证邮件中的确认链接
5. 返回控制台确认状态显示为 "已验证"
```

**验证邮件没收到？**
- 等待5-10分钟后重新发送
- 检查垃圾邮件/促销邮件文件夹
- 确认邮箱地址拼写正确
- 使用与Google账户关联的邮箱

## 🔒 隐私政策相关问题

### 问题3: "You must certify that your data usage complies with our Developer Program Policies"
**解决步骤**:
```
1. 进入你的扩展编辑页面
2. 点击 "Privacy practices" 标签页
3. 按照以下指引填写：
```

**数据收集选择**:
- ✅ **Website content** （唯一勾选项）
- ❌ **其他所有选项都不勾选**

**认证声明** (全部勾选):
- ✅ I do not sell or transfer user data to third parties
- ✅ I do not use or transfer user data for purposes unrelated to single purpose  
- ✅ I do not use or transfer user data for creditworthiness or lending

**隐私政策URL**:
```
https://raw.githubusercontent.com/wedaren/chrome-copy-local/main/PRIVACY_POLICY.md
```

**远程代码**:
- 选择: ❌ No, I am not using Remote code

## 🛠 其他常见问题

### 问题4: 隐私政策链接无法访问
**检查步骤**:
1. 确认 PRIVACY_POLICY.md 文件已提交到 GitHub
2. 在浏览器中测试链接是否可访问
3. 检查文件路径是否正确
4. 确保仓库是公开的

### 问题5: 找不到 Privacy practices 标签
**解决方法**:
- 确保你在扩展的编辑页面（不是主控制台）
- 点击扩展名称进入详细页面
- 在顶部标签栏中找到 "Privacy practices"

### 问题6: 表单保存失败
**排查步骤**:
- 检查网络连接
- 确保所有必填字段已填写
- 刷新页面重新尝试
- 使用Chrome浏览器进行操作

## ⚡ 快速解决流程

### 5分钟解决方案

1. **设置邮箱** (1分钟)
   ```
   Account 标签 → Contact email → 输入邮箱 → Save
   ```

2. **验证邮箱** (2分钟)
   ```
   Send verification email → 检查邮箱 → 点击确认链接
   ```

3. **完成隐私认证** (2分钟)
   ```
   Privacy practices 标签 → 按指南填写 → Save
   ```

## 🔍 状态检查方法

### 确认所有步骤完成
在发布前检查以下状态：

**账户页面**:
- ✅ Contact email: your@email.com (Verified)

**Privacy practices 页面**:
- ✅ Data usage: Certified
- ✅ Privacy policy: URL provided

**扩展编辑页面**:
- ✅ 没有红色错误提示
- ✅ "Save Draft" 按钮可用
- ✅ "Submit for review" 按钮可用

## 📞 仍然有问题？

### 联系支持
如果按照以上步骤仍无法解决：

1. **Chrome Web Store 支持**
   - 访问 [Chrome Web Store 支持页面](https://support.google.com/chrome_webstore/)
   - 提交支持请求

2. **项目支持**
   - 在 GitHub Issues 中描述具体问题
   - 提供错误截图和详细描述

3. **常用资源**
   - `Chrome扩展自动化发布指南.md` - 完整发布流程
   - `数据使用表单填写指南.md` - 表单填写详解
   - `Chrome Web Store 数据使用声明.md` - 数据使用说明

---
*快速故障排除指南 - 最后更新: 2025-08-09*
