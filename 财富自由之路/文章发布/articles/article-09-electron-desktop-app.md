# 用 Electron + Vue 3 构建桌面财务应用：从零到发布的完整实战

> 全栈开发者做桌面应用，Electron 依然是最务实的选择。

## 为什么选择 Electron

2026 年了，每次提到 Electron，评论区总有人说"太臃肿了""吃内存"。但作为一个独立开发者，我的选择逻辑很简单：

**开发效率 > 运行时性能。**

原因有三：

1. **Web 技术栈复用**：Vue、React、CSS——你已经会的东西直接用，不需要学 Swift 或 Kotlin
2. **跨平台一套代码**：macOS、Windows、Linux 三端通吃，独立开发者没精力维护三套原生代码
3. **生态成熟**：npm 上有你能想到的一切库，遇到问题 StackOverflow 有答案

我的个人财务管理软件「财富自由之路」就是一个 Electron + Vue 3 项目。本文分享完整的开发实战经验。

## 技术架构选型

### 核心技术栈

```
框架：Electron 28 + electron-vite 2
前端：Vue 3.4 + TypeScript 5.3
UI库：Element Plus 2.5 + 自定义主题
图表：ECharts 5.5（vue-echarts 封装）
状态管理：Pinia 2.1
数据库：better-sqlite3（本地 SQLite）
构建：electron-builder 24
测试：Vitest 1.2 + @vue/test-utils
```

### 为什么是这个组合

**electron-vite 而非 electron-forge？**

electron-vite 基于 Vite，开发时热更新速度极快（<100ms），而 electron-forge 基于 Webpack，冷启动动辄 10 秒以上。对于日常开发体验，这是质的区别。

**better-sqlite3 而非 IndexedDB？**

财务数据需要复杂查询（"过去 6 个月餐饮类支出趋势"），SQL 是天然的选择。better-sqlite3 是同步 API，在主进程中使用性能极佳，不需要处理异步回调地狱。

**Element Plus 而非 Naive UI？**

Element Plus 的表单组件更成熟，日期选择器、数字输入框、表格等开箱即用。财务应用大量使用表单，这是决定性因素。

## 项目结构设计

```
wealth-freedom/
├── apps/
│   └── desktop/
│       ├── src/
│       │   ├── main/          # Electron 主进程
│       │   │   ├── index.ts   # 入口
│       │   │   ├── database/  # SQLite 封装
│       │   │   └── ipc/       # IPC 通信处理
│       │   ├── renderer/      # Vue 3 渲染进程
│       │   │   ├── views/     # 页面组件
│       │   │   ├── components/# 通用组件
│       │   │   ├── stores/    # Pinia stores
│       │   │   └── router/    # 路由配置
│       │   └── preload/       # 安全桥接层
│       └── electron.vite.config.ts
├── packages/
│   └── shared/                # 主进程/渲染进程共享类型
├── pnpm-workspace.yaml
└── package.json
```

### 关键设计决策

**1. 主进程管数据，渲染进程管 UI**

严格的职责分离。渲染进程通过 `contextBridge` 暴露的安全 API 与主进程通信，绝不直接访问 Node.js API。

```typescript
// preload/index.ts
const api = {
  // 财务记录 CRUD
  getTransactions: (filter: TransactionFilter) =>
    ipcRenderer.invoke('db:getTransactions', filter),
  addTransaction: (data: TransactionData) =>
    ipcRenderer.invoke('db:addTransaction', data),

  // 数据导出
  exportToExcel: (month: string) =>
    ipcRenderer.invoke('export:excel', month),
}

contextBridge.exposeInMainWorld('app', api)
```

**2. Monorepo 管理共享类型**

用 pnpm workspace 把共享的 TypeScript 类型放在 `packages/shared/`，主进程和渲染进程都引用它。避免了类型定义重复和不同步的问题。

## 数据库设计：财务领域的坑

### 表结构

```sql
-- 核心表：交易记录
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,           -- 'income' | 'expense' | 'transfer'
  amount REAL NOT NULL,
  category_id TEXT NOT NULL,
  account_id TEXT NOT NULL,
  date TEXT NOT NULL,
  note TEXT,
  tags TEXT,                    -- JSON 数组
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 分类表（支持嵌套）
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  parent_id TEXT,
  type TEXT NOT NULL,           -- 'income' | 'expense'
  sort_order INTEGER DEFAULT 0
);
```

### better-sqlite3 的正确用法

**错误做法**：在渲染进程中使用 better-sqlite3。

**正确做法**：在主进程中封装数据库操作，通过 IPC 暴露。

```typescript
// main/database/db.ts
import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'

const dbPath = path.join(app.getPath('userData'), 'finance.db')
const db = new Database(dbPath)

// 开启 WAL 模式，提升并发读性能
db.pragma('journal_mode = WAL')

// 预编译语句，提升批量操作性能
const insertStmt = db.prepare(`
  INSERT INTO transactions (id, type, amount, category_id, account_id, date, note)
  VALUES (@id, @type, @amount, @categoryId, @accountId, @date, @note)
`)

// 批量插入用事务
export function batchInsert(records: TransactionRecord[]) {
  const insertMany = db.transaction((records) => {
    for (const record of records) {
      insertStmt.run(record)
    }
  })
  insertMany(records)
}
```

### 性能实测数据

导入 10,000 条交易记录：
- 逐条插入：12.3 秒
- 事务批量插入：0.8 秒
- **提升 15 倍**

查询过去 12 个月分类汇总（含 JOIN）：
- 未索引：340ms
- 加索引后：8ms
- **提升 42 倍**

## UI/UX：财务应用的设计要点

### 1. 首页即看板

财务应用的首页必须一眼看到关键信息：

- **净资产趋势**（折线图，过去 12 个月）
- **本月收支**（收入/支出/结余，大数字展示）
- **支出分类占比**（饼图，Top 5 + 其他）
- **预算执行进度**（进度条，按分类）

不要让用户点三次才能看到自己的钱在哪。

### 2. 数据录入要快

记账是高频操作，录入体验决定用户留存：

- **金额输入**：数字键盘自动聚焦，支持计算器模式（输入 `50+30*2` 自动计算）
- **分类选择**：最近使用的分类排在前面，支持拼音首字母搜索
- **智能记忆**：同一描述自动匹配上次的分类和金额
- **快捷键**：`Cmd+N` 新建记录，`Cmd+E` 编辑，`Cmd+D` 复制

### 3. 图表交互要自然

用 ECharts 做图表，几个关键配置：

```typescript
// 折线图：平滑曲线 + 区域填充 + 鼠标悬浮显示详情
const chartOption = {
  xAxis: { type: 'category', data: months },
  yAxis: { type: 'value', axisLabel: { formatter: '¥{value}' } },
  series: [{
    type: 'line',
    smooth: true,
    areaStyle: { opacity: 0.15 },
    data: netWorthData,
  }],
  tooltip: {
    trigger: 'axis',
    formatter: (params) => `${params[0].name}<br/>净资产：¥${params[0].value.toLocaleString()}`
  }
}
```

## 打包发布：那些文档不会告诉你的事

### electron-builder 配置

```json
{
  "build": {
    "appId": "com.wealth-freedom.app",
    "productName": "财富自由之路",
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.finance",
      "hardenedRuntime": true,
      "entitlements": "build/entitlements.mac.plist"
    },
    "win": {
      "target": ["nsis"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    },
    "extraResources": [
      { "from": "assets/", "to": "assets/" }
    ]
  }
}
```

### 常见坑和解决方案

**坑1：better-sqlite3 原生模块编译失败**

```bash
# 用 electron-rebuild 重新编译原生模块
npx electron-rebuild
```

在 CI 中加入这个步骤，否则打包出来的应用会崩溃。

**坑2：macOS 上提示"已损坏无法打开"**

```bash
# 签名问题，开发阶段可以绕过
xattr -cr /Applications/财富自由之路.app
```

正式发布需要 Apple Developer 证书签名（$99/年）。

**坑3：DMG 体积过大（>200MB）**

Electron 自带 Chromium，基础包就 130MB+。优化手段：
- 关闭不需要的 Electron 功能（如 `webview`）
- 压缩 asar 包：`electron-builder --config.compression=maximum`
- 图表库按需引入，不要全量 import echarts

## 性能优化：让 Electron 应用不卡

### 1. 分离重量级计算

数据分析和报表生成放在主进程（或 Worker Thread），不要阻塞渲染进程：

```typescript
// main/workers/report-generator.ts
import { parentPort, workerData } from 'worker_threads'

// 在 Worker 中生成月度报告
const report = generateMonthlyReport(workerData.month, workerData.dbPath)
parentPort?.postMessage(report)
```

### 2. 虚拟滚动

交易列表可能有几千条记录，全部渲染会卡死。用虚拟滚动只渲染可见区域：

```vue
<!-- 用 Element Plus 的虚拟表格 -->
<el-table-v2
  :columns="columns"
  :data="transactions"
  :width="800"
  :height="600"
  :row-height="50"
  fixed
/>
```

### 3. 按需加载路由

```typescript
const routes = [
  {
    path: '/dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/analysis',
    component: () => import('../views/Analysis.vue')  // 重型图表页面按需加载
  }
]
```

## 测试策略

### 单元测试（Vitest）

重点测试数据处理逻辑，不测 UI 渲染：

```typescript
// 财务计算工具函数测试
describe('calculateNetWorth', () => {
  it('应正确计算净资产', () => {
    const assets = [{ amount: 100000 }, { amount: 50000 }]
    const liabilities = [{ amount: 30000 }]
    expect(calculateNetWorth(assets, liabilities)).toBe(120000)
  })

  it('应处理空数据', () => {
    expect(calculateNetWorth([], [])).toBe(0)
  })
})
```

### 集成测试

用 `@vue/test-utils` 测试组件与 Store 的交互：

```typescript
it('添加交易后应更新列表', async () => {
  const wrapper = mount(TransactionList, {
    global: { plugins: [createPinia()] }
  })
  await wrapper.find('.add-btn').trigger('click')
  // 填写表单...
  expect(wrapper.vm.transactions.length).toBeGreaterThan(0)
})
```

## 从开发到发布的 Checklist

- [ ] `electron-rebuild` 确保原生模块编译正确
- [ ] 数据库迁移脚本测试（升级不丢数据）
- [ ] macOS 签名 + 公证（否则 Gatekeeper 会拦截）
- [ ] Windows 代码签名（可选，但能避免 SmartScreen 警告）
- [ ] 自动更新配置（`electron-updater`）
- [ ] 错误上报集成（Sentry 或自建）
- [ ] 用户数据目录正确（`app.getPath('userData')`）
- [ ] 卸载时清理干净（Windows 的 NSIS 配置）

## 总结

Electron 的"缺点"——内存占用、包体积——对于一个财务工具来说完全可以接受。用户每天打开 5 分钟记个账、看看数据，128MB 内存不是问题。

**真正重要的是：你能多快把产品做出来，然后开始收集真实用户反馈。**

技术选型的最优解，永远是你最熟悉的那套。独立开发者的核心竞争力不是技术栈的先进性，而是产品洞察力和执行力。

---

*本文基于「财富自由之路」桌面端开发实践整理。项目使用 MIT 协议开源，欢迎交流：[GitHub](https://github.com/petterobam/wealth-freedom)*
