## [ERR-20260325-001] playwright-browser skill 脚本执行环境问题

**Logged**: 2026-03-25T18:48:00Z
**Priority**: high
**Status**: pending
**Area**: infra

### Summary
playwright-browser skill 的脚本执行环境存在问题，`check-fanqie-login.js` 脚本执行失败，错误信息："page is not defined"。

### Details
**问题分析**:
- playwright-browser skill 的脚本执行环境存在问题
- 脚本执行失败，无法检查登录状态
- 错误类型：`page is not defined`
- 错误位置：`page.evaluate`
- 错误原因：Playwright context 未正确初始化或传递

**执行命令**:
```bash
cd /Users/oyjie/.openclaw/workspace && node scripts/check-fanqie-login.js
```

**错误信息**:
```
🔍 检查番茄小说登录状态...

📍 访问短故事管理页面...
❌ 无法解析 mcporter 结果
原始结果: ### Error
Error: page.evaluate: ReferenceError: page is not defined
    at eval (eval at evaluate (:301:30), <anonymous>:3:12)
    at UtilityScript.evaluate (<anonymous>:303:16)
    at UtilityScript.<anonymous>:3:44)
    at <anonymous>:1:44)
```

**影响范围**:
- 无法检查登录状态
- 无法验证 Cookie 有效性
- 无法验证脚本可用性
- 35号故事发布准备就绪，但无法确认登录状态
- 无法自动化发布（如果登录状态未知）
- 无法自动化数据采集（如果登录状态未知）

**根本原因**:
- playwright-browser skill 的脚本可能存在问题
- Cookie 管理器可能存在问题
- MCP 连接可能存在问题
- Chrome 进程可能存在问题

**HEARTBEAT.md 提示**:
> "无法登录大概率是你打开了新的浏览器而不是使用 MCP 方式操控"

### Suggested Action
1. 排查 playwright-browser skill 的脚本执行环境
2. 修复 `check-fanqie-login.js` 脚本的 `page is not defined` 错误
3. 验证 Cookie 管理器是否正常工作
4. 验证 MCP 连接是否正常工作
5. 验证 Chrome 进程是否正常运行
6. 创建手动登录检查指南（针对 playwright-browser skill）
7. 创建手动发布备选方案（针对 35 号故事发布）

### Metadata
- Source: error
- Related Files:
  - scripts/check-fanqie-login.js
  - skills/playwright-browser/HEARTBEAT.md
  - skills/playwright-browser/SKILL.md
  - cookies/latest.json
- Tags: playwright, browser, login, cookie, mcp, chrome, automation
- See Also:
  - HEARTBEAT.md: "无法登录大概率是你打开了新的浏览器而不是使用 MCP 方式操控"
- Recurrence-Count: 1
- First-Seen: 2026-03-25 18:48
- Last-Seen: 2026-03-25 18:48

---
