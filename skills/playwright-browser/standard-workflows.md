# 标准操作流程

## 1. 抓取页面内容

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

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

---

## 2. 提取结构化数据

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 提取数据
  const data = await page.evaluate(() => {
    const items = [];
    document.querySelectorAll('.item').forEach((item, index) => {
      items.push({
        index: index + 1,
        title: item.querySelector('.title').textContent.trim(),
        value: item.querySelector('.value').textContent.trim()
      });
    });
    return items;
  });

  return {
    totalItems: data.length,
    items: data
  };
}"
```

---

## 3. 表单填写 & 提交

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com/form', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 填写表单
  await page.type('#username', '用户名', { delay: 100 });
  await page.type('#password', '密码', { delay: 100 });

  // 点击提交
  await page.click('#submit');

  // 等待结果
  await page.waitForTimeout(2000);

  // 获取结果
  const result = await page.evaluate(() => {
    return document.body.innerText;
  });

  return {
    url: page.url(),
    result: result
  };
}"
```

---

## 4. 点击按钮并等待响应

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(3000);

  // 等待按钮出现并点击
  await page.waitForSelector('#button', { state: 'visible' });
  await page.click('#button');

  // 等待响应（等待某个元素出现）
  await page.waitForSelector('#result', { timeout: 10000 });

  // 获取结果
  const result = await page.evaluate(() => {
    return document.querySelector('#result').textContent;
  });

  return { result };
}"
```

---

## 5. 处理分页（自动翻页）

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com/list', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  let allItems = [];
  let currentPage = 1;

  while (true) {
    // 提取当前页的数据
    const items = await page.evaluate(() => {
      const elements = document.querySelectorAll('.item');
      return Array.from(elements).map(el => ({
        title: el.querySelector('.title').textContent.trim()
      }));
    });

    allItems = allItems.concat(items);

    // 检查是否有下一页
    const nextButton = await page.$('button.next-page:not(:disabled)');
    if (!nextButton) {
      break;
    }

    // 点击下一页
    await nextButton.click();
    await page.waitForTimeout(2000);
    currentPage++;
  }

  return {
    totalPages: currentPage,
    totalItems: allItems.length,
    items: allItems
  };
}"
```

---

## 6. 处理滚动加载（无限滚动）

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com/infinite-scroll', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  let allItems = [];
  let previousHeight = 0;

  while (true) {
    // 提取当前页的数据
    const items = await page.evaluate(() => {
      const elements = document.querySelectorAll('.item');
      return Array.from(elements).map(el => ({
        title: el.querySelector('.title').textContent.trim()
      }));
    });

    allItems = allItems.concat(items);

    // 滚动到底部
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // 等待新内容加载
    await page.waitForTimeout(2000);

    // 检查页面高度是否变化（如果没有变化，说明没有新内容了）
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === previousHeight) {
      break;
    }
    previousHeight = currentHeight;
  }

  return {
    totalItems: allItems.length,
    items: allItems
  };
}"
```

---

## 7. 处理弹窗和确认框

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 监听弹窗
  page.on('dialog', async dialog => {
    console.log('弹窗类型:', dialog.type());
    console.log('弹窗消息:', dialog.message());

    // 接受弹窗（点击确定）
    await dialog.accept();

    // 或者拒绝弹窗（点击取消）
    // await dialog.dismiss();
  });

  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 触发弹窗的操作
  await page.click('#show-alert');

  // 等待弹窗处理完成
  await page.waitForTimeout(1000);

  return { success: true };
}"
```

---

## 8. 上传文件

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到上传页面
  await page.goto('https://example.com/upload', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 选择文件输入框
  const fileInput = await page.$('input[type="file"]');

  // 上传文件（可以是本地文件路径或相对路径）
  await fileInput.setInputFiles('/path/to/file.txt');

  // 点击提交按钮
  await page.click('#submit');

  // 等待上传完成
  await page.waitForSelector('#success-message', { timeout: 30000 });

  return { success: true };
}"
```

---

## 9. 下载文件

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 设置下载路径
  const downloadPath = '/tmp/downloads';

  // 导航到目标页面
  await page.goto('https://example.com/download', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 点击下载按钮
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.click('#download-button')
  ]);

  // 保存文件
  await download.saveAs(`${downloadPath}/${download.suggestedFilename()}`);

  return {
    filename: download.suggestedFilename(),
    path: `${downloadPath}/${download.suggestedFilename()}`
  };
}"
```

---

## 10. 处理 iframe

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 获取 iframe 的 frame
  const frame = await page.frame('iframe-name');

  // 在 iframe 中执行操作
  await frame.waitForSelector('#element', { timeout: 10000 });
  await frame.click('#button');

  // 在 iframe 中提取数据
  const data = await frame.evaluate(() => {
    return document.body.innerText;
  });

  return { data };
}"
```

---

## 11. 执行 JavaScript 代码

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForTimeout(2000);

  // 在页面上下文中执行 JavaScript
  const result = await page.evaluate(() => {
    // 可以执行任意的 JavaScript 代码
    const data = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString()
    };

    // 复杂的数据处理
    const items = Array.from(document.querySelectorAll('.item')).map(el => ({
      text: el.textContent.trim(),
      id: el.id
    }));

    return { ...data, items };
  });

  return result;
}"
```

---

## 12. 等待特定条件

```javascript
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

  // 等待特定文字出现
  await page.waitForSelector('text=加载完成', { timeout: 10000 });

  // 等待元素出现
  await page.waitForSelector('#content', { timeout: 10000 });

  // 等待元素可见
  await page.waitForSelector('#content', { state: 'visible', timeout: 10000 });

  // 等待元素消失
  await page.waitForSelector('#loading', { state: 'hidden', timeout: 10000 });

  // 等待函数返回 true
  await page.waitForFunction(() => {
    return document.readyState === 'complete';
  }, { timeout: 10000 });

  return { success: true };
}"
```

---

## 最佳实践

1. **始终使用 `browser_run_code`**：避免使用单独命令导致连接断开
2. **合理使用等待**：`waitForSelector`、`waitForTimeout`、`waitForFunction`
3. **错误处理**：添加 try-catch 处理可能的异常
4. **日志输出**：在代码中添加 console.log 便于调试
5. **性能优化**：减少不必要的等待，使用智能等待替代固定等待

---

**返回**：[SKILL.md](./SKILL.md)
