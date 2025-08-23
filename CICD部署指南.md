# 🚀 CI/CD 部署快速指南

## 📋 概述

此分支 `cicd-docker-deploy` 添加了完整的 Docker 容器化和 GitHub Actions CI/CD 支持，可以自动部署到您的服务器。

## 🎯 新增功能

### 📦 Docker 化
- **Dockerfile**: 基于 Node.js 18 Alpine 的轻量镜像
- **docker-compose.yml**: 本地开发环境支持
- **健康检查**: 内置服务健康监控
- **多环境支持**: 开发和生产环境配置

### 🔄 CI/CD 流程
- **自动测试**: 代码推送时自动运行测试
- **镜像构建**: 自动构建并推送到 GitHub Container Registry
- **自动部署**: 推送到 main 分支时自动部署到服务器
- **健康检查**: 部署后自动验证服务状态

### 🛠️ 工具脚本
- **start.sh**: 快速启动脚本，支持多种模式
- **deploy.sh**: 服务器部署脚本
- **healthcheck.sh**: 容器健康检查脚本

## 🚀 快速开始

### 1. 本地开发

```bash
# 使用 Node.js
./start.sh dev

# 使用 Docker
./start.sh docker
```

### 2. 服务器配置

#### 标准配置

在 GitHub 仓库的 **Settings > Secrets and variables > Actions** 中添加：

| 密钥名称 | 描述 | 示例 |
|---------|------|------|
| `SERVER_HOST` | 服务器 IP | `192.168.1.100` |
| `SERVER_USER` | SSH 用户名 | `ubuntu` |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN RSA...` |
| `SERVER_PORT` | SSH 端口 | `22` |

#### Tailscale 网络配置（推荐）

如果您使用 Tailscale 私有网络，还需要添加：

| 密钥名称 | 描述 | 获取方式 |
|---------|------|---------|
| `TAILSCALE_OAUTH_CLIENT_ID` | Tailscale OAuth ID | [Tailscale 控制台](https://login.tailscale.com/admin/settings/oauth) |
| `TAILSCALE_OAUTH_SECRET` | Tailscale OAuth 密钥 | Tailscale 控制台 |
| `SERVER_HOST` | 服务器 Tailscale IP | `100.64.x.x` 或机器名 |

> 📖 **详细配置**: 查看 [Tailscale部署配置.md](./Tailscale部署配置.md) 了解完整的 Tailscale 设置步骤

### 3. 自动部署

1. 将分支合并到 main：
   ```bash
   git checkout main
   git merge cicd-docker-deploy
   git push origin main
   ```

2. GitHub Actions 将自动：
   - 运行测试
   - 构建 Docker 镜像
   - 推送到 GitHub Container Registry
   - 部署到您的服务器

### 4. 监控服务

```bash
# 检查服务状态
./start.sh status

# 查看日志
./start.sh logs

# 在服务器上检查
curl http://your-server:3000/status
```

## 📁 新增文件结构

```
├── .github/workflows/
│   └── ci-cd.yml              # GitHub Actions 工作流
├── scripts/
│   └── deploy.sh              # 服务器部署脚本
├── Dockerfile                 # Docker 镜像配置
├── docker-compose.yml         # Docker Compose 配置
├── healthcheck.sh             # 健康检查脚本
├── start.sh                   # 快速启动脚本
├── .dockerignore              # Docker 忽略文件
├── .env.example               # 环境变量示例
└── Docker部署指南.md          # 详细部署文档
```

## 🔧 可用命令

```bash
# 开发
./start.sh dev              # 本地开发
./start.sh docker           # Docker 开发环境

# 构建和测试
./start.sh build            # 构建镜像
./start.sh test             # 运行测试

# 运维
./start.sh status           # 检查状态
./start.sh logs             # 查看日志
./start.sh clean            # 清理资源
```

## 🌐 部署流程

1. **代码推送** → 触发 GitHub Actions
2. **自动测试** → 验证代码质量
3. **构建镜像** → 打包应用到容器
4. **推送镜像** → 上传到 GitHub Container Registry
5. **SSH 部署** → 连接服务器并更新容器
6. **健康检查** → 验证部署成功

## 📊 监控和维护

### 服务健康
- **状态端点**: `http://your-server:3000/status`
- **健康检查**: 容器内置健康监控
- **日志收集**: Docker 日志统一管理

### 容器管理
```bash
# 在服务器上
docker ps                        # 查看运行状态
docker logs dom-catcher-server    # 查看日志
docker stats dom-catcher-server   # 查看资源使用
```

## 🔐 安全注意事项

1. **SSH 密钥**: 确保 SSH 私钥安全存储在 GitHub Secrets
2. **防火墙**: 只开放必要端口 (3000, 22)
3. **权限控制**: 使用非 root 用户运行容器
4. **定期更新**: 及时更新基础镜像和依赖

## 📖 详细文档

- **[Docker部署指南.md](./Docker部署指南.md)**: 完整部署文档
- **[GitHub Actions 工作流](./.github/workflows/ci-cd.yml)**: CI/CD 配置详情

## 🆘 故障排除

### 常见问题

1. **容器无法启动**
   ```bash
   docker logs dom-catcher-server
   ```

2. **服务无法访问**
   ```bash
   # 检查端口
   netstat -tulpn | grep 3000
   
   # 检查防火墙
   sudo ufw status
   ```

3. **部署失败**
   - 检查 GitHub Secrets 配置
   - 验证服务器 SSH 连接
   - 查看 Actions 日志

### 获取帮助

如有问题，请查看：
1. GitHub Actions 运行日志
2. Docker 容器日志
3. 服务器系统日志

---

🎉 **部署成功后，您的 DOM Catcher 服务将通过现代化的 CI/CD 流程自动维护和更新！**
