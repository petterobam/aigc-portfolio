# `/novel:relations` — 角色关系追踪

**触发条件**：用户输入 `/novel:relations`

**数据文件**：`spec/tracking/relationships.json`（⚠️ 注意：含 `ships`）

**执行脚本**：`.specify/scripts/bash/manage-relations.sh`

---

## 子命令

```
/novel:relations show             # 展示当前关系网络
/novel:relations show 角色名      # 以某角色为中心展示
/novel:relations check            # 检查关系逻辑矛盾
/novel:relations update <描述>    # 手动更新关系
/novel:relations history 角色名   # 查看关系演变史
```

---

## 关系类型标记

| 标记 | 类型 |
|------|------|
| ❤️ | 恋爱/婚姻 |
| 👥 | 友谊/盟友 |
| 👨‍👩‍👧 | 家庭 |
| 🤝 | 合作/雇佣 |
| ⚔️ | 仇敌/对立 |
| 🎭 | 伪装（表面与实际不符） |
| 😰 | 恐惧/压制 |
| ❓ | 关系不明 |