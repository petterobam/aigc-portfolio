# 大模型学习 Skill

## 📚 功能说明

这是一个自动化的大模型算法学习系统，帮助你由浅入深掌握 LLM/RL/VLM 核心技术。

## 🎯 核心特性

1. **自动学习推进** - 每天 10:30 自动推送学习内容
2. **进度追踪** - 自动记录学习进度和连续学习天数
3. **历史回顾** - 随时查询历史学习内容
4. **智能总结** - 自动生成每日学习摘要
5. **灵活节奏** - 支持"继续学习"手动推进

## 🚀 快速开始

### 基础指令

#### 继续学习
```
继续学习
```

#### 查看进度
```
学习进度
```

#### 查看历史
```
学习历史
或
学习历史 第5天
```

#### 跳转天数
```
跳转到第10天
```

#### 重置进度
```
重置学习进度
```

## 📂 文件结构

```
skills/llm-learning/
├── SKILL.md              # Skill 配置文件
├── README.md             # 本文件
├── progress.json         # 学习进度
├── learning-helper.py    # Python 辅助工具
├── run-learning-task.sh  # 定时任务脚本
└── daily-logs/           # 每日学习日志
    ├── 2026-03-05.md
    ├── 2026-03-06.md
    └── ...
```

## 📊 学习计划概览

| 阶段 | 天数 | 主题 |
|------|------|------|
| 1 | 第1-5天 | 大模型基础 |
| 2 | 第6-12天 | 微调与对齐 |
| 3 | 第13-16天 | 免训练优化 |
| 4 | 第17-23天 | 强化学习基础 |
| 5 | 第24-29天 | 高级主题 |
| 6 | 第30-35天 | 综合图谱 |

## ⏰ 定时任务

每天上午 10:30 自动执行学习推送。

配置位置：`/Users/oyjie/.openclaw/workspace/HEARTBEAT.md`

## 🔧 工具脚本

### learning-helper.py

Python 辅助工具，用于管理学习进度：

```bash
python3 learning-helper.py
```

功能：
- 加载/保存进度
- 计算完成度
- 获取当天主题
- 保存学习日志

### run-learning-task.sh

定时任务执行脚本：

```bash
./run-learning-task.sh
```

## 📝 数据源

- **主文档：** `/Users/oyjie/.openclaw/workspace/LLM-RL-Visualized/README.md`
- **模型索引：** `/Users/oyjie/.openclaw/workspace/LLM-RL-Visualized/LLM-VLM-index.md`
- **学习计划：** `/Users/oyjie/.openclaw/workspace/skills/llm-learning/plan/llm-learning-plan.md`

## 🎓 学习效果

- 总时长：35 天
- 每天耗时：15-30 分钟
- 涵盖：100+ 架构图、RL 算法、最新模型研究

## 💡 使用建议

1. **保持连续性** - 尽量每天学习，保持 streak
2. **记录疑问** - 随时提问，深入理解
3. **实践结合** - 结合代码示例加深理解
4. **回顾复习** - 定期回顾历史知识点

## 📞 支持

遇到问题随时提问，我会根据你的进度调整学习节奏。
