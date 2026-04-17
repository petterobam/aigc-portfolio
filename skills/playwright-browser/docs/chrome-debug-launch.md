# Chrome CDP 调试端口配置指南

## 概述

Chrome DevTools Protocol (CDP) 调试端口允许外部工具（如 Playwright）与正在运行的 Chrome 实例通信。启用后，可以自动提取 Cookie、调试页面、分析网络请求等。

**关键价值**：启用方式 B 自动刷新，heartbeat job 可自动提取最新 Cookie，无需人工介入。

---

## macOS 配置

### 方法 1：命令行启动（推荐用于测试）

```bash
# 1. 完全退出 Chrome（Cmd+Q）

# 2. 以调试模式启动
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome_CDP"
```

**参数说明**：
- `--remote-debugging-port=9222`：启用 CDP 端口，默认 9222
- `--user-data-dir=...`：使用独立的用户数据目录，避免与普通 Chrome 冲突
  - 默认：`~/Library/Application Support/Google/Chrome`
  - 调试模式：`~/Library/Application Support/Google/Chrome_CDP`

**验证连通性**：
```bash
curl -s http://localhost:9222/json/version | jq .
```

预期输出：
```json
{
  "Browser": "Chrome/123.0.6312.58",
  "Protocol-Version": "1.3",
  "User-Agent": "Mozilla/5.0 ...",
  "WebKit-Version": "537.36 (...)",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

### 方法 2：修改启动配置（推荐用于长期使用）

#### 步骤 1：修改 Chrome.app 的 Info.plist

```bash
# 备份原始文件
sudo cp /Applications/Google\ Chrome.app/Contents/Info.plist \
       /Applications/Google\ Chrome.app/Contents/Info.plist.backup

# 编辑 Info.plist
sudo nano /Applications/Google\ Chrome.app/Contents/Info.plist
```

找到 `<key>LSUIElement</key>`，在其上方添加：
```xml
<key>ChromeArguments</key>
<array>
  <string>--remote-debugging-port=9222</string>
  <string>--user-data-dir=$HOME/Library/Application Support/Google/Chrome_CDP</string>
</array>
```

**注意**：macOS 可能会覆盖这个修改，推荐使用方法 3。

#### 步骤 2：重启 Chrome

```bash
# 完全退出 Chrome
killall "Google Chrome"

# 启动 Chrome
open -a "Google Chrome"
```

### 方法 3：使用 LaunchAgent（推荐用于自动化）

#### 创建 LaunchAgent plist 文件

```bash
# 创建 LaunchAgent 目录
mkdir -p ~/Library/LaunchAgents

# 创建 plist 文件
cat > ~/Library/LaunchAgents/com.google.chrome.cdp.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.google.chrome.cdp</string>
  <key>ProgramArguments</key>
  <array>
    <string>/Applications/Google Chrome.app/Contents/MacOS/Google Chrome</string>
    <string>--remote-debugging-port=9222</string>
    <string>--user-data-dir=$HOME/Library/Application Support/Google/Chrome_CDP</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
EOF
```

#### 加载 LaunchAgent

```bash
# 加载 LaunchAgent
launchctl load ~/Library/LaunchAgents/com.google.chrome.cdp.plist

# 验证是否加载成功
launchctl list | grep chrome
```

#### 卸载 LaunchAgent

```bash
# 停止 Chrome
killall "Google Chrome"

# 卸载 LaunchAgent
launchctl unload ~/Library/LaunchAgents/com.google.chrome.cdp.plist

# 删除 plist 文件
rm ~/Library/LaunchAgents/com.google.chrome.cdp.plist
```

---

## Linux 配置

### 命令行启动

```bash
# 1. 完全退出 Chrome
pkill chrome

# 2. 以调试模式启动
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=$HOME/.config/google-chrome_cdp
```

### systemd 服务（推荐用于服务器）

#### 创建服务文件

```bash
sudo cat > /etc/systemd/system/chrome-cdp.service << 'EOF'
[Unit]
Description=Chrome CDP Service
After=network.target

[Service]
ExecStart=/usr/bin/google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/var/lib/chrome-cdp
Restart=on-failure
User=$USER

[Install]
WantedBy=multi-user.target
EOF
```

#### 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start chrome-cdp

# 开机自启
sudo systemctl enable chrome-cdp

# 查看状态
sudo systemctl status chrome-cdp
```

---

## Windows 配置

### 命令行启动

```cmd
REM 1. 完全退出 Chrome
taskkill /F /IM chrome.exe

REM 2. 以调试模式启动
"C:\Program Files\Google\Chrome\Application\chrome.exe" ^
  --remote-debugging-port=9222 ^
  --user-data-dir="%LOCALAPPDATA%\Google\Chrome_CDP"
```

### 创建快捷方式

1. 右键桌面 → 新建快捷方式
2. 目标位置：
   ```
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome_CDP"
   ```
3. 名称：Chrome CDP
4. 完成

### 注册表启动项（不推荐，容易被杀毒软件拦截）

```reg
Windows Registry Editor Version 5.00

[HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run]
"Chrome CDP"="\"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe\" --remote-debugging-port=9222 --user-data-dir=\"%LOCALAPPDATA%\\Google\\Chrome_CDP\""
```

---

## 验证步骤

### 1. 验证端口是否开放

```bash
# macOS/Linux
curl -s http://localhost:9222/json/version | jq .

# Windows PowerShell
Invoke-WebRequest -Uri http://localhost:9222/json/version | ConvertFrom-Json | Format-List
```

预期输出：
```json
{
  "Browser": "Chrome/...",
  "Protocol-Version": "1.3",
  "User-Agent": "...",
  "WebKit-Version": "...",
  "webSocketDebuggerUrl": "ws://localhost:9222/devtools/browser/..."
}
```

### 2. 验证 Playwright 能否连接

```bash
cd ~/.openclaw/workspace
node scripts/extract-cookies-from-browser.js
```

预期输出：
```
🔍 连接到 Chrome CDP (http://localhost:9222)...
✅ 连接成功
📊 找到 26 个 Cookie
📍 Cookie 已保存到 cookies/latest.json
```

### 3. 更新系统状态

编辑 `state/current-state.md`：

```markdown
| CDP 端口（9222） | ✅ 可达 | Chrome 已以 --remote-debugging-port=9222 启动 |
| 方式 B 自动刷新 | ✅ 可用 | heartbeat job 可自动提取 Cookie |
```

---

## 故障排查

### 问题 1：端口已被占用

```bash
# 查找占用端口的进程
lsof -i :9222

# 杀死占用进程
kill -9 <PID>
```

### 问题 2：连接超时

**原因**：Chrome 未以调试模式启动

**解决方案**：
```bash
# 完全退出 Chrome
killall "Google Chrome"

# 以调试模式启动
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome_CDP"
```

### 问题 3：Cookie 提取失败

**原因**：
- Chrome 中未登录番茄小说
- Chrome 使用了独立的用户数据目录，需要重新登录

**解决方案**：
1. 启动调试模式的 Chrome
2. 访问 https://fanqienovel.com
3. 登录账号
4. 重新运行提取脚本

### 问题 4：LaunchAgent 无法加载

**原因**：plist 文件格式错误或路径不正确

**解决方案**：
```bash
# 验证 plist 格式
plutil -lint ~/Library/LaunchAgents/com.google.chrome.cdp.plist

# 查看日志
log show --predicate 'process == "launchd"' --info --last 1h | grep chrome
```

---

## 安全注意事项

### 1. 不要暴露 CDP 端口到公网

**错误配置**：
```bash
# ❌ 绑定到所有网络接口（不安全）
--remote-debugging-address=0.0.0.0 --remote-debugging-port=9222
```

**正确配置**：
```bash
# ✅ 默认只绑定到 localhost（安全）
--remote-debugging-port=9222
```

### 2. 不要共享用户数据目录

用户数据目录包含：
- 登录状态（Cookie、Token）
- 浏览历史
- 保存的密码

**建议**：
- 使用独立的用户数据目录（`Chrome_CDP`）
- 不要共享或上传这个目录到云端
- 定期清理敏感数据

### 3. 使用防火墙规则限制访问

如果需要在局域网访问 CDP 端口：

```bash
# macOS pf.conf 示例
block in proto tcp from any to any port 9222
pass in proto tcp from 192.168.1.0/24 to any port 9222
```

---

## 高级配置

### 自定义端口

```bash
--remote-debugging-port=9333
```

### 多个 Chrome 实例

```bash
# 实例 1
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome_CDP_1"

# 实例 2
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9223 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome_CDP_2"
```

### 禁用图形界面（Headless 模式）

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$HOME/Library/Application Support/Google/Chrome_CDP" \
  --headless
```

---

## 关联任务

- **P1 任务 #1**：配置 Chrome CDP 调试端口（本文档的完整实现）
- **已知问题 #001**：CDP 端口不可达（完成本文档后即可解决）
- **方式 B 自动刷新**：启用 CDP 后，heartbeat job 可自动提取 Cookie

---

**维护者**：心跳时刻 - 浏览器自动化守护者
**创建时间**：2026-03-27 19:06 (Asia/Shanghai)
**最后更新**：2026-03-27 19:06 (Asia/Shanghai)
