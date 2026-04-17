# 报告目录

> **说明**：存储热点话题追踪和选题建议的报告数据

---

## 📁 目录结构

```
reports/
├── hot-topics-{timestamp}.json          热点话题报告（历史版本）
├── hot-topics-latest.json               热点话题报告（最新版本）
└── topic-suggestions-latest.json        选题建议（最新版本）
```

---

## 📊 报告文件说明

### 1. 热点话题报告 (hot-topics-*.json)

**用途**：存储知乎热榜话题的分析数据

**格式**：
```json
{
  "timestamp": "2026-03-28T01:00:27.379Z",
  "source": "zhihu",
  "topics": [
    {
      "rank": 1,
      "title": "话题标题",
      "url": "https://www.zhihu.com/question/xxx",
      "hotScore": 1000000,
      "excerpt": "话题摘要",
      "category": "科技",
      "tags": ["AI", "人工智能", "大模型"]
    },
    {
      "rank": 2,
      "title": "话题标题2",
      "url": "https://www.zhihu.com/question/yyy",
      "hotScore": 900000,
      "excerpt": "话题摘要2",
      "category": "科技",
      "tags": ["OpenAI", "GPT-4", "Claude"]
    }
  ],
  "summary": {
    "totalTopics": 50,
    "techTopics": 15,
    "hotestTopic": {
      "title": "最热话题标题",
      "hotScore": 1000000
    }
  }
}
```

**数据来源**：
- 知乎热榜（https://www.zhihu.com/hot）
- Hacker News（https://news.ycombinator.com）
- GitHub Trending（https://github.com/trending）
- arXiv 最新论文（https://arxiv.org）

**生成方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/track/hot-topic-tracker.js
```

---

### 2. 选题建议 (topic-suggestions-latest.json)

**用途**：存储基于热点话题的选题建议

**格式**：
```json
{
  "timestamp": "2026-03-28T01:00:27.379Z",
  "basedOnHotTopics": true,
  "suggestions": [
    {
      "id": "suggestion-001",
      "title": "选题标题",
      "type": "AIGC原理",
      "priority": "high",
      "reason": "基于热点话题的建议理由",
      "estimatedViews": 10000,
      "tags": ["AI", "人工智能", "大模型"],
      "relatedHotTopic": {
        "title": "相关热点话题",
        "url": "https://www.zhihu.com/question/xxx"
      }
    },
    {
      "id": "suggestion-002",
      "title": "选题标题2",
      "type": "OpenClaw技巧",
      "priority": "medium",
      "reason": "基于热点话题的建议理由2",
      "estimatedViews": 8000,
      "tags": ["OpenClaw", "AI工具", "效率"],
      "relatedHotTopic": {
        "title": "相关热点话题2",
        "url": "https://www.zhihu.com/question/yyy"
      }
    }
  ],
  "summary": {
    "totalSuggestions": 20,
    "highPrioritySuggestions": 5,
    "mediumPrioritySuggestions": 10,
    "lowPrioritySuggestions": 5
  }
}
```

**生成方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/generate/topic-suggestion-generator.js
```

---

## 📈 数据使用

### 使用热点话题报告

```javascript
// 读取热点话题报告
const fs = require('fs');
const report = JSON.parse(fs.readFileSync('hot-topics-latest.json', 'utf8'));

// 分析热点话题
console.log(`总计话题数：${report.summary.totalTopics}`);
console.log(`科技类话题数：${report.summary.techTopics}`);
console.log(`最热话题：${report.summary.hotestTopic.title}`);

// 筛选技术类话题
const techTopics = report.topics.filter(topic => topic.category === '科技');
console.log(`科技类话题：${techTopics.map(t => t.title).join(', ')}`);
```

### 使用选题建议

```javascript
// 读取选题建议
const fs = require('fs');
const suggestions = JSON.parse(fs.readFileSync('topic-suggestions-latest.json', 'utf8'));

// 分析选题建议
console.log(`总选题数：${suggestions.summary.totalSuggestions}`);
console.log(`高优先级选题：${suggestions.summary.highPrioritySuggestions}`);

// 筛选高优先级选题
const highPrioritySuggestions = suggestions.suggestions.filter(s => s.priority === 'high');
console.log(`高优先级选题：${highPrioritySuggestions.map(s => s.title).join(', ')}`);
```

---

## 🧹 数据清理

### 清理规则

1. **定期清理旧数据**（保留最近 7 天）
   - 超过 7 天的热点话题报告可以删除
   - 超过 7 天的选题建议可以删除

2. **保留最新数据**（永久保留）
   - hot-topics-latest.json
   - topic-suggestions-latest.json

3. **清理命令**：
   ```bash
   # 清理 7 天前的热点话题报告
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports
   find . -name "hot-topics-*.json" -mtime +7 -delete

   # 清理 7 天前的选题建议（保留最新版本）
   find . -name "topic-suggestions-*.json" -mtime +7 -delete
   ```

---

## 📊 数据统计

### 数据文件数量统计

```bash
# 统计热点话题报告数量
ls -1 ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports/hot-topics-*.json | wc -l

# 统计选题建议数量
ls -1 ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports/topic-suggestions-*.json | wc -l

# 统计总文件大小
du -sh ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/reports
```

---

## 🎯 相关目录

- **数据目录**：`../data/`
- **自动化系统**：`../`
- **选题池**：`../../✍️内容生产/选题池/`
- **内容创作**：`../../✍️内容生产/`
- **数据分析**：`../../📊数据分析/`

---

## 🔄 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-03-29 | 创建报告目录 README.md |

---

**创建时间**: 2026-03-29
**版本**: v1.0
**维护者**: 知乎技术分享与知识付费运营 AI
