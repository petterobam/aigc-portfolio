# 文件推送能力

## 概述
简化聊天内容，直接推送文件而不是发送完整内容。

## 使用格式

```
MEDIA:<文件路径>
```

## 示例

### 单个文件
```
MEDIA:~/.openclaw/workspace/data/能力档案库.json
MEDIA:./knowledge/work/cron-tasks.md
```

### 多个文件
```
MEDIA:./knowledge/work/cron-tasks.md
MEDIA:./knowledge/work/workflow-question-handling.md
MEDIA:./data/能力档案库.json
```

### 绝对路径
```
MEDIA:~/.openclaw/workspace/TOOLS.md
```

### 相对路径（推荐）
```
MEDIA:./knowledge/README.md
```

## 特点

- ✅ 支持同时推送多个文件
- ✅ 支持相对路径和绝对路径
- ✅ 不直接发送文件内容，让用户访问原文件
- ✅ 减少聊天内容冗余
- ✅ 保持文件格式完整性

## 使用场景

### 1. 推送报告文件
- 成长报告
- 任务统计
- 数据分析报告
```
MEDIA:./data/能力档案库.json
```

### 2. 推送配置文件
- OpenClaw 配置
- 技能配置
- 环境变量
```
MEDIA:~/.openclaw/config.json
```

### 3. 推送日志文件
- 执行日志
- 错误日志
- 调试日志
```
MEDIA:./logs/error.log
```

### 4. 推送数据文件
- JSON 数据
- CSV 数据
- 数据库导出
```
MEDIA:./data/export-2026-03-31.csv
```

## 注意事项

### 路径规范
- ❌ 避免使用 `~` 路径（某些平台不支持）
- ✅ 使用相对路径（推荐）：`./path/to/file`
- ✅ 使用绝对路径：`~/.openclaw/path/to/file`
- ✅ 确保文件路径正确且可访问

### 文件类型
- ✅ 支持所有文件类型
- ✅ 常用：`.md`, `.json`, `.csv`, `.txt`, `.log`, `.pdf`, `.docx`
- ✅ 代码文件：`.js`, `.py`, `.ts`, `.go`, `.rs` 等

### 用户体验
- 📌 文件会显示为可点击的链接
- 📌 用户可以直接下载或访问
- 📌 避免在聊天中发送大段内容
- 📌 适合推送超过 50 行的文件

## 最佳实践

### 何时使用文件推送
- 文件内容超过 50 行
- 文件包含大量数据（JSON、CSV）
- 需要保持文件格式（表格、代码块）
- 用户需要保存或引用文件
- 需要推送多个文件

### 何时直接发送内容
- 文件内容少于 20 行
- 需要快速展示关键信息
- 用户只是想快速查看
- 临时性的小片段

### 推送多个文件
```
# 方式1：分行推送
MEDIA:./file1.md
MEDIA:./file2.md
MEDIA:./file3.md

# 方式2：带说明
以下是我整理的三个文件：
1. 配置文件：MEDIA:./config.json
2. 日志文件：MEDIA:./logs/error.log
3. 数据文件：MEDIA:./data/export.csv
```

## 更新日志
- 2026-03-31: 初始化文件推送能力文档
- 2026-03-31: 记录到 TOOLS.md 和能力档案库
