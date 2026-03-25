# Playwright MCP 配置详解

## 当前推荐配置：扩展模式（Extension）

**配置文件位置**：[`../mcp-config.json`](../mcp-config.json)

将以下内容添加到 `~/.claude.json` 的 `mcpServers` 字段中：

```json
{
  "mcpServers": {
    "playwright": {
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

### 配置字段说明

| 字段 | 值 | 说明 |
|------|----|------|
| `command` | `npx` | 使用 npx 执行 Playwright MCP |
| `args[0]` | `@playwright/mcp@latest` | Playwright MCP 包名 |
| `args[1]` | `--extension` | 使用 Chrome 扩展模式 |
| `env.PLAYWRIGHT_MCP_EXTENSION_TOKEN` | Token 字符串 | 与 Chrome 扩展中配置的 Token 必须一致 |

---

## 两种连接模式对比

| 特性 | CDP 模式 | 扩展模式（推荐） |
|------|----------|-----------------|
| 配置复杂度 | 🟡 中等（需开启远程调试端口） | 🟢 简单 |
| 需要手动批准连接 | ❌ 每次都需要 | ✅ 不需要 |
| Token 认证 | ❌ 无 | ✅ 有 |
| 连接稳定性 | ⚠️ 可能被 Chrome 拒绝（403） | ✅ 稳定 |
| 会话保持 | ⚠️ 单次调用独立 | ⚠️ 单次调用独立 |

> ⚠️ 无论哪种模式，Playwright MCP 的多步操作都必须在同一个 `browser_run_code` 内完成。如需复用已登录的 Chrome 会话，请改用 Chrome DevTools MCP。

---

## 扩展模式（当前配置）

### 优势
- ✅ 无需配置 Chrome 远程调试端口
- ✅ 无需每次手动批准连接
- ✅ 配置一次，长期有效

### 前提条件
已安装并配置好 Playwright MCP Chrome 扩展。详见 [扩展安装指南](./setup.md)。

---

## CDP 模式（备用，不推荐）

如需连接到已在运行的 Chrome 实例（端口 9222），可使用 CDP 模式：

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

### 已知问题

- Chrome 远程调试需要用户**手动批准**连接（`chrome://inspect/#devices`）
- 某些情况下 Chrome 会返回 **403 Forbidden** 拒绝连接
- 需要 Chrome 以 `--remote-debugging-port=9222` 参数启动

### 如何启用 Chrome 远程调试

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222

# 或在 Chrome 设置中开启
# 访问：chrome://inspect/#remote-debugging
```

---

## 切换连接模式

### 从 CDP 模式切换到扩展模式

1. 修改 `~/.claude.json`，替换 playwright 配置为扩展模式配置（见上方）
2. 确认 Playwright MCP Chrome 扩展已安装并激活
3. 重启 MCP 客户端（如 Claude Desktop）

### 从扩展模式切换到 CDP 模式

1. 修改 `~/.claude.json`，替换为 CDP 模式配置（见上方）
2. 确保 Chrome 以远程调试模式启动（端口 9222）
3. 访问 `chrome://inspect/#devices` 批准连接提示
4. 重启 MCP 客户端

---

**返回**：[SKILL.md](../SKILL.md)