# Playwright MCP 使用示例集合

> ⚠️ **注意**：Playwright MCP 打开的是全新浏览器，**没有番茄小说登录 Cookie**。
> 需要登录才能访问的页面（如番茄分析数据）请使用 [Chrome DevTools MCP](../chrome-devtools/guide.md)。

---

## 示例 1：抓取番茄小说短故事列表（成功案例）⭐

> 此示例在 Playwright MCP 中可用，是因为导航后页面文本包含已登录用户名——
> 若你的 Playwright MCP 配置连接到了已有 Chrome 会话（CDP 模式），则可正常获取登录态。

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const pageText = await page.evaluate(() => document.body.innerText);

  return {
    url: page.url(),
    title: await page.title(),
    pageTextLength: pageText.length,
    pageTextPreview: pageText.substring(0, 2000)
  };
}"
```

**成功结果示例**：
```json
{
  "url": "https://fanqienovel.com/main/writer/short-manage",
  "title": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "pageTextLength": 760,
  "pageTextPreview": "作家专区\n番茄小说网\n作家课堂\n..."
}
```

---

## 示例 2：提取番茄小说短故事数据

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const stories = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('.article-item').forEach((item, index) => {
      items.push({
        index: index + 1,
        title: item.querySelector('.article-item-title')?.textContent.trim() || '',
        read: item.querySelector('.article-item-read')?.textContent.trim() || '',
        wordCount: item.querySelector('.article-item-number')?.textContent.trim() || '',
        time: item.querySelector('.article-item-time')?.textContent.trim() || '',
        link: item.querySelector('a[href*=\"/main/writer/preview-short/\"]')?.href || ''
      });
    });
    return items;
  });

  return {
    totalStories: stories.length,
    stories
  };
}"
```

---

## 示例 3：Google 搜索

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  await page.type('input[name=\"q\"]', 'Playwright MCP', { delay: 100 });
  await page.keyboard.press('Enter');
  await page.waitForTimeout(3000);

  return {
    url: page.url(),
    title: await page.title()
  };
}"
```

---

## 示例 4：全页截图

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: '/tmp/screenshot.png', fullPage: true });

  return {
    url: page.url(),
    title: await page.title(),
    screenshot: '/tmp/screenshot.png'
  };
}"
```

---

## 示例 5：多标签页操作

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  const currentPage = {
    url: page.url(),
    title: await page.title()
  };

  // 新建标签页
  const newPage = await page.context().newPage();
  await newPage.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  const newPageInfo = {
    url: newPage.url(),
    title: await newPage.title()
  };

  await newPage.close();

  return { currentPage, newPage: newPageInfo };
}"
```

---

## 示例 6：表单填写与提交

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com/form', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  await page.type('#username', '用户名', { delay: 100 });
  await page.type('#password', '密码', { delay: 100 });
  await page.click('#submit');

  await page.waitForTimeout(2000);

  return {
    url: page.url(),
    title: await page.title(),
    result: await page.evaluate(() => document.body.innerText.substring(0, 500))
  };
}"
```

---

## 示例 7：等待动态内容

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待特定文字出现
  await page.waitForSelector('text=加载完成', { timeout: 10000 });

  // 等待元素出现
  await page.waitForSelector('.data-container', { timeout: 10000 });

  const data = await page.evaluate(() => {
    return document.querySelector('.data-container').textContent;
  });

  return { data };
}"
```

---

## 示例 8：滚动页面（处理懒加载）

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com/list', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 滚动到底部触发懒加载
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  await page.waitForTimeout(2000);

  const items = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.item')).map(el => el.textContent.trim());
  });

  return { totalItems: items.length, items };
}"
```

---

## 示例 9：处理弹窗（alert / confirm / prompt）

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  page.on('dialog', async dialog => {
    console.log('弹窗类型:', dialog.type());
    console.log('弹窗消息:', dialog.message());
    await dialog.accept(); // 或 dialog.dismiss()
  });

  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.click('#show-alert');
  await page.waitForTimeout(1000);

  return { success: true };
}"
```

---

## 示例 10：上传文件

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com/upload', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const fileInput = await page.$('input[type=\"file\"]');
  await fileInput.setInputFiles('/path/to/file.txt');

  await page.click('#submit');
  await page.waitForTimeout(3000);

  return {
    url: page.url(),
    title: await page.title()
  };
}"
```

---

## 最佳实践

1. **始终使用 `browser_run_code`**：所有多步操作必须在同一次 `browser_run_code` 调用内完成，不能拆分为多个单独命令
2. **合理使用等待**：优先用 `waitForSelector`，避免纯固定时间 `waitForTimeout`
3. **错误处理**：添加 `try-catch`，返回结构化的错误信息
4. **性能优化**：使用智能等待替代固定等待，减少不必要的延时
5. **日志输出**：在关键步骤添加 `console.log` 便于调试

---

**返回**：[SKILL.md](../SKILL.md)