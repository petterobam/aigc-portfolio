# 自动化系统架构

知乎技术内容运营的自动化系统架构，从 Cookie 管理到数据采集的完整自动化流程。

---

## 系统概述

知乎自动化系统是一个完整的自动化运营平台，包括：
- **Cookie 管理**：自动登录、Cookie 提取、Cookie 验证
- **内容发布**：自动发布回答、自动发布专栏文章
- **数据采集**：自动采集内容数据、自动采集热榜话题
- **数据分析**：自动分析内容质量、自动分析内容表现

---

## 系统架构

```
知乎自动运营/
├── 🛠️自动化系统/
│   ├── auth/                           # Cookie 存储
│   │   ├── zhihu-cookies-latest.json   # 最新 Cookie
│   │   └── session.json                # Session 信息
│   ├── scripts/                        # 自动化脚本
│   │   ├── login-zhihu-save-cookies.js # 登录脚本
│   │   ├── publish/                    # 发布脚本
│   │   │   ├── publish-zhihu-answer.js # 发布回答
│   │   │   └── publish-zhihu-article.js # 发布专栏文章
│   │   ├── analysis/                   # 分析脚本
│   │   │   └── evaluate-article-quality.js # 内容质量评估
│   │   └── tracking/                   # 追踪脚本
│   │       ├── hot-topic-tracker.js    # 热榜话题追踪
│   │       ├── data-collector.js       # 数据采集
│   │       ├── data-analyzer.js        # 数据分析
│   │       └── data-reporter.js        # 数据报告
│   └── utils/                          # 工具函数
│       ├── cookie-manager.js           # Cookie 管理器
│       ├── session-manager.js          # Session 管理器
│       ├── logger.js                   # 日志工具
│       └── check-zhihu-login.js        # 登录检查
├── ✍️内容生产/                          # 内容生产
│   ├── 选题池/
│   ├── 文章草稿/
│   └── 发布包/
├── 📤待发布/                            # 待发布内容
├── 📤已发布/                            # 已发布内容
├── 📊数据分析/                          # 数据分析
└── 📊数据看板/                          # 数据看板
```

---

## 核心模块

### 1. Cookie 管理模块

#### 1.1 Cookie 管理器（cookie-manager.js）

**功能**：
- 读取 Cookie 文件
- 验证 Cookie 有效性
- 检查 Cookie 过期时间
- 自动刷新过期 Cookie

**使用方法**：
```javascript
const CookieManager = require('./utils/cookie-manager');

// 读取 Cookie
const cookies = CookieManager.readCookies('zhihu-cookies-latest.json');

// 验证 Cookie
const isValid = CookieManager.validateCookies(cookies);

// 检查过期时间
const expiry = CookieManager.checkExpiry(cookies);
console.log(`Cookie 有效期: ${expiry.daysLeft} 天`);
```

#### 1.2 登录脚本（login-zhihu-save-cookies.js）

**功能**：
- 自动打开浏览器
- 导航到知乎登录页面
- 等待用户手动登录
- 自动提取并保存 Cookie

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/login-zhihu-save-cookies.js
```

#### 1.3 登录检查（check-zhihu-login.js）

**功能**：
- 检查 Cookie 是否存在
- 验证 Cookie 有效性
- 检查 Cookie 过期时间

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营
node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
```

---

### 2. 内容发布模块

#### 2.1 发布回答（publish-zhihu-answer.js）

**功能**：
- 读取回答 JSON 文件
- 自动登录知乎
- 自动发布回答
- 验证发布结果

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/publish/publish-zhihu-answer.js path/to/answer.json
```

**JSON 格式**：
```json
{
  "questionId": "question_id",
  "content": "回答内容（Markdown 格式）",
  "publish": true
}
```

#### 2.2 发布专栏文章（publish-zhihu-article.js）

**功能**：
- 读取文章 JSON 文件
- 自动登录知乎
- 自动发布专栏文章
- 验证发布结果

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/publish/publish-zhihu-article.js path/to/article.json
```

**JSON 格式**：
```json
{
  "title": "文章标题",
  "content": "文章内容（Markdown 格式）",
  "columnId": "column_id",
  "publish": true
}
```

---

### 3. 数据分析模块

#### 3.1 内容质量评估（evaluate-article-quality.js）

**功能**：
- 读取文章 Markdown 文件
- 评估文章质量（5 个维度）
- 生成分数和优化建议

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/analysis/evaluate-article-quality.js path/to/article.md
```

**评估维度**：
- 标题质量（20分）
- 内容结构（30分）
- 技术深度（25分）
- 实用性（15分）
- 互动性（10分）

---

### 4. 数据追踪模块

#### 4.1 热榜话题追踪（hot-topic-tracker.js）

**功能**：
- 追踪知乎热榜
- 追踪 Hacker News
- 追踪 GitHub Trending
- 追踪 arXiv 最新论文

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/tracking/hot-topic-tracker.js
```

#### 4.2 数据采集（data-collector.js）

**功能**：
- 自动采集已发布内容的数据
- 采集赞同、收藏、关注、评论等数据
- 保存到数据库或文件

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/tracking/data-collector.js
```

#### 4.3 数据分析（data-analyzer.js）

**功能**：
- 分析已发布内容的数据表现
- 识别爆款内容的共同特征
- 生成分析报告

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/tracking/data-analyzer.js
```

#### 4.4 数据报告（data-reporter.js）

**功能**：
- 生成数据报告
- 可视化数据表现
- 导出报告（PDF、Excel）

**使用方法**：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/tracking/data-reporter.js
```

---

## 工作流程

### 1. Cookie 配置流程

```
1. 运行登录脚本
   ↓
2. 浏览器自动打开
   ↓
3. 用户手动登录
   ↓
4. 脚本自动提取 Cookie
   ↓
5. 保存 Cookie 到 auth/ 目录
   ↓
6. 验证 Cookie 有效性
```

### 2. 内容发布流程

```
1. 准备内容（Markdown + JSON）
   ↓
2. 运行发布脚本
   ↓
3. 脚本读取 Cookie
   ↓
4. 自动登录知乎
   ↓
5. 自动发布内容
   ↓
6. 验证发布结果
   ↓
7. 记录发布信息
```

### 3. 数据采集流程

```
1. 运行数据采集脚本
   ↓
2. 脚本读取已发布内容列表
   ↓
3. 自动采集内容数据
   ↓
4. 保存到数据库或文件
   ↓
5. 生成数据报告
```

### 4. 数据分析流程

```
1. 运行数据分析脚本
   ↓
2. 脚本读取采集的数据
   ↓
3. 分析数据表现
   ↓
4. 识别爆款特征
   ↓
5. 生成分析报告
   ↓
6. 优化内容策略
```

---

## 技术栈

### 核心技术

- **Node.js**: 运行环境
- **Playwright**: 浏览器自动化
- **Axios**: HTTP 请求
- **Cheerio**: HTML 解析
- **Markdown-it**: Markdown 解析
- **Joi**: 数据验证

### 工具库

- **Winston**: 日志工具
- **Moment**: 时间处理
- **Lodash**: 工具函数
- **Chalk**: 终端颜色
- **Table**: 终端表格

---

## 部署方式

### 本地部署

**环境要求**：
- Node.js v18+
- npm v9+

**部署步骤**：
```bash
# 1. 克隆项目
git clone https://github.com/your-repo/zhihu-auto-operations.git

# 2. 安装依赖
cd zhihu-auto-operations
npm install

# 3. 配置 Cookie
node scripts/login-zhihu-save-cookies.js

# 4. 运行脚本
node scripts/publish/publish-zhihu-article.js path/to/article.json
```

### 定时任务

使用 cron 定时运行脚本：

```bash
# 每天凌晨 2 点采集数据
0 2 * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/tracking/data-collector.js

# 每周一早上 9 点生成数据报告
0 9 * * 1 cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/tracking/data-reporter.js
```

---

## 监控与日志

### 日志系统

**日志级别**：
- **ERROR**: 错误日志
- **WARN**: 警告日志
- **INFO**: 信息日志
- **DEBUG**: 调试日志

**日志位置**：
- `logs/error.log`: 错误日志
- `logs/warn.log`: 警告日志
- `logs/info.log`: 信息日志
- `logs/debug.log`: 调试日志

### 监控指标

**关键指标**：
- Cookie 有效期
- 发布成功率
- 数据采集成功率
- 脚本执行时间
- 错误率

**监控工具**：
- Winston 日志
- PM2 进程管理
- Sentry 错误监控

---

## 最佳实践

### 1. Cookie 管理

- **定期检查**：每月检查一次 Cookie 有效期
- **自动刷新**：Cookie 即将过期时自动刷新
- **安全存储**：不要提交 Cookie 到 git

### 2. 内容发布

- **测试发布**：先用测试文章测试发布流程
- **验证结果**：发布后验证发布结果
- **记录信息**：记录发布信息，便于追踪

### 3. 数据采集

- **定时采集**：定时采集数据，保持数据新鲜
- **数据验证**：采集后验证数据准确性
- **数据备份**：定期备份数据

### 4. 数据分析

- **定期分析**：每周分析一次数据
- **策略优化**：基于数据分析结果优化策略
- **报告归档**：定期归档数据报告

---

## 常见问题

### 1. Cookie 相关问题

**Q: Cookie 已过期怎么办？**
A: 重新运行登录脚本：
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/login-zhihu-save-cookies.js
```

**Q: 如何验证 Cookie 是否有效？**
A: 运行登录检查脚本：
```bash
cd ~/.openclaw/workspace/知乎自动运营
node 🛠️自动化系统/scripts/utils/check-zhihu-login.js
```

### 2. 发布相关问题

**Q: 发布脚本无法登录？**
A: 检查 Cookie 是否正确，重新提取 Cookie。

**Q: 发布内容失败？**
A: 检查内容格式是否符合知乎要求，查看错误日志。

### 3. 数据采集相关问题

**Q: 数据采集失败？**
A: 检查网络连接，查看错误日志。

**Q: 数据不准确？**
A: 检查采集脚本是否有 bug，查看日志。

---

**版本**: v1.0
**最后更新**: 2026-03-29
**状态**: 🚀 运行中
