# 知乎自动化操作指南

> **突破知乎自动发布流程的关键一步** 🚀

---

## 📋 概述

本指南将帮助你使用 OpenClaw 自动化运营知乎技术账号，包括：
- 登录管理
- 自动发布文章
- 自动回答问题
- 数据采集

**核心优势**：
- 使用 Playwright 持久化上下文，只需手动登录一次
- 完全自动化发布，无需人工干预
- 支持批量操作和定时任务

---

## 🎯 快速开始

### 第一步：首次登录（只需做一次）

打开终端，运行以下命令：

```bash
cd "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts"
node zhihu-auto-operations.js login
```

浏览器会自动打开，显示知乎登录页面。

**操作步骤**：
1. 使用扫码或手机号登录知乎
2. 登录成功后，回到终端
3. 按回车键继续

脚本会自动：
- 提取知乎 Cookie
- 保存登录状态
- 关闭浏览器

**完成！** 现在你可以使用自动化脚本了。

---

### 第二步：检查登录状态

```bash
cd "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts"
node zhihu-auto-operations.js check-login
```

输出示例：
```
✅ 已登录知乎
   用户: 无何有
```

如果显示未登录，请重新运行 `login` 命令。

---

### 第三步：自动发布文章

#### 3.1 查看待发布文章

```bash
ls -la "~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级/"
```

你会看到类似这样的文件：
```
OpenClaw入门完全指南-10分钟从零搭建AI助手工作流.md
OpenClaw入门完全指南-10分钟从零搭建AI助手工作流.json
RAG优化实战-Evidence-Distillation让你的知识库更聪明.md
RAG优化实战-Evidence-Distillation让你的知识库更聪明.json
...
```

#### 3.2 发布文章

```bash
cd "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts"
node zhihu-auto-operations.js publish "~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级/OpenClaw入门完全指南-10分钟从零搭建AI助手工作流.json"
```

脚本会自动：
1. 打开浏览器（使用持久化上下文，自动登录）
2. 导航到知乎专栏发布页面
3. 填写标题、内容、标签
4. 点击发布按钮
5. 验证发布成功
6. 显示文章 URL
7. 关闭浏览器

**输出示例**：
```
✅ 发布成功！
   文章 URL: https://zhuanlan.zhihu.com/p/123456789
   文章 ID: 123456789
```

---

## 🔧 命令参考

### 检查登录状态

```bash
node zhihu-auto-operations.js check-login
```

### 手动登录

```bash
node zhihu-auto-operations.js login
```

### 发布文章

```bash
node zhihu-auto-operations.js publish <article-file>
```

**参数说明**：
- `<article-file>`: 文章 JSON 文件路径（必需）

**示例**：
```bash
node zhihu-auto-operations.js publish "~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级/OpenClaw入门完全指南-10分钟从零搭建AI助手工作流.json"
```

---

## 📝 文章文件格式

### JSON 格式（推荐）

```json
{
  "title": "文章标题",
  "content": "文章内容（HTML 格式）",
  "tags": ["标签1", "标签2", "标签3"],
  "coverImage": "封面图片 URL（可选）"
}
```

### Markdown 转 JSON

如果你有 Markdown 格式的文章，需要先转换为 JSON 格式。

**转换方法**：

1. 读取 Markdown 文件
2. 将 Markdown 转换为 HTML（使用工具如 `marked`、`markdown-it` 等）
3. 填充到 JSON 的 `content` 字段

**示例脚本**：

```javascript
const fs = require('fs');
const { marked } = require('marked');

// 读取 Markdown
const markdown = fs.readFileSync('article.md', 'utf8');

// 转换为 HTML
const html = marked(markdown);

// 创建 JSON
const articleData = {
  title: "文章标题",
  content: html,
  tags: ["标签1", "标签2", "标签3"],
  coverImage: null
};

// 保存 JSON
fs.writeFileSync('article.json', JSON.stringify(articleData, null, 2));
```

---

## 🔍 工作原理

### 持久化上下文

脚本使用 Playwright 的 `launchPersistentContext` 功能创建持久化上下文。

**优势**：
- 登录状态、Cookie、LocalStorage 等数据自动保存
- 只需手动登录一次
- 每次打开浏览器都会自动恢复登录状态

**数据存储位置**：
```
~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/.browser-data/zhihu/
```

### 自动发布流程

```
1. 启动浏览器（使用持久化上下文）
2. 访问知乎首页
3. 检查登录状态
4. 导航到专栏发布页面
5. 填写标题
6. 填写内容（使用 innerHTML 模拟粘贴）
7. 添加话题标签
8. 点击发布按钮
9. 等待跳转到文章详情页
10. 验证发布成功
11. 显示文章 URL
12. 关闭浏览器
```

---

## ⚠️ 常见问题

### Q1: 提示未登录怎么办？

**A**: 运行 `login` 命令重新登录：
```bash
node zhihu-auto-operations.js login
```

### Q2: 发布时提示找不到元素怎么办？

**A**: 知乎页面结构可能发生了变化。需要更新选择器。

**解决方法**：
1. 打开知乎专栏发布页面
2. 使用浏览器开发者工具检查元素
3. 更新脚本中的选择器

### Q3: Cookie 过期怎么办？

**A**: 持久化上下文会自动管理 Cookie，一般不会过期。

如果遇到登录问题，重新运行 `login` 命令即可。

### Q4: 如何批量发布多篇文章？

**A**: 使用 shell 脚本循环发布：

```bash
#!/bin/bash

cd "~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级/"

for file in *.json; do
  echo "正在发布: $file"
  cd "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts"
  node zhihu-auto-operations.js publish "~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级/$file"

  # 等待 60 秒，避免频繁发布
  sleep 60
done
```

### Q5: 发布时浏览器没有关闭怎么办？

**A**: 脚本会在发布完成后自动关闭浏览器。如果遇到异常导致浏览器未关闭，手动关闭即可。

---

## 📊 发布统计

### 当前待发布文章

| 文章标题 | 优先级 | 状态 |
|---------|--------|------|
| OpenClaw 入门完全指南 | 🔥 高 | 待发布 |
| RAG 优化实战 | 🔥 高 | 待发布 |
| 终于搞懂了位置编码 | 🔥 高 | 待发布 |
| 用 OpenClaw 300 天总结 10 个效率技巧 | 🔥 高 | 待发布 |
| 后端开发：用 OpenClaw 自动化 CI/CD | 🔥 高 | 待发布 |

### 发布计划

建议发布节奏：
- 每天发布 1-2 篇
- 高优先级文章优先发布
- 避免短时间内发布多篇（知乎可能判定为营销）

---

## 🎯 下一步

### 1. 发布第一篇文章

选择一篇高优先级文章，运行发布命令：

```bash
cd "~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/scripts"
node zhihu-auto-operations.js publish "~/.openclaw/workspace/知乎自动运营/📤待发布/🔥高优先级/OpenClaw入门完全指南-10分钟从零搭建AI助手工作流.json"
```

### 2. 监控文章数据

发布后，定期查看文章数据（赞同数、收藏数、评论数），记录在工作日志中。

### 3. 分析数据反馈

根据文章表现，优化内容策略：
- 高赞同文章：分析成功要素，复制到后续文章
- 低赞同文章：分析原因，优化选题和写作

### 4. 迭代优化

持续优化自动化流程：
- 添加更多自动化功能（自动回答问题、数据采集）
- 优化发布脚本（添加更多错误处理）
- 建立定时任务（自动发布、数据监控）

---

## 📚 相关文档

- `zhihu-auto-operations.js` - 核心脚本
- `README.md` - 自动化系统说明
- `HEARTBEAT.md` - 心跳任务驱动文件

---

## 🆘 获取帮助

如果遇到问题：
1. 查看本文档的常见问题部分
2. 查看脚本的日志输出
3. 查看工作日志：`📝工作日志/`

---

**创建时间**: 2026-03-28
**版本**: v1.0.0
**状态**: ✅ 可用
