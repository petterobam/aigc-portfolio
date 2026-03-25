# browser_run_code 代码片段参考

> 本文件是 `extract-session` 子技能的代码挂载点。
> SKILL.md 中不内联代码，具体实现统一存放于此。

---

## 适用上下文

以下代码片段仅在 **Claude / Cline 直接对话**中通过 `browser_run_code` 执行有效。
此时 MCP 连接的是用户已登录的真实 Chrome，`page.context().cookies()` 能拿到完整 Cookie（含 httpOnly）。

GLM Agent / cron 中请使用方式 B（`scripts/extract-cookies-from-browser.js`），不要使用本文件的片段。

---

## 片段 A：提取番茄相关 Cookie（完整版）

用于正式提取，返回 Cookie 数组及有效性摘要。

```javascript
async (page) => {
  const context = page.context();
  const allCookies = await context.cookies();

  const FANQIE_DOMAINS = [
    'fanqienovel.com',
    '.fanqienovel.com',
    'bytedance.com',
    '.bytedance.com',
    'snssdk.com',
    '.snssdk.com',
    'xxbg.snssdk.com',
    'bytedance.larkoffice.com',
  ];

  const SESSION_KEYS = ['sessionid', 'sid_tt', 'uid_tt', 'odin_tt'];

  const fanqieCookies = allCookies.filter(c =>
    FANQIE_DOMAINS.some(d => c.domain === d || c.domain.endsWith(d))
  );

  const sessionCookie = fanqieCookies.find(c => SESSION_KEYS.includes(c.name));

  return {
    count:          fanqieCookies.length,
    httpOnlyCount:  fanqieCookies.filter(c => c.httpOnly).length,
    sessionValid:   !!sessionCookie?.value,
    sessionExpires: sessionCookie?.expires
      ? new Date(sessionCookie.expires * 1000).toISOString()
      : null,
    daysLeft: sessionCookie?.expires
      ? Math.floor((sessionCookie.expires * 1000 - Date.now()) / 86400000)
      : null,
    domains:  [...new Set(fanqieCookies.map(c => c.domain))],
    cookies:  fanqieCookies,
  };
}
```

**预期返回示例：**

```json
{
  "count": 26,
  "httpOnlyCount": 16,
  "sessionValid": true,
  "sessionExpires": "2026-05-19T12:14:47.576Z",
  "daysLeft": 55,
  "domains": [".fanqienovel.com", "fanqienovel.com", ".bytedance.com", "xxbg.snssdk.com"],
  "cookies": [ ... ]
}
```

---

## 片段 B：快速有效期检查（轻量版）

仅检查有效期，不返回完整 Cookie 数据，适合心跳检查场景。

```javascript
async (page) => {
  const context = page.context();
  const cookies = await context.cookies();

  const SESSION_KEYS = ['sessionid', 'sid_tt'];
  const session = cookies.find(c =>
    SESSION_KEYS.includes(c.name) && c.domain.includes('fanqienovel.com')
  );

  if (!session) {
    return { valid: false, reason: 'session cookie not found' };
  }

  const expiresAt = session.expires > 0
    ? new Date(session.expires * 1000).toISOString()
    : null;
  const daysLeft = session.expires > 0
    ? Math.floor((session.expires * 1000 - Date.now()) / 86400000)
    : Infinity;

  return {
    valid:     daysLeft > 0,
    name:      session.name,
    expiresAt,
    daysLeft,
    warning:   daysLeft < 7 ? '⚠️ Cookie 将在 7 天内过期' : null,
  };
}
```

---

## 片段 C：确认当前 Chrome 是真实浏览器（诊断用）

用于确认 MCP 当前连接的是真实 Chrome 而非隔离 Chromium。

```javascript
async (page) => {
  const context = page.context();
  const allCookies = await context.cookies();

  return {
    totalCookies: allCookies.length,
    isRealChrome: allCookies.length > 100,   // 真实 Chrome 通常 > 100 个 cookie
    currentUrl:   page.url(),
    domains:      [...new Set(allCookies.map(c => c.domain))].slice(0, 10),
  };
}
```

**判断依据**：
- `isRealChrome: true`（totalCookies > 100）→ 连接的是用户真实 Chrome，Cookie 可信
- `isRealChrome: false`（totalCookies 接近 0）→ 连接的是新 Chromium，拿不到真实 session

---

## 片段 D：提取后保存（exec 命令）

`browser_run_code` 不支持 `require()`，无法在片段内部直接写文件。
提取到 Cookie 数据后，通过以下 `exec` 命令保存：

```bash
# 将片段 A 返回的 cookies 数组替换 COOKIES_JSON_HERE 后执行
exec node -e "
const fs   = require('fs');
const path = require('path');
const cookies = COOKIES_JSON_HERE;
const dir  = path.join(process.env.HOME, '.openclaw/workspace/cookies');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
const ts      = new Date().toISOString().replace(/[:.]/g, '-');
const archive = path.join(dir, 'fanqie-live-session-' + ts + '.json');
const latest  = path.join(dir, 'latest.json');
fs.writeFileSync(archive, JSON.stringify(cookies, null, 2));
fs.writeFileSync(latest,  JSON.stringify(cookies, null, 2));
console.log('✅ saved', cookies.length, 'cookies to', latest);
"
```

---

## 已验证数据（2025-03-25）

| 指标 | 数值 |
|------|------|
| Chrome 总 Cookie 数 | 1636 |
| `isRealChrome` | true |
| 番茄相关 Cookie 数 | 26 |
| httpOnly 数量 | 16 |
| sessionid 过期时间 | 2026-05-19T12:14:47Z |
| 当前页面 URL | `https://fanqienovel.com/main/writer/short-data?tab=1` |

---

## 注意事项

- 片段中的 `FANQIE_DOMAINS` 和 `SESSION_KEYS` 如需调整，直接修改本文件，保持与 `scripts/extract-cookies-from-browser.js` 中的常量同步
- `browser_run_code` 中不可使用 `require()`、`fs`、`path` 等 Node.js 模块
- 返回值大小有限制，`cookies` 数组通常 26 个左右，不会超限
- 如果 `sessionValid: false`，先确认 Chrome 中番茄小说是否处于登录状态，再重试