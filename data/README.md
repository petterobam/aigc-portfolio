# 数据目录

## 概述

此目录存储各种数据分析的输出文件，包括 CSV、JSON、Markdown 和图片格式的数据。

## 目录结构

```
data/
├── *.csv                  # CSV 格式的数据文件
├── *.json                 # JSON 格式的数据文件
├── *.md                   # Markdown 格式的分析报告
├── *.png                  # 图片格式的数据可视化
└── [其他数据文件]          # 其他格式的数据文件
```

## 数据类型

### 1. 故事数据

**文件命名模式**: `all-stories-<timestamp>.<ext>`

**示例**:
- `all-stories-2026-03-19T05-59-01.csv`
- `all-stories-2026-03-19T05-59-01.json`
- `all-stories-2026-03-19T05-59-01.png`

**内容**: 所有故事的完整数据，包括阅读量、点赞、评论、关注等指标

**用途**: 全局数据分析、趋势分析、对比分析

### 2. 分析报告

**文件命名模式**: `analyze-<type>-report-<timestamp>.md`

**示例**:
- `analyze-all-stories-report-2026-03-20T00-03-25-379Z.md`

**内容**: 数据分析的 Markdown 格式报告

**用途**: 详细分析结论、数据洞察、优化建议

### 3. 登录状态检查数据

**文件命名模式**: `check-fanqie-login-<timestamp>.<ext>`

**示例**:
- `check-fanqie-login-1774445041609.png`
- `check-fanqie-login-1774491566244.png`

**内容**: 登录状态检查的页面截图

**用途**: 验证登录状态、排查登录问题

### 4. 分类分析数据

**文件命名模式**: `category-<type>-analysis-<timestamp>.<ext>`

**示例**:
- `category-agreement-analysis-1774537789487.png`
- `category-agreement-analysis-1774537790006.json`

**内容**: 各分类的协议达成情况分析

**用途**: 分类表现分析、分类优化建议

### 5. 状态检查数据

**文件命名模式**: `check-<type>-status-result.json`

**示例**:
- `check-39-status-result.json`

**内容**: 特定故事的发布状态检查结果

**用途**: 确认发布状态、排查发布问题

## 使用方法

### 1. 读取 CSV 数据

```python
import pandas as pd

df = pd.read_csv('data/all-stories-2026-03-19T05-59-01.csv')
print(df.head())
```

### 2. 读取 JSON 数据

```javascript
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/all-stories-2026-03-19T05-59-01.json', 'utf8'));
```

### 3. 查看分析报告

```bash
cat data/analyze-all-stories-report-2026-03-20T00-03-25-379Z.md
```

## 数据收集脚本

### 主要脚本

- `scripts/collect-data.py` - 数据收集主脚本
- `scripts/analyze-stories.py` - 数据分析脚本
- `scripts/check-fanqie-login.js` - 登录状态检查脚本

### 使用示例

```bash
# 收集所有故事数据
python3 scripts/collect-data.py list

# 分析故事数据
python3 scripts/analyze-stories.py

# 检查登录状态
node scripts/check-fanqie-login.js
```

## 数据清理策略

### 清理原则

1. **保留原始数据**: 重要的原始数据文件（如 `all-stories-*.json`）应长期保留
2. **清理过期数据**: 删除超过 30 天的临时检查数据（如 `check-fanqie-login-*.png`）
3. **归档历史数据**: 超过 90 天的数据可以归档到 `data/archive/` 目录

### 清理脚本

```bash
# 清理 30 天前的临时检查数据
find data/ -name "check-fanqie-login-*.png" -mtime +30 -delete
```

## 数据分析流程

### 1. 数据收集

```bash
# 收集当前所有故事数据
python3 scripts/collect-data.py list
```

### 2. 数据分析

```bash
# 分析故事数据，生成报告
python3 scripts/analyze-stories.py
```

### 3. 数据可视化

```bash
# 生成数据可视化图表
python3 scripts/visualize-stories.py
```

### 4. 结果解读

查看生成的分析报告：
```bash
cat automation/reports/data-analysis-*.md
```

## 数据分析示例

### 常见分析维度

1. **题材分析**: 不同题材的表现对比
2. **标题分析**: 标题长度与表现的关系
3. **关键词分析**: 标题关键词与表现的关系
4. **字数分析**: 字数与表现的关系
5. **发布时间分析**: 发布时间与表现的关系
6. **趋势分析**: 阅读量、点赞、评论等指标的趋势变化

### 关键指标

- **阅读量 (reads)**: 故事被阅读的次数
- **点赞 (likes)**: 读者点赞的数量
- **评论 (comments)**: 读者评论的数量
- **关注 (follows)**: 读者关注的数量
- **完读率 (completion_rate)**: 读者完整阅读的比例
- **点赞率 (like_rate)**: 点赞数 / 阅读量
- **关注率 (follow_rate)**: 关注数 / 阅读量

## 相关工具

- `skills/sqlite-memory/` - SQLite 记忆管理技能
- `scripts/collect-data.py` - 数据收集脚本
- `scripts/analyze-stories.py` - 数据分析脚本
- `automation/reports/` - 自动化报告目录

## 维护建议

1. **定期清理**: 每月清理一次过期数据
2. **定期备份**: 每周备份重要数据文件
3. **定期分析**: 每天分析一次数据，了解最新趋势
4. **数据归档**: 超过 90 天的数据归档到 `data/archive/` 目录

## 数据安全

⚠️ **重要**: 数据文件可能包含敏感信息，请注意以下事项：

1. **不提交敏感数据**: 不将包含敏感信息的数据文件提交到公开代码仓库
2. **访问控制**: 设置适当的文件权限
3. **数据脱敏**: 如需分享数据，先进行脱敏处理

---

**最后更新**: 2026-03-27 01:50
