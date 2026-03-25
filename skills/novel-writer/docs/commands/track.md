# `/novel:track` — 综合追踪报告

**触发条件**：用户输入 `/novel:track`

**执行脚本**：`.specify/scripts/bash/track-progress.sh`

---

## 参数

```
/novel:track                # 完整报告
/novel:track --brief        # 简版（只看进度和预警）
/novel:track --plot         # 仅情节追踪
/novel:track --stats        # 仅统计数据
/novel:track --check        # 深度一致性检查
/novel:track --fix          # 自动修复简单问题
```

---

## 数据来源

| 文件 | 用途 |
|------|------|
| `spec/tracking/plot-tracker.json` | 情节追踪 |
| `spec/tracking/timeline.json` | 时间线 |
| `spec/tracking/relationships.json` | 关系网络 |
| `spec/tracking/character-state.json` | 角色状态 |
| `spec/tracking/validation-rules.json` | 验证规则 |
| `stories/*/tasks.md` | 进度统计 |

---

## 输出格式

```
📊 小说创作综合报告
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📖 《故事名》

✍️ 写作进度
  完成：X/XX章（XX%）
  字数：XX,XXX/XXX,XXX字

🗺️ 故事当前状态
  故事时间：[当前故事内时间]
  情节阶段：[方法中的当前位置]

👥 角色状态速览
  [角色名] | [当前地点] | [状态] | [待解决事项]

🌱 伏笔状态
  活跃：X个 | 已收：X个 | ⚠️ 超期：X个

⚡ 活跃冲突
  [冲突名] | 第X章起 | 烈度X/10

🔍 智能预警
  [检测到的潜在问题]

💡 建议下一步
  [具体操作建议]
```
