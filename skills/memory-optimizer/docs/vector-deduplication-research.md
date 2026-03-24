# 向量搜索去重技术调研

> 本文档记录记忆优化器向量搜索去重方案的技术调研结果。
> 目标：识别语义相似但不完全相同的记忆，提升去重准确率。

---

## 调研背景

**当前问题**：
- 去重器仅基于内容 MD5 哈希，只能识别内容完全相同的记忆
- 无法识别语义相同但表述不同的重复记忆（如两条记忆都是"爽点公式库"）
- 随着记忆数量增长，语义重复会降低检索效率

**目标**：
- 引入语义相似度检测，识别内容相似的记忆
- 相似度阈值 > 0.95 时标记为重复
- 支持人工确认后合并，避免误操作

**调研时间**：2026-03-21
**调研人**：记忆优化器

---

## 技术方案对比

### 方案一：SQLite FTS5 + 本地向量化

#### 技术栈
- **SQLite FTS5**：SQLite 内置全文搜索扩展
- **本地向量化**：使用 Node.js 库（如 `node-transformers`、`onnxruntime-node`）
- **相似度计算**：余弦相似度

#### 实现方式

```javascript
// 1. 初始化本地模型
import { pipeline } from '@xenova/transformers';

const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

// 2. 生成向量
const embeddings = await extractor(memory.content, {
  pooling: 'mean',
  normalize: true
});

// 3. 存储向量到 SQLite（JSON 格式）
db.run('UPDATE content SET embedding = ? WHERE id = ?', [JSON.stringify(embeddings), id]);

// 4. 计算相似度
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

#### 优点
- ✅ **零 API 成本**：本地运行，无需调用外部 API
- ✅ **隐私安全**：记忆数据不离开本地
- ✅ **无额外依赖**：利用现有 SQLite，只需安装一个 Node.js 库
- ✅ **离线可用**：不依赖网络连接

#### 缺点
- ❌ **性能较差**：本地模型推理速度慢（每条记忆约 100-500ms）
- ❌ **模型质量一般**：开源模型效果不如 OpenAI Embeddings
- ❌ **向量存储冗余**：SQLite 存储 JSON 数组，效率低
- ❌ **内存占用高**：加载模型需要 200-500MB 内存

#### 适用场景
- 记忆数量 < 1000 条
- 对隐私要求极高
- 运行环境受限（无 GPU）

#### 成本估算
- 开发成本：2-3 天
- 运行成本：零（本地运行）
- 时间成本：1000 条记忆约需 100-500 秒

---

### 方案二：OpenAI Embeddings + 自建向量索引

#### 技术栈
- **OpenAI Embeddings**：`text-embedding-3-small` 或 `text-embedding-3-large`
- **SQLite 存储**：向量存储为 JSON 或 BLOB
- **相似度计算**：自定义余弦相似度函数

#### 实现方式

```javascript
// 1. 调用 OpenAI Embeddings API
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const response = await openai.embeddings.create({
  model: 'text-embedding-3-small',
  input: memory.content,
  dimensions: 1536
});

const embedding = response.data[0].embedding;

// 2. 存储到 SQLite
db.run('UPDATE content SET embedding = ? WHERE id = ?', [JSON.stringify(embedding), id]);

// 3. 批量计算相似度
async function findSimilarMemories(targetEmbedding, threshold = 0.95) {
  const allMemories = db.prepare('SELECT id, embedding FROM content').all();

  const similar = [];
  for (const mem of allMemories) {
    const embedding = JSON.parse(mem.embedding);
    const similarity = cosineSimilarity(targetEmbedding, embedding);

    if (similarity > threshold) {
      similar.push({ id: mem.id, similarity });
    }
  }

  return similar.sort((a, b) => b.similarity - a.similarity);
}
```

#### 优点
- ✅ **模型质量高**：OpenAI Embeddings 效果领先
- ✅ **API 简单**：调用接口简单，易于集成
- ✅ **向量质量稳定**：版本稳定，不会出现模型兼容性问题
- ✅ **性能较好**：API 调用速度约 200-500ms/次

#### 缺点
- ❌ **API 成本**：每次调用有费用
- ❌ **网络依赖**：需要稳定的网络连接
- ❌ **数据隐私**：记忆内容需要发送到 OpenAI
- ❌ **效率低**：全量扫描计算相似度，无索引加速

#### 适用场景
- 记忆数量 < 5000 条
- 对去重准确率要求高
- 有 API 预算

#### 成本估算
- 开发成本：2 天
- API 成本：
  - `text-embedding-3-small`：$0.00002/1K tokens
  - 1000 条记忆（平均 500 tokens）：$0.01
  - 5000 条记忆：$0.05
- 时间成本：1000 条记忆约需 200-500 秒

---

### 方案三：OpenAI Embeddings + LanceDB

#### 技术栈
- **OpenAI Embeddings**：`text-embedding-3-small`
- **LanceDB**：高性能向量数据库
- **HNSW 索引**：加速相似度搜索

#### 实现方式

```javascript
import * as lancedb from '@lancedb/lancedb';
import OpenAI from 'openai';

// 1. 连接 LanceDB
const db = await lancedb.connect('./data/lancedb');

// 2. 创建表
const table = await db.createTable('memories', [
  { id: 1, content: '...', vector: [...] }
]);

// 3. 插入向量
await table.add([{
  id: memory.id,
  content: memory.content,
  vector: await generateEmbedding(memory.content)
}]);

// 4. 相似度搜索
const results = await table.search(targetVector)
  .limit(10)
  .distanceType('cosine')
  .toArray();

// 过滤相似度 > 0.95 的结果
const similar = results.filter(r => 1 - r.distance > 0.95);
```

#### 优点
- ✅ **高性能**：HNSW 索引加速搜索，毫秒级响应
- ✅ **可扩展**：支持百万级向量，适合大规模场景
- ✅ **API 简洁**：LanceDB API 设计优雅，易于使用
- ✅ **持久化**：向量独立存储，不影响主库性能
- ✅ **支持过滤**：可按类别、标签等条件过滤后再搜索

#### 缺点
- ❌ **API 成本**：需要调用 OpenAI Embeddings
- ❌ **额外依赖**：需要安装 LanceDB（约 20MB）
- ❌ **数据同步**：需要保持 SQLite 和 LanceDB 数据一致性
- ❌ **存储开销**：向量单独存储，占用额外空间

#### 适用场景
- 记忆数量 > 5000 条
- 需要高性能搜索
- 长期规划大规模扩展

#### 成本估算
- 开发成本：3-4 天（需要处理数据同步逻辑）
- API 成本：与方案二相同
- 存储成本：
  - 1000 条记忆：约 6MB（1536 维 × 4 字节 × 1000）
  - 5000 条记忆：约 30MB
  - HNSW 索引：额外约 1.5 倍空间
- 时间成本：
  - 初始向量化：200-500 秒
  - 搜索：毫秒级

---

### 方案四：SQLite + pgvector（备选）

#### 技术栈
- **PostgreSQL**：替代 SQLite 作为主数据库
- **pgvector**：PostgreSQL 向量扩展
- **本地向量化或 OpenAI Embeddings**

#### 优点
- ✅ **一体化**：向量和数据在同一个数据库
- ✅ **事务支持**：向量操作有事务保护
- ✅ **成熟稳定**：PostgreSQL 生态成熟

#### 缺点
- ❌ **架构重构**：需要从 SQLite 迁移到 PostgreSQL
- ❌ **部署复杂**：PostgreSQL 比 SQLite 重
- ❌ **过度设计**：当前规模不需要

#### 适用场景
- 记忆数量 > 100,000 条
- 需要复杂事务
- 已有 PostgreSQL 基础设施

#### 成本估算
- 开发成本：5-7 天（迁移 + 重构）
- 不建议当前阶段采用

---

## 方案推荐

### 当前阶段（记忆数量 < 5000）

**推荐：方案二 - OpenAI Embeddings + 自建向量索引**

**理由**：
1. **平衡性最好**：在成本、性能、开发难度之间取得最佳平衡
2. **准确率高**：OpenAI Embeddings 质量领先，语义识别能力强
3. **成本低**：1000 条记忆仅需 $0.01，可忽略不计
4. **易于实现**：2 天可完成开发和测试
5. **可渐进式演进**：未来可平滑迁移到 LanceDB

**实施路径**：
1. Phase 1：实现基础的 OpenAI Embeddings 集成（全量计算相似度）
2. Phase 2：优化性能，缓存向量，避免重复计算
3. Phase 3：如果性能不足，迁移到 LanceDB

### 未来阶段（记忆数量 > 5000）

**推荐：方案三 - OpenAI Embeddings + LanceDB**

**理由**：
1. **高性能**：HNSW 索引加速搜索，支持大规模场景
2. **可扩展**：支持百万级向量
3. **长期规划**：适合长期演进

---

## 技术细节

### 相似度阈值选择

| 阈值 | 含义 | 适用场景 |
|------|------|---------|
| > 0.99 | 几乎相同 | 自动合并，无需人工确认 |
| > 0.95 | 高度相似 | 人工确认后合并（推荐） |
| > 0.90 | 相似 | 标记为相关，不合并 |
| < 0.90 | 不相似 | 无需处理 |

**推荐阈值**：0.95

理由：0.95 能准确识别语义重复，同时避免误判。低于 0.90 可能产生过多误判。

### 向量维度选择

OpenAI Embeddings 提供两种模型：

| 模型 | 维度 | 性能 | 价格 | 推荐 |
|------|------|------|------|------|
| text-embedding-3-small | 1536 | 高 | $0.00002/1K tokens | ✅ 推荐 |
| text-embedding-3-large | 3072 | 极高 | $0.00013/1K tokens | 不推荐 |

**推荐**：text-embedding-3-small

理由：性能已经足够好，价格便宜 6.5 倍，维度适中（1536 维）。

### 缓存策略

避免每次运行都重新计算向量：

```javascript
// 在 content 表中增加 embedding 字段
ALTER TABLE content ADD COLUMN embedding BLOB;

// 检查是否已有向量
if (!memory.embedding) {
  memory.embedding = await generateEmbedding(memory.content);
  db.run('UPDATE content SET embedding = ? WHERE id = ?', [
    JSON.stringify(memory.embedding),
    memory.id
  ]);
}
```

**缓存更新时机**：
1. 新记忆插入时
2. 记忆内容更新时
3. 手动刷新时（--refresh-embeddings 参数）

---

## 实施计划

### Phase 1：基础实现（2 天）

**目标**：实现基础的 OpenAI Embeddings 集成

**任务**：
- [ ] 配置 OpenAI API Key
- [ ] 实现向量化函数（generateEmbedding）
- [ ] 实现余弦相似度计算（cosineSimilarity）
- [ ] 实现相似记忆搜索（findSimilarMemories）
- [ ] 集成到去重器（Deduplicator）
- [ ] 测试去重效果

**验收标准**：
- 能准确识别语义重复记忆
- 相似度计算准确
- 性能可接受（1000 条记忆 < 10 分钟）

### Phase 2：优化与缓存（1 天）

**目标**：优化性能，避免重复计算

**任务**：
- [ ] 在 content 表增加 embedding 字段
- [ ] 实现向量缓存逻辑
- [ ] 实现增量更新（只计算新增/更新的记忆）
- [ ] 增加向量刷新命令（--refresh-embeddings）
- [ ] 性能测试与调优

**验收标准**：
- 向量缓存生效
- 增量更新正确
- 第二次运行时间 < 第一次的 20%

### Phase 3：LanceDB 迁移（可选，3 天）

**目标**：如果性能不足，迁移到 LanceDB

**触发条件**：
- 记忆数量 > 5000 条
- 全量扫描时间 > 30 分钟

**任务**：
- [ ] 安装 LanceDB 依赖
- [ ] 设计数据同步逻辑（SQLite ↔ LanceDB）
- [ ] 实现向量存储到 LanceDB
- [ ] 实现 LanceDB 搜索
- [ ] 测试性能提升
- [ ] 文档更新

**验收标准**：
- LanceDB 搜索 < 1 秒
- 数据同步正确
- 性能提升 > 10 倍

---

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| OpenAI API 不可用 | 中 | 低 | 降级到哈希去重 |
| API 成本超出预期 | 低 | 低 | 设置月度预算上限 |
| 向量存储占用空间大 | 低 | 低 | 定期清理重复记忆 |
| 误判导致有价值记忆被合并 | 高 | 低 | 人工确认机制 + protected 标签 |
| 性能不足 | 中 | 低 | 迁移到 LanceDB |

---

## 结论

**推荐方案**：OpenAI Embeddings + 自建向量索引（方案二）

**理由**：
1. 平衡性最好：成本、性能、开发难度适中
2. 准确率高：OpenAI Embeddings 质量领先
3. 成本低：1000 条记忆仅需 $0.01
4. 易于实现：2 天可完成
5. 可扩展：未来可平滑迁移到 LanceDB

**实施路径**：
1. 先实现 Phase 1（基础功能）
2. 观察性能和成本
3. 如果需要，再实施 Phase 2（缓存优化）
4. 未来如果规模增长，再考虑 Phase 3（LanceDB）

**预估总成本**：
- 开发成本：2-3 天
- API 成本：$0.01-0.05（1000-5000 条记忆）
- 存储成本：约 6-30MB（向量存储）

---

**维护者**：心跳时刻 - 记忆优化器
**创建时间**：2026-03-21
**关联任务**：tasks/task-list.md #2
