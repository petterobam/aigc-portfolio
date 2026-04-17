# 知乎自动化定时任务配置

> **创建时间**: 2026-03-28 13:40
> **最后更新**: 2026-03-28 13:40
> **版本**: v1.0

---

## 📋 概述

本文档定义知乎自动化系统的定时任务配置，实现真正的全自动化运营。

**核心目标**:
1. 自动化 Cookie 维护和刷新
2. 自动化内容发布和数据采集
3. 自动化数据分析和复盘
4. 自动化互动运营和策略优化

---

## 🔧 Crontab 配置

### 完整 Crontab 配置

```bash
# ========================================
# 知乎自动化定时任务配置
# ========================================

# 每天早上 8:00 - 检查登录状态
0 8 * * * cd ~/.openclaw/workspace && node scripts/verify-zhihu-cookies.js >> 知乎自动运营/🛠️自动化系统/logs/login-check.log 2>&1

# 每天晚上 21:00 - 采集数据
0 21 * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/fetch-data.js >> logs/fetch-data.log 2>&1

# 每天晚上 21:30 - 更新数据看板
30 21 * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/update-dashboard.js >> logs/update-dashboard.log 2>&1

# 每周一早上 8:30 - 生成周复盘报告
30 8 * * 1 cd ~/.openclaw/workspace/知乎自动运营 && echo "触发知乎数据复盘" >> logs/weekly-review.log 2>&1

# 每周三、周五晚上 20:00 - 发布计划提醒
0 20 * * 3,5 cd ~/.openclaw/workspace/知乎自动运营 && echo "发布提醒:今天是发布日" >> logs/publish-reminder.log 2>&1
```

---

## 📅 定时任务清单

### 任务1: 登录状态检查

| 属性 | 值 |
|------|-----|
| 任务名称 | zhihu-login-checker |
| 执行时间 | 每天 8:00 |
| 执行命令 | `node scripts/verify-zhihu-cookies.js` |
| 输出日志 | logs/login-check.log |
| 功能 | 检查知乎登录状态，Cookie是否有效 |

**预期输出**:
- 如果 Cookies 过期: 发送登录提醒
- 如果 Cookies 即将过期(剩余 <24小时): 发送登录提醒
- 如果登录状态正常: 无操作

---

### 任务2: 数据采集

| 属性 | 值 |
|------|-----|
| 任务名称 | zhihu-data-fetcher |
| 执行时间 | 每天 21:00 |
| 执行命令 | `node scripts/fetch-data.js` |
| 输出日志 | logs/fetch-data.log |
| 功能 | 采集知乎已发布内容数据 |

**预期输出**:
- 采集最新数据到 `data/latest-data.json`
- 采集历史数据到 `data/history/`
- 生成数据统计报告

**依赖**:
- ✅ 登录状态正常(Cookies 有效)

---

### 任务3: 数据看板更新

| 属性 | 值 |
|------|-----|
| 任务名称 | zhihu-dashboard-updater |
| 执行时间 | 每天 21:30 |
| 执行命令 | `node scripts/update-dashboard.js` |
| 输出日志 | logs/update-dashboard.log |
| 功能 | 读取最新数据，自动更新数据追踪看板 |

**预期输出**:
- 更新数据概览
- 更新 Top 10 高赞回答
- 更新数据变化摘要

**依赖**:
- ✅ 数据采集已完成(任务2)

---

### 任务4: 周复盘报告

| 属性 | 值 |
|------|-----|
| 任务名称 | zhihu-weekly-review |
| 执行时间 | 每周一 8:30 |
| 执行命令 | 触发知乎数据复盘 |
| 输出日志 | logs/weekly-review.log |
| 功能 | 生成周复盘报告 |

**预期输出**:
- 分析本周数据表现
- 识别高表现内容和低表现内容
- 总结成功经验和失败教训
- 生成周复盘报告

**依赖**:
- ✅ 数据看板已更新(任务3)

---

### 任务5: 发布计划提醒

| 属性 | 值 |
|------|-----|
| 任务名称 | zhihu-publish-reminder |
| 执行时间 | 每周三、周五 20:00 |
| 执行命令 | 触发发布提醒 |
| 输出日志 | logs/publish-reminder.log |
| 功能 | 提醒今天是发布日，检查发布计划 |

**预期输出**:
- 提醒今天是发布日
- 检查发布计划，列出待发布内容
- 提醒发布前检查

---

## 🚀 快速开始

### 方法1: 使用 Crontab (推荐)

1. **编辑 Crontab**:
   ```bash
   crontab -e
   ```

2. **复制并粘贴完整 Crontab 配置**:
   ```bash
   # ========================================
   # 知乎自动化定时任务配置
   # ========================================

   # 每天早上 8:00 - 检查登录状态
   0 8 * * * cd ~/.openclaw/workspace && node scripts/verify-zhihu-cookies.js >> 知乎自动运营/🛠️自动化系统/logs/login-check.log 2>&1

   # 每天晚上 21:00 - 采集数据
   0 21 * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/fetch-data.js >> logs/fetch-data.log 2>&1

   # 每天晚上 21:30 - 更新数据看板
   30 21 * * * cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统 && node scripts/update-dashboard.js >> logs/update-dashboard.log 2>&1

   # 每周一早上 8:30 - 生成周复盘报告
   30 8 * * 1 cd ~/.openclaw/workspace/知乎自动运营 && echo "触发知乎数据复盘" >> logs/weekly-review.log 2>&1

   # 每周三、周五晚上 20:00 - 发布计划提醒
   0 20 * * 3,5 cd ~/.openclaw/workspace/知乎自动运营 && echo "发布提醒:今天是发布日" >> logs/publish-reminder.log 2>&1
   ```

3. **保存并退出**:
   - Vim: `:wq`
   - Nano: `Ctrl+X`, `Y`, `Enter`

4. **验证 Crontab 配置**:
   ```bash
   crontab -l
   ```

---

## 📊 日志管理

### 日志目录结构

```
知乎自动运营/🛠️自动化系统/
├── logs/
│   ├── login-check.log        # 登录状态检查日志
│   ├── fetch-data.log         # 数据采集日志
│   ├── update-dashboard.log   # 数据看板更新日志
│   ├── weekly-review.log      # 周复盘报告日志
│   └── publish-reminder.log   # 发布计划提醒日志
```

### 日志轮转 (Log Rotation)

为了避免日志文件过大,建议配置日志轮转:

**Crontab 配置**:
```bash
# 每周日晚上 23:00 - 压缩上周日志
0 23 * * 0 cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/logs && tar -czf "logs-$(date +\%Y\%m\%d).tar.gz" *.log && rm -f *.log
```

---

## 🔧 测试定时任务

### 手动测试

1. **测试登录状态检查**:
   ```bash
   cd ~/.openclaw/workspace
   node scripts/verify-zhihu-cookies.js
   ```

2. **测试数据采集**:
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/fetch-data.js
   ```

3. **测试数据看板更新**:
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/update-dashboard.js
   ```

---

## 🔧 Cookie 自动维护

### 使用浏览器守护进程

浏览器守护进程会自动维护番茄小说和知乎的Cookie：

**守护进程位置**: `skills/playwright-browser/HEARTBEAT.md`

**守护范围**:
- 🍅 番茄小说：数据抓取、发布监控、质量检测
- 📚 知乎：内容发布、数据采集、互动运营

**守护任务**:
- 每次心跳检查 Cookie 有效性
- Cookie 即将过期（剩余 <7天）时自动刷新
- Cookie 已过期时立即告警

---

## 📚 相关文档

- [知乎 Cookie 提取工具](../docs/extract-zhihu-cookies-guide.md)
- [知乎 Cookie 手动导出指南](../docs/manual-cookie-export-guide.md)
- [浏览器自动化守护者](../../skills/playwright-browser/HEARTBEAT.md)

---

## ✅ 总结

通过配置定时任务系统，知乎自动化系统可以实现真正的全自动化运营：

**核心价值**:
1. ✅ 自动化 Cookie 维护和刷新
2. ✅ 自动化数据采集和分析
3. ✅ 自动化数据看板更新
4. ✅ 自动化发布计划提醒
5. ✅ 自动化优化建议生成

---

**创建时间**: 2026-03-28 13:40
**版本**: v1.0
**维护者**: 无何有
