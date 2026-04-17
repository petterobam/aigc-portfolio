# 知乎内容发布脚本使用指南

## 概述

知乎自动化系统包含两个发布脚本：

1. **`publish-zhihu-article.js`** - 知乎专栏文章自动发布
   - ✅ 自动加载知乎 Cookie
   - ✅ 自动登录知乎创作中心
   - ✅ 自动创建新专栏文章
   - ✅ 自动填充标题、内容、话题标签
   - ✅ 自动发布文章
   - ✅ 验证发布成功

2. **`publish-zhihu-answer.js`** - 知乎回答自动发布 ⭐ **NEW**
   - ✅ 自动加载知乎 Cookie
   - ✅ 自动登录知乎
   - ✅ 自动导航到问题页面
   - ✅ 自动填充回答内容
   - ✅ 自动发布回答
   - ✅ 验证发布成功

---

## 使用前准备

### 1. 确保已安装依赖

```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
npm install playwright
```

### 2. 配置知乎 Cookie

#### 方法 1：从已登录的浏览器提取（推荐）

```bash
# 启动 Chrome 调试模式（如果还没有启动）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check

# 在 Chrome 中登录知乎

# 提取 Cookie
node scripts/utils/extract-zhihu-cookies.js
```

#### 方法 2：手动登录保存

```bash
# 启动浏览器并手动登录
node scripts/zhihu-login-save-cookies.js
```

### 3. 准备文章文件

文章文件必须是 JSON 格式，包含以下字段：

```json
{
  "title": "文章标题",
  "content": "文章内容（HTML 格式）",
  "tags": ["标签1", "标签2", "标签3"],
  "coverImage": "封面图片 URL（可选）"
}
```

#### 字段说明

| 字段 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `title` | String | ✅ | 文章标题，建议 20-50 字 |
| `content` | String | ✅ | 文章内容，支持 HTML 格式 |
| `tags` | Array | ❌ | 话题标签，建议 3-5 个 |
| `coverImage` | String | ❌ | 封面图片 URL |

#### 文章内容格式建议

- 使用 HTML 格式（`<p>`、`<h2>`、`<ul>`、`<ol>`、`<pre>` 等标签）
- 标题使用 `<h2>` 或 `<h3>`
- 段落使用 `<p>`
- 代码块使用 `<pre><code>`
- 列表使用 `<ul>` 或 `<ol>`

---

## 使用方法

### 基本用法

```bash
node scripts/publish/publish-zhihu-article.js <article-file>
```

### 示例

```bash
# 发布测试文章
node scripts/publish/publish-zhihu-article.js scripts/publish/test-article.json

# 发布正式文章
node scripts/publish/publish-zhihu-article.js 📤待发布/🔥高优先级/OpenClaw入门完全指南.json
```

---

## 发布流程

脚本会自动执行以下步骤：

1. **启动浏览器**
   - 使用 Chromium 浏览器（headless=false，便于调试）
   - 创建浏览器上下文和页面

2. **加载 Cookie**
   - 从 `auth/zhihu-cookies-latest.json` 加载 Cookie
   - 验证关键 Cookie（d_c0、z_c0）

3. **检查登录状态**
   - 访问知乎创作中心
   - 验证是否已登录
   - 如果未登录，提示重新获取 Cookie

4. **创建文章**
   - 导航到文章发布页面
   - 输入标题（模拟人类打字）
   - 输入正文内容
   - 添加话题标签

5. **发布文章**
   - 点击发布按钮
   - 等待发布完成

6. **验证发布**
   - 检查是否跳转到文章详情页
   - 提取文章 URL 和 ID

7. **保存记录**
   - 保存发布记录到 `data/` 目录
   - 保存发布前后截图

---

## 输出结果

### 成功输出

```
═══════════════════════════════════════════════════════════════
  知乎文章自动发布脚本
═══════════════════════════════════════════════════════════════

📄 已加载文章文件: test-article.json
   标题: OpenClaw 入门完全指南：10 分钟从零搭建 AI 助手工作流

🌐 启动浏览器...
📍 创建浏览器上下文...
✅ 已加载 15 个知乎 Cookie

📊 检查登录状态...
✅ 已登录

📝 创建新文章...
   标题: OpenClaw 入门完全指南：10 分钟从零搭建 AI 助手工作流
   标签: AI工具, OpenClaw, 自动化, 效率提升, 开发工具
📄 导航到发布页面: https://zhuanlan.zhihu.com/write
⌨️  输入标题...
⌨️  输入正文...
   找到编辑器: .public-DraftEditor-content
🏷️  添加话题标签: AI工具, OpenClaw, 自动化, 效率提升, 开发工具
✅ 文章内容填写完成

🚀 发布文章...
   找到发布按钮: .Button--primary:has-text("发布")
⌨️  点击发布按钮...
⏳ 等待发布完成...
✅ 发布成功！
   文章 URL: https://zhuanlan.zhihu.com/p/123456789

🔍 验证发布结果...
   页面标题: OpenClaw 入门完全指南：10 分钟从零搭建 AI 助手工作流
✅ 验证通过：已成功跳转到文章详情页
   文章 ID: 123456789

📸 发布前截图: data/publish-before-1711234567890.png
📸 发布后截图: data/publish-after-1711234567891.png

═══════════════════════════════════════════════════════════════
  ✅ 发布完成！
═══════════════════════════════════════════════════════════════

  文章标题: OpenClaw 入门完全指南：10 分钟从零搭建 AI 助手工作流
  文章 URL: https://zhuanlan.zhihu.com/p/123456789
  文章 ID: 123456789

📄 发布记录: data/publish-record-2026-03-28T15-30-00-000Z.json

🚪 正在关闭浏览器...
✅ 浏览器已关闭
```

### 发布记录格式

脚本会在 `data/` 目录下生成发布记录文件：

```json
{
  "timestamp": "2026-03-28T15:30:00.000Z",
  "articleFile": "test-article.json",
  "articleData": {
    "title": "OpenClaw 入门完全指南：10 分钟从零搭建 AI 助手工作流",
    "tags": ["AI工具", "OpenClaw", "自动化", "效率提升", "开发工具"]
  },
  "success": true,
  "articleUrl": "https://zhuanlan.zhihu.com/p/123456789",
  "articleId": "123456789",
  "screenshots": [
    "data/publish-before-1711234567890.png",
    "data/publish-after-1711234567891.png"
  ]
}
```

---

## 常见问题

### 1. Cookie 文件不存在

**错误信息**：
```
❌ Cookie 文件不存在: auth/zhihu-cookies-latest.json
```

**解决方案**：
```bash
# 提取 Cookie
node scripts/utils/extract-zhihu-cookies.js

# 或手动登录
node scripts/zhihu-login-save-cookies.js
```

### 2. Cookie 已过期

**错误信息**：
```
⚠️  未检测到关键 Cookie（d_c0 / z_c0）
   Cookie 可能已过期，请重新登录
```

**解决方案**：
```bash
# 重新提取 Cookie
node scripts/utils/extract-zhihu-cookies.js
```

### 3. 登录失败

**错误信息**：
```
❌ 登录检查失败: 未登录，Cookie 可能已过期
```

**解决方案**：
1. 检查 Cookie 文件是否有效
2. 在浏览器中手动登录知乎
3. 重新提取 Cookie

### 4. 找不到发布按钮

**错误信息**：
```
❌ 发布失败: 找不到发布按钮
```

**解决方案**：
1. 检查文章内容是否填写完整
2. 确保标题和内容不为空
3. 查看截图确认页面状态

### 5. 验证失败

**错误信息**：
```
❌ 验证失败: 未跳转到文章详情页
```

**解决方案**：
1. 检查网络连接
2. 查看错误截图
3. 手动访问文章 URL 确认

---

## 最佳实践

### 1. 文章内容准备

- 使用 Markdown 转换为 HTML（推荐使用 `marked` 库）
- 确保代码块格式正确
- 添加适当的图片和链接
- 检查字数（建议 1500-3000 字）

### 2. 发布节奏

- 建议 2-3 天发布一篇
- 观察数据反馈，调整发布频率
- 高质量 > 高数量

### 3. 标题和标签优化

- 使用吸引人的标题
- 添加 3-5 个相关标签
- 标签要与内容相关

### 4. 发布前检查

- 检查文章内容是否有错别字
- 确保图片链接有效
- 测试代码示例是否正确
- 添加适当的引导语

---

## 回答发布脚本

### 快速开始

**脚本**: `publish-zhihu-answer.js`

**功能**: 自动发布知乎回答

**详细文档**: [README-pub-answer.md](README-pub-answer.md)

**基本用法**:

```bash
# 准备回答文件（JSON 格式）
cat > answer.json << EOF
{
  "questionId": "123456",
  "content": "<h3>回答标题</h3>\n\n<p>回答内容...</p>",
  "publishDelay": 2000
}
EOF

# 发布回答
node scripts/publish/publish-zhihu-answer.js answer.json
```

**回答文件格式**:

```json
{
  "questionId": "问题 ID 或 URL",
  "content": "回答内容（HTML 格式）",
  "publishDelay": 2000
}
```

**详细文档**: 请查看 [README-pub-answer.md](README-pub-answer.md) 了解更多细节和示例。

---

## 进阶用法

### 1. 批量发布

```bash
# 批量发布多篇文章
for file in 📤待发布/🔥高优先级/*.json; do
  node scripts/publish/publish-zhihu-article.js "$file"
  sleep 60  # 每篇文章间隔 1 分钟
done
```

### 2. 定时发布

```bash
# 使用 crontab 设置定时发布
0 9 * * * cd ~/.openclaw/workspace/知乎自动运营 && node 🛠️自动化系统/scripts/publish/publish-zhihu-article.js 📤待发布/🔥高优先级/next-article.json
```

### 3. 集成到工作流

```bash
# 在其他脚本中调用发布功能
const { main } = require('./scripts/publish/publish-zhihu-article.js');

// 发布文章
await main('article.json');
```

---

## 相关资源

- **自动化系统文档**：`🛠️自动化系统/README.md`
- **Cookie 管理**：`🛠️自动化系统/scripts/utils/cookie-manager.js`
- **数据采集**：`🛠️自动化系统/scripts/collect/`
- **知乎平台规则**：`📚方法论/📊策略分析/知乎平台规则.md`

---

**创建时间**：2026-03-28
**版本**：v1.0.0
**状态**：✅ 可用
