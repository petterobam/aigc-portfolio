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
2. ✅ 支持逐步调用，命令间状态持久保持
3. ✅ 直接在已有浏览器中操作（账号：帅帅它爸）
4. ✅ 完整保留登录 Cookie，无需重新登录
5. ✅ 配置简单，无需扩展和 Token

---

## 📋 使用示例

### 示例 1：检查登录状态

```javascript
// 导航到番茄小说
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 检查登录状态
mcporter call chrome-devtools.evaluate_script function="() => ({
  isLoggedIn: document.body.innerText.includes('帅帅它爸'),
  pageTitle: document.title,
  url: window.location.href
})"
```

**预期结果**：
```json
{
  "isLoggedIn": true,
  "pageTitle": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "url": "https://fanqienovel.com/main/writer/short-manage"
}
```

---

### 示例 2：提取短故事数据

```javascript
// 1. 导航到短故事管理页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage"

// 2. 等待页面加载
mcporter call chrome-devtools.wait_for timeout=3000

// 3. 获取页面快照（分析 DOM 结构）
mcporter call chrome-devtools.take_snapshot

// 4. 提取数据
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || '',
      read: item.querySelector('.article-item-read')?.textContent.trim() || '',
      wordCount: item.querySelector('.article-item-number')?.textContent.trim() || '',
      time: item.querySelector('.article-item-time')?.textContent.trim() || ''
    });
  });
  return { total: items.length, items };
}"
```

**预期结果**：
```json
{
  "total": 10,
  "items": [
    { "index": 1, "title": "故事标题", "read": "1234", "wordCount": "2000字", "time": "2026-03-21" }
  ]
}
```

---

### 示例 3：抓取数据分析页

```javascript
// 1. 导航到数据概览页
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/data"

// 2. 等待数据加载
mcporter call chrome-devtools.wait_for timeout=3000

// 3. 获取快照，分析页面结构
mcporter call chrome-devtools.take_snapshot

// 4. 提取数据指标
mcporter call chrome-devtools.evaluate_script function="() => {
  const rows = document.querySelectorAll('[class*=data-item], [class*=stat-item], [class*=overview-item]');
  return Array.from(rows).map(row => ({
    label: row.querySelector('[class*=label], [class*=name]')?.textContent?.trim() || '',
    value: row.querySelector('[class*=value], [class*=number]')?.textContent?.trim() || ''
  })).filter(item => item.label || item.value);
}"
```

---

### 示例 4：通过网络请求获取原始数据

当页面数据来自后端 API 时，直接调用 API 比解析 DOM 更稳定：

```javascript
// 1. 导航到数据页，触发 API 请求
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/data"
mcporter call chrome-devtools.wait_for timeout=3000

// 2. 查看网络请求，找到数据 API 的实际路径
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

---

### 示例 5：填写表单并提交

```javascript
// 1. 导航到新建短故事页面
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1"

// 2. 等待页面加载，获取快照
mcporter call chrome-devtools.wait_for timeout=3000
mcporter call chrome-devtools.take_snapshot

// 3. 输入文字（根据快照中找到的输入框 uid）
mcporter call chrome-devtools.type_text text="这是故事标题"

// 4. 点击下一步（根据快照找到的按钮 uid）
mcporter call chrome-devtools.click uid="按钮的uid"

// 5. 等待操作完成
mcporter call chrome-devtools.wait_for timeout=2000
```

---

### 示例 6：分页数据抓取

```javascript
// 第一页
mcporter call chrome-devtools.navigate_page url="https://fanqienovel.com/main/writer/short-manage?page=1"
mcporter call chrome-devtools.wait_for timeout=2000
mcporter call chrome-devtools.evaluate_script function="() => {
  const items = Array.from(document.querySelectorAll('.article-item')).map((el, i) => ({
    index: i + 1,
    title: el.querySelector('.article-item-title')?.textContent.trim() || ''
  }));
  const totalPages = document.querySelector('[class*=total-page]')?.textContent?.trim() || '1';
  return { totalPages, pageItems: items };
}"

// 翻到第二页（先用 take_snapshot 找到翻页按钮 uid）
mcporter call chrome-devtools.take_snapshot
mcporter call chrome-devtools.click uid="下一页按钮uid"
mcporter call chrome-devtools.wait_for timeout=2000
```

---

### 示例 7：截图

```javascript
// 截取当前视口
mcporter call chrome-devtools.take_screenshot

// 截取完整页面
mcporter call chrome-devtools.take_screenshot fullPage=true
```

---

### 示例 8：多标签页操作

```javascript
// 列出所有打开的标签页
mcporter call chrome-devtools.list_pages

// 切换到指定标签页（使用 list_pages 返回的 id）
mcporter call chrome-devtools.select_page id="标签页id"

// 新建标签页
mcporter call chrome-devtools.new_page url="https://fanqienovel.com"

// 关闭当前标签页
mcporter call chrome-devtools.close_page
```

---

## ❌ 不要使用旧的方式

### Playwright MCP 独立命令（会话丢失）

```javascript
// ❌ 错误：分步调用导致会话丢失
mcporter call playwright.browser_navigate url="https://fanqienovel.com/main/writer/data"
mcporter call playwright.browser_snapshot   // 页面已不在 data 页！
```

### Playwright MCP browser_run_code（无登录 Cookie）

```javascript
// ❌ 对番茄小说无效：新浏览器没有登录 Cookie
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://fanqienovel.com/main/writer/data');
  // 会被重定向到登录页，抓不到分析数据
}"
```

---

## 🎯 最佳实践

1. **先 `take_snapshot` 再操作**：获取快照后才能知道正确的元素 uid 和选择器
2. **用 `list_network_requests` 找 API**：比解析 DOM 更稳定，适合抓结构化数据
3. **`wait_for` 等数据加载**：动态页面需要等待数据渲染完成再提取
4. **每次操作前确认登录态**：用 `evaluate_script` 检查是否包含用户名

---

**返回**：[SKILL.md](../SKILL.md)