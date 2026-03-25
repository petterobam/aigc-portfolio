# `/novel:tasks` — 任务分解清单

**存储路径**：`stories/<故事名>/tasks.md`

**触发条件**：用户输入 `/novel:tasks`

**前置读取**：`stories/*/creative-plan.md`（创作计划）

---

## 任务清单格式

```markdown
## 创作任务清单（更新于：YYYY-MM-DD）

### 🔴 高优先级（本阶段必须完成）
- [ ] [状态:pending] 完善主角角色档案 → spec/knowledge/character-profiles.md
- [ ] [状态:pending] 写第1章初稿（约3000字）
- [ ] [状态:pending] [依赖:第1章] 写第2章初稿

### 🟡 中优先级
- [ ] [状态:pending] [并行] 补充世界观设定 → spec/knowledge/world-setting.md
- [ ] [状态:pending] 确认感情线节奏

### 🟢 低优先级
- [ ] [状态:pending] 修订第1章语言风格
```

---

## 任务标记说明

| 标记 | 含义 |
|------|------|
| `[依赖:X]` | 必须在 X 任务完成后才能开始 |
| `[并行]` | 可与其他任务同时进行 |
| `[高优]` | 本阶段优先处理 |

## 任务状态流转

`pending` → `in_progress` → `completed`

每次 `/novel:write` 完成后自动更新对应章节任务状态为 `completed`。

**下一步**：提示用户执行 `/novel:track-init`
