---
name: playwright-browser
description: |
  使用浏览器 MCP 控制浏览器完成自动化任务。适用场景：网页截图、表单填写、页面内容抓取、UI 自动化测试、网页交互操作等。当用户需要打开网页、点击元素、输入文字、截图、抓取页面数据时触发。
  Triggers: 打开网页、截图、抓取页面、填写表单、点击按钮、自动化测试、爬取数据、网页操作等、番茄数据、番茄分析。
---

# 浏览器控制 Skill

通过浏览器 MCP 工具直接控制浏览器，完成各类网页自动化任务。

---

## 目录

1. [方案对比与选择](#1-方案对比与选择)
2. [⚠️ 会话丢失：根因与解决方案](#2-️-会话丢失根因与解决方案)
3. [Chrome DevTools MCP（推荐）⭐⭐⭐](#3-chrome-devtools-mcp推荐)
4. [番茄小说操作指南](#4-番茄小说操作指南)
5. [Playwright MCP（备选）](#5-playwright-mcp备选)
6. [工具速查表](#6-工具速查表)
7. [详细文档索引](#7-详细文档索引)
8. [注意事项](#8-注意事项)

---

## 1. 方案对比与选择

| 场景 | 推荐方案 | 原因 |
|------|----------|------|
| **番茄小说**（需要登录） | Chrome DevTools MCP | 直接操作已有浏览器，保留登录 Cookie |
| **抓取番茄分析数据** | Chrome DevTools MCP | 必须有登录态才能访问数据页 |
| 爬取公开页面 | Playwright MCP `browser_run_code` | 无需登录态时可用 |
| 截图 / 页面快照 | Chrome DevTools MCP | 直接截图当前浏览器内容 |
| 复杂自动化流程 | Chrome DevTools MCP | 逐步调用，命令间保持状态 |

---

## 2. ⚠️ 会话丢失：根因与解决方案

### 根本原因

#### 原因 A：Playwright MCP `--extension` 模式的分步调用问题

Playwright MCP 在 `--extension` 模式下，**每次单独工具调用相互独立**，调用之间无法保持页面状态：

```
# ❌ 错误示例：分步调用会丢失会话
mcporter call playwright.browser_navigate url="https://fanqienovel.com/main/writer/data"
mcporter call playwright.browser_snapshot   # ← 页面已回到扩展页面，不再是 data 页！
mcporter call playwright.browser_evaluate   # ← 执行环境已丢失
```

#### 原因 B：Playwright MCP 会打开全新浏览器，没有登录 Cookie

Playwright MCP standalone 模式会启动**全新的浏览器实例**，该实例：
- 没有你已登录番茄小说的 Cookie
- 访问需要登录的页面会被重定向到登录页
- 抓取到的"分析数据"实际上是登录页内容，数据丢失

### 解决方案

#### ✅ 方案 A：使用 Chrome DevTools MCP（首选）

Chrome DevTools MCP **直接连接到你正在使用的 Chrome 浏览器**：
- 保留所有已登录的 Cookie 和会话
- 逐步调用命令，状态在调用间持久保持
- 无需担心会话重置

```javascript
// ✅ 正确：Chrome DevTools MCP 每步调用都维持同一个浏览器会话
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/data"
mcporter call chrome-devtools.wait_for timeout=3000
mcporter call chrome-devtools.take_snapshot
mcporter call chrome-devtools.evaluate_script function="() => { return document.title; }"
```

#### ✅ 方案 B：Playwright MCP 使用 `browser_run_code`（备选）

如果必须使用 Playwright MCP，**所有多步操作必须打包在同一个 `browser_run_code` 中**：

```javascript
// ✅ 正确：所有操作在一次调用内完成，页面上下文不丢失
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  const data = await page.evaluate(() => document.body.innerText);
  return data;
}"
```

> ⚠️ 注意：即使使用 `browser_run_code`，Playwright MCP 打开的是新浏览器，**仍然没有番茄小说的登录 Cookie**。抓取番茄分析数据请务必使用 Chrome DevTools MCP。

---

## 3. Chrome DevTools MCP（推荐）

### 核心优势

- ✅ 已验证稳定连接
- ✅ **直接操作已有 Chrome，完整保留登录态**
- ✅ 支持逐步调用，命令间状态持久保持
- ✅ 无需安装 Chrome 扩展

### 配置方法

在 `~/.claude.json` 中添加：

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

### 快速验证

```javascript
// 验证连接和登录状态
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
mcporter call chrome-devtools.evaluate_script function="() => ({
  isLoggedIn: document.body.innerText.includes('帅帅它爸'),
  title: document.title,
  url: window.location.href
})"
```

**期望结果**：
```json
{
  "isLoggedIn": true,
  "title": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "url": "https://fanqienovel.com/main/writer/short-manage"
}
```

**详细指南**：[Chrome DevTools MCP 操作指南](./chrome-devtools/guide.md) | [更多使用示例](./chrome-devtools/examples.md)

---

## 4. 番茄小说操作指南

> 所有番茄小说操作都需要登录态，**必须使用 Chrome DevTools MCP**。

### 4.1 操作前：确认登录状态

```javascript
mcporter call chrome-devtools.evaluate_script function="() => ({
  isLoggedIn: document.body.innerText.includes('帅帅它爸'),
  url: window.location.href
})"
```

若 `isLoggedIn` 为 `false`，请先在 Chrome 浏览器中登录番茄小说（账号：帅帅它爸），再执行后续操作。

---

### 4.2 抓取番茄分析数据

#### 步骤一：导航并探查页面结构

```javascript
// 1. 导航到数据概览页（根据实际 URL 调整）
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/data"

// 2. 等待数据加载完成
mcporter call chrome-devtools.wait_for timeout=3000

// 3. 获取页面快照，分析 DOM 结构（找到正确的选择器）
mcporter call chrome-devtools.take_snapshot
```

#### 步骤二：根据快照提取数据

```javascript
// 根据快照中观察到的实际选择器提取数据
mcporter call chrome-devtools.evaluate_script function="() => {
  // 通用数据行提取（根据快照中的实际类名调整）
  const rows = document.querySelectorAll('[class*=data-item], [class*=stat-item], [class*=overview-item]');
  return Array.from(rows).map(row => ({
    label: row.querySelector('[class*=label], [class*=name], [class*=title]')?.textContent?.trim() || '',
    value: row.querySelector('[class*=value], [class*=number], [class*=count]')?.textContent?.trim() || ''
  })).filter(item => item.label || item.value);
}"
```

#### 步骤三：通过网络请求获取原始数据（更稳定）

当页面数据来自后端 API 时，直接拦截 API 响应比解析 DOM 更稳定：

```javascript
// 1. 先导航到数据页，触发 API 请求
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/data"
mcporter call chrome-devtools.wait_for timeout=3000

// 2. 查看所有网络请求，找到数据 API
mcporter call chrome-devtools.list_network_requests

// 3. 直接调用 API（浏览器会自动携带已登录的 Cookie）
mcporter call chrome-devtools.evaluate_script function="async () => {
  // 将 /api/... 替换为从网络请求中找到的实际 API 路径
  const resp = await fetch('/api/writer/data-overview', {
    credentials: 'include'
  });
  if (!resp.ok) return { error: `HTTP ${resp.status}` };
  return await resp.json();
}"
```

---

### 4.3 抓取短故事列表

```javascript
// 1. 导航到短故事管理页
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 2. 等待加载
mcporter call chrome-devtools.wait_for timeout=3000

// 3. 提取故事列表
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || '',
      read: item.querySelector('.article-item-read')?.textContent.trim() || '',
      wordCount: item.querySelector('.article-item-number')?.textContent.trim() || ''
    });
  });
  return { total: items.length, items };
}"
```

---

### 4.4 分页数据抓取

```javascript
// 1. 导航到第一页
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage?page=1"
mcporter call chrome-devtools.wait_for timeout=2000
mcporter call chrome-devtools.take_snapshot  // 观察分页控件结构

// 2. 提取当前页数据
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = Array.from(document.querySelectorAll('.article-item')).map((item, i) => ({
    index: i + 1,
    title: item.querySelector('.article-item-title')?.textContent.trim() || ''
  }));
  const totalPages = document.querySelector('[class*=total-page], [class*=page-total]')?.textContent?.trim() || '未知';
  return { totalPages, items };
}"

// 3. 如需翻页，点击下一页按钮（根据快照中找到的 uid）
mcporter call chrome-devtools.click uid="下一页按钮的uid"
mcporter call chrome-devtools.wait_for timeout=2000
```

---

## 5. Playwright MCP（备选）

当 Chrome DevTools MCP 不可用时使用。**所有多步操作必须放在同一个 `browser_run_code` 内。**

### 使用限制

- ❌ 打开全新浏览器，**无法访问需要登录的番茄小说页面**
- ❌ 分步调用（`browser_navigate` + `browser_snapshot`）会丢失会话
- ✅ 适合抓取不需要登录的公开页面

### 正确用法

```javascript
// ✅ 所有操作必须在一个 browser_run_code 内完成
mcporter call playwright.browser_run_code code="async (page) => {
  try {
    await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#content', { timeout: 10000 });
    const data = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.item')).map(el => ({
        title: el.querySelector('.title')?.textContent.trim() || '',
        value: el.querySelector('.value')?.textContent.trim() || ''
      }));
    });
    return { success: true, total: data.length, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}"
```

**详细指南**：[标准操作流程](./playwright/workflows.md) | [调试技巧](./playwright/debugging.md) | [扩展安装](./playwright/setup.md)

---

## 6. 工具速查表

### Chrome DevTools MCP 工具

| 工具 | 功能 |
|------|------|
| `navigate_page` | 跳转到指定 URL |
| `take_snapshot` | 获取页面快照（分析 DOM 结构，找选择器） |
| `take_screenshot` | 截图 |
| `click` | 点击页面元素（需要 uid） |
| `type_text` | 在输入框中输入文字 |
| `fill_form` | 批量填写表单字段 |
| `evaluate_script` | 在页面中执行 JavaScript |
| `wait_for` | 等待元素出现或指定时间 |
| `list_network_requests` | 查看所有网络请求（找 API 接口） |
| `list_console_messages` | 查看控制台日志 |
| `handle_dialog` | 处理弹窗（alert / confirm / prompt） |
| `upload_file` | 上传文件 |
| `list_pages` | 列出所有标签页 |
| `select_page` | 切换到指定标签页 |
| `new_page` | 新建标签页 |
| `close_page` | 关闭标签页 |

### Playwright MCP 工具（在 `browser_run_code` 内使用的 API）

| API | 功能 |
|-----|------|
| `page.goto(url, opts)` | 导航到 URL |
| `page.waitForSelector(sel, opts)` | 等待元素出现 |
| `page.waitForTimeout(ms)` | 等待指定毫秒 |
| `page.waitForLoadState(state)` | 等待页面加载状态 |
| `page.evaluate(fn)` | 在页面上下文执行 JavaScript |
| `page.click(sel)` | 点击元素 |
| `page.type(sel, text, opts)` | 模拟键盘输入 |
| `page.fill(sel, text)` | 快速填写输入框 |
| `page.screenshot(opts)` | 截图 |
| `page.title()` | 获取页面标题 |
| `page.url()` | 获取当前 URL |
| `page.content()` | 获取完整页面 HTML |

---

## 7. 详细文档索引

### Chrome DevTools MCP（推荐）⭐⭐⭐

| 文档 | 说明 |
|------|------|
| [Chrome DevTools MCP 操作指南](./chrome-devtools/guide.md) | 完整配置与使用指南 |
| [Chrome DevTools MCP 使用示例](./chrome-devtools/examples.md) | 番茄小说等实用示例 |

### Playwright MCP（备选）

| 文档 | 说明 |
|------|------|
| [Playwright MCP 扩展安装](./playwright/setup.md) | Chrome 扩展安装与配置 |
| [MCP 配置说明 & 模式对比](./playwright/config.md) | 配置文件详解及 CDP vs 扩展模式对比 |
| [标准操作流程](./playwright/workflows.md) | 12 种常用操作流程模板 |
| [调试技巧](./playwright/debugging.md) | 常见问题排查 |
| [使用示例](./playwright/examples.md) | 通用示例集合 |
| [技术文档](./technical-docs.md) | 架构原理与最佳实践 |
| [OpenClaw 浏览器备选方案](./openclaw-browser.md) | 其他备选方案 |

---

## 8. 注意事项

1. **番茄小说操作必须使用 Chrome DevTools MCP**：分析数据、短故事管理等都需要登录态，Playwright MCP 的新浏览器无法访问
2. **避免会话丢失**：Playwright MCP 的多步操作必须在同一个 `browser_run_code` 内完成，不能拆分为多次调用
3. **先 `take_snapshot` 再操作**：操作页面前先获取快照，根据实际 DOM 结构确认选择器，避免用错选择器
4. **写操作风险**：发帖、提交表单等不可逆操作，执行前必须向用户确认
5. **敏感信息保护**：不要在日志或截图中暴露密码、Token、手机号等敏感数据
6. **确保 Chrome 已登录**：执行任何番茄小说操作前，确认 Chrome 中已登录账号"帅帅它爸"