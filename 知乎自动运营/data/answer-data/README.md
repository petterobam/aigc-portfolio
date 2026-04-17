# 回答数据目录

> **说明**：存储知乎回答分析和相关的截图数据

---

## 📁 目录结构

```
answer-data/
├── answer-analysis-{timestamp}.json    回答分析数据（JSON格式）
├── answer-screenshot-{timestamp}.png   回答页面截图（PNG格式）
└── test-screenshot-{timestamp}.png     测试截图
```

---

## 📊 数据文件说明

### 1. 回答分析数据 (answer-analysis-*.json)

**用途**：存储知乎回答的分析数据

**格式**：
```json
{
  "timestamp": "2026-03-27T20:19:00.660Z",
  "answerId": "xxx",
  "questionId": "xxx",
  "questionTitle": "问题标题",
  "answerContent": "回答内容摘要",
  "upvoteCount": 100,
  "commentCount": 50,
  "collectionCount": 30,
  "author": {
    "name": "作者名",
    "url": "https://www.zhihu.com/people/xxx"
  },
  "tags": ["标签1", "标签2", "标签3"]
}
```

**用途场景**：
- 分析高赞回答的结构和特点
- 提取回答中的关键词和标签
- 统计回答的数据指标
- 为创作提供参考

---

### 2. 回答截图 (answer-screenshot-*.png)

**用途**：存储回答页面的截图

**命名规范**：
```
answer-screenshot-{timestamp}.png
```

**用途场景**：
- 记录回答页面的视觉信息
- 用于分析回答的排版和结构
- 作为数据分析的辅助资料

---

### 3. 测试截图 (test-screenshot-*.png)

**用途**：存储测试过程中的截图

**命名规范**：
```
test-screenshot-{timestamp}.png
```

**用途场景**：
- 测试自动化脚本
- 调试问题
- 验证功能

---

## 🧹 数据清理

### 清理规则

1. **定期清理旧数据**（保留最近 7 天）
   - 超过 7 天的 JSON 文件可以删除
   - 超过 7 天的 PNG 文件可以删除

2. **保留重要数据**（永久保留）
   - 爆款回答的数据和截图
   - 有分析价值的数据和截图
   - 用户特别要求保留的数据

3. **清理命令**：
   ```bash
   # 清理 7 天前的数据
   find ~/.openclaw/workspace/知乎自动运营/data/answer-data -name "answer-analysis-*.json" -mtime +7 -delete
   find ~/.openclaw/workspace/知乎自动运营/data/answer-data -name "answer-screenshot-*.png" -mtime +7 -delete
   ```

---

## 🔍 数据使用

### 使用回答分析数据

```javascript
// 读取回答分析数据
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('answer-analysis-2026-03-27T20-19-00-660Z.json', 'utf8'));

// 分析回答数据
console.log(`赞同数：${data.upvoteCount}`);
console.log(`评论数：${data.commentCount}`);
console.log(`收藏数：${data.collectionCount}`);
console.log(`标签：${data.tags.join(', ')}`);
```

### 使用回答截图

```javascript
// 读取回答截图
const fs = require('fs');
const screenshot = fs.readFileSync('answer-screenshot-2026-03-27T20-19-00-660Z.png');

// 可以将截图用于：
// - 分析页面结构
// - 提取视觉信息
// - 生成报告
```

---

## 📊 数据统计

### 数据文件数量统计

```bash
# 统计 JSON 文件数量
ls -1 ~/.openclaw/workspace/知乎自动运营/data/answer-data/*.json | wc -l

# 统计 PNG 文件数量
ls -1 ~/.openclaw/workspace/知乎自动运营/data/answer-data/*.png | wc -l

# 统计总文件大小
du -sh ~/.openclaw/workspace/知乎自动运营/data/answer-data
```

---

## 🎯 相关目录

- **数据目录**：`../data/`
- **自动化系统**：`../🛠️自动化系统/`
- **数据分析**：`../📊数据分析/`
- **数据看板**：`../📊数据看板/`

---

**创建时间**: 2026-03-29
**版本**: v1.0
**维护者**: 知乎技术分享与知识付费运营 AI
