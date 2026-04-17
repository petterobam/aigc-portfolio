# OpenClaw 智能创作助手（入门级）

**案例编号**：08-01-01  
**难度等级**：入门级  
**预计时长**：30 分钟  
**适用部门**：全公司通用  
**最后更新**：2026-04-03 19:00

---

## 📋 案例概述

OpenClaw 是一个自托管的 AI 网关，可以将 WhatsApp、Telegram、Discord、iMessage 等聊天应用连接到 AI 编码代理。本案例帮助学员快速掌握 OpenClaw 的基础操作，建立随时可用的 AI 创作助手。

### 学习目标

- ✅ 了解 OpenClaw 的核心概念和架构
- ✅ 完成基础安装和配置
- ✅ 通过聊天应用与 AI 代理交互
- ✅ 掌握基本命令和操作

---

## 🎯 应用场景

### 真实场景

**华策影视编剧部门**：
- **问题**：编剧在创作过程中需要随时查询资料、头脑风暴、优化对白，但传统的 AI 工具需要打开浏览器或应用，不够便捷
- **解决方案**：通过 OpenClaw，编剧可以直接在 WhatsApp/Telegram 中与 AI 代理对话，随时随地获取创作支持
- **效果**：创作效率提升 40%，响应时间从分钟级降到秒级

### 其他适用场景

1. **移动办公**：在外出时通过手机与 AI 代理讨论剧本创意
2. **团队协作**：在群聊中与 AI 代理一起头脑风暴
3. **快速查询**：随时查询制作流程、技术规范等信息
4. **内容生成**：快速生成预告片文案、角色小传等内容

---

## 🛠️ 核心操作步骤

### 步骤 1：安装 OpenClaw（5分钟）

**真实命令**（基于官方文档）：

```bash
# macOS / Linux
curl -fsSL https://openclaw.ai/install.sh | bash

# Windows (PowerShell)
iwr -useb https://openclaw.ai/install.ps1 | iex
```

**验证安装**：
```bash
openclaw --version
```

**预期结果**：
- ✅ 安装脚本成功运行
- ✅ 命令行可以识别 `openclaw` 命令

---

### 步骤 2：运行引导向导（10分钟）

**真实命令**：

```bash
openclaw onboard --install-daemon
```

**向导步骤**：
1. 选择模型提供商（Anthropic、OpenAI、Google 等）
2. 输入 API 密钥
3. 配置 Gateway 端口（默认 18789）
4. 选择安装为系统服务

**预期结果**：
- ✅ Gateway 成功启动
- ✅ 监听端口 18789
- ✅ 配置文件创建在 `~/.openclaw/openclaw.json`

---

### 步骤 3：验证 Gateway 状态（3分钟）

**真实命令**：

```bash
openclaw gateway status
```

**预期输出**：
```
Gateway Status: running
Port: 18789
Config: ~/.openclaw/openclaw.json
```

---

### 步骤 4：打开控制面板（2分钟）

**真实命令**：

```bash
openclaw dashboard
```

**预期结果**：
- ✅ 浏览器自动打开 `http://127.0.0.1:18789/`
- ✅ 可以看到聊天界面

---

### 步骤 5：连接聊天频道（5分钟）

**最快的方式：Telegram**（基于官方文档）

**步骤**：
1. 在 Telegram 中找到 @BotFather
2. 发送 `/newbot` 创建新机器人
3. 按提示设置机器人名称
4. 保存返回的 bot token（格式：`123:abc...`）

**配置文件**（`~/.openclaw/openclaw.json`）：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "你的bot_token",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

**重启 Gateway**：
```bash
openclaw gateway restart
```

**配对新设备**：
```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

---

### 步骤 6：发送第一条消息（5分钟）

**在 Telegram 中**：
1. 找到刚创建的机器人
2. 发送 `/start`
3. 等待配对码
4. 在命令行中批准配对
5. 发送第一条消息："你好，请帮我头脑风暴一个科幻网剧的创意"

**预期结果**：
- ✅ 收到 AI 代理的回复
- ✅ 可以进行多轮对话
- ✅ 对话历史自动保存

---

## 💡 关键要点

### OpenClaw 核心概念

1. **Gateway（网关）**：连接聊天应用和 AI 代理的桥梁
2. **Channel（频道）**：支持的聊天平台（WhatsApp、Telegram、Discord 等）
3. **Agent（代理）**：AI 大脑，处理消息和工具调用
4. **Session（会话）**：每个对话的上下文和历史

### 配置文件结构

```json5
// ~/.openclaw/openclaw.json
{
  agent: {
    workspace: "~/.openclaw/workspace",
  },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: { botToken: "..." },
  },
}
```

### 重要路径

- **配置文件**：`~/.openclaw/openclaw.json`
- **工作空间**：`~/.openclaw/workspace`
- **状态目录**：`~/.openclaw`
- **会话存储**：`~/.openclaw/agents/main/sessions`

---

## 🔧 常见问题

### 问题 1：Gateway 无法启动

**检查步骤**：
```bash
# 检查端口是否被占用
lsof -i :18789

# 检查配置文件是否存在
cat ~/.openclaw/openclaw.json

# 查看日志
openclaw gateway logs
```

**解决方案**：
- 确保端口 18789 未被占用
- 检查配置文件格式是否正确
- 重新运行 `openclaw onboard`

---

### 问题 2：Telegram 机器人无响应

**检查步骤**：
```bash
# 检查 bot token 是否正确
openclaw channels status --probe

# 查看配对状态
openclaw pairing list telegram
```

**解决方案**：
- 确认 bot token 格式正确（`数字:字母数字混合`）
- 重新配对设备
- 检查是否需要先发送 `/start`

---

### 问题 3：AI 响应缓慢

**优化方法**：

```json5
// 在配置文件中添加
{
  agent: {
    model: { primary: "anthropic/claude-sonnet-4-6" },
  },
}
```

**推荐模型**：
- **最快**：Claude Haiku、GPT-4o-mini
- **平衡**：Claude Sonnet、GPT-4o
- **最强**：Claude Opus、GPT-4

---

## 📊 效果评估

### 成功标准

- ✅ Gateway 成功启动并监听 18789 端口
- ✅ 可以通过浏览器访问控制面板
- ✅ 至少连接一个聊天频道（推荐 Telegram）
- ✅ 能够发送消息并收到 AI 回复
- ✅ 理解基本的配置文件结构

### 效率提升

- **响应速度**：从打开应用（30秒）→ 发送消息（3秒）
- **可用性**：从桌面（8小时/天）→ 移动（24小时/天）
- **协作效率**：从单人（1x）→ 团队（3x）

---

## 🚀 进阶学习

### 下一步案例

1. **OpenClaw 高级技巧与最佳实践**（进阶级，60分钟）
2. **多频道管理与路由**（专业级，45分钟）
3. **自定义 Agent 工作流**（专业级，90分钟）

### 相关资源

- **官方文档**：https://docs.openclaw.ai
- **快速开始**：https://docs.openclaw.ai/start/getting-started
- **Telegram 配置**：https://docs.openclaw.ai/channels/telegram
- **配置示例**：https://docs.openclaw.ai/gateway/configuration-examples

---

## 📝 学习笔记

### 关键命令速查

```bash
# 安装
curl -fsSL https://openclaw.ai/install.sh | bash

# 引导
openclaw onboard --install-daemon

# 状态检查
openclaw gateway status

# 打开面板
openclaw dashboard

# 重启
openclaw gateway restart

# 配对管理
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

### 最佳实践

1. **始终使用最新版本**：`openclaw@latest`
2. **定期备份配置**：`cp ~/.openclaw/openclaw.json ~/.openclaw/openclaw.json.backup`
3. **监控日志**：`openclaw gateway logs --tail`
4. **使用强模型**：优先选择 Claude Sonnet 或 GPT-4o

---

**案例完成标志**：
- [ ] 成功安装 OpenClaw
- [ ] Gateway 正常运行
- [ ] 连接至少一个聊天频道
- [ ] 完成首次对话
- [ ] 理解基本配置结构

**下一步行动**：
继续学习 **OpenClaw 高级技巧与最佳实践**，案例编号 08-01-02

---

**维护人**：AIGC 布道师  
**文档版本**：v1.0  
**基于**：OpenClaw 官方文档（https://docs.openclaw.ai）
