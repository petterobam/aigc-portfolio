# 🛠️ 自动化脚本索引

> **最后更新**: 2026-04-14 | **活跃脚本**: 20 | **归档**: 21（见 `archive/`）
> **审计报告**: `../脚本审计报告-20260414.md`

---

## 🔄 核心工具链

按使用顺序排列：**登录 → Cookie → 发布 → 数据**

| 脚本 | 用途 | 大小 |
|------|------|------|
| `zhihu-login-and-diagnostic.js` | 登录 + 诊断一体化 | 25KB |
| `zhihu-cookie-auto-extractor.js` | 智能 Cookie 提取 | 12KB |
| `verify-zhihu-cookies.js` | Cookie 有效性验证 | 6KB |
| `batch-publish-articles-v4.js` | 批量发布（最新版） | 19KB |
| `enhanced-publisher.js` | 单篇发布 + 安全验证 | 15KB |
| `data-collector-optimized.js` | 数据采集（优化版） | 25KB |
| `data-monitor.js` | 数据监控 | 25KB |

## 🔧 辅助工具

| 脚本 | 用途 |
|------|------|
| `content-optimizer.js` | 内容质量优化 |
| `evaluate-zhihu-article.js` | 文章质量评估 |
| `article-optimizer.js` | 文章优化 |
| `page-structure-fix.js` | 页面结构修复 |
| `analyze-zhihu-answer-page-v2.js` | 回答页面分析 |
| `enhanced-security-handler.js` | 安全验证处理 |
| `zhihu-auto-operations.js` | 统一操作入口 |
| `zhihu-auto-simple.js` | 简化版自动化 |
| `quick-system-check.js` | 快速系统检查 |
| `comprehensive-system-test.js` | 综合测试 |
| `debug-network.js` | 网络调试 |
| `check-article-files.js` | 文章文件检查 |
| `zhihu-paid-column-research.js` | 付费专栏调研 |

## 🗂️ 子目录

| 目录 | 用途 |
|------|------|
| `archive/` | 已归档的旧版本脚本（21个） |
| `eval/` | 评估相关脚本 |
| `publish/` | 发布相关子脚本 |
| `test/` | 测试相关 |
| `test-results/` | 测试结果 |
| `utils/` | 公共工具函数 |

---

## ⚡ 快速使用

```bash
# 1. 登录知乎
node zhihu-login-and-diagnostic.js

# 2. 验证 Cookie
node verify-zhihu-cookies.js

# 3. 批量发布（dry-run）
node batch-publish-articles-v4.js --dry-run

# 4. 批量发布（正式）
node batch-publish-articles-v4.js

# 5. 数据采集
node data-collector-optimized.js

# 6. 系统检查
node quick-system-check.js
```
