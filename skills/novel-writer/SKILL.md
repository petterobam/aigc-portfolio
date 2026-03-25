---
name: novel-writer
description: |
  AI 驱动的中文小说创作助手，基于 novel CLI 工具（novel-writer-cn v0.20.0）和规格驱动开发（SDD）七步方法论。支持 Claude 和 GitHub Copilot 两种 AI 助手。完整创作流程：创作宪法、故事规格、澄清决策、创作计划、任务分解、章节写作、综合验证，配合追踪系统保证情节一致性。触发词（Claude 格式）：/novel:constitution、/novel:specify、/novel:clarify、/novel:plan、/novel:tasks、/novel:write、/novel:analyze、/novel:track-init、/novel:track、/novel:plot-check、/novel:timeline、/novel:relations、/novel:world-check、/novel:expert。也响应用户询问小说创作流程、novel init、小说项目初始化等相关请求。
---

# Novel Writer — AI 中文小说创作助手

基于 `novel` CLI（`/opt/homebrew/bin/novel`，包名 `novel-writer-cn v0.20.0`）和 SDD 七步方法论，提供从灵感到完稿的全流程 AI 辅助创作。

## 支持的 AI 助手

| AI 助手 | 命令格式 | 配置文件位置 |
|---------|---------|------------|
| **Claude** (Claude Code / Claude CLI) | `/novel:constitution`、`/novel:write` 等 | `.claude/commands/novel.*.md` |
| **GitHub Copilot** (VSCode) | 通过 `.github/prompts/` 注入上下文 | `.github/prompts/*.prompt.md` |

> ⚠️ 所有 `/novel:*` 斜线命令仅在 AI 助手内部使用，**不是终端命令**。

---

## 真实项目结构

运行 `novel init <项目名>` 后生成的目录结构：

```
<项目名>/
├── .claude/commands/           # Claude 斜线命令（自动生成，勿手动修改）
│   ├── novel.constitution.md   # /novel:constitution
│   ├── novel.specify.md        # /novel:specify
│   ├── novel.clarify.md        # /novel:clarify
│   ├── novel.plan.md           # /novel:plan
│   ├── novel.tasks.md          # /novel:tasks
│   ├── novel.write.md          # /novel:write
│   ├── novel.analyze.md        # /novel:analyze
│   ├── novel.track-init.md     # /novel:track-init
│   ├── novel.track.md          # /novel:track
│   ├── novel.plot-check.md     # /novel:plot-check
│   ├── novel.timeline.md       # /novel:timeline
│   ├── novel.relations.md      # /novel:relations
│   ├── novel.expert.md         # /novel:expert
│   └── novel.checklist.md      # /novel:checklist
│
├── .specify/                   # AI 工具配置（Spec Kit 核心）
│   ├── config.json             # 项目元数据（name/type/ai/method/version）
│   ├── experts/core/           # 专家知识库（character/plot/style/world.md）
│   ├── memory/
│   │   ├── constitution.md     # 创作宪法（/novel:constitution 产出）
│   │   └── personal-voice.md   # 个人语料指纹
│   └── scripts/bash/           # 辅助脚本
│
├── spec/
│   ├── config.json             # 方法配置（方法列表/追踪开关/字数偏好）
│   ├── knowledge/              # 世界观知识库
│   │   ├── world-setting.md
│   │   ├── character-profiles.md
│   │   ├── character-voices.md
│   │   └── locations.md
│   ├── presets/                # 写作方法模板（按选定方法）
│   │   └── <method>/           # story.md + outline.md + config.yaml
│   └── tracking/               # 追踪数据（/novel:track-init 产出）
│       ├── plot-tracker.json
│       ├── timeline.json
│       ├── relationships.json  # ⚠️ 注意：含 ships，不是 relations.json
│       ├── character-state.json
│       └── validation-rules.json
│
└── stories/<故事名>/           # 故事内容
    ├── specification.md        # 故事规格书
    ├── creative-plan.md        # 技术方案
    ├── outline.md              # 章节大纲
    ├── tasks.md                # 任务清单
    └── content/第X章.md        # 正文章节
```

### 关键路径速查

| 内容 | 路径 |
|------|------|
| 创作宪法 | `.specify/memory/constitution.md` |
| 个人语料 | `.specify/memory/personal-voice.md` |
| 项目配置 | `.specify/config.json` |
| 故事规格 | `stories/*/specification.md` |
| 创作计划 | `stories/*/creative-plan.md` |
| 章节大纲 | `stories/*/outline.md` |
| 任务清单 | `stories/*/tasks.md` |
| 章节正文 | `stories/*/content/第X章.md` |
| 情节追踪 | `spec/tracking/plot-tracker.json` |
| 时间线 | `spec/tracking/timeline.json` |
| 角色关系 | `spec/tracking/relationships.json` |
| 角色状态 | `spec/tracking/character-state.json` |
| 验证规则 | `spec/tracking/validation-rules.json` |

---

## 七步方法论核心流程

```
/novel:constitution  →  建立不可妥协的创作原则（创作宪法）
       ↓
/novel:specify       →  定义故事规格（要写什么）
       ↓
/novel:clarify       →  澄清关键决策（消除模糊点）
       ↓
/novel:plan          →  制定技术方案（怎么写）
       ↓
/novel:tasks         →  分解执行任务（可操作清单）
       ↓
/novel:write         →  执行章节写作（内容产出）
       ↓
/novel:analyze       →  综合验证分析（质量保证）
```

**推荐完整流程**：

```bash
# 1. 用 CLI 初始化项目（终端执行）
novel init my-story && cd my-story

# 2. 在 AI 助手中按序执行
/novel:constitution   # 建立创作原则
/novel:specify        # 定义故事规格
/novel:clarify        # 澄清模糊点
/novel:plan           # 制定创作计划
/novel:tasks          # 分解写作任务
/novel:track-init     # 初始化追踪系统
/novel:write          # 开始写作
# 每写 5 章后
/novel:analyze
/novel:track
```

---

## 子命令行为规范

### 七步方法论命令

---

#### `/novel:constitution` — 创作宪法

**存储**：`.specify/memory/constitution.md`

**关键行为**：
- 对话式收集，按维度（价值观/质量标准/风格/内容规范/读者契约）逐一询问
- 原则必须可验证，使用"必须"/"禁止"等明确词汇，禁止空泛口号
- 宪法是所有后续命令的**最高优先级参考**

> 📄 详细执行流程与文档格式：[docs/commands/constitution.md](docs/commands/constitution.md)

---

#### `/novel:specify` — 故事规格书

**存储**：`stories/<故事名>/specification.md`

**关键行为**：
- 根据输入长度自动判断规格层级（Level 1-4，从一句话到九章完整规格书）
- 用 `[需要澄清]` 标记模糊决策点，留给 `/novel:clarify` 处理
- 用 `[核心需求]` 和 `[可选特性]` 区分优先级

> 📄 详细层级说明与规格书章节结构：[docs/commands/specify.md](docs/commands/specify.md)

---

#### `/novel:clarify` — 关键决策澄清

**关键行为**：
- 读取规格书中所有 `[需要澄清]` 标记，按影响程度排序，**每次只问一件事**
- 答案直接更新回规格书，移除对应标记
- 决策历史保存到 `stories/*/clarifications.md`

> 📄 详细流程与问题质量标准：[docs/commands/clarify.md](docs/commands/clarify.md)

---

#### `/novel:plan` — 创作计划与技术方案

**存储**：`stories/*/creative-plan.md` + `stories/*/outline.md`

**关键行为**：
- 读取规格书、宪法、`spec/config.json`（写作方法）和 `spec/presets/<method>/` 模板
- 生成**伏笔-回收对应计划表**（每条伏笔的埋设章节和预计回收章节）
- 章节大纲每章包含：故事时间、场景、出场人物、核心事件、情节节点、伏笔安排

> 📄 详细执行流程与大纲格式：[docs/commands/plan.md](docs/commands/plan.md)

---

#### `/novel:tasks` — 任务分解清单

**存储**：`stories/<故事名>/tasks.md`

**关键行为**：
- 任务分三级优先级（🔴高/🟡中/🟢低），标注依赖关系和并行标记
- 任务状态：`pending` → `in_progress` → `completed`
- 每次 `/novel:write` 完成后自动更新对应任务状态

> 📄 详细任务结构与标记说明：[docs/commands/tasks.md](docs/commands/tasks.md)

---

#### `/novel:write` — AI 辅助章节写作

**关键行为**：
- 严格按优先级加载上下文（宪法最高优先级，共 12 层）
- 写作前输出确认提示（目标/人物/场景/时间/伏笔/字数），用户确认后开始
- 遵守段落规范（30-50% 单句成段）和去 AI 腔规范（禁止 `弥漫着`/`不禁`/`顿时` 等高频词）
- 完成后自动更新所有追踪文件（plot-tracker/timeline/character-state/relationships）

> 📄 完整上下文优先级表、写作规范、完成流程：[docs/commands/write.md](docs/commands/write.md)

---

#### `/novel:analyze` — 综合验证与质量评估

**执行脚本**：`.specify/scripts/bash/analyze-story.sh`

**关键行为**：
- 从六个维度评估（宪法合规/规格满足/方法结构/内容一致/字数合规/去AI腔程度）
- 支持参数：全面评估 / 指定章节 / 单项检查

> 📄 详细验证维度与参数说明：[docs/commands/analyze.md](docs/commands/analyze.md)

---

### 追踪管理命令

---

#### `/novel:track-init` — 初始化追踪系统

**执行脚本**：`.specify/scripts/bash/init-tracking.sh`

**关键行为**：
- 前置条件：必须已完成 `/novel:specify` 和 `/novel:plan`
- 从规格书和创作计划中提取数据，生成 `spec/tracking/` 下的五个追踪文件
- 输出初始化摘要（节点数/角色数/关系数）

> 📄 详细初始化流程与 JSON 格式：[docs/commands/track-init.md](docs/commands/track-init.md)

---

#### `/novel:track` — 综合追踪报告

**执行脚本**：`.specify/scripts/bash/track-progress.sh`

**关键行为**：
- 整合所有追踪数据，输出：进度、故事状态、角色速览、伏笔状态、活跃冲突、预警、建议
- 支持 `--brief`（简版）/ `--check`（深度检查）/ `--fix`（自动修复）

> 📄 详细参数与输出格式：[docs/commands/track.md](docs/commands/track.md)

---

#### `/novel:plot-check` — 情节一致性检查

**执行脚本**：`.specify/scripts/bash/check-plot.sh`

**关键行为**：
- 检查四个维度：情节逻辑链 / 伏笔闭合状态 / 角色行为一致性 / 能力自洽
- 输出分级报告：✅一致 / ⚠️需关注 / ❌明确矛盾 / 🌱未回收伏笔清单

> 📄 详细检查维度与输出格式：[docs/commands/plot-check.md](docs/commands/plot-check.md)

---

#### `/novel:timeline` — 时间线管理

**数据文件**：`spec/tracking/timeline.json`

**子命令**：`show`（可视化）/ `check`（检查矛盾）/ `add <事件>`（添加节点）/ `fix <矛盾ID>`（修复）

> 📄 详细子命令与检查项说明：[docs/commands/timeline.md](docs/commands/timeline.md)

---

#### `/novel:relations` — 角色关系追踪

**数据文件**：`spec/tracking/relationships.json`（⚠️ 含 `ships`，不是 `relations.json`）

**子命令**：`show [角色名]` / `check` / `update <描述>` / `history <角色名>`

> 📄 详细子命令与关系类型标记：[docs/commands/relations.md](docs/commands/relations.md)

---

#### `/novel:world-check` — 世界观一致性检查

**执行脚本**：`.specify/scripts/bash/check-world.sh`

**关键行为**：检查特殊规则一致性、地理描写前后一致、时代背景细节（禁止古代背景出现现代词汇）

> 📄 详细检查维度：[docs/commands/world-check.md](docs/commands/world-check.md)

---

#### `/novel:expert` — 专家视角审稿

**关键行为**：
- 激活后先读取 `.specify/experts/core/<专家>.md` 知识文件
- 可用专家：`角色`（character.md）/ `情节`（plot.md）/ `风格`（style.md）/ `世界观`（world.md）

> 📄 详细专家说明与使用方式：[docs/commands/expert.md](docs/commands/expert.md)

---

## 写作方法参考

六种方法在 `spec/presets/<method>/` 下各有 `story.md`、`outline.md`、`config.yaml` 模板：

| 方法 | 英文ID | 适合类型 | 规划量 |
|------|--------|---------|-------|
| 三幕结构 | `three-act` | 通用/情感/都市 | 中 |
| 英雄之旅 | `hero-journey` | 奇幻/成长/冒险 | 中高 |
| 故事圈 | `story-circle` | 角色驱动/关系向 | 中 |
| 七点结构 | `seven-point` | 悬疑/快节奏/爽文 | 低中 |
| 皮克斯公式 | `pixar-formula` | 短篇/入门 | 低 |
| 雪花十步 | `snowflake` | 史诗长篇/复杂世界观 | 极高 |

> 📄 各方法详细说明与结构模板：[docs/methods.md](docs/methods.md)

---

## 与 `novel` CLI 的协作分工

| 操作 | 工具 |
|------|------|
| `novel init` / `novel check` / `novel info` / `novel upgrade` | `novel` CLI（终端命令） |
| 七步方法论写作流程 | 本 Skill（AI 对话） |
| 追踪维护与一致性验证 | 本 Skill（AI 对话 + bash 脚本） |

---

## GitHub Copilot 使用说明

`novel init` 生成的 `.specify/templates/vscode-settings.json` 配置 Copilot 加载 `.github/prompts/` 目录下的 prompt 文件。

| 创作目标 | Claude 命令 | Copilot 方式 |
|---------|------------|-------------|
| 建立创作宪法 | `/novel:constitution` | 加载 `constitution.prompt.md` |
| 定义故事规格 | `/novel:specify` | 加载 `specify.prompt.md` |
| 章节写作 | `/novel:write 第X章` | 加载 `write.prompt.md` |
| 综合验证 | `/novel:analyze` | 加载 `analyze.prompt.md` |

---

## 错误处理

| 情况 | 处理方式 |
|------|---------|
| 找不到 `spec/tracking/` | 提示先运行 `/novel:track-init` |
| 找不到 `stories/*/specification.md` | 提示先运行 `/novel:specify` |
| 找不到 `.specify/memory/constitution.md` | 提示先运行 `/novel:constitution` |
| 章节编号不连续 | 询问是否跳过，记录原因到 `tasks.md` |
| 追踪数据与正文矛盾 | 标记到 `plot-tracker.json` 的 `inconsistencies` 字段，询问以哪个为准 |
| `wc -w` 统计中文字数不准 | 改用 `.specify/scripts/bash/common.sh` 的 `count_chinese_words` 函数 |
| Copilot prompt 文件不存在 | 提示运行 `novel init` 重新初始化，或检查 `.specify/templates/` |

---

## 路径注意事项

⚠️ 以下是容易混淆的文件名和路径：

| ✅ 正确 | ❌ 常见错误 |
|---------|-----------|
| `spec/tracking/relationships.json` | `spec/tracking/relations.json` |
| `spec/tracking/` | `.novel/` 或 `.specify/tracking/` |
| `stories/*/content/第X章.md` | `chapters/chXXX.md` |
| `.specify/memory/constitution.md` | `spec/writing-constitution.md` |
| `.specify/config.json` | `spec/config.json`（两个都存在，功能不同） |

**两个 config.json 的区别**：
- `.specify/config.json` — 项目元数据（名称/AI类型/方法/版本）
- `spec/config.json` — 详细方法配置（方法列表/追踪开关/字数偏好）

---

*基于 novel-writer-cn v0.20.0 | Spec Kit 架构 | 支持 Claude 、 GitHub Copilot*
