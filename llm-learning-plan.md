# 大模型算法渐进式学习计划

> 创建时间：2026-03-04
> 总时长：10 周（约 2.5 个月）
> 每天耗时：15-30 分钟

---

## 阶段1：大模型基础理解（第1-2周）

### 第1天：LLM 总体架构
- 大模型算法总体架构
- LLM 结构总图
- Decoder-Only vs MoE 架构

### 第2天：LLM 输入与输出
- LLM 输入层（文本→数值矩阵）
- LLM 输出层（隐藏状态→概率分布）
- TokenID 与词元映射

### 第3天：生成与解码过程
- LLM 生成与解码
- 贪婪搜索、波束搜索
- 采样策略（Top-K、Top-P）

### 第4天：LLM 训练流程
- 预训练 vs 后训练
- 自监督学习基础
- Loss 函数（交叉熵）

### 第5天：多模态模型基础
- VLM/MLLM/VLA 概念
- 多模态模型结构
- 图像编码与语言模型融合

---

## 阶段2：微调与对齐技术（第3-4周）

### 第6天：SFT 基础
- 微调技术分类
- 指令数据来源
- 数据拼接（Packing）

### 第7天：LoRA 技术
- LoRA 核心思想（低秩分解）
- LoRA 初始化策略
- 参数效率对比

### 第8天：其他微调方法
- Prefix-Tuning
- Adapter Tuning
- Prompt 微调

### 第9天：RLHF 基础
- RLHF 两阶段训练流程
- 奖励模型（RM）结构
- 奖励模型训练

### 第10天：PPO 算法
- PPO 与 TRPO
- PPO-Clip 原理
- KL 距离计算

### 第11-12天：DPO 直接偏好优化
- DPO vs RLHF 对比
- DPO 训练全景图
- β 参数影响

---

## 阶段3：免训练优化技术（第5周）

### 第13天：CoT 思维链
- CoT vs 传统问答
- Self-consistency CoT
- ToT、GoT 衍生技术

### 第14天：解码策略深入
- 多项式采样
- Top-K、Top-P 采样
- 对比搜索、投机解码

### 第15天：RAG 检索增强
- RAG 架构原理
- 向量检索基础
- RAG 优化策略

### 第16天：功能调用
- Function Calling 原理
- 工具使用框架
- Agent 基础

---

## 阶段4：强化学习基础（第6-7周）

### 第17-18天：RL 基础概念
- 三大机器学习范式
- 强化学习基础架构
- MDP（马尔可夫决策过程）
- 探索与利用

### 第19天：价值函数
- 回报、价值、奖励关系
- 价值函数 Qπ 与 Vπ
- 蒙特卡洛方法
- TD（时序差分）方法

### 第20天：DQN
- DQN 模型结构
- 高估问题
- Double DQN

### 第21-22天：策略梯度
- 策略梯度原理（图灵奖得主 Sutton）
- Actor-Critic 架构
- 优势函数（Advantage）
- GAE（广义优势估计）

### 第23天：PPO 与 GRPO
- PPO 演进过程
- PPO-Clip 详细解析
- PPO vs GRPO 对比

---

## 阶段5：高级主题（第8-9周）

### 第24-25天：RLHF 与 RLAIF
- 基于PPO的RLHF原理
- 四种模型协作
- RLAIF vs RLHF
- 宪法AI（Claude）

### 第26天：逻辑推理优化
- CoT 知识蒸馏
- ORM/PRM（结果/过程奖励模型）
- MCTS 搜索树
- BoN（Best-of-N）采样

### 第27-28天：性能优化
- ALiBi、RoPE 位置编码
- 量化（Quantization）
- 梯度累积与 Checkpoint
- MHA/GQA/MQA/MLA

### 第29天：架构优化
- SwiGLU 激活函数
- RMSNorm vs LayerNorm
- Pre-norm vs Post-norm
- 剪枝技术

---

## 阶段6：综合图谱（第10周）

### 第30天：强化学习算法图谱
- 查阅完整的 rl-algo-map.pdf
- 策略梯度全景图
- 算法分类与演进

### 第31-35天：最新模型研究
- 阅读 LLM-VLM 汇总
- 分析最新模型架构
- Qwen3.5、GLM-5、DeepSeek-V3 等最新技术

---

## 数据源

- 主仓库：`/Users/oyjie/.openclaw/workspace/LLM-RL-Visualized`
- 主要文档：
  - `README.md` - 100+ 原创架构图
  - `LLM-VLM-index (汇总).md` - 模型索引
  - `images_chinese/` - 中文架构图
  - `images_english/` - 英文架构图
  - `强化学习算法图谱.pdf` - RL 算法图谱
  - `策略梯度(Policy Gradient)-强化学习(PPO&GRPO等)之根基.pdf`
