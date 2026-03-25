# Chrome CDP 调试模式启动说明

Chrome DevTools Protocol（CDP）调试端口是方式 B 自动 Cookie 刷新的前提条件。
开启后，`extract-cookies-from-browser.js` 可以直接 attach 到已登录的 Chrome，
无需任何人工操作即可提取完整 Session Cookie。

---

## 前提条件

- 必须**完全退出** Chrome 后再以调试模式启动（Chrome 不允许同时运行两个进程）
- 调试端口默认使用 `9222`，如有冲突可改为其他端口（同步修改脚本中的端口号）

---

## macOS 启动命令

### 标准启动（使用默认 Profile）

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  --profile-directory=Default
```

### 指定 Profile 启动（多 Profile 场景）

```bash
# 查看所有 Profile 目录名
ls ~/Library/Application\ Support/Google/Chrome/ | grep ^Profile

# 指定 Profile 启动（将 "Profile 1" 替换为实际目录名）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --profile-directory="Profile 1"
```

### 后台静默启动（不打开新窗口）

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --no-first-run \
  --no-default-browser-check \
  --profile-directory=Default \
  --headless=new \
  about:blank &
```

> ⚠️ headless 模式下无法手动操作浏览器，仅适合 Cookie 已存在、无需重新登录的场景。

---

## 验证连接是否成功

Chrome 启动后，运行以下命令验证 CDP 端口是否可达：

```bash
# 查看 Chrome 版本信息（成功则返回 JSON）
curl -s http://localhost:9222/json/version

# 查看当前打开的页面列表
curl -s http://localhost:9222/json/list
```

成功返回示例：

```json
{
  "Browser": "Chrome/123.0.6312.86",
  "Protocol-Version": "1.3",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

失败（端口不可达）则无任何输出或返回连接拒绝错误。

---

## 运行 Cookie 提取脚本

CDP 验证通过后，运行提取脚本：

```bash
cd /Users/oyjie/.openclaw/workspace
node scripts/extract-cookies-from-browser.js
```

脚本会自动：
1. 连接 `localhost:9222`
2. 获取第一个浏览器上下文（用户主 Profile 的已登录会话）
3. 过滤番茄小说相关 Cookie（约 26 个，含 16 个 httpOnly）
4. 保存到 `cookies/latest.json`

---

## 设置为开机自启（macOS LaunchAgent）

如果希望 Chrome 始终以调试模式运行，可以注册为 LaunchAgent：

**创建 plist 文件**：`~/Library/LaunchAgents/com.chrome.debug.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.chrome.debug</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Applications/Google Chrome.app/Contents/MacOS/Google Chrome</string>
    <string>--remote-debugging-port=9222</string>
    <string>--no-first-run</string>
    <string>--no-default-browser-check</string>
    <string>--profile-directory=Default</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
</dict>
</plist>
```

**加载 LaunchAgent**：

```bash
launchctl load ~/Library/LaunchAgents/com.chrome.debug.plist
```

**停用**：

```bash
launchctl unload ~/Library/LaunchAgents/com.chrome.debug.plist
```

> ⚠️ 注意：LaunchAgent 方案会在登录时自动启动 Chrome。如果你不希望 Chrome 一直在后台运行，建议手动启动即可。

---

## 常见问题

### 问题：curl 无输出，连接被拒绝

**原因**：Chrome 未完全退出，或启动命令未正确执行。

**排查**：
```bash
# 检查是否有 Chrome 进程在监听 9222
lsof -i :9222
```

如果没有输出，说明 Chrome 未以调试模式运行。检查：
1. 是否用 Cmd+Q 完全退出了 Chrome（不是点 × 关闭窗口）
2. 启动命令路径是否正确（`/Applications/Google\ Chrome.app/...`）

---

### 问题：`open -a "Google Chrome"` 无法添加调试参数

`open` 命令不支持传递参数给 Chrome。必须直接调用二进制文件：
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

---

### 问题：连接成功但 Cookie 提取为空

**原因**：Chrome 以调试模式启动时创建了新的临时 Profile，而不是你已登录的 Profile。

**解决**：确保 `--profile-directory=Default` 指向的是你平时使用的 Profile 目录。
可以通过在 Chrome 地址栏输入 `chrome://version/` 查看当前使用的 Profile 路径。

---

### 问题：9222 端口被其他程序占用

```bash
# 查看占用 9222 端口的进程
lsof -i :9222

# 使用其他端口启动（例如 9223）
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223 ...

# 同步修改脚本调用
node scripts/extract-cookies-from-browser.js --port 9223
```

---

## 安全注意事项

- CDP 调试端口**仅监听本地 localhost**，外部网络无法直接访问
- 不要在公共 Wi-Fi 环境下长期开放调试端口
- 不要将 CDP 端口转发到外网（如 `ngrok` 等工具）

---

**相关文件**：
- `scripts/extract-cookies-from-browser.js` — Cookie 提取脚本（`--port` 参数支持自定义端口）
- `extract-session/SKILL.md` — Session 提取子技能说明
- `state/current-state.md` — CDP 端口当前状态记录