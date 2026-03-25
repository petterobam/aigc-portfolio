# 番茄小说浏览器长连接服务 - 快速开始

## 问题背景

使用 MCP 时遇到 "MCP client 'unknown' connected" 问题，原因是每次调用都建立新的连接，导致 session 丢失。

## 解决方案架构

```
OpenClaw Agent → HTTP Client → Browser Service (长连接) → Chrome 浏览器
                                              ↓
                                   保持登录状态和 Session
```

## 快速开始（3 步）

### 步骤 1：启动服务

```bash
cd ~/.openclaw/workspace/scripts/browser-service
node server.js
```

**注意**：首次启动时会打开 Chrome 浏览器，需要手动登录番茄小说。

### 步骤 2：登录番茄小说

1. 等待浏览器自动打开
2. 在浏览器中手动登录番茄小说（账号：帅帅它爸）
3. 登录成功后，服务会自动检测

### 步骤 3：测试服务

**另开一个终端窗口**，运行测试命令：

```bash
cd ~/.openclaw/workspace/scripts/browser-service

# 测试 1：检查服务状态
node client.js status

# 测试 2：获取短故事列表（需要已登录）
node client.js fanqie-stories
```

## 核心优势

| 特性 | MCP 方式 | Browser Service |
|------|----------|-----------------|
| Session 保持 | ❌ 每次都丢失 | ✅ 长连接保持 |
| 登录状态 | ❌ 需要每次登录 | ✅ 一次登录永久有效 |
| 复杂操作 | ⚠️ 困难 | ✅ 简单 |
| 调试 | ⚠️ 困难 | ✅ 实时日志 |
| 扩展性 | ⚠️ 有限 | ✅ 强大 |

## 在 OpenClaw 中使用

### 方法 1：通过 exec 调用（推荐）

```bash
# 获取短故事列表
cd /Users/oyjie/.openclaw/workspace/scripts/browser-service && node client.js fanqie-stories

# 检查登录状态
cd /Users/oyjie/.openclaw/workspace/scripts/browser-service && node client.js login

# 导航到指定页面
cd /Users/oyjie/.openclaw/workspace/scripts/browser-service && node client.js navigate https://fanqienovel.com/main/writer/short-data
```

### 方法 2：使用 Node.js 模块

```javascript
const client = require('/Users/oyjie/.openclaw/workspace/scripts/browser-service/client.js');

// 获取短故事列表
const stories = await client.getFanqieStories();
console.log(stories);

// 导航到指定页面
const result = await client.navigate('https://fanqienovel.com/main/writer/short-manage');
```

## API 文档

### 基础 API

```bash
# 获取服务状态
node client.js status

# 检查登录状态
node client.js login

# 导航到指定 URL
node client.js navigate <url>

# 执行 JavaScript 代码
node client.js execute <code>

# 点击元素
node client.js click <selector>

# 输入文字
node client.js type <selector> <text>

# 等待元素
node client.js wait <selector> [timeout]

# 截图
node client.js screenshot

# 获取页面内容
node client.js content
```

### 番茄小说专用 API

```bash
# 获取短故事列表
node client.js fanqie-stories

# 导航到番茄小说指定页面
node client.js fanqie-navigate <path>
```

## 完整示例：获取番茄小说数据

```bash
# 1. 获取短故事列表
cd /Users/oyjie/.openclaw/workspace/scripts/browser-service
node client.js fanqie-stories

# 输出：
# {
#   "success": true,
#   "result": [
#     {
#       "index": 1,
#       "title": "读心宠妃：皇上心里全是弹幕",
#       "read": "51阅读",
#       "number": "27617字",
#       "time": "2026-03-18 13:48"
#     },
#     ...
#   ]
# }
```

## 常见问题

### Q1：服务启动失败，提示 "Browser not installed"

**解决**：
```bash
npx playwright install chromium
```

### Q2：未登录（isLoggedIn: false）

**解决**：
- 在打开的浏览器中手动登录番茄小说
- 登录后，服务会自动检测

### Q3：API 调用失败，提示 "ECONNREFUSED"

**解决**：
- 确认服务已启动（另开终端运行 `node server.js`）
- 检查端口 3001 是否被占用

### Q4：页面加载超时

**解决**：
- 增加超时时间（修改 `server.js` 中的 `NAVIGATION_TIMEOUT`）
- 检查网络连接

## 高级用法

### 自定义配置

修改 `server.js` 中的 `CONFIG` 对象：

```javascript
const CONFIG = {
  USER_DATA_DIR: path.join(__dirname, '../data/chrome-user-data'),
  HEADLESS: false,  // 改为 true 可以不显示浏览器
  PORT: 3001,       // 修改端口
  NAVIGATION_TIMEOUT: 30000,  // 修改超时时间
};
```

### 批量操作

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

### 添加自定义 API

在 `server.js` 中添加新的路由：

```javascript
app.get('/custom', async (req, res) => {
  // 自定义逻辑
  const result = await customOperation();
  res.json(result);
});
```

## 服务日志

服务启动后会实时输出操作日志：

```
🎬 启动番茄小说浏览器长连接服务...
🚀 启动浏览器...
✅ 浏览器启动成功
⚠️ 未登录，请手动登录
🌐 导航到: https://fanqienovel.com/main/writer/short-manage

==========================================
✅ 番茄小说浏览器长连接服务已启动
==========================================
📡 服务地址: http://127.0.0.1:3001
📚 API 文档: http://127.0.0.1:3001/docs
🔍 登录状态: 未登录
==========================================
```

## 下一步

1. ✅ 实现番茄小说自动发布流程
2. ✅ 实现定时数据采集
3. ✅ 实现自动互动（点赞、评论）
4. ✅ 集成到 OpenClaw 的番茄小说运营体系

## 技术支持

- **文档位置**：`scripts/browser-service/README.md`
- **服务代码**：`scripts/browser-service/server.js`
- **客户端代码**：`scripts/browser-service/client.js`

---

**总结**：Browser Service 是解决 MCP session 丢失问题的最佳方案，通过长连接保持浏览器 session，提供稳定的 HTTP API，非常适合自动化操作番茄小说平台。
