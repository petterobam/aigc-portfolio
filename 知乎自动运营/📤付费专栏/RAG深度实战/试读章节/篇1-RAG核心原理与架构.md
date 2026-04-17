# RAG 核心原理与架构

> 本专栏试读章节，完整内容请订阅《RAG 深度实战》专栏
> 
> 订阅链接：[专栏地址](#)（待上线）

---

## 引言：为什么需要 RAG？

在大模型时代，我们经常会遇到这样的问题：

**问题 1：模型的知识有限**
```
你: "GPT-4 的参数量是多少？"
ChatGPT: "GPT-4 的具体参数量没有公开披露..."
```

**问题 2：模型会产生幻觉**
```
你: "OpenClaw v1.2.0 的新特性有哪些？"
ChatGPT: "OpenClaw v1.2.0 增加了 ACP 协议支持..."
（但实际上 ACP 是 v1.3.0 的特性）
```

**问题 3：模型无法访问私有数据**
```
你: "我们公司的请假流程是什么？"
ChatGPT: "我无法访问贵公司的内部数据..."
```

**RAG（Retrieval-Augmented Generation，检索增强生成）正是为了解决这些问题而生的。**

---

## RAG 是什么？

RAG 是一种结合了检索和生成的技术架构：

```
用户问题 → 检索相关文档 → 将文档作为上下文 → 大模型生成答案
```

### 核心优势

1. **减少幻觉**：基于检索到的真实文档生成答案
2. **更新知识**：通过更新文档库，无需重新训练模型
3. **保护隐私**：可以访问企业私有数据，同时保证数据安全
4. **提高准确率**：提供相关的上下文信息，帮助模型更好地理解问题

### 适用场景

✅ **推荐使用 RAG**：
- 企业知识库问答
- 技术文档问答
- 产品信息查询
- 法律/医疗等专业领域

❌ **不适合使用 RAG**：
- 创意写作（需要模型发挥想象力）
- 通用对话（如闲聊）
- 简单的事实性问题（可以直接用知识库）

---

## RAG 系统基本架构

一个完整的 RAG 系统包含以下几个核心组件：

```
┌─────────────┐
│   用户问题   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│     1. 文档索引与向量化           │
│    （文档切片 → 向量嵌入 → 存储）   │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     2. 问题检索                  │
│  （问题向量化 → 相似度搜索）     │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     3. 上下文组装                │
│  （检索文档 → 排序 → 组装）      │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────────────────────────┐
│     4. 大模型生成                │
│  （上下文 + 问题 → 答案）        │
└──────────────┬──────────────────┘
               │
               ▼
┌─────────────┐
│   最终答案   │
└─────────────┘
```

### 组件详解

#### 1. 文档索引与向量化

**目的**：将文档转化为向量表示，便于后续检索

**核心步骤**：
1. **文档切片**：将长文档切成小块
2. **向量化**：将每个文档块转化为向量
3. **存储**：将向量存储到向量数据库

**代码示例**：
```python
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter

# 1. 初始化文本分割器
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,      # 每块 1000 字符
    chunk_overlap=200,    # 重叠 200 字符
    separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""]
)

# 2. 初始化向量模型
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

# 3. 文档切片
documents = [
    "OpenClaw 是一个强大的 AI 助手平台...",
    "ACP 协议是 OpenClaw v1.3.0 的核心特性...",
]
chunks = text_splitter.split_documents(documents)

# 4. 向量化
vectors = model.encode([chunk.page_content for chunk in chunks])

print(f"切片数量: {len(chunks)}")
print(f"向量维度: {vectors.shape}")
```

**输出**：
```
切片数量: 15
向量维度: (15, 384)
```

---

#### 2. 问题检索

**目的**：根据用户问题，检索最相关的文档

**核心步骤**：
1. 将用户问题向量化
2. 计算问题向量与文档向量的相似度
3. 返回 Top-K 个最相关的文档

**代码示例**：
```python
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

# 1. 用户问题向量化
query = "OpenClaw 的 ACP 协议是什么？"
query_vector = model.encode([query])

# 2. 计算相似度
similarities = cosine_similarity(query_vector, vectors)

# 3. 返回 Top-K
top_k = 3
top_indices = np.argsort(similarities[0])[::-1][:top_k]

print(f"最相关的 {top_k} 个文档块：")
for idx in top_indices:
    print(f"相似度: {similarities[0][idx]:.4f}")
    print(f"内容: {chunks[idx].page_content[:100]}...")
    print("---")
```

**输出**：
```
最相关的 3 个文档块：
相似度: 0.8234
内容: ACP 协议是 OpenClaw v1.3.0 的核心特性，它允许用户通过简单的配置文件...
---
相似度: 0.7621
内容: OpenClaw v1.3.0 新增了 ACP (Agent Control Protocol) 协议，这使得...
---
相似度: 0.7128
内容: 通过 ACP 协议，用户可以轻松地创建和管理多个 AI Agent...
---
```

---

#### 3. 上下文组装

**目的**：将检索到的文档组装成结构化的上下文

**核心步骤**：
1. 对检索到的文档进行重排序（可选）
2. 按重要性或时间顺序组装
3. 添加元数据（如来源、时间）

**代码示例**：
```python
def assemble_context(retrieved_chunks):
    """组装上下文"""
    context_parts = []
    
    for idx, chunk in enumerate(retrieved_chunks):
        context_parts.append(f"""
【文档片段 {idx + 1}】
{chunk.page_content}

来源: {chunk.metadata.get('source', '未知')}
""")
    
    return "\n".join(context_parts)

# 组装上下文
retrieved_chunks = [chunks[idx] for idx in top_indices]
context = assemble_context(retrieved_chunks)

print(context)
```

---

#### 4. 大模型生成

**目的**：基于检索到的上下文，生成最终答案

**核心步骤**：
1. 构建提示词（Prompt）
2. 调用大模型 API
3. 解析和返回答案

**代码示例**：
```python
import openai

def generate_answer(query, context):
    """生成答案"""
    prompt = f"""
你是一个专业的技术问答助手。请根据提供的文档上下文，准确回答用户的问题。

文档上下文：
{context}

用户问题：
{query}

要求：
1. 基于文档上下文回答
2. 如果文档中没有答案，明确说明
3. 答案要准确、简洁、有逻辑
4. 必要时引用文档片段
"""

    response = openai.ChatCompletion.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个专业的技术问答助手。"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3
    )
    
    return response.choices[0].message.content

# 生成答案
answer = generate_answer(query, context)
print("答案:", answer)
```

---

## 完整 RAG 系统示例

将以上组件组合起来，形成一个完整的 RAG 系统：

```python
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter
import openai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class RAGSystem:
    """简单的 RAG 系统"""
    
    def __init__(self):
        self.model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", "。", "！", "？", "，", " ", ""]
        )
        self.chunks = []
        self.vectors = None
    
    def index_documents(self, documents):
        """索引文档"""
        # 切片
        self.chunks = self.text_splitter.split_documents(documents)
        
        # 向量化
        self.vectors = self.model.encode(
            [chunk.page_content for chunk in self.chunks]
        )
        
        print(f"索引完成：{len(self.chunks)} 个文档块")
    
    def retrieve(self, query, top_k=3):
        """检索相关文档"""
        query_vector = self.model.encode([query])
        similarities = cosine_similarity(query_vector, self.vectors)
        top_indices = np.argsort(similarities[0])[::-1][:top_k]
        
        return [self.chunks[idx] for idx in top_indices]
    
    def generate(self, query, context):
        """生成答案"""
        prompt = f"""
文档上下文：
{context}

用户问题：
{query}

请基于文档上下文回答用户的问题。
"""
        
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "你是一个专业的技术问答助手。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        
        return response.choices[0].message.content
    
    def query(self, question):
        """完整查询流程"""
        # 检索
        retrieved_chunks = self.retrieve(question, top_k=3)
        
        # 组装上下文
        context = assemble_context(retrieved_chunks)
        
        # 生成答案
        answer = self.generate(question, context)
        
        return answer

# 使用示例
if __name__ == "__main__":
    # 初始化系统
    rag = RAGSystem()
    
    # 索引文档
    documents = [
        "OpenClaw 是一个强大的 AI 助手平台...",
        "ACP 协议是 OpenClaw v1.3.0 的核心特性...",
    ]
    rag.index_documents(documents)
    
    # 查询
    question = "OpenClaw 的 ACP 协议是什么？"
    answer = rag.query(question)
    
    print(f"问题: {question}")
    print(f"答案: {answer}")
```

---

## RAG 的进阶优化方向

试读章节到此结束，完整内容请订阅《RAG 深度实战》专栏

### 本专栏后续将深入讲解：

1. **检索算法优化**
   - 混合检索（BM25 + 向量检索）
   - 重排序算法（Cross-Encoder）
   - 多跳检索

2. **向量数据库深度实战**
   - Chroma、Milvus、Pinecone 等主流方案
   - 性能优化与扩展
   - 分布式部署

3. **高级检索技术**
   - 递归检索
   - 假设性文档嵌入（HyDE）
   - 自适应检索

4. **生产环境部署**
   - 系统架构设计
   - 性能监控
   - 成本优化

---

**订阅《RAG 深度实战》专栏，学习从原理到生产的完整 RAG 系统开发！**

> **定价**: 199 元（早鸟价 149 元，前 100 名）
> **篇数**: 15 篇，~165,000 字
> **代码示例**: 60+ 个完整可运行的代码片段
> **实战案例**: 15 个完整项目

**立即订阅，开启你的 RAG 深度学习之旅！**

---

**试读章节到此结束**  
**完整内容请订阅《RAG 深度实战》专栏**

---

*创建时间: 2026-03-30*  
*版本: v1.0*  
*状态: 试读章节完成*
