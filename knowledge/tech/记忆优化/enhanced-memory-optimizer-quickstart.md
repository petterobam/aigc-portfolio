# 增强版记忆优化器 - 快速入门指南

> **创建时间**: 2026-03-28 14:00
> **版本**: V1.0
> **作者**: 无何有

---

## 🚀 5分钟快速入门

### 步骤1：检查统计信息

```bash
cd ~/.openclaw/workspace
node scripts/enhanced-memory-optimizer-simple.js --stats
```

**预期输出**：
```
════════════════════════════════════════════════════════════
  增强版记忆优化器 V1.0（简化版）
════════════════════════════════════════════════════════════
[2026/3/28 14:00:00] ✅ 数据库连接成功
[2026/3/28 14:00:00] 📊 统计信息:
[2026/3/28 14:00:00]    总记忆数: 91
[2026/3/28 14:00:00]    重要记忆数: 2
[2026/3/28 14:00:00]    归档记忆数: 6
[2026/3/28 14:00:00] 
   分类统计:
[2026/3/28 14:00:00]    - creation: 59
[2026/3/28 14:00:00]    - general: 9
[2026/3/28 14:00:00]    - task: 9
[2026/3/28 14:00:00]    - archived: 6
[2026/3/28 14:00:00]    - breakthrough: 4
[2026/3/28 14:00:00]    - operation: 4
```

---

### 步骤2：关键词搜索

```bash
# 搜索"浏览器自动化"
node scripts/enhanced-memory-optimizer-simple.js --search "浏览器自动化"

# 搜索"番茄小说"
node scripts/enhanced-memory-optimizer-simple.js --search "番茄"

# 搜索"知乎"
node scripts/enhanced-memory-optimizer-simple.js --search "知乎"
```

**预期输出**：
```
[2026/3/28 14:00:00] 🔍 关键词搜索: 浏览器自动化
[2026/3/28 14:00:00] 📊 找到 10 个相关记忆
[2026/3/28 14:00:00]    1. 浏览器自动化技术突破 (2026/3/20)
[2026/3/28 14:00:00]    2. 浏览器自动化V14测试分析 (2026/3/20)
[2026/3/28 14:00:00]    3. 浏览器自动化V15测试分析 (2026/3/20)
[2026/3/28 14:00:00]    4. 浏览器自动化V16测试分析 (2026/3/20)
[2026/3/28 14:00:00]    5. 浏览器自动化V17测试分析 (2026/3/20)
```

---

### 步骤3：查看重要记忆

```bash
node scripts/enhanced-memory-optimizer-simple.js --important
```

**预期输出**：
```
[2026/3/28 14:00:00] 📊 重要记忆:
[2026/3/28 14:00:00]    1. 浏览器自动化技术突破 (重要度: 5)
[2026/3/28 14:00:00]    2. 知乎自动化Cookie提取工具 (重要度: 4)
```

---

### 步骤4：查看最近记忆

```bash
node scripts/enhanced-memory-optimizer-simple.js --recent
```

**预期输出**：
```
[2026/3/28 14:00:00] 📊 最近记忆:
[2026/3/28 14:00:00]    1. 知乎自动化Cookie提取工具创建完成 (2026/3/28)
[2026/3/28 14:00:00]    2. 浏览器守护进程更新 (2026/3/28)
[2026/3/28 14:00:00]    3. 知乎自动化定时任务配置创建完成 (2026/3/28)
[2026/3/28 14:00:00]    4. 增强版记忆优化器创建完成 (2026/3/28)
```

---

### 步骤5：按分类查询

```bash
# 查看突破类记忆
node scripts/enhanced-memory-optimizer-simple.js --category "breakthrough"

# 查看创作类记忆
node scripts/enhanced-memory-optimizer-simple.js --category "creation"

# 查看运营类记忆
node scripts/enhanced-memory-optimizer-simple.js --category "operation"
```

**预期输出**：
```
[2026/3/28 14:00:00] 📊 分类: breakthrough
[2026/3/28 14:00:00]    1. 浏览器自动化技术突破 (2026/3/20)
[2026/3/28 14:00:00]    2. 番茄小说V17脚本创建 (2026/3/28)
```

---

### 步骤6：自动优化记忆

```bash
node scripts/enhanced-memory-optimizer-simple.js --optimize
```

**预期输出**：
```
[2026/3/28 14:00:00] 🧧 开始优化记忆...
[2026/3/28 14:00:00]    📋 步骤 1: 去重...
[2026/3/28 14:00:00]        ✅ 合并了 2 个重复记忆
[2026/3/28 14:00:00]    📋 步骤 2: 评分...
[2026/3/28 14:00:00]        ✅ 评分了 5 个记忆
[2026/3/28 14:00:00]    📋 步骤 3: 归档...
[2026/3/28 14:00:00]        ✅ 归档了 3 个记忆
[2026/3/28 14:00:00]    📋 步骤 4: 清理...
[2026/3/28 14:00:00]        ✅ 清理了 1 个记忆
[2026/3/28 14:00:00]    📋 步骤 5: 生成报告...
[2026/3/28 14:00:00]        ✅ 报告已生成: memory/logs/memory-optimization-2026-03-28-14-00-00.md
[2026/3/28 14:00:00] ✅ 记忆优化完成
```

---

## 🎯 核心功能演示

### 演示1：搜索"浏览器自动化"相关的记忆

```bash
node scripts/enhanced-memory-optimizer-simple.js --search "浏览器自动化"
```

**说明**：
- 搜索包含"浏览器自动化"的记忆
- 按重要度和时间排序
- 返回最相关的 10 个记忆

**输出**：
- 记忆标题
- 创建时间
- 文件路径
- 重要度
- 分类

---

### 演示2：查看"breakthrough"分类的记忆

```bash
node scripts/enhanced-memory-optimizer-simple.js --category "breakthrough"
```

**说明**：
- 查看所有突破类记忆
- 按重要度和时间排序
- 返回最近的 10 个记忆

**输出**：
- 记忆标题
- 创建时间
- 重要度
- 分类

---

### 演示3：自动优化记忆

```bash
node scripts/enhanced-memory-optimizer-simple.js --optimize
```

**说明**：
- 自动去重：合并重复记忆
- 自动评分：基于规则评分
- 自动归档：归档 30 天前的低质量记忆
- 自动清理：清理访问次数过多的低质量记忆
- 生成报告：详细的优化报告

**输出**：
- 合并的记忆数
- 评分的记忆数
- 归档的记忆数
- 清理的记忆数
- 优化报告路径

---

## 📊 性能对比

| 操作 | Markdown（旧） | SQLite（简化版） | 提升 |
|------|---------------|-------------------|------|
| **关键词搜索** | 2-5 秒 | < 100 ms | 20-50x |
| **分类查询** | 手动 | < 50 ms | - |
| **去重** | 手动 | 自动 | - |
| **统计** | 手动 | < 50 ms | - |

---

## 🚨 常见问题

### 问题1：数据库连接失败

**错误**：`SQLITE_CANTOPEN: unable to open database file`

**解决方案**：
```bash
# 初始化数据库
node skills/sqlite-memory/scripts/memory-schema.js
```

### 问题2：搜索无结果

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

### 问题3：优化失败

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

## 📚 相关文档

- **增强版记忆优化器使用指南**：`docs/enhanced-memory-optimizer-guide.md`
- **SQLite 记忆系统**：`skills/sqlite-memory/SKILL.md`
- **精英长期记忆系统**：`skills/elite-longterm-memory/SKILL.md`

---

## 🎯 下一步

### 短期（本周）

1. ✅ 测试所有功能
2. ✅ 配置定期优化任务（cron）
3. ⏳ 添加向量搜索支持（需要安装依赖）

### 中期（本月）

1. ⏳ 集成到 OpenClaw 主系统
2. ⏳ 添加自动记忆写入
3. ⏳ 创建 Web UI

---

**创建时间**: 2026-03-28 14:00
**版本**: V1.0
**维护者**: 无何有
