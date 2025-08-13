#!/bin/bash

echo "=== 源码文件行数检查报告 ==="
echo "目标：单个源码文件不超过200行"
echo ""

# 检查主要源码文件
check_file() {
    local file="$1"
    local description="$2"
    
    if [[ -f "$file" ]]; then
        local lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        local status="✅"
        if [[ $lines -gt 200 ]]; then
            status="❌"
        fi
        printf "%-30s %-10s %s行\n" "$description" "$status" "$lines"
    else
        printf "%-30s %-10s %s\n" "$description" "⚠️" "文件不存在"
    fi
}

echo "主要入口文件："
check_file "server.js" "服务器主文件"
check_file "content.js" "内容脚本"
check_file "popup.js" "弹窗脚本"
check_file "popup.html" "弹窗界面"
check_file "public/manage.html" "文件管理页面"

echo ""
echo "模块化文件："
check_file "server/app.js" "服务器应用主文件"
check_file "server/routes.js" "服务器路由"
check_file "server/html-converter.js" "HTML转换器"
check_file "server/file-handler.js" "文件处理器"

echo ""
echo "提取的样式和脚本："
check_file "public/manage.css" "管理页面样式"
check_file "public/manage.js" "管理页面脚本"

echo ""
echo "内容脚本模块："
check_file "content/styles.js" "样式处理模块"
check_file "content/dom-selector.js" "DOM选择器模块"
check_file "content/link-converter.js" "链接转换模块"
check_file "content/server-api.js" "服务器API模块"

echo ""
echo "弹窗模块："
check_file "popup/ui.js" "弹窗UI模块"
check_file "popup/config.js" "弹窗配置模块"
check_file "popup/api.js" "弹窗API模块"

echo ""
echo "=== 检查完成 ==="
