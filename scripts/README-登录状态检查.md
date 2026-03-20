# 番茄小说登录状态检查说明

## 当前状态（2026-03-21 00:13）

**检查结果**：❌ 未登录
**页面重定向**：https://fanqienovel.com/main/writer/short-manage → https://fanqienovel.com/main/writer/login

## 问题分析

Playwright 创建的独立用户数据目录（`data/chrome-user-data/`）中没有保存登录状态。

**原因**：
- Playwright 使用独立的用户数据目录
- 用户实际使用的 Chrome 浏览器使用不同的用户数据目录
- 两者是隔离的，登录状态不共享

## 解决方案

### 方案1：使用用户实际 Chrome 的用户数据目录（推荐）⭐

找到用户实际 Chrome 的用户数据目录，并让 Playwright 使用它。

**macOS Chrome 用户数据目录位置**：
```bash
~/Library/Application Support/Google/Chrome/
```

**修改脚本**：
```javascript
const CONFIG = {
  userDataDir: path.join(os.homedir(), 'Library/Application Support/Google/Chrome/Default'),
  // ...
};
```

**注意**：
- 需要先关闭所有 Chrome 窗口（避免冲突）
- 或者使用 `--user-data-dir` 参数启动独立的 Chrome 实例

### 方案2：在 Playwright 浏览器中手动登录

1. 运行脚本，浏览器会自动打开
2. 手动登录番茄小说作者账号
3. 登录成功后，关闭浏览器
4. 再次运行脚本，会自动使用保存的登录状态

**操作步骤**：
```bash
# 1. 运行检查脚本（浏览器会打开）
cd ~/.openclaw/workspace
node scripts/check-fanqie-login-direct.js

# 2. 在打开的浏览器中登录番茄小说
# 访问：https://fanqienovel.com/main/writer/login
# 输入手机号和验证码，完成登录

# 3. 关闭浏览器

# 4. 再次运行检查脚本
cd ~/.openclaw/workspace
node scripts/check-fanqie-login-direct.js
```

**优点**：
- 简单直接
- 不需要修改脚本
- 登录状态保存在独立的用户数据目录中

**缺点**：
- 需要手动登录一次
- 每次登录过期时需要重新登录

### 方案3：使用 mcporter + Chrome 扩展（高级）

按照 `skills/playwright-browser/SKILL.md` 的说明配置 Chrome 扩展。

**步骤**：
1. 安装 Playwright MCP 扩展
2. 启用 Chrome 远程调试
3. 使用 `mcporter call playwright.browser_run_code` 执行操作

**优点**：
- 复用用户已登录的浏览器
- 无需额外配置

**缺点**：
- 配置较复杂
- 需要启用 Chrome 远程调试

## 当前推荐方案

**使用方案2：在 Playwright 浏览器中手动登录**

这是最简单直接的方案，适合当前情况。

## 验证登录状态

登录成功后，运行以下命令验证：

```bash
cd ~/.openclaw/workspace
node scripts/check-fanqie-login-direct.js
```

**期望输出**：
```
✅ 已登录
👤 用户名: 帅帅它爸
📝 发布权限: ✅ 有
📊 管理权限: ✅ 有

✅ 可以使用浏览器自动化发布！
```

## 相关文件

- `scripts/check-fanqie-login-direct.js` - 登录状态检查脚本（推荐）⭐
- `scripts/check-fanqie-login.js` - mcporter 版本（需要配置）
- `skills/playwright-browser/SKILL.md` - Playwright MCP 使用指南

## 记忆更新

已更新 `MEMORY.md`：
- 添加"浏览器自动化登录"部分
- 记录登录状态检查方法
- 记录验证脚本位置

---

**更新时间**：2026-03-21 00:13
**状态**：⚠️ 等待用户登录
