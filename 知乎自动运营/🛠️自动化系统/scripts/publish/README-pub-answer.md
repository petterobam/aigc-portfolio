# 知乎回答发布脚本使用指南

> **脚本**: `publish-zhihu-answer.js`
> **功能**: 自动发布知乎回答
> **状态**: ✅ 已创建
> **版本**: v1.0

---

## 📋 功能说明

知乎回答自动发布脚本可以完成以下功能：

1. ✅ 加载知乎 Cookie，自动登录
2. ✅ 导航到指定问题页面
3. ✅ 自动填充回答内容
4. ✅ 自动发布回答
5. ✅ 验证发布成功
6. ✅ 保存发布记录和截图

---

## 🚀 快速开始

### 1. 准备回答文件

创建一个 JSON 格式的回答文件，例如 `answer.json`：

```json
{
  "questionId": "123456",
  "content": "<h3>你的回答标题</h3>\n\n<p>你的回答内容...</p>",
  "publishDelay": 2000
}
```

**参数说明**：

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `questionId` | string | ✅ | 问题 ID 或完整 URL（如 `https://www.zhihu.com/question/123456`） |
| `content` | string | ✅ | 回答内容（HTML 格式，支持 Markdown 渲染） |
| `publishDelay` | number | ❌ | 发布延迟（毫秒），默认 0 |

**问题 ID 格式**：

- 完整 URL：`https://www.zhihu.com/question/123456`
- 仅 ID：`123456`

---

### 2. 运行脚本

```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/publish/publish-zhihu-answer.js answer.json
```

---

## 📝 示例

### 示例 1：发布简单回答

**文件**: `simple-answer.json`

```json
{
  "questionId": "400000000",
  "content": "<h3>简单回答</h3>\n\n<p>这是一个简单的测试回答。</p>"
}
```

**运行**：

```bash
node scripts/publish/publish-zhihu-answer.js simple-answer.json
```

---

### 示例 2：发布 Markdown 格式的回答

**文件**: `markdown-answer.json`

```json
{
  "questionId": "400000000",
  "content": "<h3>Markdown 回答示例</h3>\n\n<h4>代码示例</h4>\n\n<pre><code class=\"language-javascript\">function hello() {\n  console.log('Hello, Zhihu!');\n}\n</code></pre>\n\n<h4>列表</h4>\n\n<ul>\n<li>列表项 1</li>\n<li>列表项 2</li>\n<li>列表项 3</li>\n</ul>\n\n<p>回答结束。</p>"
}
```

---

### 示例 3：使用完整 URL

**文件**: `url-answer.json`

```json
{
  "questionId": "https://www.zhihu.com/question/400000000",
  "content": "<p>使用完整 URL 发布回答。</p>",
  "publishDelay": 3000
}
```

---

## 🔧 配置

### Cookie 配置

脚本会自动加载以下路径的 Cookie 文件：

```
~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json
```

如果 Cookie 不存在或已过期，请先运行 Cookie 提取脚本：

```bash
node scripts/utils/extract-zhihu-cookies.js
```

---

### 浏览器配置

脚本默认使用以下浏览器配置：

- **浏览器**: Chromium
- **显示模式**: 非无头模式（显示浏览器窗口）
- **视口大小**: 1280 × 720
- **用户代理**: Chrome 120 on macOS
- **操作延迟**: 50ms（slowMo）

如需修改，请编辑脚本中的 `main()` 函数：

```javascript
browser = await chromium.launch({
  headless: false,  // 是否无头模式
  slowMo: 50        // 操作延迟（毫秒）
});
```

---

## 📊 输出

### 控制台输出

脚本运行时会输出详细日志：

```
════════════════════════════════════════════════════════════
  知乎回答自动发布脚本
════════════════════════════════════════════════════════════

📄 已加载回答文件: answer.json
   问题 ID: 123456

🌐 启动浏览器...
📍 创建浏览器上下文...
✅ 已加载 45 个知乎 Cookie

📊 检查登录状态...
✅ 已登录

📝 创建回答...
   问题 ID: 123456
📄 导航到问题页面: https://www.zhihu.com/question/123456
   找到回答输入框: [contenteditable="true"]
⌨️  输入回答内容...
   内容长度: 1234 字符
✅ 回答内容填写完成

📸 发布前截图: ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/data/answer-before-1711622400000.png

🚀 发布回答...
   找到发布按钮: button:has-text("发布回答")
⌨️  点击发布按钮...
⏳ 等待发布完成...
✅ 发布成功！
   回答 URL: https://www.zhihu.com/question/123456/answer/789012

🔍 验证发布结果...
   页面标题: 测试问题 - 知乎
✅ 验证通过：已成功跳转到回答详情页
   回答 ID: 789012

📸 发布后截图: ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/data/answer-after-1711622400000.png

════════════════════════════════════════════════════════════
  ✅ 发布完成！
════════════════════════════════════════════════════════════

  问题 ID: 123456
  回答 URL: https://www.zhihu.com/question/123456/answer/789012
  回答 ID: 789012

📄 发布记录: ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/data/answer-record-2026-03-28T23-47-00-000Z.json

🚪 正在关闭浏览器...
✅ 浏览器已关闭
```

---

### 发布记录

每次发布都会生成一个 JSON 格式的发布记录，保存在：

```
~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/data/answer-record-<timestamp>.json
```

**记录格式**：

```json
{
  "timestamp": "2026-03-28T23:47:00.000Z",
  "answerFile": "answer.json",
  "answerData": {
    "questionId": "123456",
    "contentLength": 1234
  },
  "success": true,
  "answerUrl": "https://www.zhihu.com/question/123456/answer/789012",
  "answerId": "789012",
  "screenshots": [
    "/path/to/answer-before-1711622400000.png",
    "/path/to/answer-after-1711622400000.png"
  ],
  "error": null
}
```

---

### 截图

脚本会在发布前后自动截图，保存到：

```
~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/data/
```

截图文件名格式：

- `answer-before-<timestamp>.png`：发布前截图
- `answer-after-<timestamp>.png`：发布后截图
- `answer-error-<timestamp>.png`：错误截图（如果发布失败）

---

## ⚠️ 错误处理

### Cookie 不存在或已过期

**错误信息**：

```
❌ Cookie 文件不存在: ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json
请先运行: node scripts/utils/extract-zhihu-cookies.js
```

**解决方案**：

运行 Cookie 提取脚本：

```bash
node scripts/utils/extract-zhihu-cookies.js
```

---

### 回答文件格式错误

**错误信息**：

```
❌ 回答数据缺少必需字段（questionId、content）
```

**解决方案**：

检查回答文件是否包含 `questionId` 和 `content` 字段。

---

### 找不到回答输入框

**错误信息**：

```
❌ 创建回答失败: 找不到回答输入框，请检查页面结构或手动测试
```

**解决方案**：

1. 确保问题 ID 正确
2. 手动访问问题页面，检查是否有回答输入框
3. 如果问题已关闭或禁止回答，无法发布

---

### 找不到发布按钮

**错误信息**：

```
❌ 发布失败: 找不到发布按钮
```

**解决方案**：

1. 确保回答内容不为空
2. 检查是否有敏感内容被屏蔽
3. 手动测试发布流程

---

## 🔍 调试技巧

### 1. 查看浏览器窗口

脚本默认显示浏览器窗口，便于调试。如果遇到问题，可以：

1. 查看浏览器窗口中的页面状态
2. 检查控制台错误信息
3. 查看网络请求

---

### 2. 查看截图

每次运行都会生成截图，可以：

1. 查看发布前截图，检查内容是否正确填充
2. 查看发布后截图，检查是否成功发布
3. 查看错误截图，诊断问题原因

---

### 3. 查看发布记录

发布记录包含完整的信息，可以：

1. 检查回答 ID 和 URL
2. 追踪发布历史
3. 分析发布数据

---

### 4. 调整操作延迟

如果遇到元素找不到的问题，可以增加操作延迟：

```javascript
const CONFIG = {
  delays: {
    typing: 100,      // 打字延迟（增加）
    action: 1000,     // 操作延迟（增加）
    navigation: 3000  // 导航延迟（增加）
  }
};
```

---

## 📚 相关文档

- **知乎专栏文章发布**: [README-pub-article.md](README-pub-article.md)
- **Cookie 管理**: [知乎 Cookie 配置指南](../docs/extract-zhihu-cookies-guide.md)
- **系统架构**: [系统架构.md](../docs/系统架构.md)

---

## 🎯 下一步

1. ✅ 使用测试回答文件测试发布功能
2. ⚠️ 发布第一篇真实的知乎回答
3. ⚠️ 建立自动化发布流程（定时发布、批量发布）
4. ⚠️ 集成到知乎运营系统

---

**创建时间**: 2026-03-28 23:47
**创建者**: 心跳时刻 - 知乎技术分享与知识付费运营
**版本**: v1.0
**状态**: ✅ 已创建
