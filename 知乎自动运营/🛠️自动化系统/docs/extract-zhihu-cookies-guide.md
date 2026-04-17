# 知乎Cookie提取工具使用指南

## 📋 工具介绍

知乎Cookie提取工具可以从你已登录的浏览器中自动提取知乎Cookie，保存到本地文件，供自动化脚本使用。

**工具文件**: `scripts/extract-zhihu-cookies.js`

**输出文件**:
- `auth/zhihu-cookies-[timestamp].json` - 带时间戳的Cookie文件
- `auth/zhihu-cookies-latest.json` - 最新Cookie文件（便于其他脚本使用）
- `auth/zhihu-cookies-info-[timestamp].json` - Cookie信息文件

---

## 🚀 使用方法

### 方法1：使用Chrome用户数据目录（最推荐）⭐⭐⭐⭐⭐

**原理**: 使用Chrome的用户数据目录，复用已登录状态。

**步骤**:

1. **找到Chrome用户数据目录**:
   - macOS: `~/Library/Application Support/Google/Chrome`
   - Linux: `~/.config/google-chrome`
   - Windows: `%LOCALAPPDATA%\Google\Chrome\User Data`

2. **修改脚本配置**:
   ```javascript
   // 在 extract-zhihu-cookies.js 中
   const CONFIG = {
     userDataDir: '~/Library/Application Support/Google/Chrome'
   };
   ```

3. **运行脚本**:
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/extract-zhihu-cookies.js
   ```

**优点**:
- ✅ 最简单，无需额外配置
- ✅ 自动复用已登录状态
- ✅ 支持多个账号

**缺点**:
- ⚠️ Chrome浏览器需要关闭（或使用独立的用户数据目录）

---

### 方法2：使用CDP连接已登录的浏览器 ⭐⭐⭐⭐

**原理**: 通过Chrome DevTools Protocol (CDP) 连接到已登录的浏览器。

**步骤**:

1. **启动Chrome时添加CDP参数**:
   ```bash
   # macOS/Linux
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   
   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

2. **在Chrome中登录知乎**（如果还没有登录）

3. **运行脚本**:
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/extract-zhihu-cookies.js
   ```

**优点**:
- ✅ Chrome可以继续使用
- ✅ 无需关闭浏览器
- ✅ 实时获取Cookie

**缺点**:
- ⚠️ 需要使用特殊参数启动Chrome

---

### 方法3：使用Playwright自动登录 ⭐⭐⭐

**原理**: 使用Playwright打开浏览器，手动登录知乎后提取Cookie。

**步骤**:

1. **运行脚本**（会打开浏览器）:
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/extract-zhihu-cookies.js
   ```

2. **手动登录知乎**:
   - 在打开的浏览器中，手动点击登录按钮
   - 扫码或输入账号密码登录
   - 等待登录完成

3. **脚本会自动提取Cookie并保存**

**优点**:
- ✅ 无需配置
- ✅ 适合一次性使用

**缺点**:
- ⚠️ 每次都需要手动登录
- ⚠️ Cookie过期后需要重新登录

---

## 🔄 定时任务配置

### 使用cron定时任务

```bash
# 编辑crontab
crontab -e

# 添加定时任务（每小时提取一次）
0 * * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/extract-zhihu-cookies.js >> logs/cookie-extract.log 2>&1

# 添加定时任务（每天凌晨2点提取）
0 2 * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/extract-zhihu-cookies.js >> logs/cookie-extract.log 2>&1
```

### 使用OpenClaw心跳

可以在OpenClaw的心跳任务中添加Cookie提取逻辑：

```javascript
// 在HEARTBEAT.md中添加
- 每天凌晨2点自动提取知乎Cookie
```

---

## 📦 Cookie使用示例

### 在其他脚本中加载Cookie

```javascript
const fs = require('fs');
const path = require('path');

// 加载Cookie
function loadZhihuCookies() {
  const cookieFile = path.join(__dirname, '..', 'auth', 'zhihu-cookies-latest.json');
  
  if (!fs.existsSync(cookieFile)) {
    throw new Error(`Cookie文件不存在: ${cookieFile}`);
  }
  
  const cookies = JSON.parse(fs.readFileSync(cookieFile, 'utf8'));
  console.log(`✅ 已加载 ${cookies.length} 个Cookie`);
  
  return cookies;
}

// 使用Cookie
const { chromium } = require('playwright');
const cookies = loadZhihuCookies();

const browser = await chromium.launch();
const context = await browser.newContext();
await context.addCookies(cookies);

const page = await context.newPage();
await page.goto('https://www.zhihu.com');
```

---

## ⚠️ 注意事项

1. **Cookie有效期**:
   - 知乎Cookie通常有效期为7-30天
   - 建议每天或每周重新提取一次

2. **安全性**:
   - Cookie文件包含登录信息，不要分享或提交到git
   - 已添加到`.gitignore`

3. **多账号**:
   - 如果有多个知乎账号，建议使用不同的用户数据目录
   - 或者在CDP模式下，在不同的浏览器窗口中登录不同的账号

4. **浏览器关闭**:
   - 方法1需要Chrome浏览器关闭
   - 方法2和方法3不需要关闭浏览器

---

## 🔧 故障排查

### 问题1: 未找到Cookie

**原因**: 浏览器未登录知乎

**解决**:
1. 在浏览器中手动登录知乎
2. 重新运行Cookie提取脚本

### 问题2: Cookie已过期

**原因**: Cookie有效期已过

**解决**:
1. 重新登录知乎
2. 重新提取Cookie
3. 配置定时任务，定期提取Cookie

### 问题3: 无法连接到CDP端点

**原因**: Chrome未使用`--remote-debugging-port`参数启动

**解决**:
1. 关闭所有Chrome浏览器
2. 使用以下命令启动Chrome:
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
   ```
3. 重新运行Cookie提取脚本

---

## 📚 相关文档

- [知乎自动化系统说明](../README.md)
- [Cookie管理说明](../docs/cookie-management.md)
- [自动化发布脚本](../docs/auto-publish-guide.md)

---

**更新时间**: 2026-03-28
**维护者**: 无何有
