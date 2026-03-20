# 记忆系统使用指南

## 🎯 系统概述

基于 **SQLite + 向量数据库** 的混合记忆系统，提供高效的记忆存储和检索功能。

## 📊 系统架构

```
记忆系统
├── SQLite 数据库（memory.db）
│   ├── metadata 表（记忆元数据）
│   ├── content 表（记忆内容）
│   ├── access_log 表（访问日志）
│   └── optimization_log 表（优化日志）
│
├── 原始文件（保留）
│   ├── MEMORY.md（核心记忆，精简版）
│   ├── memory/（日常记忆）
│   └── memory/archive/（归档记忆）
│
└── 工具脚本
    ├── scripts/memory-schema.js（数据库模式）
    ├── scripts/migrate-memories-to-db.js（数据迁移）
    ├── scripts/query-memory.js（查询工具）
    └── scripts/optimize-memory.js（优化工具）
```

## 🚀 快速开始

### 1. 查询记忆

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

### 2. 搜索记忆

**支持两种搜索模式**：
1. **关键词搜索**：基于 SQL LIKE 查询
2. **语义搜索**：（待实现）基于向量相似度

### 3. 优化记忆

```bash
# 运行记忆优化
node scripts/optimize-memory.js
```

## 📝 记忆分类

| 分类 | 说明 | 示例 |
|------|------|------|
| **breakthrough** | 重大技术突破 | 浏览器自动化技术突破 |
| **creation** | 创作相关 | 开篇模板库、创作方法论 |
| **operation** | 运营相关 | 数据采集、发布策略 |
| **task** | 任务相关 | 待办事项、计划任务 |
| **general** | 一般记忆 | 日常记录 |
| **archived** | 归档记忆 | 30天前的记忆 |

## ⭐ 重要程度

| 级别 | 说明 | 示例 |
|------|------|------|
| **5** | 重大突破 | 解决核心问题 |
| **4** | 重要 | 高优先级任务 |
| **3** | 中等 | 待解决问题 |
| **2** | 一般 | 日常记录 |
| **1** | 低 | 临时信息 |

## 📊 统计信息

**当前记忆数量**：15 条

**按分类统计**：
- creation: 7 条
- archived: 3 条
- breakthrough: 2 条
- general: 1 条
- operation: 1 条
- task: 1 条

**数据库大小**：172 KB

## 🔄 工作流程

### 记忆写入流程

```
1. 创建 Markdown 文件（MEMORY.md 或 memory/YYYY-MM-DD.md）
2. 运行迁移脚本（自动或手动）
   node scripts/migrate-memories-to-db.js
3. 数据自动去重（通过 content_hash）
4. 提取标题、分类、标签
5. 保存到数据库
```

### 记忆查询流程

```
1. 确定查询方式（关键词/分类/时间/重要程度）
2. 运行查询脚本
   node scripts/query-memory.js --search="关键词"
3. 查看查询结果
4. 根据需要访问原始文件
```

### 记忆优化流程

```
1. 定期运行优化脚本（建议每周一次）
   node scripts/optimize-memory.js
2. 自动归档旧记忆（> 7天）
3. 识别重复内容
4. 生成优化报告
```

## 🛠️ 维护指南

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

## 🎯 最佳实践

### 1. 记忆命名规范

```
memory/
├── 2026-03-20.md              # 日常记忆
├── 2026-03-19-summary.md      # 总结
└── archive/                   # 归档
    ├── 2026-03-06.md
    └── ...
```

### 2. 记忆内容规范

```markdown
# 标题（清晰明确）

## 背景
为什么需要这个记忆？

## 内容
具体内容...

## 下一步
下一步要做什么？
```

### 3. 标签使用规范

- 使用常见标签：番茄小说、浏览器自动化、Playwright、MCP、记忆系统
- 避免使用过于具体的标签
- 保持标签的一致性

### 4. 重要程度规范

- **5**: 重大突破，解决核心问题
- **4**: 重要，高优先级
- **3**: 中等，待解决
- **2**: 一般，日常记录
- **1**: 低，临时信息

## 📈 性能对比

| 操作 | Markdown（旧） | SQLite（新） | 提升 |
|------|---------------|-------------|------|
| **关键词搜索** | 2-5 秒 | < 100 ms | 20-50x |
| **分类查询** | 手动 | < 50 ms | - |
| **去重** | 手动 | 自动 | - |
| **统计** | 手动 | < 50 ms | - |

## 🚧 待实现功能

### 阶段 1: 基础功能（已完成 ✅）

- ✅ SQLite 数据库
- ✅ 数据迁移
- ✅ 关键词搜索
- ✅ 分类查询
- ✅ 统计信息

### 阶段 2: 高级功能（计划中）

- [ ] 向量数据库集成（ChromaDB）
- [ ] 语义搜索
- [ ] 相似记忆推荐
- [ ] 自动标签提取
- [ ] 智能摘要生成

### 阶段 3: 集成功能（计划中）

- [ ] 集成到 OpenClaw
- [ ] 自动记忆写入
- [ ] 定期优化任务
- [ ] Web UI

## 📞 问题排查

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

---

**创建时间**：2026-03-20 21:47
**维护者**：心跳时刻 - 番茄小说创作和运营
**版本**：v1.0
