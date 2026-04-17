# Transformer 原理深度解析：附完整源码推导

**阅读时长**：12 分钟
**难度**：⭐⭐⭐⭐（进阶）
**适用人群**：深度学习研究者、NLP 工程师、想理解 Transformer 的开发者

---

## 核心结论（先看结论）

Transformer 不是黑盒，它的每个设计都有深刻的数学直觉。

三大创新点让它统治了 NLP：
1. **自注意力机制**：让模型学会"关注什么"，而不是"怎么关注"
2. **位置编码**：解决了并行处理无法感知序列顺序的问题
3. **编码器-解码器架构**：通过残差连接和层归一化实现深度堆叠

看完这篇文章，你会真正理解：
- 自注意力机制的数学原理和代码实现
- 为什么用 √d_k 归一化（不是随便除的）
- 残差连接为什么有效（不是简单的 x + F(x)）
- 如何从零实现一个完整的 Transformer

---

## 一、自注意力机制的数学直觉

### 1.1 为什么需要注意力？

假设我们翻译这句话：

```
The animal didn't cross the street because it was too tired.
```

"it" 指的是什么？是 "animal" 还是 "street"？

人类直觉：it = animal（因为动物会累）

传统模型（RNN）：只能通过时间步传递信息，远距离依赖关系很难捕获

注意力机制：让模型直接"看到"所有词，并计算它们之间的关联度

### 1.2 自注意力公式推导

**标准公式**：
```
Attention(Q, K, V) = softmax(QK^T / √d_k)V
```

**为什么是 Q、K、V？**

类比搜索引擎：
- **Query（查询）**：用户输入的搜索词
- **Key（键）**：文档的关键词
- **Value（值）**：文档的内容

Q 和 K 计算"匹配度"，然后用这个匹配度加权 V

**代码实现**（PyTorch）：
```python
import torch
import torch.nn.functional as F
import math

def scaled_dot_product_attention(Q, K, V, mask=None):
    """
    Q: (batch_size, n_heads, seq_len, d_k)
    K: (batch_size, n_heads, seq_len, d_k)
    V: (batch_size, n_heads, seq_len, d_k)
    mask: (batch_size, 1, 1, seq_len) 或 (batch_size, 1, seq_len, seq_len)
    """
    d_k = Q.size(-1)

    # 1. 计算 QK^T（匹配度矩阵）
    # scores: (batch_size, n_heads, seq_len, seq_len)
    scores = torch.matmul(Q, K.transpose(-2, -1))

    # 2. 除以 √d_k（防止点积过大）
    scores = scores / math.sqrt(d_k)

    # 3. 应用 mask（可选，用于解码器）
    if mask is not None:
        scores = scores.masked_fill(mask == 0, -1e9)

    # 4. Softmax 归一化
    # attn_weights: (batch_size, n_heads, seq_len, seq_len)
    attn_weights = F.softmax(scores, dim=-1)

    # 5. 加权求和
    # output: (batch_size, n_heads, seq_len, d_k)
    output = torch.matmul(attn_weights, V)

    return output, attn_weights
```

### 1.3 为什么要除以 √d_k？

**问题**：当 d_k 很大时，QK^T 的点积值会变得很大

**数学证明**：
- 假设 Q 和 K 的分量都是均值为 0、方差为 1 的独立同分布随机变量
- 点积 Q · K 的期望：E[Q · K] = 0
- 点积 Q · K 的方差：Var(Q · K) = d_k

**为什么大点积不好？**
- 当点积值很大时，softmax 会进入"饱和区"
- 梯度会变得非常小，导致训练困难（梯度消失）

**解决方案**：
- 除以 √d_k，使点积的方差回到 1
- 数学直觉：标准差归一化

```python
# 对比实验：不除以 √d_k vs 除以 √d_k
d_k = 64
Q = torch.randn(1, 1, 10, d_k)
K = torch.randn(1, 1, 10, d_k)

# 不归一化
scores_no_scale = torch.matmul(Q, K.transpose(-2, -1))
print(f"不归一化 - 最大值: {scores_no_scale.max():.2f}, 最小值: {scores_no_scale.min():.2f}")

# 归一化
scores_scaled = scores_no_scale / math.sqrt(d_k)
print(f"归一化后 - 最大值: {scores_scaled.max():.2f}, 最小值: {scores_scaled.min():.2f}")
```

### 1.4 多头注意力：为什么需要多个头？

**单头注意力的问题**：无法同时捕捉多种关系

例子："The cat sat on the mat"
- 关系1：cat ↔ mat（位置关系）
- 关系2：sat ↔ cat（动作关系）
- 单个注意力头难以同时捕捉这些关系

**多头注意力方案**：
- 并行计算多个注意力头，每个头学习不同的特征
- 最后拼接所有头的输出

**代码实现**：
```python
class MultiHeadAttention(nn.Module):
    def __init__(self, d_model, n_heads, dropout=0.1):
        super().__init__()
        assert d_model % n_heads == 0, "d_model 必须能被 n_heads 整除"

        self.d_model = d_model
        self.n_heads = n_heads
        self.d_k = d_model // n_heads

        # Q、K、V 的线性变换
        self.W_q = nn.Linear(d_model, d_model)
        self.W_k = nn.Linear(d_model, d_model)
        self.W_v = nn.Linear(d_model, d_model)
        self.W_o = nn.Linear(d_model, d_model)

        self.dropout = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        """
        x: (batch_size, seq_len, d_model)
        """
        batch_size = x.size(0)

        # 1. 线性变换
        # Q, K, V: (batch_size, seq_len, d_model)
        Q = self.W_q(x)
        K = self.W_k(x)
        V = self.W_v(x)

        # 2. 分头 (split into heads)
        # 输出: (batch_size, n_heads, seq_len, d_k)
        Q = Q.view(batch_size, -1, self.n_heads, self.d_k).transpose(1, 2)
        K = K.view(batch_size, -1, self.n_heads, self.d_k).transpose(1, 2)
        V = V.view(batch_size, -1, self.n_heads, self.d_k).transpose(1, 2)

        # 3. 计算注意力
        # attn_output: (batch_size, n_heads, seq_len, d_k)
        # attn_weights: (batch_size, n_heads, seq_len, seq_len)
        attn_output, attn_weights = scaled_dot_product_attention(Q, K, V, mask)

        # 4. 拼接头 (concatenate heads)
        # 输出: (batch_size, seq_len, d_model)
        attn_output = attn_output.transpose(1, 2).contiguous().view(batch_size, -1, self.d_model)

        # 5. 最终线性变换
        output = self.W_o(attn_output)

        return output, attn_weights
```

**可视化注意力头**：
```python
# 假设我们有 8 个注意力头，每个头关注不同的关系
n_heads = 8
attention_maps = torch.randn(n_heads, seq_len, seq_len)

# 头1: 关注相邻词（局部关系）
head1 = attention_maps[0]
# 头2: 关注远距离依赖（长距离关系）
head2 = attention_maps[1]
# 头3: 关注标点符号
head3 = attention_maps[2]
# ...
```

---

## 二、位置编码：并行处理的代价

### 2.1 为什么需要位置编码？

**问题**：Transformer 是并行处理所有词的，没有"顺序"概念

例子："我 爱 你" vs "你 爱 我"
- 对 Transformer 来说，这两个序列完全一样（都是 [我, 爱, 你]）
- 但语义完全不同

**解决方案**：给每个位置添加一个位置向量

### 2.2 为什么不用简单的 1, 2, 3...？

**问题1**：数值无限增长
- 如果序列长度 = 1000，位置编码 = 1000
- 与词向量相加后，数值会很大

**问题2**：无法泛化到训练时没见过的长度
- 训练时最大长度 = 100
- 测试时长度 = 120，位置编码 = 120（没见过）

### 2.3 Sinusoidal 位置编码（原始方案）

**公式**：
```
PE(pos, 2i) = sin(pos / 10000^(2i/d_model))
PE(pos, 2i+1) = cos(pos / 10000^(2i/d_model))
```

**为什么用 sin/cos？**
1. 有限性：sin/cos 值域是 [-1, 1]
2. 周期性：可以捕捉相对位置信息
3. 泛化性：可以泛化到任意长度

**代码实现**：
```python
class PositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=5000, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)

        # 创建位置编码矩阵
        pe = torch.zeros(max_len, d_model)
        position = torch.arange(0, max_len, dtype=torch.float).unsqueeze(1)

        # 计算除数项
        div_term = torch.exp(torch.arange(0, d_model, 2).float() *
                            (-math.log(10000.0) / d_model))

        # 填充 sin 和 cos
        pe[:, 0::2] = torch.sin(position * div_term)  # 偶数维度
        pe[:, 1::2] = torch.cos(position * div_term)  # 奇数维度

        # 添加 batch 维度: (1, max_len, d_model)
        pe = pe.unsqueeze(0)

        # 注册为 buffer（不是模型参数，但会随模型一起保存）
        self.register_buffer('pe', pe)

    def forward(self, x):
        """
        x: (batch_size, seq_len, d_model)
        """
        # 截取对应长度的位置编码并相加
        x = x + self.pe[:, :x.size(1), :]
        return self.dropout(x)
```

**可视化位置编码**：
```python
import matplotlib.pyplot as plt

# 假设 d_model = 512, seq_len = 100
pe = PositionalEncoding(d_model=512, max_len=100, dropout=0)
plt.figure(figsize=(12, 4))
plt.imshow(pe.pe[0], aspect='auto', cmap='viridis')
plt.xlabel('Dimension')
plt.ylabel('Position')
plt.title('Positional Encoding (Sinusoidal)')
plt.colorbar()
plt.show()
```

你会看到：
- 前几个维度：变化缓慢（捕捉长距离依赖）
- 后几个维度：变化快速（捕捉短距离依赖）
- 这种"多尺度"设计类似于傅里叶变换

### 2.4 RoPE（Rotary Position Embedding）：现代方案

**问题**：Sinusoidal 编码在长序列上效果下降

**RoPE 核心思想**：通过旋转矩阵引入位置信息

**数学原理**：
- 将 Q 和 K 旋转一个角度（与位置相关）
- 旋转后，Q 和 K 的点积天然包含相对位置信息

**代码实现**：
```python
class RotaryEmbedding(nn.Module):
    def __init__(self, d_model, max_len=5000):
        super().__init__()
        self.d_model = d_model

        # 计算旋转角度
        inv_freq = 1.0 / (10000 ** (torch.arange(0, d_model, 2).float() / d_model))
        self.register_buffer('inv_freq', inv_freq)

    def forward(self, x, seq_len):
        """
        x: (batch_size, n_heads, seq_len, d_k)
        """
        # 生成旋转矩阵
        t = torch.arange(seq_len, device=x.device).type_as(self.inv_freq)
        freqs = torch.outer(t, self.inv_freq)
        emb = torch.cat((freqs, freqs), dim=-1)

        # 应用旋转
        cos = emb.cos().unsqueeze(1).unsqueeze(1)  # (1, 1, seq_len, d_model)
        sin = emb.sin().unsqueeze(1).unsqueeze(1)

        # 旋转 Q 和 K
        x_rotated = rotate_half(x) * sin + x * cos
        return x_rotated

def rotate_half(x):
    """将张量旋转一半维度"""
    x1, x2 = x[..., :x.size(-1)//2], x[..., x.size(-1)//2:]
    return torch.cat((-x2, x1), dim=-1)
```

**RoPE 的优势**：
- 相对位置编码：天然支持相对位置
- 长度外推：可以泛化到更长的序列
- 高效：计算开销小

---

## 三、完整 Transformer 架构

### 3.1 编码器-解码器结构

**编码器（Encoder）**：
- 多层堆叠（N 层）
- 每层包含：
  1. 多头自注意力
  2. 前馈神经网络（FFN）
  3. 残差连接 + 层归一化（每个子层后都有）

**解码器（Decoder）**：
- 多层堆叠（N 层）
- 每层包含：
  1. 带掩码的多头自注意力（只能看到过去的信息）
  2. 交叉注意力（查询来自解码器，键和值来自编码器）
  3. 前馈神经网络（FFN）
  4. 残差连接 + 层归一化（每个子层后都有）

**代码实现**：
```python
class EncoderLayer(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.ffn = FeedForwardNetwork(d_model, d_ff, dropout)

        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)

    def forward(self, x, mask=None):
        """
        x: (batch_size, seq_len, d_model)
        mask: (batch_size, 1, 1, seq_len) 或 (batch_size, 1, seq_len, seq_len)
        """
        # 自注意力 + 残差 + 归一化
        attn_output, _ = self.self_attn(x, mask)
        x = self.norm1(x + self.dropout1(attn_output))

        # FFN + 残差 + 归一化
        ffn_output = self.ffn(x)
        x = self.norm2(x + self.dropout2(ffn_output))

        return x

class DecoderLayer(nn.Module):
    def __init__(self, d_model, n_heads, d_ff, dropout=0.1):
        super().__init__()
        self.self_attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.cross_attn = MultiHeadAttention(d_model, n_heads, dropout)
        self.ffn = FeedForwardNetwork(d_model, d_ff, dropout)

        self.norm1 = nn.LayerNorm(d_model)
        self.norm2 = nn.LayerNorm(d_model)
        self.norm3 = nn.LayerNorm(d_model)
        self.dropout1 = nn.Dropout(dropout)
        self.dropout2 = nn.Dropout(dropout)
        self.dropout3 = nn.Dropout(dropout)

    def forward(self, x, enc_output, self_mask=None, cross_mask=None):
        """
        x: (batch_size, seq_len, d_model)
        enc_output: (batch_size, enc_seq_len, d_model)
        self_mask: (batch_size, 1, seq_len, seq_len) - 自注意力掩码
        cross_mask: (batch_size, 1, 1, enc_seq_len) - 交叉注意力掩码
        """
        # 带掩码的自注意力 + 残差 + 归一化
        attn_output, _ = self.self_attn(x, self_mask)
        x = self.norm1(x + self.dropout1(attn_output))

        # 交叉注意力 + 残差 + 归一化
        attn_output, _ = self.cross_attn(x, enc_output, cross_mask)
        x = self.norm2(x + self.dropout2(attn_output))

        # FFN + 残残 + 归一化
        ffn_output = self.ffn(x)
        x = self.norm3(x + self.dropout3(ffn_output))

        return x

class FeedForwardNetwork(nn.Module):
    def __init__(self, d_model, d_ff, dropout=0.1):
        super().__init__()
        self.linear1 = nn.Linear(d_model, d_ff)
        self.dropout = nn.Dropout(dropout)
        self.linear2 = nn.Linear(d_ff, d_model)

    def forward(self, x):
        # 升维 → 非线性 → 降维
        return self.linear2(self.dropout(F.relu(self.linear1(x))))
```

### 3.2 残差连接：深度学习的加速器

**公式**：
```
Output = LayerNorm(x + SubLayer(x))
```

**为什么有效？**

**数学直觉**：
- 假设最优解是 f(x) = x
- 如果没有残差连接，网络需要学习 f(x) = x
- 有残差连接，网络只需要学习 f(x) = 0（更简单）

**梯度流**：
- 反向传播时，梯度可以通过"恒等映射"直接传递
- 解决了梯度消失/爆炸问题

**代码验证**：
```python
# 对比：有残差连接 vs 无残差连接
class ModelWithResidual(nn.Module):
    def forward(self, x):
        return self.layer(x) + x  # 残差连接

class ModelWithoutResidual(nn.Module):
    def forward(self, x):
        return self.layer(x)  # 无残差连接

# 训练 100 层网络
# 有残差：收敛快，损失曲线平滑
# 无残差：收敛慢，损失曲线震荡
```

### 3.3 层归一化 vs 批归一化

**为什么用层归一化？**

**批归一化的问题**：
- 依赖 batch size
- 小 batch 时统计量不稳定
- 序列建模时，不同长度的序列无法直接归一化

**层归一化的优势**：
- 对每个样本独立归一化
- 不依赖 batch size
- 更适合序列建模

**代码对比**：
```python
# 批归一化
bn = nn.BatchNorm1d(d_model)  # 依赖 batch 统计量

# 层归一化
ln = nn.LayerNorm(d_model)  # 对每个样本独立归一化
```

---

## 四、从零实现完整 Transformer

### 4.1 完整代码

```python
import torch
import torch.nn as nn
import torch.nn.functional as F
import math

class Transformer(nn.Module):
    def __init__(self,
                 src_vocab_size,
                 tgt_vocab_size,
                 d_model=512,
                 n_heads=8,
                 n_encoder_layers=6,
                 n_decoder_layers=6,
                 d_ff=2048,
                 dropout=0.1,
                 max_len=5000):
        super().__init__()

        self.d_model = d_model

        # 词嵌入
        self.src_embedding = nn.Embedding(src_vocab_size, d_model)
        self.tgt_embedding = nn.Embedding(tgt_vocab_size, d_model)

        # 位置编码
        self.pos_encoding = PositionalEncoding(d_model, max_len, dropout)

        # 编码器和解码器
        self.encoder_layers = nn.ModuleList([
            EncoderLayer(d_model, n_heads, d_ff, dropout)
            for _ in range(n_encoder_layers)
        ])
        self.decoder_layers = nn.ModuleList([
            DecoderLayer(d_model, n_heads, d_ff, dropout)
            for _ in range(n_decoder_layers)
        ])

        # 输出层
        self.fc_out = nn.Linear(d_model, tgt_vocab_size)

        self.dropout = nn.Dropout(dropout)

    def create_masks(self, src, tgt):
        """
        src: (batch_size, src_len)
        tgt: (batch_size, tgt_len)
        """
        # 源掩码（padding 掩码）
        src_mask = (src != 0).unsqueeze(1).unsqueeze(2)  # (batch_size, 1, 1, src_len)

        # 目标掩码（padding 掩码 + causal 掩码）
        tgt_pad_mask = (tgt != 0).unsqueeze(1).unsqueeze(3)  # (batch_size, 1, tgt_len, 1)
        tgt_len = tgt.size(1)
        tgt_sub_mask = torch.tril(torch.ones(tgt_len, tgt_len,
                                           device=tgt.device)).bool()  # (tgt_len, tgt_len)
        tgt_mask = tgt_pad_mask & tgt_sub_mask  # (batch_size, 1, tgt_len, tgt_len)

        return src_mask, tgt_mask

    def encode(self, src, src_mask):
        """
        src: (batch_size, src_len)
        """
        # 词嵌入 + 位置编码
        src = self.dropout(self.pos_encoding(self.src_embedding(src)))

        # 通过所有编码器层
        for layer in self.encoder_layers:
            src = layer(src, src_mask)

        return src

    def decode(self, tgt, enc_output, tgt_mask, src_mask):
        """
        tgt: (batch_size, tgt_len)
        enc_output: (batch_size, src_len, d_model)
        """
        # 词嵌入 + 位置编码
        tgt = self.dropout(self.pos_encoding(self.tgt_embedding(tgt)))

        # 通过所有解码器层
        for layer in self.decoder_layers:
            tgt = layer(tgt, enc_output, tgt_mask, src_mask)

        return tgt

    def forward(self, src, tgt):
        """
        src: (batch_size, src_len)
        tgt: (batch_size, tgt_len)
        """
        # 创建掩码
        src_mask, tgt_mask = self.create_masks(src, tgt)

        # 编码
        enc_output = self.encode(src, src_mask)

        # 解码
        dec_output = self.decode(tgt, enc_output, tgt_mask, src_mask)

        # 输出层
        output = self.fc_out(dec_output)

        return output
```

### 4.2 训练示例

```python
# 模型初始化
model = Transformer(
    src_vocab_size=10000,
    tgt_vocab_size=10000,
    d_model=512,
    n_heads=8,
    n_encoder_layers=6,
    n_decoder_layers=6,
    d_ff=2048,
    dropout=0.1
)

# 优化器和损失函数
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001, betas=(0.9, 0.98), eps=1e-9)
criterion = nn.CrossEntropyLoss(ignore_index=0)  # 忽略 padding

# 训练循环
for epoch in range(100):
    model.train()
    total_loss = 0

    for batch in dataloader:
        src, tgt = batch

        # 移动到 GPU
        src = src.to(device)
        tgt = tgt.to(device)

        # 前向传播
        output = model(src, tgt[:, :-1])  # 去掉最后一个 token

        # 计算损失
        loss = criterion(output.reshape(-1, output.size(-1)),
                         tgt[:, 1:].reshape(-1))  # 去掉第一个 token (BOS)

        # 反向传播
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()

    print(f"Epoch {epoch}, Loss: {total_loss / len(dataloader):.4f}")
```

### 4.3 推理示例

```python
def greedy_decode(model, src, src_mask, max_len, start_symbol):
    """
    src: (1, src_len)
    src_mask: (1, 1, 1, src_len)
    """
    model.eval()
    memory = model.encode(src, src_mask)

    ys = torch.ones(1, 1).fill_(start_symbol).type_as(src).to(device)

    for i in range(max_len - 1):
        # 创建掩码
        tgt_mask = model.create_masks(ys, ys)[1]

        # 解码
        out = model.decode(ys, memory, tgt_mask, src_mask)

        # 取最后一个 token
        prob = model.fc_out(out[:, -1])
        _, next_word = torch.max(prob, dim=1)
        next_word = next_word.item()

        # 添加到序列
        ys = torch.cat([ys, torch.ones(1, 1).type_as(src).fill_(next_word).to(device)], dim=1)

        # 如果遇到结束符，停止
        if next_word == EOS_TOKEN:
            break

    return ys

# 推理
src = torch.LongTensor([BOS_TOKEN] + src_ids + [EOS_TOKEN]).unsqueeze(0).to(device)
src_mask = (src != 0).unsqueeze(1).unsqueeze(2)
output = greedy_decode(model, src, src_mask, max_len=100, start_symbol=BOS_TOKEN)
```

---

## 五、延伸思考

### 5.1 Transformer 的成功不是某个单一创新，而是精妙的组合

- 自注意力：捕获长距离依赖
- 位置编码：感知序列顺序
- 残差连接：实现深度堆叠
- 层归一化：稳定训练过程

每个组件单独看都不复杂，但组合在一起就产生了"涌现"能力

### 5.2 自注意力机制的本质是让模型学会"关注什么"

- Q：我想找什么
- K：你有什么
- V：你的内容是什么

这种"查询-匹配-检索"的直觉，在信息检索、推荐系统等领域都有广泛应用

### 5.3 位置编码的设计体现了"简单即美"的原则

- 不需要复杂的 RNN/LSTM
- 不需要复杂的卷积操作
- 只需要简单的 sin/cos 函数

**但**：RoPE 的流行说明，"简单"不等于"最优"，持续优化是必要的

### 5.4 残差连接是深度学习的通用加速器

- 不只是 Transformer
- ResNet、DenseNet、EfficientNet 都在使用
- 原理一致：梯度流 + 恒等映射

---

## 六、实战应用：文本分类

让我们用 Transformer 做一个简单的文本分类任务

### 6.1 数据准备

```python
from transformers import AutoTokenizer
from torch.utils.data import Dataset, DataLoader

class TextClassificationDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_len=128):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_len = max_len

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]

        encoding = self.tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=self.max_len,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=False,
            return_tensors='pt'
        )

        return {
            'input_ids': encoding['input_ids'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

# 示例数据
texts = [
    "I love this movie, it's amazing!",
    "This movie is terrible, I hate it.",
    "Great film, highly recommended.",
    "Worst movie ever, don't watch it."
]
labels = [1, 0, 1, 0]  # 1: positive, 0: negative

tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
dataset = TextClassificationDataset(texts, labels, tokenizer)
dataloader = DataLoader(dataset, batch_size=2, shuffle=True)
```

### 6.2 模型定义

```python
class TransformerClassifier(nn.Module):
    def __init__(self, vocab_size, num_classes, d_model=512, n_heads=8, n_layers=6, d_ff=2048):
        super().__init__()

        self.embedding = nn.Embedding(vocab_size, d_model)
        self.pos_encoding = PositionalEncoding(d_model, max_len=128)

        self.encoder_layers = nn.ModuleList([
            EncoderLayer(d_model, n_heads, d_ff)
            for _ in range(n_layers)
        ])

        self.fc = nn.Linear(d_model, num_classes)
        self.dropout = nn.Dropout(0.1)

    def forward(self, x):
        """
        x: (batch_size, seq_len)
        """
        # 嵌入 + 位置编码
        x = self.dropout(self.pos_encoding(self.embedding(x)))

        # 编码器
        for layer in self.encoder_layers:
            x = layer(x)

        # 取第一个 token (CLS) 的表示
        x = x[:, 0, :]

        # 分类
        output = self.fc(x)

        return output

model = TransformerClassifier(vocab_size=tokenizer.vocab_size, num_classes=2)
```

### 6.3 训练和评估

```python
optimizer = torch.optim.Adam(model.parameters(), lr=0.0001)
criterion = nn.CrossEntropyLoss()

# 训练
model.train()
for epoch in range(10):
    for batch in dataloader:
        input_ids = batch['input_ids']
        labels = batch['labels']

        output = model(input_ids)
        loss = criterion(output, labels)

        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    print(f"Epoch {epoch}, Loss: {loss.item():.4f}")

# 评估
model.eval()
with torch.no_grad():
    test_texts = ["This is a great movie!", "I hate this film."]
    for text in test_texts:
        encoding = tokenizer.encode_plus(
            text,
            add_special_tokens=True,
            max_length=128,
            return_token_type_ids=False,
            padding='max_length',
            truncation=True,
            return_attention_mask=False,
            return_tensors='pt'
        )
        output = model(encoding['input_ids'])
        prediction = torch.argmax(output, dim=1).item()
        print(f"Text: {text}, Prediction: {'Positive' if prediction == 1 else 'Negative'}")
```

---

## 七、总结

### 7.1 Transformer 的核心要点

1. **自注意力机制**：让模型学会关注重要的部分
2. **多头注意力**：同时捕捉多种关系
3. **位置编码**：解决并行处理无法感知顺序的问题
4. **残差连接**：实现深度堆叠，解决梯度消失
5. **层归一化**：稳定训练过程

### 7.2 为什么 Transformer 这么成功？

- **并行化**：相比 RNN/LSTM，可以并行计算，训练速度快
- **长距离依赖**：自注意力机制可以直接捕获任意距离的依赖
- **通用性**：不只是 NLP，在计算机视觉、语音识别等领域都取得了成功

### 7.3 未来方向

- **更长序列**：Longformer、BigBird、Linformer
- **更高效训练**：Flash Attention、Ring Attention
- **更大模型**：GPT-4、Claude 3、DeepSeek
- **多模态**：CLIP、DALL-E、Sora

---

## 互动与讨论

**你理解了自注意力机制的数学直觉吗？**

- Q、K、V 的设计有什么启发？
- 为什么要除以 √d_k？
- 残差连接为什么有效？

**评论区告诉我你的理解，我们一起讨论！**

---

**想深入学习更多 AIGC 原理？关注我的专栏《AIGC 核心原理解析》**

下一篇预告：Diffusion 模型从零开始（数学推导 + 代码实现）

---

**标签**：#Transformer #深度学习 #NLP #AIGC #原理解析

---

**点赞、收藏、转发**，让更多人理解 Transformer 的本质！
