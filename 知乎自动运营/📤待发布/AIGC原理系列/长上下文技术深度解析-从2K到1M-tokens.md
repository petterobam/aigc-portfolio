# 长上下文技术深度解析：从 2K 到 1M tokens

> "GPT-4 的上下文窗口只有 8K tokens，而 Claude 3 已经支持 1M tokens。差距从何而来？这篇文章带你一探究竟。"

---

## 核心结论

长上下文技术是当前大模型竞争的关键战场，从最初的 2K tokens 扩展到 1M tokens，不是简单的参数调优，而是涉及模型架构、训练技术、推理优化的系统性突破。

看完这篇文章，你将理解：

1. **为什么需要长上下文**：实际应用场景的真实需求
2. **长上下文的挑战**：为什么这么难（计算成本、注意力机制、训练稳定性）
3. **关键技术路径**：4 大类技术方案（滑动窗口、稀疏注意力、分层压缩、检索增强）
4. **主流方案对比**：RoPE、ALiBi、LongLoRA、RAG 等方案的优缺点
5. **实战代码**：从零实现一个支持长上下文的 Transformer

---

## 为什么需要长上下文？

### 实际应用场景

**场景 1：长文档处理**
- 技术文档分析：完整阅读 100+ 页的 API 文档
- 法律合同审查：分析完整的合同条款
- 学术论文总结：处理多篇相关论文

**场景 2：代码库理解**
- 代码库分析：理解整个项目的代码结构
- 代码生成：基于完整代码库生成新功能
- Bug 修复：跨多个文件的 bug 定位

**场景 3：多轮对话**
- 长对话历史：保持上下文的聊天机器人
- 个性化助手：基于历史记录的个性化推荐
- 知识管理：长期记忆系统

### 上下文长度的演进

| 模型 | 上下文长度 | 发布时间 |
|------|-----------|----------|
| GPT-2 | 1,024 | 2019 |
| GPT-3 | 2,048 | 2020 |
| GPT-4 | 8,192 | 2023 |
| GPT-4 Turbo | 32,768 | 2023 |
| Claude 3 Opus | 200,000 | 2024 |
| Claude 3 | 1,000,000 | 2024 |

从 2K 到 1M，增长了 **500 倍**。

---

## 长上下文的挑战

### 1. 计算成本爆炸

**自注意力机制的复杂度**

标准 Transformer 的自注意力机制时间复杂度是 O(n²)，其中 n 是序列长度。

```python
# 标准自注意力（复杂度 O(n²)）
def attention(Q, K, V):
    # Q, K, V 的形状: (batch_size, seq_len, d_model)
    scores = torch.matmul(Q, K.transpose(-2, -1))  # (batch_size, seq_len, seq_len)
    attn_weights = F.softmax(scores, dim=-1)
    return torch.matmul(attn_weights, V)
```

当序列长度从 2K 增加到 1M：
- 计算量增加：**(1M / 2K)² = 250,000 倍**
- 显存占用：线性增长到 500 倍

**显存瓶颈**

一个注意力权重矩阵的大小：
```
Attention Weights = seq_len × seq_len × 4 bytes (float32)
                  = 1,000,000 × 1,000,000 × 4
                  = 4 TB
```

这显然是不现实的。

### 2. 训练不稳定

**梯度消失/爆炸**
- 深度网络中的梯度问题在长序列中更严重
- 位置编码在长序列中可能失效

**位置信息丢失**
- 标准 Transformer 的位置编码（sinusoidal）在长序列中精度下降
- 模型难以区分相距较远的 token 之间的关系

### 3. 推理延迟

**逐 token 生成**
```python
# 标准 Transformer 的逐 token 生成
for i in range(max_length):
    # 每次生成一个 token，需要重新计算整个序列的注意力
    next_token = model(input_ids[:, :i+1])
```

每个 token 生成的复杂度是 O(n)，生成长度为 L 的序列复杂度是 O(L²)。

---

## 关键技术路径

### 技术方案分类

```
长上下文技术
├── 1. 滑动窗口（Sliding Window）
│   ├── 固定窗口
│   └── 累积窗口（如 StreamingLLM）
├── 2. 稀疏注意力（Sparse Attention）
│   ├── Local Attention
│   ├── Global Attention
│   └── Block Sparse（如 BigBird, Longformer）
├── 3. 分层压缩（Hierarchical Compression）
│   ├── 分层 Transformer（如 Transformer-XL）
│   └── 压缩注意力（如 Compressive Transformer）
└── 4. 检索增强（Retrieval-Augmented）
    ├── RAG（Retrieval-Augmented Generation）
    └── kNN-LM（k-Nearest Neighbors Language Model）
```

---

### 方案 1：滑动窗口（Sliding Window）

**核心思想**

限制注意力只关注附近的 token，忽略远处的 token。

**实现代码**

```python
def sliding_window_attention(Q, K, V, window_size=512):
    """
    滑动窗口注意力

    Args:
        Q, K, V: (batch_size, seq_len, d_model)
        window_size: 窗口大小
    """
    batch_size, seq_len, d_model = Q.shape
    device = Q.device

    # 创建注意力掩码（每个 token 只能关注窗口内的 token）
    mask = torch.triu(
        torch.ones(seq_len, seq_len, device=device) * float('-inf'),
        diagonal=window_size
    )

    # 计算注意力分数
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_model)
    scores = scores + mask

    # 应用 softmax 和 V
    attn_weights = F.softmax(scores, dim=-1)
    output = torch.matmul(attn_weights, V)

    return output
```

**优点**
- 计算复杂度从 O(n²) 降低到 O(n × window_size)
- 显存占用大幅降低
- 训练和推理都高效

**缺点**
- 无法捕捉长距离依赖
- 需要精心设计窗口大小
- 可能丢失全局信息

**代表模型**
- Longformer
- BigBird（部分方案）

---

### 方案 2：稀疏注意力（Sparse Attention）

**核心思想**

结合局部注意力和全局注意力，只计算部分位置的注意力。

**Block Sparse Attention（BigBird）**

```python
def block_sparse_attention(Q, K, V, block_size=64, global_tokens=10):
    """
    Block Sparse Attention（BigBird 方案）

    Args:
        Q, K, V: (batch_size, seq_len, d_model)
        block_size: 块大小
        global_tokens: 全局 token 数量（如 [CLS], [SEP]）
    """
    batch_size, seq_len, d_model = Q.shape
    num_blocks = (seq_len + block_size - 1) // block_size

    # 创建稀疏掩码
    mask = torch.full((seq_len, seq_len), float('-inf'))

    # 1. 局部注意力（窗口内）
    for i in range(num_blocks):
        for j in range(num_blocks):
            if abs(i - j) <= 1:  # 相邻块
                start_i, end_i = i * block_size, min((i + 1) * block_size, seq_len)
                start_j, end_j = j * block_size, min((j + 1) * block_size, seq_len)
                mask[start_i:end_i, start_j:end_j] = 0

    # 2. 全局注意力（全局 token 与所有 token）
    for i in range(global_tokens):
        mask[i, :] = 0
        mask[:, i] = 0

    # 计算注意力分数
    scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(d_model)
    scores = scores + mask

    # 应用 softmax 和 V
    attn_weights = F.softmax(scores, dim=-1)
    output = torch.matmul(attn_weights, V)

    return output
```

**优点**
- 计算复杂度降低到 O(n)
- 能够捕捉全局信息（通过全局 token）
- 适合长序列处理

**缺点**
- 实现复杂
- 需要设计全局 token 的位置
- 可能损失局部精度

**代表模型**
- BigBird
- Longformer

---

### 方案 3：分层压缩（Hierarchical Compression）

**核心思想**

将长序列分层处理，高层压缩低层的信息。

**Transformer-XL（Segment-Level Recurrence）**

```python
class TransformerXL(nn.Module):
    """
    Transformer-XL: 分层处理长序列

    核心思想：使用缓存机制，保留之前 segment 的隐藏状态
    """
    def __init__(self, d_model, n_heads, d_ff, n_layers, segment_len=512):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_ff = d_ff
        self.n_layers = n_layers
        self.segment_len = segment_len

        # Transformer 层
        self.layers = nn.ModuleList([
            TransformerXLLayer(d_model, n_heads, d_ff)
            for _ in range(n_layers)
        ])

    def forward(self, x, mems=None):
        """
        Args:
            x: 当前 segment (batch_size, segment_len, d_model)
            mems: 之前的缓存 (n_layers, batch_size, mem_len, d_model)
        """
        batch_size, segment_len, d_model = x.shape

        # 初始化输出
        outputs = []

        # 初始化缓存（如果为空）
        if mems is None:
            mems = [None] * self.n_layers
        else:
            # 限制缓存长度（避免无限增长）
            max_mems_len = self.segment_len
            mems = [mem[:, :, -max_mems_len:, :] for mem in mems]

        # 逐层处理
        new_mems = []
        for i, layer in enumerate(self.layers):
            # 使用缓存
            x, new_mem = layer(x, mems[i])
            new_mems.append(new_mem)

        return x, new_mems


class TransformerXLLayer(nn.Module):
    """
    Transformer-XL 层（带缓存）
    """
    def __init__(self, d_model, n_heads, d_ff):
        super().__init__()
        self.attn = MultiHeadAttention(d_model, n_heads)
        self.ffn = FeedForward(d_model, d_ff)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)

    def forward(self, x, mem=None):
        """
        Args:
            x: 当前 segment (batch_size, segment_len, d_model)
            mem: 之前的缓存 (batch_size, mem_len, d_model)
        Returns:
            output: 当前 segment 的输出
            new_mem: 新的缓存（包含当前 segment）
        """
        # 拼接缓存和当前输入
        if mem is not None:
            extended_x = torch.cat([mem, x], dim=1)  # (batch_size, mem_len + segment_len, d_model)
        else:
            extended_x = x

        # 自注意力
        attn_out = self.attn(extended_x)  # 注意到整个拼接序列
        # 只取当前 segment 的输出
        attn_out = attn_out[:, -x.size(1):, :]

        # 残差连接 + 层归一化
        x = self.norm1(x + attn_out)

        # 前馈网络
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)

        # 更新缓存（包含当前 segment）
        if mem is not None:
            new_mem = torch.cat([mem, x], dim=1)
        else:
            new_mem = x

        return x, new_mem
```

**优点**
- 处理超长序列（理论上无限制）
- 保留长期记忆
- 适合流式处理

**缺点**
- 缓存管理复杂
- 训练不稳定（梯度传播问题）
- 需要精心设计缓存长度

**代表模型**
- Transformer-XL
- Compressive Transformer

---

### 方案 4：检索增强（Retrieval-Augmented）

**核心思想**

将长序列分成小块，通过检索机制动态加载相关块。

**RAG（Retrieval-Augmented Generation）**

```python
def rag_generation(query, documents, retriever, generator):
    """
    RAG: 检索增强生成

    Args:
        query: 用户查询
        documents: 文档库（分块后的文本）
        retriever: 检索器（如 BM25、向量检索）
        generator: 生成器（如 GPT-4）
    """
    # 步骤 1: 检索相关文档
    retrieved_docs = retriever.retrieve(query, documents, k=5)

    # 步骤 2: 构建上下文
    context = "\n\n".join([
        f"文档 {i+1}: {doc}"
        for i, doc in enumerate(retrieved_docs)
    ])

    # 步骤 3: 生成回答
    prompt = f"""
    基于以下文档回答问题：

    {context}

    问题：{query}

    回答：
    """

    response = generator.generate(prompt)
    return response


class VectorRetriever:
    """
    向量检索器
    """
    def __init__(self, documents, embedding_model):
        self.documents = documents
        self.embedding_model = embedding_model

        # 预计算文档向量
        self.doc_embeddings = [
            self.embedding_model.encode(doc)
            for doc in documents
        ]

    def retrieve(self, query, k=5):
        """
        检索相关文档
        """
        # 计算 query 向量
        query_embedding = self.embedding_model.encode(query)

        # 计算相似度
        similarities = [
            cosine_similarity(query_embedding, doc_emb)
            for doc_emb in self.doc_embeddings
        ]

        # 返回 top-k 文档
        top_indices = np.argsort(similarities)[-k:][::-1]
        return [self.documents[i] for i in top_indices]


def cosine_similarity(a, b):
    """
    余弦相似度
    """
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

**优点**
- 处理超长文档（理论上无限制）
- 不会增加推理成本（只检索相关部分）
- 可以外挂知识库

**缺点**
- 检索质量依赖检索器
- 生成质量可能不如全量上下文
- 需要维护文档库

**代表模型**
- RAG
- kNN-LM
- RETRO

---

## 主流方案对比

| 方案 | 计算复杂度 | 最大上下文长度 | 训练稳定性 | 实现难度 | 代表模型 |
|------|-----------|---------------|-----------|---------|----------|
| 滑动窗口 | O(n × w) | ~64K | 高 | 低 | Longformer |
| 稀疏注意力 | O(n) | ~1M | 中 | 中 | BigBird |
| 分层压缩 | O(n) | ~1M | 低 | 高 | Transformer-XL |
| 检索增强 | O(n + k) | ~∞ | 高 | 中 | RAG |

**选择建议**
- **中小上下文（< 32K）**：滑动窗口（简单高效）
- **长上下文（32K - 256K）**：稀疏注意力（平衡性能和效率）
- **超长上下文（> 256K）**：检索增强（无限制）
- **流式处理**：分层压缩（保留长期记忆）

---

## 主流模型的长上下文技术

### GPT-4：位置编码优化

**RoPE（Rotary Positional Embedding）**

```python
def rotary_position_embedding(x, seq_len, d_model):
    """
    Rotary Positional Embedding (RoPE)

    核心思想：通过旋转变换编码位置信息
    """
    # 生成旋转角度
    theta = 1.0 / (10000 ** (torch.arange(0, d_model, 2).float() / d_model))
    theta = theta.unsqueeze(0).unsqueeze(0)  # (1, 1, d_model/2)

    # 生成位置索引
    seq_idx = torch.arange(seq_len, dtype=torch.float).unsqueeze(0).unsqueeze(-1)  # (1, seq_len, 1)

    # 计算旋转角度矩阵
    theta_matrix = seq_idx * theta  # (1, seq_len, d_model/2)

    # 分离实部和虚部
    x_real, x_imag = x[..., ::2], x[..., 1::2]  # (batch, seq_len, d_model/2)

    # 应用旋转
    cos_theta = torch.cos(theta_matrix)
    sin_theta = torch.sin(theta_matrix)

    x_rotated_real = x_real * cos_theta - x_imag * sin_theta
    x_rotated_imag = x_real * sin_theta + x_imag * cos_theta

    # 拼接实部和虚部
    x_rotated = torch.stack([x_rotated_real, x_rotated_imag], dim=-1).reshape(x.shape)

    return x_rotated


class RoPEMultiHeadAttention(nn.Module):
    """
    带 RoPE 的多头注意力
    """
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x, mask=None):
        batch_size, seq_len, d_model = x.shape

        # 计算 Q, K, V
        Q = self.W_q(x).view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x).view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x).view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)

        # 应用 RoPE
        Q = rotary_position_embedding(Q, seq_len, self.d_k)
        K = rotary_position_embedding(K, seq_len, self.d_k)

        # 计算注意力
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        attn = F.softmax(scores, dim=-1)
        context = torch.matmul(attn, V)

        # 合并多头
        context = context.transpose(1, 2).contiguous().view(batch_size, seq_len, d_model)
        return self.W_o(context)
```

**RoPE 的优势**
- 外推性好（可以处理比训练时更长的序列）
- 数值稳定（相对位置编码）
- 训练高效（无需额外训练）

---

### Claude 3：混合架构

**核心思想：结合多种技术**

1. **稀疏注意力**：处理大部分 token（计算高效）
2. **密集注意力**：处理关键 token（保证质量）
3. **检索增强**：处理超长文档（无限制）

**伪代码**

```python
class Claude3Attention(nn.Module):
    """
    Claude 3 的混合注意力机制
    """
    def __init__(self, d_model, n_heads, sparse_ratio=0.8):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.sparse_ratio = sparse_ratio

        # 密集注意力（用于关键 token）
        self.dense_attn = MultiHeadAttention(d_model, n_heads)

        # 稀疏注意力（用于普通 token）
        self.sparse_attn = SparseAttention(d_model, n_heads)

    def forward(self, x, important_token_mask):
        """
        Args:
            x: 输入 (batch_size, seq_len, d_model)
            important_token_mask: 重要 token 的掩码 (batch_size, seq_len)
        """
        batch_size, seq_len, d_model = x.shape

        # 分离重要 token 和普通 token
        important_x = x * important_token_mask.unsqueeze(-1)
        normal_x = x * (1 - important_token_mask.unsqueeze(-1))

        # 重要 token 使用密集注意力
        important_output = self.dense_attn(important_x)

        # 普通 token 使用稀疏注意力
        normal_output = self.sparse_attn(normal_x)

        # 合并输出
        output = important_output + normal_output
        return output
```

---

## 实战：从零实现支持长上下文的 Transformer

### 完整代码

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math


class LongContextTransformer(nn.Module):
    """
    支持长上下文的 Transformer

    组合了多种技术：
    1. RoPE 位置编码
    2. 稀疏注意力
    3. 分层缓存（可选）
    """
    def __init__(self, vocab_size, d_model, n_heads, d_ff, n_layers, max_seq_len=8192):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.max_seq_len = max_seq_len

        # 词嵌入
        self.embedding = nn.Embedding(vocab_size, d_model)

        # Transformer 层
        self.layers = nn.ModuleList([
            LongContextTransformerLayer(d_model, n_heads, d_ff)
            for _ in range(n_layers)
        ])

        # 输出层
        self.output = nn.Linear(d_model, vocab_size)

    def forward(self, input_ids, attention_mask=None, cache=None):
        """
        Args:
            input_ids: (batch_size, seq_len)
            attention_mask: (batch_size, seq_len)
            cache: 分层缓存（用于流式处理）
        """
        batch_size, seq_len = input_ids.shape

        # 词嵌入
        x = self.embedding(input_ids)

        # 逐层处理
        new_cache = []
        for i, layer in enumerate(self.layers):
            layer_cache = cache[i] if cache is not None else None
            x, layer_new_cache = layer(x, attention_mask, layer_cache)
            new_cache.append(layer_new_cache)

        # 输出层
        logits = self.output(x)

        return logits, new_cache


class LongContextTransformerLayer(nn.Module):
    """
    支持长上下文的 Transformer 层
    """
    def __init__(self, d_model, n_heads, d_ff):
        super().__init__()
        self.attn = RoPESparseAttention(d_model, n_heads)
        self.ffn = FeedForward(d_model, d_ff)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)

    def forward(self, x, attention_mask=None, cache=None):
        """
        Args:
            x: (batch_size, seq_len, d_model)
            attention_mask: (batch_size, seq_len)
            cache: (batch_size, cache_len, d_model)
        """
        # 自注意力（带缓存）
        attn_out, new_cache = self.attn(x, attention_mask, cache)

        # 残差连接 + 层归一化
        x = self.norm1(x + attn_out)

        # 前馈网络
        ffn_out = self.ffn(x)
        x = self.norm2(x + ffn_out)

        return x, new_cache


class RoPESparseAttention(nn.Module):
    """
    RoPE 稀疏注意力
    """
    def __init__(self, d_model, n_heads, sparse_ratio=0.5):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        self.sparse_ratio = sparse_ratio

        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

    def forward(self, x, attention_mask=None, cache=None):
        """
        Args:
            x: (batch_size, seq_len, d_model)
            attention_mask: (batch_size, seq_len)
            cache: (batch_size, cache_len, d_model)
        """
        batch_size, seq_len, d_model = x.shape

        # 拼接缓存
        if cache is not None:
            x_with_cache = torch.cat([cache, x], dim=1)
            cache_len = cache.size(1)
            total_len = cache_len + seq_len
        else:
            x_with_cache = x
            cache_len = 0
            total_len = seq_len

        # 计算 Q, K, V
        Q = self.W_q(x_with_cache).view(batch_size, total_len, self.n_heads, self.d_k).transpose(1, 2)
        K = self.W_k(x_with_cache).view(batch_size, total_len, self.n_heads, self.d_k).transpose(1, 2)
        V = self.W_v(x_with_cache).view(batch_size, total_len, self.n_heads, self.d_k).transpose(1, 2)

        # 应用 RoPE
        Q = rotary_position_embedding(Q, total_len, self.d_k)
        K = rotary_position_embedding(K, total_len, self.d_k)

        # 创建稀疏掩码
        sparse_mask = self._create_sparse_mask(total_len, self.sparse_ratio, device=x.device)

        # 计算注意力分数
        scores = torch.matmul(Q, K.transpose(-2, -1)) / math.sqrt(self.d_k)
        scores = scores + sparse_mask

        # 应用 attention_mask（如果提供）
        if attention_mask is not None:
            # 扩展 attention_mask 以匹配缓存
            if cache is not None:
                extended_mask = torch.cat([
                    torch.ones(batch_size, cache_len, device=x.device),
                    attention_mask
                ], dim=1)
            else:
                extended_mask = attention_mask
            scores = scores.masked_fill(extended_mask.unsqueeze(1).unsqueeze(1) == 0, -1e9)

        # Softmax
        attn_weights = F.softmax(scores, dim=-1)

        # 计算 V 的加权和
        context = torch.matmul(attn_weights, V)

        # 只返回当前输入的输出
        context = context[:, :, cache_len:, :].transpose(1, 2).contiguous().view(batch_size, seq_len, d_model)
        output = self.W_o(context)

        # 更新缓存
        new_cache = x_with_cache.detach()

        return output, new_cache

    def _create_sparse_mask(self, seq_len, sparse_ratio, device):
        """
        创建稀疏注意力掩码

        Args:
            seq_len: 序列长度
            sparse_ratio: 稀疏比例（0.5 表示只计算 50% 的注意力）
            device: 设备
        """
        mask = torch.full((seq_len, seq_len), float('-inf'), device=device)

        # 局部注意力（窗口内）
        window_size = int(seq_len * sparse_ratio)
        for i in range(seq_len):
            start = max(0, i - window_size // 2)
            end = min(seq_len, i + window_size // 2 + 1)
            mask[i, start:end] = 0

        return mask


class FeedForward(nn.Module):
    """
    前馈网络
    """
    def __init__(self, d_model, d_ff):
        super().__init__()
        self.ffn = nn.Sequential(
            nn.Linear(d_model, d_ff),
            nn.GELU(),
            nn.Linear(d_ff, d_model)
        )

    def forward(self, x):
        return self.ffn(x)


def rotary_position_embedding(x, seq_len, d_model):
    """
    Rotary Positional Embedding (RoPE)
    """
    theta = 1.0 / (10000 ** (torch.arange(0, d_model, 2).float() / d_model))
    theta = theta.unsqueeze(0).unsqueeze(0).to(x.device)  # (1, 1, d_model/2)

    seq_idx = torch.arange(seq_len, dtype=torch.float).unsqueeze(0).unsqueeze(-1).to(x.device)  # (1, seq_len, 1)

    theta_matrix = seq_idx * theta  # (1, seq_len, d_model/2)

    x_real, x_imag = x[..., ::2], x[..., 1::2]  # (..., d_model/2)

    cos_theta = torch.cos(theta_matrix)
    sin_theta = torch.sin(theta_matrix)

    x_rotated_real = x_real * cos_theta - x_imag * sin_theta
    x_rotated_imag = x_real * sin_theta + x_imag * cos_theta

    x_rotated = torch.stack([x_rotated_real, x_rotated_imag], dim=-1).reshape(x.shape)

    return x_rotated
```

### 使用示例

```python
# 初始化模型
model = LongContextTransformer(
    vocab_size=50000,
    d_model=512,
    n_heads=8,
    d_ff=2048,
    n_layers=6,
    max_seq_len=8192
)

# 模拟输入
batch_size = 4
seq_len = 2048
input_ids = torch.randint(0, 50000, (batch_size, seq_len))
attention_mask = torch.ones(batch_size, seq_len)

# 前向传播
logits, cache = model(input_ids, attention_mask)

print(f"Logits shape: {logits.shape}")  # (batch_size, seq_len, vocab_size)
print(f"Cache shape: {cache[0].shape}")  # (batch_size, seq_len, d_model)
```

---

## 实战案例：长文档问答系统

### 场景

基于 100 页的技术文档，回答用户的问题。

### 实现步骤

**步骤 1：文档分块**

```python
def split_document(document, chunk_size=1024, overlap=256):
    """
    文档分块

    Args:
        document: 完整文档（字符串）
        chunk_size: 每块大小（token 数）
        overlap: 块之间的重叠
    """
    # 简单实现（实际应该按语义边界分块）
    tokens = document.split()  # 简化：按空格分词

    chunks = []
    start = 0
    while start < len(tokens):
        end = start + chunk_size
        chunk = " ".join(tokens[start:end])
        chunks.append(chunk)
        start = end - overlap

    return chunks
```

**步骤 2：向量检索**

```python
def retrieve_relevant_chunks(query, document_chunks, retriever, k=5):
    """
    检索相关文档块

    Args:
        query: 用户查询
        document_chunks: 文档块列表
        retriever: 检索器
        k: 返回的块数量
    """
    # 检索相关块
    relevant_chunks = retriever.retrieve(query, document_chunks, k=k)

    return relevant_chunks
```

**步骤 3：生成回答**

```python
def generate_answer(query, relevant_chunks, model, tokenizer):
    """
    生成回答

    Args:
        query: 用户查询
        relevant_chunks: 相关文档块
        model: 长上下文 Transformer
        tokenizer: 分词器
    """
    # 构建上下文
    context = "\n\n".join(relevant_chunks)

    # 构建 prompt
    prompt = f"""
    基于以下文档回答问题：

    {context}

    问题：{query}

    回答：
    """

    # Tokenize
    inputs = tokenizer(prompt, return_tensors="pt", truncation=True, max_length=8192)

    # 生成
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=512,
            temperature=0.7,
            top_p=0.9
        )

    # 解码
    answer = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return answer
```

---

## 总结

### 长上下文技术的未来

1. **更长的上下文**：从 1M 到 10M tokens
2. **更高效的算法**：降低计算复杂度到 O(n log n)
3. **更好的位置编码**：支持更长的外推
4. **混合架构**：结合多种技术的优势

### 关键要点

- **长上下文不是简单调参**：涉及模型架构、训练技术、推理优化的系统性突破
- **没有银弹**：不同场景需要不同技术方案
- **权衡是关键**：在计算成本、内存占用、模型质量之间找到平衡

### 互动引导

- "你在实际项目中遇到过长上下文的问题吗？评论区分享一下你的解决方案"
- "想深入学习更多 AIGC 原理？关注我的专栏《AIGC 核心原理解析》"

---

**标签建议**: #长上下文 #Transformer #大模型 #AIGC #Claude3 #GPT-4
