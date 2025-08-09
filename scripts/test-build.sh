#!/bin/bash

# 简化测试发布脚本
# 用于验证扩展包是否正确构建

set -e

echo "🧪 开始测试扩展构建..."

# 检查必需文件
echo "📋 检查必需文件..."
required_files=("manifest.json" "popup.html" "popup.js" "content.js")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 缺少必需文件: $file"
        exit 1
    else
        echo "✅ $file 存在"
    fi
done

# 验证 manifest.json 格式
echo "📋 验证 manifest.json 格式..."
if command -v jq &> /dev/null; then
    if jq . manifest.json > /dev/null; then
        echo "✅ manifest.json 格式正确"
        VERSION=$(jq -r '.version' manifest.json)
        echo "   当前版本: $VERSION"
    else
        echo "❌ manifest.json 格式错误"
        exit 1
    fi
else
    echo "⚠️  jq 未安装，跳过 JSON 格式验证"
fi

# 创建测试构建
echo "📦 创建测试构建..."
rm -rf test-build
mkdir -p test-build

# 复制扩展文件
cp -r . test-build/
cd test-build

# 清理不需要的文件
echo "🧹 清理构建文件..."
rm -rf node_modules .git .github test-build captured scripts
rm -f package*.json server.js *.md .gitignore *.ipynb .DS_Store
rm -f .env* auth-config.json credentials.json

# 列出最终文件
echo "📁 最终扩展文件:"
find . -type f | sort

# 创建测试 ZIP 包
cd ..
zip -r test-extension.zip test-build/

echo ""
echo "✅ 测试构建完成！"
echo "📦 测试包: test-extension.zip"
echo "📏 包大小: $(ls -lh test-extension.zip | awk '{print $5}')"
echo ""
echo "🔍 下一步测试建议:"
echo "   1. 在 Chrome 中加载 test-build 目录测试功能"
echo "   2. 检查扩展是否正常工作"
echo "   3. 确认所有必需文件都已包含"
echo ""
echo "🧹 清理命令: rm -rf test-build test-extension.zip"
