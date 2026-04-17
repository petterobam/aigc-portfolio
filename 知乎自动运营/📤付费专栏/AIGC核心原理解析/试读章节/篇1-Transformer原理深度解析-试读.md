# 篇1：Transformer 原理深度解析：附完整源码推导

> **试读章节**（约 5,000 字，全文 21,303 字）
> 
> 完整版请订阅《AIGC 核心原理解析》专栏

---

## 前言

Transformer 是现代大语言模型（如 GPT、BERT、T5）的基石。自 2017 年 Google 提出《Attention Is All You Need》以来，Transformer 彻底改变了自然语言处理（NLP）和生成式 AI 的格局。

本篇文章将系统讲解 Transformer 的核心原理，从自注意力机制的数学本质到完整的 PyTorch 代码实现，帮助你深入理解这一革命性架构。

**学习目标**：
- 理解自注意力机制的数学原理
- 掌握多头注意力和位置编码
- 能够从零实现 Transformer 架构
- 理解 Transformer 训练和推理的关键技巧

---

## 1. Transformer 诞生背景

在 Transformer 出现之前，NLP 领域的主流架构是 RNN（循环神经网络）和 LSTM（长短期记忆网络）。这些架构虽然能够处理序列数据，但存在以下问题：

### 1.1 序列计算的局限性

RNN 和 LSTM 的核心问题是**序列依赖**：计算时刻 t 的隐藏状态必须等待时刻 t-1 的计算完成。这导致：

- **无法并行化**：训练速度慢
- **长距离依赖问题**：信息在长序列中容易丢失
- **梯度消失/爆炸**：训练不稳定

### 1.2 自回归 vs 自编码

- **自回归模型**（如 GPT）：每次预测一个 token，速度慢
- **自编码模型**（如 BERT）：双向上下文，但无法用于生成

### 1.3 Transformer 的突破

Transformer 通过**自注意力机制**和**位置编码**解决了上述问题：

- **并行计算**：所有 token 的计算可以同时进行
- **长距离依赖**：任意两个 token 之间的距离都是 1
- **双向上下文**：同时利用过去和未来的信息

---

## 2. 自注意力机制详解

### 2.1 核心思想

自注意力（Self-Attention）的核心思想是：**序列中的每个元素都与所有其他元素计算相关性，从而得到全局上下文信息**。

### 2.2 Q、K、V 的计算

首先，对于输入序列 `X = [x_1, x_2, ..., x_n]`（其中 `x_i` 是 token 的 embedding），通过三个线性变换得到 Query（Q）、Key（K）、Value（V）：

```
Q = X * W_Q  # Query
K = X * W_K  # Key
V = X * W_V  # Value
```

其中 `W_Q`、`W_K`、`W_V` 是可学习的权重矩阵。

### 2.3 注意力权重计算

对于每个位置的 `q_i`，计算它与所有 `k_j` 的相似度：

```
score(q_i, k_j) = q_i * k_j^T / sqrt(d_k)
```

其中 `d_k` 是 K 的维度，除以 `sqrt(d_k)` 是为了防止梯度消失。

然后通过 Softmax 归一化得到注意力权重：

```
attention_weights_i = softmax(score(q_i, k_j) for all j)
```

### 2.4 加权求和

最后，用注意力权重对 V 进行加权求和：

```
output_i = sum(attention_weights_ij * v_j for all j)
```

### 2.5 完整自注意力计算

将上述过程用矩阵表示：

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class SelfAttention(nn.Module):
    def __init__(self, d_model, n_heads):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        
    def forward(self, x, mask=None):
        """
        Args:
            x: [batch_size, seq_len, d_model]
            mask: [batch_size, seq_len, seq_len] (optional)
        Returns:
            output: [batch_size, seq_len, d_model]
        """
        batch_size, seq_len, _ = x.shape
        
        # 计算 Q, K, V
        Q = self.W_q(x)  # [batch_size, seq_len, d_model]
        K = self.W_k(x)  # [batch_size, seq_len, d_model]
        V = self.W_v(x)  # [batch_size, seq_len, d_model]
        
        # 多头注意力：reshape 为 [batch_size, n_heads, seq_len, d_k]
        Q = Q.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        
        # 计算注意力分数
        scores = torch.matmul(Q, K.transpose(-2, -1)) / torch.sqrt(torch.tensor(self.d_k, dtype=torch.float32))
        
        # 应用 mask（如果有）
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Softmax 归一化
        attention_weights = F.softmax(scores, dim=-1)
        
        # 加权求和
        output = torch.matmul(attention_weights, V)  # [batch_size, n_heads, seq_len, d_k]
        
        # 合并多头
        output = output.transpose(1, 2).contiguous().view(batch_size, seq_len, -1)
        
        return output
```

---

## 3. 多头注意力

### 3.1 为什么需要多头？

单头注意力只能关注一种模式。多头注意力通过并行计算多个注意力，每个头关注不同的子空间，从而捕获更丰富的信息。

### 3.2 多头注意力计算

多头注意力的计算步骤：

1. 将 Q、K、V 分割成 h 个头
2. 对每个头独立计算自注意力
3. 将所有头的输出拼接
4. 通过线性变换得到最终输出

```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads
        
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)
        
        self.dropout = nn.Dropout(dropout)
        
    def forward(self, x, mask=None):
        batch_size, seq_len, _ = x.shape
        
        # 计算 Q, K, V
        Q = self.W_q(x)
        K = self.W_k(x)
        V = self.W_v(x)
        
        # 多头注意力：reshape 为 [batch_size, n_heads, seq_len, d_k]
        Q = Q.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, seq_len, self.n_heads, self.d_k).transpose(1, 2)
        
        # 计算注意力分数
        scores = torch.matmul(Q, K.transpose(-2, -1)) / torch.sqrt(torch.tensor(self.d_k, dtype=torch.float32))
        
        # 应用 mask
        if mask is not None:
            scores = scores.masked_fill(mask == 0, -1e9)
        
        # Softmax 归一化
        attention_weights = F.softmax(scores, dim=-1)
        attention_weights = self.dropout(attention_weights)
        
        # 加权求和
        output = torch.matmul(attention_weights, V)
        
        # 合并多头
        output = output.transpose(1, 2).contiguous().view(batch_size, seq_len, -1)
        
        # 线性变换
        output = self.W_o(output)
        
        return output
```

---

## 4. 位置编码

### 4.1 为什么需要位置编码？

Transformer 中的自注意力机制本身不包含位置信息，无法区分 `"apple is red"` 和 `"red is apple"` 的区别。因此，需要显式地注入位置信息。

### 4.2 Sinusoidal 位置编码

原始 Transformer 使用 Sinusoidal 位置编码：

```
PE(pos, 2i)   = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

其中 `pos` 是位置，`i` 是维度索引。

**优点**：
- 可以处理任意长度的序列
- 不同位置的位置编码有相对位置关系

**缺点**：
- 在长序列中，位置信息的表达能力有限

### 4.3 RoPE 旋转位置编码

RoPE（Rotary Position Embedding）通过旋转向量的方式注入位置信息，目前在 LLaMA、PaLM 等大模型中被广泛使用。

```python
class RotaryPositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        self.d_model = d_model
        
        # 计算旋转角度
        position = torch.arange(max_len).unsqueeze(1)
        div_term = torch.exp(torch.arange(0, d_model, 2) * (-math.log(10000.0) / d_model))
        pe = torch.zeros(max_len, d_model)
        pe[:, 0::2] = torch.sin(position * div_term)
        pe[:, 1::2] = torch.cos(position * div_term)
        self.register_buffer('pe', pe)
    
    def forward(self, x):
        """
        Args:
            x: [batch_size, seq_len, d_model]
        Returns:
            x_rotated: [batch_size, seq_len, d_model]
        """
        seq_len = x.size(1)
        pe = self.pe[:seq_len, :]  # [seq_len, d_model]
        
        # 旋转操作
        x1 = x[..., 0::2]  # [batch_size, seq_len, d_model/2]
        x2 = x[..., 1::2]  # [batch_size, seq_len, d_model/2]
        
        pe1 = pe[:, 0::2]  # [seq_len, d_model/2]
        pe2 = pe[:, 1::2]  # [seq_len, d_model/2]
        
        # 旋转
        x_rot1 = x1 * pe1 - x2 * pe2
        x_rot2 = x1 * pe2 + x2 * pe1
        
        # 合并
        x_rotated = torch.zeros_like(x)
        x_rotated[..., 0::2] = x_rot1
        x_rotated[..., 1::2] = x_rot2
        
        return x_rotated
```

---

## 5. 前馈网络（FFN）

Transformer 的每个子层都包含一个前馈网络（Feed-Forward Network）：

```python
class PositionwiseFeedForward(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.w_1 = nn.Linear(d_model, d_ff)
        self.w_2 = nn.Linear(d_ff, d_model)
        self.dropout = nn.Dropout(dropdown)
        self.activation = nn.GELU()
    
    def forward(self, x):
        """
        Args:
            x: [batch_size, seq_len, d_model]
        Returns:
            output: [batch_size, seq_len, d_model]
        """
        # FFN(x) = GELU(x * W_1 + b_1) * W_2 + b_2
        output = self.w_2(self.dropout(self.activation(self.w_1(x))))
        return output
```

---

## 6. 层归一化与残差连接

Transformer 使用层归一化（Layer Normalization）和残差连接（Residual Connection）：

```python
class TransformerLayer(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.ffn = PositionwiseFeedForward(d_model, d_ff, dropout)
        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout = nn.Dropout(dropout)
    
    def forward(self, x, mask=None):
        """
        Args:
            x: [batch_size, seq_len, d_model]
            mask: [batch_size, seq_len, seq_len] (optional)
        Returns:
            output: [batch_size, seq_len, d_model]
        """
        # 自注意力 + 残差连接 + 层归一化
        attn_output = self.self_attn(x, mask)
        x = self.norm1(x + self.dropout(attn_output))
        
        # 前馈网络 + 残差连接 + 层归一化
        ffn_output = self.ffn(x)
        x = self.norm2(x + self.dropout(ffn_output))
        
        return x
```

---

## 7. 完整 Transformer 架构

```python
class Transformer(nn.Module):
    def __init__(self, vocab_size, d_model=512, n_heads=8, n_layers=6, d_ff=2048, max_len=512, dropout=0.1):
        super().__init__()
        self.d_model = d_model
        
        # Token embedding
        self.token_embedding = nn.Embedding(vocab_size, d_model)
        
        # 位置编码
        self.pos_encoding = RotaryPositionalEncoding(d_model, max_len)
        
        # Transformer 层
        self.layers = nn.ModuleList([
            TransformerLayer(d_model, n_heads, d_ff, dropout)
            for _ in range(n_layers)
        ])
        
        # 输出层
        self.dropout = nn.Dropout(dropout)
        self.output_layer = nn.Linear(d_model, vocab_size)
        
    def forward(self, x, mask=None):
        """
        Args:
            x: [batch_size, seq_len]
            mask: [batch_size, seq_len, seq_len] (optional)
        Returns:
            output: [batch_size, seq_len, vocab_size]
        """
        # Token embedding
        x = self.token_embedding(x) * math.sqrt(self.d_model)
        
        # 位置编码
        x = self.pos_encoding(x)
        x = self.dropout(x)
        
        # Transformer 层
        for layer in self.layers:
            x = layer(x, mask)
        
        # 输出层
        output = self.output_layer(x)
        
        return output
```

---

## 8. Transformer 训练技巧

### 8.1 学习率调度

Transformer 使用 Warmup + Cosine Annealing 学习率调度：

```python
def get_lr_scheduler(optimizer, d_model, warmup_steps, total_steps):
    """
    Args:
        optimizer: 优化器
        d_model: 模型维度
        warmup_steps: Warmup 步数
        total_steps: 总训练步数
    Returns:
        lr_scheduler: 学习率调度器
    """
    def lr_lambda(step):
        # Warmup
        if step < warmup_steps:
            return (step + 1) / warmup_steps
        # Cosine annealing
        progress = (step - warmup_steps) / (total_steps - warmup_steps)
        return 0.5 * (1 + math.cos(math.pi * progress))
    
    lr_scheduler = torch.optim.lr_scheduler.LambdaLR(
        optimizer,
        lr_lambda
    )
    
    return lr_scheduler
```

### 8.2 梯度裁剪

防止梯度爆炸：

```python
def train_step(model, batch, optimizer, clip_grad_norm=1.0):
    """
    Args:
        model: 模型
        batch: 训练批次
        optimizer: 优化器
        clip_grad_norm: 梯度裁剪阈值
    """
    # 前向传播
    output = model(batch.input_ids, batch.attention_mask)
    loss = compute_loss(output, batch.target_ids)
    
    # 反向传播
    optimizer.zero_grad()
    loss.backward()
    
    # 梯度裁剪
    torch.nn.utils.clip_grad_norm_(model.parameters(), clip_grad_norm)
    
    # 参数更新
    optimizer.step()
    
    return loss.item()
```

---

## 9. 实战案例

### 9.1 语言模型预训练

```python
# 数据准备
dataset = LanguageModelDataset(tokenizer, max_length=512)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)

# 模型初始化
model = Transformer(
    vocab_size=tokenizer.vocab_size,
    d_model=512,
    n_heads=8,
    n_layers=6,
    d_ff=2048,
    max_len=512,
    dropout=0.1
).cuda()

# 优化器和学习率调度
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=0.01)
lr_scheduler = get_lr_scheduler(optimizer, d_model=512, warmup_steps=10000, total_steps=100000)

# 训练循环
for epoch in range(num_epochs):
    model.train()
    for batch in dataloader:
        loss = train_step(model, batch, optimizer, clip_grad_norm=1.0)
        lr_scheduler.step()
        
        # 打印训练信息
        if step % 100 == 0:
            print(f"Epoch {epoch}, Step {step}, Loss: {loss:.4f}, LR: {lr_scheduler.get_last_lr()[0]:.6f}")
    
    # 验证
    model.eval()
    val_loss = validate(model, val_dataloader)
    print(f"Epoch {epoch}, Val Loss: {val_loss:.4f}")
```

---

## 10. 总结

本篇文章系统讲解了 Transformer 的核心原理：

1. **自注意力机制**：通过 Q、K、V 计算全局上下文信息
2. **多头注意力**：并行计算多个注意力，捕获不同子空间的信息
3. **位置编码**：Sinusoidal 和 RoPE 两种主流方案
4. **前馈网络、层归一化、残差连接**：Transformer 的关键组件
5. **完整代码实现**：从零构建 Transformer 架构
6. **训练技巧**：学习率调度、梯度裁剪等

### 下一步学习

- 篇2：自注意力机制深入：从多头注意力到 Flash Attention
- 篇3：位置编码全解：Sinusoidal、RoPE、ALiBi 等
- 篇4：Transformer 架构演进：GPT、BERT、T5 等

---

**完整版订阅链接**：[《AIGC 核心原理解析》专栏](#)  
（包含 20 篇深度技术文章，240,000+ 字，70+ 个代码示例）

---

**试读结束。完整版请订阅《AIGC 核心原理解析》专栏。**
