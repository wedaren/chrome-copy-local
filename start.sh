#!/bin/bash

# 快速启动脚本
# 用于快速启动开发或生产环境

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 显示帮助信息
show_help() {
    echo -e "${BLUE}DOM Catcher 快速启动脚本${NC}"
    echo ""
    echo "使用方法:"
    echo "  $0 [命令]"
    echo ""
    echo "命令:"
    echo "  dev           启动开发环境 (本地)"
    echo "  docker        启动 Docker 开发环境"
    echo "  prod          启动生产环境"
    echo "  build         构建 Docker 镜像"
    echo "  push          推送镜像到注册表"
    echo "  test          运行测试"
    echo "  clean         清理 Docker 资源"
    echo "  status        检查服务状态"
    echo "  logs          查看日志"
    echo "  help          显示此帮助信息"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装或未在 PATH 中${NC}"
        exit 1
    fi
}

# 启动开发环境
start_dev() {
    echo -e "${GREEN}🚀 启动开发环境...${NC}"
    npm install
    npm run dev
}

# 启动 Docker 开发环境
start_docker() {
    check_docker
    echo -e "${GREEN}🐳 启动 Docker 开发环境...${NC}"
    docker-compose up -d
    echo -e "${GREEN}✅ Docker 容器已启动${NC}"
    echo -e "${BLUE}📊 查看状态: $0 status${NC}"
    echo -e "${BLUE}📝 查看日志: $0 logs${NC}"
}

# 启动生产环境
start_prod() {
    check_docker
    echo -e "${GREEN}🚀 启动生产环境...${NC}"
    NODE_ENV=production docker-compose up -d
}

# 构建 Docker 镜像
build_image() {
    check_docker
    echo -e "${GREEN}🔨 构建 Docker 镜像...${NC}"
    docker build -t dom-catcher-server .
    echo -e "${GREEN}✅ 镜像构建完成${NC}"
}

# 推送镜像
push_image() {
    check_docker
    echo -e "${GREEN}📤 推送镜像到注册表...${NC}"
    # 这里需要根据实际的注册表地址修改
    echo -e "${YELLOW}⚠️  请确保已登录到 GitHub Container Registry${NC}"
    echo "docker push ghcr.io/wedaren/chrome-copy-local:latest"
}

# 运行测试
run_tests() {
    echo -e "${GREEN}🧪 运行测试...${NC}"
    npm test
}

# 清理 Docker 资源
clean_docker() {
    check_docker
    echo -e "${YELLOW}🧹 清理 Docker 资源...${NC}"
    docker-compose down
    docker system prune -f
    echo -e "${GREEN}✅ 清理完成${NC}"
}

# 检查服务状态
check_status() {
    check_docker
    echo -e "${BLUE}📊 检查服务状态...${NC}"
    
    if docker ps | grep -q dom-catcher-server; then
        echo -e "${GREEN}✅ 容器正在运行${NC}"
        echo ""
        echo "容器信息:"
        docker ps | grep dom-catcher-server
        echo ""
        echo "健康状态:"
        docker inspect dom-catcher-server | grep Health -A 5 || echo "无健康检查信息"
        echo ""
        echo -e "${BLUE}🔍 测试服务连接...${NC}"
        if curl -sf http://localhost:3000/status > /dev/null; then
            echo -e "${GREEN}✅ 服务响应正常${NC}"
        else
            echo -e "${RED}❌ 服务无响应${NC}"
        fi
    else
        echo -e "${RED}❌ 容器未运行${NC}"
    fi
}

# 查看日志
show_logs() {
    check_docker
    echo -e "${BLUE}📝 查看容器日志...${NC}"
    docker-compose logs -f
}

# 主函数
main() {
    case "${1:-help}" in
        "dev")
            start_dev
            ;;
        "docker")
            start_docker
            ;;
        "prod")
            start_prod
            ;;
        "build")
            build_image
            ;;
        "push")
            push_image
            ;;
        "test")
            run_tests
            ;;
        "clean")
            clean_docker
            ;;
        "status")
            check_status
            ;;
        "logs")
            show_logs
            ;;
        "help"|*)
            show_help
            ;;
    esac
}

main "$@"
