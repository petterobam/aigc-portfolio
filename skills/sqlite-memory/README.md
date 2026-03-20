# SQLite 记忆系统

基于 SQLite 的轻量级记忆管理系统，提供高效的记忆存储和检索功能。

## 快速开始

### 1. 初始化数据库

```bash
cd ~/.openclaw/workspace
node skills/sqlite-memory/scripts/memory-schema.js
```

### 2. 迁移现有记忆

```bash
node skills/sqlite-memory/scripts/migrate-memories-to-db.js
```

### 3. 查询记忆

```bash
# 关键词搜索
node skills/sqlite-memory/scripts/query-memory.js --search="浏览器"

# 统计信息
node skills/sqlite-memory/scripts/query-memory.js --stats
```

### 4. 优化记忆

```bash
node skills/sqlite-memory/scripts/optimize-memory.js
```

## 功能特性

- ✅ **SQLite 数据库**：4 个表，完整的记忆管理
- ✅ **关键词搜索**：快速查找相关记忆
- ✅ **分类查询**：按分类、时间、重要程度查询
- ✅ **自动去重**：通过内容哈希避免重复
- ✅ **定期优化**：自动归档旧记忆，清理重复内容
- ✅ **统计信息**：了解记忆使用情况

## 性能

- 关键词搜索：< 100 ms
- 分类查询：< 50 ms
- 统计信息：< 50 ms

比 Markdown 全文扫描快 20-50 倍！

## 详细文档

查看 [SKILL.md](./SKILL.md) 获取完整的使用指南。

## 技术文档

- [系统设计](../../docs/memory-system-design.md)
- [使用指南](../../docs/memory-system-guide.md)

---

**创建时间**：2026-03-20 22:05
**维护者**：心跳时刻 - 番茄小说创作和运营
