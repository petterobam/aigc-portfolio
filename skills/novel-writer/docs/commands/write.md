# `/novel:write` — AI 辅助章节写作

**触发条件**：用户输入 `/novel:write` 或 `/novel:write 第X章`

---

## 上下文加载顺序（严格按优先级）

| 优先级 | 文件 | 说明 |
|--------|------|------|
| 1 | `.specify/memory/constitution.md` | **最高优先级**，创作宪法 |
| 2 | `.specify/memory/personal-voice.md` | 个人语料风格（如有） |
| 3 | `stories/*/specification.md` | 故事规格 |
| 4 | `stories/*/creative-plan.md` | 创作计划 |
| 5 | `stories/*/tasks.md` | 找 `pending` 状态的写作任务 |
| 6 | `spec/tracking/character-state.json` | 角色当前状态 |
| 7 | `spec/tracking/relationships.json` | 角色关系 |
| 8 | `spec/tracking/plot-tracker.json` | 情节追踪 |
| 9 | `spec/tracking/validation-rules.json` | 字数要求 |
| 10 | `spec/knowledge/` | 世界观/角色档案 |
| 11 | `stories/*/content/` | 前序章节（了解前情） |
| 12 | `spec/presets/golden-opening.md` | **仅前3章或总字数<10000字时加载** |

---

## 写作前确认提示

```
📝 准备写：第X章《[章节标题]》
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 本章目标：[主要事件]
👤 出场人物：[角色 | 当前位置 | 状态]
📍 场景：[地点]
⏱️ 故事时间：[时间点]
🌱 本章埋设伏笔：[伏笔描述]（如有）
🎯 本章回收伏笔：[伏笔描述]（如有）
📏 目标字数：约XXX字（来自 validation-rules.json）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
确认开始写作？（直接回复「开始」或说明修改意见）
```

---

## 写作规范

### 段落结构
- ✅ 30%-50% 的段落为单句成段
- ✅ 每段控制在 50-100 字
- ✅ 重点信息独立成段
- ✅ 场景转换使用空白行分隔
- ⛔ 禁止用"一"、"二"、"三"等数字标记分段（破坏阅读沉浸感）

### 去 AI 腔规范（基于腾讯朱雀标准）
- ❌ 禁止堆砌感官描写（不强行凑"3种感官"）
- ❌ 禁止华丽套话：`摇摇欲坠`、`空气凝固`、`弥漫着`
- ❌ 禁止 AI 高频词：`唯一的`、`直到`、`不禁`、`顿时`、`心中暗想`
- ✅ 用行为暗示替代直白心理描写
- ✅ 对话加入停顿、语病，更口语化
- ✅ 具象化替代抽象：`最近` → `上周三`，`很多人` → `至少5个朋友`

---

## 写作完成后

1. 保存章节到 `stories/*/content/第X章.md`
2. 使用脚本统计字数（避免 `wc -w` 对中文不准确）：
   ```bash
   source .specify/scripts/bash/common.sh
   count_chinese_words "stories/*/content/第X章.md"
   ```
3. 更新 `stories/*/tasks.md` 对应任务状态为 `completed`
4. 更新追踪文件：
   - `spec/tracking/plot-tracker.json` — 完成节点、新冲突
   - `spec/tracking/timeline.json` — 新事件时间点
   - `spec/tracking/character-state.json` — 角色变化
   - `spec/tracking/relationships.json` — 关系变化（如有）
5. 输出完成报告：
   ```
   ✅ 第X章写作完成
   - 已保存：stories/*/content/第X章.md
   - 实际字数：XXXX字（✅ 符合 / ⚠️ 超出/不足）
   - 追踪文件已更新
   建议：/novel:write 第X+1章 或 /novel:track 查看进度
   ```
