# 记忆访问追踪系统架构文档

> 版本：v1.0.0
> 创建时间：2026-03-25
> 维护者：记忆优化器

---

## 概述

记忆访问追踪系统负责统计记忆的访问频率，为评分系统提供 `access_count` 数据。访问频率是评分系统的重要权重之一（30%），能够反映记忆的实际使用频率。

**设计决策：启发式方法**

当前实现采用启发式方法（heuristic）而非真实访问追踪，原因如下：

1. **集成复杂度高**：真实访问追踪需要与 OpenClaw 的记忆读取系统深度集成
2. **数据延迟**：真实访问数据可能需要长期积累才能体现规律
3. **立即可用**：启发式方法可以立即产生合理的访问统计数据
4. **准确度要求**：访问频率是相对概念，启发式方法产生的相对关系是合理的

---

## 启发式算法

### 核心思想

基于记忆的多个属性，综合估算其访问频率。核心假设：

1. **高重要性的记忆会被更频繁访问**
2. **不同类别的记忆访问频率不同**（突破性洞察 > 创作相关 > 任务 > 通用 > 操作）
3. **越新的记忆访问频率越高**（时间衰减效应）
4. **受保护的记忆是关键记忆，访问频率高**
5. **内容越丰富的记忆可能被更频繁访问**

### 计算公式

```
heuristic_access_count = base_access_count
  × category_weight
  × time_factor_weighted
  × protected_factor
  × length_factor
  × random_noise
```

#### 1. 基础访问次数（base_access_count）

**作用**：基于记忆的重要性生成基础访问次数

**公式**：
```javascript
base_access_count = importance × 5
```

**参数**：
- `importance`：记忆的重要性评分（0-5）
- `5`：重要性到访问次数的转换系数

**示例**：
- 重要性 5.0 → 基础访问次数 25
- 重要性 2.0 → 基础访问次数 10
- 重要性 1.0 → 基础访问次数 5

---

#### 2. 类别权重（category_weight）

**作用**：不同类别的记忆有不同的访问频率特征

**配置位置**：`scripts/config.js` → `ACCESS_TRACKER_CONFIG.categoryAccessBase`

**默认值**：
```javascript
{
  breakthrough: 1.5,  // 突破性洞察：高访问频率
  creation: 1.3,      // 创作相关：较高访问频率
  task: 1.0,         // 任务：中等访问频率
  general: 0.8,      // 通用：较低访问频率
  operation: 0.6     // 操作：最低访问频率
}
```

**设计依据**：
- **breakthrough（1.5）**：突破性洞察需要频繁查阅，如关键公式、重要方法论
- **creation（1.3）**：创作相关的记忆在创作过程中会反复查阅
- **task（1.0）**：任务记忆在任务完成前会被访问，完成后访问下降
- **general（0.8）**：通用记忆偶尔会查阅，但频率不高
- **operation（0.6）**：操作类记忆（如安装步骤）通常一次查阅后很少再看

**示例**：
- 重要性 5.0 的 breakthrough 记忆 → 25 × 1.5 = 37.5
- 重要性 5.0 的 operation 记忆 → 25 × 0.6 = 15

---

#### 3. 时间因子（time_factor）

**作用**：模拟时间衰减效应，越新的记忆访问频率越高

**公式**：
```javascript
age_days = (current_time - created_time) / (1000 × 60 × 60 × 24)
time_factor = max(0, 1 - (age_days / TIME_DECAY_DAYS))
```

**参数**：
- `TIME_DECAY_DAYS`：30 天（时间衰减窗口）
- `age_days`：记忆创建至今的天数
- `time_factor`：时间因子（0-1）

**权重调整**：
```javascript
time_factor_weighted = time_decay_weight
  + (1 - time_decay_weight) × time_factor
```

**配置位置**：`scripts/config.js` → `ACCESS_TRACKER_CONFIG.timeDecayWeight`

**默认值**：`0.5`（时间和静态权重各占 50%）

**示例**：
- 新创建的记忆（age = 0）→ time_factor = 1.0 → time_factor_weighted = 1.0
- 15 天前的记忆（age = 15）→ time_factor = 0.5 → time_factor_weighted = 0.75
- 30 天前的记忆（age = 30）→ time_factor = 0.0 → time_factor_weighted = 0.5
- 60 天前的记忆（age = 60）→ time_factor = 0.0 → time_factor_weighted = 0.5

---

#### 4. 受保护因子（protected_factor）

**作用**：识别受保护的记忆，提高其访问频率

**判断逻辑**：
```javascript
tags = JSON.parse(memory.tags)
has_protected_tag = tags.includes('protected')
protected_factor = has_protected_tag ? PROTECTED_TAG_WEIGHT : 1.0
```

**配置位置**：`scripts/config.js` → `ACCESS_TRACKER_CONFIG.protectedTagWeight`

**默认值**：`2.0`（受保护的记忆访问频率 × 2）

**设计依据**：
- 带有 `protected` 标签的记忆是系统关键记忆（如 MEMORY.md）
- 这些记忆会被频繁查阅，访问频率应该更高

**示例**：
- 普通 breakthrough 记忆 → 基础 × 1.5
- 受保护 breakthrough 记忆 → 基础 × 1.5 × 2.0 = 基础 × 3.0

---

#### 5. 内容长度因子（length_factor）

**作用**：内容越丰富的记忆可能被更频繁访问

**公式**：
```javascript
content_length = length(memory.content)
length_factor = min(1.0, log10(content_length + 1) / 4)
```

**设计依据**：
- 使用对数归一化（避免长内容过度放大）
- `log10` 将长度转换为对数尺度
- `/ 4` 将结果归一化到 0-1 范围（假设最大长度约 10000 字符）

**示例**：
- 内容长度 100 字符 → log10(101) ≈ 2.0 → length_factor ≈ 0.5
- 内容长度 1000 字符 → log10(1001) ≈ 3.0 → length_factor ≈ 0.75
- 内容长度 10000 字符 → log10(10001) ≈ 4.0 → length_factor ≈ 1.0

---

#### 6. 随机扰动（random_noise）

**作用**：加入随机性，模拟真实访问的波动

**公式**：
```javascript
random_noise = random(1 - noise_range, 1 + noise_range)
```

**配置位置**：`scripts/config.js` → `ACCESS_TRACKER_CONFIG.randomFluctuation`

**默认值**：`0.1`（±10% 随机波动）

**设计依据**：
- 真实访问频率会有随机波动
- 避免所有同类别的记忆访问次数完全相同

**示例**：
- 如果计算结果为 20，随机扰动后可能是 18-22

---

## 完整计算示例

假设有以下记忆：
- 重要性：3.0
- 类别：breakthrough
- 创建时间：10 天前
- 标签：包含 protected
- 内容长度：1000 字符

**计算过程**：
1. **基础访问次数**：3.0 × 5 = 15
2. **类别权重**：15 × 1.5 = 22.5
3. **时间因子**：10 天前 → time_factor = 1 - (10/30) = 0.667 → time_factor_weighted = 0.5 + 0.5 × 0.667 = 0.834
4. **受保护因子**：22.5 × 0.834 × 2.0 = 37.53
5. **内容长度因子**：log10(1001) ≈ 3.0 → length_factor = 3.0 / 4 = 0.75
6. **随机扰动**：假设为 1.05
7. **最终结果**：37.53 × 0.75 × 1.05 ≈ **29.57**

**更新数据库**：将 `access_count` 更新为 29（四舍五入）

---

## 数据库表结构

### metadata 表

访问相关字段：
- `access_count`：访问次数（整数）
- `last_accessed`：最后访问时间（ISO 8601 字符串）
- `accessed_at`：访问时间数组（JSON 数组，未使用）

### access_log 表

访问日志字段：
- `id`：自增 ID
- `metadata_id`：记忆 ID
- `accessed_at`：访问时间
- `context`：访问上下文（JSON，未使用）

**当前实现**：每次运行 access-tracker.js 时：
1. 更新 `metadata.access_count`
2. 更新 `metadata.last_accessed`
3. 插入 `access_log` 记录

---

## 配置参数

所有配置位于 `scripts/config.js` 的 `ACCESS_TRACKER_CONFIG` 对象：

```javascript
ACCESS_TRACKER_CONFIG = {
  // 类别基础访问权重
  categoryAccessBase: {
    breakthrough: 1.5,
    creation: 1.3,
    task: 1.0,
    general: 0.8,
    operation: 0.6
  },

  // 时间衰减权重（0-1）
  timeDecayWeight: 0.5,

  // 受保护标签权重
  protectedTagWeight: 2.0,

  // 随机波动范围（0-1）
  randomFluctuation: 0.1
}
```

---

## 使用方法

### 手动运行

```bash
cd ~/.openclaw/workspace/skills/memory-optimizer
node scripts/access-tracker.js
```

### 自动运行

访问追踪系统会在优化脚本运行前自动执行：

```javascript
// optimize.js
console.log('📊 更新访问统计...');
exec('node scripts/access-tracker.js');
```

---

## 限制与改进方向

### 当前限制

1. **不是真实访问数据**
   - 访问次数是估算的，不是真实的
   - 无法反映真实的访问模式

2. **静态计算**
   - 每次运行都是重新计算，不是增量更新
   - 无法追踪访问次数的变化趋势

3. **无上下文信息**
   - `access_log.context` 字段未使用
   - 无法记录访问的上下文（如查询关键词）

### 改进方向

#### 短期改进（低成本）

1. **增加记忆版本追踪**
   - 记录记忆每次被修改的时间
   - 修改也算作一种"访问"

2. **优化时间衰减算法**
   - 使用指数衰减而非线性衰减
   - 更符合真实访问模式

3. **增加类别细分**
   - 为不同子类别设置不同的访问频率
   - 更精细的权重设置

#### 中期改进（中成本）

1. **实现增量更新**
   - 只更新有变化的记忆
   - 提高性能，减少数据库写入

2. **添加访问上下文**
   - 记录每次访问的查询关键词
   - 分析访问模式，改进启发式算法

3. **实现自适应调整**
   - 基于历史数据动态调整权重
   - 让启发式算法更准确

#### 长期改进（高成本）

1. **集成真实访问追踪**
   - 在 OpenClaw 的记忆读取工具中集成访问统计
   - 每次读取记忆时自动增加 `access_count`
   - 记录真实的访问时间和上下文

2. **机器学习模型**
   - 基于真实访问数据训练预测模型
   - 自动学习访问模式

3. **A/B 测试**
   - 对比启发式方法和真实访问数据
   - 评估启发式方法的准确度

---

## 与评分系统的关系

访问频率是评分系统的重要权重之一（30%）：

```javascript
// scripts/config.js → OPTIMIZE_CONFIG.scoreWeights
{
  accessFrequency: 0.30,  // 访问频率权重
  recency: 0.15,
  contentQuality: 0.25,
  titleQuality: 0.15,
  keywordDensity: 0.15
}
```

**影响**：
- 访问次数越高，重要性评分越高
- 高访问频率的记忆更不容易被归档

**示例**：
- `access_count = 50` → 访问频率评分 ≈ 5.0
- `access_count = 10` → 访问频率评分 ≈ 3.0
- `access_count = 0` → 访问频率评分 ≈ 0.0

---

## 监控与分析

### 查看访问统计

```sql
SELECT
  id,
  title,
  category,
  access_count,
  last_accessed
FROM metadata
WHERE category != 'archived'
ORDER BY access_count DESC;
```

### 分析访问分布

```sql
SELECT
  category,
  AVG(access_count) as avg_access,
  MAX(access_count) as max_access,
  MIN(access_count) as min_access,
  COUNT(*) as count
FROM metadata
WHERE category != 'archived'
GROUP BY category
ORDER BY avg_access DESC;
```

### 查看访问日志

```sql
SELECT
  m.id,
  m.title,
  m.category,
  COUNT(l.id) as log_count,
  MIN(l.accessed_at) as first_access,
  MAX(l.accessed_at) as last_access
FROM metadata m
LEFT JOIN access_log l ON m.id = l.metadata_id
WHERE m.category != 'archived'
GROUP BY m.id
ORDER BY log_count DESC;
```

---

## 常见问题

### Q1: 为什么使用启发式方法而非真实访问追踪？

**A**：
1. 集成复杂度高，需要与 OpenClaw 深度集成
2. 真实访问数据需要长期积累
3. 启发式方法可以立即产生合理数据
4. 访问频率是相对概念，启发式方法足够准确

### Q2: 启发式方法的准确度如何？

**A**：
- 准确度取决于参数设置
- 当前设置基于经验值，相对关系合理
- 可以通过调整参数优化准确度
- 对于判断"哪些记忆更重要"是足够的

### Q3: 如何判断启发式方法是否合理？

**A**：
- 查看访问统计分布是否合理（不同类别有明显差异）
- 查看 `access_count` 与 `importance` 是否正相关
- 运行历史报告分析脚本，查看长期趋势

### Q4: 如何调整启发式算法参数？

**A**：
1. 编辑 `scripts/config.js` 中的 `ACCESS_TRACKER_CONFIG`
2. 运行 `node scripts/access-tracker.js` 重新计算
3. 运行 `node scripts/optimize.js` 查看效果
4. 对比调整前后的评分变化

### Q5: 什么时候需要集成真实访问追踪？

**A**：
- 当启发式方法无法满足需求时
- 当需要分析真实访问模式时
- 当 OpenClaw 提供了集成接口时

---

## 总结

记忆访问追踪系统采用启发式方法，基于记忆的重要性、类别、时间、受保护状态和内容长度，综合估算访问频率。虽然不是真实访问数据，但产生的相对关系合理，能够满足评分系统的需求。

**优势**：
- 立即可用，无需等待真实访问数据积累
- 参数可调，可以根据实际需求优化
- 性能开销低，计算速度快

**限制**：
- 不是真实访问数据
- 无法追踪访问次数的变化趋势
- 需要定期调整参数以保持准确度

**未来方向**：
- 集成真实访问追踪
- 实现增量更新和自适应调整
- 使用机器学习模型优化预测准确度

---

**文档版本**：v1.0.0
**最后更新**：2026-03-25
**维护者**：记忆优化器
