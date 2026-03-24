# Playwright MCP 配置（CDP 模式 vs 扩展模式）

## CDP 模式（当前配置，不推荐）

**配置**：
```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--cdp-endpoint",
        "ws://localhost:9222"
      ]
    }
  }
}
```

**状态**：
- ✅ 端口 9222 已被 Chrome 占用
- ✅ 配置已更新为 `ws://localhost:9222`
- ❌ 连接被 Chrome 拒绝（403 Forbidden）

**问题**：
- Chrome 远程调试需要用户手动批准连接
- 可能需要访问 `chrome://inspect/#devices` 批准

---

## 扩展模式（推荐）

**配置**：
```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "@playwright/mcp@latest",
        "--extension"
      ],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs"
      }
    }
  }
}
```

**优势**：
- ✅ 无需配置远程调试
- ✅ 无需批准连接
- ✅ 配置更简单
- ✅ 直接在已有浏览器中操作

**步骤**：
1. 安装 Playwright MCP Chrome 扩展
   - 访问：https://chrome.google.com/webstore
   - 搜索 "Playwright MCP"
   - 安装

2. 配置扩展 Token
   - 点击扩展图标
   - 输入 Token：`7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs`

3. 连接到已有浏览器
   - 扩展会自动连接到你的 Chrome 浏览器

---

## 切换方案

**从 CDP 模式切换到扩展模式**：

1. 修改 `~/.claude.json`，将 playwright 配置改为扩展模式

2. 安装 Playwright MCP Chrome 扩展

3. 配置扩展 Token

4. 完成！

**从扩展模式切换到 CDP 模式**：

1. 修改 `~/.claude.json`，将 playwright 配置改为 CDP 模式

2. 在 Chrome 中启用远程调试：
   - 访问 `chrome://inspect/#remote-debugging`
   - 启用远程调试
   - 确保端口 9222

3. 在 Chrome 中批准连接（如果有提示）

4. 完成！

---

**推荐**：扩展模式（更简单）
