# `/novel:expert` — 专家视角审稿

**触发条件**：用户输入 `/novel:expert`

**说明**：激活专家角色，AI 将以特定领域专家的视角提供建议。

---

## 可用专家

| 专家 | 知识文件 | 专长 |
|------|---------|------|
| 角色专家 | `.specify/experts/core/character.md` | 角色塑造深度、弧度设计、动机逻辑 |
| 情节专家 | `.specify/experts/core/plot.md` | 情节节奏、悬念设置、结构优化 |
| 风格专家 | `.specify/experts/core/style.md` | 语言风格、去 AI 腔、文字打磨 |
| 世界观专家 | `.specify/experts/core/world.md` | 世界观构建、设定自洽、细节真实性 |

---

## 使用方式

```
/novel:expert 角色    # 以角色专家视角审视当前故事
/novel:expert 情节    # 以情节专家视角分析节奏
/novel:expert 风格    # 以风格专家视角检查语言质量
/novel:expert 世界观  # 以世界观专家视角检查设定自洽
```

激活专家模式后，AI 会先读取对应的专家知识文件，再结合当前故事内容给出专业评估。