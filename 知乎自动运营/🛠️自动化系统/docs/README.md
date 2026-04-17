# 文档目录

> 知乎自动化系统的完整文档集合

---

## 📚 文档列表

### 1. 系统架构 (系统架构.md)

**用途**: 系统的整体架构设计和技术选型

**内容**:
- 技术栈选型
- 系统架构图
- 模块划分
- 数据流设计
- 安全性考虑

**适用人群**: 开发者、架构师

---

### 2. Cookie 提取指南 (extract-zhihu-cookies-guide.md)

**用途**: 如何提取知乎 Cookie

**内容**:
- 为什么需要提取 Cookie
- 提取方法 (自动/手动)
- Cookie 保存位置
- Cookie 有效期说明
- 常见问题排查

**适用人群**: 所有用户

---

### 3. 手动 Cookie 导出指南 (manual-cookie-export-guide.md)

**用途**: 手动从浏览器导出 Cookie 的详细步骤

**内容**:
- Chrome 浏览器导出步骤
- Firefox 浏览器导出步骤
- Safari 浏览器导出步骤
- Edge 浏览器导出步骤
- Cookie 格式说明

**适用人群**: 所有用户

---

### 4. Cron 定时任务配置 (crontab-tasks.md)

**用途**: 配置自动化系统的定时任务

**内容**:
- crontab 基础语法
- 知乎自动化系统的定时任务配置
- 日志输出配置
- 错误处理配置
- 示例配置

**适用人群**: 运维人员、开发者

---

## 📖 文档阅读路径

### 新手入门路径

1. **系统架构** (系统架构.md)
   - 了解系统的整体设计
   - 理解技术栈和模块划分

2. **Cookie 提取指南** (extract-zhihu-cookies-guide.md)
   - 提取知乎 Cookie
   - 配置认证信息

3. **Cron 定时任务配置** (crontab-tasks.md)
   - 配置定时任务
   - 启动自动化系统

---

### 开发者路径

1. **系统架构** (系统架构.md)
   - 深入理解系统设计
   - 了解模块交互

2. **Cron 定时任务配置** (crontab-tasks.md)
   - 了解定时任务配置
   - 理解错误处理机制

3. **Cookie 提取指南** (extract-zhihu-cookies-guide.md)
   - 了解认证机制
   - 理解 Cookie 管理

---

### 运维人员路径

1. **Cron 定时任务配置** (crontab-tasks.md)
   - 配置定时任务
   - 监控任务执行

2. **系统架构** (系统架构.md)
   - 了解系统部署
   - 理解资源需求

3. **Cookie 提取指南** (extract-zhihu-cookies-guide.md)
   - 了解 Cookie 管理
   - 处理认证问题

---

## 🔍 文档索引

### 按功能分类

| 功能 | 文档 | 说明 |
|------|------|------|
| 系统设计 | 系统架构.md | 整体架构设计 |
| 认证配置 | extract-zhihu-cookies-guide.md | Cookie 提取和配置 |
| 认证配置 | manual-cookie-export-guide.md | 手动 Cookie 导出 |
| 定时任务 | crontab-tasks.md | Cron 配置 |

### 按角色分类

| 角色 | 推荐文档 |
|------|---------|
| 新手 | 系统架构.md → extract-zhihu-cookies-guide.md → crontab-tasks.md |
| 开发者 | 系统架构.md → crontab-tasks.md → extract-zhihu-cookies-guide.md |
| 运维 | crontab-tasks.md → 系统架构.md → extract-zhihu-cookies-guide.md |

---

## 📝 文档贡献指南

### 文档格式

- 使用 Markdown 格式
- 保持简洁清晰
- 使用代码块示例
- 添加必要的图表

### 文档更新

- 功能变更时更新文档
- 定期检查文档的准确性
- 记录文档的修改历史

### 文档版本

- 在文档中标注版本号
- 记录更新日期
- 说明变更内容

---

## 🔗 相关文档

- [主 README](../README.md) - 自动化系统说明
- [脚本说明](../scripts/README.md) - 脚本使用说明
- [数据说明](../data/README.md) - 数据目录说明

---

## 💡 文档建议

如果你发现文档有遗漏或错误，请：
1. 记录问题
2. 提供改进建议
3. 参与文档更新

---

**创建时间**: 2026-03-28 22:46
**版本**: v1.0
**状态**: ✅ 完成
