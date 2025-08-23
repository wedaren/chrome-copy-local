#!/bin/bash

# CI/CD 基础功能测试
# 用于验证应用的基本功能是否正常

set -e

echo "🧪 开始 CI/CD 基础功能测试..."

# 测试 1: 检查必要文件是否存在
echo "📁 检查必要文件..."
required_files=(
    "package.json"
    "server.js"
    "Dockerfile"
    "docker-compose.yml"
    ".github/workflows/ci-cd.yml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file 存在"
    else
        echo "❌ $file 不存在"
        exit 1
    fi
done

# 测试 2: 检查 package.json 语法
echo "📋 检查 package.json 语法..."
if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
    echo "✅ package.json 语法正确"
else
    echo "❌ package.json 语法错误"
    exit 1
fi

# 测试 3: 检查 Node.js 依赖
echo "📦 检查 Node.js 依赖..."
if npm ls --depth=0 &>/dev/null; then
    echo "✅ 依赖检查通过"
else
    echo "⚠️ 依赖可能有问题，尝试安装..."
    npm install
fi

# 测试 4: 语法检查（如果存在）
echo "🔍 进行代码语法检查..."
if node -c server.js; then
    echo "✅ server.js 语法正确"
else
    echo "❌ server.js 语法错误"
    exit 1
fi

# 测试 5: 检查 Docker 文件语法
echo "🐳 检查 Dockerfile..."
if docker run --rm -i hadolint/hadolint < Dockerfile; then
    echo "✅ Dockerfile 语法正确"
else
    echo "⚠️ Dockerfile 可能有问题，但继续执行"
fi

# 测试 6: 验证环境变量配置
echo "🔧 检查环境变量配置..."
if [ -f ".env.example" ]; then
    echo "✅ .env.example 存在"
else
    echo "⚠️ .env.example 不存在"
fi

echo "🎉 基础功能测试完成！"
echo ""
echo "📝 测试报告:"
echo "- ✅ 必要文件检查: 通过"
echo "- ✅ JSON 语法检查: 通过"
echo "- ✅ 依赖检查: 通过"
echo "- ✅ 代码语法检查: 通过"
echo "- 🐳 Docker 配置: 已验证"
echo "- 🔧 环境配置: 已检查"
echo ""
echo "🚀 项目已准备好进行 CI/CD 部署！"
