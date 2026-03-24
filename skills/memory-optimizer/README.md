# 记忆优化器

> **定位**：记忆系统的守护者与进化者，确保整个工作区的记忆库高效、清洁、有序，并持续自我迭代
> **驱动方式**：HEARTBEAT 心跳驱动，每次心跳推进一件真实的事

---

## 快速导航

| 目的 | 文件 |
|------|------|
| 了解心跳机制、找下一件要做的事 | `HEARTBEAT.md` |
| 查看系统当前状态与已知问题 | `state/current-state.md` |
| 查看任务列表、推进开发 | `tasks/task-list.md` |
| 查看最新执行日志 | `logs/latest.md` |
| 查看历史优化报告 | `reports/README.md` |
| 了解系统架构设计 | `docs/memory-system-design.md` |
| 了解优化规则与策略 | `docs/memory-optimization-strategy.md` |
| 查看操作手册 | `docs/memory-system-guide.md` |

---

## 目录结构

```
memory-optimizer/
├── HEARTBEAT.md                        心跳驱动系统（每次心跳从这里开始）
├── README.md                           本文件（系统总览与快速导航）
├── SKILL.md                            技术规范（供 OpenClaw 调用）
│
├── state/                              系统状态（每次心跳后更新）
│   └── current-state.md               记忆库快照、健康指标、已知问题
│
├── tasks/                              任务管理
│   ├── README.md                      任务管理规范与流转说明
│   └── task-list.md                   所有任务（P0~P3，唯一事实来源）
│
├── scripts/                            可执行脚本
│   └── optimize.js                    核心优化脚本
│
├── logs/                               执行日志
│   └── latest.md                      最新一次执行摘要（每次运行后更新）
│
├── reports/                            优化报告归档
│   └── README.md                      报告归档说明与历史索引
│
└── docs/                               设计文档与操作指南
    ├── memory-system-design.md        系统架构、数据模型、模块设计
    ├── memory-optimization-strategy.md 优化策略、评分体系、规则定义
    └── memory-system-guide.md         使用手册、操作命令、故障排查
```

---

## 核心功能

| 功能 | 说明 | 实现状态 |
|------|------|---------|
| 重要性评分 | 基于访问频率、时效性、内容质量、关联度的综合评分 | 已实现 |
| 精确去重 | 内容 MD5 哈希匹配，识别完全相同的重复记忆 | 已实现 |
| 智能归档 | 超过时效且评分偏低的记忆自动移入归档 | 已实现 |
| 低质量清理 | 内容极短且评分为零的记忆（需手动开启删除） | 已实现（默认关闭） |
| 优化报告 | 每次运行生成 JSON 结构化报告 | 已实现 |
| 语义去重 | 向量相似度识别语义重复 | 规划中 |
| 自动标签提取 | 从内容中自动生成标签 | 规划中 |

---

## 重要性评分公式

```
importance = (访问频率 × 0.4)
           + (时效性   × 0.3)
           + (内容质量 × 0.2)
           + (关联度   × 0.1)
```

| 分值 | 含义 | 处理建议 |
|------|------|---------|
| 0 ~ 1 | 低价值，可能是垃圾记忆 | 候选清理 |
| 1 ~ 2 | 价值偏低 | 候选归档 |
| 2 ~ 3 | 正常记忆 | 维持现状 |
| 3 ~ 4 | 高价值记忆 | 重点保留 |
| 4 ~ 5 | 核心记忆 | 建议加 `protected` 标签 |

---

## 优化规则概览

### 归档条件（同时满足）
- 超过 30 天未访问
- 重要性评分 < 2
- 标签中不包含 `protected`

### 受保护记忆
标签包含 `protected` 的记忆，免疫所有优化操作，永不归档、永不删除。

### 删除策略
默认关闭（`deleteArchived: false`）。开启前必须先备份数据库。

---

## 运行方式

```bash
# 手动运行一次优化
cd ~/.openclaw/workspace
node skills/memory-optimizer/scripts/optimize.js

# 查看优化报告
cat data/memory-optimization-report.json | jq

# 设置定时任务（每 30 分钟自动运行）
crontab -e
# 添加：*/30 * * * * cd /Users/oyjie/.openclaw/workspace && node skills/memory-optimizer/scripts/optimize.js >> skills/memory-optimizer/logs/cron.log 2>&1
```

---

## 执行后的流转步骤

```
运行 optimize.js
    ↓
查看控制台输出（有没有异常？）
    ↓
更新 logs/latest.md（记录本次执行摘要）
    ↓
更新 state/current-state.md（刷新记忆库数字）
    ↓
如有异常 → 记录到 state/current-state.md 的「已知问题」
如一切正常 → 查看 tasks/task-list.md，推进下一个开发任务
```

---

## 核心约束

- 不过度优化：误删一条有价值的记忆，比保留十条垃圾代价更高
- 数据驱动：每个优化决策都要有数据支撑，不凭感觉操作
- 有日志才算做了：执行脚本但不更新日志，等于没有执行
- 保护 protected 记忆：任何情况下都不处理带 `protected` 标签的记忆
- 先修复已知问题，再开发新功能

---

## 与其他 Skill 的关系

| Skill | 关系 |
|-------|------|
| sqlite-memory | 共享 memory.db 数据库，读写同一数据源 |
| heartbeat | heartbeat 心跳可触发本优化器，接收优化建议 |
| opencli-skill | 无直接依赖 |

---

**创建时间**：2026-03-20
**维护者**：心跳时刻 - 记忆优化器
**版本**：v2.0
**状态**：活跃迭代中