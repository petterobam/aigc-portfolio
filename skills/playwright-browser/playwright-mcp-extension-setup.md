# Playwright MCP 扩展安装指南

**更新时间**: 2026-03-21
**目的**: 配置 Playwright MCP Extension 模式，实现浏览器自动化（无需手动授权）

---

## 📋 前置条件

- ✅ 已安装 Chrome 浏览器（版本 >= 144）
- ✅ 已登录番茄小说作者账号（用户名：帅帅它爸）
- ✅ 已更新 `~/.claude.json` 配置（切换到 extension 模式）

---

## 🔧 安装步骤

### 步骤 1: 下载 Playwright MCP 扩展

**方法 1: 从 GitHub 下载（推荐）**

访问 GitHub Releases 页面：
```
https://github.com/microsoft/playwright-mcp/releases
```

下载最新版本的 `.crx` 文件（Chrome 扩展包）

**方法 2: 从 Chrome Web Store 安装**

访问 Chrome Web Store：
```
https://chrome.google.com/webstore
```

搜索 "Playwright MCP"（由 Microsoft 发布）
点击"添加至 Chrome"按钮

---

### 步骤 2: 安装扩展（如果下载 .crx 文件）

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 将下载的 `.crx` 文件拖拽到扩展页面
5. 确认添加扩展

---

### 步骤 3: 配置 Token

1. 点击浏览器工具栏中的扩展图标（拼图图标 🧩）
2. 找到 "Playwright MCP" 扩展
3. 点击扩展图标，打开配置面板
4. 输入 Token：
   ```
   7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs
   ```
5. 点击"保存"或"连接"

---

### 步骤 4: 验证连接

1. 确保扩展图标显示为激活状态（通常是蓝色或绿色 🟢）
2. 点击图标，应该显示"已连接"或类似状态
3. 确保浏览器中已登录番茄小说（用户名：帅帅它爸）

---

## ✅ 验证配置

### 检查 MCP 配置

运行以下命令检查 Playwright MCP 是否正常运行：

```bash
mcporter list playwright
```

应该显示 playwright 服务器的工具列表（22+ 个工具）

### 测试连接

尝试调用一个简单的工具验证连接：

```bash
mcporter call playwright.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
```

如果能成功导航到番茄小说短故事管理页面，说明配置成功！

---

## 🎯 Extension 模式的优势

相比 CDP 模式，Extension 模式有以下优势：

| 特性 | CDP 模式 | Extension 模式 ⭐ |
|------|----------|-------------------|
| 需要手动授权 | ❌ 每次都需要 | ✅ 不需要 |
| 需要配置远程调试端口 | ❌ 需要 | ✅ 不需要 |
| 支持长连接 | ⚠️ 可能断开 | ✅ 稳定 |
| 配置复杂度 | 🟡 中等 | 🟢 简单 |

---

## 🔧 配置文件说明

**配置位置**: `~/.claude.json`

**当前配置**（extension 模式）：

```json
"playwright": {
  "command": "npx",
  "args": [
    "@playwright/mcp@latest",
    "--extension"
  ],
  "env": {
    "PLAYWRIGHT_MCP_EXTENSION_TOKEN": "7U3d_3r_myx-TEchJ49XXKI8O5TjRrMwMP1ma5q4WZs"
  }
}
```

**配置说明**：

- `command`: 使用 npx 执行 Playwright MCP
- `args[0]`: Playwright MCP 包名
- `args[1]`: `--extension` 参数，表示使用扩展模式
- `env.PLAYWRIGHT_MCP_EXTENSION_TOKEN`: 扩展通信鉴权 Token

---

## 🚨 常见问题

### Q: 扩展无法连接？

**A**: 检查以下几点：
1. Token 是否正确（与 `~/.claude.json` 中的一致）
2. 扩展是否已启用（在 `chrome://extensions/` 中检查）
3. Chrome 浏览器是否已重启（安装扩展后可能需要重启）

### Q: 扩展图标显示未激活？

**A**: 尝试以下步骤：
1. 刷新扩展页面（`chrome://extensions/`）
2. 重启 Chrome 浏览器
3. 检查 Token 是否已正确输入

### Q: MCP 工具无法调用？

**A**: 检查以下几点：
1. `~/.claude.json` 配置是否已更新
2. Token 是否正确
3. 扩展是否已启用
4. 运行 `mcporter list playwright` 检查服务器状态

### Q: 提示 Chrome 版本过低？

**A**: 更新 Chrome 浏览器到最新版本（需要 >= 144）

---

## 📞 技术支持

如果遇到问题，可以：

1. 查看 Playwright MCP 官方文档：
   ```
   https://github.com/microsoft/playwright-mcp
   ```

2. 检查扩展日志：
   - 访问 `chrome://extensions/`
   - 找到 Playwright MCP 扩展
   - 点击"检查视图"查看日志

---

## ✨ 下一步

配置完成后，可以：

1. **测试浏览器自动化**：
   ```bash
   mcporter call playwright.navigate_page url="https://fanqienovel.com/main/writer/short-manage"
   ```

2. **开发番茄小说自动发布脚本**：
   - 参考文档：`skills/playwright-browser/standard-workflows.md`
   - 示例代码：`skills/playwright-browser/examples.md`

3. **集成到自动化运营体系**：
   - 定时数据采集
   - 自动发布故事
   - 数据分析和优化

---

**返回**: [SKILL.md](./SKILL.md)
