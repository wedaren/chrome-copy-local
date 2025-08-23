#!/bin/bash

# Tailscale 连接测试脚本
# 用于验证 CI/CD 环境中的 Tailscale 连接

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔗 Tailscale 连接测试开始...${NC}"

# 检查 Tailscale 是否可用
if ! command -v tailscale &> /dev/null; then
    echo -e "${RED}❌ Tailscale 未安装${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Tailscale 客户端已安装${NC}"

# 检查 Tailscale 状态
echo -e "${BLUE}📊 检查 Tailscale 状态...${NC}"
if tailscale status &> /dev/null; then
    echo -e "${GREEN}✅ Tailscale 已连接${NC}"
    tailscale status --json | jq -r '.Self.HostName + " (" + .Self.TailscaleIPs[0] + ")"' 2>/dev/null || tailscale ip -4
else
    echo -e "${RED}❌ Tailscale 未连接${NC}"
    exit 1
fi

# 如果提供了目标主机，进行连接测试
if [ -n "$1" ]; then
    TARGET_HOST="$1"
    echo -e "${BLUE}🎯 测试到 ${TARGET_HOST} 的连接...${NC}"
    
    # Ping 测试
    if ping -c 3 -W 5 "$TARGET_HOST" &> /dev/null; then
        echo -e "${GREEN}✅ Ping 测试成功${NC}"
    else
        echo -e "${YELLOW}⚠️ Ping 测试失败，可能是防火墙阻止了 ICMP${NC}"
    fi
    
    # SSH 端口测试
    SSH_PORT="${2:-22}"
    echo -e "${BLUE}🔒 测试 SSH 连接 (端口 ${SSH_PORT})...${NC}"
    
    if nc -z -w5 "$TARGET_HOST" "$SSH_PORT" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH 端口 ${SSH_PORT} 可访问${NC}"
    else
        echo -e "${RED}❌ SSH 端口 ${SSH_PORT} 不可访问${NC}"
        exit 1
    fi
    
    # HTTP 服务测试（如果已部署）
    echo -e "${BLUE}🌐 测试 HTTP 服务...${NC}"
    if curl -sf "http://${TARGET_HOST}:3000/status" &> /dev/null; then
        echo -e "${GREEN}✅ HTTP 服务正常${NC}"
    else
        echo -e "${YELLOW}⚠️ HTTP 服务不可访问（可能尚未部署）${NC}"
    fi
else
    echo -e "${YELLOW}💡 提示: 使用 $0 <target-host> [ssh-port] 测试特定主机连接${NC}"
fi

echo -e "${GREEN}🎉 Tailscale 连接测试完成${NC}"
