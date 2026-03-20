# 日志推送规则

> 核心原则：**直接推送文件，不通过 AI 读取内容再转发。**

---

## 为什么必须用 file_path

| 方式 | 问题 |
|------|------|
| 读取内容 → 发送消息 | 日志内容占用 session 上下文，可能导致溢出 |
| 读取内容 → 发送消息 | 长文本在飞书消息中丢失格式 |
| **直接上传文件** ✅ | 不占上下文、格式完整、用户可下载编辑 |

---

## 标准推送流程

### 步骤一：保存日志文件

日志文件必须先写入磁盘，路径格式：

```
/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/YYYY-MM-DD.md
```

示例：
```
/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/2026-03-17.md
```

### 步骤二：上传文件到飞书

```python
message(
    action="send",
    channel="feishu",
    file_path="/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/2026-03-17.md"
)
```

### 步骤三：发送确认消息

```python
message(
    action="send",
    channel="feishu",
    message="📚 今天的学习日志已推送！第17天：RL 基础概念"
)
```

> **注意：** 步骤二和步骤三缺一不可，必须都执行。

---

## 完整执行检查清单

每次学习推进完成后，按顺序确认：

- [ ] 学习内容已生成（3-5 个核心知识点）
- [ ] `progress.json` 已更新（currentDay、lastStudyDate、streak）
- [ ] 日志文件已保存到 `daily-logs/YYYY-MM-DD.md`
- [ ] **文件已通过 `file_path` 参数上传推送**（不可省略）
- [ ] 确认消息已发送

---

## 批量推送流程

推送多天日志时，逐文件循环推送：

```python
for date in date_range:
    log_path = f"/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/{date}.md"
    message(
        action="send",
        channel="feishu",
        file_path=log_path
    )

# 全部推送完成后发一条汇总确认
message(
    action="send",
    channel="feishu",
    message=f"📦 已推送 {count} 天的学习日志（第{start}天 ~ 第{end}天）"
)
```

---

## 禁止操作

### ❌ 禁止：读取文件内容后发送

```python
# 错误！不要这样做
content = read_file("daily-logs/2026-03-17.md")
message(action="send", channel="feishu", message=content)
```

**原因：** 日志文件通常超过 2000 字，读入上下文后会占用大量 token，
多次操作后 session 会因上下文过长而降速或截断。

---

### ❌ 禁止：只保存不推送

```python
# 错误！保存后忘记推送
save_log(content)
message(action="send", channel="feishu", message="日志已保存，请自行查看")
```

**原因：** 用户无法在飞书收到文件，失去了自动推送的意义。

---

### ❌ 禁止：用消息内容替代文件推送

```python
# 错误！把日志内容粘贴进消息体
message(
    action="send",
    channel="feishu",
    message="# 第17天：RL 基础概念\n\n## 核心知识点\n..."  # 直接把内容贴进来
)
```

**原因：** 飞书长消息格式丢失，且仍然占用 session 上下文。

---

## 图片处理规则

日志中涉及图片时：

```markdown
<!-- 正确：只写路径，不读取内容 -->
![LLM生成与解码过程](images_chinese/source_svg/【LLM基础】LLM生成与解码过程.svg)
```

- ✅ 日志文件中只保留图片的**相对路径引用**
- ❌ 不要用 `read_file` 读取 SVG/PNG 文件内容到上下文
- ❌ 不要将图片 base64 编码后嵌入日志

用户在本地打开日志文件时可直接查看图片。

---

## 文件命名规范

| 字段 | 规范 |
|------|------|
| 目录 | `skills/llm-learning/daily-logs/` |
| 文件名 | `YYYY-MM-DD.md`（以推送日期命名） |
| 绝对路径前缀 | `/Users/oyjie/.openclaw/workspace/` |

示例：
```
/Users/oyjie/.openclaw/workspace/skills/llm-learning/daily-logs/2026-03-17.md
```
