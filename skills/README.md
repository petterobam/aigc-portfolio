# 技能目录

## 概述

此目录存储各种技能（Skills），每个技能都是一个独立的功能模块，可以通过 OpenClaw 的技能系统调用。

## 目录结构

```
skills/
├── elite-longterm-memory/        # 长期记忆管理技能
├── fanqie-data-fetcher/          # 番茄小说数据获取技能
├── fanqie-duplicate-detector/    # 番茄小说重复检测技能
├── fanqie-story-optimizer/       # 番茄小说故事优化技能
├── fanqie-title-optimizer/       # 番茄小说标题优化技能
├── heartbeat/                    # 心跳系统技能
├── llm-learning/                 # LLM 学习技能
├── memory-optimizer/             # 记忆优化技能
├── missy/                        # 短剧下载技能
├── novel-writer/                 # 小说创作助手技能
├── opencli-skill/                # OpenCLI 技能模板
├── playwright-browser/           # Playwright 浏览器自动化技能
├── self-improving-agent-3.0.0/    # 自我改进代理技能
└── sqlite-memory/                # SQLite 记忆管理技能
```

## 技能分类

### 🎯 番茄小说相关技能

#### 1. fanqie-data-fetcher

**用途**: 从番茄小说平台获取数据

**功能**:
- 收集故事数据（阅读量、点赞、评论、关注）
- 收集分类数据
- 收集趋势数据

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/collect-data.py` - 数据收集脚本

**使用示例**:
```bash
python3 skills/fanqie-data-fetcher/scripts/collect-data.py list
```

---

#### 2. fanqie-duplicate-detector

**用途**: 检测故事中的重复段落

**功能**:
- 检测完全重复的段落
- 检测高度相似的段落
- 计算重复率
- 生成重复报告

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/detect-duplicates.py` - 重复检测脚本

**使用示例**:
```bash
python3 skills/fanqie-duplicate-detector/scripts/detect-duplicates.py <故事ID>
```

---

#### 3. fanqie-story-optimizer

**用途**: 优化故事质量

**功能**:
- 故事内容分析
- 爽点检测
- 节奏分析
- 优化建议

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/optimize-story.py` - 故事优化脚本

**使用示例**:
```bash
python3 skills/fanqie-story-optimizer/scripts/optimize-story.py <故事ID>
```

---

#### 4. fanqie-title-optimizer

**用途**: 优化故事标题

**功能**:
- 标题长度分析
- 关键词分析
- 标题吸引力评分
- 优化建议

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/optimize-title.py` - 标题优化脚本

**使用示例**:
```bash
python3 skills/fanqie-title-optimizer/scripts/optimize-title.py <故事ID>
```

---

### 🤖 记忆和学习技能

#### 1. elite-longterm-memory

**用途**: 长期记忆管理

**功能**:
- 记忆存储
- 记忆检索
- 记忆优化

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/memory-manager.py` - 记忆管理脚本

---

#### 2. llm-learning

**用途**: LLM 学习和优化

**功能**:
- LLM 能力学习
- 提示词优化
- 输出质量提升

**核心文件**:
- `SKILL.md` - 技能使用说明
- `learning-notes/` - 学习笔记

---

#### 3. memory-optimizer

**用途**: 记忆优化

**功能**:
- 记忆去重
- 记忆整理
- 记忆索引

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/optimize-memory.py` - 记忆优化脚本

---

#### 4. sqlite-memory

**用途**: SQLite 记忆管理

**功能**:
- 记忆存储（SQLite）
- 记忆检索
- 记忆查询

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/memory-manager.py` - 记忆管理脚本

**使用示例**:
```bash
python3 skills/sqlite-memory/scripts/memory-manager.py query "番茄小说"
```

---

### 🔧 自动化技能

#### 1. playwright-browser

**用途**: Playwright 浏览器自动化

**功能**:
- 页面导航
- 表单填写
- 数据采集
- 自动化发布

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/browser-automation.js` - 浏览器自动化脚本

**使用示例**:
```bash
node skills/playwright-browser/scripts/browser-automation.js
```

---

#### 2. heartbeat

**用途**: 心跳系统

**功能**:
- 定期任务执行
- 状态检查
- 自动化提醒

**核心文件**:
- `SKILL.md` - 技能使用说明
- `current-state.md` - 当前状态
- `logs/` - 心跳日志

---

### ✍️ 创作技能

#### 1. novel-writer

**用途**: 小说创作助手

**功能**:
- 七步方法论
- 角色管理
- 情节规划
- 章节写作

**核心文件**:
- `SKILL.md` - 技能使用说明
- `constitution.md` - 创作宪法
- `docs/` - 文档目录

**使用示例**:
```bash
python3 skills/novel-writer/scripts/novel-writer.py
```

---

### 🎬 其他技能

#### 1. missy

**用途**: 短剧下载

**功能**:
- 短剧链接解析
- 短剧下载
- 上传到网盘

**核心文件**:
- `SKILL.md` - 技能使用说明
- `scripts/missy-download.py` - 短剧下载脚本

**使用示例**:
```bash
python3 skills/missy/scripts/missy-download.py <短剧链接>
```

---

#### 2. opencli-skill

**用途**: OpenCLI 技能模板

**功能**:
- 技能模板
- 技能开发指南

**核心文件**:
- `SKILL.md` - 技能使用说明
- `template/` - 技能模板

---

#### 3. self-improving-agent-3.0.0

**用途**: 自我改进代理

**功能**:
- 自我反思
- 自我优化
- 自我迭代

**核心文件**:
- `SKILL.md` - 技能使用说明
- `reflection.md` - 反思文档

---

## 技能开发

### 创建新技能

1. 在 `skills/` 目录下创建新目录
2. 创建 `SKILL.md` 文件（技能使用说明）
3. 创建 `scripts/` 目录（脚本文件）
4. 创建 `docs/` 目录（文档文件）
5. 在主 `SKILL.md` 中注册新技能

### 技能模板

参考 `opencli-skill/` 目录中的技能模板。

### 技能规范

每个技能应包含：
- ✅ `SKILL.md` - 技能使用说明（必须）
- ✅ `scripts/` - 脚本文件目录（必须）
- ✅ `docs/` - 文档文件目录（可选）
- ✅ `tests/` - 测试文件目录（可选）

## 技能调用

### 通过 OpenClaw 调用

技能通过 OpenClaw 的技能系统自动调用，无需手动指定。

### 手动调用脚本

```bash
# 调用番茄小说数据获取脚本
python3 skills/fanqie-data-fetcher/scripts/collect-data.py list

# 调用重复检测脚本
python3 skills/fanqie-duplicate-detector/scripts/detect-duplicates.py 39

# 调用浏览器自动化脚本
node skills/playwright-browser/scripts/browser-automation.js
```

## 技能优化

### 优化流程

1. **发现问题**: 在使用技能时发现问题
2. **记录问题**: 在技能的 `SKILL.md` 中记录问题
3. **设计方案**: 设计优化方案
4. **实施优化**: 实施优化方案
5. **验证效果**: 验证优化效果
6. **更新文档**: 更新技能文档

### 优化建议

- 定期检查技能的 `SKILL.md` 文件，确保文档与实际功能一致
- 定期检查脚本文件，优化代码质量
- 定期收集用户反馈，持续优化技能

## 相关工具

- `scripts/` - 主脚本目录
- `automation/` - 自动化目录
- `data/` - 数据目录

## 维护建议

1. **定期更新**: 每月检查一次技能更新需求
2. **定期优化**: 每周优化一个技能
3. **定期测试**: 每次优化后进行测试
4. **文档同步**: 确保文档与实际功能一致

---

**最后更新**: 2026-03-27 01:50
