# Skills 目录

> 存放 OpenClaw Skills（技能），用于直接在 OpenClaw 中使用知乎自动化功能

---

## 🎯 Skills 说明

### 什么是 Skills？

Skills 是 OpenClaw 的技能模块，可以：
- 直接在 OpenClaw 对话中使用
- 简化常用操作
- 提供交互式界面
- 集成到工作流中

### Skills 的优势

- ✅ 易于使用：无需记忆命令行参数
- ✅ 交互友好：提供清晰的界面和选项
- ✅ 自动化：一键完成复杂操作
- ✅ 可扩展：可以添加新功能

---

## 📁 目录结构

```
skills/
├── zhihu-publisher/           发布 Skill（回答、专栏文章）
├── zhihu-collector/           数据采集 Skill
└── zhihu-analyzer/            分析 Skill
```

---

## 🛠️ Skills 列表

### 1. zhihu-publisher

**用途**: 发布知乎回答和专栏文章

**功能**:
- 发布回答
- 发布专栏文章
- 定时发布
- 发布后验证

**使用方法**:
```bash
# 在 OpenClaw 对话中直接使用
发布一篇知乎回答，标题是"..."，内容是"..."
```

**配置文件**: `skills/zhihu-publisher/SKILL.md`

---

### 2. zhihu-collector

**用途**: 采集知乎数据

**功能**:
- 采集回答数据
- 采集专栏数据
- 采集粉丝数据
- 热门话题追踪

**使用方法**:
```bash
# 在 OpenClaw 对话中直接使用
采集我的知乎回答数据
```

**配置文件**: `skills/zhihu-collector/SKILL.md`

---

### 3. zhihu-analyzer

**用途**: 分析知乎数据

**功能**:
- 热门话题分析
- 竞品内容分析
- 标题优化分析
- 最佳发布时间分析

**使用方法**:
```bash
# 在 OpenClaw 对话中直接使用
分析知乎热榜上的热门话题
```

**配置文件**: `skills/zhihu-analyzer/SKILL.md`

---

## 📝 Skills 开发指南

### Skill 文件结构

```
skills/{skill-name}/
├── SKILL.md                   ⭐ Skill 说明文件
├── scripts/                   脚本文件
└── templates/                 模板文件
```

### SKILL.md 格式

```markdown
# {Skill Name}

## Description

{简要描述 Skill 的功能}

## Usage

{如何使用这个 Skill}

## Configuration

{配置说明}

## Examples

{使用示例}
```

---

## 🚀 Skills 开发计划

### 阶段 1: 基础 Skills（2-3天）

- [ ] 创建 zhihu-publisher Skill
  - [ ] 发布回答功能
  - [ ] 发布专栏文章功能
  - [ ] 定时发布功能
- [ ] 创建 zhihu-collector Skill
  - [ ] 采集回答数据
  - [ ] 采集专栏数据
  - [ ] 采集粉丝数据
- [ ] 创建 zhihu-analyzer Skill
  - [ ] 热门话题分析
  - [ ] 竞品内容分析

### 阶段 2: 高级 Skills（3-5天）

- [ ] 扩展 zhihu-publisher Skill
  - [ ] 支持富文本编辑
  - [ ] 支持图片上传
  - [ ] 支持视频上传
- [ ] 扩展 zhihu-collector Skill
  - [ ] 实时数据监控
  - [ ] 数据可视化
  - [ ] 数据导出
- [ ] 扩展 zhihu-analyzer Skill
  - [ ] 机器学习分析
  - [ ] 趋势预测
  - [ ] 智能推荐

---

## 🔧 Skills 使用技巧

### 1. 自然语言调用

**推荐方式**:
```bash
# 自然语言调用
发布一篇知乎专栏文章，标题是"..."

# 避免使用技术术语
❌ 运行 scripts/publish/publish-article.js --title "..."
✅ 发布一篇知乎专栏文章，标题是"..."
```

### 2. 上下文感知

**利用对话上下文**:
```bash
# 第一次对话
采集我的知乎回答数据

# 第二次对话（利用上下文）
分析这些数据，找出赞同数最高的回答
```

### 3. 多轮交互

**通过多轮对话完成复杂任务**:
```bash
# 第一轮
追踪知乎热榜

# 第二轮
从这些热门话题中，筛选出技术相关的

# 第三轮
为这些技术话题创作选题建议
```

---

## 📚 Skills 资源

### OpenClaw Skills 文档

- [Skills 开发指南](https://openclaw.com/docs/skills)
- [Skills API 文档](https://openclaw.com/docs/skills-api)
- [Skills 最佳实践](https://openclaw.com/docs/skills-best-practices)

### 参考案例

- [番茄小说 Skill](~/.openclaw/workspace/skills/fanqie-*)
- [小红书运营 Skill](~/.openclaw/workspace/skills/xiaohongshu-*)

---

## ⚠️ 注意事项

1. **Skill 命名**: 使用清晰的命名，便于理解和记忆
2. **文档完善**: 每个 Skill 都应该有完整的 SKILL.md 文档
3. **错误处理**: Skills 应该有完善的错误处理和提示
4. **用户友好**: 提供清晰的使用说明和示例

---

## 🔗 相关文档

- [主 README](../README.md) - 自动化系统说明
- [脚本说明](../scripts/README.md) - 脚本使用说明
- [系统架构](../docs/系统架构.md) - 系统架构设计

---

## 💡 下一步

1. 学习 OpenClaw Skills 开发
2. 创建第一个 Skill
3. 测试 Skill 功能
4. 优化用户体验

---

**创建时间**: 2026-03-28 22:46
**版本**: v1.0
**状态**: 🚀 计划中
