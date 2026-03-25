# `/novel:analyze` — 综合验证与质量评估

**触发条件**：用户输入 `/novel:analyze`

**执行脚本**：`.specify/scripts/bash/analyze-story.sh`

---

## 验证维度

| 维度 | 检查内容 | 数据来源 |
|------|---------|---------|
| 宪法合规性 | 是否违背创作原则 | `.specify/memory/constitution.md` |
| 规格满足度 | 核心需求完成情况 | `stories/*/specification.md` |
| 方法结构符合 | 情节节奏是否符合所选方法 | `spec/config.json` + `spec/presets/` |
| 内容一致性 | 情节/时间/角色前后一致 | `spec/tracking/*.json` |
| 字数合规 | 章节字数是否符合要求 | `spec/tracking/validation-rules.json` |
| 去 AI 腔程度 | 自然化表达自检 | 内置写作规范 |

---

## 参数

```
/novel:analyze              # 全面评估
/novel:analyze 第1-5章      # 指定章节范围
/novel:analyze 宪法          # 只检查宪法合规
/novel:analyze 节奏          # 只分析情节节奏
```
