---
name: playwright-browser
description: |
  使用浏览器 MCP 控制浏览器完成自动化任务。适用场景：网页截图、表单填写、页面内容抓取、UI 自动化测试、网页交互操作等。当用户需要打开网页、点击元素、输入文字、截图、抓取页面数据时触发。
  Triggers: 打开网页、截图、抓取页面、填写表单、点击按钮、自动化测试、爬取数据、网页操作等。
---

# 浏览器控制 Skill

通过浏览器 MCP 工具直接控制浏览器，完成各类网页自动化任务。

---

## ⭐ 推荐方案：Chrome DevTools MCP（已验证稳定）⭐⭐⭐

**Chrome DevTools MCP** 已验证稳定连接（2026-03-21 01:38）

**核心优势**：
- ✅ 已验证稳定连接
- ✅ 支持长连接，无需担心连接断开
- ✅ 可以使用单独命令（如 `navigate_page`、`take_snapshot`）
- ✅ 直接在已有浏览器中操作（账号：帅帅它爸）
- ✅ 配置简单，无需扩展和 Token

### 快速开始

**1. 配置 MCP**：
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp@latest",
        "--autoConnect",
        "--channel=stable"
      ]
    }
  }
}
```

**2. 验证登录**：
```javascript
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
mcporter call chrome-devtools.evaluate_script function="() => {
  return {
    isLoggedIn: document.body.innerText.includes('帅帅它爸')
  };
}"
```

**详细文档**：[Chrome DevTools MCP 操作指南](./chrome-devtools-mcp.md)

---

## ⚠️ 备选方案：Playwright MCP

**Playwright MCP** 需要安装 Chrome 扩展，不支持长连接。

**限制**：
- ❌ CDP 连接被拒绝（403 Forbidden）
- ❌ 不支持长连接
- ❌ 不能使用单独命令
- ⚠️ 需要配置 Chrome 扩展和 Token

---

## 番茄小说自动化示例（使用 Chrome DevTools MCP）

### 示例 1：检查登录状态

```javascript
// 导航到短故事管理页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 检查登录状态
mcporter call chrome-devtools.evaluate_script function="() => {
  return {
    isLoggedIn: document.body.innerText.includes('帅帅它爸'),
    userName: '帅帅它爸'
  };
}"
```

**验证结果**（已验证）：
```json
{
  "isLoggedIn": true,
  "userName": "帅帅它爸",
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台"
}
```

### 示例 2：提取短故事数据

```javascript
// 1. 导航到页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 2. 获取页面快照
mcporter call chrome-devtools.take_snapshot

// 3. 提取数据
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || '',
      read: item.querySelector('.article-item-read')?.textContent.trim() || ''
    });
  });
  return items;
}"
```

---

## Chrome DevTools MCP 可用工具

| 工具 | 功能 |
|------|------|
| `navigate_page` | 跳转到指定 URL |
| `take_snapshot` | 获取页面快照（分析页面结构） |
| `take_screenshot` | 截图 |
| `click` | 点击页面元素 |
| `type_text` | 在输入框中输入文字 |
| `fill_form` | 批量填写表单字段 |
| `evaluate_script` | 在页面执行 JavaScript |
| `wait_for` | 等待元素或时间 |
| `list_network_requests` | 查看所有网络请求 |
| `list_console_messages` | 查看控制台日志 |
| `handle_dialog` | 处理弹窗（alert/confirm/prompt） |
| `upload_file` | 上传文件 |
| `list_pages` | 管理浏览器标签页 |
| `select_page` | 选择页面 |
| `new_page` | 新建标签页 |
| `close_page` | 关闭标签页 |

---

## 详细文档

### Chrome DevTools MCP（推荐）⭐⭐⭐
- [Chrome DevTools MCP 操作指南](./chrome-devtools-mcp.md) - 完整使用指南
- [Chrome 扩展安装](./chrome-extension-setup.md) - （不适用于 Chrome DevTools MCP）

### Playwright MCP（备选）
- [Playwright MCP 指南](./SKILL-playwright.md) - 完整使用指南
- [MCP 配置详解](./mcp-config.md) - 配置说明
- [Chrome 扩展安装](./chrome-extension-setup.md) - 扩展安装指南
- [使用示例](./examples.md) - 使用示例集合
- [标准操作流程](./standard-workflows.md) - 12 种操作流程
- [调试技巧](./debugging.md) - 调试技巧
- [技术文档](./technical-docs.md) - 架构和最佳实践
- [OpenClaw 浏览器系统](./openclaw-browser.md) - 备选方案

---

## 注意事项

1. **推荐使用 Chrome DevTools MCP**：已验证稳定连接
2. **在已有浏览器中操作**：不打开新浏览器
3. **确保 Chrome 已登录番茄小说**：账号"帅帅它爸"
4. **写操作风险**：发帖、提交表单等不可逆操作，执行前必须向用户确认
5. **敏感信息**：不要在日志中暴露密码、Token 等敏感数据
