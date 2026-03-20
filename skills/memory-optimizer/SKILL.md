---
name: memory-optimizer
version: 1.0.0
description: "自动优化记忆系统，包括去重、归档、评分、清理。每 30 分钟自动运行，确保记忆系统高效运行。"
author: 心跳时刻 - 番茄小说创作和运营
keywords: [memory, optimization, sqlite, cleanup, archive]
metadata:
  openclaw:
    emoji: "🧹"
---

# 记忆优化器 🧹

**自动优化记忆系统，保持高效和清洁**

## 功能特性

- ✅ **自动去重**：识别并合并重复记忆（内容哈希）
- ✅ **自动归档**：归档过期记忆（> 30 天未访问）
- ✅ **重要性评分**：计算记忆的重要性
- ✅ **清理低质量记忆**：删除无标签、内容过短的记忆
- ✅ **生成优化报告**：详细的优化统计

## 快速开始

### 1. 手动运行优化

```bash
cd ~/.openclaw/workspace
node skills/memory-optimizer/scripts/optimize.js
```

### 2. 查看优化报告

```bash
cat ~/.openclaw/workspace/data/memory-optimization-report.json
```

## 优化流程

```
1. 扫描所有记忆
   ↓
2. 计算重要性评分
   ↓
3. 识别重复记忆（内容哈希）
   ↓
4. 识别过期记忆（> 30 天）
   ↓
5. 执行优化
   - 合并重复记忆
   - 归档过期记忆
   - 删除低质量记忆
   ↓
6. 生成优化报告
```

## 重要性评分

**评分公式**：
```
importance = (access_count / age_days) * 0.4
           + (1 / days_since_last_access) * 0.3
           + content_quality_score * 0.2
           + reference_count * 0.1
```

**评分维度**：
- **访问频率**：访问次数 / 天数
- **时效性**：距离上次访问的时间
- **内容质量**：标签完整性、内容长度
- **关联度**：被其他记忆引用的次数

## 优化规则

### 去重规则

- **内容哈希相同**：合并为一个记忆
- **标题相同**：保留最新的，归档旧的
- **相似度 > 95%**：合并为一个记忆

### 归档规则

- **> 30 天未访问** + **重要性 < 2**：归档
- **> 60 天未访问** + **重要性 < 3**：归档
- **已归档 > 90 天**：删除（可选）

### 清理规则

- **无标签** + **内容 < 100 字**：删除
- **重要性 = 0** + **> 7 天**：删除
- **重复记忆**：合并

## 定时任务

### 设置定时任务（每 30 分钟）

```bash
# 添加到 crontab
crontab -e

# 添加以下内容
*/30 * * * * cd /Users/oyjie/.openclaw/workspace && node skills/memory-optimizer/scripts/optimize.js >> data/memory-optimization.log 2>&1
```

### 使用 OpenClaw cron

```javascript
{
  "name": "memory-optimization",
  "schedule": {
    "kind": "cron",
    "expr": "*/30 * * * *",
    "tz": "Asia/Shanghai"
  },
  "payload": {
    "kind": "agentTurn",
    "message": "运行记忆优化任务"
  },
  "sessionTarget": "isolated"
}
```

## 优化报告

### 报告示例

```json
{
  "timestamp": "2026-03-20T14:30:00Z",
  "totalMemories": 15,
  "processed": 15,
  "duplicatesFound": 2,
  "memoriesMerged": 2,
  "memoriesArchived": 1,
  "memoriesDeleted": 0,
  "averageImportance": 2.5,
  "topMemories": [
    {
      "id": 1,
      "title": "浏览器自动化技术突破",
      "importance": 4.8
    }
  ],
  "recommendations": [
    "建议增加标签：3 个记忆缺少标签",
    "建议合并：2 个记忆内容相似"
  ]
}
```

### 查看报告

```bash
# 查看最新报告
cat ~/.openclaw/workspace/data/memory-optimization-report.json | jq

# 查看历史报告
ls -la ~/.openclaw/workspace/data/memory-optimization-report-*.json
```

## 与其他 Skill 的集成

### sqlite-memory

- **共享数据库**：`memory.db`
- **优化后自动更新**：重要性评分、归档状态
- **查询优化**：基于重要性排序

### heartbeat

- **定期执行**：每 30 分钟
- **状态报告**：更新到 current-state.md
- **任务列表**：记录优化建议

### elite-longterm-memory

- **借鉴思路**：WAL 协议、分层架构
- **整合功能**：自动去重、归档、评分
- **简化实现**：SQLite 而非 LanceDB

## 配置选项

### 优化强度

```javascript
// 在 optimize.js 中配置
const CONFIG = {
  // 去重阈值（0-1）
  duplicateThreshold: 0.95,
  
  // 归档天数
  archiveAfterDays: 30,
  
  // 最低重要性
  minImportance: 2,
  
  // 是否删除归档记忆
  deleteArchived: false,
  
  // 删除归档天数
  deleteAfterDays: 90
};
```

### 跳过某些记忆

```javascript
// 标记为 "protected" 的记忆不会被优化
if (memory.tags.includes('protected')) {
  console.log('跳过受保护的记忆');
  continue;
}
```

## 故障排查

### 问题 1: 优化任务未运行

**检查**：
```bash
# 检查 crontab
crontab -l

# 检查日志
tail -f ~/.openclaw/workspace/data/memory-optimization.log
```

### 问题 2: 误删重要记忆

**恢复**：
```bash
# 从备份恢复
cp ~/.openclaw/workspace/memory-backup-*.db ~/.openclaw/workspace/memory.db
```

**预防**：
- 设置 `deleteArchived: false`
- 标记重要记忆为 `protected`

### 问题 3: 优化速度慢

**优化**：
- 添加更多索引
- 减少扫描范围（只扫描最近 30 天）
- 使用批量操作

## 最佳实践

1. **定期备份**：每周备份一次 memory.db
2. **监控日志**：定期查看优化日志
3. **调整配置**：根据实际情况调整优化强度
4. **保护重要记忆**：标记为 `protected`
5. **定期检查报告**：查看优化建议

## 未来计划

- [ ] 添加向量搜索去重
- [ ] 添加语义相似度检测
- [ ] 添加自动标签提取
- [ ] 添加 Web UI
- [ ] 添加云备份

---

**创建时间**：2026-03-20 22:40
**维护者**：心跳时刻 - 番茄小说创作和运营
**版本**：v1.0.0
