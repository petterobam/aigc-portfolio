# 🔧 脚本工具（scripts）

## 目录说明

本目录存放番茄小说创作和运营系统的所有自动化脚本，包括浏览器自动化、数据处理、文件管理等工具。

---

## 脚本分类

### 🌐 浏览器自动化（发布流程）
- `analyze-publish-page.js` - 分析番茄小说发布页面结构（V1）
- `analyze-publish-page-v2.js` - 分析番茄小说发布页面结构（V2，优化选择器）
- `analyze-publish-page-multi-step.js` - 分析多步骤发布流程（第一页）
- `analyze-publish-page-multi-step-v2.js` - 分析多步骤发布流程（V2，支持更多字段）
- `analyze-publish-page-multi-step-v3.js` - 分析多步骤发布流程（V3，支持Cookie）
- `analyze-page-simple.js` - 简单的页面分析工具

### 🍪 Cookie 管理（登录状态）
- `cookie-manager.js` - Cookie 管理辅助模块（获取/加载/验证/保存Cookie）
- `login-save-cookies.js` - 登录并保存Cookie脚本

### 📊 数据抓取（番茄平台）
- `fetch-story-list.js` - 抓取番茄小说故事列表（基础版）
- `fetch-story-list-chrome.js` - 抓取番茄小说故事列表（Chrome持久化）
- `fetch-story-list-chrome-v2.js` - 抓取番茄小说故事列表（V2，优化）
- `fetch-story-list-chrome-v3.js` - 抓取番茄小说故事列表（V3，修复API调用）
- `fetch-story-list-chrome-v4.js` - 抓取番茄小说故事列表（V4，立即关闭）
- `fetch-all-pages.js` - 抓取所有页面的数据
- `fetch-fanqie-work-list.js` - 抓取番茄小说作品列表
- `fetch-short-story-data.js` - 抓取短篇小说数据

### 📈 数据监控（定时任务）
- `daily-data-monitor.js` - 每日数据监控脚本
- `fanqie-weekly-monitor.js` - 番茄小说每周数据监控

### 🔍 内容检查（质量控制）
- `check-duplicate-paragraphs.py` - 检查重复段落
- `check-duplicates-strict.py` - 严格检查重复段落
- `locate-duplicates.py` - 定位重复段落位置

### 🛠️ 内容修复（问题处理）
- `fix-duplicates-32.py` - 修复32号故事重复段落
- `fix-duplicates-32-final.py` - 最终修复32号故事重复段落
- `fix-duplicates-33.py` - 修复33号故事重复段落
- `clean-chapter-metadata.py` - 清理章节文件末尾的元数据

### 📦 发布包生成（自动化发布）
- `generate-publish-packages.js` - 生成故事发布包（自动提取元数据、生成JSON格式）⭐ 新增

### 📝 内容合并（文件处理）
- `extract-heartbeat-history.py` - 提取心跳历史记录

### 🔬 页面分析（结构研究）
- `analyze-story-list-structure.js` - 分析故事列表页面结构

---

## 脚本使用方法

### Cookie 管理

#### 1. 登录并保存 Cookie
```bash
cd ~/.openclaw/workspace
node scripts/login-save-cookies.js
```
**流程**：
1. 脚本自动打开浏览器，显示登录页
2. 使用番茄小说或番茄作家助手扫码登录
3. 登录成功后自动保存 Cookie
4. 生成登录报告和截图

#### 2. 查看 Cookie 状态
```bash
cd ~/.openclaw/workspace
node -e "const cm = require('./scripts/cookie-manager.js'); cm.printCookieStatus();"
```
**输出**：
- Cookie 文件列表
- 最新的 Cookie 信息（创建时间、文件年龄、Cookie 数量、涉及域名）

### 数据抓取

#### 1. 抓取番茄小说故事列表
```bash
cd ~/.openclaw/workspace
node scripts/fetch-story-list-chrome-v3.js
```
**输出**：
- `番茄短篇故事集/data/story-list-all-{timestamp}.json` - 完整数据（JSON）
- `番茄短篇故事集/data/story-list-all-{timestamp}.csv` - 完整数据（CSV）
- `番茄短篇故事集/data/short-manage-{timestamp}.png` - 截图
- `番茄短篇故事集/data/short-manage-{timestamp}.html` - 页面 HTML

#### 2. 抓取短篇小说数据
```bash
cd ~/.openclaw/workspace
node scripts/fetch-short-story-data.js
```

### 内容检查

#### 1. 检查重复段落
```bash
cd ~/.openclaw/workspace
python3 scripts/check-duplicates-strict.py
```
**输出**：
- 每个故事的重复段落数量
- 重复段落的具体位置（行号）
- 重复段落的内容

#### 2. 清理章节元数据
```bash
cd ~/.openclaw/workspace
python3 scripts/clean-chapter-metadata.py
```

### 页面分析

#### 1. 分析发布页面结构（多步骤，支持Cookie）
```bash
cd ~/.openclaw/workspace
node scripts/analyze-publish-page-multi-step-v3.js
```
**功能**：
- 启动浏览器时不使用持久化上下文（使用 Cookie 替代）
- 打印 Cookie 状态摘要
- 尝试加载最新的 Cookie 文件
- 检查 Cookie 有效性
- Cookie 失效时降级为扫码登录
- 登录成功后自动保存 Cookie
- 分析发布页面结构（多步骤）

---

## 脚本命名规范

### 浏览器自动化脚本
格式：`analyze-{功能}-{版本}.js`

示例：
- `analyze-publish-page.js` - 分析发布页面（V1）
- `analyze-publish-page-v2.js` - 分析发布页面（V2）
- `analyze-publish-page-multi-step-v3.js` - 分析多步骤发布流程（V3）

### 数据抓取脚本
格式：`fetch-{数据源}-{版本}.js`

示例：
- `fetch-story-list.js` - 抓取故事列表（基础版）
- `fetch-story-list-chrome-v3.js` - 抓取故事列表（Chrome V3）
- `fetch-short-story-data.js` - 抓取短篇小说数据

### 内容检查脚本
格式：`check-{功能}.py`

示例：
- `check-duplicates-strict.py` - 严格检查重复段落
- `check-duplicate-paragraphs.py` - 检查重复段落

### 内容修复脚本
格式：`fix-{问题}.py`

示例：
- `fix-duplicates-32.py` - 修复32号故事重复段落
- `fix-duplicates-33.py` - 修复33号故事重复段落

---

## 技术栈

### 浏览器自动化
- **Playwright** - 浏览器自动化框架
- **Chromium** - 浏览器内核

### 数据处理
- **Node.js** - 脚本运行环境
- **Python 3** - 脚本运行环境

### 数据存储
- **JSON** - 结构化数据存储
- **CSV** - 表格数据存储
- **HTML** - 页面源代码存储

---

## 开发规范

### 1. 脚本结构
```javascript
// 1. 引入依赖
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

// 2. 配置参数
const CONFIG = {
  // 配置项
};

// 3. 主函数
async function main() {
  // 脚本逻辑
}

// 4. 错误处理
main().catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});
```

### 2. 错误处理
- 必须包含 `try-catch` 块
- 必须记录错误日志
- 必须提供友好的错误提示
- 脚本失败时返回非零退出码

### 3. 日志记录
- 使用 `console.log` 输出关键信息
- 使用 `console.error` 输出错误信息
- 使用 `console.warn` 输出警告信息
- 保存日志到文件（可选）

### 4. 数据验证
- 验证输入参数
- 验证数据格式
- 验证文件路径
- 验证网络连接

---

## 版本管理

### 版本号规则
- **V1** - 初始版本
- **V2** - 优化版本（修复bug，优化逻辑）
- **V3** - 增强版本（新增功能，重大优化）
- **V4** - 稳定版本（长期维护）

### 版本历史
#### 浏览器自动化
- `analyze-publish-page.js` (V1) - 基础版本
- `analyze-publish-page-v2.js` (V2) - 优化选择器
- `analyze-publish-page-multi-step.js` (V1) - 多步骤支持
- `analyze-publish-page-multi-step-v2.js` (V2) - 更多字段支持
- `analyze-publish-page-multi-step-v3.js` (V3) - Cookie 支持

#### 数据抓取
- `fetch-story-list.js` (V1) - 基础版本
- `fetch-story-list-chrome.js` (V2) - Chrome 持久化
- `fetch-story-list-chrome-v2.js` (V3) - 优化
- `fetch-story-list-chrome-v3.js` (V4) - 修复 API 调用
- `fetch-story-list-chrome-v4.js` (V5) - 立即关闭

---

## 依赖管理

### Node.js 依赖
```json
{
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
```

### 安装依赖
```bash
cd ~/.openclaw/workspace
npm install
```

### 安装 Playwright 浏览器
```bash
npx playwright install chromium
```

---

## 测试规范

### 1. 单元测试
- 测试关键函数
- 测试边界情况
- 测试错误处理

### 2. 集成测试
- 测试完整流程
- 测试与其他脚本的集成
- 测试实际使用场景

### 3. 手动测试
- 在真实环境中测试
- 使用真实数据测试
- 记录测试结果

---

## 维护规则

1. **定期更新**：每周检查一次脚本是否正常运行
2. **及时修复**：发现问题立即修复
3. **版本迭代**：根据需求添加新功能
4. **文档更新**：修改脚本时同步更新文档
5. **代码审查**：提交前进行代码审查

---

## 相关文档

- Cookie 自动化推进计划：`番茄短篇故事集/docs/cookie-automation-roadmap-2026-03-19.md`
- 登录状态维护方案研究：`番茄短篇故事集/docs/login-state-solution-research-2026-03-19.md`
- 发布流程自动化调研：`番茄短篇故事集/docs/publish-automation-research-2026-03-19.md`

---

**维护者**: 番茄短篇创作和运营专家
**最后更新**: 2026-03-20
**目录版本**: v1.0
