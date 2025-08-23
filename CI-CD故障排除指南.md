# CI/CD 故障排除指南

## Tailscale 认证错误 (403 权限不足)

### 错误症状

在 GitHub Actions CI/CD 工作流中，可能出现以下错误：

#### 错误 1: 权限不足 (403)
```bash
Status: 403, Message: "calling actor does not have enough permissions to perform this function"
Error: Process completed with exit code 1.
```

#### 错误 2: 标签权限问题 (400)
```bash
Status: 400, Message: "requested tags [tag:ci] are invalid or not permitted"
Error: Process completed with exit code 1.
```

### 问题分析

#### 1. 权限不足 (403 错误)
- **原因**: Tailscale OAuth 客户端或认证密钥权限不足
- **影响**: 无法建立 Tailscale 网络连接，导致部署失败

#### 2. 标签权限问题 (400 错误)
- **原因**: 请求的标签 `tag:ci` 在 Tailscale 网络中未定义或 OAuth 客户端无权使用
- **影响**: 设备无法使用指定标签加入网络

#### 3. 主机名冲突
- **原因**: 多个 GitHub Actions 运行器使用相同的主机名
- **影响**: Tailscale 网络中的设备冲突

#### 4. 认证配置问题
- **原因**: 环境变量未正确设置或密钥过期
- **影响**: 认证流程失败

### 解决方案

#### 方案 1: 修复 Tailscale OAuth 配置 (推荐)

1. **检查 Tailscale OAuth 客户端权限**
   ```bash
   # 在 Tailscale 控制台中确认 OAuth 客户端具有以下权限：
   # - 设备注册权限
   # - 标签管理权限 (tag:ci)
   # - 临时设备创建权限
   ```

2. **更新 GitHub Secrets**
   ```bash
   # 确保以下 secrets 正确设置：
   TAILSCALE_OAUTH_CLIENT_ID=<OAuth客户端ID>
   TAILSCALE_OAUTH_SECRET=<OAuth客户端密钥>
   ```

3. **修复标签权限问题**
   ```yaml
   # 方案 A: 移除标签 (推荐，最简单)
   - name: 连接到 Tailscale 网络
     uses: tailscale/github-action@v2
     with:
       oauth-client-id: ${{ secrets.TAILSCALE_OAUTH_CLIENT_ID }}
       oauth-secret: ${{ secrets.TAILSCALE_OAUTH_SECRET }}
       hostname: github-actions-${{ github.run_id }}
   
   # 方案 B: 配置正确的标签
   # 首先在 Tailscale 控制台中定义 tag:ci
   # 然后确保 OAuth 客户端有使用该标签的权限
   ```

#### 方案 2: 使用传统认证密钥

如果 OAuth 配置复杂，可以回退到传统的认证密钥：

```yaml
- name: 连接到 Tailscale 网络
  uses: tailscale/github-action@v2
  with:
    authkey: ${{ secrets.TAILSCALE_AUTHKEY }}
    tags: tag:ci
    hostname: github-actions-${{ github.run_id }}
```

#### 方案 3: 完全移除 Tailscale (适用于公网部署)

如果服务器可以通过公网访问，可以移除 Tailscale 依赖：

```yaml
deploy:
  needs: [test, build-and-push]
  runs-on: ubuntu-latest
  if: github.ref == 'refs/heads/main'
  
  steps:
  - name: 部署到服务器
    uses: appleboy/ssh-action@v1.0.0
    with:
      host: ${{ secrets.SERVER_HOST }}  # 使用公网IP或域名
      username: ${{ secrets.SERVER_USER }}
      key: ${{ secrets.SERVER_SSH_KEY }}
      port: 22
      # ... 部署脚本
```

### 预防措施

#### 1. 权限最小化原则
```bash
# Tailscale OAuth 客户端只分配必要权限：
# - 设备注册 (必需)
# - 指定标签权限 (tag:ci)
# - 临时设备权限 (推荐)
```

#### 2. 密钥轮换策略
```bash
# 定期轮换认证密钥：
# - OAuth 客户端密钥: 每季度轮换
# - 传统认证密钥: 每月轮换
# - SSH 密钥: 每年轮换
```

#### 3. 监控和日志
```yaml
# 在工作流中添加详细日志：
- name: 调试 Tailscale 连接
  if: failure()
  run: |
    echo "Tailscale 状态:"
    tailscale status || true
    echo "网络接口:"
    ip addr show || true
    echo "路由表:"
    ip route show || true
```

### 其他已修复的问题

#### 1. 移除危险的镜像清理
```bash
# 已移除: docker image prune -f
# 原因: 可能删除其他应用的镜像
```

#### 2. 添加环境变量
```bash
# 已添加: NODE_ENV=production
# 原因: 确保容器监听 0.0.0.0 而非 127.0.0.1
```

#### 3. 修复端口配置
```yaml
# 修复前: port: ${{ secrets.SERVER_PORT || 22 }}
# 修复后: port: 22
# 原因: GitHub Actions 不支持 secrets 中的默认值语法
```

### 验证修复

#### 1. 本地测试
```bash
# 测试 Docker 构建
docker build -t test-image .
docker run -d --name test-container -p 3000:3000 test-image

# 测试服务
curl http://localhost:3000/status
```

#### 2. Tailscale 连接测试
```bash
# 手动测试 Tailscale 认证
tailscale up --authkey=<your-key> --hostname=test-$(date +%s)
tailscale status
```

#### 3. SSH 连接测试
```bash
# 测试 SSH 连接
ssh -i <private-key> user@<server-host> "docker --version"
```

### 相关文件

- `.github/workflows/ci-cd.yml` - CI/CD 工作流配置
- `scripts/deploy.sh` - 服务器部署脚本
- `docker-compose.yml` - 本地开发配置
- `Dockerfile` - 容器构建配置

### 联系支持

如果问题持续存在，请检查：
1. Tailscale 控制台中的设备状态
2. GitHub Actions 运行日志
3. 目标服务器的网络连接状态
4. 所有 GitHub Secrets 的配置正确性

---

*最后更新: 2025年8月23日*
