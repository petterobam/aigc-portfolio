# 知乎 Cookie 提取指南

> **目标**：快速提取知乎 Cookie，为自动化发布流程做准备
> **难度**：⭐⭐（简单）
> **时间**：2-5 分钟

---

## 🎯 为什么需要 Cookie？

知乎自动化发布系统需要 Cookie 来：
- ✅ 绕过知乎的登录验证
- ✅ 自动发布文章和回答
- ✅ 分析知乎内容数据
- ✅ 运营知乎账号（评论、点赞等）

**Cookie 有效期**：约 7-30 天（取决于知乎的登录策略）

---

## 📋 提取方法（3 种）

### 方法 1：Chrome 开发者工具提取（推荐）

**适用场景**：Chrome 浏览器已登录知乎，最简单直接

**步骤**：

1. **打开知乎**
   - 在 Chrome 浏览器中打开知乎：https://www.zhihu.com
   - 确保已登录（右上角有头像）

2. **打开开发者工具**
   - 按 `F12` 或 `Cmd+Option+I`（Mac）/ `Ctrl+Shift+I`（Windows）
   - 点击 `Application` 标签（或 `应用程序`）

3. **导航到 Cookies**
   - 在左侧面板找到 `Storage` → `Cookies` → `https://www.zhihu.com`

4. **复制所有 Cookie**
   - 在 Cookies 面板中，右键点击任意 Cookie
   - 选择 `Copy all cookies as JSON`
   - 复制内容

5. **保存到文件**
   - 创建文件：`~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json`
   - 粘贴复制的内容
   - 保存文件

6. **验证 Cookie**
   ```bash
   node scripts/verify-zhihu-cookies.js
   ```

**预期输出**：
```
✅ Cookie 文件有效
   Cookie 数量: XX
   Cookie 文件: /Users/.../zhihu-cookies-latest.json
```

---

### 方法 2：CDP 协议提取（自动化）

**适用场景**：Chrome 浏览器以调试端口启动

**步骤**：

1. **启动 Chrome（调试端口）**
   ```bash
   /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
     --remote-debugging-port=9222 --no-first-run --no-default-browser-check
   ```

2. **运行提取脚本**
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/extract-zhihu-cookies-playwright.js
   ```

3. **验证 Cookie**
   ```bash
   node scripts/verify-zhihu-cookies.js
   ```

**优点**：
- ✅ 完全自动化
- ✅ 无需手动操作
- ✅ 可集成到自动化流程

**缺点**：
- ❌ 需要重启 Chrome 浏览器
- ❌ 需要指定调试端口

---

### 方法 3：浏览器扩展提取（简单）

**适用场景**：不想使用开发者工具

**步骤**：

1. **安装扩展**
   - 推荐扩展：EditThisCookie 或 Cookie-Editor
   - Chrome 应用商店搜索并安装

2. **打开知乎**
   - 在 Chrome 浏览器中打开知乎：https://www.zhihu.com
   - 确保已登录

3. **导出 Cookie**
   - 点击扩展图标
   - 点击 `Export` / `导出`
   - 选择 JSON 格式
   - 保存文件

4. **复制到目标位置**
   ```bash
   # 复制导出的文件到目标位置
   cp ~/Downloads/cookies.json ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json
   ```

5. **验证 Cookie**
   ```bash
   node scripts/verify-zhihu-cookies.js
   ```

---

## 🔍 Cookie 文件格式

**位置**：`~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json`

**格式**：
```json
[
  {
    "name": "d_c0",
    "value": "xxx",
    "domain": ".zhihu.com",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  },
  {
    "name": "z_c0",
    "value": "xxx",
    "domain": ".zhihu.com",
    "path": "/",
    "expires": 1234567890,
    "httpOnly": true,
    "secure": true,
    "sameSite": "Lax"
  }
]
```

**关键 Cookie**：
- `d_c0`：设备标识 Cookie（必需）
- `z_c0`：登录状态 Cookie（必需）

---

## ✅ 验证 Cookie 有效性

**方法 1：使用验证脚本**
```bash
cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
node scripts/verify-zhihu-cookies.js
```

**方法 2：检查文件内容**
```bash
cat ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json | grep -E "\"(name|d_c0|z_c0)\""
```

**预期结果**：
- ✅ 显示 `d_c0` 和 `z_c0` 的值
- ✅ Cookie 数量 > 0
- ✅ 值不为空

---

## 🚀 下一步

提取 Cookie 成功后，可以：

1. **发布文章**
   ```bash
   cd ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统
   node scripts/publish/publish-zhihu-article.js 📤待发布/🔥高优先级/Evidence-Distillation-热榜回答-20260329.json
   ```

2. **验证发布**
   - 访问文章 URL
   - 检查格式和内容
   - 确认标签和关联

3. **监控数据**
   - 使用数据分析脚本
   - 查看赞同、收藏、关注数据

---

## ❓ 常见问题

### 1. Cookie 提取失败？

**可能原因**：
- 未登录知乎
- Cookie 已过期
- 浏览器隐私设置阻止 Cookie 访问

**解决方法**：
- 重新登录知乎
- 尝试其他提取方法
- 检查浏览器隐私设置

### 2. Cookie 无效？

**验证步骤**：
```bash
node scripts/verify-zhihu-cookies.js
```

**解决方法**：
- 重新提取 Cookie
- 检查 Cookie 文件格式是否正确
- 检查是否包含关键 Cookie（d_c0, z_c0）

### 3. Cookie 过期了？

**重新提取 Cookie**：
- 使用上述 3 种方法之一重新提取
- 建议每周检查一次 Cookie 有效性

### 4. 脚本报错 "Cookie 文件不存在"？

**检查文件位置**：
```bash
ls -la ~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/auth/zhihu-cookies-latest.json
```

**解决方法**：
- 确保文件存在
- 检查文件路径是否正确
- 重新提取 Cookie

---

## 📊 Cookie 管理最佳实践

### 定期更新
- **频率**：每周检查一次 Cookie 有效性
- **方法**：运行验证脚本 `node scripts/verify-zhihu-cookies.js`
- **自动提醒**：可以设置 cron 定时任务提醒

### 安全保护
- **不要提交到 Git**：Cookie 包含敏感信息
- **不要分享给他人**：Cookie 代表你的知乎账号
- **定期更换**：如果怀疑泄露，立即重新提取

### 自动化建议
- **定期备份**：备份多个 Cookie 文件
- **自动切换**：脚本自动尝试多个 Cookie 文件
- **失效提醒**：Cookie 失效时发送通知

---

## 🎯 快速命令参考

```bash
# 验证 Cookie
node scripts/verify-zhihu-cookies.js

# 发布文章
node scripts/publish/publish-zhihu-article.js <article-file>

# 查看待发布文章
ls -la 📤待发布/🔥高优先级/

# 自动提取 Cookie（需要 Chrome 以调试端口启动）
node scripts/extract-zhihu-cookies-playwright.js

# 手动登录并提取 Cookie
node scripts/zhihu-login-persistent.js

# 智能提取 Cookie（推荐）
node scripts/zhihu-cookie-auto-extractor.js
```

---

## 📚 相关文档

- **知乎 Cookie 管理指南**：`~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/data/auth/README.md`
- **知乎自动化系统文档**：`~/.openclaw/workspace/知乎自动运营/🛠️自动化系统/README.md`
- **知乎运营 Skill**：`~/.openclaw/workspace/skills/public/zhihu-operations/SKILL.md`

---

**创建时间**：2026-03-29
**维护者**：知乎技术分享与知识付费运营 AI
**版本**：v1.0
