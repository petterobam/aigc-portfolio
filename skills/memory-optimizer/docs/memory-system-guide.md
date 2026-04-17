# 记忆系统使用指南

> 本文档是面向使用者的操作手册：如何日常使用记忆优化器、如何查看结果、如何处理异常。
> 设计原理见 `memory-system-design.md`，优化规则见 `memory-optimization-strategy.md`。

---

## 快速开始

### 第一次运行

```bash
# 1. 进入工作区
cd ~/.openclaw/workspace

# 2. 确认数据库存在
ls -la memory.db

# 3. 运行优化脚本
node skills/memory-optimizer/scripts/optimize.js

# 4. 查看优化报告
cat data/memory-optimization-report.json | jq
```

### 验证运行成功

运行后你应该看到类似以下输出：

```
============================================================
  记忆优化器
============================================================

📊 扫描所有记忆...
找到 XX 条记忆

🔍 识别重复记忆...
发现 X 个重复记忆

📊 更新重要性评分...
更新了 X 条记忆的评分

📦 归档过期记忆...
归档了 X 条记忆

🗑️ 清理低质量记忆...
删除了 X 条记忆

📄 生成优化报告...

============================================================
  优化完成
============================================================
```

---

## 日常操作

### 手动运行优化

```bash
cd ~/.openclaw/workspace
node skills/memory-optimizer/scripts/optimize.js
```

任何时候想要手动触发一次完整优化，运行上面这条命令即可。

### 查看最新报告

```bash
# 结构化 JSON 报告（需要安装 jq）
cat ~/.openclaw/workspace/data/memory-optimization-report.json | jq

# 不安装 jq 也可以直接查看原始 JSON
cat ~/.openclaw/workspace/data/memory-optimization-report.json

# 查看执行日志摘要（人工可读）
cat ~/.openclaw/workspace/skills/memory-optimizer/logs/latest.md
```

### 查看系统状态

```bash
# 当前系统状态快照
cat ~/.openclaw/workspace/skills/memory-optimizer/state/current-state.md

# 历史报告归档
ls -la ~/.openclaw/workspace/skills/memory-optimizer/reports/
```

### 查看记忆库原始数据

```bash
# 进入 SQLite 交互模式
sqlite3 ~/.openclaw/workspace/memory.db

# 常用查询
.mode column
.headers on

-- 查看所有活跃记忆（按重要性排序）
SELECT id, title, category, importance, access_count FROM metadata
WHERE category != 'archived'
ORDER BY importance DESC;

-- 查看已归档记忆
SELECT id, title, importance, updated_at FROM metadata
WHERE category = 'archived'
ORDER BY updated_at DESC;

-- 查看记忆总体分布
SELECT category, COUNT(*) as count, AVG(importance) as avg_importance
FROM metadata
GROUP BY category;

-- 退出
.quit
```

---

## 配置调整

所有配置项位于 `scripts/optimize.js` 顶部的 `CONFIG` 对象中：

```javascript
const CONFIG = {
  archiveAfterDays: 30,       // 超过多少天未访问开始归档
  minImportance: 2,           // 低于此评分才会被归档
  minContentLength: 50,       // 内容少于多少字符才会被清理
  protectedTag: 'protected',  // 免疫所有优化的标签名
  deleteArchived: false       // 是否启用自动删除（默认关闭）
};
```

### 常见调整场景

#### 场景一：归档太激进，想保留更多记忆

```javascript
// 延长归档时间（从 30 天改为 60 天）
archiveAfterDays: 60,

// 或降低重要性阈值（只归档评分非常低的）
minImportance: 1,
```

#### 场景二：归档太保守，垃圾记忆太多

```javascript
// 缩短归档时间
archiveAfterDays: 14,

// 提高重要性阈值（更多记忆会被归档）
minImportance: 3,
```

#### 场景三：想启用自动删除（谨慎）

```bash
# 1. 先备份数据库
cp ~/.openclaw/workspace/memory.db \
   ~/.openclaw/workspace/data/backups/memory-before-delete-$(date +%Y%m%d).db

# 2. 修改配置
# 在 scripts/optimize.js 中将 deleteArchived: false 改为 deleteArchived: true

# 3. 先用 dry-run 模式确认（在代码中添加 console.log 但不执行删除）
# 4. 确认无误后再正式运行
```

---

## 保护重要记忆

对于不希望被任何优化操作处理的记忆，添加 `protected` 标签：

```bash
sqlite3 ~/.openclaw/workspace/memory.db

-- 查找要保护的记忆 ID
SELECT id, title FROM metadata WHERE title LIKE '%关键词%';

-- 添加 protected 标签（假设 id = 5）
UPDATE metadata
SET tags = json_insert(COALESCE(tags, '[]'), '$[#]', 'protected')
WHERE id = 5;

-- 验证标签已添加
SELECT id, title, tags FROM metadata WHERE id = 5;

.quit
```

**哪些记忆值得保护**：
- 系统配置、API 密钥记录
- 花了很长时间总结的方法论
- 不可复现的独特经验（某次解决了一个极难的 bug 的过程）
- 长期积累的工作流程

---

## 恢复归档的记忆

如果发现某条有价值的记忆被误归档，可以手动恢复：

```bash
sqlite3 ~/.openclaw/workspace/memory.db

-- 查看所有归档记忆
SELECT id, title, importance, updated_at FROM metadata
WHERE category = 'archived'
ORDER BY updated_at DESC
LIMIT 20;

-- 恢复某条记忆（假设 id = 12）
UPDATE metadata SET category = 'active' WHERE id = 12;

-- 同时建议将其标记为 protected，避免再次被归档
UPDATE metadata
SET tags = json_insert(COALESCE(tags, '[]'), '$[#]', 'protected')
WHERE id = 12;

.quit
```

---

## 设置定时任务

让优化器每 30 分钟自动运行：

```bash
# 打开 crontab 编辑器
crontab -e

# 添加以下内容（每 30 分钟运行一次）
*/30 * * * * cd ~/.openclaw/workspace && node skills/memory-optimizer/scripts/optimize.js >> skills/memory-optimizer/logs/cron.log 2>&1
```

验证定时任务已生效：

```bash
# 查看当前 crontab
crontab -l

# 等待下次执行后查看日志
tail -f ~/.openclaw/workspace/skills/memory-optimizer/logs/cron.log
```

---

## 备份与恢复

### 手动备份

```bash
# 创建备份目录
mkdir -p ~/.openclaw/workspace/data/backups

# 备份当前数据库
cp ~/.openclaw/workspace/memory.db \
   ~/.openclaw/workspace/data/backups/memory-$(date +%Y%m%d-%H%M%S).db

echo "备份完成"
```

### 从备份恢复

```bash
# 查看可用备份
ls -lah ~/.openclaw/workspace/data/backups/

# 恢复指定备份（替换当前数据库）
# 警告：此操作不可逆，请先确认要恢复的备份文件名
cp ~/.openclaw/workspace/data/backups/memory-20260321-143000.db \
   ~/.openclaw/workspace/memory.db

echo "恢复完成，请重新运行优化器验证数据"
```

### 建议的备份频率

| 场景 | 备份频率 | 说明 |
|------|---------|------|
| 日常运行 | 每周一次 | 写入 crontab，每周日自动备份 |
| 修改 CONFIG 前 | 每次修改前 | 手动执行，确保可回滚 |
| 启用 deleteArchived 前 | 强制备份 | 删除前必须有备份 |
| 记忆库大量增长时 | 立即备份 | 重要数据增多时及时保存 |

---

## 故障排查

### 问题一：脚本运行报错 "Cannot find module 'better-sqlite3'"

**原因**：依赖未安装

**解决**：
```bash
cd ~/.openclaw/workspace
npm install better-sqlite3
# 或
npm install
```

### 问题二：报错 "SQLITE_CANTOPEN: unable to open database file"

**原因**：memory.db 文件不存在，或路径不正确

**解决**：
```bash
# 确认数据库文件位置
ls -la ~/.openclaw/workspace/memory.db

# 如果不存在，检查 sqlite-memory skill 是否已初始化
cat ~/.openclaw/workspace/skills/sqlite-memory/SKILL.md
```

### 问题三：优化后发现有价值的记忆不见了

**处理步骤**：

1. 先检查归档区（大概率在归档而非删除）：
```bash
sqlite3 ~/.openclaw/workspace/memory.db \
  "SELECT id, title FROM metadata WHERE category = 'archived' ORDER BY updated_at DESC LIMIT 20;"
```

2. 若在归档中，执行恢复（见上方「恢复归档的记忆」章节）

3. 若确认已被删除（`deleteArchived: true` 时才会发生），从备份恢复：
```bash
ls ~/.openclaw/workspace/data/backups/
```

4. 恢复后，将该记忆标记为 `protected`，防止再次被处理

### 问题四：定时任务没有执行

**检查步骤**：
```bash
# 1. 确认 crontab 已配置
crontab -l

# 2. 检查 cron 服务是否在运行（macOS）
sudo launchctl list | grep cron

# 3. 检查日志是否有错误
cat ~/.openclaw/workspace/skills/memory-optimizer/logs/cron.log

# 4. 手动执行一次确认脚本本身没有问题
cd ~/.openclaw/workspace
node skills/memory-optimizer/scripts/optimize.js
```

### 问题五：优化率异常高（>30%）

**可能原因**：
- `archiveAfterDays` 设置太短
- `minImportance` 设置太高
- 记忆库中存在大量低质量数据

**处理步骤**：
1. 查看本次报告中被归档的记忆标题，确认是否符合预期
2. 如果有误归档，调整 CONFIG 参数（见「配置调整」章节）
3. 调整后重新运行，观察优化率是否恢复正常

---

## 执行后的工作流

每次运行优化脚本后，建议按以下步骤处理结果：

```
运行 optimize.js
    ↓
查看控制台输出（有没有异常警告？）
    ↓
查看 JSON 报告（优化率是否在正常范围内？）
    ↓
更新 logs/latest.md（记录本次执行摘要）
    ↓
更新 state/current-state.md（更新记忆库概览数字）
    ↓
如有异常 → 在 state/current-state.md 的「已知问题」中记录
如一切正常 → 查看 tasks/task-list.md，推进下一个开发任务
```

---

## 常用 SQL 速查

```sql
-- 记忆总量与分布
SELECT category, COUNT(*) as count
FROM metadata GROUP BY category;

-- 重要性最高的 10 条记忆
SELECT id, title, importance, access_count
FROM metadata
WHERE category = 'active'
ORDER BY importance DESC
LIMIT 10;

-- 最近 7 天新增的记忆
SELECT id, title, created_at
FROM metadata
WHERE created_at > datetime('now', '-7 days')
ORDER BY created_at DESC;

-- 超过 30 天未访问的活跃记忆（归档候选）
SELECT id, title, importance,
       CAST((julianday('now') - julianday(updated_at)) AS INTEGER) as days_idle
FROM metadata
WHERE category = 'active'
  AND days_idle > 30
ORDER BY days_idle DESC;

-- 无标签的记忆（质量较低）
SELECT id, title, importance
FROM metadata
WHERE (tags IS NULL OR tags = '[]')
  AND category = 'active';

-- 查看所有受保护的记忆
SELECT id, title, importance
FROM metadata
WHERE tags LIKE '%protected%';
```

---

## 文件路径速查

| 文件 | 路径 | 说明 |
|------|------|------|
| 核心脚本 | `skills/memory-optimizer/scripts/optimize.js` | 主优化脚本 |
| 配置入口 | 同上文件的 `CONFIG` 对象 | 修改优化参数 |
| 数据库 | `memory.db` | SQLite 记忆库 |
| JSON 报告 | `data/memory-optimization-report.json` | 最新优化报告 |
| 执行日志 | `skills/memory-optimizer/logs/latest.md` | 最新日志摘要 |
| 系统状态 | `skills/memory-optimizer/state/current-state.md` | 当前状态快照 |
| 任务列表 | `skills/memory-optimizer/tasks/task-list.md` | 开发任务追踪 |
| 报告归档 | `skills/memory-optimizer/reports/` | 历史报告存档 |
| 数据库备份 | `data/backups/` | 备份文件 |

---

**维护者**：心跳时刻 - 记忆优化器
**版本**：v1.0
**最后更新**：初始版本
**关联文档**：
- `memory-system-design.md`（系统架构设计）
- `memory-optimization-strategy.md`（优化策略规则）
- `../SKILL.md`（技术规范）
- `../HEARTBEAT.md`（心跳驱动系统）