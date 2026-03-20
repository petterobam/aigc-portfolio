# 学习大纲：35天课程

## 阶段总览

| 阶段 | 天数 | 主题 | 文档来源 |
|------|------|------|---------|
| 1 | 第 1-5 天 | 大模型基础 | README.md 第2部分 |
| 2 | 第 6-12 天 | 微调与对齐 | README.md 第3-4部分 |
| 3 | 第 13-16 天 | 免训练优化 | README.md 第5部分 |
| 4 | 第 17-23 天 | 强化学习基础 | README.md 第6-7部分 |
| 5 | 第 24-29 天 | 高级主题 | README.md 第8-10部分 |
| 6 | 第 30-35 天 | 综合图谱 | rl-algo-map.pdf + LLM-VLM-index.md |

---

## 阶段一：大模型基础（第 1-5 天）

> 目标：理解 LLM 的基本构成、运行机制与训练流程。

| 天 | 主题 | 关键词 |
|----|------|--------|
| 1 | LLM 总体架构 | Transformer、注意力机制、模型结构 |
| 2 | LLM 输入与输出 | Tokenization、Embedding、输出分布 |
| 3 | 生成与解码过程 | 自回归生成、Greedy/Beam Search |
| 4 | LLM 训练流程 | 预训练、数据处理、损失函数 |
| 5 | 多模态模型基础 | VLM、图文对齐、CLIP |

---

## 阶段二：微调与对齐（第 6-12 天）

> 目标：掌握让模型"听话"的核心技术，从 SFT 到 RLHF 完整链路。

| 天 | 主题 | 关键词 |
|----|------|--------|
| 6 | SFT 基础 | 指令微调分类、指令数据来源、数据拼接策略 |
| 7 | LoRA 技术 | 低秩分解、初始化策略、参数效率对比 |
| 8 | 其他微调方法 | Prefix-Tuning、Adapter Tuning、Prompt 微调 |
| 9 | RLHF 基础 | 两阶段训练流程、奖励模型结构与训练 |
| 10 | PPO 算法 | PPO vs TRPO、PPO-Clip 原理、KL 散度 |
| 11 | DPO 基础 | RLHF vs DPO 对比、原理、β 参数、隐式奖励 |
| 12 | DPO 深入与实践 | 数学推导、梯度更新机制、变体改进、实践案例 |

---

## 阶段三：免训练优化（第 13-16 天）

> 目标：掌握不修改模型权重即可提升能力的推理增强技术。

| 天 | 主题 | 关键词 |
|----|------|--------|
| 13 | CoT 思维链 | CoT vs 传统问答、Self-consistency、ToT/GoT |
| 14 | 解码策略深入 | 多项式采样、Top-K/P、对比搜索、投机解码 |
| 15 | RAG | 离线构建、在线检索、优化技术、主流框架 |
| 16 | Function Calling | 工具调用原理、Agent 架构、工具使用框架 |

---

## 阶段四：强化学习基础（第 17-23 天）

> 目标：从零理解 RL 数学基础，为后续 RLHF/GRPO 打牢根基。

| 天 | 主题 | 关键词 |
|----|------|--------|
| 17 | RL 基础概念 | MDP、状态/动作/奖励、策略定义 |
| 18 | 价值函数 | V(s)、Q(s,a)、Bellman 方程 |
| 19 | DQN | 经验回放、目标网络、ε-greedy 探索 |
| 20 | 策略梯度 | REINFORCE、基线减方差、策略梯度定理 |
| 21 | Actor-Critic | A2C/A3C、优势函数、异步训练 |
| 22 | PPO 深入 | Clip 目标、GAE、mini-batch 更新 |
| 23 | GRPO | Group Relative Policy Optimization、与 PPO 对比 |

---

## 阶段五：高级主题（第 24-29 天）

> 目标：理解 LLM 对齐前沿、推理增强与工程优化。

| 天 | 主题 | 关键词 |
|----|------|--------|
| 24 | RLHF 进阶 | Constitutional AI、RLAIF、reward hacking |
| 25 | 逻辑推理增强 | Chain-of-thought、Scratchpad、Process reward |
| 26 | 推理性能优化 | KV Cache、Continuous Batching、FlashAttention |
| 27 | 训练性能优化 | 混合精度、梯度检查点、ZeRO、Pipeline 并行 |
| 28 | 架构优化 | MoE、GQA/MQA、RoPE、ALiBi |
| 29 | 综合复习 | 前五阶段重点回顾与串联 |

---

## 阶段六：综合图谱（第 30-35 天）

> 目标：建立全局视野，了解最新模型与研究动态。

| 天 | 主题 | 文档来源 | 关键词 |
|----|------|---------|--------|
| 30 | RL 算法全景图（一） | rl-algo-map.pdf | 算法分类、演进脉络 |
| 31 | RL 算法全景图（二） | rl-algo-map.pdf | Model-based vs Model-free |
| 32 | LLM 最新模型研究（一） | LLM-VLM-index.md | 近期架构创新 |
| 33 | LLM 最新模型研究（二） | LLM-VLM-index.md | 对齐与安全前沿 |
| 34 | VLM 前沿研究 | LLM-VLM-index.md | 多模态最新进展 |
| 35 | 终极总结与路线图 | 全部 | 知识体系梳理、后续学习路径 |

---

## 文档映射速查

```
天数范围      →  文档位置
第 1-5 天    →  LLM-RL-Visualized/README.md  第2部分
第 6-8 天    →  LLM-RL-Visualized/README.md  第3部分（SFT）
第 9-12 天   →  LLM-RL-Visualized/README.md  第4部分（DPO）
第 13-16 天  →  LLM-RL-Visualized/README.md  第5部分
第 17-23 天  →  LLM-RL-Visualized/README.md  第6-7部分
第 24-29 天  →  LLM-RL-Visualized/README.md  第8-10部分
第 30-35 天  →  rl-algo-map.pdf + LLM-VLM-index.md
```
