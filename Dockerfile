# 使用 Node.js 18 官方镜像
FROM node:18-alpine

# 安装必要工具 (curl 用于健康检查, netcat 用于端口检查)
RUN apk add --no-cache curl netcat-openbsd

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json 并设置权限
COPY --chown=node:node package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用代码和健康检查脚本
COPY --chown=node:node . .
COPY --chown=node:node healthcheck.sh ./
RUN chmod +x ./healthcheck.sh

# 切换到非 root 用户
USER node

# 创建 captured 目录
RUN mkdir -p captured

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 添加健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD ./healthcheck.sh

# 启动应用
CMD ["npm", "start"]
