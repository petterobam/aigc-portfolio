# Chrome DevTools MCP 操作指南

## 概述

**Chrome DevTools MCP** 是一个支持长连接的浏览器控制 MCP 服务器。

**推荐指数**：⭐⭐⭐（已验证稳定）

**核心优势**：
- ✅ 已验证稳定连接（2026-03-21）
- ✅ **直接操作已有 Chrome，完整保留登录态**
- ✅ 支持逐步调用，命令间状态持久保持
- ✅ 配置简单，无需安装 Chrome 扩展

---

## 快速开始

### 1. 配置 MCP

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

### 2. 验证连接

```bash
mcporter list
```

应该能看到 `chrome-devtools` 服务器。

### 3. 验证登录

```javascript
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

---

## 使用示例

### 示例 1：导航并截图

```javascript
// 导航到页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 等待加载
mcporter call chrome-devtools.wait_for timeout=2000

// 截图
mcporter call chrome-devtools.take_screenshot

// 获取页面快照（分析 DOM 结构）
mcporter call chrome-devtools.take_snapshot
```

### 示例 2：提取页面数据

```javascript
// 1. 导航到页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 2. 等待加载
mcporter call chrome-devtools.wait_for timeout=3000

// 3. 获取快照，观察 DOM 结构，找到正确的选择器
mcporter call chrome-devtools.take_snapshot

// 4. 提取数据
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || '',
      read: item.querySelector('.article-item-read')?.textContent.trim() || ''
    });
  });
  return { total: items.length, items };
}"
```

### 示例 3：通过 API 获取数据（更稳定）

```javascript
// 1. 导航到数据页，触发 API 请求
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/data"
mcporter call chrome-devtools.wait_for timeout=3000

// 2. 查看网络请求，找到数据 API 路径
mcporter call chrome-devtools.list_network_requests

// 3. 直接调用 API（浏览器自动携带已登录的 Cookie）
mcporter call chrome-devtools.evaluate_script function="async () => {
  const resp = await fetch('/api/writer/data-overview', {
    credentials: 'include'
  });
  if (!resp.ok) return { error: `HTTP ${resp.status}` };
  return await resp.json();
}"
```

### 示例 4：填写表单并提交

```javascript
// 1. 导航到表单页
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/publish-short/"
mcporter call chrome-devtools.wait_for timeout=3000

// 2. 获取快照，找到表单元素的 uid
mcporter call chrome-devtools.take_snapshot

// 3. 在输入框中输入文字（uid 从快照中获取）
mcporter call chrome-devtools.type_text uid="输入框uid" text="标题内容"

// 4. 点击提交按钮（uid 从快照中获取）
mcporter call chrome-devtools.click uid="提交按钮uid"

// 5. 等待提交完成
mcporter call chrome-devtools.wait_for timeout=2000
```

---

## 可用工具

| 工具 | 功能 |
|------|------|
| `navigate_page` | 跳转到指定 URL |
| `take_snapshot` | 获取页面快照（分析 DOM 结构，找选择器 uid） |
| `take_screenshot` | 截图 |
| `click` | 点击页面元素（需要 uid） |
| `type_text` | 在输入框中输入文字（需要 uid） |
| `fill_form` | 批量填写表单字段 |
| `evaluate_script` | 在页面中执行 JavaScript |
| `wait_for` | 等待元素出现或指定时间 |
| `list_network_requests` | 查看所有网络请求（用于找 API 接口） |
| `list_console_messages` | 查看控制台日志 |
| `handle_dialog` | 处理弹窗（alert / confirm / prompt） |
| `upload_file` | 上传文件 |
| `list_pages` | 列出所有标签页 |
| `select_page` | 切换到指定标签页 |
| `new_page` | 新建标签页 |
| `close_page` | 关闭标签页 |

---

## 配置说明

### 参数说明

- `--autoConnect`：自动连接到正在运行的 Chrome 实例
- `--channel=stable`：使用 Chrome 稳定版（推荐）
  - `stable`：稳定版（推荐）
  - `beta`：测试版
  - `dev`：开发版

### 注意事项

1. **必须在 Chrome 浏览器运行时使用**
2. **直接在已有浏览器中操作，不打开新浏览器**
3. **确保 Chrome 已登录番茄小说（账号：帅帅它爸）**
4. **先 `take_snapshot` 再操作**：通过快照找到元素的 uid，再执行点击/输入

---

## 登录验证记录

**验证时间**：2026-03-21 01:38

**验证结果**：
```json
{
  "isLoggedIn": true,
  "userName": "帅帅它爸",
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "currentUrl": "https://fanqienovel.com/main/writer/short-manage"
}
```

**结论**：✅ 成功在已有浏览器中操作，登录态完整保留

---

**返回**：[SKILL.md](../SKILL.md)