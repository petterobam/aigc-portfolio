# 任务列表 - 浏览器自动化守护者

> 每次心跳后同步更新任务状态。任务不更新等于任务不存在。

---

## 🎯 P0 任务（紧急 / 进行中）

### 13. 重写 check-fanqie-login.js（直接使用 Playwright API）

- **状态**：⏳ 待完成
- **创建时间**：2026-03-25 20:17 (cron heartbeat)
- **说明**：修复脚本错误，直接使用 Playwright API，不依赖 mcporter 命令
- **背景**：
  - `check-fanqie-login.js` 脚本依赖 mcporter 命令
  - 调用 `playwright.browser_run_code` MCP 时出现 `page is not defined` 错误
  - 已知问题 #002，需要修复
- **步骤**：
  1. 参考 `test-playwright-simple.js` 的实现（已成功验证）
  2. 直接使用 Playwright API（不依赖 mcporter 命令）
  3. 验证脚本能够正常检查登录状态
  4. 测试运行：`node scripts/check-fanqie-login.js`
  5. 确认能正常访问番茄后台且无报错
  6. 更新 `state/current-state.md` 中的登录检查状态
- **验证标准**：运行 `node scripts/check-fanqie-login.js`，确认能正常访问番茄后台且无报错
- **关联问题**：#002
- **下一步**：完成后重新执行登录状态检查，记录到 `logs/latest.md`

### 12. 验证完整发布流程 ✅ 已完成

- **状态**：✅ 已完成（2026-03-25 19:23）
- **发现时间**：2026-03-25 19:17 (cron heartbeat)
- **完成时间**：2026-03-25 19:23 (cron heartbeat)
- **说明**：验证 Playwright 发布流程的后续步骤，为 35号故事（今晚 20:30 发布）准备自动化脚本
- **背景**：
  - P0 任务 #11 已完成：Playwright 能够完成发布流程的核心步骤
  - 35号故事发布时间：2026-03-25 20:30
  - 需要完整验证所有步骤：封面、标签、简介、发布
- **结果**：
  - ✅ 分析发布流程第二页结构（封面设置、作品分类、试读比例、发布协议）
  - ✅ 创建简化版自动发布脚本 `auto-publish-fanqie-simple.js`
  - ✅ 脚本能够完成自动化步骤：
    * 访问作家后台
    * 创建新短故事
    * 填写标题和正文
    * 点击"下一步"进入设置页面
    * 勾选发布协议
  - ⚠️ 需要手动完成的步骤：
    * 设置作品分类（建议选择"古代言情"或"穿越"）
    * 上传封面（可选）
    * 点击"发布"按钮
  - ✅ 更新 `state/current-state.md` 中的发布能力状态
- **关键发现**：
  - 第二页包含：封面设置、作品分类、试读比例、发布协议
  - "下一步"按钮：`#app button:has-text("下一步").btn-primary-variant`
  - 存草稿按钮：`arco-btn.short-publish-save-draft-btn`
  - 发布协议：`input[type="checkbox"]`
- **使用方法**：
  ```bash
  # 在 20:25 左右运行，为手动操作预留时间
  cd /Users/oyjie/.openclaw/workspace
  node scripts/auto-publish-fanqie-simple.js
  ```
- **结论**：部分自动化（约 70% 步骤可自动化，剩余 30% 需要人工辅助）
- **关联问题**：最高优先级任务 2
- **下一步**：为 35号故事执行自动发布（20:25 左右）

### 11. 测试 Playwright 自动化发布能力 ✅ 已完成

- **状态**：✅ 已完成（2026-03-25 19:17）
- **发现时间**：2026-03-25 19:02 (cron heartbeat)
- **完成时间**：2026-03-25 19:17 (cron heartbeat)
- **说明**：验证 Playwright 是否能够完成番茄小说发布流程，为 35号故事（今晚 20:30 发布）准备自动化发布
- **背景**：
  - 最高优先级任务之一："浏览器的操作番茄小说能够做到完全自动化，含发布、分析、运营等一系列操作"
  - 35号故事发布时间：2026-03-25 20:30
- **结果**：
  - ✅ 创建自动化发布测试脚本 `test-publish-fanqie.js`
  - ✅ 成功分析页面结构，找到正确的发布页面 URL
  - ✅ 成功完成发布流程前 4 个步骤：
    * 访问作家后台
    * 进入发布页面
    * 填写标题："穿成太子妃，发现太子心里只有我"
    * 填写正文：6442 字符
    * 点击"下一步"按钮
  - ✅ 保存 2 张截图和测试结果 JSON
  - ✅ 更新 `state/current-state.md` 中的发布能力状态
- **关键发现**：
  - 作家后台 URL：https://fanqienovel.com/main/writer/short-manage
  - 发布页面 URL：https://fanqienovel.com/main/writer/publish-short/?enter_from=NEWCHAPTER_1
  - 标题输入框：`textarea.byte-textarea.serial-textarea`
  - 正文编辑器：`div.ProseMirror.payNode-helper-content`
  - "下一步"按钮：`button.arco-btn-secondary.btn-prim`
- **结论**：Playwright 能够完成番茄小说发布流程的核心步骤！
- **关联问题**：最高优先级任务 2
- **下一步**：任务 #12（验证完整发布流程）

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

### 2. 重写 `check-fanqie-login.js`（直接使用 Playwright API）

- **状态**：⏳ 待完成
- **说明**：原脚本依赖 mcporter 命令，已验证 Playwright 可以独立运行，需要重写
- **步骤**：
  1. 参考 `test-playwright-simple.js` 的实现
  2. 直接使用 Playwright API（不依赖 mcporter 命令）
  3. 验证脚本能够正常检查登录状态
  4. 更新 `state/current-state.md` 中的登录检查状态
- **验证标准**：运行 `node scripts/check-fanqie-login.js`，确认能正常访问番茄后台且无报错

---

### 3. 重写 `fetch-story-list-chrome-v4.js`（直接使用 Playwright API）

- **状态**：⏳ 待完成
- **说明**：原脚本可能依赖 mcporter 命令，需要重写
- **步骤**：
  1. 参考 `test-playwright-simple.js` 的实现
  2. 直接使用 Playwright API（不依赖 mcporter 命令）
  3. 验证脚本能够正常抓取数据
  4. 生成数据文件 `data/story-list-all-*.json` 和 `.csv`
- **验证标准**：运行脚本，确认能正常生成数据文件

---

### 4. 配置 heartbeat 自动检查 job

- **状态**：⏳ 待用户配置
- **说明**：用户配置定时 job，触发 HEARTBEAT.md 中的检查流程
- **建议频率**：每天一次（Cookie 检查），每周一次（完整健康检查）
- **前置条件**：任务 1、2、3 完成

---

## 📆 P2 任务（本月）

### 5. 完成首次 Cookie 提取并验证 ✅

- **状态**：✅ 已完成（2026-03-25 首次心跳）
- **说明**：确保 `cookies/latest.json` 存在且登录态有效，这是所有后续脚本的前提
- **结果**：
  - `cookies/latest.json` 已创建，26 个 Cookie，16 个 httpOnly
  - 登录状态正常（作家后台未被重定向，用户区域可见）
  - sid_tt 过期时间：2026-05-19（剩余 55 天）
  - sessionid 过期时间：2027-03-20（剩余 360 天）

---

### 6. 验证 fetch-story-list-chrome-v4.js 端到端运行

- **状态**：⏳ 待完成
- **说明**：验证主力抓取脚本在当前 Cookie 下正常工作
- **验证命令**：`exec cd /Users/oyjie/.openclaw/workspace && node scripts/fetch-story-list-chrome-v4.js`
- **预期输出**：`data/story-list-all-*.json` 和 `.csv` 文件生成

---

### 7. 补充 docs/ 下的参考文档

- **状态**：⏳ 待完成
- **子任务**：
  - [ ] `docs/chrome-debug-launch.md` — Chrome CDP 启动命令（各平台）
  - [ ] `docs/extract-code-reference.md` — Playwright API 代码片段
  - [ ] `docs/architecture.md` — 整体架构设计

---

### 8. 建立 Cookie 轮换归档机制

- **状态**：💡 设计中
- **说明**：每次提取后归档旧 Cookie，保留最近 5 份，超出自动清理
- **现有支持**：`cookie-manager.js` 中 `cleanupOldCookieFiles(5)` 已实现
- **待做**：在 heartbeat 检查流程中集成清理步骤

---

## 🗓️ P3 任务（长期 / 备选）

### 9. 探索 Chrome 持久化启动方案（macOS LaunchAgent）

- **状态**：💡 待调研
- **说明**：将 Chrome 调试模式注册为 macOS LaunchAgent，开机自启，无需每次手动启动
- **参考**：`~/Library/LaunchAgents/` 目录下的 plist 配置

---

### 10. 多账号 Cookie 管理

- **状态**：💡 待调研
- **说明**：如果将来需要管理多个番茄账号，cookie-manager.js 需支持账号隔离

---

### 11. Cookie 失效主动通知

- **状态**：💡 待设计
- **说明**：Cookie 过期前 3 天通过飞书/消息通知用户，而不是等 job 失败后才发现

---

### 10. 修复 MCPorter 守护进程（已解决）✅

- **状态**：✅ 已解决（2026-03-25 19:02）
- **说明**：发现 Playwright 可以独立运行，不需要 MCPorter 守护进程
- **解决方法**：直接使用 Playwright API，不依赖 mcporter 命令
- **验证标准**：运行 `node scripts/test-playwright-simple.js`，确认能正常访问番茄后台
- **关联问题**：已关闭

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
| P0 紧急 | 1 |
| P1 本周 | 3 |
| P2 本月 | 4 |
| P3 长期 | 3 |
| 已完成 | 5 |

---

## 📝 更新记录

### 2026-03-25 20:17
- **添加 P0 任务 #13**：重写 check-fanqie-login.js（直接使用 Playwright API）
- **发现并记录问题 #002**：check-fanqie-login.js 脚本依赖 mcporter 命令，执行时报错 "page is not defined"
- **更新任务统计**：P0 紧急任务从 0 增加到 1
- **更新 state/current-state.md**：
  * Cookie 剩余天数从 360 天更新为 359 天
  * 登录状态从"✅ 已登录"改为"❌ 检查脚本报错"
  * 系统健康评分从"🟢 良好"改为"🟡 一般"
  * 添加问题 #002 到已知问题列表
  * 添加关键发现"check-fanqie-login.js 脚本错误"
  * 更新当前任务优先级（将重写脚本提升为最高优先级）
  * 更新下次心跳建议（将重写脚本提升为最高优先级）
  * 添加历史状态快照（2026-03-25 20:17）
- **更新 logs/latest.md**：记录本次心跳的检查结果和发现

### 2026-03-25 19:23
- **P0 任务 #12 完成**：验证完整发布流程（第二页结构分析 + 简化版自动发布脚本）
- 分析发布流程第二页结构（封面设置、作品分类、试读比例、发布协议）
- 创建简化版自动发布脚本 `auto-publish-fanqie-simple.js`
- 脚本能够完成约 70% 的自动化步骤（访问、填写、勾选协议）
- 剩余 30% 需要手动完成（设置分类、上传封面、点击发布）
- 更新 `state/current-state.md`：发布能力状态 ✅ 部分自动化
- 更新 `logs/latest.md`：记录本次心跳的发现和结果

### 2026-03-25 19:17
- **P0 任务 #11 完成**：测试 Playwright 自动化发布能力（核心步骤验证通过）
- 添加 P0 任务 #12：验证完整发布流程（封面、标签、简介、发布）
- 创建发布测试脚本 `test-publish-fanqie.js`
- 分析页面结构，找到正确的发布页面 URL
- 成功验证发布流程前 4 个步骤（访问、填写标题、填写正文、点击下一步）
- 保存 2 张截图和测试结果 JSON
- 更新 `state/current-state.md`：发布能力状态 ✅ 已验证
- 更新 `logs/latest.md`：记录本次心跳的发现和结果

### 2026-03-25 19:02
- 添加 P0 任务 #11：测试 Playwright 自动化发布能力（为 35号故事发布准备）
- 添加 P1 任务 #2：重写 `check-fanqie-login.js`
- 添加 P1 任务 #3：重写 `fetch-story-list-chrome-v4.js`
- 解决问题 #010：发现 Playwright 可以独立运行，不需要 MCPorter 守护进程
- 更新 `state/current-state.md` 建立系统基线
- 更新 `logs/latest.md` 记录测试结果

### 2026-03-25 18:11
- 初始化任务列表
- 记录技能建立完成（任务 0 关闭）
- 列出近期优先任务（1、2、3）
- 发现问题 #001：CDP 端口未配置，任务 1 升为本周首要目标
- 发现问题 #002：MCPorter 超时，Playwright 不可用
- 更新 `state/current-state.md` 建立系统基线

### 2026-03-25（首次心跳）
- 任务 5 关闭：首次 Cookie 提取完成，`cookies/latest.json` 已创建
- 发现问题 #001：CDP 端口未配置，任务 1 升为本周首要目标
- 发现问题 #002：方式 B 自动刷新不可用，依赖任务 1 解决
- 更新 `state/current-state.md` 建立系统基线

---

**维护者**：心跳时刻 - 浏览器自动化守护者
**文件状态**：活跃，每次心跳后更新
