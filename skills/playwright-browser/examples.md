# 使用示例集合

## 示例 1：抓取番茄小说短故事列表（成功案例）⭐

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到短故事管理页面
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 获取页面文本
  const pageText = await page.evaluate(() => {
    return document.body.innerText;
  });

  return {
    url: page.url(),
    title: await page.title(),
    pageTextLength: pageText.length,
    pageTextPreview: pageText.substring(0, 2000)
  };
}"
```

**成功结果**：
```json
{
  "url": "https://fanqienovel.com/main/writer/short-manage",
  "title": "作家专区-番茄小说网-番茄小说旗下原创文学平台",
  "pageTextLength": 760,
  "pageTextPreview": "作家专区\n番茄小说网\n作家课堂\n作家福利\n消息通知\n帅帅它爸\n工作台\n作品管理\n小说\n短故事\n..."
}
```

---

## 示例 2：提取番茄小说短故事数据

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到短故事管理页面
  await page.goto('https://fanqienovel.com/main/writer/short-manage', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 提取短故事数据
  const stories = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('.article-item').forEach((item, index) => {
      items.push({
        index: index + 1,
        title: item.querySelector('.article-item-title')?.textContent.trim() || '',
        read: item.querySelector('.article-item-read')?.textContent.trim() || '',
        wordCount: item.querySelector('.article-item-number')?.textContent.trim() || '',
        time: item.querySelector('.article-item-time')?.textContent.trim() || '',
        link: item.querySelector('a[href*="/main/writer/preview-short/"]')?.href || ''
      });
    });
    return items;
  });

  return {
    totalStories: stories.length,
    stories: stories
  };
}"
```

---

## 示例 3：Google 搜索（使用单独命令）

**注意**：这种方式需要保持长连接，不推荐使用。推荐使用 `browser_run_code`。

```
1. browser_navigate("https://www.google.com")
2. browser_snapshot() → 找到搜索框 ref
3. browser_type(ref=搜索框ref, text="搜索词", submit=true)
4. browser_wait_for(text="搜索结果")
5. browser_snapshot() → 读取搜索结果
```

**推荐方式（使用 browser_run_code）**：
```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://www.google.com', { waitUntil: 'domcontentloaded' });
  await page.type('input[name="q"]', 'Playwright MCP', { delay: 100 });
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

  // 返回页面信息（截图会自动保存）
  return {
    url: page.url(),
    title: await page.title()
  };
}"

// 注意：如果需要保存截图，可以使用 browser_take_screenshot 工具
// 但这会导致连接断开，所以推荐在 browser_run_code 中完成所有操作
```

---

## 示例 5：多标签页操作

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 当前标签页
  const currentPage = {
    url: page.url(),
    title: await page.title()
  };

  // 新建标签页
  const newPage = await page.context().newPage();
  await newPage.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 获取新标签页信息
  const newPageInfo = {
    url: newPage.url(),
    title: await newPage.title()
  };

  // 关闭新标签页
  await newPage.close();

  return {
    currentPage,
    newPage: newPageInfo
  };
}"
```

---

## 示例 6：表单填写与提交

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到表单页面
  await page.goto('https://example.com/form', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  // 填写表单
  await page.type('#username', '用户名', { delay: 100 });
  await page.type('#password', '密码', { delay: 100 });

  // 点击提交
  await page.click('#submit');

  // 等待结果
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
mcporter call playwright.browser.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待特定文字出现
  await page.waitForSelector('text=加载完成', { timeout: 10000 });

  // 等待元素出现
  await page.waitForSelector('.data-container', { timeout: 10000 });

  // 提取数据
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

  // 滚动到底部
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // 等待懒加载内容
  await page.waitForTimeout(2000);

  // 提取所有项目
  const items = await page.evaluate(() => {
    const elements = document.querySelectorAll('.item');
    return Array.from(elements).map(el => el.textContent);
  });

  return { totalItems: items.length, items };
}"
```

---

## 示例 9：处理弹窗（alert/confirm/prompt）

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 监听弹窗
  page.on('dialog', async dialog => {
    console.log('弹窗类型:', dialog.type());
    console.log('弹窗消息:', dialog.message());
    await dialog.accept(); // 或者 dialog.dismiss()
  });

  // 触发弹窗的操作
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

  // 上传文件
  const fileInput = await page.$('input[type="file"]');
  await fileInput.setInputFiles('/path/to/file.txt');

  // 点击提交
  await page.click('#submit');

  // 等待结果
  await page.waitForTimeout(3000);

  return {
    url: page.url(),
    title: await page.title()
  };
}"
```

---

## 最佳实践

1. **始终使用 `browser_run_code`**：避免使用单独命令导致连接断开
2. **合理使用等待**：`waitForTimeout`、`waitForSelector`、`waitForTimeout`
3. **错误处理**：添加 try-catch 处理可能的异常
4. **性能优化**：减少不必要的等待，使用 `waitForSelector` 替代固定时间
5. **日志输出**：在代码中添加 console.log 便于调试

---

**返回**：[SKILL.md](./SKILL.md)
