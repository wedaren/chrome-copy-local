#!/bin/bash

# 服务器部署脚本
# 使用方法: ./deploy.sh [环境] [镜像标签]

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
CONTAINER_NAME="dom-catcher-server"
IMAGE_NAME="ghcr.io/wedaren/chrome-copy-local"

echo "🚀 开始部署 DOM Catcher 服务器..."
echo "环境: $ENVIRONMENT"
echo "镜像: $IMAGE_NAME:$IMAGE_TAG"

# 停止现有容器
echo "⏹️  停止现有容器..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# 拉取最新镜像
echo "📥 拉取最新镜像..."
docker pull $IMAGE_NAME:$IMAGE_TAG

# 创建必要的目录
echo "📁 创建必要的目录..."
sudo mkdir -p /opt/dom-catcher/captured

# 设置目录权限
sudo chown -R 1000:1000 /opt/dom-catcher

# 运行新容器
echo "🏃 启动新容器..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p 3000:3000 \
  -v /opt/dom-catcher/captured:/app/captured \
  -e NODE_ENV=$ENVIRONMENT \
  $IMAGE_NAME:$IMAGE_TAG

# 等待服务启动并进行健康检查
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f -s http://localhost:3000/status > /dev/null; then
    echo "✅ 部署成功！服务正常运行"
    echo "📊 容器状态:"
    docker ps | grep $CONTAINER_NAME || true
    echo "🌐 服务地址: http://localhost:3000"
else
    echo "❌ 部署失败！服务无法访问"
    echo "📝 容器日志:"
    docker logs $CONTAINER_NAME
    echo "📊 容器状态:"
    docker ps -a | grep $CONTAINER_NAME || true
    exit 1
fi
