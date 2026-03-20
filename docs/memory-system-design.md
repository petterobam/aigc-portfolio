# 记忆系统升级设计

## 🎯 目标

将基于 Markdown 文件的记忆系统升级为 **SQLite + 向量数据库** 的混合系统，解决以下问题：
1. 搜索效率低（需要全文扫描）
2. 无法进行语义搜索
3. 记忆冗余和重复
4. 没有结构化的索引

## 🏗️ 系统架构

### 混合存储方案

```
记忆系统
├── SQLite 数据库（memory.db）
│   ├── metadata 表（记忆元数据）
│   │   ├── id (主键)
│   │   ├── title (标题)
│   │   ├── category (分类)
│   │   ├── tags (标签，JSON 数组)
│   │   ├── created_at (创建时间)
│   │   ├── updated_at (更新时间)
│   │   ├── file_path (原文件路径)
│   │   └── content_hash (内容哈希，用于去重)
│   │
│   └── content 表（记忆内容）
│       ├── id (主键)
│       ├── metadata_id (外键)
│       ├── content (完整内容)
│       ├── summary (摘要，用于快速预览)
│       └── keywords (关键词，JSON 数组)
│
├── 向量数据库（ChromaDB）
│   ├── collection: "memories"
│   ├── documents (记忆内容)
│   ├── embeddings (向量)
│   ├── metadatas (元数据)
│   └── ids (与 SQLite metadata.id 关联)
│
└── 原始文件（保留）
    ├── MEMORY.md（核心记忆，精简版）
    ├── memory/（日常记忆）
    └── memory/archive/（归档记忆）
```

### 技术栈

| 组件 | 技术 | 用途 |
|------|------|------|
| **结构化存储** | SQLite | 存储元数据、标签、时间戳 |
| **向量搜索** | ChromaDB | 语义搜索、相似记忆检索 |
| **嵌入模型** | sentence-transformers | 将文本转换为向量 |
| **脚本语言** | Node.js | 数据迁移和查询工具 |
| **备份** | Markdown 文件 | 人类可读的备份 |

## 📊 数据模型

### SQLite: metadata 表

```sql
CREATE TABLE metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'creation', 'operation', 'breakthrough', 'task'
  tags TEXT NOT NULL,      -- JSON array: ["番茄小说", "浏览器自动化"]
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  file_path TEXT,           -- 原文件路径（如果有）
  content_hash TEXT UNIQUE, -- 内容哈希，用于去重
  importance INTEGER DEFAULT 1  -- 重要程度: 1-5
);

CREATE INDEX idx_category ON metadata(category);
CREATE INDEX idx_created_at ON metadata(created_at);
CREATE INDEX idx_importance ON metadata(importance);
```

### SQLite: content 表

```sql
CREATE TABLE content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metadata_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,             -- 摘要（前 200 字）
  keywords TEXT,            -- JSON array: ["Playwright", "MCP", "browser_run_code"]
  FOREIGN KEY (metadata_id) REFERENCES metadata(id)
);

CREATE INDEX idx_metadata_id ON content(metadata_id);
```

### ChromaDB: memories collection

```python
collection = client.create_collection(
    name="memories",
    metadata={"description": "番茄小说创作和运营记忆"}
)

# 文档结构
{
    "documents": ["记忆内容..."],
    "embeddings": [[0.1, 0.2, ...]],  # 384维向量
    "metadatas": [{
        "title": "浏览器自动化技术突破",
        "category": "breakthrough",
        "tags": ["番茄小说", "浏览器自动化"],
        "created_at": "2026-03-20T12:00:00Z",
        "importance": 5
    }],
    "ids": ["1"]  # 与 SQLite metadata.id 关联
}
```

## 🔄 工作流程

### 1. 记忆写入流程

```
用户/Agent 创建记忆
    ↓
提取关键信息（标题、分类、标签）
    ↓
计算内容哈希
    ↓
检查是否重复（SQLite: content_hash）
    ↓
├── 重复 → 更新时间戳，跳过
└── 不重复 → 继续
    ↓
    保存到 SQLite（metadata + content）
    ↓
    生成向量（sentence-transformers）
    ↓
    保存到 ChromaDB
    ↓
    同步到 Markdown 文件（可选）
```

### 2. 记忆搜索流程

```
用户查询（"浏览器自动化"）
    ↓
┌── 关键词搜索 → SQLite LIKE 查询
│   ↓
│   返回匹配的记忆列表
│
└── 语义搜索 → ChromaDB 向量搜索
    ↓
    返回相似的记忆列表
    ↓
合并结果，按相关度排序
    ↓
返回给用户/Agent
```

### 3. 记忆优化流程

```
定期任务（每周）
    ↓
扫描所有记忆
    ↓
├── 识别重复内容（向量相似度 > 0.95）
│   ↓
│   合并重复记忆
│
├── 识别过期记忆（> 30 天未访问）
│   ↓
│   降低重要性或归档
│
└── 识别低质量记忆（无标签、内容过短）
    ↓
    标记需要优化
    ↓
生成优化报告
```

## 🛠️ 实现计划

### 阶段 1: 基础设施（1天）

1. **安装依赖**
   ```bash
   npm install better-sqlite3 chromadb sentence-transformers
   ```

2. **创建数据库模式**
   - `scripts/memory-schema.js` - 创建 SQLite 表

3. **初始化 ChromaDB**
   - `scripts/init-chromadb.js` - 创建 collection

### 阶段 2: 数据迁移（1天）

1. **迁移现有记忆**
   - `scripts/migrate-memories.js` - 从 Markdown 迁移到数据库

2. **生成向量**
   - `scripts/generate-embeddings.js` - 为所有记忆生成向量

3. **验证迁移**
   - 对比原始文件和数据库内容

### 阶段 3: 查询接口（1天）

1. **创建查询工具**
   - `scripts/query-memory.js` - 统一查询接口

2. **集成到 OpenClaw**
   - 更新 `memory_search` 和 `memory_get` 工具

3. **创建 Web UI**（可选）
   - 简单的记忆浏览器

### 阶段 4: 优化和维护（持续）

1. **定期优化任务**
   - 每周运行记忆优化

2. **监控和报警**
   - 监控数据库大小
   - 监控查询性能

3. **备份策略**
   - 定期导出 Markdown
   - 数据库备份

## 📝 使用示例

### 1. 添加记忆

```javascript
const { addMemory } = require('./scripts/memory-manager');

await addMemory({
  title: "浏览器自动化技术突破",
  category: "breakthrough",
  tags: ["番茄小说", "浏览器自动化", "Playwright MCP"],
  content: "成功实现浏览器自动化...",
  importance: 5
});
```

### 2. 搜索记忆

```javascript
const { searchMemories } = require('./scripts/memory-manager');

// 关键词搜索
const results1 = await searchMemories({
  query: "浏览器自动化",
  mode: "keyword"
});

// 语义搜索
const results2 = await searchMemories({
  query: "如何解决连接断开的问题",
  mode: "semantic"
});

// 混合搜索
const results3 = await searchMemories({
  query: "Playwright MCP 长连接",
  mode: "hybrid"
});
```

### 3. 获取相关记忆

```javascript
const { getRelatedMemories } = require('./scripts/memory-manager');

const related = await getRelatedMemories({
  memoryId: 1,
  limit: 5
});
```

## 🎯 预期成果

### 性能提升

| 操作 | 当前（Markdown） | 优化后（SQLite+向量） | 提升 |
|------|-----------------|---------------------|------|
| **关键词搜索** | 2-5 秒 | < 100 ms | 20-50x |
| **语义搜索** | 不支持 | 100-300 ms | ∞ |
| **去重** | 手动 | 自动 | - |
| **分类查询** | 手动 | < 50 ms | - |

### 功能增强

- ✅ 语义搜索：可以根据含义查找记忆
- ✅ 自动去重：避免存储重复内容
- ✅ 智能推荐：自动推荐相关记忆
- ✅ 统计分析：了解记忆使用情况
- ✅ 定期优化：自动清理和优化记忆

### 可维护性

- ✅ 结构化存储：易于查询和管理
- ✅ 自动备份：保留 Markdown 文件作为备份
- ✅ 可扩展：易于添加新的记忆类型
- ✅ 可监控：清晰的性能指标

## 🚀 下一步

1. **立即开始**：
   - 创建 `scripts/memory-schema.js`
   - 创建 `scripts/init-memory-system.js`

2. **迁移数据**：
   - 运行迁移脚本
   - 验证数据完整性

3. **集成到 OpenClaw**：
   - 更新 memory_search 和 memory_get
   - 创建新的 memory_add 工具

4. **创建定期任务**：
   - 每周优化任务
   - 每日备份任务

---

**创建时间**：2026-03-20 21:47
**创建者**：心跳时刻 - 番茄小说创作和运营
**状态**：设计完成，待实施
