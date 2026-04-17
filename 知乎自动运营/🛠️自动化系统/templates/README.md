# 模板目录

> 存放知乎自动化系统的模板文件，用于内容创作和数据导出

---

## 📁 目录结构

```
templates/
├── answer-template.json      回答模板
├── article-template.json     专栏文章模板
├── data-export-template.csv  数据导出模板
└── （其他模板文件）
```

---

## 📝 模板文件说明

### 1. 回答模板 (answer-template.json)

**用途**: 定义知乎回答的结构和格式

**数据格式**:
```json
{
  "questionId": "98765432",
  "title": "问题标题",
  "content": "回答内容",
  "tags": ["技术", "AI", "OpenClaw"],
  "images": [],
  "publishTime": "2026-03-28T10:00:00Z"
}
```

**使用方法**:
```javascript
const fs = require('fs');

// 加载模板
const template = JSON.parse(fs.readFileSync('templates/answer-template.json'));

// 填充数据
const answer = {
  ...template,
  questionId: "12345678",
  title: "OpenClaw 有哪些实用技巧？",
  content: "..."
};

// 保存回答
fs.writeFileSync('output/answer.json', JSON.stringify(answer, null, 2));
```

---

### 2. 专栏文章模板 (article-template.json)

**用途**: 定义知乎专栏文章的结构和格式

**数据格式**:
```json
{
  "title": "文章标题",
  "summary": "文章摘要",
  "content": "文章内容",
  "tags": ["技术", "AI", "教程"],
  "images": [],
  "publishTime": "2026-03-28T10:00:00Z"
}
```

**使用方法**:
```javascript
const fs = require('fs');

// 加载模板
const template = JSON.parse(fs.readFileSync('templates/article-template.json'));

// 填充数据
const article = {
  ...template,
  title: "OpenClaw 核心功能全解",
  summary: "深入了解 OpenClaw 的核心功能",
  content: "..."
};

// 保存文章
fs.writeFileSync('output/article.json', JSON.stringify(article, null, 2));
```

---

### 3. 数据导出模板 (data-export-template.csv)

**用途**: 定义数据导出的 CSV 格式

**CSV 格式**:
```csv
timestamp,questionId,title,voteupCount,commentCount,viewCount,collectionCount,author,url
2026-03-28T10:00:00Z,12345678,OpenClaw 有哪些实用技巧？,100,20,5000,30,用户名,https://www.zhihu.com/question/12345678/answer/12345678
```

**使用方法**:
```javascript
const fs = require('fs');

// 加载模板
const template = fs.readFileSync('templates/data-export-template.csv', 'utf8');

// 填充数据
const data = [
  {
    timestamp: "2026-03-28T10:00:00Z",
    questionId: "12345678",
    title: "OpenClaw 有哪些实用技巧？",
    voteupCount: 100,
    commentCount: 20,
    viewCount: 5000,
    collectionCount: 30,
    author: "用户名",
    url: "https://www.zhihu.com/question/12345678/answer/12345678"
  }
];

// 生成 CSV
const csv = data.map(row =>
  `${row.timestamp},${row.questionId},${row.title},${row.voteupCount},${row.commentCount},${row.viewCount},${row.collectionCount},${row.author},${row.url}`
).join('\n');

fs.writeFileSync('output/data.csv', template + '\n' + csv);
```

---

## 🎨 模板设计原则

### 1. 清晰的结构

- 使用清晰的字段名
- 保持一致的格式
- 添加必要的注释

### 2. 灵活的可扩展性

- 支持可选字段
- 支持自定义字段
- 支持嵌套结构

### 3. 完整的验证

- 字段类型验证
- 字段长度验证
- 必填字段检查

---

## 🛠️ 模板使用流程

### 1. 加载模板

```javascript
const fs = require('fs');

// 加载模板
const template = JSON.parse(fs.readFileSync('templates/answer-template.json'));
```

### 2. 填充数据

```javascript
// 填充数据
const data = {
  ...template,
  questionId: "12345678",
  title: "OpenClaw 有哪些实用技巧？",
  content: "..."
};
```

### 3. 验证数据

```javascript
// 验证必填字段
if (!data.questionId) {
  throw new Error('questionId is required');
}

if (!data.title) {
  throw new Error('title is required');
}
```

### 4. 保存数据

```javascript
// 保存数据
fs.writeFileSync('output/answer.json', JSON.stringify(data, null, 2));
```

---

## 📊 模板类型

### 内容模板

- `answer-template.json` - 回答模板
- `article-template.json` - 专栏文章模板

### 数据模板

- `data-export-template.csv` - 数据导出模板
- `report-template.json` - 报告模板

### 配置模板

- `config-template.json` - 配置模板
- `settings-template.json` - 设置模板

---

## 🧹 模板维护

### 定期更新

**当数据结构变化时，及时更新模板**:
1. 识别变化的字段
2. 更新模板文件
3. 测试新模板
4. 更新文档

### 版本管理

**使用版本号管理模板**:
```bash
templates/
├── answer-template-v1.json
├── answer-template-v2.json
└── answer-template.json (latest)
```

---

## 🔧 模板工具

### 1. 模板验证工具

**脚本**: `scripts/tools/validate-template.js`

**用途**: 验证模板是否符合规范

**使用方法**:
```bash
node scripts/tools/validate-template.js templates/answer-template.json
```

---

### 2. 模板生成工具

**脚本**: `scripts/tools/generate-template.js`

**用途**: 根据数据生成模板

**使用方法**:
```bash
node scripts/tools/generate-template.js --type answer --output templates/answer-template.json
```

---

### 3. 模板转换工具

**脚本**: `scripts/tools/convert-template.js`

**用途**: 转换模板格式（如 JSON → CSV）

**使用方法**:
```bash
node scripts/tools/convert-template.js --input template.json --output template.csv
```

---

## 💡 最佳实践

### 1. 使用模板管理器

```javascript
class TemplateManager {
  constructor(templateDir) {
    this.templateDir = templateDir;
  }

  loadTemplate(templateName) {
    const path = `${this.templateDir}/${templateName}`;
    const content = fs.readFileSync(path, 'utf8');
    return JSON.parse(content);
  }

  saveTemplate(templateName, template) {
    const path = `${this.templateDir}/${templateName}`;
    fs.writeFileSync(path, JSON.stringify(template, null, 2));
  }
}

// 使用模板管理器
const templateManager = new TemplateManager('templates');
const template = templateManager.loadTemplate('answer-template.json');
```

### 2. 模板继承

```javascript
// 基础模板
const baseTemplate = {
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// 扩展模板
const answerTemplate = {
  ...baseTemplate,
  questionId: null,
  title: null,
  content: null
};
```

### 3. 模板验证

```javascript
function validateTemplate(template, schema) {
  for (const field in schema) {
    if (!template[field]) {
      throw new Error(`${field} is required`);
    }
  }
}

// 验证模板
const schema = {
  questionId: true,
  title: true,
  content: true
};

validateTemplate(answer, schema);
```

---

## ⚠️ 注意事项

1. **模板一致性**: 保持模板的一致性，避免混乱
2. **模板文档**: 为每个模板编写使用说明
3. **模板测试**: 定期测试模板的有效性
4. **模板版本**: 使用版本号管理模板变更

---

## 🔗 相关文档

- [主 README](../README.md) - 自动化系统说明
- [脚本说明](../scripts/README.md) - 脚本使用说明
- [数据说明](../data/README.md) - 数据目录说明

---

## 💡 下一步

1. 创建更多模板
2. 开发模板工具
3. 优化模板设计
4. 完善模板文档

---

**创建时间**: 2026-03-28 22:46
**版本**: v1.0
**状态**: 🚀 计划中
