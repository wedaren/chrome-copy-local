# Docker 部署指南

## 概述

DOM Catcher 服务器现在支持 Docker 容器化部署，通过 GitHub Actions 实现自动化 CI/CD 流程。

## 架构说明

- **Docker 容器**: 基于 Node.js 18 Alpine 镜像
- **GitHub Actions**: 自动构建、测试和部署
- **GitHub Container Registry**: 镜像存储
- **自动部署**: 推送到 main 分支时自动部署到服务器

## 本地开发

### 使用 Docker Compose

```bash
# 启动服务
npm run docker:compose:up

# 查看日志
npm run docker:compose:logs

# 停止服务
npm run docker:compose:down
```

### 手动 Docker 命令

```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run
```

## 服务器部署

### 前置要求

1. 服务器已安装 Docker
2. 配置了 GitHub Secrets（见下方配置说明）
3. 服务器有访问 GitHub Container Registry 的权限

### GitHub Secrets 配置

在 GitHub 仓库的 Settings > Secrets and variables > Actions 中添加以下密钥：

| 密钥名称 | 描述 | 示例值 |
|---------|------|-------|
| `SERVER_HOST` | 服务器 IP 地址 | `192.168.1.100` |
| `SERVER_USER` | SSH 用户名 | `ubuntu` |
| `SERVER_SSH_KEY` | SSH 私钥 | `-----BEGIN RSA PRIVATE KEY-----...` |
| `SERVER_PORT` | SSH 端口（可选，默认22） | `22` |

### 自动部署流程

1. 推送代码到 `main` 分支
2. GitHub Actions 自动触发：
   - 运行测试
   - 构建 Docker 镜像
   - 推送到 GitHub Container Registry
   - SSH 连接到服务器
   - 拉取最新镜像并重启容器

### 手动部署

如果需要手动部署，可以在服务器上运行：

```bash
# 下载部署脚本
curl -O https://raw.githubusercontent.com/wedaren/chrome-copy-local/main/scripts/deploy.sh
chmod +x deploy.sh

# 执行部署
./deploy.sh production latest
```

## 服务器配置

### 目录结构

```
/opt/dom-catcher/
├── captured/          # 捕获的文件存储
└── logs/             # 应用日志
```

### 容器信息

- **容器名称**: `dom-catcher-server`
- **端口映射**: `3000:3000`
- **重启策略**: `unless-stopped`
- **健康检查**: 每30秒检查 `/status` 端点

## 监控和维护

### 查看容器状态

```bash
# 查看运行中的容器
docker ps

# 查看容器日志
docker logs dom-catcher-server

# 查看容器资源使用
docker stats dom-catcher-server
```

### 服务健康检查

```bash
# 检查服务状态
curl http://localhost:3000/status

# 查看容器健康状态
docker inspect dom-catcher-server | grep Health -A 10
```

### 故障排除

1. **容器无法启动**
   ```bash
   docker logs dom-catcher-server
   ```

2. **服务无法访问**
   ```bash
   # 检查端口是否开放
   netstat -tulpn | grep 3000
   
   # 检查防火墙设置
   sudo ufw status
   ```

3. **镜像拉取失败**
   ```bash
   # 重新登录 GitHub Container Registry
   echo "YOUR_GITHUB_TOKEN" | docker login ghcr.io -u YOUR_USERNAME --password-stdin
   ```

## 环境变量

| 变量名 | 描述 | 默认值 |
|--------|------|-------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `3000` |

## 安全注意事项

1. 确保服务器防火墙只开放必要端口
2. 定期更新 Docker 镜像和基础系统
3. 监控容器资源使用情况
4. 定期备份 `/opt/dom-catcher/captured` 目录

## 版本管理

- **latest**: 最新稳定版本
- **main**: 主分支最新版本
- **{branch}-{sha}**: 特定提交版本

查看所有可用版本：
```bash
docker images ghcr.io/wedaren/chrome-copy-local
```
