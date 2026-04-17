# 🛠️ 知乎自动化系统

> **目标**: 实现知乎平台的完全自动化运营，包括内容发布、数据采集、互动运营等全流程
> **技术栈**: Playwright (MCP 浏览器工具)
> **最后更新**: 2026-03-28

---

## 🎯 系统目标

### 核心功能

1. **自动发布系统**
   - 回答发布（标题、内容、标签）
   - 专栏文章发布
   - 定时发布
   - 发布后验证

2. **数据采集系统**
   - 回答数据采集（赞同、收藏、评论、浏览量）
   - 专栏数据采集
   - 粉丝数追踪
   - 完读率分析

3. **互动运营系统**
   - 自动回复评论
   - 点赞优质评论
   - 关注活跃用户
   - 私信回复

4. **内容分析系统**
   - 热门话题识别
   - 竞品内容分析
   - 标题效果分析
   - 最佳发布时间分析

---

## 📁 目录结构

```
🛠️自动化系统/
├── README.md                    本文件（系统说明）
├── docs/                        文档
│   ├── 系统架构.md              系统架构设计
│   ├── API文档.md               API 接口文档
│   ├── 部署指南.md              部署和使用指南
│   ├── 知乎页面结构分析.md      知乎页面 DOM 结构分析
│   └── 开发日志.md              开发进度和问题记录
│
├── scripts/                     自动化脚本
│   ├── publish/                 发布脚本
│   │   ├── publish-answer.js       发布回答
│   │   ├── publish-article.js      发布专栏文章
│   │   └── scheduled-publish.js     定时发布
│   ├── collect/                 数据采集脚本
│   │   ├── collect-answer-data.js  采集回答数据
│   │   ├── collect-article-data.js 采集专栏数据
│   │   ├── collect-follower-data.js 采集粉丝数据
│   │   └── daily-data-monitor.js    每日数据监控
│   ├── interact/                互动运营脚本
│   │   ├── auto-reply.js           自动回复评论
│   │   ├── like-comments.js        点赞评论
│   │   └── follow-users.js         关注用户
│   ├── analyze/                 分析脚本
│   │   ├── hot-topics.js           热门话题分析
│   │   ├── competitor-analysis.js  竞品分析
│   │   └── title-optimization.js   标题优化分析
│   └── utils/                   工具脚本
│       ├── cookie-manager.js       Cookie 管理
│       ├── session-manager.js      Session 管理
│       ├── logger.js               日志工具
│       └── extract-zhihu-cookies.js 从 Chrome 提取知乎 Cookie
│
├── auth/                        认证信息
│   ├── cookies.json              知乎 Cookie（不要提交到 git）
│   ├── localStorage.json          知乎 localStorage（不要提交到 git）
│   └── session.json               会话信息（不要提交到 git）
│
├── skills/                      Skills (OpenClaw)
│   ├── zhihu-publisher/          发布 Skill
│   ├── zhihu-collector/          数据采集 Skill
│   └── zhihu-analyzer/           分析 Skill
│
├── data/                        数据文件
│   ├── answer-data/              回答数据
│   ├── article-data/             专栏数据
│   ├── follower-data/            粉丝数据
│   └── hot-topics/               热门话题数据
│
├── logs/                        日志文件
│   ├── publish.log               发布日志
│   ├── collect.log               采集日志
│   └── error.log                 错误日志
│
└── templates/                   模板文件
    ├── answer-template.json      回答模板
    ├── article-template.json     专栏文章模板
    └── data-export-template.csv  数据导出模板
```

---

## 🏗️ 系统架构

### 技术选型

**浏览器自动化**: Playwright (通过 MCP 浏览器工具)
- ✅ 支持 Chrome、Firefox、Safari
- ✅ 稳定的会话管理
- ✅ 强大的选择器和 API
- ✅ 优秀的调试工具

**会话管理**: 复用用户浏览器 Cookie
- ✅ 从已登录的浏览器提取 Cookie
- ✅ Cookie 有效期管理
- ✅ 失效自动重新登录

**数据存储**: JSON + CSV
- ✅ 轻量级，易于处理
- ✅ 便于分析和可视化
- ✅ 可导出到 Excel/Google Sheets

---

### 架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                     用户浏览器（已登录知乎）                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ 提取 Cookie
                        ▼
              ┌─────────────────┐
              │  Cookie 管理器  │
              └────────┬────────┘
                       │
                       │ 加载 Cookie
                       ▼
              ┌─────────────────┐
              │ Playwright 客户端│
              └────────┬────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │ 发布系统 │   │ 采集系统 │   │ 分析系统 │
  └────┬─────┘   └────┬─────┘   └────┬─────┘
       │              │              │
       ▼              ▼              ▼
  ┌──────────┐   ┌──────────┐   ┌──────────┐
  │  知乎API  │   │  知乎API  │   │  知乎API  │
  └──────────┘   └──────────┘   └──────────┘
```

---

## 📋 开发计划

### 阶段1: 基础设施（1-2天）

**目标**: 搭建自动化系统的基础设施

**任务**:
- [x] 创建目录结构
- [x] 创建 Cookie 管理脚本
- [x] 创建 Session 管理脚本
- [x] 创建日志工具
- [x] 创建知乎 Cookie 提取脚本
- [ ] 测试基本浏览器操作（导航、点击、输入）

**输出**:
- [x] Cookie 管理器（cookie-manager.js）
- [x] Session 管理器（session-manager.js）
- [x] 日志工具（logger.js）
- [x] 知乎 Cookie 提取器（extract-zhihu-cookies.js）
- [ ] 基础功能测试报告

---

### 阶段2: 数据采集系统（2-3天）

**目标**: 实现数据采集功能

**任务**:
- [ ] 分析知乎页面结构
- [x] 实现热点追踪脚本
- [ ] 实现回答数据采集脚本
- [ ] 实现专栏数据采集脚本
- [ ] 实现粉丝数据采集脚本
- [ ] 实现每日数据监控脚本

**输出**:
- [x] 热点追踪脚本（hot-topic-tracker.js）- 支持知乎、Hacker News、GitHub Trending、arXiv
- [ ] 回答数据采集脚本（collect-answer-data.js）
- [ ] 专栏数据采集脚本（collect-article-data.js）
- [ ] 粉丝数据采集脚本（collect-follower-data.js）
- [ ] 每日数据监控脚本（daily-data-monitor.js）
- [ ] 数据采集测试报告

---

### 阶段3: 发布系统（2-3天）

**目标**: 实现自动发布功能

**任务**:
- [ ] 分析知乎发布页面结构
- [x] 实现回答发布脚本
- [x] 实现专栏文章发布脚本
- [ ] 实现定时发布脚本
- [x] 实现发布后验证

**输出**:
- [x] 回答发布脚本（publish-zhihu-answer.js）- ✅ 已创建，支持自动登录、导航问题页面、填充内容、发布、验证
- [x] 专栏文章发布脚本（publish-zhihu-article.js）- ✅ 已创建，支持自动登录、创建文章、填充内容、发布
- [ ] 定时发布脚本（scheduled-publish.js）
- [ ] 发布测试报告

---

### 阶段4: 互动运营系统（2-3天）

**目标**: 实现互动运营功能

**任务**:
- [ ] 实现自动回复评论脚本
- [ ] 实现点赞评论脚本
- [ ] 实现关注用户脚本
- [ ] 实现私信回复脚本

**输出**:
- [ ] 自动回复评论脚本（auto-reply.js）
- [ ] 点赞评论脚本（like-comments.js）
- [ ] 关注用户脚本（follow-users.js）
- [ ] 互动运营测试报告

---

### 阶段5: 分析系统（2-3天）

**目标**: 实现内容分析功能

**任务**:
- [ ] 实现热门话题分析脚本
- [ ] 实现竞品分析脚本
- [ ] 实现标题优化分析脚本
- [ ] 实现最佳发布时间分析脚本

**输出**:
- [ ] 热门话题分析脚本（hot-topics.js）
- [ ] 竞品分析脚本（competitor-analysis.js）
- [ ] 标题优化分析脚本（title-optimization.js）
- [ ] 分析系统测试报告

---

### 阶段6: 整合和优化（2-3天）

**目标**: 整合所有功能，优化性能

**任务**:
- [ ] 整合所有功能模块
- [ ] 优化代码结构和错误处理
- [ ] 添加命令行接口
- [ ] 编写使用文档
- [ ] 性能测试和优化

**输出**:
- [ ] 完整的知乎自动化系统
- [ ] 使用文档
- [ ] 性能测试报告

---

## 🔑 关键技术点

### 1. Cookie 管理

**挑战**: 如何保存和复用知乎登录状态

**解决方案**:
- 使用 Playwright 的 `context.addCookies()` 方法
- 从已登录的浏览器提取 Cookie
- 保存到 JSON 文件
- 下次使用时加载 Cookie

**实现思路**:
```javascript
// 保存 Cookie
const cookies = await context.cookies();
await fs.writeFileSync('auth/cookies.json', JSON.stringify(cookies, null, 2));

// 加载 Cookie
const cookies = JSON.parse(await fs.readFileSync('auth/cookies.json', 'utf8'));
await context.addCookies(cookies);
```

---

### 2. 会话管理

**挑战**: 如何管理浏览器会话

**解决方案**:
- 使用 Playwright 的持久化上下文
- 保存上下文路径
- 失效时重新创建

**实现思路**:
```javascript
// 创建持久化上下文
const context = await browser.newContext({
  storageState: 'auth/session.json'
});

// 保存上下文
await context.storageState({ path: 'auth/session.json' });
```

---

### 3. 数据采集

**挑战**: 如何高效采集知乎数据

**解决方案**:
- 使用 Playwright 的 `page.evaluate()` 提取数据
- 使用 CSS 选择器定位元素
- 处理分页和懒加载
- 保存为 JSON 或 CSV

**实现思路**:
```javascript
// 提取回答数据
const data = await page.evaluate(() => {
  const items = document.querySelectorAll('.List-item');
  return Array.from(items).map(item => ({
    title: item.querySelector('.ContentItem-title').textContent.trim(),
    voteupCount: parseInt(item.querySelector('.VoteButton--up').textContent),
    commentCount: parseInt(item.querySelector('.ContentItem-action').textContent)
  }));
});

// 保存数据
await fs.writeFileSync(`data/answer-data/${timestamp}.json`, JSON.stringify(data, null, 2));
```

---

### 4. 自动发布

**挑战**: 如何自动发布回答和专栏

**解决方案**:
- 导航到发布页面
- 使用选择器定位表单元素
- 填充内容
- 提交表单
- 验证发布成功

**实现思路**:
```javascript
// 发布回答
await page.goto('https://www.zhihu.com/question/123456/answer');
await page.fill('[placeholder="写下你的回答"]', content);
await page.click('.Button--primary');
await page.waitForURL(/\/answer\/\d+/);
```

---

## 📊 风险评估

### 高风险

1. **知乎反爬机制** ⚠️⚠️⚠️⚠️⚠️
   - **风险**: 知乎可能有反爬机制
   - **影响**: 账号被封或限制
   - **缓解措施**:
     - 模拟真实用户行为（随机延迟、鼠标移动）
     - 使用真实的浏览器 User-Agent
     - 避免高频操作
     - 监控账号状态

2. **Cookie 过期** ⚠️⚠️⚠️⚠️
   - **风险**: Cookie 可能会过期
   - **影响**: 无法登录，功能失效
   - **缓解措施**:
     - 检测 Cookie 是否有效
     - 失效时自动重新登录
     - 定期刷新 Cookie

---

### 中风险

1. **页面结构变化** ⚠️⚠️⚠️
   - **风险**: 知乎页面结构可能变化
   - **影响**: 选择器失效，脚本无法正常工作
   - **缓解措施**:
     - 使用稳定的 CSS 选择器
     - 添加错误处理和日志
     - 定期检查和维护

2. **开发时间** ⚠️⚠️⚠️
   - **风险**: 开发时间可能较长
   - **影响**: 短期无法使用自动化
   - **缓解措施**:
     - 分阶段实施
     - 优先实现核心功能

---

### 低风险

1. **性能问题** ⚠️⚠️
   - **风险**: 自动化速度可能较慢
   - **影响**: 用户体验下降
   - **缓解措施**:
     - 优化代码逻辑
     - 使用并发操作（合理范围内）
     - 监控性能指标

---

## 🎯 成功标准

### 阶段性成功标准

**阶段1**:
- ✅ Cookie 管理器实现
- ✅ Session 管理器实现
- ✅ 日志工具实现
- ✅ 基础功能测试通过

**阶段2**:
- ✅ 数据采集功能实现
- ✅ 数据采集测试通过
- ✅ 数据保存格式规范

**阶段3**:
- ✅ 发布功能实现
- ✅ 发布测试通过
- ✅ 发布记录保存

**阶段4**:
- ✅ 互动运营功能实现
- ✅ 互动运营测试通过
- ✅ 互动记录保存

**阶段5**:
- ✅ 分析功能实现
- ✅ 分析测试通过
- ✅ 分析报告生成

**阶段6**:
- ✅ 所有功能整合完成
- ✅ 使用文档完成
- ✅ 性能测试通过

---

### 最终成功标准

1. ✅ 成功发布回答和专栏
2. ✅ 成功采集数据
3. ✅ 成功进行互动运营
4. ✅ 成功进行分析
5. ✅ 性能稳定，无重大 Bug
6. ✅ 文档完整，易于使用

---

## 📝 使用规范

### 文件命名规范

1. **脚本命名**: 使用 kebab-case（如 `publish-answer.js`）
2. **数据文件**: 使用时间戳 + 描述（如 `answer-data-20260327.json`）
3. **日志文件**: 使用描述 + 时间戳（如 `publish-20260327.log`）

### 提交规范

1. **提交消息格式**: `<type>: <subject>`
   - `feat`: 新功能
   - `fix`: 修复
   - `docs`: 文档
   - `style`: 格式
   - `refactor`: 重构
   - `test`: 测试
   - `chore`: 构建/工具

2. **提交示例**:
   - `feat: 实现回答发布脚本`
   - `fix: 修复 Cookie 加载错误`
   - `docs: 更新 README.md`

---

## 📌 备注

1. **优先级**: 数据采集 > 发布系统 > 分析系统 > 互动运营
2. **分阶段实施**: 先实现核心功能，再实现辅助功能
3. **持续优化**: 根据实际使用情况，持续优化性能和功能
4. **安全性**: Cookie 和会话信息不要提交到 git

---

**创建时间**: 2026-03-27 12:22
**创建者**: 心跳时刻 - 知乎技术分享与知识付费运营
**版本**: v1.2
**状态**: 🚀 Cookie 提取器已就绪
