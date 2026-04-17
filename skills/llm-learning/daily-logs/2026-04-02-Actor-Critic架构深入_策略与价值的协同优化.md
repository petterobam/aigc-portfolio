# 第21天：Actor-Critic 架构深入 —— 策略与价值的协同优化

## 基本信息

- **日期：** 2026-04-02
- **阶段：** 阶段四 — 强化学习基础
- **连续学习：** 6 天
- **总进度：** 21/35 天（60.0%）

---

## 学习背景

Actor-Critic 是强化学习中最重要的一类算法架构，它巧妙地结合了基于策略的方法（Policy-Based）和基于价值的方法（Value-Based）的优点。Actor 负责学习并执行策略，Critic 负责评估状态或动作的价值，两者协同工作，既降低了策略梯度的方差，又保持了直接优化策略的优势。

现代 LLM 对齐算法（如 PPO、GRPO）都建立在 Actor-Critic 架构之上，深入理解这一架构对于掌握 RLHF 至关重要。

---

## 核心知识点

### 1. Actor-Critic 的核心思想

Actor-Critic 的核心思想是将强化学习分解为两个互补的任务：

**Actor（演员）：**
- **输入：** 状态 $s$
- **输出：** 动作的概率分布 $\pi_\theta(a|s)$
- **职责：** 根据当前策略选择动作，探索环境
- **更新目标：** 最大化期望回报

**Critic（评论家）：**
- **输入：** 状态 $s$（或状态-动作对 $(s,a)$）
- **输出：** 价值估计 $V_\phi(s)$ 或 $Q_\phi(s,a)$
- **职责：** 评估当前状态或动作的价值，提供反馈
- **更新目标：** 最小化价值估计误差

**协同机制：**
- Actor 采取行动，环境返回奖励
- Critic 根据奖励和新状态计算优势（Advantage）
- Actor 使用优势函数调整策略
- Critic 根据新的经验更新价值函数

**类比理解：**
- Actor 就像一个运动员，负责实际表演
- Critic 就像一个教练，负责评估表现并给出反馈
- 两者通过持续互动，共同提升表演水平

---

### 2. A2C（Advantage Actor-Critic）

A2C 是 Actor-Critic 最基础的实现版本，使用优势函数（Advantage）来指导策略更新。

**优势函数计算：**
$$ A(s_t, a_t) = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t) $$

**Actor 更新：**
使用优势函数作为权重更新策略：
$$ \nabla_\theta J(\theta) = \mathbb{E} \left[ \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot A(s_t, a_t) \right] $$

**Critic 更新：**
最小化 TD 误差：
$$ L(\phi) = \mathbb{E} \left[ (r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t))^2 \right] $$

**代码示例（PyTorch）：**
```python
class ActorCritic(nn.Module):
    def __init__(self, state_dim, action_dim, hidden_dim=64):
        super().__init__()

        # Actor 网络：策略函数
        self.actor = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, action_dim),
            nn.Softmax(dim=-1)
        )

        # Critic 网络：价值函数
        self.critic = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )

    def forward(self, state):
        # Actor 输出动作概率分布
        action_probs = self.actor(state)
        # Critic 输出状态价值
        value = self.critic(state)
        return action_probs, value

    def act(self, state):
        """根据当前策略采样动作"""
        action_probs, _ = self.forward(state)
        dist = Categorical(action_probs)
        action = dist.sample()
        log_prob = dist.log_prob(action)
        return action.item(), log_prob, self.critic(state)

def compute_advantages(rewards, values, gamma=0.99):
    """计算优势函数（简化版，不使用 GAE）"""
    advantages = []
    next_value = 0

    # 从后往前计算
    for r, v in zip(reversed(rewards), reversed(values)):
        td_target = r + gamma * next_value
        advantage = td_target - v
        advantages.insert(0, advantage)
        next_value = v.item()

    return torch.tensor(advantages)

def a2c_update(model, states, actions, log_probs, rewards, values, gamma=0.99):
    """A2C 更新"""
    # 1. 计算优势函数
    advantages = compute_advantages(rewards, values, gamma)

    # 2. 计算 Actor 损失
    # 使用优势函数作为权重
    actor_loss = -(log_probs * advantages.detach()).mean()

    # 3. 计算 Critic 损失
    # 重新计算当前 Critic 的价值估计
    _, new_values = model(states)
    critic_loss = F.mse_loss(new_values.squeeze(), (rewards + gamma * advantages + values).detach())

    # 4. 总损失
    total_loss = actor_loss + critic_loss

    # 5. 反向传播
    optimizer.zero_grad()
    total_loss.backward()
    optimizer.step()

    return actor_loss.item(), critic_loss.item()
```

**A2C 训练流程：**
1. 收集经验：使用当前策略采样一个批量的轨迹
2. 计算回报和优势：使用 Critic 的价值估计计算 TD 误差
3. 更新 Actor：使用优势函数更新策略
4. 更新 Critic：最小化 TD 误差
5. 重复步骤 1-4

---

### 3. A3C（Asynchronous Advantage Actor-Critic）

A3C 是 A2C 的分布式版本，通过多线程异步训练提高样本利用率。

**核心改进：**
- 多个 Worker（工作线程）并行探索环境
- 每个 Worker 有独立的网络副本
- 异步更新全局网络参数
- 不同 Worker 探索不同区域，提高多样性

**架构图：**
```
Worker 1  ──┐
Worker 2  ──┤
Worker 3  ──┼──> 异步更新 ──> 全局网络 (Global Network)
Worker 4  ──┤
Worker 5  ──┘
```

**工作流程：**
1. 每个 Worker 从全局网络复制参数到本地网络
2. Worker 在本地环境中交互，收集经验
3. Worker 计算梯度，更新全局网络
4. 其他 Worker 重复步骤 1-3

**优势：**
- ✅ 提高样本利用率：多个 Worker 并行探索
- ✅ 增加探索多样性：不同 Worker 探索不同区域
- ✅ 打破数据相关性：异步更新降低相关性
- ✅ 加速训练：充分利用多核 CPU

**代码框架（简化版）：**
```python
class Worker(threading.Thread):
    def __init__(self, worker_id, global_model, env, gamma=0.99):
        super().__init__()
        self.worker_id = worker_id
        self.global_model = global_model
        self.env = env
        self.gamma = gamma

        # 每个 Worker 有自己的本地网络副本
        self.local_model = ActorCritic(state_dim, action_dim)
        self.local_model.load_state_dict(global_model.state_dict())

    def run(self):
        """每个 Worker 独立运行"""
        state = self.env.reset()

        while True:
            # 1. 收集一个批量的经验
            states, actions, log_probs, rewards, values = [], [], [], [], []

            for _ in range(batch_size):
                action, log_prob, value = self.local_model.act(torch.tensor(state))
                next_state, reward, done, _ = self.env.step(action)

                states.append(state)
                actions.append(action)
                log_probs.append(log_prob)
                rewards.append(reward)
                values.append(value)

                if done:
                    state = self.env.reset()
                else:
                    state = next_state

            # 2. 计算梯度
            advantages = compute_advantages(rewards, values, self.gamma)
            actor_loss, critic_loss = a2c_update(
                self.local_model, states, actions, log_probs, rewards, values, self.gamma
            )

            # 3. 将本地梯度应用到全局网络
            with global_model.lock:  # 使用锁避免冲突
                self.global_model.optimizer.zero_grad()
                for global_param, local_param in zip(
                    self.global_model.parameters(), self.local_model.parameters()
                ):
                    global_param._grad = local_param.grad
                self.global_model.optimizer.step()

            # 4. 从全局网络同步最新参数到本地网络
            self.local_model.load_state_dict(self.global_model.state_dict())

# 主进程：创建多个 Worker
global_model = ActorCritic(state_dim, action_dim)
workers = [Worker(i, global_model, env) for i in range(num_workers)]

# 启动所有 Worker
for worker in workers:
    worker.start()
```

**A2C vs A3C 对比：**

| 特性 | A2C | A3C |
|------|-----|-----|
| 训练方式 | 同步（单线程） | 异步（多线程） |
| 样本利用率 | 中等 | 高 |
| 探索多样性 | 低 | 高 |
| 实现复杂度 | 简单 | 复杂 |
| 适用场景 | 单机训练 | 多核 CPU / 分布式训练 |

---

### 4. 优势函数的实际应用

优势函数（Advantage Function）是 Actor-Critic 的核心，用于指导策略更新的方向和幅度。

**优势函数的直观理解：**

**情况 1：$A(s,a) > 0$（正向优势）**
- 动作 $a$ 的实际回报高于预期
- **含义：** 这个动作做得比平均水平好
- **更新方向：** 增加该动作的概率
- **示例：** 在象棋中，走了一步意想不到的好棋，获得了子力优势

**情况 2：$A(s,a) < 0$（负向优势）**
- 动作 $a$ 的实际回报低于预期
- **含义：** 这个动作做得比平均水平差
- **更新方向：** 降低该动作的概率
- **示例：** 在游戏中，犯了一个导致生命值下降的错误

**情况 3：$A(s,a) \approx 0$（中性优势）**
- 动作 $a$ 的实际回报接近预期
- **含义：** 这个动作表现正常
- **更新方向：** 保持不变
- **示例：** 在平稳驾驶中，保持当前速度

**优势函数的作用：**

1. **降低方差：**
   - 直接使用回报 $G_t$ 波动大
   - 减去基准 $V(s)$ 后，优势 $A(s,a)$ 波动更小
   - 梯度估计更稳定

2. **加速收敛：**
   - 正向优势快速增加好动作的概率
   - 负向优势快速减少坏动作的概率
   - 比纯 REINFORCE 收敛更快

3. **相对评估：**
   - 不仅看"这个动作好不好"，还看"这个动作比平均水平好多少"
   - 更精细的策略调整

**可视化优势函数：**

假设在训练过程中记录每个时间步的优势值，理想分布应该是：
```
优势值分布:
  +++++++ (正向优势，略多于负向)
+++++++++ (集中在 0 附近)
  -----   (负向优势)

平均值 ≈ 0（正负对称）
```

如果分布异常：
- **优势值长期为正：** 策略过于保守，低估了价值
- **优势值长期为负：** 策略过于激进，高估了价值
- **方差过大：** Critic 训练不稳定，价值估计不准确

---

### 5. Critic 的训练技巧

Critic 的质量直接影响 Actor-Critic 的性能，以下是一些关键训练技巧：

**技巧 1：TD 目标冻结**
在更新 Critic 时，使用冻结的 TD 目标：
$$ y_t = r_t + \gamma V_{\phi_{old}}(s_{t+1}) $$
其中 $V_{\phi_{old}}$ 是旧参数下的价值估计，避免"追逐移动目标"。

**代码示例：**
```python
def critic_update(model, states, rewards, next_states, gamma=0.99):
    # 使用旧参数计算 TD 目标（detach 防止梯度传播）
    with torch.no_grad():
        _, next_values = model(next_states)
        td_targets = rewards + gamma * next_values.squeeze()

    # 计算当前价值估计
    _, current_values = model(states)

    # 计算 MSE 损失
    critic_loss = F.mse_loss(current_values.squeeze(), td_targets)

    # 反向传播
    optimizer.zero_grad()
    critic_loss.backward()
    optimizer.step()

    return critic_loss.item()
```

**技巧 2：优势函数归一化**
在更新 Actor 前，对优势函数进行归一化：
$$ A_{normalized} = \frac{A - \mu}{\sigma + \epsilon} $$
其中 $\mu$ 和 $\sigma$ 是优势函数的均值和标准差。

**作用：**
- 稳定训练过程
- 防止优势值过大导致策略更新过激
- 适应不同的环境奖励尺度

**代码示例：**
```python
def normalize_advantages(advantages, epsilon=1e-8):
    """归一化优势函数"""
    mean = advantages.mean()
    std = advantages.std()
    return (advantages - mean) / (std + epsilon)
```

**技巧 3：Critic 比 Actor 更新更频繁**
Critic 的训练更稳定，可以比 Actor 更新更多次：
```python
for _ in range(num_epochs):
    # 更新 Critic K 次
    for _ in range(critic_updates_per_step):
        critic_loss = critic_update(...)

    # 更新 Actor 1 次
    actor_loss = actor_update(...)
```

**技巧 4：价值目标裁剪（类似 PPO）**
在更新 Critic 时，裁剪价值变化幅度：
```python
# 计算价值变化幅度
value_pred = current_values.squeeze()
value_pred_clipped = old_values + torch.clamp(
    value_pred - old_values,
    -clip_range,
    clip_range
)

# 选择更保守的损失
value_loss1 = F.mse_loss(value_pred, td_targets)
value_loss2 = F.mse_loss(value_pred_clipped, td_targets)
value_loss = torch.max(value_loss1, value_loss2)
```

---

### 6. Actor-Critic 的常见问题与解决方案

**问题 1：策略崩溃（Policy Collapse）**
- **症状：** 策略过早收敛到次优解，停止探索
- **原因：** Critic 价值估计不准确，导致优势函数错误
- **解决方案：**
  - 使用熵正则化（Entropy Regularization）鼓励探索
  - 调整 Critic 的学习率
  - 使用 GAE 减少价值估计的方差

**问题 2：训练不稳定**
- **症状：** 损失波动大，性能忽高忽低
- **原因：** Actor 和 Critic 的更新步数不平衡
- **解决方案：**
  - 增加 Critic 的更新频率
  - 使用梯度裁剪（Gradient Clipping）
  - 降低学习率

**问题 3：样本效率低**
- **症状：** 需要大量样本才能收敛
- **原因：** 经验只用一次就丢弃
- **解决方案：**
  - 使用经验回放（Experience Replay）
  - 使用重要性采样（Importance Sampling）重用旧数据
  - 采用 A3C 多线程并行训练

**问题 4：梯度爆炸**
- **症状：** 梯度值过大，权重更新过激
- **原因：** 优势函数或价值估计过大
- **解决方案：**
  - 梯度裁剪：`nn.utils.clip_grad_norm_(model.parameters(), max_norm=0.5)`
  - 优势函数归一化
  - 降低学习率

---

### 7. Actor-Critic 算法总结

**算法演进路线：**
```
REINFORCE（纯策略梯度，高方差）
  ↓
+ 优势函数（降低方差）
  ↓
+ Critic（Actor-Critic 架构）
  ↓
A2C（同步训练）
  ↓
A3C（异步多线程）
  ↓
PPO（限制策略更新幅度）
  ↓
GRPO（相对策略优化）
```

**关键概念对比：**

| 概念 | 作用 | 实现难度 | 性能 |
|------|------|---------|------|
| REINFORCE | 最简单的策略梯度 | 低 | 差（高方差） |
| A2C | 同步 Actor-Critic | 中 | 中 |
| A3C | 异步多线程 | 高 | 好（高效率） |
| PPO | 限制策略更新幅度 | 中 | 优秀（稳定） |
| GRPO | 相对策略优化 | 中 | 优秀（高效） |

**适用场景：**

- **A2C：** 单机训练，中等复杂度环境
- **A3C：** 多核 CPU，需要高样本效率
- **PPO：** 需要高稳定性的生产环境（如 RLHF）
- **GRPO：** 需要高效率且稳定的环境（如 LLM 对齐）

---

## 关键图示

> 图片路径仅供本地查看，不读取内容：

- `images_chinese/png_small/【策略优化架构算法及其衍生】Actor-Critic架构.png`
- `images_english/png_small/【Policy Optimization & Variants】Actor-Critic.png`
- `images_english/png_small/【Policy Optimization & Variants】A3C architecture.png`
- `images_english/png_small/【Policy Optimization & Variants】Comparison of baseline and advantage.png`
- `images_chinese/png_small/【强化学习基础】策略梯度.png`

---

## 数学公式总结

### 1. 优势函数
$$ A(s_t, a_t) = r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t) $$

### 2. Actor 更新
$$ \nabla_\theta J(\theta) = \mathbb{E} \left[ \nabla_\theta \log \pi_\theta(a_t|s_t) \cdot A(s_t, a_t) \right] $$

### 3. Critic 更新
$$ L(\phi) = \mathbb{E} \left[ (r_t + \gamma V_\phi(s_{t+1}) - V_\phi(s_t))^2 \right] $$

### 4. 优势函数归一化
$$ A_{normalized} = \frac{A - \mu}{\sigma + \epsilon} $$

### 5. 熵正则化（鼓励探索）
$$ J(\theta) = \mathbb{E} \left[ \log \pi_\theta(a|s) \cdot A(s,a) + \beta \cdot H(\pi_\theta(\cdot|s)) \right] $$
其中 $H(\pi)$ 是策略的熵，$\beta$ 是正则化系数。

---

## 实践建议

1. **实现一个简单的 A2C：**
   - 选择简单的环境（如 CartPole）
   - 实现 Actor-Critic 网络
   - 使用 TD 误差计算优势函数
   - 观察训练曲线，对比 REINFORCE

2. **可视化优势函数分布：**
   - 在训练过程中记录优势函数的统计信息（均值、方差）
   - 绘制直方图，观察分布是否对称
   - 如果分布异常，调整 Critic 的学习率或使用 GAE

3. **对比 A2C 和 A3C：**
   - 在相同环境下，分别实现 A2C 和 A3C
   - 对比训练速度、样本效率、最终性能
   - 理解异步训练的优势

4. **调整熵正则化系数：**
   - 分别设置 $\beta = 0, 0.01, 0.1, 1.0$，观察训练效果
   - $\beta = 0$：纯 Actor-Critic，可能早熟收敛
   - $\beta$ 过大：过度探索，收敛慢
   - $\beta \approx 0.01$：通常是最优值

5. **调试技巧：**
   - 如果 Actor-Critic 不收敛，先单独训练 Critic
   - 确保 Critic 能准确估计价值
   - 然后再训练 Actor

---

## 今日总结

Actor-Critic 架构是强化学习从理论到实践的关键桥梁。它巧妙地结合了策略梯度的直接性和价值方法的稳定性，通过 Actor 和 Critic 的协同工作，实现了高效、稳定的策略学习。

**核心收获：**
1. Actor-Critic 将策略学习分解为两个互补的任务：Actor 负责动作选择，Critic 负责价值评估
2. A2C 是同步版本的 Actor-Critic，简单易实现
3. A3C 是异步版本，通过多线程提高样本利用率
4. 优势函数是连接 Actor 和 Critic 的桥梁，用于指导策略更新
5. Critic 的训练质量直接影响整个系统的性能
6. 诸如 TD 目标冻结、优势归一化、梯度裁剪等技巧对稳定训练至关重要

**下一步：**
明天将深入学习 PPO（Proximal Policy Optimization）算法，理解它如何在 Actor-Critic 基础上通过限制策略更新幅度来实现更稳定的训练，这是现代 RLHF 的核心算法。

---

## 明日预告

**第22天：PPO 深入与 Clip 机制**

> 深入理解 PPO（Proximal Policy Optimization）算法，学习 Clip 目标函数的原理，理解为什么限制策略更新幅度能提高训练稳定性，对比 PPO 与传统 Actor-Critic 的差异，为理解 RLHF 打下坚实基础。
