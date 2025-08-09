#!/bin/bash

echo "🧪 测试递归 Markdown 转换功能"
echo "================================"

# 测试数据：包含嵌套格式的 HTML
HTML_DATA='{
  "html": "<p>Hello <strong>world</strong> with <em>formatting</em></p><h2>Title with <strong>bold</strong></h2><ul><li>Item <strong>one</strong></li><li>Item <em>two</em></li></ul>",
  "info": {
    "tagName": "div",
    "textContent": "Test content with nested formatting",
    "url": "http://localhost:3001/test",
    "timestamp": "2025-08-09T10:00:00.000Z"
  }
}'

echo "📤 发送测试数据到服务器..."
echo "HTML: <p>Hello <strong>world</strong> with <em>formatting</em></p><h2>Title with <strong>bold</strong></h2><ul><li>Item <strong>one</strong></li><li>Item <em>two</em></li></ul>"

# 发送 POST 请求
RESPONSE=$(curl -s -X POST http://localhost:3001/receive-dom \
  -H "Content-Type: application/json" \
  -d "$HTML_DATA")

echo "📥 服务器响应:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# 检查是否成功
if echo "$RESPONSE" | grep -q '"success": true'; then
    echo ""
    echo "✅ 请求成功发送"
    
    # 获取生成的文件名
    MARKDOWN_FILE=$(echo "$RESPONSE" | jq -r '.files.markdown.filename' 2>/dev/null)
    
    if [ "$MARKDOWN_FILE" != "null" ] && [ "$MARKDOWN_FILE" != "" ]; then
        echo "📄 生成的 Markdown 文件: $MARKDOWN_FILE"
        
        # 显示生成的 Markdown 内容
        MARKDOWN_PATH="./captured/$MARKDOWN_FILE"
        if [ -f "$MARKDOWN_PATH" ]; then
            echo ""
            echo "📝 生成的 Markdown 内容:"
            echo "========================"
            cat "$MARKDOWN_PATH"
            echo ""
            echo "========================"
            
            # 检查是否包含正确的格式
            if grep -q '\*\*world\*\*' "$MARKDOWN_PATH" && grep -q '\*formatting\*' "$MARKDOWN_PATH"; then
                echo "✅ 递归转换成功！正确保留了嵌套的 **粗体** 和 *斜体* 格式"
            else
                echo "❌ 递归转换失败！格式可能丢失"
            fi
            
            if grep -q '## Title with \*\*bold\*\*' "$MARKDOWN_PATH"; then
                echo "✅ 标题中的格式正确保留"
            else
                echo "❌ 标题中的格式丢失"
            fi
            
            if grep -q '- Item \*\*one\*\*' "$MARKDOWN_PATH" && grep -q '- Item \*two\*' "$MARKDOWN_PATH"; then
                echo "✅ 列表中的格式正确保留"
            else
                echo "❌ 列表中的格式丢失"
            fi
        else
            echo "❌ 找不到生成的 Markdown 文件: $MARKDOWN_PATH"
        fi
    else
        echo "❌ 无法获取 Markdown 文件名"
    fi
else
    echo "❌ 请求失败"
fi

echo ""
echo "🏁 测试完成"
