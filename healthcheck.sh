#!/bin/sh

# Docker 健康检查脚本
# 用于检查服务是否正常运行

set -e

# 检查服务端口是否可访问
if ! nc -z localhost 3000; then
    echo "❌ 端口 3000 不可访问"
    exit 1
fi

# 检查状态端点
response=$(curl -sf http://localhost:3000/status || echo "ERROR")

if [ "$response" = "ERROR" ]; then
    echo "❌ 状态端点无响应"
    exit 1
fi

# 检查响应是否包含 status: running
if echo "$response" | grep -q '"status":"running"'; then
    echo "✅ 服务运行正常"
    exit 0
else
    echo "❌ 服务状态异常: $response"
    exit 1
fi
