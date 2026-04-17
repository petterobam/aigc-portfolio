# ✍️ 文章草稿

> **说明**：写作中的文章草稿，完成并标准化元数据后移至 `📤待发布`

---

## 📂 目录结构

```
✍️文章草稿/
├── README.md                    本文件
├── [文章标题].md               文章草稿（Markdown 格式）
├── [文章标题].json             文章元数据（JSON 格式）
```

---

## 📝 文章状态

### 已完成文章

| 文章标题 | 字数 | 状态 | 转移日期 |
|---------|------|------|---------|
| OpenClaw 多模型协同：GPT-4 + Claude 3 + DeepSeek 组拳出击 | 6,500 | ✅ 已转移 | 2026-04-01 |
| OpenClaw + Claude 3：构建你的专属 AI 编程助手 | 5,800 | ✅ 已转移 | 2026-04-01 |
| OpenClaw 进阶：从零开发自定义 Skill（含完整代码） | 6,200 | ✅ 已转移 | 2026-03-31 |
| 别再手动写周报了！我用 OpenClaw 自动生成周报，领导都说好 | 3,500 | ✅ 已转移 | 2026-04-01 |
| 向量数据库选型指南：Faiss vs Milvus vs Pinecone | 5,200 | ✅ 已转移 | 2026-03-31 |
| 大模型微调：LoRA vs P-Tuning vs 全量微调 | 5,600 | ✅ 已转移 | 2026-03-31 |
| 大模型部署：从云端到边缘设备 | 5,800 | ✅ 已转移 | 2026-03-31 |
| 提示词工程进阶：从 CoT 到结构化 Prompt | 7,200 | ✅ 已转移 | 2026-03-31 |

### 写作中的文章

| 文章标题 | 进度 | 预计完成日期 |
|---------|------|-------------|
| (暂无写作中的文章) | - | - |

---

## 🔄 工作流程

### 1. 创建文章草稿

**方式 1：手动创建**
```bash
# 创建 Markdown 文件
touch "✍️文章草稿/[文章标题].md"

# 创建元数据文件
touch "✍️文章草稿/[文章标题].json"
```

**方式 2：使用创作系统**
```bash
# 使用 OpenClaw 创作工具
node scripts/create-article.js "[文章标题]"
```

---

### 2. 编辑文章

**工具选择**：
- **Markdown 编辑器**：Typora、Obsidian、VS Code
- **在线编辑器**：StackEdit、HackMD

**格式规范**：
- 使用 Markdown 语法
- 标题层级清晰（H1、H2、H3）
- 代码块使用语言标识（\`\`\`python）
- 图片使用相对路径（`./images/`）

---

### 3. 创建元数据

**元数据文件格式**（JSON）：

```json
{
  "title": "文章标题",
  "author": "作者",
  "publishTime": "YYYY-MM-DD",
  "tags": ["标签1", "标签2", "标签3"],
  "category": "类别",
  "priority": "high|medium|low",
  "wordCount": 1000,
  "codeSnippets": 0,
  "readingTime": 5,
  "difficulty": "⭐⭐⭐（中高级）",
  "estimatedMetrics": {
    "likes": 100,
    "favorites": 50,
    "comments": 20
  },
  "keywords": ["关键词1", "关键词2"],
  "summary": "文章摘要",
  "contentStructure": {
    "intro": 10,
    "core": 60,
    "practice": 20,
    "conclusion": 10
  },
  "targetAudience": ["目标读者1", "目标读者2"],
  "valueProposition": "价值主张",
  "callToAction": "行动号召",
  "publishPlan": {
    "bestTime": "最佳发布时间",
    "relatedColumn": "相关专栏",
    "monetizationPath": "变现路径",
    "questionToAnswer": "要回答的问题"
  },
  "references": [
    "https://example.com"
  ],
  "type": "专栏文章|回答",
  "status": "draft|ready_to_review|ready_to_publish"
}
```

---

### 4. 文章评审

**评审清单**：

- [ ] 标题吸引人且准确
- [ ] 摘要清晰概括文章内容
- [ ] 结构合理，逻辑清晰
- [ ] 内容深度足够，有实用价值
- [ ] 代码示例可运行
- [ ] 图片清晰且有说明
- [ ] 无错别字和语法错误
- [ ] 引用准确，有来源
- [ ] 行动号召明确
- [ ] 元数据完整

---

### 5. 移至待发布

**完成条件**：

1. ✅ 文章内容完整
2. ✅ 元数据完整且准确
3. ✅ 通过评审
4. ✅ 标准化元数据已创建

**转移步骤**：

```bash
# 1. 移动 Markdown 文件
mv "✍️文章草稿/[文章标题].md" "📤待发布/🔥高优先级/[文章标题].md"

# 2. 移动元数据文件
mv "✍️文章草稿/[文章标题].json" "📤待发布/🔥高优先级/[文章标题].json"

# 3. 创建标准化元数据
# 使用脚本自动创建
node scripts/create-standardized-metadata.js "📤待发布/🔥高优先级/[文章标题].json"

# 4. 更新待发布 README
cd 📤待发布
# README.md 会自动更新
```

---

## 📊 统计

### 文章统计

| 指标 | 数量 |
|------|------|
| 总文章数 | 8 |
| 已完成 | 8 |
| 写作中 | 0 |
| 已转移至待发布 | 8 |

### 字数统计

| 文章类别 | 总字数 | 平均字数 |
|---------|--------|---------|
| OpenClaw 技巧系列 | 16,500 | 5,500 |
| AIGC 原理系列 | 23,600 | 5,900 |
| 实战案例 | 3,500 | 3,500 |

---

## 🎯 最佳实践

### 1. 文章命名规范

**格式**：`[文章标题].md` 或 `[文章标题].json`

**示例**：
- `OpenClaw入门完全指南-10分钟从零搭建AI助手工作流.md`
- `Transformer原理深度解析-附完整源码推导.md`
- `用OpenClaw300天-我总结出10个让效率翻倍的技巧.md`

### 2. 元数据命名规范

**格式**：`[文章标题].json` 或 `[文章标题]-standardized.json`

**示例**：
- `OpenClaw入门完全指南-standardized.json`（标准化元数据）
- `Transformer原理深度解析-standardized.json`（标准化元数据）

### 3. 图片管理

**推荐结构**：
```
✍️文章草稿/
├── [文章标题].md
├── [文章标题].json
└── images/
    ├── diagram1.png
    ├── screenshot1.png
    └── ...
```

### 4. 代码示例

**格式**：
```markdown
```python
# 代码示例
def hello():
    print("Hello, World!")
```
```

**要求**：
- 添加语言标识（python、javascript、java 等）
- 代码可运行
- 添加注释说明
- 使用 4 空格缩进

### 5. 引用规范

**格式**：
```markdown
**引用来源**：
- [论文标题](https://arxiv.org/abs/xxxx)
- [文章标题](https://example.com)
- [书籍名称](https://example.com)
```

---

## 🔗 相关文档

- **内容生产流程**：`✍️内容生产/README.md`
- **待发布目录**：`📤待发布/README.md`
- **文章评审标准**：`🔧SOP/文章评审.md`
- **元数据规范**：`🔧SOP/元数据规范.md`

---

## 📝 更新记录

| 日期 | 更新内容 |
|------|---------|
| 2026-04-01 | 初始版本，创建 README 文档 |

---

**创建时间**: 2026-04-01 06:45
**版本**: v1.0
**状态**: ✅ 完成
