# 调试技巧

> **注意**：本文档适用于 **Playwright MCP（备选方案）**。
> 番茄小说等需要登录的操作请使用 [Chrome DevTools MCP](../chrome-devtools/guide.md)。

---

## 常见问题诊断

### 1. 页面结构不清晰

**问题**：找不到目标元素或选择器不正确

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 统计所有 div 数量
  const allDivs = await page.evaluate(() => {
    return document.querySelectorAll('div').length;
  });

  // 查找特定类名的元素
  const specificElements = await page.evaluate(() => {
    const elements = document.querySelectorAll('.some-class');
    return Array.from(elements).map(el => ({
      tag: el.tagName,
      className: el.className,
      text: el.textContent.substring(0, 100)
    }));
  });

  return { allDivs, specificElements };
}"
```

---

### 2. 元素点击无响应

**问题**：`page.click()` 没有反应

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 方式1：先悬停再点击
  await page.hover('#button');
  await page.click('#button');

  // 方式2：使用 evaluate 直接触发点击事件
  await page.evaluate(() => {
    document.querySelector('#button').click();
  });

  // 方式3：等待元素可见后再点击
  await page.waitForSelector('#button', { state: 'visible' });
  await page.click('#button');

  return { success: true };
}"
```

---

### 3. 等待动态内容

**问题**：页面内容是动态加载的，固定时间等待不够可靠

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 方式1：等待特定文字出现
  await page.waitForSelector('text=加载完成', { timeout: 10000 });

  // 方式2：等待元素出现
  await page.waitForSelector('.data-container', { timeout: 10000 });

  // 方式3：等待元素可见
  await page.waitForSelector('#content', { state: 'visible', timeout: 10000 });

  // 方式4：等待网络请求完成
  await page.waitForLoadState('networkidle');

  return { success: true };
}"
```

---

### 4. 网络请求调试

**问题**：需要查看 API 请求或分析数据来源

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 监听网络请求
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method()
    });
  });

  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待网络请求完成
  await page.waitForLoadState('networkidle');

  return { totalRequests: requests.length, requests };
}"
```

---

### 5. 控制台报错

**问题**：页面有 JavaScript 错误，影响自动化脚本

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 监听控制台错误
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push({
        text: msg.text(),
        location: msg.location()
      });
    }
  });

  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待一段时间收集错误
  await page.waitForTimeout(3000);

  return { totalErrors: errors.length, errors };
}"
```

---

### 6. 截图调试

**问题**：需要查看页面实际渲染效果

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // 截取整个页面
  await page.screenshot({ path: '/tmp/fullpage.png', fullPage: true });

  // 截取特定元素
  const element = await page.$('#content');
  if (element) {
    await element.screenshot({ path: '/tmp/element.png' });
  }

  // 截取视口
  await page.screenshot({ path: '/tmp/viewport.png' });

  return { success: true };
}"
```

---

### 7. 获取页面 HTML

**问题**：需要分析页面结构或 DOM

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 获取整个页面的 HTML
  const html = await page.content();

  // 获取特定元素的 HTML
  const elementHtml = await page.evaluate(() => {
    const el = document.querySelector('#content');
    return el ? el.outerHTML : null;
  });

  // 获取页面的无障碍树（用于调试选择器）
  const snapshot = await page.accessibility.snapshot();

  return {
    htmlLength: html.length,
    elementHtmlLength: elementHtml?.length ?? 0,
    snapshot
  };
}"
```

---

### 8. 模拟用户输入

**问题**：直接设置值可能不触发事件

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#input', { state: 'visible' });

  // 方式1：模拟真实的键盘输入（推荐，会触发 keydown/keyup 事件）
  await page.type('#input', 'text to type', { delay: 100 });

  // 方式2：使用键盘逐个按键
  await page.focus('#input');
  await page.keyboard.type('text to type');

  // 方式3：触发输入事件（当前两种方式均不生效时使用）
  await page.evaluate(() => {
    const input = document.querySelector('#input');
    input.value = 'text to type';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  return { success: true };
}"
```

---

### 9. 等待时间不确定

**问题**：页面加载时间不确定，固定等待太短或太长

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 方式1：导航时使用 waitUntil（推荐）
  await page.goto('https://example.com', { waitUntil: 'networkidle' });

  // 方式2：等待关键元素出现
  await page.waitForSelector('#content', { timeout: 10000 });

  // 方式3：使用 Promise.race 加超时保护
  await Promise.race([
    page.waitForSelector('#content'),
    page.waitForTimeout(5000)
  ]);

  return { success: true };
}"
```

---

### 10. Cookie 和 LocalStorage 操作

**问题**：需要操作 Cookie 或 LocalStorage

**解决方案**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 获取所有 Cookie
  const cookies = await page.context().cookies();

  // 设置 Cookie
  await page.context().addCookies([{
    name: 'session',
    value: 'session-value',
    domain: 'example.com',
    path: '/'
  }]);

  // 获取 LocalStorage
  const localStorageData = await page.evaluate(() => {
    return JSON.stringify(localStorage);
  });

  // 设置 LocalStorage
  await page.evaluate(() => {
    localStorage.setItem('key', 'value');
  });

  return { cookies, localStorageData };
}"
```

---

## 高级调试技巧

### 1. 日志输出

在代码中添加 `console.log` 输出调试信息：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  console.log('开始导航...');
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  console.log('导航完成，当前 URL:', page.url());

  const title = await page.title();
  console.log('页面标题:', title);

  return { title };
}"
```

### 2. 错误处理

使用 `try-catch` 处理可能的异常，并输出有意义的错误信息：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  try {
    await page.goto('https://example.com', { timeout: 10000 });
    await page.waitForSelector('#content', { timeout: 5000 });
    const text = await page.evaluate(() => document.querySelector('#content').textContent);
    return { success: true, text };
  } catch (error) {
    console.error('操作失败:', error.message);
    // 截图留存现场
    await page.screenshot({ path: '/tmp/error-screenshot.png' });
    return { success: false, error: error.message, url: page.url() };
  }
}"
```

### 3. 使用 Playwright Inspector

Playwright 提供了 Inspector 工具，可以交互式地编写和调试脚本：
```bash
npx playwright codegen https://example.com
```

### 4. 暂停调试（开发环境）

在代码中添加 `page.pause()` 可暂停执行并打开 Inspector（仅适合本地调试）：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com');
  await page.pause(); // 暂停执行，打开 Inspector
  // 继续执行...
}"
```

---

## 快速排查清单

| 现象 | 可能原因 | 排查方法 |
|------|----------|----------|
| 元素找不到 | 选择器错误 / 未等待加载 | 截图 + 打印 HTML 结构 |
| 点击无响应 | 元素不可见 / 被遮挡 | 先 `waitForSelector visible` 再点击 |
| 数据为空 | 动态加载未完成 | 改用 `waitForSelector` 或 `networkidle` |
| 导航后会话丢失 | 使用了分步调用 | 将所有操作放入同一个 `browser_run_code` |
| 访问番茄小说被重定向 | 无登录 Cookie | 改用 Chrome DevTools MCP |
| 超时错误 | 网络慢 / 选择器错误 | 增大 timeout / 确认选择器 |

---

**返回**：[SKILL.md](../SKILL.md)