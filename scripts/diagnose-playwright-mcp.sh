#!/bin/bash

# Playwright MCP Bridge 诊断脚本

echo "============================================================"
echo "  Playwright MCP Bridge 诊断"
echo "============================================================"
echo ""

# 1. 检查 Chrome 扩展目录
echo "📋 检查 Chrome 扩展目录..."
EXTENSIONS_DIR="$HOME/Library/Application Support/Google/Chrome/Default/Extensions"
if [ -d "$EXTENSIONS_DIR" ]; then
  echo "✅ Chrome 扩展目录存在: $EXTENSIONS_DIR"
  echo ""
  echo "已安装的扩展:"
  ls -la "$EXTENSIONS_DIR" | head -20
else
  echo "❌ Chrome 扩展目录不存在: $EXTENSIONS_DIR"
fi

echo ""
echo "============================================================"
echo ""

# 2. 检查 Playwright MCP Bridge 扩展
echo "📋 检查 Playwright MCP Bridge 扩展..."
if [ -d "$EXTENSIONS_DIR" ]; then
  # 搜索 Playwright MCP Bridge 扩展
  PLAYWRIGHT_EXTENSIONS=$(find "$EXTENSIONS_DIR" -type d -name "*playwright*" 2>/dev/null)
  if [ -n "$PLAYWRIGHT_EXTENSIONS" ]; then
    echo "✅ 找到 Playwright MCP Bridge 扩展:"
    echo "$PLAYWRIGHT_EXTENSIONS"
  else
    echo "❌ 未找到 Playwright MCP Bridge 扩展"
    echo ""
    echo "请按照以下步骤安装扩展:"
    echo "1. 打开 Chrome 浏览器"
    echo "2. 访问 Chrome Web Store"
    echo "3. 搜索 'Playwright MCP Bridge' 或 'MCP Bridge'"
    echo "4. 点击 '添加到 Chrome'"
    echo "5. 安装后，确保扩展已启用"
    echo "6. 在扩展设置中配置 Token: 7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs"
  fi
else
  echo "❌ Chrome 扩展目录不存在，无法检查扩展"
fi

echo ""
echo "============================================================"
echo ""

# 3. 检查 Playwright 进程
echo "📋 检查 Playwright 进程..."
PLAYWRIGHT_PROCESS=$(ps aux | grep -i "playwright" | grep -v grep)
if [ -n "$PLAYWRIGHT_PROCESS" ]; then
  echo "✅ 找到 Playwright 进程:"
  echo "$PLAYWRIGHT_PROCESS"
else
  echo "❌ 未找到 Playwright 进程"
fi

echo ""
echo "============================================================"
echo ""

# 4. 检查 Chrome 远程调试端口
echo "📋 检查 Chrome 远程调试端口..."
DEBUGGING_PORT=$(ps aux | grep "remote-debugging-port" | grep -v grep)
if [ -n "$DEBUGGING_PORT" ]; then
  echo "✅ 找到 Chrome 远程调试端口:"
  echo "$DEBUGGING_PORT" | grep -o "remote-debugging-port=[0-9]*"
else
  echo "❌ 未找到 Chrome 远程调试端口"
fi

echo ""
echo "============================================================"
echo ""

# 5. 检查 MCP 配置文件
echo "📋 检查 MCP 配置文件..."
MCP_CONFIG="$HOME/.openclaw/workspace/skills/playwright-browser/mcp-config.json"
if [ -f "$MCP_CONFIG" ]; then
  echo "✅ MCP 配置文件存在: $MCP_CONFIG"
  echo ""
  echo "配置内容:"
  cat "$MCP_CONFIG"
else
  echo "❌ MCP 配置文件不存在: $MCP_CONFIG"
fi

echo ""
echo "============================================================"
echo ""

# 6. 测试 Playwright MCP 连接
echo "📋 测试 Playwright MCP 连接..."
echo "尝试列出当前标签页..."
mcporter call playwright.browser_tabs action="list" 2>&1 | head -20

echo ""
echo "============================================================"
echo "  诊断完成"
echo "============================================================"
