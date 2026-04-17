---
name: memory-optimizer
version: 2.0.0
description: "增强版记忆优化器，提供关键词搜索、混合搜索、自动记忆优化。支持零成本方案（本地 Embedding 模型）和向量搜索。"
author: 无何有
keywords: [memory, optimization, search, vector, sqlite, hybrid-search, semantic-search]
metadata:
  openclaw:
    emoji: "🧹"
    requires:
      npm:
        - better-sqlite3
      optional:
        - chromadb
        - @xenova/transformers
---

# 记忆优化器 V2.0 🧹

**增强版记忆优化器 - 混合搜索 + 自动优化**

## 核心能力

1. ✅ **混合搜索**（关键词 + 语义）⭐⭐⭐⭐⭐⭐⭐⭐
   - 简化版：关键词搜索（基于 SQLite）
   - 增强版：混合搜索（关键词 + 语义）
   - 更精准的检索

2. ✅ **自动记忆优化** ⭐⭐⭐⭐⭐⭐⭐⭐
   - 去重（内容哈希）
   - 归档（30天前的低质量记忆）
   - 评分（基于规则）
   - 清理（访问次数过多的低质量记忆）

3. ✅ **零成本方案** ⭐⭐⭐⭐⭐⭐⭐⭐
   - 简化版：无需额外依赖（仅 better-sqlite3）
   - 增强版：本地 Embedding 模型（@xenova/transformers）

4. ✅ **高性能** ⭐⭐⭐⭐⭐⭐⭐⭐
   - 关键词搜索： < 100 ms
   - 语义搜索：< 500 ms
   - 混合搜索：< 300 ms

---

## 快速开始

### 1. 简化版（零依赖）⭐⭐⭐⭐⭐

```bash
# 查看统计信息
node scripts/enhanced-memory-optimizer-simple.js --stats

# 关键词搜索
node scripts/enhanced-memory-optimizer-simple.js --search "浏览器自动化"

# 自动优化
node scripts/enhanced-memory-optimizer-simple.js --optimize

# 最近记忆
node scripts/enhanced-memory-optimizer-simple.js --recent

# 重要记忆
node scripts/enhanced-memory-optimizer-simple.js --important

# 分类查询
node scripts/enhanced-memory-optimizer-simple.js --category "breakthrough"
```

### 2. 增强版（向量搜索）⭐⭐⭐⭐⭐

```bash
# 安装依赖
npm install chromadb @xenova/transformers

# 混合搜索（关键词 + 语义）
node scripts/enhanced-memory-optimizer.js --hybrid-search "浏览器自动化"

# 向量搜索（语义搜索）
node scripts/enhanced-memory-optimizer.js --vector-search "番茄小说"

# 自动优化
node scripts/enhanced-memory-optimizer.js --optimize
```

---

## 功能对比

| 功能 | 简化版 | 增强版 |
|------|--------|--------|
| **关键词搜索** | ✅ | ✅ |
| **语义搜索** | ❌ | ✅ |
| **混合搜索** | ❌ | ✅ |
| **自动去重** | ✅ | ✅ |
| **自动归档** | ✅ | ✅ |
| **自动评分** | ✅ | ✅ |
| **自动清理** | ✅ | ✅ |
| **依赖** | better-sqlite3 | chromadb, @xenova/transformers, better-sqlite3 |

---

## 使用指南

### 简化版使用

```bash
# 查看统计信息
node scripts/enhanced-memory-optimizer-simple.js --stats

# 关键词搜索
node scripts/enhanced-memory-optimizer-simple.js --search "番茄"

# 最近记忆
node scripts/enhanced-memory-optimizer-simple.js --recent

# 重要记忆
node scripts/enhanced-memory-optimizer-simple.js --important

# 分类查询
node scripts/enhanced-memory-optimizer-simple.js --category "breakthrough"

# 标签查询
node scripts/enhanced-memory-optimizer-simple.js --tags "自动化"

# 自动优化
node scripts/enhanced-memory-optimizer-simple.js --optimize
```

### 增强版使用

```bash
# 查看统计信息
node scripts/enhanced-memory-optimizer.js --stats

# 向量搜索（语义搜索）
node scripts/enhanced-memory-optimizer.js --vector-search "浏览器自动化"

# 混合搜索（关键词 + 语义）
node scripts/enhanced-memory-optimizer.js --hybrid-search "番茄小说"

# 最近记忆
node scripts/enhanced-memory-optimizer.js --recent

# 重要记忆
node scripts/enhanced-memory-optimizer.js --important

# 分类查询
node scripts/enhanced-memory-optimizer.js --category "breakthrough"

# 自动优化
node scripts/enhanced-memory-optimizer.js --optimize
```

---

## 优化流程

### 简化版优化流程

```
1. 去重
   ↓
2. 评分（基于规则）
   ↓
3. 归档（30天前的低质量记忆）
   ↓
4. 清理（访问次数过多的低质量记忆）
   ↓
5. 生成报告
```

### 增强版优化流程

```
1. 去重（SQLite + 向量数据库）
   ↓
2. 评分（基于规则）
   ↓
3. 归档（30天前的低质量记忆）
   ↓
4. 清理（访问次数过多的低质量记忆）
   ↓
5. 生成报告
```

---

## 评分规则

### 简化版评分规则

| 规则 | 分数 |
|------|------|
| 默认分数 | 3 |
| 7天内创建 | +1 |
| 包含"突破"、"重要"等关键词 | +1 |
| 限制范围 | 1-5 |

### 增强版评分规则

| 规则 | 分数 |
|------|------|
| 默认分数 | 3 |
| 7天内创建 | +1 |
| 包含"突破"、"重要"等关键词 | +1 |
| 向量相似度高（> 0.8） | +1 |
| 限制范围 | 1-5 |

---

## 优化规则

### 去重规则

- **内容哈希相同**：合并为一个记忆，保留最新的
- **标题相同**：保留最新的，归档旧的
- **相似度高（> 0.95）**：合并为一个记忆（仅增强版）

### 归档规则

- **> 30 天未访问** + **重要性 < 3**：归档
- **> 60 天未访问** + **重要性 < 4**：归档
- **已归档 > 90 天**：删除（可选）

### 清理规则

- **无标签** + **内容 < 100 字**：删除
- **重要性 = 0** + **> 7 天**：删除
- **访问次数 > 100** + **重要性 < 2**：删除

---

## 定时任务

### 简化版定时任务

```bash
# 添加到 crontab
crontab -e

# 每周一早上 8:00 优化记忆
0 8 * * 1 cd ~/.openclaw/workspace && node scripts/enhanced-memory-optimizer-simple.js --optimize >> memory/logs/weekly-optimization.log 2>&1
```

### 增强版定时任务

```bash
# 添加到 crontab
crontab -e

# 每周一早上 8:00 优化记忆
0 8 * * 1 cd ~/.openclaw/workspace && node scripts/enhanced-memory-optimizer.js --optimize >> memory/logs/weekly-optimization.log 2>&1
```

---

## 性能对比

| 操作 | 简化版 | 增强版 |
|------|--------|--------|
| **关键词搜索** | < 100 ms | < 100 ms |
| **语义搜索** | - | < 500 ms |
| **混合搜索** | - | < 300 ms |
| **自动优化** | < 1 秒 | < 2 秒 |
| **统计信息** | < 50 ms | < 100 ms |

---

## 最佳实践

### 1. 定期优化（建议每周）

```bash
# 简化版
node scripts/enhanced-memory-optimizer-simple.js --optimize

# 增强版
node scripts/enhanced-memory-optimizer.js --optimize
```

### 2. 定期备份（建议每月）

```bash
cp memory.db memory-backup-$(date +%Y-%m-%d).db
```

### 3. 检查统计信息（建议每周）

```bash
# 简化版
node scripts/enhanced-memory-optimizer-simple.js --stats

# 增强版
node scripts/enhanced-memory-optimizer.js --stats
```

### 4. 查看优化报告

```bash
# 简化版
cat memory/logs/memory-optimization-*.md | tail -50

# 增强版
cat memory/logs/memory-optimization-*.md | tail -50
```

---

## 故障排查

### 问题1：数据库连接失败

**错误**：`SQLITE_CANTOPEN: unable to open database file`

**解决方案**：
```bash
# 初始化数据库
node skills/sqlite-memory/scripts/memory-schema.js
```

### 问题2：向量搜索失败

**错误**：`ChromaDB error: ...`

**解决方案**：
```bash
# 安装依赖
npm install chromadb @xenova/transformers

# 检查 ChromaDB 目录
ls -la memory/vectors/
```

### 问题3：搜索无结果

**可能原因**：
1. 数据库为空
2. 搜索词不匹配
3. 分类名称错误

**解决方案**：
```bash
# 检查统计信息
node scripts/enhanced-memory-optimizer-simple.js --stats

# 重新迁移数据
node skills/sqlite-memory/scripts/migrate-memories-to-db.js
```

### 问题4：优化失败

**可能原因**：
1. 数据库锁定
2. 权限不足

**解决方案**：
```bash
# 关闭所有数据库连接
lsof memory.db
kill -9 <PID>

# 重新运行优化
node scripts/enhanced-memory-optimizer-simple.js --optimize
```

---

## 与其他 Skill 的集成

### sqlite-memory

- **共享数据库**：`memory.db`
- **简化版优化**：基于 sqlite-memory
- **增强版优化**：在 sqlite-memory 基础上增加向量搜索

### elite-longterm-memory

- **借鉴思路**：WAL 协议、分层架构
- **简化版实现**：SQLite + 关键词搜索
- **增强版实现**：SQLite + ChromaDB + 混合搜索

---

## 未来计划

- [ ] 添加自动记忆写入（从对话中自动提取）
- [ ] 添加 Web UI
- [ ] 添加机器学习优化（自动学习评分规则）
- [ ] 添加多用户支持
- [ ] 添加分布式存储

---

## 相关文档

- **增强版记忆优化器使用指南**：`docs/enhanced-memory-optimizer-guide.md`
- **SQLite 记忆系统**：`skills/sqlite-memory/SKILL.md`
- **精英长期记忆系统**：`skills/elite-longterm-memory/SKILL.md`

---

**创建时间**：2026-03-28 14:00
**版本**：V2.0.0
**维护者**：无何有
