#!/bin/bash

# 服务器部署脚本
# 使用方法: ./deploy.sh [环境] [镜像标签]

set -e

ENVIRONMENT=${1:-production}
IMAGE_TAG=${2:-latest}
CONTAINER_NAME="dom-catcher-server"
IMAGE_NAME="ghcr.io/wedaren/chrome-copy-local"

# 处理镜像标签参数 - 如果传入的是完整的镜像名称，提取标签部分
if [[ "$IMAGE_TAG" == *":"* ]]; then
    # 如果 IMAGE_TAG 包含冒号，说明传入的是完整镜像名称，提取标签部分
    IMAGE_TAG=$(echo "$IMAGE_TAG" | cut -d':' -f2)
    echo "🔧 检测到完整镜像名称，提取标签: $IMAGE_TAG"
fi

# 确保 Docker 可用
DOCKER_CMD="docker"
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未找到，尝试常见路径..."
    if [ -f "/usr/local/bin/docker" ]; then
        DOCKER_CMD="/usr/local/bin/docker"
        echo "✅ 使用 /usr/local/bin/docker"
    elif [ -f "/usr/bin/docker" ]; then
        DOCKER_CMD="/usr/bin/docker"
        echo "✅ 使用 /usr/bin/docker"
    else
        echo "❌ 无法找到 Docker，请确保 Docker 已安装"
        exit 1
    fi
fi

echo "🐳 Docker 版本: $($DOCKER_CMD --version)"
echo "🚀 开始部署 DOM Catcher 服务器..."
echo "环境: $ENVIRONMENT"
echo "镜像: $IMAGE_NAME:$IMAGE_TAG"

# 停止现有容器
echo "⏹️  停止现有容器..."
$DOCKER_CMD stop $CONTAINER_NAME 2>/dev/null || true
$DOCKER_CMD rm $CONTAINER_NAME 2>/dev/null || true

# 拉取最新镜像
echo "📥 拉取最新镜像..."
echo "🔍 检测系统架构: $(uname -m)"

# 尝试拉取镜像，如果失败则提供解决方案
if ! $DOCKER_CMD pull $IMAGE_NAME:$IMAGE_TAG; then
    echo "❌ 镜像拉取失败"
    echo "🔍 可能的原因: 架构不匹配"
    echo "💡 解决方案:"
    echo "   1. 等待多架构镜像构建完成 (需要重新推送代码)"
    echo "   2. 或者在 x86_64 服务器上部署"
    echo "   3. 或者本地构建镜像: $DOCKER_CMD build -t $IMAGE_NAME:$IMAGE_TAG ."
    
    # 检查是否有其他可用的镜像标签
    echo "🔍 检查可用的镜像标签..."
    $DOCKER_CMD images | grep "$(echo "$IMAGE_NAME" | cut -d'/' -f2-)" || true
    
    exit 1
fi

# 创建必要的目录（使用用户目录，避免 sudo）
echo "📁 创建必要的目录..."
CAPTURE_DIR="$HOME/dom-catcher/captured"
mkdir -p "$CAPTURE_DIR"
echo "✅ 创建目录: $CAPTURE_DIR"

# 运行新容器
echo "🏃 启动新容器..."
$DOCKER_CMD run -d \
  --name "$CONTAINER_NAME" \
  --restart unless-stopped \
  -p 3000:3000 \
  -v "$CAPTURE_DIR:/app/captured" \
  -e "NODE_ENV=$ENVIRONMENT" \
  "$IMAGE_NAME:$IMAGE_TAG"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 15

# 检查服务状态
echo "🔍 检查服务状态..."
if curl -f -s http://localhost:3000/status > /dev/null; then
    echo "✅ 部署成功！服务正常运行"
    echo "📊 容器状态:"
    $DOCKER_CMD ps | grep $CONTAINER_NAME || true
    echo "🌐 服务地址: http://localhost:3000"
else
    echo "❌ 部署失败！服务无法访问"
    echo "📝 容器日志:"
    $DOCKER_CMD logs $CONTAINER_NAME
    echo "📊 容器状态:"
    $DOCKER_CMD ps -a | grep $CONTAINER_NAME || true
    exit 1
fi
