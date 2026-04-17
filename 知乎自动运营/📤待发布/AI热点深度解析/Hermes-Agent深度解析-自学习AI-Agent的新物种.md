# Hermes Agent 深度解析：第一个会"进化"的 AI Agent，GitHub 24 小时 6000+ Star

> Nous Research 开源了 Hermes Agent——一个自带学习闭环的 AI Agent。它不是又一个 ChatBot 包装器，而是真正能从经验中成长、自我优化技能、跨会话记忆的"活的"AI 助手。本文从架构、核心机制、与 OpenClaw 对比三个维度全面拆解。

---

## 一、为什么 Hermes Agent 值得关注？

先说数据：**GitHub 上线 24 小时，Star 数从 0 飙升到 59,000+，单日新增 6,438 Star**。这个速度在 AI Agent 赛道里堪称现象级。

但 Star 数只是表象。真正让它出圈的原因是三个"第一次"：

| 特性 | 传统 Agent | Hermes Agent |
|------|-----------|-------------|
| 技能获取 | 人工编写 Prompt | **从任务经验中自动生成技能** |
| 知识管理 | 单会话无记忆 | **跨会话记忆 + 自主知识持久化** |
| 用户理解 | 无状态 | **Honcho 辩证建模，构建用户认知模型** |

核心洞察：**大多数 AI Agent 是"用完即走"的工具，Hermes Agent 是一个会"长大"的伙伴。**

---

## 二、核心架构拆解

### 2.1 学习闭环（The Closed Learning Loop）

这是 Hermes Agent 的灵魂。四个阶段形成闭环：

```
┌─────────────────────────────────────────┐
│            Learning Loop                 │
│                                         │
│  ① 经验积累 ──→ ② 技能提取 ──→ ③ 使用优化  │
│       ↑                                 │
│       └──── ④ 知识持久化 ←──────────────┘  │
│                                         │
│  + Honcho 用户建模（跨会话理解你）          │
│  + FTS5 会话搜索（回忆过去对话）            │
└─────────────────────────────────────────┘
```

**① 经验积累**：每次你完成任务，Agent 记录完整的执行轨迹（任务描述 → 工具调用 → 中间结果 → 最终输出）。

**② 技能提取**：当任务复杂度超过阈值，Agent 自动将解决方案抽象为可复用的 Skill（符合 [agentskills.io](https://agentskills.io) 开放标准）。

**③ 使用优化**：下次调用同一 Skill 时，Agent 会根据历史效果微调执行策略（类似代码重构，但是自动的）。

**④ 知识持久化**：Agent 会主动"提醒自己"把重要发现写入记忆文件，确保跨会话不丢失。

```python
# 学习闭环的简化实现思路
class LearningLoop:
    def __init__(self):
        self.memory = AgentMemory()      # 持久化记忆
        self.skills = SkillStore()       # 技能库
        self.user_model = HonchoClient() # 用户认知模型
    
    def after_task(self, task, trajectory, result):
        """任务完成后触发学习"""
        # 1. 积累经验
        self.memory.store_trajectory(task, trajectory, result)
        
        # 2. 判断是否值得提取为技能
        complexity = self._assess_complexity(trajectory)
        if complexity > self.threshold:
            skill = self._extract_skill(task, trajectory, result)
            self.skills.save(skill)
        
        # 3. 主动持久化重要发现
        if self._is_insight(result):
            self.memory.persist(result, nudge=True)
        
        # 4. 更新用户模型
        self.user_model.update(task, result, self.memory.recent())
    
    def before_task(self, task):
        """任务开始前利用历史"""
        # 搜索相关历史会话
        relevant = self.memory.search(task, engine="fts5")
        # 匹配已有技能
        skills = self.skills.match(task)
        # 获取用户偏好
        preferences = self.user_model.get_preferences()
        return relevant, skills, preferences
```

### 2.2 多终端网关（Messaging Gateway）

一个网关进程，六大平台全覆盖：

| 平台 | 特殊能力 |
|------|---------|
| Telegram | 语音备忘录转文字 |
| Discord | 多频道支持 |
| Slack | 工作流集成 |
| WhatsApp | 移动端首选 |
| Signal | 端到端加密 |
| CLI | 完整 TUI，多行编辑 + 自动补全 |

**架构亮点**：不是每个平台写一个 Bot，而是单网关多适配器：

```
Telegram ──┐
Discord ──┤
Slack   ──┼──→ Gateway Process ──→ Agent Core ──→ Model API
WhatsApp ─┤
Signal  ──┤
CLI     ──┘
```

这意味着你在电脑上用 CLI 开始的对话，出门切到 Telegram 可以无缝继续。

### 2.3 执行环境矩阵

| 环境 | 适用场景 | 成本 |
|------|---------|------|
| 本地 | 开发调试 | $0 |
| Docker | 隔离部署 | $0 |
| SSH | 远程服务器 | 按需 |
| Daytona | Serverless 持久化 | ~$0（空闲时） |
| Singularity | HPC 环境 | 机构付费 |
| Modal | GPU 按需 | 按秒计费 |

**关键设计**：Daytona 和 Modal 支持"冬眠"——Agent 环境空闲时自动休眠，收到消息时唤醒，空闲成本接近零。

### 2.4 并行子 Agent 系统

```python
# 子 Agent 并行工作流
async def parallel_workflow(agent, tasks):
    """生成多个隔离子 Agent 并行执行"""
    results = await asyncio.gather(*[
        agent.spawn_subagent(
            task=t,
            isolated=True,     # 隔离上下文
            tools=["read", "write", "exec"]  # 限定工具集
        )
        for t in tasks
    ])
    return agent.synthesize(results)
```

每个子 Agent 有独立上下文窗口，不抢占主 Agent 的 Token 额度。完成后结果汇合到主 Agent 综合。

---

## 三、与 OpenClaw 深度对比

Hermes Agent 的 README 里有一条命令：`hermes claw migrate`——明确支持从 OpenClaw 迁移。这说明两者定位高度重合。我来做一个客观对比：

### 3.1 功能矩阵

| 维度 | OpenClaw | Hermes Agent |
|------|----------|-------------|
| **核心定位** | AI 助手平台 + Agent 运行时 | 自学习 AI Agent |
| **学习机制** | 记忆文件（MEMORY.md）+ Skill 系统 | **自动技能提取 + 辩证用户建模** |
| **记忆系统** | Markdown 文件 + SQLite | FTS5 会话搜索 + LLM 摘要 + Honcho |
| **多模型支持** | ✅ 多模型切换 | ✅ 200+ 模型（OpenRouter） |
| **定时任务** | ✅ Cron 系统 | ✅ 内置调度器 |
| **多平台** | Discord、飞书等 | Telegram、Discord、Slack、WhatsApp、Signal |
| **子 Agent** | ✅ 隔离子 Agent | ✅ 隔离子 Agent + RPC 脚本 |
| **Skill 标准** | AgentSkills 规格 | AgentSkills 规格（**兼容**） |
| **部署方式** | 本地 + Node.js | 本地 + Docker + SSH + Serverless |
| **开源协议** | - | MIT |
| **编程语言** | TypeScript/Node.js | Python |

### 3.2 各自的独特优势

**OpenClaw 的独特优势**：
- **飞书深度集成**：中国企业场景首选，支持多维表格、云文档、日历等
- **ACP 协议**：Agent Control Protocol，标准化 Agent 控制
- **Node.js 生态**：与前端/全栈开发者工具链天然亲和
- **中文体验更好**：本土化做得更完善

**Hermes Agent 的独特优势**：
- **自学习闭环**：这是最大的差异化，Agent 真正能"成长"
- **Honcho 用户建模**：辩证式理解用户，不是简单的偏好记录
- **Serverless 部署**：Daytona/Modal 支持，成本优化到极致
- **研究就绪**：批量轨迹生成 + Atropos RL 环境，面向模型训练

### 3.3 选择建议

```
你的需求是什么？
│
├── 中国企业场景 / 飞书用户 / 中文优先
│   └── → OpenClaw
│
├── 需要自学习能力 / 研究 Agent 行为 / 多平台部署
│   └── → Hermes Agent
│
├── 两者功能都需要？
│   └── → 技术栈互补：OpenClaw 做日常工作流，Hermes Agent 做研究/探索
│
└── 刚入门 AI Agent？
    └── → 两个都试试，Skill 格式兼容，迁移成本低
```

---

## 四、技术细节：自学习是怎么实现的？

### 4.1 技能自动提取算法

核心思想：**当一个任务的执行轨迹满足"复杂度阈值"且"结果成功"时，自动将其抽象为可复用的 Skill。**

```python
class SkillExtractor:
    """从任务轨迹中提取可复用技能"""
    
    def extract(self, task: str, trajectory: list[Step], result: str) -> Skill:
        # 1. 识别关键步骤（去除冗余）
        key_steps = self._identify_key_steps(trajectory)
        
        # 2. 抽象参数化（把具体值替换为参数）
        abstracted = self._abstract_parameters(key_steps, task)
        
        # 3. 生成 SKILL.md（符合 agentskills.io 标准）
        skill_doc = self._generate_skill_doc(abstracted, task, result)
        
        # 4. 生成验证用例
        test_cases = self._generate_test_cases(abstracted, task)
        
        return Skill(
            name=self._infer_skill_name(task),
            description=skill_doc,
            steps=abstracted,
            test_cases=test_cases,
            source_trajectory_id=trajectory.id
        )
    
    def _abstract_parameters(self, steps, task):
        """将具体值替换为参数模板"""
        # 例: "搜索 project-x 的 GitHub issues"
        # → "搜索 {{project_name}} 的 GitHub issues"
        pass
```

### 4.2 Honcho 辩证用户建模

不同于简单的"用户喜欢 X"这种偏好标签，Honcho 使用**辩证建模**（Dialectical Modeling）：

```python
class HonchoUserModel:
    """辩证式用户建模"""
    
    def update(self, interaction, context):
        # 1. 论点（Thesis）：用户说了什么
        thesis = self._extract_stated_preference(interaction)
        
        # 2. 反论点（Antithesis）：用户实际做了什么
        antithesis = self._extract_behavioral_signal(interaction, context)
        
        # 3. 综合（Synthesis）：调和矛盾，更新用户模型
        synthesis = self._reconcile(thesis, antithesis, self.model)
        
        self.model.update(synthesis)
    
    # 例：
    # 用户说"我喜欢简洁的回答"（论点）
    # 但实际行为：总是在追问细节（反论点）
    # 综合：用户偏好简洁的开头 + 详细的展开，矛盾但真实
```

### 4.3 FTS5 会话搜索 + LLM 摘要

跨会话回忆的实现：

```python
class SessionMemory:
    """跨会话记忆搜索"""
    
    def search(self, query: str, top_k: int = 5) -> list[Memory]:
        # 1. FTS5 全文搜索（快速召回）
        candidates = self.fts5_search(query, limit=top_k * 3)
        
        # 2. LLM 重排序（语义相关性）
        reranked = self.llm_rerank(query, candidates, top_k=top_k)
        
        # 3. 生成摘要（压缩上下文）
        for memory in reranked:
            if len(memory.content) > self.max_length:
                memory.summary = self.llm_summarize(memory.content)
        
        return reranked
```

---

## 五、快速上手实战

### 5.1 安装（2 分钟）

```bash
# 一行安装
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash

# 重新加载 shell
source ~/.bashrc

# 启动
hermes
```

### 5.2 配置模型

```bash
# 交互式选择模型
hermes model

# 或直接指定
hermes config set model.provider openrouter
hermes config set model.name anthropic/claude-sonnet-4
```

### 5.3 连接 Telegram

```bash
# 设置网关
hermes gateway setup   # 选择 Telegram，输入 Bot Token

# 启动网关
hermes gateway start

# 现在打开 Telegram 给你的 Bot 发消息即可
```

### 5.4 观察学习效果

```bash
# 完成 3-5 个复杂任务后，查看 Agent 学到了什么
/skills           # 查看自动生成的技能
/insights --days 7  # 查看过去 7 天的学习洞察
/usage            # 查看 Token 使用和记忆状态
```

---

## 六、深度思考：自学习 Agent 意味着什么？

### 6.1 从"工具"到"伙伴"

传统 AI Agent 的局限：每次对话都是白纸。你花 10 分钟教它你的项目结构，下次全忘了。

Hermes Agent 的突破：**它会记住，会总结，会把经验变成技能。** 第 100 次对话时，它已经不是当初那个 Agent 了。

### 6.2 隐忧：Agent 的"偏见积累"

自学习有风险：如果 Agent 从错误的经验中"学"到了坏习惯怎么办？

Hermes 的设计：
- 技能可审查（Skill 是人类可读的 Markdown 文件）
- 可手动编辑/删除错误技能
- Honcho 辩证建模减少了单一偏见

### 6.3 Agent 技能标准的统一

Hermes Agent 和 OpenClaw 都遵循 **agentskills.io** 开放标准。这意味着：
- 在一个平台上积累的技能，可以带到另一个平台
- 技能市场可以跨平台共享
- 用户不会被锁定在单一平台

### 6.4 对开发者的启示

如果你在构建自己的 AI Agent 系统，Hermes Agent 提供了一个值得学习的架构范式：

1. **闭环学习 > 单次推理**：让 Agent 能从经验中成长
2. **用户建模 > 用户偏好**：理解用户的矛盾和复杂性
3. **技能标准化 > 私有格式**：拥抱开放标准，降低迁移成本
4. **Serverless > 常驻进程**：空闲时零成本，按需唤醒

---

## 七、总结

| 维度 | 评价 |
|------|------|
| **创新性** | ⭐⭐⭐⭐⭐ 自学习闭环是真正的差异化 |
| **实用性** | ⭐⭐⭐⭐ 多平台 + Serverless 部署 |
| **技术深度** | ⭐⭐⭐⭐⭐ Honcho + FTS5 + Skill 提取 |
| **生态** | ⭐⭐⭐⭐ agentskills.io 兼容，但生态还在早期 |
| **中文支持** | ⭐⭐⭐ 不如 OpenClaw 的本土化 |

**一句话总结**：Hermes Agent 不是一个更好的 ChatGPT 包装器，它是第一个认真回答"AI Agent 能不能真正学习"这个问题的项目。如果你对 AI Agent 的未来感兴趣，这个项目值得深入研究。

---

*本文基于 Hermes Agent GitHub 仓库（[NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent)）的公开文档撰写，最后更新：2026年4月12日。*

**相关阅读**：
- [AI Agent 架构设计：从零理解智能体协作]（专栏文章）
- [AI Agent 是什么？从零理解智能体架构]（专栏文章）
- [OpenClaw ACP 原理深度解析：从零理解 Agent 控制协议]（专栏文章）
