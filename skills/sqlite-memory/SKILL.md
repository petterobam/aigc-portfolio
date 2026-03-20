---
name: sqlite-memory
version: 1.0.0
description: "基于 SQLite 的轻量级记忆系统，提供高效的记忆存储和检索功能。支持关键词搜索、分类查询、自动优化。"
author: 心跳时刻 - 番茄小说创作和运营
keywords: [memory, sqlite, 搜索, 优化, 番茄小说]
metadata:
  openclaw:
    emoji: "🧠"
    requires:
      npm:
        - better-sqlite3
---

# SQLite 记忆系统 🧠

**轻量级、高性能的记忆管理系统**

基于 SQLite 的混合记忆系统，提供高效的记忆存储和检索功能。

## 架构概览

```
┌─────────────────────────────────────────────────────────────────┐
│                    SQLITE 记忆系统                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   原始文件  │  │ SQLite 数据库 │  │  查询工具   │             │
│  │             │  │             │  │             │             │
│  │ MEMORY.md   │  │  metadata   │  │  关键词搜索 │             │
│  │ memory/     │  │  content    │  │  分类查询   │             │
│  │             │  │  access_log │  │  统计信息   │             │
│  │ (人类可读)  │  │  opt_log    │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          ▼                                      │
│                  ┌─────────────┐                                │
│                  │  优化工具   │  ← 定期优化、去重、归档        │
│                  └─────────────┘                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 初始化数据库

```bash
node scripts/memory-schema.js
```

### 2. 迁移现有记忆

```bash
node scripts/migrate-memories-to-db.js
```

### 3. 查询记忆

```bash
# 关键词搜索
node scripts/query-memory.js --search="浏览器自动化"

# 按分类查询
node scripts/query-memory.js --category="breakthrough"

# 最近记忆
node scripts/query-memory.js --recent

# 重要记忆
node scripts/query-memory.js --important

# 统计信息
node scripts/query-memory.js --stats
```

### 4. 优化记忆

```bash
node scripts/optimize-memory.js
```

## 数据库结构

### metadata 表（记忆元数据）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| title | TEXT | 标题 |
| category | TEXT | 分类（breakthrough/creation/operation/task/general/archived） |
| tags | TEXT | 标签（JSON 数组） |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| file_path | TEXT | 原文件路径 |
| content_hash | TEXT | 内容哈希（用于去重） |
| importance | INTEGER | 重要程度（1-5） |
| access_count | INTEGER | 访问次数 |

### content 表（记忆内容）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| metadata_id | INTEGER | 外键（关联 metadata.id） |
| content | TEXT | 完整内容 |
| summary | TEXT | 摘要（前 200 字） |
| keywords | TEXT | 关键词（JSON 数组） |

### access_log 表（访问日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| memory_id | INTEGER | 外键（关联 metadata.id） |
| access_at | DATETIME | 访问时间 |
| access_type | TEXT | 访问类型（search/read/write） |

### optimization_log 表（优化日志）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键 |
| optimization_at | DATETIME | 优化时间 |
| memories_processed | INTEGER | 处理的记忆数 |
| memories_merged | INTEGER | 合并的记忆数 |
| memories_archived | INTEGER | 归档的记忆数 |
| memories_deleted | INTEGER | 删除的记忆数 |
| report | TEXT | 优化报告 |

## 记忆分类

| 分类 | 说明 | 示例 |
|------|------|------|
| **breakthrough** | 重大技术突破 | 浏览器自动化技术突破 |
| **creation** | 创作相关 | 开篇模板库、创作方法论 |
| **operation** | 运营相关 | 数据采集、发布策略 |
| **task** | 任务相关 | 待办事项、计划任务 |
| **general** | 一般记忆 | 日常记录 |
| **archived** | 归档记忆 | 30天前的记忆 |

## 重要程度

| 级别 | 说明 | 示例 |
|------|------|------|
| **5** | 重大突破 | 解决核心问题 |
| **4** | 重要 | 高优先级任务 |
| **3** | 中等 | 待解决问题 |
| **2** | 一般 | 日常记录 |
| **1** | 低 | 临时信息 |

## 性能对比

| 操作 | Markdown（旧） | SQLite（新） | 提升 |
|------|---------------|-------------|------|
| **关键词搜索** | 2-5 秒 | < 100 ms | 20-50x |
| **分类查询** | 手动 | < 50 ms | - |
| **去重** | 手动 | 自动 | - |
| **统计** | 手动 | < 50 ms | - |

## 最佳实践

### 1. 定期优化（建议每周）

```bash
node scripts/optimize-memory.js
```

### 2. 定期备份（建议每月）

```bash
cp memory.db memory-backup-$(date +%Y-%m-%d).db
```

### 3. 检查统计信息（建议每周）

```bash
node scripts/query-memory.js --stats
```

## 维护指南

### 每周任务

1. **运行记忆优化**
   ```bash
   node scripts/optimize-memory.js
   ```

2. **检查统计信息**
   ```bash
   node scripts/query-memory.js --stats
   ```

3. **清理低质量记忆**
   - 无标签的记忆
   - 内容过短的记忆
   - 过期的临时信息

### 每月任务

1. **备份记忆数据库**
   ```bash
   cp memory.db memory-backup-$(date +%Y-%m-%d).db
   ```

2. **导出重要记忆**
   ```bash
   node scripts/query-memory.js --important > important-memories.md
   ```

3. **归档极旧记忆**
   - 归档 > 30 天的记忆
   - 清理数据库

## 故障排查

### 问题 1: 数据库锁定

**错误**：`SQLITE_BUSY: database is locked`

**解决方案**：
```bash
# 关闭所有数据库连接
lsof memory.db
kill -9 <PID>
```

### 问题 2: 查询无结果

**可能原因**：
1. 数据库为空
2. 搜索词不匹配
3. 分类名称错误

**解决方案**：
```bash
# 检查统计信息
node scripts/query-memory.js --stats

# 重新迁移数据
node scripts/migrate-memories-to-db.js
```

### 问题 3: 重复记忆

**解决方案**：
```bash
# 运行优化脚本（自动去重）
node scripts/optimize-memory.js
```

## 技术文档

- **系统设计**：`~/.openclaw/workspace/docs/memory-system-design.md`
- **使用指南**：`~/.openclaw/workspace/docs/memory-system-guide.md`

## 与 elite-longterm-memory 的区别

| 特性 | sqlite-memory | elite-longterm-memory |
|------|--------------|---------------------|
| **数据库** | SQLite | LanceDB (向量数据库) |
| **搜索** | 关键词搜索 | 语义搜索（需要 OPENAI_API_KEY） |
| **依赖** | better-sqlite3 | 多个依赖（LanceDB、OpenAI API） |
| **复杂度** | 简单 | 复杂 |
| **适用场景** | 轻量级、快速部署 | 高级语义搜索 |

## 未来计划

- [ ] 添加向量搜索支持（可选）
- [ ] 集成到 OpenClaw 主系统
- [ ] 自动记忆写入
- [ ] Web UI

---

**创建时间**：2026-03-20 22:05
**维护者**：心跳时刻 - 番茄小说创作和运营
**版本**：v1.0.0
