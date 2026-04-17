# 真实访问追踪设计方案

> 设计时间: 2026-03-26 01:47
> 状态: 设计草案,待评估实施价值

---

## 问题背景

### 当前状态

**启发式访问追踪**(access-tracker.js v1.0.0):

```javascript
// 计算启发式访问次数
const accessCount = Math.floor(
  baseAccess * timeDecay * qualityMultiplier * protectedMultiplier
  * (1 + randomNoise)
);
```

**启发式算法组成**:
- 基础访问次数:基于类别权重(breakthrough=1.5, creation=1.3, task=1.0, general=0.8, operation=0.6)
- 时间衰减:越新的记忆访问频率越高(1.0 → 0.3)
- 内容质量:内容越长的记忆可能被更频繁访问(1.0-1.5)
- 标签保护:protected标签的记忆是高访问频率的记忆(1.5倍)
- 随机扰动:±10%,模拟真实访问波动

**已知问题**(#008):
- 访问追踪是启发式的,不是真实访问统计
- 无法准确反映真实使用情况
- 可能产生偏差(某些记忆被高估,某些被低估)

### 为什么用启发式

**历史原因**:
- 记忆系统独立运行,无法直接捕获访问事件
- 集成到主系统需要改动记忆读取工具,成本高
- 启发式算法能产生合理的访问分布(breakthrough类别平均50.5次,creation类别平均9.29次)
- 评分系统的访问频率权重(30%)已生效,评分分布合理

**实际效果**:
- ✅ 访问频率与类别权重高度相关(breakthrough最高,creation最低)
- ✅ 访问频率与内容质量正相关(内容越长,访问越多)
- ✅ 评分系统能产生差异化评分(1.54-5.0)
- ✅ 评分系统长期稳定(连续7次优化无变化)

---

## 真实访问追踪方案

### 方案A: 内存集成(集成到记忆读取工具)

**原理**:
- 在记忆读取工具中集成访问追踪逻辑
- 每次读取记忆时,自动增加 access_count
- 自动更新 last_accessed 时间戳

**集成点**:
1. `memory_search` 工具 - 语义搜索记忆时记录访问
2. `memory_get` 工具 - 读取记忆内容时记录访问
3. 直接读取 MEMORY.md 文件 - 记录文件读取访问

**实施步骤**:

1. **修改 memory_search 工具集成点**:
   ```javascript
   // 在 memory_search 返回结果后,记录访问
   async function memory_search(query) {
     const results = await semanticSearch(query);
     for (const result of results) {
       await recordAccess(result.path);  // 新增访问记录
     }
     return results;
   }

   // 记录访问到数据库
   async function recordAccess(memoryPath) {
     const db = getMemoryDB();
     const memory = await getMemoryByPath(db, memoryPath);
     if (memory) {
       // 更新访问次数
       await updateAccessCount(db, memory.id);
       // 更新最后访问时间
       await updateLastAccessed(db, memory.id);
       // 插入访问日志
       await insertAccessLog(db, memory.id, 'read');
     }
   }
   ```

2. **修改 memory_get 工具集成点**:
   ```javascript
   // 在 memory_get 读取内容后,记录访问
   async function memory_get(path) {
     const content = await readFile(path);
     await recordAccess(path);  // 新增访问记录
     return content;
   }
   ```

3. **文件监控(MacOS fswatch)**:
   ```javascript
   // 监控 MEMORY.md 文件读取
   const fswatch = require('node-fswatch');
   fswatch.watch('~/.openclaw/workspace/MEMORY.md', (filename) => {
     recordAccess(filename);  // 记录文件访问
   });
   ```

4. **数据库Schema升级**:
   ```sql
   -- 添加访问来源字段
   ALTER TABLE access_log ADD COLUMN access_source TEXT;
   -- access_source 可能值: 'search', 'get', 'file', 'api'
   ```

**优势**:
- ✅ 真实访问统计,准确反映使用情况
- ✅ 自动记录,无需手动操作
- ✅ 实时更新,访问追踪即时生效

**劣势**:
- ❌ 需要修改核心工具(memory_search, memory_get),改动范围大
- ❌ 集成复杂度高,需要改动多个工具
- ❌ 维护成本高,每次工具更新需要重新集成
- ❌ 风险高,可能影响现有功能

**实施成本**: 3-5天(集成+测试+验证)
**维护成本**: 中等(每次工具更新需要重新测试)

---

### 方案B: 中间件模式(代理层)

**原理**:
- 在记忆读取工具和数据库之间插入中间件层
- 拦截记忆访问请求,自动记录访问
- 不修改原有工具,通过装饰器模式实现

**架构设计**:

```
┌─────────────────┐
│  memory_search │
│  memory_get    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 访问追踪中间件  │ ← 拦截请求,记录访问
│ (Access Proxy) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQLite DB     │
└─────────────────┘
```

**实施步骤**:

1. **创建访问追踪中间件**(access-proxy.js):
   ```javascript
   // 访问追踪中间件
   const accessProxy = {
     // 代理 memory_search
     search: async function(query) {
       const results = await memorySearchOriginal(query);
       // 记录访问
       for (const result of results) {
         await this.recordAccess(result.path, 'search');
       }
       return results;
     },

     // 代理 memory_get
     get: async function(path) {
       const content = await memoryGetOriginal(path);
       // 记录访问
       await this.recordAccess(path, 'get');
       return content;
     },

     // 记录访问
     recordAccess: async function(path, source) {
       const db = getMemoryDB();
       const memory = await getMemoryByPath(db, path);
       if (memory) {
         await updateAccessCount(db, memory.id);
         await updateLastAccessed(db, memory.id);
         await insertAccessLog(db, memory.id, source);
       }
     }
   };
   ```

2. **配置工具路由**(在 OpenClaw 主系统配置中):
   ```javascript
   // 将 memory_search 和 memory_get 重定向到中间件
   const { search: memorySearchOriginal, get: memoryGetOriginal } = require('@openclaw/memory');

   // 创建中间件实例
   const accessProxy = createAccessProxy(memorySearchOriginal, memoryGetOriginal);

   // 替换工具导出
   module.exports = {
     memory_search: accessProxy.search,
     memory_get: accessProxy.get
   };
   ```

3. **数据库Schema升级**(同方案A)

**优势**:
- ✅ 不修改原有工具代码,降低风险
- ✅ 中间件可插拔,易于维护
- ✅ 可扩展性强,可添加更多追踪功能

**劣势**:
- ❌ 需要改动 OpenClaw 主系统配置
- ❌ 中间件可能影响性能(拦截请求)
- ❌ 集成复杂度仍然较高

**实施成本**: 2-3天(中间件开发+测试+配置)
**维护成本**: 低到中等(中间件独立维护)

---

### 方案C: 事件驱动(异步记录)

**原理**:
- 记忆读取工具发布访问事件
- 访问追踪服务订阅事件,异步记录访问
- 事件总线解耦,不影响主流程

**架构设计**:

```
┌─────────────────┐
│  memory_search │
│  memory_get    │
└────────┬────────┘
         │ 访问事件
         ▼
┌─────────────────┐
│  事件总线      │ ← 发布 'memory.access' 事件
│ (Event Bus)    │
└────────┬────────┘
         │ 订阅
         ▼
┌─────────────────┐
│ 访问追踪服务   │ ← 异步处理访问记录
│ (Access Svc)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   SQLite DB     │
└─────────────────┘
```

**实施步骤**:

1. **在记忆读取工具中添加事件发布**:
   ```javascript
   // 在 memory_search 中发布事件
   async function memory_search(query) {
     const results = await semanticSearch(query);

     // 发布访问事件
     eventBus.emit('memory.access', {
       paths: results.map(r => r.path),
       source: 'search',
       timestamp: Date.now()
     });

     return results;
   }

   // 在 memory_get 中发布事件
   async function memory_get(path) {
     const content = await readFile(path);

     // 发布访问事件
     eventBus.emit('memory.access', {
       paths: [path],
       source: 'get',
       timestamp: Date.now()
     });

     return content;
   }
   ```

2. **创建访问追踪服务**(access-service.js):
   ```javascript
   // 访问追踪服务
   const eventBus = require('@openclaw/events');

   // 订阅访问事件
   eventBus.on('memory.access', async (event) => {
     const { paths, source, timestamp } = event;
     const db = getMemoryDB();

     // 批量记录访问
     for (const path of paths) {
       const memory = await getMemoryByPath(db, path);
       if (memory) {
         await updateAccessCount(db, memory.id);
         await updateLastAccessed(db, memory.id);
         await insertAccessLog(db, memory.id, source);
       }
     }
   });
   ```

3. **部署访问追踪服务**(独立进程):
   ```javascript
   // 启动访问追踪服务
   const accessService = require('./access-service');
   accessService.start();  // 订阅事件,开始追踪

   // 保持服务运行
   process.on('SIGTERM', () => {
     accessService.stop();
     process.exit(0);
   });
   ```

4. **数据库Schema升级**(同方案A)

**优势**:
- ✅ 完全异步,不影响主流程性能
- ✅ 解耦合,易于扩展和维护
- ✅ 可靠性高,事件丢失有重试机制

**劣势**:
- ❌ 需要改动记忆读取工具(发布事件)
- ❌ 需要部署独立服务(访问追踪服务)
- ❌ 事件总线基础设施(可能需要新建)

**实施成本**: 3-4天(事件发布+服务开发+部署)
**维护成本**: 低(服务独立运行,易维护)

---

### 方案D: 定期扫描(基于文件系统时间戳)

**原理**:
- 定期扫描 MEMORY.md 文件的修改时间/访问时间
- 基于文件系统时间戳推断访问频率
- 无需修改任何工具

**实施步骤**:

1. **创建文件访问分析脚本**(file-access-analyzer.js):
   ```javascript
   const fs = require('fs');
   const path = require('path');

   // 获取文件访问统计
   function getFileAccessStats(filePath) {
     const stats = fs.statSync(filePath);
     return {
       mtime: stats.mtime.getTime(),      // 修改时间
       atime: stats.atime.getTime(),      // 访问时间
       ctime: stats.ctime.getTime(),      // 创建时间
       birthtime: stats.birthtime.getTime() // 出生时间
     };
   }

   // 分析文件访问频率
   function analyzeAccessFrequency(filePath) {
     const stats = getFileAccessStats(filePath);
     const now = Date.now();
     const daysSinceAccess = (now - stats.atime) / (1000 * 60 * 60 * 24);

     // 基于天数推断访问频率
     if (daysSinceAccess < 1) {
       return { frequency: 'very-high', estimatedAccess: 50 };  // 每天多次访问
     } else if (daysSinceAccess < 7) {
       return { frequency: 'high', estimatedAccess: 20 };       // 每周多次访问
     } else if (daysSinceAccess < 30) {
       return { frequency: 'medium', estimatedAccess: 5 };      // 每月多次访问
     } else {
       return { frequency: 'low', estimatedAccess: 1 };       // 很少访问
     }
   }
   ```

2. **定期运行分析**(cron任务):
   ```javascript
   // 定期分析文件访问
   const analyzer = require('./file-access-analyzer');
   const MEMORY_PATH = '~/.openclaw/workspace/MEMORY.md';

   async function analyzeAndRecord() {
     const accessStats = analyzer.analyzeAccessFrequency(MEMORY_PATH);
     console.log(`文件访问统计: ${JSON.stringify(accessStats)}`);

     // 根据访问频率更新数据库
     const db = getMemoryDB();
     const memory = await getMemoryByPath(db, MEMORY_PATH);
     if (memory) {
       // 更新访问次数(基于估算)
       const estimatedAccess = accessStats.estimatedAccess;
       await updateAccessCount(db, memory.id, estimatedAccess);
     }
   }

   // 每天运行一次
   setInterval(analyzeAndRecord, 24 * 60 * 60 * 1000);
   ```

3. **数据库Schema升级**:
   ```sql
   -- 添加文件访问统计字段
   ALTER TABLE memories ADD COLUMN file_access_stats TEXT;
   -- 存储文件访问统计JSON
   ```

**优势**:
- ✅ 无需修改任何工具,零侵入
- ✅ 实施成本低,1-2天完成
- ✅ 维护成本低,只需运行脚本

**劣势**:
- ❌ 不准确,文件系统时间戳不可靠(atime可能被禁用)
- ❌ 粒度粗,无法区分具体哪条记忆被访问
- ❌ MacOS禁用了atime访问时间追踪(导致atime等于mtime)

**实施成本**: 1-2天(脚本开发+测试)
**维护成本**: 低(定期运行脚本)

---

## 方案对比

| 方案 | 准确性 | 实施成本 | 维护成本 | 风险 | 推荐度 |
|------|-------|---------|---------|------|-------|
| A. 内存集成 | ⭐⭐⭐⭐⭐ 高 | 3-5天 高 | 中等 | 高(改动核心工具) | ⭐⭐ 不推荐 |
| B. 中间件模式 | ⭐⭐⭐⭐ 高 | 2-3天 中等 | 低到中等 | 中等(配置复杂) | ⭐⭐⭐ 可考虑 |
| C. 事件驱动 | ⭐⭐⭐⭐ 高 | 3-4天 中等高 | 低 | 低到中等(需要事件总线) | ⭐⭐⭐⭐ 推荐 |
| D. 定期扫描 | ⭐⭐ 低 | 1-2天 低 | 低 | 低(零侵入) | ⭐ 不推荐 |
| 当前启发式 | ⭐⭐⭐ 中等 | 0 已完成 | 低 | 低 | ⭐⭐⭐⭐⭐ 推荐 |

---

## 价值评估

### 真实访问追踪的价值

**潜在收益**:
1. **访问统计更准确**: 真实反映记忆使用情况,而非基于启发式估算
2. **评分系统更精确**: 评分系统的访问频率权重(30%)基于真实数据
3. **归档策略更合理**: 基于真实访问频率的归档决策更准确
4. **洞察更深入**: 可分析记忆访问模式,优化记忆组织

**实际场景**:
- 某些记忆实际访问频繁,但启发式算法低估了(例如新添加的记忆)
- 某些记忆实际很少访问,但启发式算法高估了(例如老的记忆)
- 访问模式可能随时间变化,启发式算法无法适应

### 真实访问追踪的代价

**实施成本**:
- 方案C(事件驱动): 3-4天开发+测试+部署
- 需要改动记忆读取工具(memory_search, memory_get)
- 需要部署独立服务(访问追踪服务)
- 需要事件总线基础设施(可能需要新建)

**维护成本**:
- 低(服务独立运行,易维护)
- 需要监控服务状态(异常告警)
- 需要定期检查访问日志(数据质量)

**风险**:
- 低(异步记录,不影响主流程)
- 事件丢失风险(有重试机制)
- 服务崩溃风险(可自动重启)

### 价值/成本比分析

**当前状态**:
- 记忆库规模小(9条活跃记忆)
- 启发式访问追踪效果良好(评分系统稳定,评分分布合理)
- 连续7次优化无变化,系统持续稳定

**预期收益**:
- 改进空间有限(9条记忆,访问模式简单)
- 评分系统已经稳定(权重调整后无变化)
- 归档策略尚未触发(记忆库规模小)

**成本**:
- 3-4天开发时间
- 需要改动记忆读取工具(可能影响其他功能)
- 需要部署独立服务(增加复杂度)

---

## 推荐方案

### 短期建议(本周)

**结论**: **暂缓实施真实访问追踪,继续使用启发式算法**

**理由**:
1. **当前启发式算法效果良好**:
   - 评分系统长期稳定(连续7次优化无变化)
   - 评分分布合理(1.54-5.0)
   - 访问频率与类别权重高度相关

2. **记忆库规模小,改进空间有限**:
   - 9条活跃记忆,访问模式简单
   - 真实访问追踪的价值无法充分体现

3. **实施成本高,收益不明显**:
   - 3-4天开发时间
   - 需要改动记忆读取工具(风险)
   - 需要部署独立服务(复杂度)

4. **优先级低,有更重要的事情要做**:
   - 向量去重Phase 2(P3,暂缓)
   - 记忆库规模增长后再评估(50+条记忆)

### 中期建议(本月)

**观察指标**:
- 记忆库规模(是否增长到50+条)
- 访问模式(是否出现启发式算法无法识别的模式)
- 评分系统(是否出现评分偏差)

**触发条件**(满足任一即可):
1. 记忆库规模增长到50+条
2. 启发式访问追踪出现明显偏差(评分系统不稳定)
3. 用户反馈需要更准确的访问统计

**触发后行动**:
- 重新评估真实访问追踪价值
- 实施方案C(事件驱动)
- 验证效果(对比启发式vs真实访问)

### 长期建议(下月)

**如果记忆库规模增长到50+条**:
- 重新评估真实访问追踪价值
- 实施方案C(事件驱动)
- 与向量去重Phase 2同步实施(优化访问追踪性能)

**如果启发式算法持续有效**:
- 继续使用启发式算法
- 定期校准启发式参数(基于真实访问样本)
- 混合方案: 真实访问追踪+启发式算法(校准+推断)

---

## 结论

**推荐决策**: **暂缓实施真实访问追踪,继续使用启发式算法**

**核心理由**:
1. 当前启发式算法效果良好,评分系统稳定
2. 记忆库规模小,真实访问追踪价值有限
3. 实施成本高,收益不明显
4. 优先级低,有更重要的事情要做(向量去重Phase 2,等待记忆库规模增长)

**后续建议**:
- 继续观察记忆库状态,评估启发式算法效果
- 等待记忆库规模增长到50+条时,重新评估真实访问追踪价值
- 定期校准启发式参数(基于真实访问样本,如用户反馈)

**替代方案**(如果必须改进):
- 混合方案: 真实访问追踪+启发式算法
  - 真实访问追踪(方案C: 事件驱动): 记录部分关键记忆的真实访问
  - 启发式算法: 推断其他记忆的访问频率
  - 定期校准: 基于真实访问样本,调整启发式参数

---

**设计者**: 记忆优化器
**设计时间**: 2026-03-26 01:47
**状态**: 设计草案,待评估实施价值
**下一步**: 等待记忆库规模增长到50+条时,重新评估
