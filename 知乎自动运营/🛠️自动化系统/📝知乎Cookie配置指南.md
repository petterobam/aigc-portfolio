# 知乎 Cookie 配置指南

> **目的**: 为知乎自动化发布脚本配置登录态 Cookie，确保能够正常发布内容
> **配置文件**: `auth/zhihu-cookies-latest.json`
> **最后更新**: 2026-03-28

---

## 📋 概述

知乎自动化发布脚本需要登录态 Cookie 才能正常工作。本指南提供 3 种配置方法，从简单到复杂，选择最适合你的方法。

---

## 🔧 方法 1：使用 Playwright MCP（推荐）

**适用场景**: 已安装 Playwright MCP，且浏览器以调试端口启动

### 步骤

1. **启动 Chrome 调试模式**（如果尚未启动）

   ```bash
   # macOS
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 \
     --no-first-run \
     --no-default-browser-check \
     --profile-directory=Default

   # Linux
   google-chrome --remote-debugging-port=9222

   # Windows
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
   ```

2. **在浏览器中登录知乎**

   - 访问 https://www.zhihu.com
   - 使用扫码登录或密码登录
   - 确保登录成功

3. **提取 Cookie**

   ```bash
   cd ~/.openclaw/workspace
   node scripts/extract-zhihu-cookies-from-browser.js
   ```

4. **验证 Cookie**

   ```bash
   cd ~/.openclaw/workspace/知乎自动运营
   node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
   ```

### 输出位置

- **Cookie 文件**: `cookies/zhihu-live-session-<timestamp>.json`
- **快捷引用**: `cookies/zhihu-latest.json`
- **知乎项目引用**: `知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json`

---

## 🔧 方法 2：手动登录并保存

**适用场景**: 浏览器无法以调试端口启动

### 步骤

1. **运行登录脚本**

   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/login-zhihu-save-cookies.js
   ```

2. **浏览器会自动打开并导航到知乎登录页面**

3. **在浏览器中登录**

   - 使用扫码登录或密码登录
   - 登录成功后，回到终端

4. **按 Enter 键确认登录成功**

5. **脚本会自动提取并保存 Cookie**

### 输出位置

- **Cookie 文件**: `auth/cookies.json`
- **Session 文件**: `auth/session.json`

---

## 🔧 方法 3：手动提取 Cookie（备用）

**适用场景**: 其他方法都失败时

### 步骤

1. **在浏览器中登录知乎**

   - 访问 https://www.zhihu.com
   - 使用扫码登录或密码登录
   - 确保登录成功

2. **打开开发者工具**

   - Chrome/Edge: `Cmd+Option+I` (macOS) / `F12` (Windows/Linux)
   - Firefox: `Cmd+Option+K` (macOS) / `F12` (Windows/Linux)

3. **切换到 Application 标签**

   - Chrome/Edge: Application → Cookies → https://www.zhihu.com
   - Firefox: Storage → Cookies → https://www.zhihu.com

4. **提取关键 Cookie**

   需要提取以下 Cookie：
   - `z_c0`: 知乎核心 token（最重要）
   - `d_c0`: 设备 cookie
   - `q_c1`: 设备标识
   - `zse93`: 知乎加解密 cookie

5. **创建 Cookie 文件**

   创建文件 `auth/zhihu-cookies-latest.json`，格式如下：

   ```json
   [
     {
       "name": "z_c0",
       "value": "你的 z_c0 值",
       "domain": ".zhihu.com",
       "path": "/",
       "expires": -1,
       "httpOnly": true,
       "secure": true,
       "sameSite": "None"
     },
     {
       "name": "d_c0",
       "value": "你的 d_c0 值",
       "domain": ".zhihu.com",
       "path": "/",
       "expires": -1,
       "httpOnly": false,
       "secure": false,
       "sameSite": "Lax"
     }
   ]
   ```

6. **验证 Cookie**

   ```bash
   cd ~/.openclaw/workspace/知乎自动运营
   node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
   ```

---

## ✅ 验证 Cookie

### 方法 1：使用验证脚本

```bash
cd ~/.openclaw/workspace/知乎自动运营
node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
```

### 方法 2：查看 Cookie 文件

```bash
cat auth/zhihu-cookies-latest.json | grep "z_c0\|d_c0"
```

### 方法 3：测试发布脚本

```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/publish/publish-zhihu-article.js scripts/publish/test-article.json
```

---

## ⚠️ 常见问题

### 1. Cookie 已过期

**症状**: 验证失败，提示"未检测到登录态"

**解决方案**:

```bash
# 重新提取 Cookie
cd ~/.openclaw/workspace
node scripts/extract-zhihu-cookies-from-browser.js

# 或重新登录
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/login-zhihu-save-cookies.js
```

### 2. CDP 端口不可达

**症状**: 提示"CDP 端口 9222 不可达"

**解决方案**:

```bash
# 1. 确认 Chrome 是否以调试端口启动
ps aux | grep "remote-debugging-port"

# 2. 如果没有启动，使用方法 1 中的命令启动 Chrome
# 3. 或使用方法 2（手动登录并保存）
```

### 3. 找不到关键 Cookie（z_c0 / d_c0）

**症状**: 提示"未检测到有效登录态 cookie"

**解决方案**:

- 确认浏览器中知乎已登录
- 尝试退出知乎并重新登录
- 检查 Cookie 域名是否正确（应该是 `.zhihu.com`）
- 尝试提取所有知乎相关 Cookie，而不是只提取特定域名

### 4. 发布脚本无法登录

**症状**: 发布时提示"登录检查失败"

**解决方案**:

```bash
# 1. 验证 Cookie
node 🛠️自动化系统/scripts/utils/check-zhihu-login.js

# 2. 重新提取 Cookie
cd ~/.openclaw/workspace
node scripts/extract-zhihu-cookies-from-browser.js

# 3. 检查 Cookie 文件路径
ls -la auth/zhihu-cookies-latest.json

# 4. 检查 Cookie 文件内容
cat auth/zhihu-cookies-latest.json | jq '.[0].name'
```

---

## 📝 Cookie 文件格式规范

### Cookie 数组格式

```json
[
  {
    "name": "cookie_name",
    "value": "cookie_value",
    "domain": ".zhihu.com",
    "path": "/",
    "expires": 1714589600,
    "httpOnly": true,
    "secure": true,
    "sameSite": "None"
  }
]
```

### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `name` | String | ✅ | Cookie 名称 |
| `value` | String | ✅ | Cookie 值 |
| `domain` | String | ✅ | Cookie 域名，建议使用 `.zhihu.com` |
| `path` | String | ✅ | Cookie 路径，通常为 `/` |
| `expires` | Number | ❌ | 过期时间（Unix 时间戳），-1 表示会话 Cookie |
| `httpOnly` | Boolean | ❌ | 是否为 httpOnly Cookie |
| `secure` | Boolean | ❌ | 是否只在 HTTPS 下传输 |
| `sameSite` | String | ❌ | SameSite 策略（Strict/Lax/None） |

---

## 🔄 Cookie 维护

### Cookie 有效期

- **z_c0**: 约 60 天
- **d_c0**: 约 1 年
- **q_c1**: 约 1 年

### 建议更新频率

- **每月**: 检查并更新 Cookie
- **登录失败时**: 立即更新 Cookie
- **脚本提示过期时**: 立即更新 Cookie

### Cookie 自动检测

脚本会自动检测 Cookie 是否过期：

```javascript
const expiry = checkZhihuCookieExpiry();
console.log(`Cookie 有效期: ${expiry.daysLeft} 天`);

if (expiry.daysLeft < 3) {
  console.log('⚠️ Cookie 即将过期，建议重新提取');
}
```

---

## 🔗 相关资源

- **Cookie 提取脚本**: `~/.openclaw/workspace/scripts/extract-zhihu-cookies-from-browser.js`
- **登录脚本**: `~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/login-zhihu-save-cookies.js`
- **验证脚本**: `~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/utils/check-zhihu-login.js`
- **发布脚本**: `~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/publish/publish-zhihu-article.js`
- **发布脚本文档**: `~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts/publish/README.md`

---

## 📋 配置检查清单

配置完成后，逐项检查：

- [ ] Cookie 文件已创建（`auth/zhihu-cookies-latest.json`）
- [ ] Cookie 文件格式正确（JSON 数组）
- [ ] 关键 Cookie 存在（z_c0、d_c0）
- [ ] Cookie 未过期（使用验证脚本检查）
- [ ] 发布脚本可以正常登录（使用测试文章验证）

---

**创建时间**: 2026-03-28
**版本**: v1.0.0
**状态**: ✅ 可用
