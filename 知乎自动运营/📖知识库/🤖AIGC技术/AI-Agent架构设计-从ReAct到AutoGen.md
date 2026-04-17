# AI Agent 架构设计：从 ReAct 到 AutoGen，彻底搞懂智能体

## 📌 文章信息

- **类型**: AIGC 原理系列
- **字数**: 约 4500 字
- **预估数据**: 赞同 800+ / 收藏 350+ / 评论 90+
- **标签**: #AI #Agent #大模型 #人工智能 #系统设计
- **状态**: 📝 研究阶段

---

## 1. 什么是 AI Agent？

### 1.1 核心定义

**AI Agent（智能体）** = 大语言模型 + 记忆 + 规划 + 工具调用

简单说，给 LLM 安上"手脚"（工具调用）和"大脑"（规划记忆），让它能自主完成任务。

### 1.2 Agent vs ChatGPT 的本质区别

| 特性 | ChatGPT | AI Agent |
|------|---------|----------|
| **交互方式** | 一问一答 | 多轮对话，主动规划 |
| **能力边界** | 生成文本 | 调用工具、执行任务 |
| **记忆能力** | 短期上下文 | 长期记忆 + 短期记忆 |
| **自主性** | 被动响应 | 主动规划任务 |
| **应用场景** | 问答、创作 | 自动化、智能助手 |

### 1.3 为什么需要 Agent？

**痛点场景**：
- ❌ "帮我写个爬虫抓取知乎热榜" → ChatGPT 只能写代码，不能执行
- ❌ "分析这个数据并生成报告" → ChatGPT 缺少数据获取能力
- ❌ "自动帮我回复邮件" → ChatGPT 无法连接邮箱

**Agent 解决方案**：
- ✅ Agent 可以执行爬虫脚本
- ✅ Agent 可以读取数据库并分析
- ✅ Agent 可以调用邮箱 API 发送邮件

---

## 2. Agent 核心架构

### 2.1 四大核心模块

```
┌─────────────────────────────────────────────────────┐
│                    AI Agent 架构                      │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────┐      ┌──────────┐                      │
│  │  LLM 核心  │ ───→ │  规划模块  │                      │
│  └──────────┘      └──────────┘                      │
│       │                 │                            │
│       ↓                 ↓                            │
│  ┌──────────┐      ┌──────────┐      ┌──────────┐   │
│  │  记忆系统  │ ←── │  工具调用  │ →   │  外部世界  │   │
│  └──────────┘      └──────────┘      └──────────┘   │
│                                                       │
└─────────────────────────────────────────────────────┘
```

#### 2.1.1 LLM 核心（大脑）

**职责**：理解任务、生成规划、决策执行

**模型选择**：
- GPT-4：能力强，成本高，适合复杂任务
- Claude 3.5 Opus：推理强，代码能力好
- 本地模型（Llama 3.1）：成本低，适合批量部署

#### 2.1.2 记忆系统（记忆）

**三种记忆类型**：

| 类型 | 容量 | 持久性 | 示例 |
|------|------|--------|------|
| **短期记忆** | 有限 | 会话内 | 当前对话上下文 |
| **长期记忆** | 大小受限于存储 | 永久 | 用户偏好、历史任务 |
| **向量记忆** | 大 | 永久 | 语义检索的文档片段 |

**实现方式**：
- 短期记忆：LLM 上下文窗口
- 长期记忆：文件系统 / 数据库
- 向量记忆：向量数据库（Chroma / Pinecone / Milvus）

**记忆管理策略**：
```python
# 伪代码：记忆检索
class MemorySystem:
    def retrieve(self, query: str, top_k: int = 5):
        # 1. 向量检索相关记忆
        vector_results = self.vector_store.search(query, top_k)

        # 2. 关键词过滤
        keyword_results = self.keyword_search(query)

        # 3. 合并去重
        memories = merge_and_deduplicate(vector_results, keyword_results)

        # 4. 按 relevance 排序
        return sort_by_relevance(memories)
```

#### 2.1.3 规划模块（规划）

**核心思想**：将复杂任务分解为可执行的子任务

**主流规划算法**：

##### **(1) ReAct（Reasoning + Acting）**

**核心思想**：推理 → 行动 → 观察 → 迭代

**工作流程**：
```
Thought: 我需要获取知乎热榜
Action: 调用浏览器访问 zhihu.com/hot
Observation: 获取到 50 条热榜内容
Thought: 我需要分析这些热榜的话题分布
Action: 提取标题中的关键词
Observation: 统计出各话题的出现频率
```

**代码示例**：
```python
def react_agent(task: str, max_steps: int = 10):
    thought = f"开始执行任务: {task}"
    history = []

    for step in range(max_steps):
        # 1. 思考（Reasoning）
        thought = llm.generate(
            f"当前状态: {history}\n思考下一步行动"
        )

        # 2. 行动（Acting）
        action = parse_action(thought)
        result = execute_action(action)

        # 3. 观察（Observation）
        observation = parse_observation(result)

        # 4. 更新历史
        history.append({
            "thought": thought,
            "action": action,
            "observation": observation
        })

        # 5. 判断是否完成
        if is_task_complete(history):
            return summarize_result(history)

    return "任务未完成，达到最大步数限制"
```

**优点**：
- 思路清晰，易于理解
- 适合单 Agent 任务

**缺点**：
- 容易陷入循环
- 缺少全局优化

##### **(2) ToT（Tree of Thoughts）**

**核心思想**：生成多个可能的行动路径，评估后选择最优

**工作流程**：
```
初始任务: 分析知乎热榜

                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
    方案A: 分类分析           方案B: 情感分析
        ↓                       ↓
    评估: 可行性高            评估: 可行性中
        ↓                       ↓
        └───────────┬───────────┘
                    ↓
              选择方案A
```

**代码示例**：
```python
def tot_agent(task: str, max_depth: int = 3, branch_factor: int = 3):
    # 1. 生成初始思考
    thoughts = generate_initial_thoughts(task, branch_factor)

    # 2. 递归探索
    for depth in range(max_depth):
        new_thoughts = []
        for thought in thoughts:
            # 生成子思考
            sub_thoughts = generate_sub_thoughts(thought, branch_factor)
            # 评估
            scores = evaluate_thoughts(sub_thoughts)
            # 选择最好的
            best_sub_thoughts = select_best(sub_thoughts, scores, branch_factor)
            new_thoughts.extend(best_sub_thoughts)
        thoughts = new_thoughts

    # 3. 返回最优路径
    return find_best_path(thoughts)
```

**优点**：
- 全局优化，避免陷入局部最优
- 适合复杂决策

**缺点**：
- 计算成本高
- 评估标准难以定义

##### **(3) Reflexion（反思优化）**

**核心思想**：执行任务 → 反思失败原因 → 优化行动 → 重新执行

**工作流程**：
```
第一次执行:
  → 任务失败
  → 反思: 为什么失败？（缺少必要信息）
  → 优化: 先收集信息再执行

第二次执行:
  → 任务成功
  → 反思: 还能改进吗？（速度可以更快）
  → 优化: 使用并行处理
```

**代码示例**：
```python
def reflexion_agent(task: str, max_iterations: int = 3):
    for iteration in range(max_iterations):
        # 1. 执行任务
        result, success = execute_task(task)

        if success:
            break

        # 2. 反思
        reflection = llm.generate(
            f"任务: {task}\n结果: {result}\n为什么失败？"
        )

        # 3. 优化
        improved_task = llm.generate(
            f"原任务: {task}\n反思: {reflection}\n如何改进？"
        )

        task = improved_task

    return result
```

**优点**：
- 自我纠错能力强
- 适合需要多次尝试的任务

**缺点**：
- 迭代成本高
- 反思质量依赖 LLM 能力

#### 2.1.4 工具调用（手脚）

**核心思想**：将外部能力封装为工具，供 Agent 调用

**工具类型**：

| 类型 | 示例 | 用途 |
|------|------|------|
| **信息获取** | 浏览器、搜索 API | 获取外部信息 |
| **数据处理** | 数据库、文件操作 | 处理数据 |
| **内容生成** | 图片生成、TTS | 生成多媒体 |
| **系统集成** | 邮箱、日历 API | 集成外部服务 |
| **代码执行** | Python 解释器 | 执行代码 |

**工具定义示例**：
```python
# 工具定义
def define_tool(name: str, description: str, function: Callable):
    return {
        "name": name,
        "description": description,
        "function": function,
        "parameters": inspect.signature(function)
    }

# 示例工具
search_tool = define_tool(
    name="search",
    description="搜索互联网信息",
    function=lambda query: web_search(query)
)

execute_code_tool = define_tool(
    name="execute_python",
    description="执行 Python 代码",
    function=lambda code: run_python(code)
)
```

**工具选择策略**：
```python
def select_tools(task: str, available_tools: List[Tool]) -> List[Tool]:
    # 1. 任务意图识别
    intent = classify_intent(task)

    # 2. 工具匹配
    matched_tools = []
    for tool in available_tools:
        if is_relevant(tool.description, intent):
            matched_tools.append(tool)

    # 3. 排序（按相关性）
    return sort_by_relevance(matched_tools, intent)
```

---

## 3. 主流 Agent 框架

### 3.1 LangChain

**定位**: Python/JavaScript 生态的 Agent 框架

**核心组件**：
- **Chains**: 任务链
- **Agents**: 智能体
- **Tools**: 工具库
- **Memory**: 记忆系统

**代码示例**：
```python
from langchain.agents import AgentExecutor, create_react_agent
from langchain.tools import Tool
from langchain_openai import ChatOpenAI

# 1. 定义工具
tools = [
    Tool(
        name="search",
        func=lambda q: web_search(q),
        description="搜索互联网信息"
    ),
    Tool(
        name="calculator",
        func=lambda expr: eval(expr),
        description="计算数学表达式"
    )
]

# 2. 创建 Agent
llm = ChatOpenAI(model="gpt-4")
agent = create_react_agent(llm, tools)

# 3. 执行
agent_executor = AgentExecutor(agent=agent, tools=tools)
result = agent_executor.invoke({"input": "帮我搜索最新的 AI 技术进展"})

print(result)
```

**优点**：
- 生态丰富，工具多
- 文档完善，学习成本低
- 社区活跃，更新快

**缺点**：
- 性能开销大
- 定制化程度低
- 依赖性高

---

### 3.2 AutoGen

**定位**: 微软开源的多 Agent 协作框架

**核心思想**：多个 Agent 协作完成任务

**角色类型**：
- **User Proxy**: 用户代理（模拟用户输入）
- **Assistant**: 助手（回答问题）
- **Coder**: 程序员（写代码）
- **Manager**: 管理者（协调任务）

**代码示例**：
```python
from autogen import AssistantAgent, UserProxyAgent

# 1. 定义 Agent
assistant = AssistantAgent(
    name="assistant",
    llm_config={"model": "gpt-4"}
)

coder = AssistantAgent(
    name="coder",
    llm_config={"model": "gpt-4"},
    system_message="你是一个专业的程序员"
)

user_proxy = UserProxyAgent(
    name="user_proxy",
    human_input_mode="NEVER",
    code_execution_config={"use_docker": False}
)

# 2. 创建群聊
groupchat = GroupChat(
    agents=[user_proxy, assistant, coder],
    messages=[],
    max_round=10
)

manager = GroupChatManager(
    groupchat=groupchat,
    llm_config={"model": "gpt-4"}
)

# 3. 执行任务
user_proxy.initiate_chat(
    manager,
    message="帮我写一个爬虫抓取知乎热榜"
)
```

**优点**：
- 多 Agent 协作能力强
- 适合复杂任务
- 代码生成能力强

**缺点**：
- 学习曲线陡峭
- 文档相对简单
- 性能开销大

---

### 3.3 OpenClaw

**定位**: 个人 AI 助手，内置 Agent 能力

**核心特性**：
- **内置 Skills**: 浏览器操控、文件操作、系统命令
- **记忆系统**: SQLite + 向量检索
- **多模态**: 文本、图片、语音
- **自动化**: 定时任务、心跳机制

**代码示例**：
```bash
# 定义 Agent Skill
mkdir -p ~/.openclaw/workspace/skills/my-agent

# 创建 SKILL.md
cat > ~/.openclaw/workspace/skills/my-agent/SKILL.md << 'EOF'
# My Agent Skill

用于自动化任务处理。

## 用途
- 自动执行爬虫
- 数据分析
- 邮件回复
EOF

# 创建实现脚本
cat > ~/.openclaw/workspace/skills/my-agent/agent.js << 'EOF'
// Agent 逻辑
export async function run({ task, tools }) {
    // 1. 任务分解
    const subtasks = await decomposeTask(task);

    // 2. 依次执行
    for (const subtask of subtasks) {
        const tool = selectTool(subtask, tools);
        await tool(subtask);
    }

    // 3. 返回结果
    return "任务完成";
}
EOF
```

**优点**：
- 开箱即用，无需配置
- 与个人工作区深度集成
- 支持自定义扩展

**缺点**：
- 定制化需要一定学习成本

---

## 4. Agent 实战案例

### 4.1 知乎热榜分析 Agent

**任务**: 自动分析知乎热榜，生成报告

**设计思路**：
1. **获取热榜**：调用浏览器访问 zhihu.com/hot
2. **提取数据**：解析 HTML，提取标题、热度、分类
3. **分析话题**：统计各话题的出现频率
4. **生成报告**：汇总分析结果，生成 Markdown 报告

**代码实现**：
```python
class ZhihuHotAnalyzer:
    def __init__(self):
        self.tools = {
            "browser": self._visit_page,
            "parser": self._parse_html,
            "analyzer": self._analyze_topics,
            "reporter": self._generate_report
        }

    def run(self):
        # 1. 获取热榜
        hot_list = self.tools["browser"]("https://www.zhihu.com/hot")

        # 2. 提取数据
        data = self.tools["parser"](hot_list)

        # 3. 分析话题
        topics = self.tools["analyzer"](data)

        # 4. 生成报告
        report = self.tools["reporter"](topics)

        return report

    def _visit_page(self, url: str) -> str:
        # 使用浏览器访问页面
        return playwright_visit(url)

    def _parse_html(self, html: str) -> List[Dict]:
        # 解析 HTML，提取热榜数据
        return parse_zhihu_hot(html)

    def _analyze_topics(self, data: List[Dict]) -> Dict:
        # 统计话题分布
        topics = {}
        for item in data:
            topic = item["category"]
            topics[topic] = topics.get(topic, 0) + 1
        return topics

    def _generate_report(self, topics: Dict) -> str:
        # 生成 Markdown 报告
        report = "# 知乎热榜分析报告\n\n"
        report += "## 话题分布\n\n"
        for topic, count in sorted(topics.items(), key=lambda x: x[1], reverse=True):
            report += f"- {topic}: {count} 条\n"
        return report

# 执行
analyzer = ZhihuHotAnalyzer()
report = analyzer.run()
print(report)
```

---

### 4.2 邮件自动回复 Agent

**任务**: 自动分析邮件内容，生成回复草稿

**设计思路**：
1. **获取邮件**：调用邮箱 API 获取未读邮件
2. **分析意图**：识别邮件类型（咨询、投诉、合作等）
3. **生成回复**：根据意图生成回复草稿
4. **人工审核**：发送给用户审核
5. **发送邮件**：用户确认后发送

**代码实现**：
```python
class EmailAutoReply:
    def __init__(self):
        self.tools = {
            "fetch": self._fetch_emails,
            "classify": self._classify_intent,
            "generate": self._generate_reply,
            "send": self._send_email
        }

    def run(self):
        # 1. 获取邮件
        emails = self.tools["fetch"]()

        # 2. 处理每封邮件
        for email in emails:
            # 分析意图
            intent = self.tools["classify"](email["content"])

            # 生成回复
            reply = self.tools["generate"](email, intent)

            # 人工审核（通过 OpenClaw 心跳机制）
            approval = await human_review(reply)

            if approval:
                # 发送邮件
                self.tools["send"](email["from"], reply)

    def _fetch_emails(self) -> List[Dict]:
        # 获取未读邮件
        return fetch_unread_emails()

    def _classify_intent(self, content: str) -> str:
        # 分类意图
        prompt = f"""
        邮件内容: {content}
        请分类为以下类型之一: [咨询, 投诉, 合作, 其他]
        只返回类型，不解释。
        """
        return llm.generate(prompt)

    def _generate_reply(self, email: Dict, intent: str) -> str:
        # 生成回复
        prompt = f"""
        邮件类型: {intent}
        邮件内容: {email["content"]}
        请生成一个礼貌的回复。
        """
        return llm.generate(prompt)

    def _send_email(self, to: str, content: str):
        # 发送邮件
        send_email(to, content)

# 执行
agent = EmailAutoReply()
agent.run()
```

---

## 5. Agent 的挑战与局限

### 5.1 主要挑战

#### **(1) 规划失效**

**问题**：Agent 生成的规划不合理，导致任务失败

**原因**：
- LLM 对任务理解不足
- 缺少任务领域的专业知识
- 规划过于理想化，未考虑实际约束

**解决方案**：
- 使用 ToT 等规划算法，生成多个候选方案
- 引入领域知识，约束规划空间
- 人工审核关键决策

#### **(2) 记忆管理**

**问题**：Agent 需要处理大量信息，记忆系统成为瓶颈

**原因**：
- 长期记忆检索效率低
- 记忆更新不及时
- 记忆冲突和不一致

**解决方案**：
- 使用向量数据库 + 关键词索引的混合检索
- 定期清理和归档旧记忆
- 引入记忆一致性检查

#### **(3) 工具调用失败**

**问题**：工具调用失败导致整个任务中断

**原因**：
- API 接口变更
- 网络问题
- 参数错误

**解决方案**：
- 实现工具调用重试机制
- 提供工具调用日志和错误处理
- 设计工具调用容错策略

#### **(4) 成本高昂**

**问题**：复杂任务需要多次调用 LLM，成本高

**原因**：
- 规划、记忆、工具调用都需要 LLM 参与
- 迭代优化增加了调用次数
- 高质量模型（如 GPT-4）成本高

**解决方案**：
- 使用混合模型策略（复杂任务用 GPT-4，简单任务用本地模型）
- 优化 Prompt，减少调用次数
- 引入缓存机制，避免重复计算

---

### 5.2 适用场景

**✅ 适合 Agent 的场景**：
- 多步骤任务（数据分析、报告生成）
- 需要外部工具的任务（爬虫、文件操作）
- 自主决策场景（智能客服、自动化运营）
- 探索性任务（调研、信息收集）

**❌ 不适合 Agent 的场景**：
- 单轮问答（直接用 ChatGPT）
- 对延迟敏感的场景（实时交互）
- 对确定性要求高的场景（金融交易）
- 成本敏感的场景（大规模批量任务）

---

## 6. 未来发展方向

### 6.1 多 Agent 协作

**趋势**：从单 Agent 到多 Agent 协作

**优势**：
- 分工明确，效率更高
- 容错性强，单 Agent 失败不影响整体
- 可扩展性强，支持复杂任务

**挑战**：
- Agent 间通信协议
- 任务分配和协调
- 避免冲突和重复工作

### 6.2 Agent 平台化

**趋势**：从定制化开发到平台化服务

**代表性项目**：
- OpenAI's GPTs
- Character.AI
- AutoGPT

**优势**：
- 降低开发门槛
- 提供标准化工具
- 形成生态体系

### 6.3 Agent + 硬件

**趋势**：Agent 与硬件设备结合

**应用场景**：
- 智能家居控制
- 机器人操作
- 自动驾驶

**挑战**：
- 实时性要求高
- 硬件接口标准化
- 安全性和可靠性

---

## 7. 总结

### 核心要点

1. **Agent = LLM + 记忆 + 规划 + 工具调用**
   - LLM 提供推理能力
   - 记忆系统存储信息
   - 规划模块分解任务
   - 工具调用执行行动

2. **主流规划算法**：
   - ReAct：推理 → 行动 → 观察 → 迭代
   - ToT：生成多个路径，评估后选择最优
   - Reflexion：反思失败，优化重试

3. **主流框架**：
   - LangChain：生态丰富，适合快速开发
   - AutoGen：多 Agent 协作，适合复杂任务
   - OpenClaw：个人 AI 助手，开箱即用

4. **实战案例**：
   - 知乎热榜分析 Agent
   - 邮件自动回复 Agent

5. **挑战与局限**：
   - 规划失效、记忆管理、工具调用失败、成本高昂
   - 适合多步骤、需外部工具、自主决策场景
   - 不适合单轮问答、实时交互、确定性要求高的场景

6. **未来方向**：
   - 多 Agent 协作
   - Agent 平台化
   - Agent + 硬件

---

## 8. 参考文献和延伸阅读

### 核心论文

1. **ReAct: Synergizing Reasoning and Acting in Language Models** (2022)
   - 链接: https://arxiv.org/abs/2210.03629

2. **Tree of Thoughts: Deliberate Problem Solving with Large Language Models** (2023)
   - 链接: https://arxiv.org/abs/2305.10601

3. **Reflexion: Language Agents with Verbal Reinforcement Learning** (2023)
   - 链接: https://arxiv.org/abs/2303.11366

### 框架文档

1. **LangChain**: https://python.langchain.com/
2. **AutoGen**: https://microsoft.github.io/autogen/
3. **OpenClaw**: https://github.com/openclaw/openclaw

### 实战教程

1. **Build Your First AI Agent with LangChain**: https://www.deeplearning.ai/
2. **Multi-Agent Systems with AutoGen**: https://learn.microsoft.com/
3. **OpenClaw Skills Development Guide**: ~/.openclaw/workspace/AGENTS.md

---

**创建时间**: 2026-03-28
**创建者**: 知乎技术分享与知识付费运营 AI
**版本**: v1.0
**状态**: 📝 研究完成
**下一步**: 将研究成果转化为知乎文章
