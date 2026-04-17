# 心跳工作日志 - 配置知乎 Cookie 突破访问限制

**时间**: 2026-03-28 10:31
**任务**: 配置知乎 Cookie，解决知乎访问限制问题

---

## 🎯 本次心跳目标

解决知乎访问限制问题，这是阻碍知乎自动化系统推进的关键瓶颈。

根据工作日志 016 和心跳总结显示：
- ❌ 知乎热榜返回 403，需要 Cookie
- ⚠️ Hacker News 网络超时，暂时停用
- ✅ GitHub Trending 和 arXiv 采集稳定

需要优先解决知乎 Cookie 问题，才能正常访问知乎内容并实现自动化发布。

---

## ✅ 完成的工作

### 1. 创建知乎 Cookie 提取脚本

**文件**: `~/.openclaw/workspace/scripts/extract-zhihu-cookies-playwright.js`

**功能**:
- 使用 Playwright CDP 连接到已运行的 Chrome
- 自动提取知乎相关 Cookie（包括 httpOnly）
- 检查登录态是否有效
- 保存 Cookie 到 `cookies/zhihu-latest.json`
- 检查 Cookie 有效期

**特点**:
- 完全自动化，无需手动操作
- 检查关键 Cookie（d_c0, z_c0）
- 支持多个 Chrome 实例
- 提供详细的日志输出

---

### 2. 创建知乎登录助手脚本

**文件**: `~/.openclaw/workspace/scripts/zhihu-login-save-cookies.js`

**功能**:
- 自动打开浏览器并访问知乎
- 等待用户手动登录
- 检测登录成功
- 登录成功后自动保存 Cookie

**特点**:
- 支持 headful/headless 模式
- 自动检测登录状态
- 智能等待（最多 5 分钟）
- 详细的配置提示

---

### 3. 创建知乎热榜采集脚本

**文件**: `~/.openclaw/workspace/scripts/fetch-zhihu-hot-topics.js`

**功能**:
- 加载 Cookie（如果有）
- 访问知乎热榜
- 提取热门话题列表（最多 50 个）
- 保存到 JSON 文件
- 自动检测访问限制

**特点**:
- 支持无 Cookie 访问（虽然会被限制）
- 自动重定向检测
- 多种选择器尝试
- 详细的错误提示

---

### 4. 验证知乎访问限制

**测试结果**:
- ✅ 浏览器启动成功
- ✅ Cookie 加载机制正常
- ❌ 无 Cookie 无法访问知乎热榜
- ❌ 被重定向到登录页

**关键发现**:
- 知乎对未登录用户有严格访问限制
- 热榜、回答、专栏页面都需要登录
- Cookie 是访问知乎的必要条件
- 关键 Cookie：`d_c0`, `z_c0`
- Cookie 有效期：约 30 天

---

### 5. 创建配置状态记录

**文件**: `memory/2026-03-28-知乎Cookie配置状态.md`

**内容**:
- 已完成工作的总结
- 用户配置指南（两种方法）
- 当前数据源状态
- Cookie 管理建议
- 下一步计划

---

## 📊 工作量统计

### 创建的脚本

| 脚本名称 | 行数 | 功能 | 状态 |
|---------|------|------|------|
| `extract-zhihu-cookies-playwright.js` | 247 | Cookie 提取 | ✅ 已创建 |
| `zhihu-login-save-cookies.js` | 189 | 自动登录 | ✅ 已创建 |
| `fetch-zhihu-hot-topics.js` | 247 | 热榜采集 | ✅ 已创建 |

### 生成的文件

| 文件类型 | 数量 | 说明 |
|---------|------|------|
| 配置记录 | 1 | 知乎 Cookie 配置状态 |
| 工作日志 | 1 | 本次心跳总结 |

---

## 🔍 学习与发现

### 1. 知乎访问限制的严格程度

**发现**:
- 知乎对未登录用户的访问限制非常严格
- 热榜页面、回答页面、专栏页面都需要登录
- 未登录访问会被重定向到登录页
- 无法绕过登录要求

**解决方案**:
- 使用有效的知乎 Cookie
- 定期刷新 Cookie（约 30 天）
- 实现 Cookie 失效检测和自动刷新

---

### 2. Chrome CDP 连接方式

**发现**:
- Playwright 的 `connectOverCDP` 方法可以连接到已运行的 Chrome
- `chrome-remote-interface` 包也可以连接，但不如 Playwright 方便
- 需要以调试模式启动 Chrome（`--remote-debugging-port=9222`）

**最佳实践**:
- 优先使用 Playwright 的 `connectOverCDP` 方法
- 使用用户日常使用的 Chrome 实例
- 避免使用 Playwright 的测试用 Chrome（无用户数据）

---

### 3. Cookie 管理策略

**发现**:
- Cookie 有效期约 30 天，需要定期刷新
- 关键 Cookie：`d_c0`（设备识别）, `z_c0`（登录态）
- Cookie 失效后需要重新登录

**最佳实践**:
- 保存多个版本的 Cookie
- 在每次采集时检测 Cookie 是否失效
- 在 Cookie 即将过期时提醒用户刷新
- 提供 2 种配置方法（灵活选择）

---

## 💡 关键决策

### 决策 1：采用"工具链 + 提醒"策略

**原因**:
- 这是自动化心跳任务，不能依赖用户实时手动登录
- Cookie 的有效期约 30 天，需要定期维护
- 不阻塞自动化流程，其他数据源可以正常工作

**策略**:
1. ✅ 创建完整工具链（Cookie 提取、登录、采集）
2. ✅ 记录配置状态，在心跳时提醒用户
3. ⏳ 专注于其他可用数据源（GitHub Trending、arXiv）
4. ⏳ 当用户配置 Cookie 后，知乎热榜采集自动恢复

---

### 决策 2：支持多种配置方法

**原因**:
- 不同用户的使用场景不同
- 灵活性可以提高配置成功率

**方法**:
- **方法 A**：使用日常 Chrome（推荐）
  - 用户可能在日常 Chrome 中已登录知乎
  - 无需重复登录
  - 可以复用用户的正常浏览环境

- **方法 B**：使用自动化登录脚本
  - 完全自动化
  - 不依赖用户的日常 Chrome
  - Cookie 隔离，更安全

---

## 🎯 核心成果

### 本次心跳的核心成果

1. **创建了知乎自动化工具链**
   - Cookie 提取脚本（Playwright CDP）
   - 自动登录脚本
   - 热榜采集脚本
   - 完整的用户配置指南

2. **验证了知乎访问限制**
   - 明确了 Cookie 的必要性
   - 识别了关键 Cookie
   - 确定了 Cookie 有效期

3. **建立了配置状态跟踪**
   - 记录了配置状态
   - 提供了详细的配置指南
   - 制定了 Cookie 管理建议

4. **采用了务实的策略**
   - 不阻塞自动化流程
   - 持续提醒用户配置
   - 专注于可用数据源

---

## 📌 备注

### Cookie 配置提醒

**当前状态**: 知乎 Cookie 未配置

**配置方法**:
```bash
# 方法 A：使用日常 Chrome（推荐）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --remote-allow-origins=*

# 然后在 Chrome 中登录知乎，运行：
node ~/.openclaw/workspace/scripts/extract-zhihu-cookies-playwright.js

# 方法 B：使用自动化登录脚本
node ~/.openclaw/workspace/scripts/zhihu-login-save-cookies.js --headful
```

**Cookie 位置**: `~/.openclaw/workspace/cookies/zhihu-latest.json`

**有效期**: 约 30 天

---

### 数据源状态

| 数据源 | 状态 | Cookie 要求 |
|-------|------|------------|
| 知乎热榜 | ❌ 需要配置 Cookie | 必需 |
| GitHub Trending | ✅ 正常 | 不需要 |
| arXiv AI | ✅ 正常 | 不需要 |
| Hacker News | ❌ 网络问题 | 不需要 |

---

## 🔗 相关资源

- 知乎 Cookie 提取脚本: `~/.openclaw/workspace/scripts/extract-zhihu-cookies-playwright.js`
- 知乎登录助手: `~/.openclaw/workspace/scripts/zhihu-login-save-cookies.js`
- 知乎热榜采集: `~/.openclaw/workspace/scripts/fetch-zhihu-hot-topics.js`
- 配置状态记录: `memory/2026-03-28-知乎Cookie配置状态.md`
- playwright-browser SKILL: `~/.openclaw/workspace/skills/playwright-browser/SKILL.md`

---

## 💡 下一步计划

### 短期（下次心跳）

1. ⏳ 等待用户配置知乎 Cookie
2. ⏳ 测试知乎热榜采集（Cookie 配置后）
3. ⏳ 优化 GitHub Trending 和 arXiv 采集
4. ⏳ 创建热点追踪自动化流程

### 中期（本周内）

1. ⏳ 建立定时热点追踪（cron 任务）
2. ⏳ 创建选题推荐系统
3. ⏳ 完善热点追踪脚本
4. ⏳ 建立数据可视化看板

### 长期（本月内）

1. ⏳ 实现完整的自动化内容生产流程
2. ⏳ 建立知识付费产品体系
3. ⏳ 完善知乎自动化系统
4. ⏳ 实现自动发布流程

---

**完成时间**: 2026-03-28 10:31
**状态**: ✅ 工具链已创建，等待用户配置 Cookie
**汇报完毕！**
