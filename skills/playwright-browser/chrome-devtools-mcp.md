# Chrome DevTools MCP 操作指南

## 概述

**Chrome DevTools MCP** 是一个支持长连接的浏览器控制 MCP 服务器。

**推荐指数**：⭐⭐⭐（已验证稳定）

**核心优势**：
- ✅ 已验证稳定连接（2026-03-21）
- ✅ 支持长连接，无需担心连接断开
- ✅ 可以使用单独命令（如 `navigate_page`、`take_snapshot`）
- ✅ 直接在已有浏览器中操作（账号：帅帅它爸）
- ✅ 配置简单，无需扩展和 Token

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
mcporter call chrome-devtools.evaluate_script function="() => {
  const bodyText = document.body.innerText;
  return {
    isLoggedIn: bodyText.includes('帅帅它爸'),
    userName: '帅帅它爸',
    pageTitle: document.title
  };
}"
```

**期望结果**：
```json
{
  "isLoggedIn": true,
  "userName": "帅帅它爸",
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台"
}
```

---

## 使用示例

### 示例 1：导航到番茄小说

```javascript
// 导航到短故事管理页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 获取页面快照
mcporter call chrome-devtools.take_snapshot

// 检查登录状态
mcporter call chrome-devtools.evaluate_script function="() => {
  const bodyText = document.body.innerText;
  return {
    isLoggedIn: bodyText.includes('帅帅它爸'),
    userName: '帅帅它爸'
  };
}"
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

## 可用工具

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

## 登录验证

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

**结论**：✅ 成功在已有浏览器中操作

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

---

**返回**：[SKILL.md](./SKILL.md)
