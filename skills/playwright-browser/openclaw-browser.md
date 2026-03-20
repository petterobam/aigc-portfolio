# OpenClaw 浏览器系统（备选方案）

## 概述

OpenClaw 有自己的浏览器配置系统，但**我们推荐直接使用 Playwright MCP**。

### OpenClaw 浏览器系统 vs Playwright MCP

| 特性 | Playwright MCP | OpenClaw 浏览器系统 |
|------|----------------|---------------------|
| 复用登录状态 | ✅ 支持（--extension 模式） | ⚠️ 复杂（需要配置） |
| 配置简单性 | ✅ 简单（直接 mcporter call） | ❌ 复杂（需要配置 profile） |
| 使用便捷性 | ✅ 便捷（一次调用完成） | ⚠️ 复杂（多步操作） |
| 浏览器控制 | 复用现有浏览器会话 | 专用浏览器实例 |

**结论**：对于番茄小说自动化（需要登录），**推荐使用 Playwright MCP + --extension 模式**。

---

## OpenClaw 支持的三种浏览器 Profile Driver

### 1. `openclaw` Profile

**特点**：
- OpenClaw 管理的专用浏览器（默认）
- 完全隔离，不影响用户的日常浏览器
- 使用 CDP 端口（默认 18800）

**适用场景**：
- 需要频繁自动化的场景
- 不需要复用登录状态

**使用方式**：
```bash
# 启动浏览器
openclaw browser --browser-profile openclaw start

# 导航到页面
openclaw browser --browser-profile openclaw navigate https://example.com

# 获取页面快照
openclaw browser --browser-profile openclaw snapshot

# 关闭浏览器
openclaw browser --browser-profile openclaw stop
```

### 2. `existing-session` Profile

**特点**：
- 现有的 Chrome 会话（使用 Chrome DevTools MCP）
- 复用现有 Chrome 登录状态
- 使用 `chrome-mcp` transport

**适用场景**：
- 需要使用已登录会话的场景
- 需要复用用户 Chrome 的登录状态

**使用方式**：
```bash
# 启动浏览器
openclaw browser --browser-profile user start

# 导航到页面
openclaw browser --browser-profile user navigate https://fanqienovel.com/page/short-story

# 获取页面快照
openclaw browser --browser-profile user snapshot

# 关闭浏览器
openclaw browser --browser-profile user stop
```

### 3. `chrome-relay` Profile

**特点**：
- 通过 Chrome 扩展连接
- 用户需要手动点击扩展图标来连接
- 扩展中继模式

**适用场景**：
- 需要临时控制某个标签页的场景
- 不需要完全自动化

**使用方式**：
```bash
# 获取快照（需要用户手动点击扩展图标）
openclaw browser --browser-profile chrome-relay snapshot
```

---

## 内置 Profile 状态

- `openclaw`: stopped（默认，OpenClaw 管理的浏览器）
- `user`: stopped（existing-session, transport: chrome-mcp，复用用户的 Chrome）
- `chrome-relay`: running（extension，扩展中继）

---

## 启用 Chrome 远程调试（user profile）

如果使用 `user` profile，需要启用 Chrome 远程调试。

### 步骤

1. 打开 Chrome 远程调试页面：
   ```
   chrome://inspect/#remote-debugging
   ```

2. 启用远程调试：
   - 点击 "Configure..."
   - 添加 localhost 端口范围（如 9222-9333）
   - 点击 "Done"

3. 保持 Chrome 运行

4. 运行 OpenClaw 浏览器命令：
   ```bash
   openclaw browser --browser-profile user start
   ```

5. 批准连接提示（Chrome 会弹窗询问是否允许连接）

### 注意事项

- Chrome 版本需要 >= 144
- 每次连接可能需要用户批准
- 如果不需要复用登录状态，建议使用 `openclaw` profile

---

## 推荐使用方式

### 场景 1：番茄小说自动化（需要登录）

**推荐**：使用 Playwright MCP + Chrome 扩展 ⭐⭐⭐

**备选**：使用 `user` profile
```bash
# 使用 user profile（复用 Chrome 登录状态）
openclaw browser --browser-profile user start
openclaw browser --browser-profile user navigate https://fanqienovel.com/page/short-story
openclaw browser --browser-profile user snapshot
```

### 场景 2：一般网页自动化（不需要登录）

**推荐**：使用 `openclaw` profile
```bash
# 使用 openclaw profile（隔离的浏览器）
openclaw browser --browser-profile openclaw start
openclaw browser --browser-profile openclaw navigate https://example.com
openclaw browser --browser-profile openclaw snapshot
```

### 场景 3：临时控制某个标签页

**推荐**：使用 `chrome-relay` profile
```bash
# 使用 chrome-relay profile（扩展中继）
openclaw browser --browser-profile chrome-relay snapshot
```

---

## 配置文件

OpenClaw 浏览器配置文件通常位于：
```
~/.openclaw/config/browser.yaml
```

### 示例配置

```yaml
browser_profiles:
  openclaw:
    driver: cdp
    port: 18800
    headless: false

  user:
    driver: chrome-mcp
    transport: chrome-mcp
    headless: false

  chrome-relay:
    driver: extension
    headless: false
```

---

## 常见问题

### Q: user profile 无法连接？

**A**: 检查以下几点：
1. Chrome 远程调试是否已启用
2. Chrome 版本是否 >= 144
3. 是否批准了连接提示
4. Chrome 是否正在运行

### Q: openclaw profile 启动失败？

**A**: 检查以下几点：
1. 端口 18800 是否被占用
2. OpenClaw 服务是否正常运行
3. 查看日志文件了解详细错误

### Q: chrome-relay profile 无法连接？

**A**: 检查以下几点：
1. Chrome 扩展是否已安装
2. 扩展是否已激活
3. 是否点击了扩展图标连接

---

## 迁移到 Playwright MCP

如果你正在使用 OpenClaw 浏览器系统，建议迁移到 Playwright MCP。

### 优势

- 配置更简单
- 使用更便捷
- 性能更好
- 社区支持更强

### 迁移步骤

1. 安装 Playwright MCP 扩展
2. 配置 `mcp-config.json`
3. 使用 `mcporter call playwright.browser_run_code` 替代 OpenClaw 浏览器命令

### 示例对比

**OpenClaw 方式**：
```bash
openclaw browser --browser-profile user start
openclaw browser --browser-profile user navigate https://fanqienovel.com/main/writer/short-manage
openclaw browser --browser-profile user snapshot
```

**Playwright MCP 方式**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const data = await page.evaluate(() => {
    return document.body.innerText;
  });
  return data;
}"
```

---

**返回**：[SKILL.md](./SKILL.md)
