# 记忆系统设计文档

> 本文档描述记忆优化器的整体架构设计、数据模型与核心流程。
> 属于「知识库」性质——记录系统是什么、为什么这样设计。
> 可操作的规则和方法见 `memory-optimization-strategy.md`。

---

## 设计目标

1. **高效**：查询和写入不能成为工作区的性能瓶颈
2. **可靠**：误删一条有价值的记忆，比保留十条垃圾记忆代价更高
3. **自治**：优化过程无需人工干预，定时自动运行
4. **可观测**：每次运行都有完整的日志和报告，决策可追溯
5. **可扩展**：评分算法、归档规则可独立升级，不影响其他模块

---

## 整体架构

```
┌─────────────────────────────────────────────────────┐
│                   OpenClaw 工作区                    │
│                                                     │
│  ┌──────────────┐    ┌──────────────────────────┐   │
│  │  其他 Skills  │    │      memory-optimizer    │   │
│  │  (heartbeat  │───>│                          │   │
│  │   sqlite-    │    │  ┌────────┐ ┌─────────┐  │   │
│  │   memory 等) │    │  │ 评分器 │ │ 归档器  │  │   │
│  └──────────────┘    │  └────────┘ └─────────┘  │   │
│                      │  ┌────────┐ ┌─────────┐  │   │
│  ┌──────────────┐    │  │ 去重器 │ │ 清理器  │  │   │
│  │  memory.db   │<──>│  └────────┘ └─────────┘  │   │
│  │  (SQLite)    │    │         ↓                 │   │
│  └──────────────┘    │  ┌──────────────────┐    │   │
│                      │  │   报告生成器      │    │   │
│                      │  └──────────────────┘    │   │
│                      └──────────────────────────┘   │
│                              ↓          ↓            │
│                        logs/        reports/         │
└─────────────────────────────────────────────────────┘
```

---

## 数据模型

### memory.db 表结构

记忆优化器直接操作 `memory.db`，与 `sqlite-memory` skill 共享同一数据库。

#### metadata 表（记忆元数据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 记忆唯一标识 |
| title | TEXT | 记忆标题（用于展示和去重） |
| category | TEXT | 分类（active / archived / protected） |
| tags | TEXT (JSON) | 标签数组，序列化为 JSON 字符串 |
| importance | REAL | 重要性评分（由优化器计算并更新） |
| access_count | INTEGER | 被访问的次数 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 最后更新时间（用于计算时效性） |

#### content 表（记忆内容）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER PRIMARY KEY | 内容唯一标识 |
| metadata_id | INTEGER (FK) | 关联 metadata.id |
| content | TEXT | 记忆的完整文本内容 |

> 设计说明：metadata 与 content 分表，是为了在不加载大文本的情况下快速扫描所有记忆的元信息，提升优化器的扫描效率。

#### 索引设计

```sql
-- 按更新时间查询（归档判断的核心索引）
CREATE INDEX IF NOT EXISTS idx_metadata_updated_at ON metadata(updated_at);

-- 按分类查询（区分活跃/归档记忆）
CREATE INDEX IF NOT EXISTS idx_metadata_category ON metadata(category);

-- 按重要性排序（高重要性记忆优先展示）
CREATE INDEX IF NOT EXISTS idx_metadata_importance ON metadata(importance DESC);
```

---

## 核心模块设计

### 1. 评分器（Importance Scorer）

**职责**：为每条记忆计算一个 0~10 的重要性分数，作为归档、保留、删除决策的依据。

**输入**：metadata + content 的原始数据
**输出**：更新 metadata.importance 字段

**评分公式**：

```
importance = (访问频率  × 0.4)
           + (时效性    × 0.3)
           + (内容质量  × 0.2)
           + (关联度    × 0.1)
```

各维度计算方式：

| 维度 | 计算方式 | 含义 |
|------|---------|------|
| 访问频率 | access_count / max(1, age_days) | 越常被访问，越重要 |
| 时效性 | 1 / max(1, days_since_last_access) | 越近期访问的，越重要 |
| 内容质量 | min(1, content_length / 1000) | 内容越丰富，质量越高 |
| 关联度 | reference_count × 0.1 | 被其他记忆引用越多，越重要 |

**更新策略**：只有当新评分与旧评分差值 > 0.5 时才写入数据库，避免频繁小幅更新。

---

### 2. 去重器（Deduplicator）

**职责**：识别内容完全相同或高度相似的记忆，合并或标记。

**当前实现**：内容 MD5 哈希匹配（精确去重）

**输入**：所有活跃记忆的 content
**输出**：重复记忆对列表（original, duplicate）

**处理逻辑**：

```
对每条记忆计算 MD5(content)
    ↓
若哈希值在 hashMap 中已存在
    → 标记为重复，加入 duplicates 列表
    → hashMap 中保留较早的一条（original）
    ↓
若哈希值不存在
    → 存入 hashMap
```

**当前局限**：
- 只能识别内容完全相同的记忆（精确哈希）
- 无法识别语义相同但表述不同的记忆
- 发现重复后只报告，不自动合并（避免误操作）

**未来演进方向**：引入向量相似度（余弦相似度 > 0.95 视为重复）

---

### 3. 归档器（Archiver）

**职责**：将超过时效且重要性低的记忆从活跃状态转为归档状态。

**触发条件**（同时满足）：
- `days_since_last_access > archiveAfterDays`（默认 30 天）
- `importance < minImportance`（默认 2）
- 标签中不包含 `protected`

**操作**：将 `metadata.category` 从 `active` 更新为 `archived`，不删除数据。

**设计原则**：归档是软操作，可以随时通过 SQL 恢复。删除才是不可逆的，因此默认不启用自动删除（`deleteArchived: false`）。

---

### 4. 清理器（Cleaner）

**职责**：删除质量极低、无任何保留价值的记忆。

**触发条件**（同时满足，且 `deleteArchived: true`）：
- `content_length < minContentLength`（默认 50 字符）
- `importance < 1`
- 标签中不包含 `protected`

**操作**：同时删除 `metadata` 和 `content` 表中的对应行。

> 警告：清理器是唯一执行不可逆操作的模块。生产环境建议保持 `deleteArchived: false`，并确保备份机制已就位后再启用。

---

### 5. 报告生成器（Report Generator）

**职责**：将本次优化的统计数据序列化为 JSON 报告，并生成改进建议。

**输出路径**：`data/memory-optimization-report.json`（自动覆盖）

**报告结构**：

```json
{
  "timestamp": "ISO 8601 时间戳",
  "config": { "...当前生效的配置参数..." },
  "stats": {
    "totalProcessed": 0,
    "archived": 0,
    "deleted": 0,
    "protected": 0,
    "duplicate": 0,
    "importanceUpdated": 0
  },
  "summary": {
    "optimizationRate": "0.00%"
  },
  "recommendations": [
    { "type": "info | warning | error", "message": "..." }
  ]
}
```

---

## 执行流程

```
启动 optimize.js
    ↓
连接 memory.db
    ↓
查询所有 category != 'archived' 的记忆
    ↓
┌── 去重器：计算内容哈希，识别重复记忆
├── 评分器：计算重要性评分，更新 metadata.importance
├── 归档器：对符合条件的记忆执行归档
└── 清理器：（仅 deleteArchived=true 时）删除低质量记忆
    ↓
报告生成器：汇总统计，写入 JSON 报告
    ↓
控制台输出摘要
    ↓
关闭数据库连接
```

---

## 与其他 Skill 的边界

| Skill | 关系 | 说明 |
|-------|------|------|
| sqlite-memory | 共享数据库 | 读写同一个 memory.db，注意并发写入冲突 |
| heartbeat | 触发方 | heartbeat 心跳时可主动调用优化器 |
| opencli-skill | 无直接依赖 | 优化器不需要浏览器能力 |

**并发安全**：SQLite 使用 WAL 模式，支持多读单写，optimize.js 在写入时会短暂锁表。正常情况下不会产生冲突，但不建议同时运行多个优化器实例。

---

## 备份策略

| 时机 | 操作 | 存放路径 |
|------|------|---------|
| 每次优化前（建议） | 复制 memory.db | `data/backups/memory-YYYYMMDD.db` |
| 每周一次（建议） | 完整备份 | 同上 |
| 启用 deleteArchived 前 | 强制备份 | 同上，标注"删除前备份" |

备份命令：

```bash
cp ~/.openclaw/workspace/memory.db \
   ~/.openclaw/workspace/data/backups/memory-$(date +%Y%m%d).db
```

---

## 已知设计局限

| 局限 | 影响 | 计划改进 |
|------|------|---------|
| 只有精确哈希去重 | 语义重复无法识别 | 引入向量相似度（见 task-list.md #2） |
| 无自动标签提取 | 无标签记忆评分偏低 | 关键词提取（见 task-list.md #4） |
| 无 Web UI | 只能命令行查看报告 | 长期目标（见 task-list.md #6） |
| 无云备份 | 本地数据存在丢失风险 | 长期目标（见 task-list.md #8） |

---

**创建时间**：初始版本
**维护者**：心跳时刻 - 记忆优化器
**版本**：v1.0
**关联文档**：
- `memory-optimization-strategy.md`（策略与规则）
- `memory-system-guide.md`（使用指南）
- `../SKILL.md`（技术规范）