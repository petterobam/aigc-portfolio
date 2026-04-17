---
name: zhihu-operations
description: 知乎技术内容运营与自动化发布系统。包含 Cookie 管理、文章发布、数据分析等全流程自动化。用于：(1) 管理知乎技术账号，(2) 发布技术文章和回答，(3) 分析知乎内容数据（赞同、收藏、关注等），(4) 优化知乎运营策略，(5) 建立知识付费产品体系，(6) 使用 OpenClaw 进行知乎自动化运营
---

# 知乎运营系统

知乎技术内容运营的完整解决方案，自动化管理账号、发布内容、分析数据。

## 核心公式

**知乎技术内容成功公式**：
```
高赞技术文章 = 深度价值(50%) + 痛点代入(20%) + 结构清晰(15%) + 互动引导(15%)
```

**预期表现公式**：
```
预期赞同数 = (深度价值×0.5 + 痛点代入×0.2 + 结构清晰×0.15 + 互动引导×0.15) × 10
```

**质量等级定义**：
- 爆文（90-100分）：预期赞同500+，预期收藏150+
- 优秀（80-89分）：预期赞同300+，预期收藏100+
- 良好（70-79分）：预期赞同200+，预期收藏50+
- 及格（60-69分）：预期赞同100+，预期收藏30+

## 快速开始

### 1. 配置 Cookie（必需）

参考： ~/.openclaw/workspace/skills/playwright-browser/SKILL.md

详细配置指南：见 [references/cookie-management.md](references/cookie-management.md)

### 2. 验证 Cookie

```bash
cd ~/.openclaw/workspace/知乎自动运营
node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
```

### 3. 发布内容

**发布回答**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/publish/publish-zhihu-answer.js path/to/answer.json
```

**发布专栏文章**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/publish/publish-zhihu-article.js path/to/article.json
```

## 脚本工具

### Cookie 管理脚本

| 脚本 | 用途 | 位置 |
|------|------|------|
| `login-zhihu-save-cookies.js` | 手动登录并自动保存 Cookie | `知乎自动运营/🛠️自动化系统/scripts/` |
| `check-zhihu-login.js` | 验证 Cookie 有效性 | `知乎自动运营/🛠️自动化系统/scripts/utils/` |
| `extract-zhihu-cookies-from-browser.js` | 从调试模式的浏览器提取 Cookie | `scripts/` |

### 发布脚本

| 脚本 | 用途 | 位置 |
|------|------|------|
| `publish-zhihu-answer.js` | 发布回答 | `知乎自动运营/🛠️自动化系统/scripts/publish/` |
| `publish-zhihu-article.js` | 发布专栏文章 | `知乎自动运营/🛠️自动化系统/scripts/publish/` |

### 数据分析脚本

| 脚本 | 用途 | 位置 |
|------|------|------|
| `evaluate-article-quality.js` | 评估文章质量 | `知乎自动运营/🛠️自动化系统/scripts/analysis/` |
| `hot-topic-tracker.js` | 追踪热榜话题 | `知乎自动运营/🛠️自动化系统/scripts/tracking/` |

## 内容创作

### 创作方法论（五步法）

**第一步：选题（确定主题和痛点）**
- 确定主题（OpenClaw 使用技巧、AIGC 原理讲解）
- 确定痛点（读者的真实痛点、想解决的问题、想提升的效率）
- 选题检查清单

**第二步：构思（设计内容和结构）**
- 设计结构（开头、核心、结尾）
- 设计内容（原理讲解、代码示例、对比分析、案例研究）
- 构思检查清单

**第三步：写作（撰写内容）**
- 开头部分（痛点代入 + 价值承诺）
- 核心部分（原理讲解 + 代码示例 + 对比分析 + 案例研究）
- 结尾部分（总结要点 + 互动引导）
- 写作检查清单

**第四步：优化（优化标题和互动性）**
- 优化标题（长度10-30字、包含数字、价值承诺、吸引力）
- 优化互动性（引导评论、关注、点赞收藏）
- 优化检查清单

**第五步：评估（量化评估和优化）**
- 量化评估（使用评估工具，查看各维度得分，识别优缺点）
- 优化调整（根据评估结果优化文章，再次评估优化效果）
- 评估检查清单

详细创作方法论：见 [references/content-creation-methodology.md](references/content-creation-methodology.md)

### 爆款公式库

**OpenClaw 使用技巧类**
```
标题 = 数字承诺 + 价值承诺 + 核心主题 + 吸引力
内容 = 痛点代入 + 教程步骤 + 代码示例 + 避坑指南
```

**标题公式库**：
- 教程型："XX 教程：X 分钟从零搭建 XX"
- 实战型："用 XX 做了 XXX 天，总结 X 个效率技巧"
- 对比型："XX vs XX：到底有什么区别？一篇讲透"
- 避坑型："用了 XX 半年，这些坑你一定要知道"

**AIGC 原理讲解类**
```
标题 = 核心主题 + 从...到... + 一篇讲透/深度解析
内容 = 背景介绍 + 原理讲解 + 对比分析 + 实战案例
```

**标题公式库**：
- 原理型："终于搞懂了 XX：从 A 到 B，一篇讲透"
- 实战型："XX 实战：XX 提升 XX 40%"
- 深度型："XX 深度解析：原理、架构、优化"
- 对比型："A vs B：XX 的两种方案，一篇讲透"

详细爆款公式：见 [references/viral-formulas.md](references/viral-formulas.md)

## 数据分析

### 内容质量评估

使用评估工具量化评估文章质量：

```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/analysis/evaluate-article-quality.js path/to/article.md
```

**评估维度**：
- 标题质量（20分）：长度、数字、价值承诺、吸引力
- 内容结构（30分）：结构清晰度、图文并茂、逻辑流畅
- 技术深度（25分）：原理讲解深度、技术准确性、创新性
- 实用性（15分）：可复制性、避坑指南、实际应用场景
- 互动性（10分）：评论引导、关注引导、点赞收藏引导

### 热榜话题追踪

追踪知乎、Hacker News、GitHub Trending、arXiv 等平台的最新热门话题：

```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/tracking/hot-topic-tracker.js
```

详细数据分析方法：见 [references/data-analysis-methodology.md](references/data-analysis-methodology.md)

## 知识付费策略

### 付费产品矩阵

```
免费内容（引流） → 低价专栏（99-199元）→ 高价课程/咨询（500元+）
```

**付费转化路径**：
1. 免费回答/文章 → 吸引关注
2. 专栏订阅 → 形成付费习惯
3. 电子书/课程 → 深度变现
4. 1v1 咨询/社群 → 高客单价变现

### 付费产品设计

**付费专栏**：
- OpenClaw 高级技巧（99元）
- AIGC 原理深度解析（199元）

**电子书**：
- AI 工具实战指南（49元）

**训练营**：
- AI 工程实践训练营（299元）

**1v1 咨询**：
- AI 应用落地咨询（500元/次）

详细变现策略：见 [references/monetization-strategy.md](references/monetization-strategy.md)

## 高级功能

### 自动化系统架构

```
知乎自动运营/
├── 🛠️自动化系统/
│   ├── auth/                    # Cookie 存储
│   ├── scripts/                 # 自动化脚本
│   │   ├── login-zhihu-save-cookies.js
│   │   ├── publish/
│   │   ├── analysis/
│   │   └── tracking/
│   └── utils/                   # 工具函数
├── ✍️内容生产/
│   ├── 选题池/
│   ├── 文章草稿/
│   └── 发布包/
├── 📤待发布/
├── 📤已发布/
├── 📊数据分析/
└── 📊数据看板/
```

### 数据驱动的内容策略

1. **数据收集**：追踪赞同、收藏、关注、评论等数据
2. **数据分析**：识别爆款内容的共同特征
3. **策略优化**：基于数据反馈优化内容创作
4. **持续迭代**：验证有效 → 固化到方法论

详细自动化系统：见 [references/automation-system.md](references/automation-system.md)

## 常见问题

### Cookie 相关问题

**Q: Cookie 已过期怎么办？**
A: 重新登录并提取 Cookie：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/login-zhihu-save-cookies.js
```

**Q: 如何验证 Cookie 是否有效？**
A: 运行验证脚本：
```bash
cd ~/.openclaw/workspace/知乎自动运营
node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
```

### 发布相关问题

**Q: 发布脚本无法登录？**
A: 检查 Cookie 是否正确：
```bash
cat ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json | jq '.[0].name'
```

**Q: 发布内容失败？**
A: 检查内容格式是否符合知乎要求，查看错误日志。

### 数据分析相关问题

**Q: 如何评估文章质量？**
A: 使用评估工具：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/analysis/evaluate-article-quality.js path/to/article.md
```

**Q: 如何追踪热榜话题？**
A: 运行热榜追踪脚本：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/tracking/hot-topic-tracker.js
```

## 参考

详细文档位于 `references/` 目录：

- **[cookie-management.md](references/cookie-management.md)** - Cookie 配置和管理详细指南
- **[content-creation-methodology.md](references/content-creation-methodology.md)** - 内容创作方法论（五步法）
- **[viral-formulas.md](references/viral-formulas.md)** - 爆款公式库
- **[data-analysis-methodology.md](references/data-analysis-methodology.md)** - 数据分析方法论
- **[monetization-strategy.md](references/monetization-strategy.md)** - 知识付费变现策略
- **[automation-system.md](references/automation-system.md)** - 自动化系统架构
- **[zhihu-platform-policy.md](references/zhihu-platform-policy.md)** - 知乎平台政策和规则

## 最佳实践

1. **内容质量优先**：深度价值是知乎技术内容的核心
2. **数据驱动决策**：基于数据反馈持续优化内容
3. **系统化运营**：使用方法论和爆款公式提高创作效率
4. **持续学习**：关注 AI 领域最新进展，保持内容新鲜度
5. **互动运营**：积极参与评论区互动，积累粉丝
6. **系列化内容**：建立系列化内容矩阵，形成品牌效应
7. **知识付费**：从免费内容引导到付费产品，实现变现

---

**版本**: v1.0
**创建时间**: 2026-03-29
**维护者**: 知乎技术内容运营专家 AI
