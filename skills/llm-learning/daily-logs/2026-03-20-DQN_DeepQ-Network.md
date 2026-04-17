# 第19天：DQN（Deep Q-Network）

## 基本信息

- **日期：** 2026-03-20
- **阶段：** 阶段四 — 强化学习基础
- **连续学习：** 19 天

---

## 核心知识点

### 1. DQN 的基本架构与输入输出

DQN（Deep Q-Network）是基于价值（Value-Based）的强化学习算法，使用深度神经网络拟合 Q 函数。DQN 将传统的 Q-Learning 与深度学习结合，使其能够处理高维状态空间（如图像）。

DQN 模型的输入输出结构有两种类型：

- **类型一：** 输入为当前状态（S₀）和候选执行的动作（A₀），输出为对应的价值 Q₀（未来回报的预估）。在实际应用中，也可以批量计算多个动作的价值 Q。
- **类型二：** 输入为当前状态（S₀），输出为动作空间中所有动作对应的价值 Q。在实际应用中，通常选择具有最大价值的动作执行。

**要点：**
- DQN 属于基于价值的方法，通过学习状态-动作价值函数间接推导最优策略
- 使用神经网络替代 Q 表，可处理连续或高维状态空间
- 适用于离散动作空间，输出每个动作的 Q 值

---

### 2. 经验回放（Experience Replay）

经验回放是 DQN 的核心创新之一。在传统强化学习中，样本是按时间顺序采集的，相邻样本具有强相关性，导致训练不稳定。经验回放通过建立回放缓冲区（Replay Buffer），将历史经验存储起来，训练时随机采样，打破了样本的时间相关性。

**要点：**
- 将采集到的经验（S, A, R, S'）存储到回放缓冲区
- 训练时从缓冲区随机采样，打破样本间的时序相关性
- 提高样本利用率，每个经验可以被重复使用多次
- 减少训练数据的分布偏移，使训练更加稳定

**代码示例：**

```python
# 经验回放缓冲区
class ReplayBuffer:
    def __init__(self, capacity=10000):
        self.buffer = deque(maxlen=capacity)

    def push(self, state, action, reward, next_state, done):
        """存储一条经验"""
        self.buffer.append((state, action, reward, next_state, done))

    def sample(self, batch_size=32):
        """随机采样一批经验"""
        batch = random.sample(self.buffer, batch_size)
        states, actions, rewards, next_states, dones = zip(*batch)
        return states, actions, rewards, next_states, dones
```

---

### 3. 目标网络（Target Network）

DQN 的另一个核心创新是引入目标网络。在标准 Q-Learning 中，计算目标值时使用的是当前网络，这会导致"狗追尾巴"（自举）问题：回归目标 yt 随着网络参数 θ 的变化而变化，使得训练不稳定。目标网络通过复制主网络的参数，提供稳定的训练目标。

**要点：**
- 目标网络的参数 θ⁻ 周期性从主网络 θ 复制
- 计算目标价值时使用目标网络：y = r + γ·max_a' Q(s', a'; θ⁻)
- 固定目标网络的参数一段时间，使训练目标保持稳定
- 定期更新目标网络（如每 C 步或使用软更新方式）

**代码示例：**

```python
# 目标网络更新（硬更新）
def update_target_network(main_net, target_net):
    """将主网络参数复制到目标网络"""
    target_net.load_state_dict(main_net.state_dict())

# 软更新（每次主网络更新后）
def soft_update(main_net, target_net, tau=0.001):
    """软更新：θ⁻ ← τ·θ + (1-τ)·θ⁻"""
    for target_param, main_param in zip(target_net.parameters(), main_net.parameters()):
        target_param.data.copy_(
            tau * main_param.data + (1 - tau) * target_param.data
        )
```

---

### 4. ε-greedy 探索策略

在强化学习中，需要在"探索"（尝试新动作）和"利用"（选择当前认为最优的动作）之间取得平衡。ε-greedy 策略是一种简单的平衡方法：以概率 ε 随机选择动作（探索），以概率 1-ε 选择当前最优动作（利用）。随着训练进行，ε 值逐渐减小，从探索转向利用。

**要点：**
- ε 为探索率，初始值较大（如 1.0），逐渐衰减到较小值（如 0.01）
- 随机探索可以避免陷入局部最优
- 随着训练进行，逐渐降低探索率，更多利用已学到的知识
- 也可以使用动态 ε 值，根据训练进度自适应调整

**代码示例：**

```python
def select_action(state, epsilon=0.1):
    """ε-greedy 动作选择"""
    if random.random() < epsilon:
        # 探索：随机选择动作
        return random.randint(0, action_size - 1)
    else:
        # 利用：选择 Q 值最大的动作
        with torch.no_grad():
            q_values = model(state)
            return q_values.argmax().item()

# ε 值衰减
epsilon = 1.0
epsilon_min = 0.01
epsilon_decay = 0.995
epsilon = max(epsilon_min, epsilon * epsilon_decay)
```

---

### 5. DQN 的"高估"问题

DQN 存在一个固有的高估问题：在选择和评估动作时，同一个网络被用于选择最大 Q 值，这导致目标值 yt 中包含了高估部分。这种高估是非均匀的，会随着训练累积，影响策略优化的准确性。

**要点：**
- 高估源于最大化操作：max Q(s', a') 中包含了噪声
- 同一个网络既选择动作又评估价值，导致过度乐观
- 后续算法（如 Double DQN）通过分离选择和评估网络来缓解
- 高估问题会影响最终性能，需要通过算法改进来解决

---

## 关键图示

> 图片路径仅供本地查看，不读取内容：

- `images_chinese/png_small/【强化学习基础】两种输入输出结构的DQN模型.png`
- `images_chinese/png_small/【强化学习基础】DQN的实际应用示例.png`
- `images_chinese/png_small/【强化学习基础】DQN的"高估"问题.png`

---

## 实践建议

1. **动手实现基础 DQN**：使用 PyTorch 或 TensorFlow 实现一个简单的 DQN，在 CartPole 或 LunarLander 等 Gym 环境中训练，理解经验回放、目标网络和 ε-greedy 的作用。

2. **对比有无目标网络的差异**：训练两个版本的 DQN，一个使用目标网络，一个不使用，观察训练曲线的稳定性和收敛速度，直观感受目标网络的重要性。

3. **可视化探索过程**：记录 ε 值的变化轨迹，观察训练初期探索率高、后期利用率高的过程，理解探索-利用平衡对学习效果的影响。

---

## 今日总结

DQN 通过引入经验回放和目标网络两大创新，成功将深度学习与强化学习结合，使其能够处理高维状态空间。经验回放打破样本相关性，目标网络稳定训练目标，ε-greedy 平衡探索与利用。这些创新为后续更复杂的强化学习算法（如 Double DQN、Dueling DQN、PPO 等）奠定了基础。

---

## 明日预告

**第20天：策略梯度（REINFORCE）**

> 从基于价值的方法转向基于策略的方法，学习如何直接优化策略函数，理解策略梯度定理和 REINFORCE 算法的核心思想。
