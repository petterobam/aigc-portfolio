# Playwright MCP 安装与配置

**适用场景**：Chrome DevTools MCP 不可用时的备选方案。

> ⚠️ **注意**：Playwright MCP 会打开全新浏览器，无法访问需要登录的番茄小说页面。  
> 需要操作番茄小说请使用 [Chrome DevTools MCP](../chrome-devtools/guide.md)。

---

## 前置条件

- ✅ Chrome 浏览器（版本 >= 144）
- ✅ 已登录番茄小说作者账号（若需操作番茄小说，请使用 Chrome DevTools MCP）

---

## 步骤一：安装 Playwright MCP Chrome 扩展

### 方式 A：从 Chrome Web Store 安装（推荐）

1. 访问 Chrome Web Store：`https://chrome.google.com/webstore`
2. 搜索 **"Playwright MCP"**（由 Microsoft 发布）
3. 点击「添加至 Chrome」→ 确认添加

### 方式 B：从 GitHub 下载 .crx 文件

1. 访问 GitHub Releases：`https://github.com/microsoft/playwright-mcp/releases`
2. 下载最新版本的 `.crx` 文件
3. 打开 `chrome://extensions/`，开启右上角「开发者模式」
4. 将 `.crx` 文件拖拽到扩展页面完成安装

---

## 步骤二：配置 Token

1. 点击浏览器工具栏的拼图图标 🧩，找到 **Playwright MCP** 扩展
2. 点击扩展图标，打开配置面板
3. 输入 Token：

   ```
   7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs
   ```

4. 点击「保存」或「连接」
5. 扩展图标应显示为激活状态（蓝色或绿色 🟢）

---

## 步骤三：配置 MCP

在 `~/.claude.json` 中添加（或使用 `mcp-config.json` 中的配置）：

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

> 配置文件位置：[../mcp-config.json](../mcp-config.json)

---

## 步骤四：验证连接

```bash
mcporter list playwright
```

应该显示 playwright 服务器的工具列表（22+ 个工具）。

测试连接：

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  return { title: await page.title(), url: page.url() };
}"
```

---

## Extension 模式 vs CDP 模式

| 特性 | Extension 模式（当前） | CDP 模式 |
|------|----------------------|----------|
| 需要手动授权 | ✅ 不需要 | ❌ 每次需要 |
| 需要配置远程调试端口 | ✅ 不需要 | ❌ 需要 |
| 配置复杂度 | 🟢 简单 | 🟡 中等 |
| 多步调用保持会话 | ❌ 不支持，需用 `browser_run_code` | ⚠️ 有限支持 |

详细对比见：[config.md](./config.md)

---

## 常见问题

**Q: 扩展无法连接？**  
A: 检查 Token 是否与 `~/.claude.json` 中一致；在 `chrome://extensions/` 确认扩展已启用；必要时重启 Chrome。

**Q: 扩展图标显示未激活？**  
A: 刷新 `chrome://extensions/` 页面，或重启 Chrome 浏览器后重新配置 Token。

**Q: `mcporter list playwright` 显示工具数量为 0？**  
A: 确认 `~/.claude.json` 配置正确，Token 与扩展中一致，且扩展处于激活状态。

**Q: 提示 Chrome 版本过低？**  
A: 将 Chrome 更新到 >= 144 版本。

**Q: 多步操作会丢失页面状态？**  
A: Extension 模式下每次单独工具调用相互独立，所有多步操作必须放在同一个 `browser_run_code` 内。详见 [SKILL.md 会话丢失章节](../SKILL.md#2-️-会话丢失根因与解决方案)。

---

**返回**：[SKILL.md](../SKILL.md)