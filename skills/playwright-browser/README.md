# 浏览器控制 - Playwright Browser 🌐

浏览器自动化与 Session 管理技能，覆盖数据抓取、会话保持、自动化发布等所有需要浏览器的场景。

---

## 定位

这个 Skill 是番茄小说工作区所有浏览器操作的基础设施：

- **数据抓取**：抓取故事列表、数据统计、发布记录
- **Session 管理**：从真实 Chrome 提取完整登录态，供所有自动化脚本复用
- **自动化发布**：填写表单、提交内容、批量操作
- **健康监控**：定期检查 Cookie 有效期，在过期前自动预警或刷新

---

## 快速入口

| 我想做什么 | 参考文件 |
|-----------|---------|
| 了解技术规范和可用脚本 | `SKILL.md` |
| 配置自动检查 job | `HEARTBEAT.md` |
| 提取或刷新登录 Cookie | `extract-session/SKILL.md` |
| 查看当前系统状态 | `state/current-state.md` |
| 查看待办任务 | `tasks/task-list.md` |
| 查看最近执行日志 | `logs/latest.md` |
| 调试浏览器自动化问题 | `debugging.md` |

---

## 目录结构

```
playwright-browser/
├── SKILL.md                    技术规范：可用脚本、工具说明、注意事项
├── HEARTBEAT.md                心跳 job 驱动指南（自动检查与升级）
├── README.md                   本文件
├── mcp-config.json             Playwright MCP 服务配置
├── debugging.md                调试指南
│
├── extract-session/
│   └── SKILL.md                子技能：从已登录 Chrome 提取完整 Session Cookie
│
├── state/
│   └── current-state.md        当前系统状态（每次心跳后更新）
│
├── tasks/
│   ├── README.md               任务系统说明
│   └── task-list.md            任务清单（待办 / 进行中 / 已完成）
│
├── logs/
│   └── latest.md               最新一次心跳执行摘要
│
├── reports/                    历史检查报告归档
│
└── docs/                       设计文档与参考资料
    ├── architecture.md         系统架构设计
    ├── chrome-debug-launch.md  Chrome CDP 调试模式启动说明
    └── extract-code-reference.md  browser_run_code 代码片段参考
```

---

## 核心脚本（workspace/scripts/）

| 脚本 | 功能 |
|------|------|
| `extract-cookies-from-browser.js` | 通过 CDP 从运行中的 Chrome 提取完整 Cookie |
| `fetch-story-list-chrome-v4.js` | 抓取番茄短故事列表（推荐版本） |
| `daily-data-monitor.js` | 每日数据监控 |
| `fanqie-weekly-monitor.js` | 每周数据监控 |
| `cookie-manager.js` | Cookie 文件加载、保存、列出、检查 |
| `check-fanqie-login.js` | 检查登录状态 |
| `login-save-cookies.js` | 手动登录并保存 Cookie（备用方案） |

---

## Session 管理说明

番茄小说登录态（`sessionid`）有效期约 **60 天**。失效后所有需要登录的脚本都会失败。

**正常流程**：
1. 首次使用：Claude/Cline 对话中通过子技能 `playwright-extract-session` 提取
2. 日常维护：heartbeat job 定期检查有效期，在过期前 7 天预警
3. 到期刷新：手动触发提取，或（若 Chrome 开了 CDP 端口）自动刷新

Cookie 保存位置：`~/.openclaw/workspace/cookies/latest.json`

---

## 维护者

心跳时刻 - 番茄小说创作和运营
版本：v1.0.0
创建：2026-03