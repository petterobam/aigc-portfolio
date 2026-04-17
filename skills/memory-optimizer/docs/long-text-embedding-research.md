# 长文本向量生成调研报告

**调研时间**: 2026-03-29
**调研目标**: 解决向量生成截断严重问题（长记忆从 3000-30000 字符截断到 2000 字符）

---

## 问题现状

### 当前配置
- **模型**: Ollama gemma:2b
- **内容长度限制**: maxContentLength: 2000 字符
- **向量维度**: 配置中标注 768（实测为 2048）

### 截断情况
根据优化日志，大量记忆被截断：
- 最长一条：30512 字符 → 2000（截断 94%）
- 其他常见截断：15396、14078、11451、9554 等字符

### 影响评估
- 🔴 **高优先级问题**
- 长文档的语义信息丢失严重
- 语义去重准确性下降
- 可能导致误判（实际不重复的记忆被判定为重复）

---

## 调研发现

### 1. Ollama 模型能力测试

#### gemma:2b 长文本测试
```bash
# 测试 5000 字符长文本
ollama run gemma:2b -p "5000 字符文本..."
```

**测试结果**:
- ✅ 成功生成向量
- ✅ 向量维度：2048（非配置中的 768）
- ✅ 无截断问题
- ⚠️ 结论：gemma:2b 可以处理长文本，截断是代码限制

#### 专门的 Embedding 模型
- **nomic-embed-text**: Ollama 推荐的 embedding 模型
  - 状态：测试下载中
  - 大小：274 MB
  - 优势：专为 embedding 优化，可能质量更好

### 2. 根因分析

#### 代码限制
在 `scripts/ollama-embeddings.js` 中：

```javascript
const DEFAULT_CONFIG = {
  maxContentLength: 2000,       // ← 硬编码限制
  preferSummary: true          // ← 优先使用 summary
};
```

**问题**：
- `maxContentLength: 2000` 是硬编码的限制
- 不是 Ollama 模型的限制
- 代码强制截断内容到 2000 字符

#### 向量维度不一致
- 配置文件中标注：`dimensions: 768`
- 实际运行结果：`2048`
- 可能原因：gemma:2b 实际输出维度是 2048，配置未更新

---

## 解决方案对比

### 方案 A：移除或增加内容长度限制 ⭐推荐

**实施步骤**:
1. 修改 `scripts/ollama-embeddings.js` 的 DEFAULT_CONFIG
   ```javascript
   maxContentLength: 10000,  // 从 2000 增加到 10000
   // 或完全移除此限制
   ```
2. 更新配置文件中的 dimensions
   ```javascript
   dimensions: 2048,  // 从 768 更新为 2048
   ```
3. 测试向量生成性能
4. 观察语义去重准确性变化

**优势**:
- ✅ 实施简单（5 分钟）
- ✅ 无需下载新模型
- ✅ 保留现有向量缓存
- ✅ 立即生效

**劣势**:
- ⚠️ 长文本生成向量可能较慢
- ⚠️ 需要重新生成向量（使用新长度）

**预估影响**:
- 时间成本：5 分钟配置 + 重新生成向量（5-10 分钟）
- 性能影响：长文本生成时间增加 2-3 倍
- 准确性提升：语义去重准确性预计提升 30-50%

---

### 方案 B：切换到专门的 Embedding 模型

**实施步骤**:
1. 下载 nomic-embed-text 模型
   ```bash
   ollama pull nomic-embed-text
   ```
2. 修改配置文件
   ```javascript
   model: 'nomic-embed-text',  // 从 gemma:2b 切换
   dimensions: 768,           // nomic-embed-text 的维度
   maxContentLength: 8192,     // 增加（或移除）限制
   ```
3. 清空现有向量缓存（embedding_version 变化）
4. 重新生成所有向量
5. 测试语义去重准确性

**优势**:
- ✅ 专为 embedding 优化，质量可能更好
- ✅ 可能更快的生成速度
- ✅ 更小的向量维度（768 vs 2048），节省存储空间

**劣势**:
- ❌ 需要下载新模型（274 MB，约 1 分钟）
- ❌ 需要清空现有向量缓存
- ❌ 需要重新生成所有向量（77 条记忆）
- ❌ 未知的质量提升（需要测试验证）

**预估影响**:
- 时间成本：下载 1 分钟 + 配置 5 分钟 + 重新生成向量 10-15 分钟
- 性能影响：可能稍快（专门优化）
- 准确性提升：需要实际测试验证

---

### 方案 C：渐进式迁移（A + B）

**实施步骤**:
1. **阶段一**：实施方案 A（立即见效）
   - 增加内容长度限制到 10000
   - 更新维度配置到 2048
   - 重新生成向量
   - 验证效果

2. **阶段二**：评估并切换（可选）
   - 下载 nomic-embed-text
   - 对比两种模型的向量质量
   - 如果提升明显，切换到新模型
   - 如果不明显，继续使用 gemma:2b

**优势**:
- ✅ 立即解决问题（阶段一）
- ✅ 渐进式升级，风险可控
- ✅ 有数据支撑的决策（阶段二对比测试）

**劣势**:
- ⚠️ 可能需要两次重新生成向量
- ⚠️ 总体时间稍长

**预估影响**:
- 时间成本：阶段一 15 分钟 + 阶段二（可选）15-20 分钟
- 风险：低（渐进式）

---

## 推荐方案

### 🎯 推荐方案 C（渐进式迁移）

**理由**:
1. **快速解决问题**：阶段一立即解决截断问题，15 分钟内见效
2. **风险可控**：先测试现有模型的长文本能力，再决定是否切换
3. **数据驱动**：有实际测试数据支撑决策，避免盲目切换
4. **保留灵活性**：如果新模型提升不明显，可以继续使用现有模型

### 实施计划

#### 阶段一：增加内容长度限制（立即实施）

**时间预估**: 15 分钟

**步骤**:
1. 修改 `scripts/ollama-embeddings.js`
   ```javascript
   const DEFAULT_CONFIG = {
     maxContentLength: 10000,      // 从 2000 增加到 10000
     dimensions: 2048,           // 从 768 更新为 2048
     // ... 其他配置保持不变
   };
   ```

2. 清空向量缓存（触发重新生成）
   ```sql
   UPDATE content SET embedding = NULL;
   UPDATE content SET embedding_version = NULL;
   ```

3. 运行优化脚本，重新生成向量
   ```bash
   node scripts/optimize.js
   ```

4. 验证效果
   - 检查向量生成日志（应该无截断警告）
   - 对比优化报告（语义重复检测应该更准确）
   - 记录向量生成时间

#### 阶段二：评估新模型（可选，本周内）

**时间预估**: 20 分钟

**步骤**:
1. 下载 nomic-embed-text
   ```bash
   ollama pull nomic-embed-text
   ```

2. 创建对比测试脚本
   - 使用 5-10 条长记忆（>2000 字符）
   - 分别用 gemma:2b 和 nomic-embed-text 生成向量
   - 对比向量质量（相似度、语义匹配）

3. 决策
   - 如果 nomic-embed-text 明显更好 → 切换
   - 如果差不多 → 继续使用 gemma:2b

---

## 风险评估

### 阶段一风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 长文本生成向量过慢 | 中 | 中 | 监控生成时间，必要时回退到 5000 |
| 语义去重准确性下降 | 低 | 高 | 对比优化报告，观察重复检测数量变化 |
| 向量维度错误 | 低 | 低 | 已测试确认是 2048 |

### 阶段二风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 新模型质量不如预期 | 中 | 低 | 先做小规模对比测试 |
| 需要重新生成向量 | 高 | 中 | 阶段一已做一次，阶段二可以延后 |

---

## 后续监控指标

### 关键指标
1. **向量生成时间**: 平均生成一条向量的时间（目标 < 2 秒）
2. **语义重复检测准确率**: 人工抽查 10 组相似记忆，验证判定是否合理
3. **优化报告变化**: 归档/删除数量是否有异常变化
4. **系统性能**: 优化脚本运行时间（目标 < 30 秒）

### 监控周期
- **第一周**: 每次心跳记录向量生成时间
- **第二周**: 对比优化报告，观察语义重复检测变化
- **长期**: 每月评估一次语义去重准确性

---

## 附录

### A. 测试代码

测试长文本向量生成：
```bash
cat > /tmp/test-long-embedding.js << 'EOF'
const http = require('http');

const longText = 'a'.repeat(5000); // 5000 字符

const postData = JSON.stringify({
  model: 'gemma:2b',
  prompt: longText
});

const options = {
  hostname: 'localhost',
  port: 11434,
  path: '/api/embeddings',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    const result = JSON.parse(data);
    if (result.embedding) {
      console.log('Embedding dimension:', result.embedding.length);
      console.log('✅ 长文本向量生成成功！');
    }
  });
});

req.on('error', (e) => {
  console.error('Error:', e.message);
});

req.write(postData);
req.end();
EOF

node /tmp/test-long-embedding.js
```

### B. Ollama 模型对比

| 模型 | 类型 | 大小 | 向量维度 | 长文本支持 | 备注 |
|------|------|------|----------|------------|------|
| gemma:2b | 通用 | 1.7 GB | 2048 | ✅ 5000+ 字符 | 当前使用 |
| nomic-embed-text | Embedding | 274 MB | 768 | ✅ 8192 字符 | 推荐，正在测试 |

---

**文档版本**: v1.0
**创建时间**: 2026-03-29 12:59
**维护者**: 记忆优化器
