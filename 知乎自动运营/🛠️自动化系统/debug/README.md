# 调试目录

> 存放知乎自动化系统的调试文件和诊断报告

---

## 📁 目录结构

```
debug/
├── network-diagnosis.json     网络诊断报告
├── network-suggestions-*.json 网络优化建议
└── network-summary-*.json    网络诊断摘要
```

---

## 📊 调试文件说明

### 1. 网络诊断报告 (network-diagnosis.json)

**用途**: 记录网络连接诊断结果

**内容**:
- 知乎连接测试
- Hacker News 连接测试
- GitHub Trending 连接测试
- arXiv 连接测试
- DNS 解析测试
- 延迟测试

**数据格式**:
```json
{
  "timestamp": "2026-03-28T22:00:00Z",
  "results": {
    "zhihu": {
      "status": "success",
      "latency": 150,
      "statusCode": 200
    },
    "hacker-news": {
      "status": "timeout",
      "latency": 30000,
      "statusCode": null
    }
  }
}
```

---

### 2. 网络优化建议 (network-suggestions-*.json)

**用途**: 记录网络优化建议

**内容**:
- 超时配置建议
- 重试机制建议
- 代理配置建议
- DNS 配置建议

**数据格式**:
```json
{
  "timestamp": "2026-03-28T22:00:00Z",
  "suggestions": [
    {
      "type": "timeout",
      "message": "建议增加超时时间到 60 秒",
      "priority": "high"
    },
    {
      "type": "retry",
      "message": "建议添加重试机制",
      "priority": "medium"
    }
  ]
}
```

---

### 3. 网络诊断摘要 (network-summary-*.json)

**用途**: 网络诊断的简要摘要

**内容**:
- 诊断时间
- 总体状态
- 成功/失败统计
- 关键问题

**数据格式**:
```json
{
  "timestamp": "2026-03-28T22:00:00Z",
  "overallStatus": "warning",
  "successCount": 2,
  "failCount": 2,
  "issues": [
    "Hacker News 连接超时",
    "GitHub Trending 连接超时"
  ]
}
```

---

## 🔧 调试工具

### 1. 网络诊断脚本

**脚本**: `scripts/debug-network.js`

**用途**: 诊断网络连接问题

**使用方法**:
```bash
# 运行网络诊断
node scripts/debug-network.js

# 输出详细日志
node scripts/debug-network.js --verbose
```

**输出文件**:
- `debug/network-diagnosis.json` - 诊断报告
- `debug/network-suggestions-{timestamp}.json` - 优化建议
- `debug/network-summary-{timestamp}.json` - 诊断摘要

---

### 2. arXiv 调试脚本

**脚本**: `scripts/debug-arxiv.js`

**用途**: 调试 arXiv 数据采集问题

**使用方法**:
```bash
# 运行 arXiv 调试
node scripts/debug-arxiv.js
```

**输出文件**:
- `data/arxiv-debug.html` - arXiv 页面截图
- `data/arxiv-debug.png` - arXiv 页面截图

---

## 🔍 调试流程

### 1. 问题发现

**症状**:
- 脚本运行失败
- 数据采集失败
- 页面加载超时

**收集信息**:
- 错误日志 (`logs/error.log`)
- 调试文件 (`debug/`)
- 数据文件 (`data/`)

---

### 2. 问题诊断

**步骤**:
1. 查看错误日志
2. 运行网络诊断
3. 分析诊断报告
4. 查看优化建议

**命令**:
```bash
# 查看错误日志
cat logs/error.log

# 运行网络诊断
node scripts/debug-network.js

# 查看诊断报告
cat debug/network-diagnosis.json | jq

# 查看优化建议
cat debug/network-suggestions-*.json | jq
```

---

### 3. 问题解决

**根据优化建议修复问题**:
```json
{
  "type": "timeout",
  "message": "建议增加超时时间到 60 秒",
  "priority": "high"
}
```

**修复示例**:
```javascript
// 修改超时配置
await page.goto(url, { timeout: 60000 });  // 60 秒
```

---

### 4. 问题验证

**验证修复效果**:
```bash
# 重新运行脚本
node scripts/utils/hot-topic-tracker.js

# 查看运行日志
cat logs/app.log

# 检查数据文件
cat data/hot-topics-*.json | jq
```

---

## 📈 调试技巧

### 1. 启用调试模式

**在脚本中启用调试模式**:
```javascript
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('Debug mode enabled');
  console.log('Detailed information:', data);
}
```

**使用方法**:
```bash
DEBUG=true node scripts/utils/hot-topic-tracker.js
```

---

### 2. 保存页面截图

**保存截图用于分析**:
```javascript
// 保存 HTML
const html = await page.content();
await fs.writeFileSync('debug/page.html', html);

// 保存截图
await page.screenshot({ path: 'debug/page.png' });
```

---

### 3. 记录网络请求

**记录所有网络请求**:
```javascript
page.on('request', request => {
  console.log('Request:', request.url());
});

page.on('response', response => {
  console.log('Response:', response.url(), response.status());
});
```

---

### 4. 分步调试

**逐步执行，每步输出日志**:
```javascript
console.log('Step 1: Launch browser');
const browser = await playwright.chromium.launch();

console.log('Step 2: Create context');
const context = await browser.newContext();

console.log('Step 3: Navigate to page');
await page.goto('https://www.zhihu.com');

console.log('Step 4: Check login status');
const isLoggedIn = await checkLoginStatus(page);
console.log('Login status:', isLoggedIn);
```

---

## 🧹 调试文件清理

### 定期清理

**清理旧的调试文件**:
```bash
# 清理 7 天前的调试文件
find debug/ -name "*.json" -mtime +7 -delete
```

**清理诊断报告**:
```bash
# 清理所有诊断报告
rm -f debug/network-diagnosis.json
rm -f debug/network-suggestions-*.json
rm -f debug/network-summary-*.json
```

---

### 保留重要文件

**保留重要的诊断报告**:
```bash
# 移动重要文件到归档目录
mv debug/network-diagnosis.json debug/archive/network-diagnosis-$(date +%Y%m%d).json
```

---

## ⚠️ 注意事项

1. **调试文件大小**: 调试文件可能较大，定期清理
2. **敏感信息**: 不要在调试文件中记录敏感信息
3. **调试性能**: 调试模式会降低性能，生产环境关闭
4. **调试日志**: 调试日志会占用大量空间，注意清理

---

## 🔗 相关文档

- [主 README](../README.md) - 自动化系统说明
- [日志说明](../logs/README.md) - 日志目录说明
- [数据说明](../data/README.md) - 数据目录说明

---

**创建时间**: 2026-03-28 22:46
**版本**: v1.0
**状态**: ✅ 完成
