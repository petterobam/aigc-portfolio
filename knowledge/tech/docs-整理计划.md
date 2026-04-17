# docs 目录整理计划

**日期**：2026-03-31
**目的**：将 docs/ 目录下的文档整理到 knowledge/ 对应分类

---

## 📋 docs 目录内容分析

### 记忆优化相关（4个）
```
enhanced-memory-optimizer-guide.md          - 记忆优化器使用指南
enhanced-memory-optimizer-quickstart.md       - 记忆优化器快速开始
memory-optimization-strategy.md             - 记忆优化策略
memory-system-design.md                       - 记忆系统设计
```

### 番茄小说相关（3个）
```
番茄小说流量池机制分析.md                      - 流量池机制分析
番茄小说爆款内容结构公式库.md                 - 爆款内容结构公式
番茄小说爆款标题公式库.md                     - 爆款标题公式库
```

### 其他工具文档（3个）
```
memory-system-guide.md   - 记忆系统指南
toolbox-guide.md       - 工具箱指南
```

---

## 📁 整理方案

### 方案 A：按类型分类

```
knowledge/
├── tech/                   # 技术知识
│   ├── 记忆优化/
│   │   ├── enhanced-memory-optimizer-guide.md
│   │   ├── enhanced-memory-optimizer-quickstart.md
│   │   ├── memory-optimization-strategy.md
│   │   ├── memory-system-design.md
│   │   └── memory-system-guide.md
│   └── 工具箱/
│       └── toolbox-guide.md
└── work/                   # 工作流程
    ├── 番茄小说运营/
    │   ├── 流量池机制分析.md
    │   ├── 爆款内容结构公式库.md
    │   └── 爆款标题公式库.md
    └── ...
```

### 方案 B：创建 docs 子目录

```
knowledge/
├── docs/                   # 文档整理
│   ├── 记忆优化/
│   ├── 番茄小说运营/
│   └── 工具指南/
├── tech/                   # 技术知识
├── work/                   # 工作流程
└── ...
```

---

## 🎯 推荐方案：方案 A

**理由**：
1. **符合 knowledge 目录结构**：tech/ 和 work/ 已经存在
2. **分类清晰**：记忆优化是技术内容，番茄运营是工作内容
3. **易于查找**：按类型分类，便于快速定位

---

## 📝 执行步骤

1. ✅ 在 `knowledge/tech/` 下创建 `记忆优化/` 目录
2. ✅ 在 `knowledge/tech/` 下创建 `工具箱/` 目录
3. ✅ 在 `knowledge/work/` 下创建 `番茄小说运营/` 目录
4. ✅ 移动记忆优化相关文档
5. ✅ 移动工具指南文档
6. ✅ 移动番茄小说运营文档
7. ✅ 在 `knowledge/docs/` 下创建 README.md 说明整理情况
8. ✅ 更新 knowledge/README.md

---

## ⚠️ 注意事项

1. **检查重复**：移动前检查 knowledge/ 下是否有重复文档
2. **更新引用**：检查是否有其他文档引用了这些文件
3. **Git 提交**：整理完成后提交变更

---

**待用户确认后执行**
