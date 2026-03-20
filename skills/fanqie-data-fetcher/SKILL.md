---
name: fanqie-data-fetcher
description: 番茄小说数据抓取工具 - 使用 Chrome 用户数据目录方案，自动抓取已发布的短故事列表。无需手动管理 Cookie，使用已有浏览器登录状态。使用方法：node ${skillDir}/../scripts/fetch-story-list-chrome.js
---

# 番茄小说数据抓取

使用 Chrome 用户数据目录方案抓取番茄小说数据。

## 核心特性

- ✅ **最简单**：无需手动管理 Cookie
- ✅ **最可靠**：使用系统 Chrome 的已有登录状态
- ✅ **自动检测**：自动识别登录状态，未登录时等待用户完成

## 使用方法

```bash
# 运行脚本，抓取已发布的短故事列表
node ${skillDir}/../scripts/fetch-story-list-chrome.js
```

## 技术原理

- 使用 Playwright 的 `launchPersistentContext()` 持久化浏览器上下文
- 用户数据目录：`data/chrome-user-data/`
- 使用系统 Chrome：`channel: 'chrome'`
- 关键页面：
  - 短故事管理页面：https://fanqienovel.com/main/writer/short-manage
  - 数据页面：https://fanqienovel.com/main/writer/short-data?tab=1

## 输出文件

运行后会生成以下文件（保存在 `data/` 目录）：

- `story-list-[timestamp].json` - JSON 格式的故事列表
- `story-list-[timestamp].csv` - CSV 格式的故事列表（Excel 可直接打开）
- `short-manage-[timestamp].png` - 页面截图
- `short-manage-[timestamp].html` - 页面 HTML 源码

## 首次使用

首次运行时，浏览器会自动打开番茄小说登录页面，请：

1. 在打开的 Chrome 浏览器中完成登录
2. 登录成功后，脚本会自动继续抓取
3. 下次运行时，会自动使用已保存的登录状态

## 使用场景

- 抓取已发布的短故事列表
- 监控作品发布状态
- 定期备份作品数据
- 数据分析和统计
