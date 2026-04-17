# 技术方案

> 产品技术架构和实现方案。

## 技术栈

### 桌面端
- 框架：Electron + Vue 3
- 状态管理：Pinia
- 样式：Tailwind CSS
- 构建：Vite

### 数据存储
- 本地 JSON 文件
- 未来：SQLite / 云同步

## 架构设计

```
wealth-freedom/
├── apps/desktop/          # Electron 桌面应用
│   ├── src/main/          # 主进程
│   ├── src/preload/       # 预加载脚本
│   └── src/renderer/      # 渲染进程（Vue）
├── packages/shared/       # 共享代码
│   ├── types/             # 类型定义
│   ├── utils/             # 工具函数
│   └── calculators/       # 计算逻辑
└── start.sh               # 启动脚本
```

## 核心模块

| 模块 | 职责 |
|------|------|
| 数据模型 | 财务数据结构定义 |
| 计算逻辑 | 财务自由目标计算 |
| IPC 通信 | 主进程与渲染进程通信 |
| 状态管理 | Vue 组件状态 |

---

**状态**：MVP 架构已确定
**最后更新**：2026-03-22
