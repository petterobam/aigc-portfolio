# 番茄小说浏览器长连接服务

## 问题背景

使用 MCP 时遇到 "MCP client 'unknown' connected" 问题，原因是每次调用都建立新的连接，导致 session 丢失。

## 解决方案

创建一个长连接的 HTTP 服务，保持浏览器 session，通过 API 调用进行操作。

## 架构设计

```
OpenClaw Agent → HTTP Client → Browser Service (长连接) → 浏览器
```

**核心优势**：
- ✅ 长连接保持 session
- ✅ 无需每次重新登录
- ✅ 支持复杂的多步骤操作
- ✅ 易于调试和监控
- ✅ 可扩展性强

## 快速开始

### 1. 安装依赖

```bash
cd ~/.openclaw/workspace/scripts/browser-service
npm install
```

### 2. 启动服务

```bash
npm start
```

服务启动后会：
- 自动启动 Chrome 浏览器
- 检查登录状态
- 导航到番茄小说短故事管理页面
- 启动 HTTP 服务（默认端口 3001）

### 3. 测试服务

```bash
# 测试 1：检查服务状态
npm run client status

# 测试 2：检查登录状态
npm run client login

# 测试 3：获取番茄小说短故事列表
npm run client fanqie-stories
```

## API 文档

### 基础 API

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/status` | 获取服务状态 |
| GET | `/login` | 检查登录状态 |
| POST | `/navigate` | 导航到指定 URL |
| POST | `/execute` | 执行 JavaScript 代码 |
| POST | `/click` | 点击元素 |
| POST | `/type` | 输入文字 |
| POST | `/wait` | 等待元素 |
| GET | `/screenshot` | 截图 |
| GET | `/content` | 获取页面内容 |

### 番茄小说专用 API

| 方法 | 路径 | 功能 |
|------|------|------|
| GET | `/fanqie/stories` | 获取短故事列表 |
| POST | `/fanqie/navigate` | 导航到番茄小说指定页面 |

## 使用示例

### 示例 1：获取服务状态

```bash
npm run client status
```

响应：
```json
{
  "server": "running",
  "browser": "connected",
  "page": "active",
  "isLoggedIn": true,
  "url": "https://fanqienovel.com/main/writer/short-manage"
}
```

### 示例 2：获取番茄小说短故事列表

```bash
npm run client fanqie-stories
```

响应：
```json
{
  "success": true,
  "result": [
    {
      "index": 1,
      "title": "读心宠妃：皇上心里全是弹幕",
      "read": "51阅读",
      "number": "27617字",
      "time": "2026-03-18 13:48"
    },
    ...
  ]
}
```

### 示例 3：导航到指定页面

```bash
npm run client navigate https://fanqienovel.com/main/writer/short-data
```

### 示例 4：执行 JavaScript 代码

```bash
npm run client execute "() => { return document.title; }"
```

### 示例 5：点击元素

```bash
npm run client click .article-item-title
```

### 示例 6：输入文字

```bash
npm run client type "textarea.byte-textarea" "这是一个测试标题"
```

## 在 OpenClaw 中使用

### 方法 1：通过 exec 调用客户端

```bash
cd ~/.openclaw/workspace/scripts/browser-service
node client.js fanqie-stories
```

### 方法 2：使用 Node.js 模块

```javascript
const client = require('./scripts/browser-service/client.js');

// 获取短故事列表
const stories = await client.getFanqieStories();
console.log(stories);

// 导航到指定页面
const result = await client.navigate('https://fanqienovel.com/main/writer/short-manage');
```

### 方法 3：直接调用 HTTP API

```javascript
const http = require('http');

http.get('http://127.0.0.1:3001/fanqie/stories', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(JSON.parse(data)); });
});
```

## 常见问题

### 1. 服务启动失败

**问题**：`Error: Browser not installed`

**解决**：
```bash
npx playwright install chromium
```

### 2. 未登录

**问题**：`isLoggedIn: false`

**解决**：
- 等待浏览器启动完成
- 手动在浏览器中登录番茄小说
- 服务会自动检测登录状态

### 3. API 调用失败

**问题**：`ECONNREFUSED`

**解决**：
- 确认服务已启动（`npm start`）
- 检查端口是否被占用
- 查看服务日志确认错误信息

### 4. 页面加载超时

**问题**：`TimeoutError: Navigation timeout`

**解决**：
- 增加超时时间（修改 server.js 中的 `NAVIGATION_TIMEOUT`）
- 检查网络连接
- 确认 URL 正确

## 高级用法

### 1. 自定义配置

修改 `server.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  USER_DATA_DIR: path.join(__dirname, '../data/chrome-user-data'),
  HEADLESS: false,
  PORT: 3001,
  HOST: '127.0.0.1',
  NAVIGATION_TIMEOUT: 30000,
  WAIT_TIMEOUT: 10000,
};
```

### 2. 添加自定义 API

在 `server.js` 中添加新的路由：

```javascript
app.get('/custom', async (req, res) => {
  // 自定义逻辑
  const result = await customOperation();
  res.json(result);
});
```

### 3. 批量操作

```javascript
const client = require('./scripts/browser-service/client.js');

// 批量获取多页数据
for (let i = 1; i <= 3; i++) {
  const url = `https://fanqienovel.com/main/writer/short-manage?page=${i}`;
  await client.navigate(url);
  const stories = await client.getFanqieStories();
  console.log(`第 ${i} 页:`, stories);
}
```

## 监控和日志

### 查看服务日志

服务启动后会实时输出操作日志：

```
🚀 启动浏览器...
✅ 浏览器启动成功
🌐 导航到: https://fanqienovel.com/main/writer/short-manage
🖱️ 点击元素: .article-item-title
```

### 导航日志

服务会在后台自动导航到番茄小说页面，确保 session 保持活跃。

## 与 MCP 的区别

| 特性 | MCP | Browser Service |
|------|-----|----------------|
| 连接方式 | 每次新建连接 | 长连接 |
| Session 保持 | ❌ 会丢失 | ✅ 持久保持 |
| 复杂操作 | ⚠️ 困难 | ✅ 简单 |
| 调试 | ⚠️ 困难 | ✅ 简单 |
| 扩展性 | ⚠️ 有限 | ✅ 强大 |

## 下一步

1. ✅ 实现番茄小说自动发布流程
2. ✅ 实现定时数据采集
3. ✅ 实现自动互动（点赞、评论）
4. ✅ 集成到 OpenClaw 的番茄小说运营体系

## 技术栈

- **Node.js** - 服务端运行时
- **Express** - HTTP 服务器框架
- **Playwright** - 浏览器自动化
- **Chrome** - 浏览器引擎

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT
