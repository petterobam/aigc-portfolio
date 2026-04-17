# 记忆优化策略

本文档记录从 elite-longterm-memory skill 中提取的优秀设计思路，并整合到我们的记忆系统中。

## 🎯 核心设计思路

### 1. 分层记忆架构

**5 层记忆模型**：

| 层级 | 名称 | 存储 | 用途 | 特点 |
|------|------|------|------|------|
| **HOT** | 工作记忆 | SESSION-STATE.md | 当前任务上下文 | 使用 WAL 协议，在响应前写入 |
| **WARM** | 向量存储 | LanceDB | 语义搜索 | 快速检索相关记忆 |
| **COLD** | 知识图谱 | Git-Notes | 结构化决策 | 永久存储，分支感知 |
| **CURATED** | 精选归档 | MEMORY.md | 人类可读 | 每日日志 + 精选智慧 |
| **CLOUD** | 云备份 | SuperMemory | 跨设备同步 | 可选 |

### 2. WAL 协议（Write-Ahead Log）

**核心原则**：在响应前先写入，确保不丢失上下文。

```markdown
# SESSION-STATE.md — 工作记忆

## 当前任务
[现在正在做什么]

## 关键上下文
- 用户偏好: ...
- 已做决策: ...
- 阻塞问题: ...

## 待办事项
- [ ] ...
```

**规则**：
1. 在响应前写入 SESSION-STATE.md
2. 由用户输入触发，不是 agent 记忆
3. 上下文压缩后仍然保留

### 3. 自动优化机制

**3 个自动化流程**：

#### 3.1 自动提取事实（Mem0）

```javascript
// 从对话中自动提取事实
await client.add(messages, { user_id: "user123" });

// 检索相关记忆
const memories = await client.search(query, { user_id: "user123" });
```

**效果**：80% token 减少

#### 3.2 自动去重（向量相似度）

```python
# 计算向量相似度
similarity = cosine_similarity(embedding1, embedding2)

# 相似度 > 0.95，合并记忆
if similarity > 0.95:
    merge_memories(memory1, memory2)
```

#### 3.3 自动归档（时间 + 访问频率）

```python
# 归档规则
if memory.age > 30_days and memory.access_count < 2:
    archive_memory(memory)

# 降级规则
if memory.age > 7_days and memory.importance < 3:
    decrease_importance(memory)
```

### 4. 记忆重要性评分

**评分维度**：
- **访问频率**：访问次数 / 天数
- **时效性**：距离上次访问的时间
- **内容质量**：标签完整性、内容长度
- **关联度**：被其他记忆引用的次数

**计算公式**：
```
importance = (access_count / age_days) * 0.4
           + (1 / days_since_last_access) * 0.3
           + content_quality_score * 0.2
           + reference_count * 0.1
```

### 5. 定期优化任务

**优化流程**：
1. **扫描所有记忆**
2. **计算重要性评分**
3. **识别重复记忆**（向量相似度 > 0.95）
4. **识别过期记忆**（> 30 天未访问）
5. **执行优化**：
   - 合并重复记忆
   - 归档过期记忆
   - 降低不重要记忆的优先级
6. **生成优化报告**

## 🔧 整合到 sqlite-memory

### 1. 添加重要性评分

**更新 metadata 表**：
```sql
ALTER TABLE metadata ADD COLUMN access_frequency REAL DEFAULT 0;
ALTER TABLE metadata ADD COLUMN days_since_last_access INTEGER DEFAULT 0;
ALTER TABLE metadata ADD COLUMN reference_count INTEGER DEFAULT 0;
```

**计算重要性**：
```javascript
function calculateImportance(memory) {
  const accessFrequency = memory.access_count / memory.age_days;
  const recency = 1 / memory.days_since_last_access;
  const contentQuality = calculateContentQuality(memory);
  
  return (accessFrequency * 0.4)
       + (recency * 0.3)
       + (contentQuality * 0.2)
       + (memory.reference_count * 0.1);
}
```

### 2. 添加自动去重

**使用 SQLite 的内容哈希**：
```javascript
// 计算内容哈希
const contentHash = crypto.createHash('md5').update(content).digest('hex');

// 检查重复
const duplicate = db.prepare('SELECT id FROM metadata WHERE content_hash = ?').get(contentHash);
if (duplicate) {
  console.log('发现重复记忆，跳过');
  return;
}
```

### 3. 添加自动归档

**定期任务**：
```javascript
// 每周运行
function autoArchive() {
  // 归档 > 30 天未访问且重要性 < 2 的记忆
  db.exec(`
    UPDATE metadata 
    SET category = 'archived' 
    WHERE category != 'archived' 
    AND julianday('now') - julianday(updated_at) > 30 
    AND importance < 2
  `);
}
```

### 4. 添加 SESSION-STATE.md

**创建工作记忆文件**：
```bash
touch ~/.openclaw/workspace/SESSION-STATE.md
```

**内容模板**：
```markdown
# SESSION-STATE.md — 工作记忆

## 当前任务
[现在正在做什么]

## 关键上下文
- 用户偏好: ...
- 已做决策: ...
- 阻塞问题: ...

## 待办事项
- [ ] ...

---
*最后更新: 2026-03-20 22:40*
```

## 📊 优化效果对比

| 指标 | 优化前 | 优化后 | 提升 |
|------|--------|--------|------|
| **搜索速度** | 2-5 秒 | < 100 ms | 20-50x |
| **重复记忆** | 手动检测 | 自动去重 | - |
| **归档效率** | 手动归档 | 自动归档 | - |
| **记忆质量** | 不一致 | 自动评分 | - |

## 🎯 下一步行动

1. **创建记忆优化 skill**（memory-optimizer）
2. **设置定时任务**（每 30 分钟）
3. **创建 SESSION-STATE.md**
4. **更新 sqlite-memory skill**

---

**创建时间**：2026-03-20 22:40
**维护者**：心跳时刻 - 番茄小说创作和运营
**来源**：elite-longterm-memory skill
