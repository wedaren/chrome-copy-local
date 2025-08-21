# 🔗 Tailscale 部署配置指南

## 📋 概述

此配置将 GitHub Actions CI/CD 与 Tailscale 网络集成，允许通过 Tailscale 虚拟专用网络安全地部署到您的服务器。

## 🔧 Tailscale 设置

### 1. 在 Tailscale 控制台创建 OAuth 客户端

1. 访问 [Tailscale Admin Console](https://login.tailscale.com/admin/settings/oauth)
2. 点击 "Generate OAuth client"
3. 设置以下权限：
   - **Description**: `GitHub Actions CI/CD`
   - **Tags**: `tag:ci`
   - **Device authorization**: 选择适当的授权范围

### 2. 配置 GitHub Secrets

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加以下密钥：

#### Tailscale 配置
| 密钥名称 | 描述 | 获取方式 |
|---------|------|---------|
| `TAILSCALE_OAUTH_CLIENT_ID` | OAuth 客户端 ID | Tailscale 控制台获取 |
| `TAILSCALE_OAUTH_SECRET` | OAuth 客户端密钥 | Tailscale 控制台获取 |

#### 服务器配置
| 密钥名称 | 描述 | 示例值 |
|---------|------|-------|
| `SERVER_HOST` | 服务器 Tailscale IP | `100.64.x.x` 或机器名 |
| `SERVER_USER` | SSH 用户名 | `ubuntu` |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH 端口（可选） | `22` |

### 3. 服务器端 Tailscale 配置

在您的目标服务器上安装和配置 Tailscale：

```bash
# 安装 Tailscale（Ubuntu/Debian）
curl -fsSL https://tailscale.com/install.sh | sh

# 启动并加入网络
sudo tailscale up

# 检查状态
tailscale status

# 获取服务器的 Tailscale IP
tailscale ip -4
```

### 4. ACL 配置（可选但推荐）

在 Tailscale 控制台的 [Access Controls](https://login.tailscale.com/admin/acls) 中配置：

```json
{
  "tagOwners": {
    "tag:ci": ["your-email@example.com"]
  },
  "acls": [
    {
      "action": "accept",
      "src": ["tag:ci"],
      "dst": ["your-server:22", "your-server:3000"]
    }
  ]
}
```

## 🚀 部署工作流程

### 自动化流程

1. **代码推送** → 触发 GitHub Actions
2. **连接 Tailscale** → 建立安全的网络连接
3. **验证连接** → 确认可以访问目标服务器
4. **SSH 部署** → 通过 Tailscale 网络连接服务器
5. **部署应用** → 更新 Docker 容器
6. **健康检查** → 验证部署成功

### 网络架构

```
GitHub Actions Runner
        ↓ (Tailscale OAuth)
Tailscale Network (100.64.x.x/10)
        ↓ (SSH over Tailscale)
Your Server (100.64.x.x)
        ↓ (Docker)
DOM Catcher Application (localhost:3000)
```

## 🔍 故障排除

### 常见问题

1. **Tailscale 连接失败**
   ```bash
   # 检查 OAuth 配置
   echo "检查 TAILSCALE_OAUTH_CLIENT_ID 和 TAILSCALE_OAUTH_SECRET"
   
   # 在 Actions 日志中查看
   tailscale status
   ```

2. **服务器无法访问**
   ```bash
   # 确认服务器在线
   tailscale status | grep your-server
   
   # 检查服务器 Tailscale IP
   tailscale ip -4
   ```

3. **SSH 连接问题**
   ```bash
   # 确认 SSH 密钥配置正确
   # 检查服务器防火墙设置
   sudo ufw status
   ```

### 调试步骤

1. **检查 Tailscale 网络状态**
   ```bash
   tailscale status
   tailscale ping your-server
   ```

2. **验证 SSH 连接**
   ```bash
   ssh -i your-private-key user@100.64.x.x
   ```

3. **检查 Docker 服务**
   ```bash
   docker ps
   curl http://localhost:3000/status
   ```

## 🔐 安全优势

### Tailscale 网络的安全特性

1. **点对点加密**: 所有流量都经过 WireGuard 加密
2. **零信任网络**: 默认拒绝所有连接，明确允许所需连接
3. **身份验证**: 基于您的身份提供商（Google、GitHub等）
4. **审计日志**: 完整的连接和访问日志
5. **网络隔离**: CI/CD 流量与其他网络流量隔离

### 最佳实践

1. **限制 CI 标签权限**: 只授予必要的网络访问权限
2. **定期轮换密钥**: 定期更新 OAuth 客户端密钥
3. **监控连接**: 定期检查 Tailscale 审计日志
4. **最小权限原则**: 只开放必需的端口和服务

## 📊 监控和维护

### 连接监控

```bash
# 检查 Tailscale 网络健康
tailscale status --json | jq '.Health'

# 监控连接延迟
tailscale ping your-server

# 查看网络统计
tailscale netcheck
```

### 定期维护

1. **更新 Tailscale 客户端**
   ```bash
   sudo tailscale update
   ```

2. **检查 ACL 配置**
   - 定期审查访问控制列表
   - 移除不再需要的权限

3. **监控使用情况**
   - 在 Tailscale 控制台查看网络使用统计
   - 监控异常连接模式

## 🎯 高级配置

### 自定义域名（可选）

如果您配置了 Tailscale MagicDNS：

```yaml
# 在 GitHub Secrets 中设置
SERVER_HOST: your-server.your-tailnet.ts.net
```

### 多环境部署

```yaml
# 不同环境使用不同的 Tailscale 标签
tags: tag:ci-production  # 生产环境
tags: tag:ci-staging     # 测试环境
```

---

🔗 **通过 Tailscale 网络，您的 CI/CD 部署将更加安全、可靠和易于管理！**
