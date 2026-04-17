# 工具脚本目录

> 存放知乎自动化系统的通用工具脚本

---

## 📋 工具列表

### 1. Cookie 管理器 (cookie-manager.js)

**用途**: 管理 Cookie 的加载、保存、验证

**主要功能**:
- 加载 Cookie 文件
- 保存 Cookie 到文件
- 验证 Cookie 是否有效
- Cookie 过期检测

**使用方法**:
```javascript
const CookieManager = require('./cookie-manager');

// 创建 Cookie 管理器
const cookieManager = new CookieManager('path/to/cookies.json');

// 加载 Cookie
const cookies = await cookieManager.loadCookies();

// 保存 Cookie
await cookieManager.saveCookies(cookies);

// 验证 Cookie
const isValid = await cookieManager.validateCookies(cookies);
```

**文件位置**: `auth/cookies.json`

---

### 2. Session 管理器 (session-manager.js)

**用途**: 管理浏览器会话

**主要功能**:
- 创建持久化上下文
- 保存会话状态
- 加载会话状态
- 会话失效恢复

**使用方法**:
```javascript
const SessionManager = require('./session-manager');

// 创建 Session 管理器
const sessionManager = new SessionManager('path/to/session.json');

// 创建持久化上下文
const context = await sessionManager.createContext();

// 保存会话状态
await sessionManager.saveSession(context);

// 加载会话状态
const context = await sessionManager.loadSession();
```

**文件位置**: `auth/session.json`

---

### 3. 日志工具 (logger.js)

**用途**: 统一的日志记录和管理

**主要功能**:
- 日志分级 (info, warn, error)
- 日志文件管理
- 日志格式化
- 日志轮转

**使用方法**:
```javascript
const Logger = require('./logger');

// 创建日志器
const logger = new Logger({
  logFile: 'logs/app.log',
  errorFile: 'logs/error.log'
});

// 记录日志
logger.info('这是一条信息');
logger.warn('这是一条警告');
logger.error('这是一条错误');
```

**日志文件**:
- `logs/app.log` - 应用日志
- `logs/error.log` - 错误日志

---

### 4. 知乎 Cookie 提取器 (extract-zhihu-cookies.js)

**用途**: 从浏览器提取知乎 Cookie

**主要功能**:
- 从 Chrome 提取 Cookie
- 从 Firefox 提取 Cookie
- 自动识别浏览器
- Cookie 格式转换

**使用方法**:
```bash
# 从 Chrome 提取 Cookie
node scripts/utils/extract-zhihu-cookies.js

# 指定浏览器
node scripts/utils/extract-zhihu-cookies.js --browser firefox

# 指定保存路径
node scripts/utils/extract-zhihu-cookies.js --output /path/to/cookies.json
```

**输出文件**: `auth/cookies.json`

---

### 5. 知乎登录检查 (check-zhihu-login.js)

**用途**: 检查知乎账号登录状态

**主要功能**:
- 检查登录状态
- 获取用户基本信息
- 提取并保存 Cookie
- 生成检查报告
- 保存页面截图

**使用方法**:
```bash
# 检查登录状态
node scripts/utils/check-zhihu-login.js

# 指定输出路径
node scripts/utils/check-zhihu-login.js --output data/auth/

# 调试模式
node scripts/utils/check-zhihu-login.js --debug
```

**输出文件**:
- `data/zhihu-login-check-{timestamp}.json` - 检查报告
- `data/zhihu-login-check-{timestamp}.png` - 页面截图

---

### 6. 热点追踪器 (hot-topic-tracker.js)

**用途**: 追踪多个数据源的热门话题

**主要功能**:
- 知乎热榜追踪
- Hacker News 热门追踪
- GitHub Trending 追踪
- arXiv 论文追踪
- 智能内容过滤
- 选题建议生成

**使用方法**:
```bash
# 追踪所有数据源
node scripts/utils/hot-topic-tracker.js

# 追踪指定数据源
node scripts/utils/hot-topic-tracker.js --source zhihu

# 调试模式
node scripts/utils/hot-topic-tracker.js --debug
```

**输出文件**:
- `data/hot-topics-latest.json` - 最新热点报告
- `data/hot-topics-{timestamp}.json` - 历史热点报告
- `data/topic-suggestions-latest.json` - 选题建议

---

## 🔧 工具依赖关系

```
check-zhihu-login.js
  ├── cookie-manager.js (加载 Cookie)
  └── logger.js (记录日志)

hot-topic-tracker.js
  ├── cookie-manager.js (加载 Cookie)
  ├── session-manager.js (管理会话)
  └── logger.js (记录日志)

extract-zhihu-cookies.js
  └── logger.js (记录日志)
```

---

## 📝 工具开发规范

### 文件命名规范

- 使用 kebab-case (如: `cookie-manager.js`)
- 功能描述清晰 (如: `check-zhihu-login.js`)

### 代码规范

- 使用 async/await 处理异步
- 完善的错误处理
- 详细的注释说明
- 统一的日志记录

### 接口规范

- 输入参数验证
- 输出数据格式统一
- 错误信息清晰

---

## 🧪 工具测试

### 测试 Cookie 管理器

```bash
# 测试 Cookie 加载
node -e "const cm = require('./cookie-manager'); (async () => { const cookies = await cm.loadCookies(); console.log(cookies); })()"
```

### 测试 Session 管理器

```bash
# 测试 Session 创建
node -e "const sm = require('./session-manager'); (async () => { const context = await sm.createContext(); console.log('Success'); })()"
```

### 测试日志工具

```bash
# 测试日志记录
node -e "const Logger = require('./logger'); const logger = new Logger(); logger.info('Test');"
```

---

## 🔍 工具使用技巧

### 1. Cookie 自动刷新

**问题**: Cookie 会过期

**解决方案**:
- 定期检查 Cookie 有效性
- 失效时自动重新提取
- 设置 Cookie 有效期提醒

### 2. 日志轮转

**问题**: 日志文件过大

**解决方案**:
- 按日期分割日志文件
- 定期清理旧日志
- 使用日志轮转工具

### 3. 错误处理

**问题**: 脚本运行时可能出错

**解决方案**:
- 使用 try-catch 捕获错误
- 记录详细的错误信息
- 提供错误恢复机制

---

## ⚠️ 注意事项

1. **Cookie 安全**: 不要将 Cookie 提交到 git
2. **日志管理**: 定期清理日志文件，避免占用过多空间
3. **错误处理**: 所有工具都应该有完善的错误处理
4. **文档维护**: 工具功能变更时，及时更新文档

---

## 🔗 相关文档

- [主 README](../../README.md) - 自动化系统说明
- [脚本说明](../README.md) - 脚本使用说明
- [数据说明](../../data/README.md) - 数据目录说明

---

**创建时间**: 2026-03-28 22:46
**版本**: v1.0
**状态**: ✅ 完成
