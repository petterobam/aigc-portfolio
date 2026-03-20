# MCP 配置详解

## 配置文件

**位置**：[`../mcp-config.json`](../mcp-config.json)

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--extension"],
      "env": {
        "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs"
      }
    }
  }
}
```

## 配置说明

### 1. `command`
- **值**：`npx`
- **说明**：使用 npx 执行 Playwright MCP

### 2. `args`
- **值**：`["@playwright/mcp@latest", "--extension"]`
- **说明**：
  - `@playwright/mcp@latest`：Playwright MCP 包名
  - `--extension`：使用扩展模式（复用浏览器登录状态）

### 3. `env`
- **PLAYWRIGHT_MCP_EXTENSION_TOKEN**：扩展通信鉴权 Token
- **说明**：需与 Chrome 扩展中配置的 Token 保持一致

## 启动方式

将 `mcp-config.json` 中的内容添加到你的 MCP 客户端配置（如 Zed、Claude Desktop 等）即可。

---

**返回**：[SKILL.md](./SKILL.md)
