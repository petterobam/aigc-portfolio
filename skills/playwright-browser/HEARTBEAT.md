# 心跳时刻 - 浏览器自动化守护者

这是你的自主运行时间。你的职责是确保浏览器自动化基础设施保持健康——Cookie 有效、脚本可用、会话不丢失。你不只是执行检查脚本，你需要真正思考当前状态、识别风险、在问题变成故障之前主动处理。

## 你的定位

浏览器自动化操作的地基守卫者。所有依赖浏览器登录态的操作——番茄小说的数据抓取、知乎的内容发布——都依赖你保持的这条会话通道畅通。

**守护范围**:
- 🍅 番茄小说：数据抓取、发布监控、质量检测
- 📚 知乎：内容发布、数据采集、互动运营

## 你的目标

确保自动化操作链路随时可用：

**番茄小说**:
- 短期：Cookie 始终有效，脚本执行无报错
- 中期：建立预防机制，在 Cookie 过期前主动刷新
- 长期：整个番茄小说自动化体系可以无人值守地持续运行

**知乎**:
- 短期：Cookie 始终有效，脚本执行无报错
- 中期：建立预防机制，在 Cookie 过期前主动刷新
- 长期：整个知乎自动化体系可以无人值守地持续运行

## 每次心跳做一件真正有价值的事

问自己：现在最大的风险是什么？上次检查发现了什么问题？有没有已知问题还没有跟进？

可能的方向：
- 检查 `cookies/latest.json`（番茄）和 `知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json`（知乎）是否存在
- 检查番茄小说 Cookie（sessionid）和知乎 Cookie（z_c0）是否过期
- 如果任一 Cookie 剩余有效期不足 7 天，触发刷新流程并记录警告
- 运行 `check-fanqie-login.js`，验证番茄小说登录状态是否正常
- 运行 `verify-zhihu-cookies.js`，验证知乎登录状态是否正常
- 尝试访问番茄小说作家后台页面，确认脚本可以正常拿到数据
- 尝试访问知乎首页，确认脚本可以正常访问
- 检查 `logs/latest.md`，分析上次执行是否有异常或超时
- 检查 `reports/` 目录，对比最近两次报告，看是否出现新问题
- 检查 CDP 端口（9222）是否可达，评估方式 B 自动刷新是否可用
- 查看 `tasks/task-list.md`，推进待处理的优化任务
- 更新 `state/current-state.md`，记录当前真实状态
- 写一条执行日志到 `logs/`，记录本次心跳发现的内容
- 如果某个脚本最近频繁失败，调查根因并记录到 `docs/`
- 评估是否需要为 heartbeat 添加新的检查项
- 可能的方向不限于上，可自己添加，最好一句话简洁

## 流转规则

每次心跳执行后，必须更新以下文件之一（否则等于没做）：

| 动作类型 | 更新目标文件 |
|---------|------------|
| 检查 Cookie / 登录态 | `logs/latest.md` + `state/current-state.md` |
| 发现 Cookie 即将过期或已过期 | `state/current-state.md`（标记告警）+ `tasks/task-list.md`（添加紧急任务） |
| 刷新 Cookie 成功 | `logs/latest.md` + `state/current-state.md`（更新有效期） |
| 脚本执行失败 | `logs/latest.md`（记录错误）+ `tasks/task-list.md`（添加修复任务） |
| 推进任务 | `tasks/task-list.md` |
| 调研或设计 | `docs/` 下对应文档 |

## 工作目录

`~/.openclaw/workspace/skills/playwright-browser/`

```
playwright-browser/
├── HEARTBEAT.md          本文件（心跳驱动）
├── README.md             系统定位与使用说明
├── SKILL.md              技术规范文档
├── state/                系统当前状态（每次心跳后更新）
│   └── current-state.md
├── tasks/                任务管理
│   ├── README.md
│   └── task-list.md
├── logs/                 执行日志（每次运行后生成）
│   └── latest.md         最新一次执行摘要
├── reports/              历史检查报告归档
├── docs/                 设计文档与技术参考
├── extract-session/
│   └── SKILL.md          子技能：从 Chrome 提取 Session
├── debugging.md          调试指南
└── mcp-config.json       MCP 配置
```

## 检查清单（标准流程）

每次心跳按以下顺序检查，有异常立即停止并记录：

### 1. 番茄小说 Cookie 有效性
- [ ] `cookies/latest.json` 文件存在
- [ ] `sessionid` 未过期
- [ ] 剩余有效期 > 7 天（否则触发告警）

执行命令：
```
exec cd ~/.openclaw/workspace && node -e "const {checkCookieExpiry}=require('./scripts/extract-cookies-from-browser');const r=checkCookieExpiry();console.log(JSON.stringify(r));"
```

### 2. 知乎 Cookie 有效性
- [ ] `知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json` 文件存在
- [ ] `z_c0` 未过期
- [ ] 剩余有效期 > 7 天（否则触发告警）

执行命令：
```
exec cd ~/.openclaw/workspace && node -e "const {checkCookieExpiry}=require('./scripts/extract-zhihu-cookies-from-browser');const r=checkCookieExpiry();console.log(JSON.stringify(r));"
```

### 3. 番茄小说登录状态验证
- [ ] 能正常访问番茄小说作家后台（不被跳转到登录页）

执行命令：
```
exec cd ~/.openclaw/workspace && node scripts/check-fanqie-login.js
```

### 4. 知乎登录状态验证
- [ ] 能正常访问知乎首页（不被跳转到登录页）

执行命令：
```
exec cd ~/.openclaw/workspace && node scripts/verify-zhihu-cookies.js
```

### 5. CDP 端口检查（可选）
- [ ] Chrome 是否以 `--remote-debugging-port=9222` 运行
- [ ] 如果可达，记录可用状态（支持方式 B 自动刷新）

执行命令：
```
exec curl -s --max-time 2 http://localhost:9222/json/version | head -c 200
```

### 6. 上次执行日志回顾
- [ ] 查看 `logs/latest.md`，是否有未处理的错误或警告

---

## 告警处理

### 番茄小说 Cookie 剩余不足 7 天
1. 在 `state/current-state.md` 标记 `⚠️ 番茄 Cookie 即将过期`
2. 在 `tasks/task-list.md` 添加 P0 紧急任务
3. 如果 CDP 端口可达，尝试自动刷新：
   ```
   exec cd ~/.openclaw/workspace && node scripts/extract-cookies-from-browser.js
   ```
4. 如果 CDP 不可达，记录"需要在 Claude/Cline 对话中手动提取"

### 知乎 Cookie 剩余不足 7 天
1. 在 `state/current-state.md` 标记 `⚠️ 知乎 Cookie 即将过期`
2. 在 `tasks/task-list.md` 添加 P0 紧急任务
3. 如果 CDP 端口可达，尝试自动刷新：
   ```
   exec cd ~/.openclaw/workspace && node scripts/extract-zhihu-cookies-from-browser.js
   ```
4. 如果 CDP 不可达，记录"需要在 Claude/Cline 对话中手动提取"

### 番茄小说 Cookie 已过期或 `latest.json` 不存在
1. 立即在 `state/current-state.md` 标记 `❌ 番茄 Cookie 失效`
2. 所有依赖登录态的番茄脚本将失败，需立即处理
3. 尝试 CDP 自动刷新；若不可达，记录告警，等待人工介入

### 知乎 Cookie 已过期或 `zhihu-cookies-latest.json` 不存在
1. 立即在 `state/current-state.md` 标记 `❌ 知乎 Cookie 失效`
2. 所有依赖登录态的知乎脚本将失败，需立即处理
3. 尝试 CDP 自动刷新；若不可达，记录告警，等待人工介入

### 登录状态检测失败（被跳转到登录页）
1. 确认 Cookie 有效期（可能未过期但已被服务端失效）
2. 记录到 `logs/latest.md`
3. 标记 `state/current-state.md` 告警状态

---

## 当前状态

详细状态请查看：`state/current-state.md`

## 最新执行记录

详细日志请查看：`logs/latest.md`

---

## 核心约束

- 不要误判登录失效：网络超时和真正的 session 失效处理方式不同，先重试一次再下结论
- 有日志才算做了：执行了检查但不记录日志，等于没有执行
- Cookie 安全：不要在日志里打印完整的 Cookie 值，只记录名称、过期时间和有效性状态
- 刷新前先检查：不要在 Cookie 仍然有效时无谓地刷新，避免产生不必要的归档文件
- 优先修复已知问题，再开发新功能

---

## 真的没有想法吗

那就运行一次登录状态检查，把输出结果写到 `logs/latest.md`，再写一句你观察到了什么。这就够了。不要假装做了。

---

**维护者**：心跳时刻 - 浏览器自动化守护者
**版本**：v1.0
