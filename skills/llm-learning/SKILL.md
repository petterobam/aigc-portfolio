# LLM Learning Skill

大模型算法渐进式学习系统，帮助用户由浅入深掌握 LLM/RL/VLM 核心技术（35天计划）。

## 文件结构

| 文件 | 职责 |
|------|------|
| `docs/curriculum.md` | 学习大纲：35天阶段划分、每天主题与文档映射 |
| `docs/commands.md` | 用户指令手册：所有支持的指令与使用示例 |
| `docs/push-rules.md` | 日志推送规则：强制推送流程、禁止操作、标准示例 |
| `docs/data-schema.md` | 数据结构定义：progress.json、日志文件格式 |
| `progress.json` | 当前学习进度（运行时数据） |
| `daily-logs/` | 每日学习日志归档目录 |

## 数据源路径

- 主文档：`/Users/oyjie/.openclaw/workspace/LLM-RL-Visualized/README.md`
- 模型索引：`/Users/oyjie/.openclaw/workspace/LLM-RL-Visualized/LLM-VLM-index.md`
- 学习计划：`/Users/oyjie/.openclaw/workspace/skills/llm-learning/plan/llm-learning-plan.md`
- 进度文件：`/Users/oyjie/.openclaw/workspace/skills/llm-learning/progress.json`
- 日志目录：`/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/`

## 核心行为

### 继续学习 时执行顺序

1. 读取 `progress.json` 获取当前天数
2. 按 `docs/curriculum.md` 中的映射加载当天文档
3. 总结 3-5 个核心知识点，附代码示例
4. 给出实践建议与明日预告
5. 更新 `progress.json`
6. 生成日志并保存到 `daily-logs/YYYY-MM-DD.md`
7. **执行推送**（严格遵守 `docs/push-rules.md`）

### 定时任务（每天 10:30）

与"继续学习"执行相同流程，自动触发，无需用户指令。

## 注意事项

- 图片引用只写本地路径，**不读取图片内容**（防止 session 溢出）
- 推送日志必须用 `file_path` 参数直接上传文件，详见 `docs/push-rules.md`
- 日志中 streak 须保持连续更新
