# Chrome DevTools MCP 使用示例

## 概述

**Chrome DevTools MCP** 已验证稳定连接，可以直接在已有浏览器中操作，无需打开新浏览器。

**验证结果**（2026-03-21 01:38）：
```json
{
  "isLoggedIn": true,
  "userName": "帅帅它爸",
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "currentUrl": "https://fanqienovel.com/main/writer/short-manage"
}
```

---

## ✅ 使用 Chrome DevTools MCP 的优势

1. ✅ 已验证稳定连接
2. ✅ 支持长连接，无需担心连接断开
3. ✅ 可以使用单独命令（如 `navigate_page`、`take_snapshot`）
4. ✅ 直接在已有浏览器中操作（账号：帅帅它爸）
5. ✅ 配置简单，无需扩展和 Token

---

## 📋 使用示例

### 示例 1：检查登录状态

```javascript
// 导航到番茄小说
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 检查登录状态
mcporter call chrome-devtools.evaluate_script function="() => {
  const bodyText = document.body.innerText;
  return {
    isLoggedIn: bodyText.includes('帅帅它爸'),
    userName: '帅帅它爸',
    pageTitle: document.title
  };
}"
```

**预期结果**：
```json
{
  "isLoggedIn": true,
  "userName": "帅帅它爸",
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台"
}
```

---

### 示例 2：提取短故事数据

```javascript
// 1. 导航到短故事管理页面
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
      read: item.querySelector('.article-item-read')?.textContent.trim() || '',
      wordCount: item.querySelector('.article-item-number')?.textContent.trim() || ''
    });
  });
  return items;
}"
```

**预期结果**：
```json
{
  "totalStories": 10,
  "items": [...]
}
```

---

### 示例 3：填写表单并提交

```javascript
// 1. 导航到新建短故事页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1"

// 2. 等待页面加载
mcporter call chrome-devtools.wait_for timeout=3000

// 3. 填写标题
mcporter call chrome-devtools.type_text text="这是标题"

// 4. 点击下一步
mcporter call chrome-devtools.click uid="1_1"  // 需要先获取快照找到 uid

// 5. 等待提交完成
mcporter call chrome-devtools.wait_for timeout=3000
```

---

### 示例 4：获取页面快照

```javascript
// 获取完整页面快照
mcporter call chrome-devtools.take_snapshot verbose=true

// 只截图特定元素
mcporter call chrome-devtools.take_screenshot fullPage=false uid="1_1"
```

---

## ❌ 不要使用旧的方式

### Playwright MCP（旧方式，会打开新浏览器）

```javascript
// ❌ 错误：会打开新浏览器
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });
  // ...
}"
```

**问题**：
- 每次都会打开新的浏览器窗口
- 无法复用已有登录状态
- 连接不稳定，容易断开

---

## 📝 更新 task-list.md 的建议

### 将以下任务从 Playwright MCP 改为 Chrome DevTools MCP

**旧方式**（task-list.md 中可能存在的）：
- ✅ 研究番茄小说发布页面分析（可能使用 playwright.browser_run_code）
- ✅ 开发V3发布器（可能使用 playwright.browser_run_code）
- ✅ 测试页面类型检测（可能使用 playwright.browser_run_code）

**新方式**（Chrome DevTools MCP）：
```javascript
// ✅ 检查番茄小说登录状态
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
mcporter call chrome-devtools.evaluate_script function="() => {
  return document.body.innerText.includes('帅帅它爸');
}"

// ✅ 提取短故事列表
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || ''
    });
  });
  return items;
}"
```

---

## 🎯 最佳实践

### 1. 使用单独命令（推荐）

对于简单的操作，使用单独命令更直观：

```javascript
// ✅ 推荐：使用单独命令
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
mcporter call chrome-devtools.take_snapshot
mcporter call chrome-devtools.evaluate_script function="..."
```

### 2. 组合操作

如果需要多个步骤，可以在一个 `evaluate_script` 中完成：

```javascript
mcporter call chrome-devtools.evaluate_script function="async () => {
  // 导航
  window.location.href = 'https://fanqienovel.com/main/writer/short-manage';
  await new Promise(r => setTimeout(r, 2000)); // 等待页面加载

  // 提取数据
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || ''
    });
  });

  return items;
}"
```

---

## 📄 相关文档

- **Chrome DevTools MCP 操作指南**：`skills/playwright-browser/chrome-devtools-mcp.md`
- **浏览器自动化 Skill**：`skills/playwright-browser/SKILL.md`
- **任务列表**：`skills/heartbeat/task-list.md`

---

**更新时间**：2026-03-21 01:38
**验证状态**：✅ 已验证 Chrome DevTools MCP 稳定连接
