# reports

> **说明**：研究报告、数据分析报告、项目复盘等文档归档

---

## 📂 目录结构

```
reports/
├── README.md                        本文件
├── [报告名称]-[时间戳].json       报告数据（JSON 格式）
├── [报告名称]-[时间戳].png        报告截图（PNG 格式）
├── [报告名称]-[时间戳].md         报告文档（Markdown 格式）
```

---

## 📊 报告分类

### 1. 知乎付费专栏研究

**文件**：`zhihu-paid-column-research-[时间戳].json`

**内容**：
- 知乎付费专栏列表
- 专栏标题、作者、订阅数、价格
- 专栏内容概览
- 竞品分析数据

**用途**：
- 研究知乎付费专栏市场
- 分析竞品定价策略
- 指导自身付费专栏定价

**示例**：
```json
{
  "timestamp": "2026-03-29T15:10:18.009Z",
  "columns": [
    {
      "title": "AI 工程实战",
      "author": "xxx",
      "subscribers": 1000,
      "price": 199,
      "articles": 30
    }
  ]
}
```

---

### 2. 数据分析报告

**文件**：`[分析名称]-[时间戳].json`

**内容**：
- 文章数据分析
- 读者画像分析
- 流量来源分析
- 转化率分析

**用途**：
- 了解内容表现
- 优化内容策略
- 提升转化率

---

### 3. 项目复盘报告

**文件**：`[复盘名称]-[时间戳].md`

**内容**：
- 项目目标回顾
- 项目结果总结
- 成功经验总结
- 失败教训分析
- 改进建议

**用途**：
- 总结项目经验
- 提升团队效率
- 避免重复错误

---

### 4. 市场研究报告

**文件**：`[研究名称]-[时间戳].md`

**内容**：
- 市场趋势分析
- 竞品对比分析
- 用户需求调研
- 商业机会评估

**用途**：
- 了解市场动态
- 发现商业机会
- 指导产品决策

---

## 📝 报告格式规范

### JSON 格式报告

**示例**：
```json
{
  "timestamp": "2026-03-29T15:10:18.009Z",
  "reportType": "paid-column-research",
  "title": "知乎付费专栏研究",
  "summary": "研究知乎付费专栏的市场情况",
  "data": {
    "columns": [],
    "statistics": {}
  },
  "conclusions": [],
  "recommendations": []
}
```

**字段说明**：
- `timestamp`: 报告生成时间（ISO 8601 格式）
- `reportType`: 报告类型
- `title`: 报告标题
- `summary`: 报告摘要
- `data`: 报告数据
- `conclusions`: 结论列表
- `recommendations`: 建议列表

---

### Markdown 格式报告

**示例**：
```markdown
# 报告标题

> 报告摘要

## 一、背景

报告背景说明

## 二、方法

研究方法说明

## 三、结果

研究结果

## 四、结论

结论总结

## 五、建议

改进建议

---

**报告生成时间**: 2026-03-29 15:10
**报告人**: xxx
```

---

## 🔄 工作流程

### 1. 创建报告

**方式 1：手动创建**
```bash
# 创建 JSON 报告
touch "reports/[报告名称]-$(date +%Y-%m-%dT%H-%M-%S).json"

# 创建 Markdown 报告
touch "reports/[报告名称]-$(date +%Y-%m-%dT%H-%M-%S).md"
```

**方式 2：使用脚本**
```bash
# 使用研究脚本
node scripts/research-zhihu-paid-columns.js

# 使用数据分析脚本
node scripts/analyze-article-data.js
```

---

### 2. 报告归档

**归档规则**：
- 按时间归档（每月/每季度）
- 按类型归档（研究、分析、复盘）
- 保留最新 3 个月报告，旧报告移至 `🗂️归档记录`

**归档步骤**：
```bash
# 创建归档目录
mkdir -p "🗂️归档记录/reports/2026/03"

# 移动旧报告
mv reports/old-report*.json "🗂️归档记录/reports/2026/03/"
```

---

### 3. 报告检索

**按时间检索**：
```bash
# 查看本月报告
ls -lt reports/ | grep "$(date +%Y-%m)"

# 查看本周报告
find reports/ -name "*$(date +%Y-%m-%d)*" -o -name "*$(date -d '7 days ago' +%Y-%m-%d)*"
```

**按类型检索**：
```bash
# 查看付费专栏研究
ls reports/zhihu-paid-column-research-*.json

# 查看数据分析报告
ls reports/*analysis-*.json
```

---

## 📊 统计

### 报告统计

| 报告类型 | 数量 | 最新更新 |
|---------|------|---------|
| 知乎付费专栏研究 | 1 | 2026-03-29 |
| 数据分析报告 | 0 | - |
| 项目复盘报告 | 0 | - |
| 市场研究报告 | 0 | - |

---

## 🎯 最佳实践

### 1. 报告命名规范

**格式**：`[报告类型]-[具体名称]-[时间戳].[格式]`

**示例**：
- `zhihu-paid-column-research-2026-03-29T15-10-18-009Z.json`
- `article-data-analysis-2026-03-30T10-20-30-000Z.json`
- `project-retrospective-2026-03-31T14-00-00-000Z.md`

### 2. 时间戳规范

**格式**：ISO 8601 格式（YYYY-MM-DDTHH-MM-SS-SSSZ）

**示例**：
- `2026-03-29T15-10-18-009Z`

### 3. 报告完整性

**必填字段**：
- `timestamp`: 报告生成时间
- `title`: 报告标题
- `summary`: 报告摘要

**可选字段**：
- `data`: 报告数据
- `conclusions`: 结论
- `recommendations`: 建议

### 4. 数据可视化

**推荐工具**：
- **截图**：Chrome DevTools、Snipaste
- **图表**：Excel、Google Sheets、Tableau
- **流程图**：Draw.io、Lucidchart

**存储方式**：
- PNG 格式：清晰度高，适合展示
- SVG 格式：矢量图，可缩放
- JSON 格式：便于程序处理

---

## 🔗 相关文档

- **数据分析**：`📊 数据分析/README.md`
- **竞品分析**：`📊竞品分析/README.md`
- **趋势研究**：`📈趋势研究/README.md`

---

## 📝 更新记录

| 日期 | 更新内容 |
|------|---------|
| 2026-04-01 | 初始版本，创建 README 文档 |

---

**创建时间**: 2026-04-01 06:48
**版本**: v1.0
**状态**: ✅ 完成
