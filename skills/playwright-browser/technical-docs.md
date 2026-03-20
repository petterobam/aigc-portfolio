# 技术文档

## 问题诊断（2026-03-20）

### 原始问题

- Playwright MCP 使用 `--extension` 模式
- 每次调用后连接断开，无法保持长连接
- 页面会回到扩展页面（`chrome-extension://...`）

### 根本原因

- Playwright MCP 的 `--extension` 模式是设计用于连接到浏览器扩展页面
- 不是用于操作用户打开的网页
- 每次调用都是独立的会话，无法保持状态

### 解决方案

- 使用 `browser_run_code` 执行完整的操作流程
- 所有操作在同一个页面上下文中完成
- 不依赖长连接

---

## 关键成功因素

### 1. 技术方案正确

**必须使用** `browser_run_code` 而不是依赖长连接

**错误示例**：
```javascript
// ❌ 错误：会导致连接断开
mcporter call playwright.browser_navigate url="https://example.com"
mcporter call playwright.browser_snapshot  // 页面会回到扩展页面
```

**正确示例**：
```javascript
// ✅ 正确：使用 browser_run_code 一次性完成
mcporter call playwright.browser_run_code code="async (page) => {
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  const data = await page.evaluate(() => {
    return document.body.innerText;
  });
  return data;
}"
```

### 2. 页面加载策略

**推荐策略**：
```javascript
// 导航时使用 domcontentloaded（比 load 更快）
await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });

// 如果页面有大量动态内容，使用 networkidle
await page.goto('https://example.com', { waitUntil: 'networkidle' });

// 如果需要确保所有资源加载完成，使用 load
await page.goto('https://example.com', { waitUntil: 'load' });
```

**等待时间**：
```javascript
// 等待页面加载
await page.waitForTimeout(3000);

// 等待特定元素出现
await page.waitForSelector('#content', { timeout: 10000 });

// 等待元素可见
await page.waitForSelector('#content', { state: 'visible', timeout: 10000 });
```

### 3. 数据提取方法

**使用 `page.evaluate()` 在页面上下文中执行**：

```javascript
// ✅ 正确：在页面上下文中执行
const data = await page.evaluate(() => {
  return document.body.innerText;
});

// ❌ 错误：在 Node.js 上下文中执行，无法访问 DOM
const data = document.body.innerText; // 报错
```

**复杂的数据提取**：
```javascript
const stories = await page.evaluate(() => {
  const items = [];
  document.querySelectorAll('.article-item').forEach((item, index) => {
    items.push({
      index: index + 1,
      title: item.querySelector('.article-item-title')?.textContent.trim() || '',
      read: item.querySelector('.article-item-read')?.textContent.trim() || ''
    });
  });
  return items;
});
```

### 4. 错误处理

**合理的超时时间和错误处理**：

```javascript
// 使用 try-catch 处理可能的异常
try {
  await page.goto('https://example.com', { timeout: 5000 });
  const data = await page.evaluate(() => {
    return document.body.innerText;
  });
  return { success: true, data };
} catch (error) {
  console.error('操作失败:', error.message);
  return { success: false, error: error.message };
}
```

**超时设置**：
```javascript
// 导航超时
await page.goto('https://example.com', { timeout: 5000 });

// 等待元素超时
await page.waitForSelector('#content', { timeout: 10000 });

// 整体操作超时（使用 Promise.race）
const result = await Promise.race([
  page.evaluate(() => {
    // 长时间操作
  }),
  new Promise((_, reject) =>
    setTimeout(() => reject(new Error('操作超时')), 10000)
  )
]);
```

---

## Playwright MCP 架构

### 架构概述

```
┌─────────────────┐
│  OpenClaw Agent │
└────────┬────────┘
         │
         │ mcporter call
         ▼
┌─────────────────┐
│   mcporter CLI  │
└────────┬────────┘
         │
         │ MCP protocol
         ▼
┌─────────────────┐
│ Playwright MCP  │
└────────┬────────┘
         │
         │ Chrome Extension Protocol
         ▼
┌─────────────────┐
│ Chrome Extension│
└────────┬────────┘
         │
         │ Remote Debugging Protocol
         ▼
┌─────────────────┐
│  Chrome Browser │
│  (with login)   │
└─────────────────┘
```

### 数据流向

1. **请求**：OpenClaw Agent → mcporter CLI → Playwright MCP
2. **执行**：Playwright MCP → Chrome Extension → Chrome Browser
3. **响应**：Chrome Browser → Chrome Extension → Playwright MCP → mcporter CLI → OpenClaw Agent

### 会话管理

**独立会话模式**（`--extension`）：
- 每次调用都是独立的会话
- 无法保持长连接
- 页面会回到扩展页面
- **必须**在同一个 `browser_run_code` 中完成所有操作

**长连接模式**（CDP）：
- 可以保持长连接
- 可以分步骤执行操作
- 但需要额外的配置

---

## 浏览器自动化最佳实践

### 1. 选择器策略

**优先级从高到低**：
1. **测试选择器**（最佳）：`page.getByTestId('submit')`
2. **角色选择器**：`page.getByRole('button', { name: 'Submit' })`
3. **标签选择器**：`page.getByLabel('Email')`
4. **占位符选择器**：`page.getByPlaceholder('Search')`
5. **文本选择器**：`page.getByText('Submit')`
6. **CSS 选择器**（最不推荐）：`page.locator('button.submit')`

**示例**：
```javascript
// ✅ 推荐：使用角色选择器
await page.getByRole('button', { name: '提交' }).click();

// ⚠️ 可用：使用文本选择器
await page.getByText('提交').click();

// ❌ 不推荐：使用 CSS 选择器
await page.locator('button.submit').click();
```

### 2. 等待策略

**不要使用固定时间等待**：
```javascript
// ❌ 不推荐：固定时间等待
await page.waitForTimeout(5000);
```

**推荐使用智能等待**：
```javascript
// ✅ 推荐：等待元素出现
await page.waitForSelector('#content');

// ✅ 推荐：等待元素可见
await page.waitForSelector('#content', { state: 'visible' });

// ✅ 推荐：等待网络空闲
await page.waitForLoadState('networkidle');
```

### 3. 交互策略

**模拟真实用户行为**：
```javascript
// ✅ 推荐：模拟真实输入（带延迟）
await page.type('#input', 'text', { delay: 100 });

// ⚠️ 可用：使用 fill（更快）
await page.fill('#input', 'text');

// ❌ 不推荐：直接设置值（可能不触发事件）
await page.evaluate(() => {
  document.querySelector('#input').value = 'text';
});
```

### 4. 错误处理

**捕获并处理错误**：
```javascript
try {
  await page.goto('https://example.com', { timeout: 5000 });
  await page.waitForSelector('#content', { timeout: 10000 });
  return { success: true };
} catch (error) {
  console.error('操作失败:', error.message);
  // 记录错误或进行重试
  return { success: false, error: error.message };
}
```

### 5. 日志记录

**添加调试日志**：
```javascript
console.log('开始导航...');
await page.goto('https://example.com');
console.log('导航完成');

console.log('等待元素...');
await page.waitForSelector('#content');
console.log('元素已加载');

console.log('提取数据...');
const data = await page.evaluate(() => {
  return document.body.innerText;
});
console.log('数据提取完成，长度:', data.length);
```

---

## 性能优化

### 1. 减少等待时间

**使用智能等待替代固定等待**：
```javascript
// ❌ 不推荐：固定等待 5 秒
await page.waitForTimeout(5000);

// ✅ 推荐：智能等待
await page.waitForSelector('#content', { timeout: 5000 });
```

### 2. 并行操作

**使用 Promise.all 并行执行**：
```javascript
// ❌ 串行执行（慢）
await page.goto('https://example.com');
await page.click('#button1');
await page.click('#button2');
await page.click('#button3');

// ✅ 并行执行（快）
await Promise.all([
  page.goto('https://example.com'),
  page.waitForSelector('#button1'),
  page.waitForSelector('#button2'),
  page.waitForSelector('#button3')
]);
```

### 3. 缓存和复用

**复用浏览器实例**：
```javascript
// ❌ 每次都创建新的浏览器
const browser1 = await chromium.launch();
// ... 使用 browser1
await browser1.close();

const browser2 = await chromium.launch();
// ... 使用 browser2
await browser2.close();

// ✅ 复用同一个浏览器实例
const browser = await chromium.launch();
// ... 使用 browser（多次）
await browser.close();
```

---

## 安全注意事项

1. **不要在日志中暴露敏感信息**
   - 密码
   - Token
   - 个人信息

2. **不要提交包含敏感信息的配置文件**
   - 将 `mcp-config.json` 添加到 `.gitignore`
   - 使用环境变量存储敏感信息

3. **谨慎使用自动化功能**
   - 发帖、提交表单等操作前必须确认
   - 不要在不知情的网站上运行自动化脚本

---

**返回**：[SKILL.md](./SKILL.md)
