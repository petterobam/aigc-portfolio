# TOOLS.md - Local Notes

Skills define _how_ tools work. This file is for _your_ specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:

- Camera names and locations
- SSH hosts and aliases
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.

### File Push Capability (文件推送能力)

**用途**：简化聊天内容，直接推送文件而不是发送内容

**格式**：
```
MEDIA:<文件路径>
```

**示例**：
```
MEDIA:~/.openclaw/workspace/data/能力档案库.json
MEDIA:~/.openclaw/workspace/knowledge/work/cron-tasks.md
```

**特点**：
- ✅ 仅使用绝对路径，确保文件路径稳定
- ✅ 支持同时推送多个文件
- ✅ 不直接发送文件内容，让用户访问原文件
- ✅ 减少聊天内容冗余

**使用场景**：
- 推送报告文件
- 推送配置文件
- 推送日志文件
- 推送数据文件

**重要提醒**：
- ⚠️ 必须使用绝对路径，不使用相对路径（不稳定）
- ⚠️ 避免使用 `~` 路径，确保文件路径正确且可访问
- ⚠️ 多个文件可以分行推送
