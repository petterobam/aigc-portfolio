# 任务列表 - 浏览器自动化守护者

> 每次心跳后同步更新任务状态。任务不更新等于任务不存在。

---

## 🎯 P0 任务（紧急 / 进行中）

_当前无 P0 任务。_

---

## 📅 P1 任务（本周）

### 1. 配置 Chrome CDP 调试端口（方式 B 自动刷新前提）

- **状态**：⏳ 待完成
- **说明**：Chrome 以 `--remote-debugging-port=9222` 启动后，heartbeat job 可自动刷新 Cookie，无需人工介入
- **步骤**：
  1. 完全退出 Chrome（Cmd+Q）
  2. 用调试模式启动（参见 `docs/chrome-debug-launch.md`）
  3. 运行 `node scripts/extract-cookies-from-browser.js` 验证连通性
  4. 更新 `state/current-state.md` 中的 CDP 状态

---

### 2. 完成首次 Cookie 提取并验证 ✅

- **状态**：✅ 已完成（2026-03-25 首次心跳）
- **说明**：确保 `cookies/latest.json` 存在且登录态有效，这是所有后续脚本的前提
- **结果**：
  - `cookies/latest.json` 已创建，26 个 Cookie，16 个 httpOnly
  - 登录状态正常（作家后台未被重定向，用户区域可见）
  - sid_tt 过期时间：2026-05-19（剩余 55 天）
  - sessionid 过期时间：2027-03-20（剩余 360 天）

---

### 3. 配置 heartbeat 自动检查 job

- **状态**：⏳ 待用户配置
- **说明**：用户配置定时 job，触发 HEARTBEAT.md 中的检查流程
- **建议频率**：每天一次（Cookie 检查），每周一次（完整健康检查）
- **前置条件**：任务 1、2 完成

---

## 📆 P2 任务（本月）

### 4. 验证 fetch-story-list-chrome-v4.js 端到端运行

- **状态**：⏳ 待完成
- **说明**：验证主力抓取脚本在当前 Cookie 下正常工作
- **验证命令**：`exec cd /Users/oyjie/.openclaw/workspace && node scripts/fetch-story-list-chrome-v4.js`
- **预期输出**：`data/story-list-all-*.json` 和 `.csv` 文件生成

---

### 5. 补充 docs/ 下的参考文档

- **状态**：⏳ 待完成
- **子任务**：
  - [ ] `docs/chrome-debug-launch.md` — Chrome CDP 启动命令（各平台）
  - [ ] `docs/extract-code-reference.md` — browser_run_code 代码片段（方式 A）
  - [ ] `docs/architecture.md` — 整体架构设计

---

### 6. 建立 Cookie 轮换归档机制

- **状态**：💡 设计中
- **说明**：每次提取后归档旧 Cookie，保留最近 5 份，超出自动清理
- **现有支持**：`cookie-manager.js` 中 `cleanupOldCookieFiles(5)` 已实现
- **待做**：在 heartbeat 检查流程中集成清理步骤

---

## 🗓️ P3 任务（长期 / 备选）

### 7. 探索 Chrome 持久化启动方案（macOS LaunchAgent）

- **状态**：💡 待调研
- **说明**：将 Chrome 调试模式注册为 macOS LaunchAgent，开机自启，无需每次手动启动
- **参考**：`~/Library/LaunchAgents/` 目录下的 plist 配置

---

### 8. 多账号 Cookie 管理

- **状态**：💡 待调研
- **说明**：如果将来需要管理多个番茄账号，cookie-manager.js 需支持账号隔离

---

### 9. Cookie 失效主动通知

- **状态**：💡 待设计
- **说明**：Cookie 过期前 3 天通过飞书/消息通知用户，而不是等 job 失败后才发现

---

## ✅ 已完成任务

### 0. 建立 playwright-browser skill 基础结构

- **完成时间**：2026-03
- **内容**：
  - 创建 SKILL.md（无内联代码，引用外部脚本）
  - 创建 HEARTBEAT.md（自动检查 job 驱动指南）
  - 创建标准目录：state/、tasks/、logs/、reports/、docs/
  - 创建子技能 extract-session/SKILL.md
  - 创建核心脚本 scripts/extract-cookies-from-browser.js
  - 验证 browser_run_code 在 Claude/Cline 对话中能拿到真实 Chrome Cookie（26 个番茄 Cookie，16 个 httpOnly）

---

## 📊 任务统计

| 状态 | 数量 |
|------|------|
| P0 紧急 | 0 |
| P1 本周 | 2 |
| P2 本月 | 3 |
| P3 长期 | 3 |
| 已完成 | 2 |

---

## 📝 更新记录

### 2026-03-25
- 初始化任务列表
- 记录技能建立完成（任务 0 关闭）
- 列出近期优先任务（1、2、3）

### 2026-03-25（首次心跳）
- 任务 2 关闭：首次 Cookie 提取完成，`cookies/latest.json` 已创建
- 发现问题 #001：CDP 端口未配置，任务 1 升为本周首要目标
- 发现问题 #002：方式 B 自动刷新不可用，依赖任务 1 解决
- 更新 `state/current-state.md` 建立系统基线

---

**维护者**：心跳时刻 - 浏览器自动化守护者
**文件状态**：活跃，每次心跳后更新