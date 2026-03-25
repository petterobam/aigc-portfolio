# 📚 Novel Writer Skill

AI 驱动的中文小说创作助手，基于 `novel` CLI 工具（`novel-writer-cn v0.20.0`）和规格驱动开发（SDD）七步方法论。支持 **Claude** 和 **GitHub Copilot** 两种 AI 助手。

---

## 支持的 AI 助手

| AI 助手 | 命令格式 | 配置文件 |
|---------|---------|---------|
| **Claude** (Claude Code / Claude CLI) | `/novel:constitution`、`/novel:write` 等斜线命令 | `.claude/commands/novel.*.md`（`novel init` 自动生成） |
| **GitHub Copilot** (VSCode) | 通过 `.github/prompts/*.prompt.md` 注入上下文 | 可以直接 引用 prompt 文件（`novel init` 自动生成） |

> ⚠️ 所有 `/novel:*` 命令仅在 AI 助手内部使用，**不是终端命令**。

---

## 快速开始

```bash
# 1. 用 novel CLI 初始化项目（终端执行）
novel init my-story
cd my-story

# 2. 在 AI 助手中按序执行七步方法论（Claude 格式）
/novel:constitution   # 建立创作宪法
/novel:specify        # 定义故事规格
/novel:clarify        # 澄清关键决策
/novel:plan           # 制定创作计划
/novel:tasks          # 分解写作任务
/novel:track-init     # 初始化追踪系统
/novel:write          # 开始写作
```

**七步方法论完整流程**：

```
/novel:constitution → /novel:specify → /novel:clarify → /novel:plan
    → /novel:tasks → /novel:write → /novel:analyze
```

---

## 命令速览

### 七步方法论命令

| 命令 | 说明 | 产出文件 |
|------|------|---------|
| `/novel:constitution` | 建立创作宪法（核心原则与价值观） | `.specify/memory/constitution.md` |
| `/novel:specify` | 定义故事规格书（要写什么） | `stories/<名>/specification.md` |
| `/novel:clarify` | 澄清规格中的模糊决策点 | `stories/<名>/clarifications.md` |
| `/novel:plan` | 制定技术方案与章节大纲 | `stories/<名>/creative-plan.md`、`outline.md` |
| `/novel:tasks` | 分解为可执行任务清单 | `stories/<名>/tasks.md` |
| `/novel:write [第X章]` | AI 辅助章节写作 | `stories/<名>/content/第X章.md` |
| `/novel:analyze` | 综合验证质量评估 | — |

### 追踪管理命令

| 命令 | 说明 | 脚本 |
|------|------|------|
| `/novel:track-init` | 初始化追踪系统 | `init-tracking.sh` |
| `/novel:track [--brief\|--check\|--fix]` | 综合追踪报告 | `track-progress.sh` |
| `/novel:plot-check` | 情节一致性检查 | `check-plot.sh` |
| `/novel:timeline` | 时间线管理与矛盾检查 | `check-timeline.sh` |
| `/novel:relations` | 角色关系网络追踪 | `manage-relations.sh` |
| `/novel:world-check` | 世界观一致性检查 | `check-world.sh` |
| `/novel:expert [角色\|情节\|风格\|世界观]` | 专家视角审稿 | — |

---

## 真实项目结构

运行 `novel init <项目名>` 后生成的完整目录：

```
my-story/
├── .claude/                        # Claude 斜线命令（自动生成）
│   └── commands/
│       ├── novel.constitution.md   # → /novel:constitution
│       ├── novel.specify.md        # → /novel:specify
│       ├── novel.clarify.md        # → /novel:clarify
│       ├── novel.plan.md           # → /novel:plan
│       ├── novel.tasks.md          # → /novel:tasks
│       ├── novel.write.md          # → /novel:write
│       ├── novel.analyze.md        # → /novel:analyze
│       ├── novel.track-init.md     # → /novel:track-init
│       ├── novel.track.md          # → /novel:track
│       ├── novel.timeline.md       # → /novel:timeline
│       ├── novel.relations.md      # → /novel:relations
│       ├── novel.expert.md         # → /novel:expert
│       └── novel.checklist.md      # → /novel:checklist
│
├── .specify/                       # AI 工具配置（Spec Kit 核心）
│   ├── config.json                 # 项目元数据（name/ai/method/version）
│   ├── experts/core/               # 专家知识库
│   │   ├── character.md
│   │   ├── plot.md
│   │   ├── style.md
│   │   └── world.md
│   ├── memory/
│   │   ├── constitution.md         # 创作宪法（/novel:constitution 产出）
│   │   └── personal-voice.md       # 个人语料指纹
│   └── scripts/bash/               # 辅助脚本（追踪/检查/统计）
│
├── spec/                           # 规格与知识库
│   ├── config.json                 # 方法配置（方法列表/追踪开关/字数偏好）
│   ├── knowledge/                  # 世界观知识库
│   │   ├── world-setting.md
│   │   ├── character-profiles.md
│   │   ├── character-voices.md
│   │   └── locations.md
│   ├── presets/                    # 写作方法模板
│   │   ├── three-act/              # story.md + outline.md + config.yaml
│   │   ├── hero-journey/
│   │   ├── story-circle/
│   │   ├── seven-point/
│   │   ├── pixar-formula/
│   │   └── snowflake/
│   └── tracking/                   # ← 追踪数据在这里，不是 .novel/
│       ├── plot-tracker.json       # 情节线、伏笔、冲突
│       ├── timeline.json           # 故事时间线
│       ├── relationships.json      # 角色关系（注意：不是 relations.json）
│       ├── character-state.json    # 角色状态快照
│       └── validation-rules.json   # 章节字数等验证规则
│
└── stories/                        # 故事内容（/novel:specify 后生成子目录）
    └── <故事名>/
        ├── specification.md        # 故事规格书
        ├── creative-plan.md        # 技术方案
        ├── outline.md              # 章节大纲
        ├── tasks.md                # 任务清单
        └── content/                # 正文章节
            ├── 第1章.md
            └── ...
```

### ⚠️ 常见路径错误对照

| ✅ 正确路径 | ❌ 常见错误 |
|-----------|-----------|
| `spec/tracking/relationships.json` | `spec/tracking/relations.json` |
| `spec/tracking/` | `.novel/` |
| `stories/*/content/第X章.md` | `chapters/chXXX.md` |
| `.specify/memory/constitution.md` | `spec/writing-constitution.md` |

---

## 命令详解

### `/novel:constitution` — 创作宪法

对话收集创作原则后，生成宪法文件，保存到 `.specify/memory/constitution.md`。

宪法包含六个章节：
1. **核心价值观**（用"必须"/"禁止"等明确词汇，可验证）
2. **质量标准**（章节字数、逻辑一致性要求等）
3. **创作风格**（语言风格、节奏、情感基调）
4. **内容规范**（角色塑造/情节设计/世界观原则）
5. **读者契约**（对读者的承诺与底线保证）
6. **修订程序**（版本管理）

**宪法是所有后续命令的最高优先级参考**，每次 `/novel:write` 都会先加载它。

---

### `/novel:specify` — 故事规格书

支持**渐进式规格定义**，根据输入详细程度自动判断层级：

| 层级 | 触发 | 输出 |
|------|------|------|
| Level 1 | 输入 <50 字 | 一句话故事（Logline） |
| Level 2 | 输入 50-300 字 | 一段话概要（含主角/冲突/目标） |
| Level 3 | 输入 300-1000 字 | 一页纸大纲（约500字） |
| Level 4 | 已有规格，需升级 | 完整规格书（九章） |

使用示例：
```
/novel:specify 职场女主角重生回到五年前，带着对未来的记忆逆袭复仇
```

规格中用 `[需要澄清]` 标记待决策点，供 `/novel:clarify` 处理。

---

### `/novel:write` — AI 辅助写作

每次写作自动加载全部上下文（优先级排序）：

```
宪法 → 个人语料 → 故事规格 → 创作计划 → 任务清单
    → 角色状态 → 关系网络 → 情节追踪 → 世界观知识库 → 前序章节
```

**写作前确认示例**：
```
📝 准备写：第5章《财务室的发现》
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 本章目标：李明发现账目异常，决心深入调查
👤 出场人物：李明（主角）| 公司财务室 | 紧张·进取
📍 场景：公司财务室 → 工位
⏱️ 故事时间：第10天（周三）下午
🌱 本章埋设：陈刚察觉有人查账（为第8章铺垫）
🎯 本章回收：第1章「她已经知道一切」的暗示
📏 目标字数：约3500字
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
确认开始写作？
```

**内置去 AI 腔规范**（基于腾讯朱雀标准）：
- ✅ 30-50% 的段落单句成段，每段 50-100 字
- ⛔ 禁止数字标记分段（"一、二、三"）
- ❌ 禁止 AI 高频词：`唯一的`、`弥漫着`、`不禁`、`顿时`、`心中暗想`
- ✅ 具象化替代抽象：`最近` → `上周三`，`很多人` → `至少5个朋友`

写作完成后自动更新 `spec/tracking/` 下的所有追踪文件。

---

### `/novel:track` — 综合追踪报告

```bash
/novel:track            # 完整报告
/novel:track --brief    # 简版（进度 + 预警）
/novel:track --check    # 深度一致性检查
/novel:track --fix      # 自动修复简单问题
```

报告示例：
```
📊 小说创作综合报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 《我的故事》

✍️ 写作进度
  完成：5/30章（16.7%）
  字数：15,000/100,000字

🗺️ 故事当前状态
  故事时间：第10天（周三）
  情节阶段：三幕结构 / 第二幕前半 - 探索阶段

🌱 伏笔状态：活跃 3个 | 已收 0个 | ⚠️ 超期 0个

⚡ 活跃冲突：主角 vs 上司（烈度 6/10）

💡 建议：推进感情线（自第3章未更新）
```

---

### `/novel:plot-check` — 情节检查

```bash
/novel:plot-check             # 全部检查
/novel:plot-check 第1-5章     # 指定范围
/novel:plot-check 伏笔         # 只检查伏笔闭合
/novel:plot-check 角色         # 只检查角色行为一致性
```

---

### `/novel:expert` — 专家视角

激活专家模式，以特定领域专家视角审稿：

```bash
/novel:expert 角色    # 角色塑造深度、弧度设计
/novel:expert 情节    # 节奏控制、悬念设置
/novel:expert 风格    # 语言打磨、去 AI 腔
/novel:expert 世界观  # 设定自洽、细节真实性
```

---

## GitHub Copilot 使用方法

1. 将 `.specify/templates/vscode-settings.json` 内容合并到 `.vscode/settings.json`
2. 在 VSCode Copilot Chat 中描述创作需求，Copilot 自动加载对应 prompt 文件
3. 对应关系：

| 目标 | Claude 命令 | Copilot prompt |
|------|------------|----------------|
| 创作宪法 | `/novel:constitution` | `constitution.prompt.md` |
| 故事规格 | `/novel:specify` | `specify.prompt.md` |
| 章节写作 | `/novel:write` | `write.prompt.md` |
| 综合验证 | `/novel:analyze` | `analyze.prompt.md` |

---

## 六种写作方法

| 方法 | 英文 ID | 适合 | 规划量 |
|------|---------|------|-------|
| 三幕结构 | `three-act` | 通用/情感/都市 | 中 |
| 英雄之旅 | `hero-journey` | 奇幻/成长/冒险 | 中高 |
| 故事圈 | `story-circle` | 角色驱动/关系向 | 中 |
| 七点结构 | `seven-point` | 悬疑/快节奏/爽文 | 低中 |
| 皮克斯公式 | `pixar-formula` | 短篇/入门 | 低 |
| 雪花十步 | `snowflake` | 史诗长篇/复杂世界观 | 极高 |

方法在 `novel init` 时通过 `.specify/config.json` 的 `method` 字段指定，`spec/presets/<method>/` 下有对应的 `story.md`、`outline.md`、`config.yaml` 模板。

> 详细方法说明见 [`docs/methods.md`](docs/methods.md)

---

## Skill 文件结构

```
skills/novel-writer/
├── SKILL.md                     # AI 行为指令（核心，读这个就够了）
├── README.md                    # 本文档
├── docs/
│   ├── methods.md               # 六种写作方法详细说明
│   ├── tracking-schema.md       # 追踪数据完整 Schema
│   └── commands.md              # 命令完整速查手册
└── templates/
    ├── story-spec.md            # 故事规格书模板（Level 4）
    ├── writing-constitution.md  # 创作宪法模板
    ├── character-profile.md     # 角色档案模板
    └── tracking/
        └── config.json          # .specify/config.json 参考模板
```

---

## 与 `novel` CLI 分工

| 操作 | 工具 |
|------|------|
| `novel init` / `novel check` / `novel info` / `novel upgrade` | `novel` CLI（终端） |
| 七步方法论创作流程 | 本 Skill（AI 对话） |
| 追踪维护与一致性验证 | 本 Skill（AI 对话 + bash 脚本） |

---

## 常见问题

**Q：追踪文件在哪里？**
A：`spec/tracking/`，不是 `.novel/`。注意关系文件是 `relationships.json`，不是 `relations.json`。

**Q：创作宪法保存在哪里？**
A：`.specify/memory/constitution.md`，不是 `spec/writing-constitution.md`。

**Q：章节正文保存在哪里？**
A：`stories/<故事名>/content/第X章.md`，不是 `chapters/chXXX.md`。

**Q：两个 config.json 有什么区别？**
A：`.specify/config.json` 是项目元数据（名称/AI类型/方法）；`spec/config.json` 是详细方法配置（可用方法/追踪开关/字数偏好）。

**Q：必须按顺序执行七步吗？**
A：短篇可简化为 `/novel:specify → /novel:write → /novel:analyze`。完整流程适合10万字以上长篇。

**Q：Copilot 和 Claude 可以混用吗？**
A：可以。两者共享同一套项目文件（追踪数据、规格书、宪法），在不同编辑器中分别使用不影响数据一致性。

---

## 版本历史

| 版本 | 说明 |
|------|------|
| 1.1.0 | 修正项目目录结构（`spec/tracking/`、`.specify/`、`stories/`），补充 Copilot 支持 |
| 1.0.0 | 初始版本 |

---

*基于 novel-writer-cn v0.20.0 | Spec Kit 架构 | 支持 Claude + GitHub Copilot*
