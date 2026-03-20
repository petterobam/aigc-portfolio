---
name: missy
description: 短剧下载器 - 解析分享链接、下载短剧视频并上传到百度网盘。使用场景：(1) 解析分享链接创建任务 "missy parse 《剧名》https://..." (2) 同步下载上传 "missy sync #ID" (3) 查看任务状态 "missy status #ID" (4) 百度网盘登录管理 "missy login/logout"。支持断点续传、MD5去重、失败重试、并发控制。
---

# MissY - 短剧下载器

解析分享链接、下载短剧视频、上传百度网盘的完整工具链。

## 前置要求

**必须先登录百度网盘才能下载！**

```bash
# 登录百度网盘（首次使用必需）
python3 ${skillDir}/missy.py login [--user 用户ID]

# 退出登录
python3 ${skillDir}/missy.py logout [--user 用户ID]
```

登录时会生成二维码，需要用 **Markdown 格式** 发送给用户：

```markdown
![百度网盘登录二维码](~/Downloads/Missy/qrcodes/baidu_login_default.png)
```

用户扫码授权后即可开始下载。

## 核心命令

```bash
# 解析分享链接，创建下载任务
python3 ${skillDir}/missy.py parse <分享文本> [-r 远程目录]

# 同步下载并上传（支持断点续传）
python3 ${skillDir}/missy.py sync <#任务ID>

# 查看任务状态
python3 ${skillDir}/missy.py status <#任务ID> [-v]

# 停止正在运行的任务
python3 ${skillDir}/missy.py stop <#任务ID>

# 登录百度网盘
python3 ${skillDir}/missy.py login [--user 用户ID]

# 退出登录
python3 ${skillDir}/missy.py logout [--user 用户ID]
```

## 使用示例

```bash
# 1. 首次使用 - 先登录百度网盘
python3 ${skillDir}/missy.py login

# 2. 解析分享链接，创建任务（返回任务ID如 #7599898343820512281）
python3 ${skillDir}/missy.py parse '《极品家丁》免费看全集 https://novelquickapp.com/s/xxxxx'

# 3. 同步下载并上传
python3 ${skillDir}/missy.py sync #7599898343820512281

# 4. 查看任务进度
python3 ${skillDir}/missy.py status #7599898343820512281 -v

# 5. 停止正在运行的任务
python3 ${skillDir}/missy.py stop #7599898343820512281
```

## 新任务处理流程

当用户发送短剧分享链接时，需按以下流程处理：

### 1. 解析并创建任务
```bash
python3 ${skillDir}/missy.py parse '<分享文本>'
```

### 2. 创建进度检查 Todo
**重要**：启动下载后，必须创建一个定时检查todo，用于监控下载进度并在完成后通知用户。

Todo创建参数：
- **name**: `检查短剧《${剧名}》下载进度`
- **scheduleKind**: `every`
- **everyMs**: `300000` (5分钟检查一次)
- **message**: 检查短剧 `${剧名}` (ID: `${drama_id}`) 的下载状态，如果完成则通知用户
- **deliveryMode**: `announce` (发送通知)
- **deliveryChannel**: 用户来源渠道 (如 `feishu`)
- **deliveryTo**: 用户ID
- **deleteAfterRun**: `true` (完成后自动删除)

示例（飞书用户）：
```javascript
// 假设用户ID存储在 userId，渠道为 feishu
create_job({
  name: `检查短剧《极品家丁》下载进度`,
  scheduleKind: "every",
  everyMs: 300000,
  message: `检查短剧《极品家丁》(ID: #7599898343820512281) 的下载状态，如果完成则通知用户`,
  deliveryMode: "announce",
  deliveryChannel: "feishu",
  deliveryTo: userId,
  deleteAfterRun: true
})
```

### 3. 启动下载
```bash
python3 ${skillDir}/missy.py sync #<drama_id>
```

### 4. 检查逻辑
定时任务执行时：

1. **运行状态检查**：
   ```bash
   python3 ${skillDir}/missy.py status #<drama_id>
   ```
   - 如果输出中包含 `[运行中 PID:xxx]` → 进程正常运行
   - 如果没有运行中标记但进度未完成 → 进程已退出，需重启

2. **判断进度状态**：
   - 寻找 `✅` 标记或 `100%` 进度 → 已完成
   - 进度 `< 100%` 且无运行中标记 → 进程退出但未完成

3. **处理决策**：
   - **已完成**：发送通知消息并删除todo
   - **未完成 + 无运行进程**：重新启动下载，等待下次检查
   - **未完成 + 进程运行中**：等待下次检查

4. **重启命令**：
   ```bash
   # 进程退出时自动重启
   python3 ${skillDir}/missy.py sync #<drama_id>
   ```

5. **通知消息格式**：

   **下载完成通知**：
   ```markdown
   🎉 您的短剧《${剧名}》已全部下载完成！

   📊 共 ${total_episodes} 集，已上传至百度网盘
   📂 路径：/apps/missy-videos/${剧名}/
   ```

   **进程异常重启通知**（可选）：
   ```markdown
   ⚠️ 检测到下载进程异常退出，已自动重启

   📺 剧名：${剧名}
   📝 ID：#${drama_id}
   📊 当前进度：${completed}/${total}
   ```

### 5. 响应模板
解析成功后回复用户：
```
✅ 已创建下载任务

📺 剧名：${剧名}
🔢 集数：${total_episodes} 集
📝 ID：#${drama_id}

⏳ 已开始下载，约5-10分钟完成，完成后会通知您~
```

## 功能特性

### 1. 任务管理
- **parse**: 解析分享链接，创建任务，返回任务ID
- **sync**: 并行下载+上传，支持断点续传
- **status**: 查看任务进度和每集状态
- **stop**: 终止正在运行的任务进程

### 2. 队列架构 (v3)
基于 `asyncio.Queue` 实现生产者-消费者模式：
- **生产者**: 将待处理剧集加入队列，failed 任务优先级更高
- **消费者**: 5个工作线程并行处理队列中的任务
- **失败自动重试**: 失败任务自动重新入队，无需等待下一轮
- **优先级调度**: failed 任务优先于 pending 任务处理

### 3. 防重复与断点续传
- **进程锁**: 同一任务只能有一个进程在运行
- **MD5去重**: 上传前检测百度网盘是否已有相同文件
- **断点下载**: 下载中断后保留 `.tmp` 文件，重新启动时自动续传
- **断点上传**: 上传中断后保留 `uploadid` 和已上传分片记录，只传未完成的分片
- **任务恢复**: `stop` 命令保留进度信息，重新 `sync` 时自动恢复
- **URL缓存**: 解析的视频URL缓存到task.json，避免重复调用API
- **文件去重**: 已下载完成的 `.mp4` 文件不会重复下载，直接进入上传阶段
- **uploadid 过期处理**: 自动检测过期并重新开始上传

### 4. 失败重试
- **最大重试3次**: 下载或上传失败自动重试
- **并发控制**: 最多5个文件同时处理，避免资源耗尽
- **临时文件管理**: 下载中的 `.tmp` 文件保留用于断点续传，上传完成后自动清理
- **失败优先**: 失败的剧集会被优先重新处理

### 5. 百度网盘上传
- **分片上传**: 4MB分片，支持大文件
- **秒传检测**: MD5匹配直接秒传，无需重复上传
- **文件名保持**: 上传文件名与本地一致，不添加时间戳
- **断点上传**: 上传中断后自动恢复，只传未完成的分片

### 6. 时间戳记录
- `created_at`: 任务创建时间
- `started_at`: 任务开始时间
- `download_started_at`: 每集下载开始时间
- `download_completed_at`: 每集下载完成时间
- `upload_started_at`: 每集上传开始时间
- `upload_completed_at`: 每集上传完成时间
- `completed_at`: 任务完成时间
- `retry_count`: 每集重试计数

## 文件结构

```
~/Downloads/Missy/                          # 下载根目录
├── session.json                            # 百度网盘登录会话
├── qrcodes/                                # 登录二维码图片
│   └── baidu_login_<user>.png
└── <剧名>/                                 # 每部剧的独立目录
    ├── task.json                           # 任务配置和进度
    ├── .task.lock                          # 进程锁文件
    ├── 001.mp4.tmp                         # 下载中的临时文件
    ├── 001.mp4                             # 下载完成的视频文件
    └── 002.mp4.tmp                         # 下一集临时文件
```

**文件名格式**: 使用数字格式 `001.mp4`, `010.mp4`, `120.mp4`，便于排序和管理

**注意**: `/Users/jcho/同步空间/短剧` 是百度网盘客户端的同步目录，**不是** Missy 的工作目录。Missy 直接调用百度 API 上传，不经过同步空间。

## 状态说明

运行 `python3 ${skillDir}/missy.py status #ID -v` 可查看详细状态：

| 图标 | 状态 | 说明 |
|------|------|------|
| ✅ | completed | 已完成（已上传百度网盘，本地已删除） |
| ⬇️ | downloading | 下载中（显示进度百分比） |
| ❌ | failed | 下载/上传失败（已达最大重试次数） |
| ⏳ | pending | 等待下载 |
| ⬆️ | uploading | 上传中（显示进度百分比） |
| 📥 | downloaded | 已下载未上传 |
| ⏭️ | skipped | 已跳过（百度网盘已有相同MD5文件） |

**status -v 输出示例**:
```
分集详情:
  ✅ 第1集 - completed (100%)
  ⬇️ 第2集 - downloading (45.3%)
  ⬆️ 第3集 - uploading (67.8%)
  📥 第4集 - downloaded
  ⏳ 第5集 - pending
```

## 配置参数

```python
# 队列配置
MAX_WORKERS = 5                  # 消费者工作线程数
MAX_RETRY_COUNT = 3              # 最大重试次数
MAX_LOCAL_FILES = 5              # 最多保留本地文件数
CHUNK_SIZE = 4 * 1024 * 1024     # 上传分片大小：4MB
QUEUE_CHECK_INTERVAL = 1         # 队列检查间隔（秒）

# 目录配置
DOWNLOAD_DIR = ~/Downloads/Missy
SESSIONS_FILE = ~/Downloads/Missy/session.json

# 百度网盘上传目录
BAIDU_UPLOAD_DIR = /apps/missy-videos/<剧名>/
# 示例: /apps/missy-videos/极品家丁/001.mp4
```

## 版本历史

| 版本 | 说明 |
|------|------|
| v3 (当前) | 队列架构，生产者-消费者模式，失败任务自动重新入队 |
| v1 | 批量处理，存放在 missy.py.v1 |
