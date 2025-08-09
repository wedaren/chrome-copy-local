#!/bin/bash

# Chrome 扩展快速发布脚本
# 用于本地测试和快速发布

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_success() {
    print_message $GREEN "✅ $1"
}

print_warning() {
    print_message $YELLOW "⚠️  $1"
}

print_error() {
    print_message $RED "❌ $1"
}

print_info() {
    print_message $BLUE "ℹ️  $1"
}

# 检查必需的命令
check_requirements() {
    print_info "检查运行环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查 npm
    if ! command -v npm &> /dev/null; then
        print_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查 git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装，请先安装 Git"
        exit 1
    fi
    
    # 检查 jq（用于处理 JSON）
    if ! command -v jq &> /dev/null; then
        print_warning "jq 未安装，将尝试安装..."
        if command -v brew &> /dev/null; then
            brew install jq
        elif command -v apt-get &> /dev/null; then
            sudo apt-get install -y jq
        else
            print_error "无法自动安装 jq，请手动安装后重试"
            exit 1
        fi
    fi
    
    print_success "环境检查完成"
}

# 获取版本号
get_version() {
    if [ -n "$1" ]; then
        VERSION=$1
    else
        # 从 manifest.json 读取当前版本
        CURRENT_VERSION=$(jq -r '.version' manifest.json)
        echo "当前版本: $CURRENT_VERSION"
        echo "请输入新版本号（留空保持当前版本）:"
        read -r INPUT_VERSION
        VERSION=${INPUT_VERSION:-$CURRENT_VERSION}
    fi
    
    print_info "版本号: $VERSION"
}

# 更新版本号
update_version() {
    print_info "更新版本号到 $VERSION..."
    
    # 更新 manifest.json
    jq --arg version "$VERSION" '.version = $version' manifest.json > manifest.tmp
    mv manifest.tmp manifest.json
    
    # 更新 package.json（如果存在）
    if [ -f "package.json" ]; then
        jq --arg version "$VERSION" '.version = $version' package.json > package.tmp
        mv package.tmp package.json
    fi
    
    print_success "版本号更新完成"
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    
    if [ -f "package.json" ] && grep -q '"test"' package.json; then
        npm test
        print_success "测试通过"
    else
        print_warning "未找到测试脚本，跳过测试"
    fi
}

# 构建扩展包
build_extension() {
    print_info "构建扩展包..."
    
    # 创建构建目录
    rm -rf dist
    mkdir -p dist/extension
    
    # 复制扩展文件
    cp -r . dist/extension/
    cd dist/extension
    
    # 清理不需要的文件
    rm -rf node_modules .git .github dist captured scripts
    rm -f package*.json server.js *.md .gitignore *.ipynb
    rm -f .env* .DS_Store
    
    # 创建 ZIP 包
    cd ..
    zip -r extension-$VERSION.zip extension/
    
    cd ..
    print_success "扩展包构建完成: dist/extension-$VERSION.zip"
}

# 验证扩展包
validate_extension() {
    print_info "验证扩展包..."
    
    cd dist
    
    # 检查 ZIP 包内容
    if ! unzip -l extension-$VERSION.zip | grep -q "manifest.json"; then
        print_error "扩展包中缺少 manifest.json"
        exit 1
    fi
    
    # 验证 manifest.json 语法
    unzip -j extension-$VERSION.zip extension/manifest.json -d temp/
    if ! jq . temp/manifest.json > /dev/null; then
        print_error "manifest.json 格式错误"
        rm -rf temp
        exit 1
    fi
    
    rm -rf temp
    cd ..
    print_success "扩展包验证通过"
}

# 提交更改
commit_changes() {
    print_info "提交版本更改..."
    
    git add manifest.json
    if [ -f "package.json" ]; then
        git add package.json
    fi
    
    git commit -m "bump version to $VERSION" || print_warning "没有需要提交的更改"
    print_success "更改已提交"
}

# 创建并推送标签
create_and_push_tag() {
    if [ "$SKIP_GIT" != "true" ]; then
        print_info "创建并推送 Git 标签..."
        
        TAG_NAME="v$VERSION"
        
        # 检查标签是否已存在
        if git tag -l | grep -q "^$TAG_NAME$"; then
            print_warning "标签 $TAG_NAME 已存在，跳过创建"
        else
            git tag $TAG_NAME
            print_success "标签 $TAG_NAME 创建成功"
        fi
        
        # 推送标签
        if [ "$PUSH_TAG" = "true" ]; then
            git push origin main
            git push origin $TAG_NAME
            print_success "标签已推送到远程仓库"
        fi
    fi
}

# 显示发布信息
show_release_info() {
    echo ""
    print_success "🎉 Chrome 扩展发布准备完成！"
    echo ""
    echo "📦 构建信息："
    echo "   版本: $VERSION"
    echo "   扩展包: dist/extension-$VERSION.zip"
    echo "   大小: $(ls -lh dist/extension-$VERSION.zip | awk '{print $5}')"
    echo ""
    echo "🚀 下一步操作："
    echo "   1. 检查扩展包内容是否正确"
    echo "   2. 在本地 Chrome 中测试扩展"
    echo "   3. 推送标签以触发自动发布（如果配置了 GitHub Actions）"
    echo "   4. 或手动上传到 Chrome Web Store"
    echo ""
    echo "🔗 有用的链接："
    echo "   • Chrome Web Store 开发者控制台: https://chrome.google.com/webstore/devconsole/"
    echo "   • 本地测试方法: chrome://extensions/ (开启开发者模式)"
    echo ""
}

# 显示帮助信息
show_help() {
    echo "Chrome 扩展快速发布脚本"
    echo ""
    echo "用法: $0 [选项] [版本号]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  --skip-tests        跳过测试"
    echo "  --skip-git          跳过 Git 操作"
    echo "  --push-tag          自动推送标签到远程仓库"
    echo "  --auto-version      自动递增版本号"
    echo ""
    echo "示例:"
    echo "  $0 1.2.0                    发布指定版本"
    echo "  $0 --auto-version           自动递增补丁版本"
    echo "  $0 --skip-tests 1.2.1       跳过测试直接发布"
    echo "  $0 --push-tag 1.3.0         发布并推送标签"
    echo ""
}

# 自动递增版本号
auto_increment_version() {
    CURRENT_VERSION=$(jq -r '.version' manifest.json)
    
    # 分割版本号
    IFS='.' read -ra VERSION_PARTS <<< "$CURRENT_VERSION"
    MAJOR=${VERSION_PARTS[0]}
    MINOR=${VERSION_PARTS[1]}
    PATCH=${VERSION_PARTS[2]}
    
    # 递增补丁版本
    PATCH=$((PATCH + 1))
    VERSION="$MAJOR.$MINOR.$PATCH"
    
    print_info "自动递增版本号: $CURRENT_VERSION -> $VERSION"
}

# 主程序
main() {
    # 默认参数
    SKIP_TESTS=false
    SKIP_GIT=false
    PUSH_TAG=false
    AUTO_VERSION=false
    VERSION=""
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            --skip-tests)
                SKIP_TESTS=true
                shift
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            --push-tag)
                PUSH_TAG=true
                shift
                ;;
            --auto-version)
                AUTO_VERSION=true
                shift
                ;;
            *)
                if [ -z "$VERSION" ]; then
                    VERSION=$1
                fi
                shift
                ;;
        esac
    done
    
    # 检查是否在扩展目录中
    if [ ! -f "manifest.json" ]; then
        print_error "请在 Chrome 扩展根目录中运行此脚本"
        exit 1
    fi
    
    print_info "开始 Chrome 扩展发布流程..."
    
    # 执行发布流程
    check_requirements
    
    if [ "$AUTO_VERSION" = "true" ]; then
        auto_increment_version
    else
        get_version $VERSION
    fi
    
    update_version
    
    if [ "$SKIP_TESTS" != "true" ]; then
        run_tests
    fi
    
    build_extension
    validate_extension
    commit_changes
    create_and_push_tag
    show_release_info
}

# 运行主程序
main "$@"
