# playwright-browser 心跳定时任务添加指南

**创建时间**: 2026-03-25 15:48
**维护者**: 心跳时刻 - 番茄小说创作和运营
**版本**: v1.0.0

---

## 🎯 任务概述

**任务名称**: playwright-browser-heartbeat
**任务类型**: agentTurn
**执行频率**: 每小时 (0 * * * *)
**时区**: Asia/Shanghai
**执行模型**: glm-5
**会话类型**: isolated

**核心目标**:
- 读取 `HEARTBEAT.md` 文件
- 执行心跳检查（Cookie 有效性、登录状态验证、脚本健康检查）
- 记录发现和问题
- 更新状态文件
- 提供优化建议

---

## 📋 配置参数

### 基本配置

```json
{
  "name": "playwright-browser-heartbeat",
  "schedule": {
    "kind": "cron",
    "expr": "0 * * * *"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "执行 playwright-browser 心跳检查"
  },
  "sessionTarget": "isolated",
  "model": "glm-5"
}
```

### 配置说明

| 字段 | 值 | 说明 |
|------|------|------|
| name | playwright-browser-heartbeat | 任务名称 |
| schedule.kind | cron | 定时任务类型 |
| schedule.expr | 0 * * * * | 每小时执行一次 (整点) |
| payload.kind | agentTurn | 代理轮转任务 |
| payload.message | 执行 playwright-browser 心跳检查 | 任务描述 |
| sessionTarget | isolated | 唯离会话，不影响主会话 |
| model | glm-5 | 使用 glm-5 模型 |

---

## 🚀 添加步骤

### 步骤1: 打开 OpenClaw 控制台

1. 在浏览器中访问 OpenClaw 控制台
2. 进入 "定时任务" (或 "Cron Tasks") 页面

### 步骤2: 创建新任务

1. 点击 "添加新任务" (或 "Add New Task")
2. 输入任务名称：`playwright-browser-heartbeat`
3. 选择任务类型：`agentTurn`
4. 配置定时任务：
   - 选择 `cron` 类型
   - 输入表达式：`0 * * * *`
   - 选择时区：`Asia/Shanghai`
5. 配置 Payload：
   - 选择 `agentTurn` 类型
   - 输入消息：`执行 playwright-browser 心跳检查`
6. 配置会话类型：`isolated`
7. 选择模型：`glm-5`
8. 点击 "保存" (或 "Save")

### 步骤3: 验证任务创建

1. 在任务列表中找到 `playwright-browser-heartbeat`
2. 检查任务配置是否正确
3. 点击 "立即执行" (或 "Run Now") 进行测试
4. 检查执行日志是否正常

---

## 📊 执行计划

### 心跳检查流程（基于 HEARTBEAT.md）

1. **读取 HEARTBEAT.md**
   - 文件路径：`~/.openclaw/workspace/skills/playwright-browser/HEARTBEAT.md`
   - 解析心跳任务清单
   - 识别当前优先级

2. **检查 Cookie 有效性**
   - 检查文件：`cookies/latest.json`
   - 检查 sessionid 是否过期
   - 检查剩余有效期是否大于 7 天

3. **验证登录状态**
   - 执行命令：`node scripts/check-fanqie-login.js`
   - 验证是否能正常访问番茄小说作家后台
   - 验证是否被跳转到登录页

4. **检查 CDP 端口**
   - 执行命令：`curl -s --max-time 2 http://localhost:9222/json/version | head -c 200`
   - 验证 Chrome 远程调试端口是否可达

5. **检查上次执行日志**
   - 检查文件：`logs/latest.md`
   - 分析上次执行是否有异常或超时

6. **检查任务列表**
   - 检查文件：`tasks/task-list.md`
   - 推进待处理的优化任务

7. **更新状态文件**
   - 更新文件：`state/current-state.md`
   - 记录当前真实状态

8. **生成执行日志**
   - 写入文件：`logs/latest.md`
   - 记录本次心跳发现的内容

9. **评估是否需要添加新的检查项**
   - 识别新的风险
   - 识别新的问题
   - 添加到 HEARTBEAT.md

---

## 📝 执行结果记录

### 日志格式

```markdown
# playwright-browser 心跳执行记录

**执行时间**: 2026-03-25 15:48
**任务名称**: playwright-browser-heartbeat
**执行时长**: 约 5 分钟
**执行状态**: ✅ 成功 / ❌ 失败

---

## 检查结果

### 1. Cookie 有效性
| 检查项 | 状态 | 详情 |
|--------|------|------|
| cookies/latest.json 存在 | ✅ / ❌ | - |
| sessionid 未过期 | ✅ / ❌ | 剩余有效期：X 天 |
| 剩余有效期 > 7 天 | ✅ / ❌ | - |

### 2. 登录状态验证
| 检查项 | 状态 | 详情 |
|--------|------|------|
| 能正常访问番茄小说作家后台 | ✅ / ❌ | - |
| 未被跳转到登录页 | ✅ / ❌ | - |

### 3. CDP 端口
| 检查项 | 状态 | 详情 |
|--------|------|------|
| Chrome 远程调试端口可达 | ✅ / ❌ | - |

### 4. 上次执行日志
| 检查项 | 状态 | 详情 |
|--------|------|------|
| 无异常或超时 | ✅ / ❌ | - |
| 无重复错误模式 | ✅ / ❌ | - |

### 5. 任务列表
| 检查项 | 状态 | 详情 |
|--------|------|------|
| 有待处理的优化任务 | ✅ / ❌ | 数量：X |

---

## 发现和问题

### 发现
- 发现 1：描述
- 发现 2：描述

### 问题
- 问题 1：描述
- 问题 2：描述

---

## 优化建议

### 立即行动
- 建议 1：描述
- 建议 2：描述

### 长期优化
- 建议 1：描述
- 建议 2：描述

---

## 🔧 故障处理

### Cookie 剩余不足 7 天
1. 在 `state/current-state.md` 标记 `⚠️ Cookie 即将过期`
2. 在 `tasks/task-list.md` 添加 P0 紧急任务
3. 如果 CDP 端口可达，尝试自动刷新：
   ```bash
   exec cd ~/.openclaw/workspace && node scripts/extract-cookies-from-browser.js
   ```
4. 如果 CDP 不可达，记录"需要在 Claude/Code 对话中手动提取"

### Cookie 已过期或 `latest.json` 不存在
1. 立即在 `state/current-state.md` 标记 `❌ Cookie 失效`
2. 在 `tasks/task-list.md` 添加 P0 紧急任务
3. 尝试 CDP 自动刷新；若不可达，记录告警，等待人工介入

### 登录状态检测失败（被跳转到登录页）
1. 确认 Cookie 有效期（可能未过期但已被服务端失效）
2. 记录到 `logs/latest.md`
3. 标记 `state/current-state.md` 告警状态

### 上次脚本执行频繁失败
1. 调查根因并记录到 `docs/`
2. 在 `tasks/task-list.md` 添加修复任务

---

## 📊 下一步行动

### 立即行动（本次心跳后）
- [x] 创建 playwright-browser-heartbeat cron 任务配置
- [x] 创建任务添加指南
- [x] 创建心跳执行记录
- [x] 更新记忆文件
- [ ] 在 OpenClaw 控制台添加任务
- [ ] 验证任务配置正确
- [ ] 立即执行一次任务进行测试

### 短期行动（今天内）
- [ ] 验证任务是否正常执行（下次执行时间：16:48）
- [ ] 检查 logs/latest.md 是否生成
- [ ] 根据检查结果优化任务配置
- [ ] 调整心跳频率（如果需要）

### 中期行动（本周内）
- [ ] 根据多次心跳结果优化检查流程
- [ ] 优化故障处理流程
- [ ] 优化执行日志格式
- [ ] 优化优化建议生成

---

## 📚 相关文档

**playwright-browser skill**:
- HEARTBEAT.md: `skills/playwright-browser/HEARTBEAT.md`
- SKILL.md: `skills/playwright-browser/SKILL.md`
- README.md: `skills/playwright-browser/README.md`

**心跳执行记录**:
- logs/latest.md: `skills/playwright-browser/logs/latest.md` (每次心跳后生成)

**状态文件**:
- state/current-state.md: `skills/playwright-browser/state/current-state.md`

**任务列表**:
- tasks/task-list.md: `skills/playwright-browser/tasks/task-list.md`

---

**创建时间**: 2026-03-25 15:48
**创建者**: 心跳时刻 - 番茄小说创作和运营
**版本**: v1.0.0
**状态**: ✅ 已完成
