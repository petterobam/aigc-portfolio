# 调试技巧

---

## 快速排查清单

| 现象 | 可能原因 | 解决方法 |
|------|----------|----------|
| 导航到番茄小说后跳转到登录页 | `browser_run_code` 用了新浏览器，无 Cookie | GLM Agent 改用 `exec` + 脚本；Claude/Cline 用个人工具 |
| 每次运行都需要重新登录 | 用户数据目录不一致或被清除 | 确认脚本用的 `USER_DATA_DIR` 是固定路径 `data/chrome-user-data/` |
| 脚本执行超时 | 页面加载慢 / 元素未出现 | 增大 `timeout`，或换 `waitUntil: 'domcontentloaded'` |
| 元素找不到（选择器失效） | 页面结构变化 / 选择器过时 | 先截图，再用 `page.evaluate` 打印 HTML 结构确认 |
| 个人工具 `ref` 不存在 | 快照过期，页面已更新 | 重新执行 `browser_snapshot` 获取新的 `ref` |
| `browser_run_code` 数据为空 | 动态内容未加载 | 加 `waitForSelector` 等待关键元素出现 |
| 脚本运行报 `playwright not found` | 依赖未安装 | `cd /Users/oyjie/.openclaw/workspace && npm install` |

---

## 一、GLM Agent 脚本调试

### 1. 确认登录状态

```bash
cd /Users/oyjie/.openclaw/workspace
node scripts/check-fanqie-login.js
```

如果登录失效，重新登录：

```bash
node scripts/login-save-cookies.js
```

---

### 2. 确认用户数据目录存在

```bash
ls -la /Users/oyjie/.openclaw/workspace/data/chrome-user-data/
```

如果目录为空或不存在，首次运行任意脚本时会自动创建，并提示手动登录。

---

### 3. 脚本执行失败时保存现场

在脚本的 `catch` 块中加截图和日志：

```javascript
} catch (error) {
  console.error('执行失败:', error.message);
  // 截图保留现场
  const screenshot = `/tmp/error-${Date.now()}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });
  console.log('错误截图:', screenshot);
  // 打印当前 URL
  console.log('当前 URL:', page.url());
} finally {
  await browser.close();
}
```

---

### 4. 验证选择器是否正确

在脚本中加入结构探查（首次开发时用）：

```javascript
// 打印页面关键元素
const debug = await page.evaluate(() => {
  const items = document.querySelectorAll('.short-article-table-item');
  return {
    itemCount: items.length,
    firstItemHtml: items[0]?.outerHTML?.slice(0, 500) || '无元素',
    pageTitle: document.title,
    url: window.location.href,
  };
});
console.log('调试信息:', JSON.stringify(debug, null, 2));
```

---

### 5. 通过网络请求找 API（更稳定的数据获取方式）

```javascript
// 监听 API 请求
const apiCalls = [];
page.on('response', async (response) => {
  if (response.url().includes('/api/') && response.status() === 200) {
    try {
      const body = await response.json();
      apiCalls.push({ url: response.url(), body });
    } catch {}
  }
});

await page.goto('https://fanqienovel.com/main/writer/short-data?tab=1', {
  waitUntil: 'networkidle',
});

console.log('捕获到的 API 调用:', apiCalls.map(c => c.url));
// 找到数据接口后，直接 fetch 调用更稳定
```

---

## 二、Claude / Cline 个人工具调试

### 1. 确认页面已正确加载

```
browser_navigate url="https://fanqienovel.com/main/writer/short-data?tab=1"
browser_snapshot
```

如果快照内容很少或是登录页，说明页面未加载完，加等待：

```
browser_wait_for text="整体数据"
browser_snapshot
```

---

### 2. 截图看实际页面状态

```
browser_take_screenshot
```

---

### 3. 用 evaluate 确认选择器

```
browser_evaluate function="() => {
  const el = document.querySelector('.article-item-title');
  return el ? el.textContent.trim() : '未找到元素';
}"
```

列出候选元素：

```
browser_evaluate function="() => {
  return Array.from(document.querySelectorAll('[class*=article-item]'))
    .slice(0, 5)
    .map(el => ({ class: el.className, text: el.textContent.trim().slice(0, 60) }));
}"
```

---

### 4. 查看控制台错误

```
browser_console_messages level="error"
```

---

### 5. 通过网络请求找 API

```
browser_navigate url="https://fanqienovel.com/main/writer/short-data?tab=1"
browser_wait_for time=3
browser_network_requests
```

找到数据接口后直接调用：

```
browser_evaluate function="async () => {
  const resp = await fetch('/api/found-endpoint', { credentials: 'include' });
  return await resp.json();
}"
```

---

## 三、常用等待方式

| 场景 | 推荐写法 |
|------|----------|
| 等待特定文字出现 | `browser_wait_for text="整体数据"` |
| 等待固定时间（秒） | `browser_wait_for time=3` |
| 等待加载提示消失 | `browser_wait_for textGone="加载中"` |
| 脚本中等待元素出现 | `await page.waitForSelector('.target', { timeout: 10000 })` |
| 脚本中等待网络空闲 | `await page.waitForLoadState('networkidle')` |

---

**返回**：[SKILL.md](./SKILL.md)