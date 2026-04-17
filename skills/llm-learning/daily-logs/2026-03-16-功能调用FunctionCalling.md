# 第16天：功能调用（Function Calling）

## 日期
2026-03-16

## 核心知识点

### 1. Function Calling 基本概念

**定义：**
- 功能调用（Function Calling），也称工具调用（Tool Use），是指在基于大模型完成任务的过程中，Agent通过特定机制调用外部对象，获取返回结果后将其与原始Prompt一起输入到大模型，由大模型进一步推理并完成特定任务。

**被调用的对象包括：**
- 远程API
- 数据库查询接口
- 本地函数
- 工具插件（Plugin）

**架构图参考：**
`images_chinese/source_svg/【免训练的优化技术】功能调用（Function Calling）.svg`

### 2. Agent 系统架构

**Agent 是一个完整的软件系统，包括：**

1. **用户请求解析模块**
   - 理解用户意图
   - 提取关键信息

2. **参数处理模块**
   - 解析工具调用参数
   - 验证参数有效性

3. **工具调用模块**
   - 管理可用工具列表
   - 执行工具调用

4. **调用结果解析模块**
   - 处理工具返回结果
   - 格式化输出

5. **大模型交互组件**
   - 与 LLM 通信
   - 生成推理结果

**关键特点：**
- Agent 是本地运行的软件系统
- 大模型只是 Agent 的一个子模块
- Agent 还包括其他辅助模块来协调整个工作流程

### 3. Function Calling 工作流程

**典型流程：**

```
用户请求 → Agent 解析 → 判断是否需要工具调用
                                    ↓
                              是 → 选择工具
                                    ↓
                              生成调用参数
                                    ↓
                              执行工具调用
                                    ↓
                              获取返回结果
                                    ↓
                              将结果 + 原Prompt输入LLM
                                    ↓
                              生成最终答案
```

**核心优势：**
- 免训练：无需微调大模型即可扩展能力
- 模块化：工具可独立开发、测试、维护
- 灵活性：可以动态添加、删除工具
- 可控性：工具调用过程可监控、审计

### 4. 工具使用框架

**主流框架：**

1. **OpenAI Function Calling**
   - 原生支持函数调用
   - 通过 tools 参数定义可用函数
   - 自动解析和生成函数调用

2. **LangChain**
   - Tools 模块提供丰富的工具集成
   - 支持自定义工具开发
   - Agent 框架提供多种决策策略

3. **AutoGPT / BabyAGI**
   - 自主规划和执行
   - 多轮工具调用
   - 复杂任务分解

**工具类型：**
- 信息检索（搜索、数据库查询）
- 数据处理（计算、格式转换）
- 外部交互（邮件、API调用）
- 执行操作（文件操作、系统命令）

### 5. Function Calling 的分类

**按调用方式：**

1. **单次调用**
   - 简单场景
   - 一次调用即可完成任务

2. **多轮调用**
   - 复杂任务需要多次工具调用
   - 每次调用结果影响后续决策

3. **并行调用**
   - 同时调用多个工具
   - 工具之间无依赖关系

**按决策方式：**

1. **静态规则**
   - 基于预定义规则选择工具
   - 简单高效，但灵活性低

2. **LLM 驱动**
   - 大模型根据上下文选择工具
   - 灵活性高，但需要 Prompt 设计

3. **混合模式**
   - 结合规则和 LLM
   - 平衡效率和灵活性

### 6. Agent 基础

**Agent 定义：**
- 能够自主感知环境、做出决策并执行行动的系统
- 在 LLM 时代，Agent 通常指基于大模型的智能系统

**Agent 核心组件：**

1. **感知（Perception）**
   - 接收用户输入
   - 解析上下文信息

2. **记忆（Memory）**
   - 短期记忆：当前对话上下文
   - 长期记忆：向量数据库、知识库

3. **规划（Planning）**
   - 任务分解
   - 步骤排序
   - 策略选择

4. **行动（Action）**
   - 工具调用
   - 文本生成
   - 与环境交互

5. **反思（Reflection）**
   - 评估结果
   - 纠错调整
   - 学习优化

**Agent 类型：**

1. **ReAct Agent**
   - Reasoning + Acting
   - 思考-行动循环

2. **Plan-and-Execute Agent**
   - 先规划所有步骤
   - 再依次执行

3. **Self-Refine Agent**
   - 生成初始方案
   - 自我评估和改进

4. **Multi-Agent System**
   - 多个 Agent 协作
   - 分工合作完成复杂任务

## 代码示例

### 示例1：OpenAI Function Calling 基础使用

```python
import openai

# 定义可用的工具函数
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "获取指定城市的天气信息",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {
                        "type": "string",
                        "description": "城市名称"
                    },
                    "unit": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "温度单位"
                    }
                },
                "required": ["city"]
            }
        }
    }
]

# 用户请求
user_message = "北京今天的天气怎么样？"

# 调用大模型
response = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": user_message}],
    tools=tools
)

# 检查是否需要工具调用
if response.choices[0].message.tool_calls:
    # 执行工具调用
    tool_call = response.choices[0].message.tool_calls[0]
    if tool_call.function.name == "get_weather":
        # 解析参数
        args = json.loads(tool_call.function.arguments)
        city = args["city"]

        # 调用实际工具
        weather_data = get_weather_from_api(city)

        # 将工具结果返回给大模型
        response2 = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "user", "content": user_message},
                response.choices[0].message,
                {
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(weather_data)
                }
            ]
        )

        print(response2.choices[0].message.content)
```

### 示例2：使用 LangChain 的 Agent

```python
from langchain.agents import initialize_agent, Tool
from langchain.llms import OpenAI
from langchain.memory import ConversationBufferMemory

# 定义工具
def search_tool(query):
    # 实际的搜索实现
    return f"搜索结果：{query}"

def calculator(expression):
    # 实际的计算实现
    return f"计算结果：{expression}"

tools = [
    Tool(
        name="Search",
        func=search_tool,
        description="用于搜索信息"
    ),
    Tool(
        name="Calculator",
        func=calculator,
        description="用于数学计算"
    )
]

# 初始化 Agent
memory = ConversationBufferMemory(memory_key="chat_history")
llm = OpenAI(temperature=0)

agent = initialize_agent(
    tools,
    llm,
    agent="conversational-react-description",
    memory=memory,
    verbose=True
)

# 使用 Agent
response = agent.run("帮我搜索一下 Python 的最新版本，然后计算 2024 减去 2015")
print(response)
```

### 示例3：自定义工具（LangChain）

```python
from langchain.tools import BaseTool
from typing import Optional

class WeatherTool(BaseTool):
    name = "weather"
    description = "获取天气信息，输入城市名称"

    def _run(self, city: str) -> str:
        # 同步调用
        return f"{city}：晴天，温度 25°C"

    async def _arun(self, city: str) -> str:
        # 异步调用
        return f"{city}：晴天，温度 25°C"

# 使用自定义工具
weather_tool = WeatherTool()

from langchain.agents import initialize_agent, Tool

tools = [Tool(
    name="Weather",
    func=weather_tool.run,
    description="获取天气信息"
)]
```

## 实践建议

### 1. Function Calling 设计原则

**工具定义清晰：**
- 工具名称要简洁明确
- 描述要详细说明用途和参数
- 参数要有明确的类型和约束

**错误处理：**
- 工具调用失败时返回清晰的错误信息
- 给予大模型重试的机会
- 记录调用日志便于调试

**安全性：**
- 限制工具的访问权限
- 验证参数防止注入攻击
- 敏感操作需要二次确认

### 2. 提示词工程

**工具选择提示：**
```
你是一个智能助手，可以使用以下工具：

{tools}

请根据用户请求，判断是否需要使用工具。
如果需要，选择合适的工具并生成调用参数。
如果不需要，直接回答用户问题。

用户请求：{user_input}
```

**工具结果解释提示：**
```
工具调用结果：
{tool_result}

请基于以下信息回答用户问题：
原始请求：{original_request}
工具结果：{tool_result}

要求：
1. 结合工具结果和原始请求
2. 提供清晰、准确的答案
3. 如果结果不完整，说明需要哪些额外信息
```

### 3. 性能优化

**并行调用：**
```python
# 当多个工具之间无依赖时，可以并行调用
import asyncio

async def call_multiple_tools(tools, params):
    tasks = [tool(**param) for tool, param in zip(tools, params)]
    results = await asyncio.gather(*tasks)
    return results
```

**缓存策略：**
- 对相同请求的工具调用结果进行缓存
- 设置合理的过期时间
- 减少重复的 API 调用

**批处理：**
- 将多个类似请求合并为一个批量调用
- 减少网络开销
- 提高 API 利用率

### 4. 调试技巧

**详细日志：**
```python
import logging

logging.basicConfig(level=logging.INFO)

def log_tool_call(tool_name, params, result, execution_time):
    logging.info(f"""
    Tool Call:
      Name: {tool_name}
      Params: {params}
      Result: {result}
      Execution Time: {execution_time}ms
    """)
```

**可视化工具调用链：**
- 记录每次工具调用的依赖关系
- 生成调用链可视化图
- 帮助理解 Agent 的决策过程

## 常见问题

### Q1: Function Calling 与 Fine-tuning 的区别？

**Function Calling：**
- 无需训练大模型
- 通过外部工具扩展能力
- 灵活性高，易于维护

**Fine-tuning：**
- 需要训练数据和算力
- 将知识融入模型内部
- 推理时无需外部依赖

**选择建议：**
- 频繁变化的工具/知识 → Function Calling
- 稳定的专业知识 → Fine-tuning
- 需要快速迭代 → Function Calling
- 追求极致性能 → Fine-tuning

### Q2: 如何处理工具调用失败？

**策略：**
1. 返回详细错误信息给 LLM
2. 提供 LLM 修正参数的机会
3. 设置最大重试次数
4. 记录失败日志用于分析

**示例：**
```python
def safe_tool_call(tool_func, params, max_retries=3):
    for i in range(max_retries):
        try:
            return tool_func(**params)
        except Exception as e:
            if i == max_retries - 1:
                return f"工具调用失败：{str(e)}"
```

### Q3: 如何提高 Function Calling 的准确性？

**方法：**
1. 完善工具描述和参数说明
2. 提供工具使用示例（few-shot）
3. 使用更强大的模型（如 GPT-4）
4. 添加参数验证和格式检查
5. 收集错误案例优化 Prompt

## 学习总结

今天学习了 Function Calling（功能调用）的核心概念、Agent 系统架构、工作流程以及相关工具框架。Function Calling 是一种免训练的优化技术，通过让大模型调用外部工具来扩展其能力，无需修改模型本身即可实现强大的功能。

**关键要点：**
1. Function Calling = LLM + 工具调用框架
2. Agent 是包含 LLM 的完整系统，还有其他辅助模块
3. 工具调用需要：解析请求、选择工具、执行调用、处理结果
4. 主流框架：OpenAI Function Calling、LangChain、AutoGPT
5. 实践要点：清晰的工具定义、完善的错误处理、性能优化

**实际应用场景：**
- 问答系统（搜索、知识库查询）
- 数据分析（数据库查询、计算）
- 自动化办公（邮件、文档处理）
- 客服机器人（订单查询、信息检索）

## 明日预告

**第 17 天：强化学习基础（RL）**

- 三大机器学习范式（监督学习、无监督学习、强化学习）
- 强化学习基础架构（Agent、Environment）
- 马尔可夫决策过程（MDP）
- 探索与利用问题（Exploration vs Exploitation）
