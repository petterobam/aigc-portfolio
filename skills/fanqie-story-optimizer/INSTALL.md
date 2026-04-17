# fanqie-story-optimizer 安装说明

## 概述

番茄短篇故事优化助手，基于29个已发布故事的数据分析，为低表现作品生成优化方案。

## 安装

已打包为 `.skill` 文件，位于：
```
~/.openclaw/workspace/dist/fanqie-story-optimizer.skill
```

## 使用方法

### 1. 单个作品优化

```bash
node ~/.openclaw/workspace/skills/fanqie-story-optimizer/scripts/optimize-story.js [story-id|story-title]
```

示例：
```bash
node ~/.openclaw/workspace/skills/fanqie-story-optimizer/scripts/optimize-story.js "职场整顿：既然老板想白嫖..."
```

### 2. 批量优化

```bash
# 优化所有0阅读作品
node ~/.openclaw/workspace/skills/fanqie-story-optimizer/scripts/batch-optimize.js --filter=zero-reading

# 优化所有<3阅读作品
node ~/.openclaw/workspace/skills/fanqie-story-optimizer/scripts/batch-optimize.js --filter=low-reading
```

### 3. 新作品质量检查

```bash
node ~/.openclaw/workspace/skills/fanqie-story-optimizer/scripts/validate-new-story.js <story-file>
```

示例：
```bash
node ~/.openclaw/workspace/skills/fanqie-story-optimizer/scripts/validate-new-story.js stories/new-story.md
```

## 核心功能

- **问题诊断**：分析标题、金手指、社会共鸣、字数
- **标题优化**：生成3个备选新标题（≤15字）
- **开篇优化**：提供前500字优化建议
- **题材调整**：推荐高表现题材
- **质量检查**：新作品发布前的质量验证

## 成功公式

```
明确金手指(40%) + 社会共鸣强(30%) + 标题悬念(20%) + 合适字数(10%) = 阅读量
```

## 输出位置

优化报告保存在：
```
番茄短篇故事集/analysis/
```

## 数据来源

- 原始数据：`data/all-stories-*.json`
- 分析报告：`番茄短篇故事集/analysis/complete-analysis-2026-03-19.md`
- 优化示例：`番茄短篇故事集/analysis/optimization-05-2026-03-19.md`

---

**创建时间**：2026-03-19
**版本**：1.0
