# 工具箱详细说明

本文档详细说明所有可用的 skills 和工具。

## 📚 已安装的 Skills 总览

| Skill | 位置 | 用途 | 状态 | 详细文档 |
|-------|------|------|------|----------|
| **playwright-browser** | `skills/playwright-browser/` | 浏览器自动化 | ✅ 已激活 | [SKILL.md](../skills/playwright-browser/SKILL.md) |
| **sqlite-memory** | `skills/sqlite-memory/` | 记忆管理 | ✅ 已激活 | [SKILL.md](../skills/sqlite-memory/SKILL.md) |
| **heartbeat** | `skills/heartbeat/` | 心跳系统 | ✅ 已激活 | [SKILL.md](../skills/heartbeat/SKILL.md) |
| **opencli-skill** | `skills/opencli-skill/` | Chrome 浏览器操作 | ✅ 已激活 | [SKILL.md](../skills/opencli-skill/SKILL.md) |
| **elite-longterm-memory** | `skills/elite-longterm-memory/` | 向量记忆 | ⏸️ 未激活 | [SKILL.md](../skills/elite-longterm-memory/SKILL.md) |
| **fanqie-data-fetcher** | `skills/fanqie-data-fetcher/` | 番茄数据抓取 | ✅ 已激活 | [SKILL.md](../skills/fanqie-data-fetcher/SKILL.md) |
| **fanqie-story-optimizer** | `skills/fanqie-story-optimizer/` | 故事优化 | ✅ 已激活 | [SKILL.md](../skills/fanqie-story-optimizer/SKILL.md) |
| **llm-learning** | `skills/llm-learning/` | LLM 学习 | ✅ 已激活 | [SKILL.md](../skills/llm-learning/SKILL.md) |
| **missy** | `skills/missy/` | 短剧下载 | ✅ 已激活 | [SKILL.md](../skills/missy/SKILL.md) |

---

## 1. playwright-browser（浏览器自动化）

### 功能

- ✅ 浏览器自动化（导航、点击、输入）
- ✅ 数据采集（页面内容、截图）
- ✅ 表单填写和提交
- ✅ 多标签页管理

### 核心方法

**推荐方法**：使用 `browser_run_code` 一次性执行完整流程

```bash
mcporter call playwright.browser_run_code code="async (page) => {
  // 导航到目标页面
  await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
  
  // 等待页面加载
  await page.waitForTimeout(3000);
  
  // 执行操作
  const data = await page.evaluate(() => {
    return { /* 返回结果 */ };
  });
  
  return data;
}"
```

### 使用场景

1. **数据采集**：抓取番茄小说短故事管理页面数据
2. **自动发布**：自动填充和发布故事
3. **页面分析**：分析页面结构和选择器

### 自我优化方向

- [ ] 解决长连接问题（支持一步一步调用）
- [ ] 添加更多自动化脚本（数据采集、自动发布）
- [ ] 优化错误处理和重试机制
- [ ] 添加页面类型检测

### 详细文档

- [SKILL.md](../skills/playwright-browser/SKILL.md) - 完整的使用指南
- [技术突破文档](../番茄短篇故事集/docs/浏览器自动化技术突破-2026-03-20.md) - 技术方案说明

---

## 2. sqlite-memory（记忆管理）

### 功能

- ✅ SQLite 数据库（4 个表）
- ✅ 关键词搜索（< 100 ms）
- ✅ 分类查询（按时间、重要程度）
- ✅ 统计信息
- ✅ 自动去重和优化

### 快速使用

```bash
# 关键词搜索
node skills/sqlite-memory/scripts/query-memory.js --search="浏览器"

# 按分类查询
node skills/sqlite-memory/scripts/query-memory.js --category="breakthrough"

# 最近记忆
node skills/sqlite-memory/scripts/query-memory.js --recent

# 重要记忆
node skills/sqlite-memory/scripts/query-memory.js --important

# 统计信息
node skills/sqlite-memory/scripts/query-memory.js --stats

# 优化记忆
node skills/sqlite-memory/scripts/optimize-memory.js
```

### 当前状态

- 总记忆数：15 条
- 数据库大小：172 KB
- 分类统计：creation (7), archived (3), breakthrough (2), general (1), operation (1), task (1)

### 自我优化方向

- [ ] 添加向量搜索支持（语义搜索）
- [ ] 集成到 OpenClaw 主系统
- [ ] 自动记忆写入
- [ ] Web UI

### 详细文档

- [SKILL.md](../skills/sqlite-memory/SKILL.md) - 完整的使用指南
- [系统设计](./memory-system-design.md) - 系统架构说明
- [使用指南](./memory-system-guide.md) - 详细使用方法

---

## 3. heartbeat（心跳系统）

### 功能

- ✅ 状态管理（current-state.md）
- ✅ 任务列表（task-list.md）
- ✅ 执行记录（heartbeat-history/）
- ✅ 定期执行（每 10 分钟）

### 使用方法

- 查看当前状态：`skills/heartbeat/current-state.md`
- 查看任务列表：`skills/heartbeat/task-list.md`
- 查看最新记录：`heartbeat-history/latest.md`

### 自我优化方向

- [ ] 添加任务优先级自动调整
- [ ] 添加任务进度跟踪
- [ ] 添加任务依赖关系管理
- [ ] 添加执行效率分析

### 详细文档

- [SKILL.md](../skills/heartbeat/SKILL.md) - 完整的系统说明

---

## 4. opencli-skill（Chrome 浏览器操作）

### 功能

- ✅ 通过复用 Chrome 登录状态操作网站
- ✅ 支持 B站、知乎、微博、Twitter 等主流平台
- ✅ 无需单独管理 Cookie

### 使用场景

- 操作 opencli 支持的平台（B站、知乎等）
- 需要登录状态的自动化操作

### 限制

- ❌ 不支持番茄小说
- ⚠️ 需要安装 opencli Browser Bridge 扩展

### 详细文档

- [SKILL.md](../skills/opencli-skill/SKILL.md) - 完整的使用指南

---

## 5. elite-longterm-memory（向量记忆）

### 功能

- ✅ 向量搜索（语义搜索）
- ✅ LanceDB 向量数据库
- ✅ Git-Notes 知识图谱

### 当前状态

- ⏸️ 未激活（需要配置 OPENAI_API_KEY）
- ⚠️ 依赖较多，配置复杂

### 与 sqlite-memory 的区别

| 特性 | sqlite-memory | elite-longterm-memory |
|------|--------------|---------------------|
| **搜索** | 关键词搜索 | 语义搜索 |
| **依赖** | better-sqlite3 | LanceDB + OpenAI API |
| **配置** | 无需配置 | 需要 OPENAI_API_KEY |
| **复杂度** | 简单 ✅ | 复杂 |

### 建议

**推荐使用 sqlite-memory**：
- ✅ 简单易用
- ✅ 已激活
- ✅ 性能优秀

**elite-longterm-memory**：
- 适合需要语义搜索的高级场景
- 需要配置 OPENAI_API_KEY

### 详细文档

- [SKILL.md](../skills/elite-longterm-memory/SKILL.md) - 完整的使用指南

---

## 🎯 自我优化机制

### 优化流程

```
发现问题 → 分析原因 → 设计解决方案 → 实施优化 → 验证效果 → 记录经验
```

### 优化示例

**案例：浏览器自动化长连接问题**

1. **发现问题**：每次调用单独命令后连接断开
2. **分析原因**：`--extension` 模式不支持长连接
3. **设计解决方案**：使用 `browser_run_code` 一次性执行
4. **实施优化**：更新 playwright-browser Skill
5. **验证效果**：成功获取番茄小说数据
6. **记录经验**：更新 SKILL.md 和 MEMORY.md

### 工具使用规范

1. **优先使用现有工具**：不要重复造轮子
2. **遇到问题先查文档**：查看 SKILL.md 了解最佳实践
3. **主动优化工具**：发现问题及时记录和优化
4. **保持工具更新**：定期更新 skill 文件和脚本
5. **分享优化经验**：记录优化过程，方便后续参考

---

**创建时间**：2026-03-20 22:14
**维护者**：心跳时刻 - 番茄小说创作和运营
**更新频率**：当有新 skill 或工具更新时
