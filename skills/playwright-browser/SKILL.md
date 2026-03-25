---
name: playwright-browser
version: 1.0.0
description: |
  使用 Playwright 控制浏览器完成自动化任务。适用于网页截图、表单填写、页面内容抓取、UI 自动化、网页交互等。
  Triggers: 打开网页、截图、抓取页面、填写表单、点击按钮、自动化测试、爬取数据、网页操作、番茄数据、番茄分析、番茄发布。
author: 心跳时刻 - 番茄小说创作和运营
keywords: [playwright, browser, automation, fanqie, cookie, session]
metadata:
  openclaw:
    emoji: "🌐"
---

# 浏览器控制 Skill 🌐

**通过 Playwright 驱动浏览器，覆盖数据抓取、会话管理、自动化发布等所有浏览器操作场景。**

---

## 两种运行上下文（必读）

操作前必须先确认当前上下文，两种上下文的工具和能力完全不同：

| 上下文 | 可用工具 | Cookie / 登录态 | 适合场景 |
|--------|----------|----------------|----------|
| **Claude / Cline 直接对话** | `browser_navigate`、`browser_snapshot`、`browser_click`、`browser_run_code` 等 | ✅ 连接已登录的真实 Chrome，完整保留 | 交互式操作、提取 Session、临时任务 |
| **OpenClaw GLM Agent**（heartbeat / cron） | `exec`（运行脚本） | ✅ 脚本使用持久化 Chrome 上下文或注入 Cookie | 定时抓取、自动化 job、数据监控 |

**会话丢失的根因**：GLM Agent 如果直接用 `browser_run_code`，每次都会启动一个全新的、无 Cookie 的 Chromium，访问需要登录的页面会被跳转到登录页。**解决方案是通过 `exec` 调用脚本，脚本内部负责管理 Cookie。**

---

## 可用脚本

所有脚本位于 `~/.openclaw/workspace/scripts/`，通过 `exec` 调用。

### 番茄小说数据抓取

| 脚本 | 说明 |
|------|------|
| `fetch-story-list-chrome-v4.js` | 抓取短故事列表（含分页、阅读量、字数） |
| `fetch-story-list-chrome-v3.js` | 抓取短故事列表（API 版本） |
| `fetch-short-story-data.js` | 抓取短篇数据详情 |
| `daily-data-monitor.js` | 每日数据监控 |
| `fanqie-weekly-monitor.js` | 每周数据监控 |

### Session / Cookie 管理

| 脚本 | 说明 |
|------|------|
| `extract-cookies-from-browser.js` | 通过 CDP 从已运行的 Chrome 提取完整 Cookie（含 httpOnly） |
| `cookie-manager.js` | 加载、保存、列出、检查 Cookie 文件 |
| `check-fanqie-login.js` | 检查番茄小说登录状态 |
| `login-save-cookies.js` | 打开浏览器手动登录并保存 Cookie |

### 内容质量

| 脚本 | 说明 |
|------|------|
| `check-duplicates-strict.py` | 严格模式重复段落检测 |
| `check-duplicate-paragraphs.py` | 段落级重复检测 |

脚本完整说明见 `~/.openclaw/workspace/scripts/README.md`。

---

## Session 管理

登录态是所有需要认证操作的基础。具体提取方法见子技能：

**→ 子技能 [`playwright-extract-session`](./extract-session/SKILL.md)**

提取结果保存在 `~/.openclaw/workspace/cookies/latest.json`，供所有脚本通过 `loadLatestCookies(context)` 加载。

番茄 `sessionid` 有效期约 **60 天**，建议每月提取一次，或在 Cookie 失效时立即刷新。

---

## 交互式操作工具（Claude / Cline 直接对话）

在直接对话中，以下工具连接的是用户已打开、已登录的真实 Chrome：

**导航与观察**：`browser_navigate` / `browser_snapshot` / `browser_take_screenshot` / `browser_navigate_back` / `browser_wait_for`

**交互**：`browser_click` / `browser_type` / `browser_fill_form` / `browser_press_key` / `browser_hover` / `browser_select_option`

**数据与调试**：`browser_evaluate` / `browser_run_code` / `browser_network_requests` / `browser_console_messages` / `browser_tabs`

**操作节奏**：先 `browser_snapshot` 获取页面快照和元素 `ref`，再用 `ref` 执行点击、输入等操作。不要猜测 `ref`，每次操作前都应先拿快照。

---

## 工作目录结构

```
playwright-browser/
├── SKILL.md              技术规范（本文件）
├── HEARTBEAT.md          心跳 job 驱动指南
├── README.md             系统定位与使用说明
├── state/
│   └── current-state.md  当前系统状态（每次心跳后更新）
├── tasks/
│   ├── README.md
│   └── task-list.md      任务清单
├── logs/
│   └── latest.md         最新执行日志
├── reports/              历史检查报告
├── docs/                 设计文档与技术调研
├── extract-session/
│   └── SKILL.md          子技能：从 Chrome 提取 Session
├── debugging.md          调试指南
└── mcp-config.json       MCP 配置
```

---

## 注意事项

1. **GLM Agent 访问番茄小说后台必须用脚本**：通过 `exec` 调用带持久化上下文的脚本，不能裸用 `browser_run_code`
2. **交互式工具只在 Claude/Cline 直接对话中有效**：GLM Agent 没有这些工具
3. **写操作必须向用户确认**：发布、提交、删除等不可逆操作，执行前询问
4. **Cookie 安全**：`cookies/` 目录下的文件包含登录凭证，不要提交到 git
5. **先快照再操作**：`ref` 是操作元素的唯一凭证，每次交互前都需要最新快照

---

**当前状态**：详见 `state/current-state.md`
**调试参考**：详见 `debugging.md`
**维护者**：心跳时刻 - 番茄小说创作和运营
**版本**：v1.0.0