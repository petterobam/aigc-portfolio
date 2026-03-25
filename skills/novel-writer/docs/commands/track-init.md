# `/novel:track-init` — 初始化追踪系统

**触发条件**：用户输入 `/novel:track-init`

**执行脚本**：`.specify/scripts/bash/init-tracking.sh`

---

## 前置条件

| 条件 | 必要性 |
|------|-------|
| 已完成 `/novel:specify`（存在 `stories/*/specification.md`） | 必须 |
| 已完成 `/novel:plan`（存在 `stories/*/outline.md`） | 必须 |

---

## 初始化流程

1. 从 `stories/*/specification.md` 第五章读取线索管理规格
2. 从 `stories/*/creative-plan.md` 读取伏笔-回收计划
3. 创建 `spec/tracking/` 目录，生成以下追踪文件

---

## 生成文件及初始格式

### `spec/tracking/plot-tracker.json`
```json
{
  "novel": "故事名",
  "lastUpdated": "YYYY-MM-DD",
  "currentState": { "chapter": 0, "volume": 1, "mainPlotStage": "开端" },
  "plotlines": {
    "main": { "name": "", "status": "active", "completedNodes": [], "upcomingNodes": [] },
    "subplots": []
  },
  "foreshadowing": [],
  "conflicts": { "active": [], "resolved": [], "upcoming": [] }
}
```

### `spec/tracking/timeline.json`
```json
{
  "novel": "故事名",
  "lastUpdated": "",
  "storyTime": { "start": "", "current": "", "format": "" },
  "calendar": [],
  "parallelEvents": {},
  "timeConstraints": [],
  "anomalies": { "issues": [] }
}
```

### `spec/tracking/relationships.json`
> ⚠️ 注意：文件名是 `relationships.json`，不是 `relations.json`

```json
{
  "novel": "故事名",
  "lastUpdated": "",
  "atChapter": 0,
  "relations": [],
  "groupDynamics": []
}
```

### `spec/tracking/character-state.json`
```json
{
  "novel": "故事名",
  "lastUpdated": "",
  "atChapter": 0,
  "characters": {}
}
```

### `spec/tracking/validation-rules.json`
```json
{
  "chapterLength": { "min": 2000, "max": 5000, "target": 3500 },
  "consistency": { "checkForeshadowing": true, "checkTimeline": true }
}
```

---

## 完成输出示例

```
✅ 追踪系统初始化完成

已创建：
  spec/tracking/plot-tracker.json    — X个情节节点，X条伏笔
  spec/tracking/timeline.json        — 故事开始于「[时间点]」
  spec/tracking/character-state.json — X个角色初始状态
  spec/tracking/relationships.json   — X条关系
  spec/tracking/validation-rules.json

建议下一步：/novel:write 开始写作
```
