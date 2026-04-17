# 产品代码

> 财富自由之路 - 个人财务管理软件源码

## 技术栈

- **框架**: Electron + Vue 3
- **UI**: Element Plus
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: Pinia
- **图表**: ECharts
- **构建工具**: pnpm + monorepo

## 项目结构

```
wealth-freedom/
├── apps/
│   └── desktop/              # Electron 桌面应用
│       ├── src/
│       │   ├── main/         # 主进程（数据库、IPC）
│       │   └── renderer/     # 渲染进程（Vue页面）
│       └── package.json
├── packages/
│   └── shared/               # 共享代码（类型、计算逻辑）
└── start.sh                  # 一键启动脚本
```

## 快速开始

```bash
cd wealth-freedom
./start.sh
```

首次启动会自动：
1. 安装依赖（pnpm install）
2. 构建共享包
3. 启动开发服务器

## 核心功能

| 功能 | 页面 | 状态 |
|------|------|------|
| 财务看板 | Dashboard.vue | ✅ |
| 三阶段目标 | Goals.vue | ✅ |
| 梦想图册 | Dreams.vue | ✅ |
| 账户管理 | Accounts.vue | ✅ |
| 负债管理 | Debts.vue | ✅ |
| 交易记录 | Transactions.vue | ✅ |
| 用户引导 | Welcome.vue | ✅ |

## 开发进度

- ✅ 项目初始化
- ✅ 类型定义
- ✅ 计算逻辑（净资产、现金流、目标进度）
- ✅ SQLite 数据库
- ✅ IPC 通信层
- ✅ 渲染进程页面
- ✅ 用户引导流程
- ⏳ 功能测试
- ⏳ 性能优化

## 下一步

1. 启动应用，测试各页面功能
2. 填写真实财务数据
3. 验证财务自由进度计算
4. 优化用户体验
5. 打包发布

---

**目标：让复杂的财务规划变成可追踪的进度条。**
