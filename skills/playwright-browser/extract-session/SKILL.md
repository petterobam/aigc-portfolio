---
name: playwright-extract-session
description: |
  从用户已登录的 Chrome 浏览器提取完整 Session Cookie（含 httpOnly 登录 token），
  保存到 cookies/latest.json，供所有番茄小说自动化脚本复用。
  无需手动登录，无需维护独立的用户数据目录。
  Triggers: 提取 cookie、刷新登录状态、session 过期、cookie 失效、重新获取登录态、
            更新 cookie、番茄登录、保存会话、浏览器 session。
  Parent skill: playwright-browser
---

# 子技能：从已有 Chrome 提取 Session Cookie

> **适用上下文**：Claude / Cline 直接对话（方式 A），或配置了 CDP 调试端口的自动化环境（方式 B）。

---

## 原理

Playwright MCP 工具在 **Claude/Cline 直接对话**中 attach 的是用户当前已打开、已登录的真实 Chrome，
而非新启动的隔离 Chromium。因此通过 `page.context().cookies()` 可以拿到**完整的 Cookie，
包括 httpOnly 登录 token**（`sessionid`、`sid_tt`、`odin_tt` 等）。

已验证数据（2025-03）：
- 番茄相关 Cookie：26 个
- 其中 httpOnly：16 个（传统 `document.cookie` 无法获取）
- `sessionid` 有效期约 60 天

---

## 方式 A：Claude/Cline 对话中手动提取

### 执行步骤

1. 在对话中调用 `browser_run_code`，执行提取逻辑（见 `docs/extract-code-reference.md`）
2. `browser_run_code` 返回 Cookie JSON 数组
3. 通过 `exec` 运行保存脚本，将返回值写入 `cookies/latest.json`

> `browser_run_code` 内部不支持 `require()`，Cookie 数据需通过返回值传出，
> 再由独立的 Node.js 命令保存到磁盘。

### 核心脚本

保存操作使用：`scripts/save-cookies-from-json.js`（接收 stdin JSON 写入 latest.json）

---

## 方式 B：connectOverCDP 自动化脚本（GLM Agent / cron）

Chrome 需以 CDP 调试端口启动（**一次性设置**，完全退出 Chrome 后执行）：

- 启动命令见：`docs/chrome-debug-launch.md`
- 默认端口：`9222`

启动后执行提取脚本：

```
exec cd ~/.openclaw/workspace && node scripts/extract-cookies-from-browser.js
```

脚本会自动：
1. 连接 CDP 端口
2. 过滤番茄相关 Cookie
3. 保存到 `cookies/latest.json`（同时归档带时间戳的副本）

---

## 检查 Cookie 有效期

运行检查命令：

```
exec cd ~/.openclaw/workspace && node scripts/check-cookie-expiry.js
```

输出示例：
- ✅ Cookie 有效，过期时间：2026-05-19，剩余 55 天
- ⚠️ Cookie 即将过期，剩余 3 天，建议提前刷新
- ❌ Cookie 无效或文件不存在，需重新提取

---

## 其他脚本加载 Cookie

任意 Playwright 脚本注入登录态：

- 工具函数：`scripts/extract-cookies-from-browser.js` 导出 `loadLatestCookies(context)`
- 直接读取：`cookies/latest.json`（标准 Playwright Cookie JSON 格式）

---

## 输出文件

| 文件 | 说明 |
|------|------|
| `cookies/latest.json` | 始终指向最新提取结果，供脚本直接引用 |
| `cookies/fanqie-live-session-<ts>.json` | 带时间戳归档，每次提取生成一个 |

---

## 两种方式对比

| | 方式 A（browser_run_code） | 方式 B（connectOverCDP） |
|---|---|---|
| **前提** | Claude/Cline 对话中执行 | Chrome 需开启 `--remote-debugging-port=9222` |
| **httpOnly Cookie** | ✅ 全部可取 | ✅ 全部可取 |
| **可在 cron / GLM Agent 中自动运行** | ❌ 需人工触发 | ✅ 全自动 |
| **无需修改 Chrome 启动参数** | ✅ | ❌ 需一次性配置 |
| **推荐场景** | 临时提取、应急刷新 | 定期自动刷新（heartbeat job） |

---

## 注意事项

- Cookie 包含登录凭证，**不要提交到 git 仓库**（`cookies/` 已在 `.gitignore`）
- 方式 A 的 `browser_run_code` **只能在 Claude/Cline 直接对话中使用**，GLM Agent 的 `browser_run_code` 启动的是新 Chromium，没有真实 session
- 方式 B 的脚本仅 attach 到 Chrome，不会关闭浏览器
- 番茄小说 `sessionid` 有效期约 60 天，建议配置 heartbeat 在过期前 7 天自动提醒或刷新

---

**相关文件**：
- `scripts/extract-cookies-from-browser.js` — 核心脚本（CDP 连接、Cookie 过滤、保存、有效期检查）
- `cookies/latest.json` — 最新 Cookie 文件
- `docs/extract-code-reference.md` — browser_run_code 代码片段参考
- `docs/chrome-debug-launch.md` — Chrome CDP 调试模式启动说明
- 父技能：[playwright-browser/SKILL.md](../SKILL.md)