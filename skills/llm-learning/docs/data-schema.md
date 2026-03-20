# 数据结构定义

## progress.json

### 文件路径

```
/Users/oyjie/.openclaw/workspace/skills/llm-learning/progress.json
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `currentDay` | number | 当前学习天数（从 1 开始，最大 35） |
| `startDate` | string | 学习开始日期，格式 `YYYY-MM-DD` |
| `lastStudyDate` | string | 上次学习日期，格式 `YYYY-MM-DD` |
| `totalDays` | number | 课程总天数，固定为 `35` |
| `completedDays` | number | 已完成天数（= currentDay - 1） |
| `completedTopics` | string[] | 已完成的主题名称列表，按学习顺序排列 |
| `streak` | number | 连续学习天数，中断一天归零 |
| `skippedDays` | number | 手动跳转导致的跳过天数（用于统计） |

### 示例

```json
{
  "currentDay": 17,
  "startDate": "2026-03-04",
  "lastStudyDate": "2026-03-16",
  "totalDays": 35,
  "completedDays": 16,
  "completedTopics": [
    "LLM 总体架构",
    "LLM 输入与输出",
    "生成与解码过程",
    "LLM 训练流程",
    "多模态模型基础",
    "SFT 基础",
    "LoRA 技术",
    "其他微调方法",
    "RLHF 基础",
    "PPO 算法",
    "DPO 基础",
    "DPO 深入与实践",
    "CoT 思维链",
    "解码策略深入",
    "RAG",
    "Function Calling"
  ],
  "streak": 16,
  "skippedDays": 0
}
```

### 更新规则

每次完成"继续学习"后，必须更新以下字段：

```
currentDay      +1
completedDays   +1
lastStudyDate   = 今天日期
streak          = 若今天 - lastStudyDate == 1天 则 +1，否则归 1
completedTopics 追加当天主题名称
```

---

## daily-logs/YYYY-MM-DD.md

### 文件路径

```
/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/YYYY-MM-DD.md
```

### 文件模板

```markdown
# 第N天：[主题名称]

## 基本信息

- **日期：** YYYY-MM-DD
- **阶段：** 阶段X — [阶段名称]
- **连续学习：** N 天

---

## 核心知识点

### 1. [知识点标题]

[简洁的概念解释，2-4 句话]

**要点：**
- ...
- ...
- ...

**代码示例（如适用）：**

\`\`\`python
# 示例代码
\`\`\`

---

### 2. [知识点标题]

[简洁的概念解释]

**要点：**
- ...
- ...

---

### 3. [知识点标题]

...

---

## 关键图示

> 图片路径仅供本地查看，不读取内容：

- `images_chinese/source_svg/[图片文件名].svg`

---

## 实践建议

1. [具体可操作的建议]
2. [具体可操作的建议]
3. [具体可操作的建议]

---

## 今日总结

[2-3 句话总结今天学到的最重要的内容]

---

## 明日预告

**第N+1天：[明天主题名称]**

> [一句话描述明天的学习内容]
```

### 字段说明

| 区块 | 是否必填 | 说明 |
|------|---------|------|
| 基本信息 | ✅ 必填 | 日期、阶段、streak |
| 核心知识点 | ✅ 必填 | 3-5 个，每个包含解释和要点 |
| 代码示例 | ⚪ 选填 | 有对应代码的知识点附上示例 |
| 关键图示 | ⚪ 选填 | 只写路径，不读取内容 |
| 实践建议 | ✅ 必填 | 至少 2 条可操作建议 |
| 今日总结 | ✅ 必填 | 简短总结，不超过 3 句 |
| 明日预告 | ✅ 必填 | 提示下一天主题，增强连续性 |

### 命名规范

- 文件名以**推送日期**命名，而非第几天序号
- 格式：`YYYY-MM-DD.md`
- 示例：`2026-03-17.md`

> 如需按天数查找日志，通过 `progress.json` 中的 `startDate` + 天数偏移计算对应日期。