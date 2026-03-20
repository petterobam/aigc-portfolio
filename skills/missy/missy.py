#!/usr/bin/env python3
"""
MissY - 短剧下载器 (队列版本 v3)
功能：搜索短剧、解析任务、同步下载上传、管理百度网盘
基于 asyncio.Queue 实现生产者-消费者模式，失败任务自动重新入队

流程：
1. missy parse <分享文本> - 解析创建任务，返回剧ID
2. missy sync <#ID> - 并行下载上传
3. missy status <#ID> - 查看任务状态
4. missy login/logout - 百度网盘登录管理
"""

import argparse
import asyncio
import hashlib
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import urllib.parse
import datetime
from pathlib import Path
from typing import Optional, Callable, Tuple, Dict, Any, List
from enum import Enum
from dataclasses import dataclass, field
from asyncio import Queue, QueueEmpty

import aiohttp

# ============================================================================
# 配置
# ============================================================================

DOWNLOAD_DIR = Path.home() / "Downloads" / "Missy"
SESSIONS_FILE = DOWNLOAD_DIR / "session.json"

# 52api 配置
API_BASE_URL = "https://www.52api.cn/api/hg_duanju"
API_KEY = "vLZTNpjSbQsFOzZ68OcMUaJWbf"

# 百度网盘配置
BAIDU_APP_KEY = "7skXEyvQWb9fzYoC4sSgyEiaasuSMTfw"
BAIDU_SECRET_KEY = "YwIQIRtX8GjSYqqwaQWEnbHZjwA2xfOP"
BAIDU_TOKEN_URL = "https://openapi.baidu.com/oauth/2.0/token"
BAIDU_DEVICE_CODE_URL = "https://openapi.baidu.com/oauth/2.0/device/code"
BAIDU_UPLOAD_DOMAIN = "https://c3.pcs.baidu.com"
BAIDU_APP_NAME = "missy-videos"

# 并发配置
MAX_WORKERS = 5  # 消费者工作线程数
MAX_RETRY_COUNT = 10  # 最大重试次数（可恢复错误）
MAX_LOCAL_FILES = 5  # 最多保留本地文件数
CHUNK_SIZE = 4 * 1024 * 1024  # 4MB 分片

# 队列配置
QUEUE_CHECK_INTERVAL = 1  # 队列检查间隔（秒）
RETRY_DELAY_BASE = 5  # 重试延迟基数（秒）


# ============================================================================
# 错误分类
# ============================================================================

class ErrorCategory(Enum):
    """错误分类"""
    TRANSIENT = "transient"           # 临时错误，可重试（网络、超时等）
    RECOVERABLE = "recoverable"       # 可恢复错误，需处理后重试（URL过期）
    FATAL = "fatal"                   # 致命错误，不可重试（文件不存在、权限等）
    INTERVENTION = "intervention"     # 需人工干预（磁盘空间、登录失效）


def classify_error(error_msg: str, exception: Exception = None) -> tuple:
    """
    分类错误并返回 (错误类别, 建议操作, 是否可重试)

    建议操作:
    - retry: 正常重试
    - refresh_url: 刷新URL后重试
    - skip: 跳过，标记永久失败
    - pause: 暂停任务，等待人工干预
    """
    error_lower = error_msg.lower()

    # === 可恢复错误（需刷新URL）===
    if any(x in error_lower for x in ["403", "forbidden", "url过期", "链接失效"]):
        return ErrorCategory.RECOVERABLE, "refresh_url", True

    # === 临时错误（可重试）===
    transient_keywords = [
        "timeout", "timed out", "超时",
        "connection", "连接", "network", "网络",
        "reset", "reset by peer", "broken pipe",
        "500", "502", "503", "504",  # 服务器错误
        "cancelled", "取消", "中断",
        "temporarily", "临时",
        "rate limit", "限流", "too many",
    ]
    if any(kw in error_lower for kw in transient_keywords):
        return ErrorCategory.TRANSIENT, "retry", True

    # === 需人工干预的错误 ===
    intervention_keywords = [
        "no space", "磁盘空间", "disk full",
        "login", "登录", "auth", "认证", "token", "授权",
        "quota", "配额", "limit exceeded",
    ]
    if any(kw in error_lower for kw in intervention_keywords):
        return ErrorCategory.INTERVENTION, "pause", False

    # === 致命错误（不可重试）===
    fatal_keywords = [
        "not found", "不存在", "no such file",
        "permission", "权限", "access denied",
        "invalid", "无效", "格式错误",
        "视频不存在", "获取视频url失败",
    ]
    if any(kw in error_lower for kw in fatal_keywords):
        return ErrorCategory.FATAL, "skip", False

    # 检查异常类型
    if exception:
        if isinstance(exception, (PermissionError, FileNotFoundError, IsADirectoryError)):
            return ErrorCategory.FATAL, "skip", False
        if isinstance(exception, (ConnectionError, TimeoutError, asyncio.TimeoutError)):
            return ErrorCategory.TRANSIENT, "retry", True
        if isinstance(exception, asyncio.CancelledError):
            return ErrorCategory.TRANSIENT, "retry", True

    # 默认：临时错误，可重试
    return ErrorCategory.TRANSIENT, "retry", True


# ============================================================================
# 数据模型
# ============================================================================

class TaskStatus(str, Enum):
    PENDING = "pending"
    DOWNLOADING = "downloading"
    DOWNLOADED = "downloaded"
    UPLOADING = "uploading"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class Episode:
    index: int
    title: str
    video_id: str
    status: TaskStatus = TaskStatus.PENDING
    local_path: str = ""
    remote_path: str = ""
    file_size: int = 0
    downloaded_size: int = 0
    uploaded_size: int = 0
    error: str = ""
    retry_count: int = 0  # 重试计数
    # 时间戳字段
    started_at: str = ""
    download_started_at: str = ""
    download_completed_at: str = ""
    upload_started_at: str = ""
    upload_completed_at: str = ""
    completed_at: str = ""
    # 断点上传字段
    uploadid: str = ""
    uploaded_chunks: List[int] = field(default_factory=list)
    # 视频URL缓存
    video_url: str = ""
    video_url_expires_at: str = ""
    # 剧集封面图片
    image: str = ""

    def to_dict(self) -> dict:
        return {
            "index": self.index,
            "title": self.title,
            "video_id": self.video_id,
            "status": self.status.value,
            "local_path": self.local_path,
            "remote_path": self.remote_path,
            "file_size": self.file_size,
            "downloaded_size": self.downloaded_size,
            "uploaded_size": self.uploaded_size,
            "error": self.error,
            "retry_count": self.retry_count,
            "started_at": self.started_at,
            "download_started_at": self.download_started_at,
            "download_completed_at": self.download_completed_at,
            "upload_started_at": self.upload_started_at,
            "upload_completed_at": self.upload_completed_at,
            "completed_at": self.completed_at,
            "uploadid": self.uploadid,
            "uploaded_chunks": self.uploaded_chunks,
            "video_url": self.video_url,
            "video_url_expires_at": self.video_url_expires_at,
            "image": self.image,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "Episode":
        return cls(
            index=data.get("index", 0),
            title=data.get("title", ""),
            video_id=data.get("video_id", ""),
            status=TaskStatus(data.get("status", "pending")),
            local_path=data.get("local_path", ""),
            remote_path=data.get("remote_path", ""),
            file_size=data.get("file_size", 0),
            downloaded_size=data.get("downloaded_size", 0),
            uploaded_size=data.get("uploaded_size", 0),
            error=data.get("error", ""),
            retry_count=data.get("retry_count", 0),
            started_at=data.get("started_at", ""),
            download_started_at=data.get("download_started_at", ""),
            download_completed_at=data.get("download_completed_at", ""),
            upload_started_at=data.get("upload_started_at", ""),
            upload_completed_at=data.get("upload_completed_at", ""),
            completed_at=data.get("completed_at", ""),
            uploadid=data.get("uploadid", ""),
            uploaded_chunks=data.get("uploaded_chunks", []),
            video_url=data.get("video_url", ""),
            video_url_expires_at=data.get("video_url_expires_at", ""),
            image=data.get("image", ""),
        )


@dataclass
class DramaTask:
    drama_id: str
    drama_name: str
    total_episodes: int
    episodes: Dict[str, Episode] = field(default_factory=dict)
    created_at: str = ""
    updated_at: str = ""
    pid: Optional[int] = None
    # 短剧元数据
    cover: str = ""  # 封面图片URL
    author: str = ""  # 作者
    category: str = ""  # 分类
    desc: str = ""  # 简介
    duration: str = ""  # 单集时长
    # 封面和元数据文件上传状态
    cover_uploaded: bool = False  # 封面是否已上传
    metadata_uploaded: bool = False  # 元数据文件是否已上传

    def __post_init__(self):
        if not self.created_at:
            self.created_at = time.strftime("%Y-%m-%d %H:%M:%S")
        if not self.updated_at:
            self.updated_at = self.created_at

    def to_dict(self) -> dict:
        return {
            "drama_id": self.drama_id,
            "drama_name": self.drama_name,
            "total_episodes": self.total_episodes,
            "episodes": {k: v.to_dict() for k, v in self.episodes.items()},
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "pid": self.pid,
            "cover": self.cover,
            "author": self.author,
            "category": self.category,
            "desc": self.desc,
            "duration": self.duration,
            "cover_uploaded": self.cover_uploaded,
            "metadata_uploaded": self.metadata_uploaded,
        }

    @classmethod
    def from_dict(cls, data: dict) -> "DramaTask":
        task = cls(
            drama_id=data.get("drama_id", ""),
            drama_name=data.get("drama_name", ""),
            total_episodes=data.get("total_episodes", 0),
            created_at=data.get("created_at", ""),
            updated_at=data.get("updated_at", ""),
            pid=data.get("pid"),
            cover=data.get("cover", ""),
            author=data.get("author", ""),
            category=data.get("category", ""),
            desc=data.get("desc", ""),
            duration=data.get("duration", ""),
            cover_uploaded=data.get("cover_uploaded", False),
            metadata_uploaded=data.get("metadata_uploaded", False),
        )
        task.episodes = {
            k: Episode.from_dict(v) for k, v in data.get("episodes", {}).items()
        }
        return task

    def get_summary(self) -> Dict[str, int]:
        summary = {status.value: 0 for status in TaskStatus}
        for ep in self.episodes.values():
            summary[ep.status.value] = summary.get(ep.status.value, 0) + 1
        return summary

    def is_completed(self) -> bool:
        summary = self.get_summary()
        completed = summary.get(TaskStatus.COMPLETED.value, 0)
        failed = summary.get(TaskStatus.FAILED.value, 0)
        return completed + failed == self.total_episodes

    def is_running(self) -> bool:
        if self.pid:
            try:
                os.kill(self.pid, 0)
                return True
            except ProcessLookupError:
                return False
        return False


# ============================================================================
# 任务管理器
# ============================================================================

class TaskManager:
    def __init__(self, drama_dir: Path):
        self.drama_dir = drama_dir
        self.task_file = drama_dir / "task.json"
        self._ensure_dir()
        self.task = self._load()

    def _ensure_dir(self):
        self.drama_dir.mkdir(parents=True, exist_ok=True)

    def _load(self) -> DramaTask:
        if self.task_file.exists():
            try:
                with open(self.task_file, "r", encoding="utf-8") as f:
                    return DramaTask.from_dict(json.load(f))
            except Exception:
                pass
        return DramaTask(drama_id="", drama_name="", total_episodes=0)

    def save(self):
        self._ensure_dir()
        self.task.updated_at = time.strftime("%Y-%m-%d %H:%M:%S")
        with open(self.task_file, "w", encoding="utf-8") as f:
            json.dump(self.task.to_dict(), f, ensure_ascii=False, indent=2)

    def init_drama(self, drama_id: str, drama_name: str, episodes_data: List[Dict], drama_metadata: Dict = None):
        self.task.drama_id = drama_id
        self.task.drama_name = drama_name
        self.task.total_episodes = len(episodes_data)

        # 保存短剧元数据
        if drama_metadata:
            self.task.cover = drama_metadata.get("cover", "")
            self.task.author = drama_metadata.get("author", "")
            self.task.category = drama_metadata.get("category", "")
            self.task.desc = drama_metadata.get("desc", "")
            self.task.duration = drama_metadata.get("duration", "")

        for i, ep_data in enumerate(episodes_data, 1):
            ep_key = str(i)
            if ep_key not in self.task.episodes:
                self.task.episodes[ep_key] = Episode(
                    index=i,
                    title=ep_data.get("title", f"第{i}集"),
                    video_id=ep_data.get("video_id", ""),
                    image=ep_data.get("image", ""),  # 保存剧集封面
                )
            else:
                self.task.episodes[ep_key].video_id = ep_data.get("video_id", "")
                self.task.episodes[ep_key].title = ep_data.get("title", f"第{i}集")
                self.task.episodes[ep_key].image = ep_data.get("image", "")

        self.save()

    def get_episode(self, index: int) -> Optional[Episode]:
        return self.task.episodes.get(str(index))

    def update_episode(self, index: int, **kwargs):
        ep = self.task.episodes.get(str(index))
        if ep:
            for key, value in kwargs.items():
                if hasattr(ep, key):
                    setattr(ep, key, value)
            self.save()

    def set_status(self, index: int, status: TaskStatus, error: str = ""):
        update = {"status": status}
        if error:
            update["error"] = error

        now = time.strftime("%Y-%m-%d %H:%M:%S")

        if status == TaskStatus.DOWNLOADING:
            update["started_at"] = now
            update["download_started_at"] = now
        if status == TaskStatus.DOWNLOADED:
            update["download_completed_at"] = now
        if status == TaskStatus.UPLOADING:
            update["upload_started_at"] = now
        if status == TaskStatus.COMPLETED:
            update["upload_completed_at"] = now
            update["completed_at"] = now
        if status in [TaskStatus.FAILED, TaskStatus.SKIPPED]:
            update["completed_at"] = now

        self.update_episode(index, **update)

    def get_pending_episodes(self) -> List[int]:
        """获取所有待处理的剧集（pending 和 failed），按集数排序"""
        pending = []
        for idx_str, ep in self.task.episodes.items():
            if ep.status in [TaskStatus.PENDING, TaskStatus.FAILED]:
                pending.append(int(idx_str))
        return sorted(pending)

    def get_active_episodes_count(self) -> int:
        """获取正在处理中的剧集数量"""
        count = 0
        for ep in self.task.episodes.values():
            if ep.status in [TaskStatus.DOWNLOADING, TaskStatus.UPLOADING]:
                count += 1
        return count

    def increment_retry(self, index: int) -> int:
        """增加重试计数，返回新的重试次数"""
        ep = self.task.episodes.get(str(index))
        if ep:
            ep.retry_count += 1
            self.save()
            return ep.retry_count
        return 0

    def reset_retry(self, index: int):
        """重置重试计数"""
        self.update_episode(index, retry_count=0)

    def set_pid(self, pid: Optional[int]):
        self.task.pid = pid
        self.save()


# ============================================================================
# 队列任务模型
# ============================================================================

@dataclass
class QueueTask:
    """队列中的任务项"""
    episode_index: int
    priority: int = 0  # 优先级，数字越小优先级越高
    retry_count: int = 0

    def __lt__(self, other):
        # 优先级比较：优先级数字小的优先，同优先级下集数小的优先
        if self.priority != other.priority:
            return self.priority < other.priority
        return self.episode_index < other.episode_index


# ============================================================================
# API 客户端
# ============================================================================

class DramaAPI:
    """52api 短剧接口"""

    def __init__(self):
        self.api_key = API_KEY
        self.base_url = API_BASE_URL

    async def request(self, req_type: str, params: dict = None) -> dict:
        form_data = {"key": self.api_key, "type": req_type}
        if params:
            form_data.update(params)

        async with aiohttp.ClientSession() as session:
            async with session.post(self.base_url, data=form_data) as resp:
                return await resp.json()

    async def search(self, keyword: str, page: int = 1) -> dict:
        return await self.request("search", {"keyword": keyword, "page": str(page)})

    async def get_detail(self, drama_id: str) -> dict:
        return await self.request("detail", {"id": drama_id})

    async def get_video_url(self, video_id: str) -> dict:
        return await self.request("video", {"video_id": video_id})


# ============================================================================
# 百度网盘认证
# ============================================================================

class BaiduAuth:
    """百度网盘认证管理"""

    def __init__(self, user_id: str = "default"):
        self.user_id = user_id
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None
        self.expires_at: Optional[int] = None
        self._load_tokens()

    def _load_tokens(self):
        if SESSIONS_FILE.exists():
            try:
                with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    session = data.get("sessions", {}).get(self.user_id, {})
                    self.access_token = session.get("access_token")
                    self.refresh_token = session.get("refresh_token")
                    self.expires_at = session.get("expires_at")
            except Exception:
                pass

    def _save_tokens(self, access_token: str, refresh_token: str, expires_in: int):
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.expires_at = int(time.time()) + expires_in

        DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

        data = {}
        if SESSIONS_FILE.exists():
            try:
                with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception:
                pass

        if "sessions" not in data:
            data["sessions"] = {}

        data["sessions"][self.user_id] = {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "expires_at": self.expires_at,
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        }
        data["updated_at"] = time.strftime("%Y-%m-%d %H:%M:%S")

        with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def is_authenticated(self) -> bool:
        return (
            self.access_token is not None
            and self.expires_at is not None
            and int(time.time()) < (self.expires_at - 86400)
        )

    async def ensure_valid_token(self) -> bool:
        if self.is_authenticated():
            return True

        if not self.refresh_token:
            return False

        url = f"{BAIDU_TOKEN_URL}?grant_type=refresh_token&refresh_token={self.refresh_token}&client_id={BAIDU_APP_KEY}&client_secret={BAIDU_SECRET_KEY}"

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers={"User-Agent": "pan.baidu.com"}) as resp:
                result = await resp.json()
                if "access_token" in result:
                    self._save_tokens(
                        result["access_token"],
                        result["refresh_token"],
                        result.get("expires_in", 2592000),
                    )
                    return True
        return False

    async def login(self) -> dict:
        DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)

        async with aiohttp.ClientSession() as session:
            async with session.post(
                BAIDU_DEVICE_CODE_URL,
                data={
                    "client_id": BAIDU_APP_KEY,
                    "response_type": "device_code",
                    "scope": "basic,netdisk",
                },
            ) as resp:
                device_data = await resp.json()

        if "error" in device_data:
            print(f"ERROR:{device_data.get('error_description', '获取设备码失败')}")
            return {}

        device_code = device_data["device_code"]
        user_code = device_data["user_code"]
        qrcode_url = device_data["qrcode_url"]
        interval = device_data.get("interval", 5)
        expires_in = device_data.get("expires_in", 300)

        qr_dir = DOWNLOAD_DIR / "qrcodes"
        qr_dir.mkdir(exist_ok=True)
        qr_file = qr_dir / f"baidu_login_{self.user_id}.png"

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(qrcode_url) as qr_resp:
                    if qr_resp.status == 200:
                        with open(qr_file, "wb") as f:
                            f.write(await qr_resp.read())
        except Exception as e:
            print(f"WARN:下载二维码失败: {e}")

        print(f"\n请使用百度网盘APP扫描以下二维码登录:")
        print(f"用户码: {user_code}")
        if qr_file.exists():
            print(f"二维码已保存: {qr_file}")
            try:
                subprocess.run(["open", str(qr_file)], check=False)
            except:
                pass

        print(f"\n等待授权...")

        start_time = time.time()
        while time.time() - start_time < expires_in:
            await asyncio.sleep(interval)

            token_url = (
                f"{BAIDU_TOKEN_URL}?grant_type=device_token&code={device_code}&"
                f"client_id={BAIDU_APP_KEY}&client_secret={BAIDU_SECRET_KEY}"
            )

            async with aiohttp.ClientSession() as session:
                async with session.get(token_url) as resp:
                    result = await resp.json()

            if "access_token" in result:
                self._save_tokens(
                    result["access_token"],
                    result["refresh_token"],
                    result.get("expires_in", 2592000),
                )
                print(f"登录成功！用户: {self.user_id}")
                try:
                    qr_file.unlink()
                except:
                    pass
                return result

            if result.get("error") == "authorization_pending":
                continue
            else:
                print(f"ERROR:{result.get('error_description', '登录失败')}")
                return {}

        print("ERROR:登录超时，请重试")
        return {}

    def logout(self) -> bool:
        try:
            if SESSIONS_FILE.exists():
                with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)

                if "sessions" in data and self.user_id in data["sessions"]:
                    del data["sessions"][self.user_id]
                    with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)

            self.access_token = None
            self.refresh_token = None
            self.expires_at = None
            return True
        except Exception as e:
            print(f"退出登录失败: {e}")
            return False


# ============================================================================
# 百度网盘上传（分片上传）
# ============================================================================

class BaiduUploader:
    def __init__(self, auth: BaiduAuth):
        self.auth = auth

    def _normalize_path(self, remote_path: str, filename: str) -> str:
        base_filename = Path(filename).name
        if remote_path.startswith(f"/apps/{BAIDU_APP_NAME}"):
            return f"{remote_path.rstrip('/')}/{base_filename}"
        clean_path = remote_path.lstrip("/")
        return f"/apps/{BAIDU_APP_NAME}/{clean_path}/{base_filename}"

    async def _check_remote_file(self, path: str, local_size: int, local_md5: str) -> Optional[dict]:
        meta_url = f"https://pan.baidu.com/rest/2.0/xpan/multimedia?method=filemetas&access_token={self.auth.access_token}&fsids={json.dumps([path])}&dlink=0"

        def do_meta():
            cmd = ["curl", "-s", meta_url]
            result = subprocess.run(cmd, capture_output=True, text=True)
            return json.loads(result.stdout) if result.returncode == 0 else {}

        loop = asyncio.get_event_loop()
        meta_result = await loop.run_in_executor(None, do_meta)

        if meta_result.get("errno") == 0:
            for item in meta_result.get("list", []):
                if item.get("path") == path or item.get("server_filename") == Path(path).name:
                    remote_size = item.get("size", 0)
                    if remote_size == local_size:
                        return {
                            "path": item.get("path", path),
                            "size": remote_size,
                            "fs_id": item.get("fs_id", 0),
                            "md5": item.get("md5", ""),
                        }
                    else:
                        await self._delete_remote_file(path)
                        return None

        list_url = f"https://pan.baidu.com/rest/2.0/xpan/file?method=list&access_token={self.auth.access_token}&dir={urllib.parse.quote(Path(path).parent.as_posix())}"

        def do_list():
            cmd = ["curl", "-s", list_url]
            result = subprocess.run(cmd, capture_output=True, text=True)
            return json.loads(result.stdout) if result.returncode == 0 else {}

        list_result = await loop.run_in_executor(None, do_list)

        if list_result.get("errno") == 0:
            filename = Path(path).name
            for item in list_result.get("list", []):
                if item.get("server_filename") == filename:
                    remote_size = item.get("size", 0)
                    if remote_size == local_size:
                        return {
                            "path": item.get("path", path),
                            "size": remote_size,
                            "fs_id": item.get("fs_id", 0),
                            "md5": item.get("md5", ""),
                        }
                    else:
                        await self._delete_remote_file(path)
                        return None
        return None

    async def _delete_remote_file(self, path: str):
        delete_url = f"https://pan.baidu.com/rest/2.0/xpan/file?method=filemanager&access_token={self.auth.access_token}&opera=delete&async=0"

        def do_delete():
            filelist = json.dumps([{"path": path}], ensure_ascii=False)
            cmd = [
                "curl", "-X", "POST", delete_url,
                "-H", "User-Agent: pan.baidu.com",
                "-d", f"filelist={urllib.parse.quote(filelist)}",
                "-s",
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, do_delete)

    async def upload(
        self,
        local_path: str,
        remote_path: str,
        on_progress: Optional[Callable[[int, int], None]] = None,
        resume_upload: bool = False,
        existing_uploadid: str = "",
        existing_uploaded_chunks: List[int] = None,
        on_chunk_uploaded: Optional[Callable[[str, List[int]], None]] = None,
    ) -> dict:
        if not await self.auth.ensure_valid_token():
            raise Exception("请先登录百度网盘: missy login")

        local_file = Path(local_path)
        if not local_file.exists():
            raise Exception(f"文件不存在: {local_path}")

        file_size = local_file.stat().st_size
        filename = local_file.name
        normalized_path = self._normalize_path(remote_path, filename)

        with open(local_file, "rb") as f:
            file_md5 = hashlib.md5(f.read()).hexdigest()

        existing_file = await self._check_remote_file(normalized_path, file_size, file_md5)
        if existing_file:
            return existing_file

        total_chunks = (file_size + CHUNK_SIZE - 1) // CHUNK_SIZE

        chunk_md5s = []
        with open(local_file, "rb") as f:
            for _ in range(total_chunks):
                chunk_data = f.read(CHUNK_SIZE)
                if not chunk_data:
                    break
                chunk_md5s.append(hashlib.md5(chunk_data).hexdigest())

        uploadid = None
        block_list_to_upload = None
        all_chunks_uploaded = False
        if resume_upload and existing_uploadid and existing_uploaded_chunks:
            uploadid = existing_uploadid
            all_chunks = set(range(len(chunk_md5s)))
            uploaded_set = set(existing_uploaded_chunks)
            block_list_to_upload = list(all_chunks - uploaded_set)
            print(f"INFO:断点续传，已上传 {len(existing_uploaded_chunks)}/{len(chunk_md5s)} 个分片")
            if not block_list_to_upload:
                all_chunks_uploaded = True
                print(f"INFO:所有分片已上传，直接创建文件")

        if not uploadid or (not block_list_to_upload and not all_chunks_uploaded):
            precreate_result = await self._precreate(normalized_path, file_size, chunk_md5s)
            uploadid = precreate_result.get("uploadid")
            if not uploadid:
                raise Exception(f"预上传失败: {precreate_result}")

            if precreate_result.get("return_type") == 2:
                return {"path": normalized_path, "size": file_size, "fs_id": precreate_result.get("fs_id", 0)}

            block_list_to_upload = precreate_result.get("block_list", list(range(len(chunk_md5s))))
            existing_uploaded_chunks = []

        if all_chunks_uploaded:
            # 尝试用现有的 uploadid 创建文件
            server_md5s = chunk_md5s
            try:
                result = await self._create_file(normalized_path, file_size, uploadid, server_md5s)
                result["uploadid"] = uploadid
                result["uploaded_chunks"] = list(range(len(chunk_md5s)))
                return result
            except Exception as e:
                # 如果创建失败（可能是 uploadid 过期），重新开始上传
                print(f"WARN:创建文件失败，重新开始上传: {e}")
                uploadid = None
                all_chunks_uploaded = False

        uploaded_size = 0
        server_md5s = [""] * len(chunk_md5s)
        newly_uploaded_chunks = []

        with open(local_file, "rb") as f:
            for chunk_idx in range(total_chunks):
                chunk_data = f.read(CHUNK_SIZE)
                if not chunk_data:
                    break

                if chunk_idx in block_list_to_upload:
                    result = await self._upload_chunk(
                        chunk_data, normalized_path, uploadid, chunk_idx, total_chunks
                    )
                    server_md5s[chunk_idx] = result.get("md5", chunk_md5s[chunk_idx])
                    newly_uploaded_chunks.append(chunk_idx)

                    if on_chunk_uploaded and len(newly_uploaded_chunks) % 5 == 0:
                        all_uploaded = list(set(existing_uploaded_chunks or []) | set(newly_uploaded_chunks))
                        on_chunk_uploaded(uploadid, all_uploaded)

                uploaded_size += len(chunk_data)
                if on_progress:
                    on_progress(uploaded_size, file_size)

        result = await self._create_file(normalized_path, file_size, uploadid, server_md5s)
        result["uploadid"] = uploadid
        result["uploaded_chunks"] = list(set(existing_uploaded_chunks or []) | set(newly_uploaded_chunks))
        return result

    async def _precreate(self, path: str, size: int, block_list: List[str]) -> dict:
        precreate_url = f"https://pan.baidu.com/rest/2.0/xpan/file?method=precreate&access_token={self.auth.access_token}"

        def do_precreate():
            cmd = [
                "curl",
                "-X", "POST",
                precreate_url,
                "-H", "User-Agent: pan.baidu.com",
                "-d", f"path={urllib.parse.quote(path)}&size={size}&isdir=0&autoinit=1&rtype=1&block_list={urllib.parse.quote(json.dumps(block_list))}",
                "-s",
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                raise Exception(f"预上传失败: {result.stderr}")

            response = json.loads(result.stdout)
            if response.get("errno", 0) != 0:
                raise Exception(f"预上传API错误: {response.get('errmsg', response.get('errno'))}")
            return response

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, do_precreate)

    async def _upload_chunk(
        self, chunk_data: bytes, path: str, uploadid: str, chunk_idx: int, total_chunks: int
    ):
        upload_url = f"{BAIDU_UPLOAD_DOMAIN}/rest/2.0/pcs/superfile2?method=upload&access_token={self.auth.access_token}&path={urllib.parse.quote(path, safe='')}&uploadid={urllib.parse.quote(uploadid)}&partseq={chunk_idx}&type=tmpfile"

        def do_upload():
            with tempfile.NamedTemporaryFile(delete=False, suffix=".tmp") as tmp:
                tmp.write(chunk_data)
                tmp_path = tmp.name

            try:
                cmd = [
                    "curl",
                    "-X",
                    "POST",
                    upload_url,
                    "-H",
                    "User-Agent: pan.baidu.com",
                    "-F",
                    f"file=@{tmp_path}",
                    "--max-time",
                    "300",
                    "-s",
                ]
                result = subprocess.run(cmd, capture_output=True, text=True)

                if result.returncode != 0:
                    raise Exception(f"分片上传失败: {result.stderr}")

                response = json.loads(result.stdout)
                if "errno" in response and response["errno"] != 0:
                    raise Exception(f"百度API错误: {response.get('error', '未知错误')}")
                return response
            finally:
                try:
                    Path(tmp_path).unlink()
                except:
                    pass

        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, do_upload)

    async def _create_file(self, path: str, size: int, uploadid: str, block_list: List[str]) -> dict:
        create_url = f"https://pan.baidu.com/rest/2.0/xpan/file?method=create&access_token={self.auth.access_token}"

        def do_create():
            cmd = [
                "curl",
                "-X",
                "POST",
                create_url,
                "-H",
                "User-Agent: pan.baidu.com",
                "-d",
                f"path={urllib.parse.quote(path)}&size={size}&isdir=0&rtype=1&uploadid={urllib.parse.quote(uploadid)}&block_list={urllib.parse.quote(json.dumps(block_list))}",
                "-s",
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode != 0:
                raise Exception(f"创建文件失败: {result.stderr}")

            response = json.loads(result.stdout)
            if "errno" in response and response["errno"] != 0:
                raise Exception(f"百度API错误: {response['errno']}")
            return response

        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(None, do_create)

        return {
            "path": result.get("path", path),
            "size": result.get("size", size),
            "fs_id": result.get("fs_id", 0),
        }


# ============================================================================
# 视频下载器
# ============================================================================

class Downloader:
    def __init__(self, download_dir: Path = None):
        self.download_dir = download_dir or DOWNLOAD_DIR
        self.download_dir.mkdir(parents=True, exist_ok=True)

    def _get_temp_path(self, save_path: Path) -> Path:
        return save_path.with_suffix(save_path.suffix + ".tmp")

    async def download(
        self,
        url: str,
        filename: str,
        drama_name: str = "",
        on_progress: Optional[Callable[[int, int, float], None]] = None,
        resume: bool = True,
    ) -> str:
        save_dir = self.download_dir / drama_name if drama_name else self.download_dir
        save_dir.mkdir(parents=True, exist_ok=True)
        save_path = save_dir / filename
        temp_path = self._get_temp_path(save_path)

        if save_path.exists():
            return str(save_path)

        downloaded = 0
        if resume and temp_path.exists():
            downloaded = temp_path.stat().st_size

        headers = {}
        if downloaded > 0:
            headers["Range"] = f"bytes={downloaded}-"

        async with aiohttp.ClientSession() as session:
            async with session.get(url, headers=headers) as resp:
                if resp.status not in [200, 206]:
                    raise Exception(f"下载失败: HTTP {resp.status}")

                content_length = int(resp.headers.get("content-length", 0))
                if resp.status == 206:
                    total_size = downloaded + content_length
                else:
                    total_size = content_length
                    downloaded = 0

                mode = "ab" if downloaded > 0 and resp.status == 206 else "wb"
                with open(temp_path, mode) as f:
                    async for chunk in resp.content.iter_chunked(1024 * 1024):
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size and on_progress:
                            percent = (downloaded / total_size) * 100
                            on_progress(downloaded, total_size, percent)
                        elif on_progress:
                            on_progress(downloaded, total_size, 0)

                temp_path.rename(save_path)

        return str(save_path)


# ============================================================================
# 队列处理器
# ============================================================================

class QueueProcessor:
    """基于 asyncio.Queue 的任务处理器"""

    def __init__(
        self,
        task_manager: TaskManager,
        api: DramaAPI,
        auth: BaiduAuth,
        uploader: BaiduUploader,
        downloader: Downloader,
        drama_name: str,
        remote_dir: str = "",
        max_workers: int = MAX_WORKERS,
    ):
        self.task_manager = task_manager
        self.api = api
        self.auth = auth
        self.uploader = uploader
        self.downloader = downloader
        self.drama_name = drama_name
        self.remote_dir = remote_dir
        self.max_workers = max_workers

        # 任务队列
        self.task_queue: Queue[QueueTask] = Queue()
        # 已入队的任务集合（防止重复入队）
        self._queued_episodes: set = set()
        # 初始入队完成标志
        self._initial_enqueue_done = asyncio.Event()
        # 本地文件信号量（控制并发下载+上传）
        self.local_file_sem = asyncio.Semaphore(MAX_LOCAL_FILES)
        # 统计
        self.completed_count = 0
        self.failed_count = 0
        self.stats_lock = asyncio.Lock()
        # 停止标志
        self._stop_event = asyncio.Event()
        # 暂停标志（用于需人工干预的情况）
        self._pause_event = asyncio.Event()
        # 错误统计
        self.error_stats: Dict[str, int] = {}  # 错误类型 -> 计数
        self.error_stats_lock = asyncio.Lock()

    async def _producer(self, initial_episodes: List[int]):
        """生产者：将待处理的任务加入队列"""
        # 首先加入初始的待处理剧集
        for idx in sorted(initial_episodes):
            ep = self.task_manager.get_episode(idx)
            if ep and ep.status not in [TaskStatus.COMPLETED, TaskStatus.SKIPPED]:
                # 只入队还有重试次数的任务
                if ep.retry_count >= MAX_RETRY_COUNT:
                    print(f"INFO:生产者 - 跳过已达最大重试次数: 第{idx}集")
                    continue
                # failed 状态的优先级更高（数字更小）
                priority = 0 if ep.status == TaskStatus.FAILED else 1
                await self.task_queue.put(QueueTask(
                    episode_index=idx,
                    priority=priority,
                    retry_count=ep.retry_count
                ))
                self._queued_episodes.add(idx)
                print(f"INFO:生产者 - 加入队列: 第{idx}集 (优先级:{priority})")

        # 标记初始入队完成
        self._initial_enqueue_done.set()

        # 生产者任务完成，后续的重新入队由消费者负责
        # 保持运行直到收到停止信号
        while not self._stop_event.is_set():
            await asyncio.sleep(QUEUE_CHECK_INTERVAL)

    async def _consumer(self, worker_id: int):
        """消费者：从队列中取出任务并处理"""
        while not self._stop_event.is_set():
            # 检查是否暂停
            if self._pause_event.is_set():
                print(f"INFO:工作者{worker_id} - 任务已暂停（需人工干预），等待恢复...")
                await asyncio.sleep(5)
                continue

            try:
                # 从队列获取任务，设置超时以便检查停止标志
                queue_task = await asyncio.wait_for(
                    self.task_queue.get(),
                    timeout=1.0
                )
            except asyncio.TimeoutError:
                continue
            except QueueEmpty:
                continue

            idx = queue_task.episode_index
            ep = self.task_manager.get_episode(idx)

            if not ep or ep.status == TaskStatus.COMPLETED:
                self.task_queue.task_done()
                self._queued_episodes.discard(idx)
                continue

            print(f"INFO:工作者{worker_id} - 开始处理: 第{idx}集")

            # 使用信号量控制本地文件数量
            async with self.local_file_sem:
                success, error_msg = await self._process_episode(idx)

            if success:
                # 成功：从已入队集合中移除
                self._queued_episodes.discard(idx)
                async with self.stats_lock:
                    self.completed_count += 1
                print(f"INFO:工作者{worker_id} - 完成: 第{idx}集")
            else:
                # 检查是否是致命错误或需人工干预（这些错误不会重试）
                if error_msg and (error_msg.startswith("[致命错误]") or error_msg.startswith("[需人工干预]")):
                    # 直接标记失败，不重新入队
                    self._queued_episodes.discard(idx)
                    async with self.stats_lock:
                        self.failed_count += 1
                    print(f"ERROR:工作者{worker_id} - 第{idx}集 {error_msg}")
                else:
                    # 失败：检查是否需要重新入队
                    ep = self.task_manager.get_episode(idx)
                    if ep and ep.retry_count < MAX_RETRY_COUNT:
                        # 指数退避延迟：第1次5秒，第2次10秒，第3次20秒...
                        delay = min(RETRY_DELAY_BASE * (2 ** (ep.retry_count - 1)), 300)  # 最大5分钟
                        print(f"INFO:工作者{worker_id} - 第{idx}集失败，等待{delay}秒后重试 (重试{ep.retry_count}/{MAX_RETRY_COUNT})")
                        await asyncio.sleep(delay)

                        # 重新入队（高优先级）
                        await self.task_queue.put(QueueTask(
                            episode_index=idx,
                            priority=0,  # failed 任务优先级高
                            retry_count=ep.retry_count
                        ))
                        # 注意：不从 _queued_episodes 移除，因为已经重新入队
                    else:
                        # 已达最大重试次数，从集合中移除
                        self._queued_episodes.discard(idx)
                        async with self.stats_lock:
                            self.failed_count += 1
                        print(f"INFO:工作者{worker_id} - 最终失败: 第{idx}集 ({error_msg})")

            self.task_queue.task_done()

    async def _process_episode(self, idx: int) -> Tuple[bool, str]:
        """处理单集（下载+上传），返回 (成功, 错误信息)"""
        ep = self.task_manager.get_episode(idx)
        if not ep:
            return False, "剧集信息不存在"

        # 使用数字格式文件名
        filename = f"{idx:03d}.mp4"
        save_dir = self.downloader.download_dir / self.drama_name
        save_path = save_dir / filename
        tmp_path = save_path.with_suffix(save_path.suffix + ".tmp")

        try:
            # 检查是否已有下载完成的文件
            file_already_downloaded = save_path.exists() and save_path.stat().st_size > 0

            if not file_already_downloaded:
                # 获取视频URL
                video_url = ep.video_url
                if not video_url:
                    video_result = await self.api.get_video_url(ep.video_id)
                    if video_result.get("code") not in [200, 1]:
                        raise Exception("获取视频URL失败")

                    video_data = video_result.get("data", video_result)
                    video_url = (
                        video_data.get("url")
                        if isinstance(video_data, dict)
                        else video_result.get("url")
                    )
                    if not video_url:
                        raise Exception("无视频URL")

                    # 缓存URL
                    self.task_manager.update_episode(idx, video_url=video_url)

                # 下载
                self.task_manager.set_status(idx, TaskStatus.DOWNLOADING)

                # 断点续传检查
                if tmp_path.exists():
                    downloaded_size = tmp_path.stat().st_size
                    self.task_manager.update_episode(idx, downloaded_size=downloaded_size)
                    print(f"INFO:发现未完成的下载，断点续传: {filename} ({downloaded_size} bytes)")

                last_progress = [0]

                def on_progress(d, t, p):
                    if t and (d - last_progress[0]) > t * 0.05:
                        self.task_manager.update_episode(idx, downloaded_size=d, file_size=t)
                        last_progress[0] = d

                save_path_str = await self.downloader.download(
                    video_url, filename, self.drama_name, on_progress, resume=True
                )

                # 验证下载完整性
                save_path_obj = Path(save_path_str)
                if not save_path_obj.exists():
                    raise Exception("下载文件不存在")

                actual_size = save_path_obj.stat().st_size
                if actual_size == 0:
                    raise Exception("下载文件大小为0")

                self.task_manager.set_status(idx, TaskStatus.DOWNLOADED)
                self.task_manager.update_episode(idx, local_path=save_path_str, file_size=actual_size, downloaded_size=actual_size)
            else:
                print(f"INFO:文件已存在，跳过下载: {filename}")
                actual_size = save_path.stat().st_size
                self.task_manager.update_episode(idx, local_path=str(save_path), file_size=actual_size)
                # 清除之前失败的上传状态，重新开始上传
                self.task_manager.update_episode(idx, uploadid="", uploaded_chunks=[])

            # 上传
            ep = self.task_manager.get_episode(idx)
            save_path = ep.local_path if ep else ""
            if not save_path or not Path(save_path).exists():
                raise Exception("本地文件不存在")

            self.task_manager.set_status(idx, TaskStatus.UPLOADING)

            # 检查是否有断点上传记录
            resume_upload = ep and ep.uploadid and ep.uploaded_chunks
            if resume_upload:
                print(f"INFO:发现未完成的上传，断点续传: {filename} (已传 {len(ep.uploaded_chunks)} 个分片)")

            last_upload = [0]

            def on_upload(uploaded, total):
                if total and (uploaded - last_upload[0]) > total * 0.01:
                    self.task_manager.update_episode(idx, uploaded_size=uploaded)
                    last_upload[0] = uploaded

            def on_chunk_uploaded(uploadid, uploaded_chunks):
                self.task_manager.update_episode(idx, uploadid=uploadid, uploaded_chunks=uploaded_chunks)

            result = await self.uploader.upload(
                save_path, self.remote_dir or self.drama_name, on_upload,
                resume_upload=resume_upload,
                existing_uploadid=ep.uploadid if ep else "",
                existing_uploaded_chunks=ep.uploaded_chunks if ep else [],
                on_chunk_uploaded=on_chunk_uploaded
            )

            # 保存上传结果
            if result.get("uploadid"):
                self.task_manager.update_episode(idx, uploadid=result["uploadid"], uploaded_chunks=result.get("uploaded_chunks", []))

            self.task_manager.update_episode(idx, remote_path=result.get("path", ""), uploaded_size=ep.file_size if ep else 0)
            self.task_manager.set_status(idx, TaskStatus.COMPLETED)

            # 清空上传进度和错误信息
            self.task_manager.update_episode(idx, uploadid="", uploaded_chunks=[], error="", retry_count=0)

            # 删除本地文件
            try:
                Path(save_path).unlink()
                self.task_manager.update_episode(idx, local_path="")
            except Exception as e:
                print(f"WARN:删除本地文件失败 {save_path}: {e}")

            return True, ""

        except asyncio.CancelledError:
            # 进程被取消（如用户手动停止）- 临时错误，可重试
            return False, "下载被中断（进程取消）"
        except Exception as e:
            error_msg = str(e) if str(e) else f"未知错误: {type(e).__name__}"

            # 分类错误
            category, action, can_retry = classify_error(error_msg, e)
            category_name = category.value

            # 获取当前重试次数
            current_retry = self.task_manager.get_episode(idx)
            current_retry_count = current_retry.retry_count if current_retry else 0

            # 根据错误类别处理
            if category == ErrorCategory.RECOVERABLE:
                # 可恢复错误：刷新URL
                print(f"INFO:第{idx}集遇到可恢复错误({category_name})，清除缓存的URL: {error_msg[:60]}")
                self.task_manager.update_episode(idx, video_url="")
                self.task_manager.increment_retry(idx)

            elif category == ErrorCategory.FATAL:
                # 致命错误：不重试，直接标记失败
                print(f"ERROR:第{idx}集遇到致命错误({category_name})，不再重试: {error_msg}")
                self.task_manager.set_status(idx, TaskStatus.FAILED, f"[致命错误] {error_msg}")
                # 清理本地文件
                try:
                    if save_path.exists():
                        save_path.unlink()
                    if tmp_path.exists():
                        tmp_path.unlink()
                except:
                    pass
                # 记录错误统计
                asyncio.create_task(self._record_error("fatal", error_msg))
                return False, f"[致命错误] {error_msg}"

            elif category == ErrorCategory.INTERVENTION:
                # 需人工干预：暂停并通知
                print(f"ALERT:第{idx}集需要人工干预({category_name}): {error_msg}")
                self.task_manager.set_status(idx, TaskStatus.FAILED, f"[需人工干预] {error_msg}")
                # 设置暂停标志
                self._pause_event.set()
                # 记录错误统计
                asyncio.create_task(self._record_error("intervention", error_msg))
                return False, f"[需人工干预] {error_msg}"

            else:
                # 临时错误：正常重试
                self.task_manager.increment_retry(idx)
                # 记录错误统计
                asyncio.create_task(self._record_error("transient", error_msg))

            # 获取更新后的重试次数
            ep = self.task_manager.get_episode(idx)
            retry_count = ep.retry_count if ep else current_retry_count + 1

            if retry_count < MAX_RETRY_COUNT:
                self.task_manager.set_status(idx, TaskStatus.FAILED, f"[重试{retry_count}/{MAX_RETRY_COUNT}] {error_msg}")
                print(f"WARN:第{idx}集失败({category_name})，将重新入队重试: {error_msg[:60]}")
            else:
                self.task_manager.set_status(idx, TaskStatus.FAILED, f"[最终失败] {error_msg}")
                # 清理本地文件
                try:
                    if save_path.exists():
                        save_path.unlink()
                    if tmp_path.exists():
                        tmp_path.unlink()
                except:
                    pass
                print(f"ERROR:第{idx}集达到最大重试次数({MAX_RETRY_COUNT})，最终失败: {error_msg}")
                # 记录最终失败
                asyncio.create_task(self._record_error("final_failure", error_msg))

            return False, error_msg

    async def _record_error(self, error_type: str, error_msg: str):
        """记录错误统计"""
        async with self.error_stats_lock:
            # 提取错误关键词作为key
            key = f"{error_type}:{error_msg[:30]}"
            self.error_stats[key] = self.error_stats.get(key, 0) + 1

    def get_error_summary(self) -> Dict[str, int]:
        """获取错误统计摘要"""
        return self.error_stats.copy()

    async def _upload_cover_and_metadata(self):
        """上传封面和元数据文件到百度网盘"""
        drama_dir = self.task_manager.drama_dir
        cover_path = drama_dir / "cover.jpg"
        metadata_path = drama_dir / "剧集信息.txt"

        remote_dir = f"{self.remote_dir}/{self.drama_name}".strip("/")

        # 上传封面文件
        if cover_path.exists():
            try:
                print(f"INFO:上传封面文件: {cover_path}")
                await self.uploader.upload(
                    local_path=str(cover_path),
                    remote_path=remote_dir,
                    on_progress=lambda x, y: None  # 封面文件小，不需要进度回调
                )
                print(f"INFO:✓ 封面文件上传成功")
                # 保存上传状态
                self.task_manager.task.cover_uploaded = True
                self.task_manager.save()
            except Exception as e:
                print(f"WARN:封面文件上传失败: {e}")
        else:
            print(f"INFO:封面文件不存在，跳过: {cover_path}")

        # 上传元数据文件
        if metadata_path.exists():
            try:
                print(f"INFO:上传元数据文件: {metadata_path}")
                await self.uploader.upload(
                    local_path=str(metadata_path),
                    remote_path=remote_dir,
                    on_progress=lambda x, y: None  # 元数据文件小，不需要进度回调
                )
                print(f"INFO:✓ 元数据文件上传成功")
                # 保存上传状态
                self.task_manager.task.metadata_uploaded = True
                self.task_manager.save()
            except Exception as e:
                print(f"WARN:元数据文件上传失败: {e}")
        else:
            print(f"INFO:元数据文件不存在，跳过: {metadata_path}")

    async def run(self, initial_episodes: List[int]):
        """启动队列处理器"""
        # 创建生产者和消费者任务
        producer_task = asyncio.create_task(self._producer(initial_episodes))
        consumer_tasks = [
            asyncio.create_task(self._consumer(i))
            for i in range(self.max_workers)
        ]

        # 等待生产者完成初始入队
        await self._initial_enqueue_done.wait()

        # 等待队列清空
        await self.task_queue.join()

        # 队列清空后，设置停止标志
        self._stop_event.set()

        # 等待生产者和消费者结束
        await producer_task
        await asyncio.gather(*consumer_tasks, return_exceptions=True)

        # 所有剧集上传完成后，上传封面和元数据文件
        if self.completed_count > 0:
            await self._upload_cover_and_metadata()

        return self.completed_count, self.failed_count

    def stop(self):
        """停止队列处理器"""
        self._stop_event.set()


# ============================================================================
# 主控制器
# ============================================================================

class MissY:
    def __init__(self, user_id: str = "default"):
        DOWNLOAD_DIR.mkdir(parents=True, exist_ok=True)
        self.api = DramaAPI()
        self.auth = BaiduAuth(user_id)
        self.uploader = BaiduUploader(self.auth)
        self.downloader = Downloader()
        self._queue_processor: Optional[QueueProcessor] = None

    # ========================================================================
    # 1. parse 命令 - 解析分享文本，创建任务
    # ========================================================================
    async def parse(self, share_text: str) -> Optional[str]:
        drama_name, share_url = self._parse_share_text(share_text)
        drama_id = None
        extracted_name = drama_name

        if share_url:
            drama_id = await self._extract_drama_id(share_url)

        if not drama_id and drama_name:
            result = await self.api.search(drama_name)
            if result.get("code") in [200, 1]:
                items = result.get("data", [])
                if isinstance(items, list) and items:
                    for item in items:
                        if item.get("title") == drama_name:
                            drama_id = item.get("id")
                            extracted_name = item.get("title")
                            break
                    if not drama_id:
                        drama_id = items[0].get("id")
                        extracted_name = items[0].get("title", drama_name)

        if not drama_id:
            print("ERROR:无法获取短剧ID")
            return None

        if not extracted_name:
            detail = await self.api.get_detail(drama_id)
            if detail.get("code") in [200, 1]:
                data = detail.get("data", {})
                if isinstance(data, dict):
                    extracted_name = data.get("name") or data.get("title") or drama_id

        extracted_name = re.sub(r"[\u003c\u003e\":/\\|?*]", "_", extracted_name)

        drama_dir = self.downloader.download_dir / extracted_name
        task_manager = TaskManager(drama_dir)

        detail = await self.api.get_detail(drama_id)
        if detail.get("code") not in [200, 1]:
            print(f"ERROR:获取剧集详情失败: {detail.get('msg', '未知错误')}")
            return None

        data = detail.get("data", detail)
        all_episodes = (
            data.get("lists", []) if isinstance(data, dict) else data if isinstance(data, list) else []
        )

        # 提取短剧元数据
        drama_metadata = {}
        if isinstance(data, dict):
            drama_metadata = {
                "cover": data.get("cover", data.get("book_pic", "")),
                "author": data.get("author", ""),
                "category": data.get("category", ""),
                "desc": data.get("desc", data.get("description", "")),
                "duration": data.get("duration", ""),
            }

        task_manager.init_drama(drama_id, extracted_name, all_episodes, drama_metadata)

        # 下载封面并创建元数据文件
        await self._download_cover_and_create_metadata(task_manager, extracted_name)

        print(f"OK:{drama_id}")
        print(f"DRAMA_NAME:{extracted_name}")
        print(f"TOTAL_EPISODES:{len(all_episodes)}")
        print(f"TASK_DIR:{drama_dir}")

        return drama_id

    def _parse_share_text(self, text: str) -> Tuple[str, str]:
        url_pattern = r"https?://[^\s<>\"{}|\\^`\[\]]+"
        url_match = re.search(url_pattern, text)
        url = url_match.group(0).rstrip("/") if url_match else None

        name_pattern = r"《(.+?)》"
        name_match = re.search(name_pattern, text)
        name = name_match.group(1) if name_match else None

        return name, url

    async def _extract_drama_id(self, share_url: str) -> Optional[str]:
        if "/s/" not in share_url:
            return None

        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    share_url,
                    allow_redirects=False,
                    headers={
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                    },
                    timeout=aiohttp.ClientTimeout(total=5),
                ) as resp:
                    location = resp.headers.get("Location", "")
                    if location:
                        from urllib.parse import urlparse, parse_qs

                        redirect_url = urlparse(location)
                        scheme_params = parse_qs(redirect_url.query).get(
                            "schemeParams", []
                        )
                        if scheme_params:
                            try:
                                params = json.loads(
                                    urllib.parse.unquote(scheme_params[0])
                                )
                                return params.get("video_series_id")
                            except:
                                pass
        except:
            pass
        return None

    async def _download_cover_and_create_metadata(self, task_manager: TaskManager, drama_name: str):
        """下载封面图片并创建元数据文件"""
        drama_dir = task_manager.drama_dir
        task = task_manager.task

        # 下载短剧封面
        if task.cover:
            cover_path = drama_dir / "cover.jpg"
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(
                        task.cover,
                        headers={"User-Agent": "Mozilla/5.0"},
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        if resp.status == 200:
                            content = await resp.read()
                            with open(cover_path, "wb") as f:
                                f.write(content)
                            print(f"INFO:封面已下载: {cover_path}")
                        else:
                            print(f"WARN:封面下载失败 HTTP {resp.status}")
            except Exception as e:
                print(f"WARN:封面下载失败: {e}")

        # 创建元数据文件
        metadata_path = drama_dir / "剧集信息.txt"
        try:
            with open(metadata_path, "w", encoding="utf-8") as f:
                f.write("=================================\n")
                f.write(f"标题: {task.drama_name}\n")
                f.write("=================================\n\n")

                if task.author:
                    f.write(f"作者: {task.author}\n")
                if task.category:
                    f.write(f"分类: {task.category}\n")
                f.write(f"总集数: {task.total_episodes}\n\n")

                if task.cover:
                    f.write(f"封面: {task.cover}\n")

                if task.desc:
                    f.write(f"\n简介:\n{task.desc}\n")

                f.write("\n=================================\n")

            print(f"INFO:元数据文件已创建: {metadata_path}")
        except Exception as e:
            print(f"WARN:元数据文件创建失败: {e}")

    # ========================================================================
    # 2. sync 命令 - 同步下载上传（队列版本）
    # ========================================================================
    async def sync(self, drama_id: str, episodes: list = None, remote_dir: str = ""):
        drama_dir = None
        drama_name = None

        for d in self.downloader.download_dir.iterdir():
            if d.is_dir() and (d / "task.json").exists():
                try:
                    with open(d / "task.json", "r", encoding="utf-8") as f:
                        task_data = json.load(f)
                        if task_data.get("drama_id") == drama_id:
                            drama_dir = d
                            drama_name = task_data.get("drama_name", drama_id)
                            break
                except:
                    pass

        if not drama_dir:
            print(f"ERROR:未找到剧ID {drama_id} 的任务")
            return

        task_manager = TaskManager(drama_dir)

        if task_manager.task.is_running():
            print(f"SKIP:短剧《{drama_name}》正在下载中 (PID: {task_manager.task.pid})")
            return

        if not await self.auth.ensure_valid_token():
            print("ERROR:百度网盘未登录，请先运行: missy login")
            return

        # 启动时重置异常终止的任务状态（进程崩溃、被kill等情况）
        # 检查是否有残留的 DOWNLOADING/UPLOADING 状态（说明上次异常终止）
        has_stale_state = False
        for idx_str, ep in task_manager.task.episodes.items():
            if ep.status in [TaskStatus.DOWNLOADING, TaskStatus.UPLOADING]:
                has_stale_state = True
                break

        if has_stale_state:
            reset_count = 0
            for idx_str, ep in task_manager.task.episodes.items():
                if ep.status in [TaskStatus.DOWNLOADING, TaskStatus.UPLOADING, TaskStatus.FAILED]:
                    task_manager.set_status(int(idx_str), TaskStatus.PENDING)
                    # 只重置重试次数和错误信息，不清空 video_url（只有遇到403时才清空）
                    task_manager.update_episode(int(idx_str), retry_count=0, error="")
                    reset_count += 1
            print(f"INFO:检测到异常终止的任务，已重置 {reset_count} 个剧集的状态和重试次数")

        task_manager.set_pid(os.getpid())

        if episodes:
            indices_to_download = episodes
        else:
            indices_to_download = task_manager.get_pending_episodes()

        if not indices_to_download:
            print(f"SKIP:没有需要下载的剧集")
            task_manager.set_pid(None)
            return

        print(f"DRAMA_ID:{drama_id}")
        print(f"DRAMA_NAME:{drama_name}")
        print(f"TO_DOWNLOAD:{len(indices_to_download)}")
        print(f"WORKERS:{MAX_WORKERS}")

        # 创建队列处理器
        self._queue_processor = QueueProcessor(
            task_manager=task_manager,
            api=self.api,
            auth=self.auth,
            uploader=self.uploader,
            downloader=self.downloader,
            drama_name=drama_name,
            remote_dir=remote_dir,
            max_workers=MAX_WORKERS,
        )

        try:
            completed, failed = await self._queue_processor.run(indices_to_download)
            print(f"DONE:{completed}/{completed + failed}")
        except Exception as e:
            print(f"ERROR:队列处理异常: {e}")
        finally:
            task_manager.set_pid(None)

    # ========================================================================
    # 3. stop 命令 - 停止任务
    # ========================================================================
    def stop(self, drama_id: str):
        if drama_id and drama_id.startswith("#"):
            drama_id = drama_id[1:]

        drama_dir = None
        for d in self.downloader.download_dir.iterdir():
            if d.is_dir() and (d / "task.json").exists():
                try:
                    with open(d / "task.json", "r", encoding="utf-8") as f:
                        task_data = json.load(f)
                        if task_data.get("drama_id") == drama_id:
                            drama_dir = d
                            break
                except:
                    pass

        if not drama_dir:
            print(f"ERROR:未找到剧ID {drama_id} 的任务")
            return

        task_manager = TaskManager(drama_dir)
        task = task_manager.task

        if not task.is_running():
            print(f"SKIP:任务未在运行 (PID: {task.pid})")
            if task.pid:
                task_manager.set_pid(None)
            return

        pid = task.pid
        try:
            import signal
            os.kill(pid, signal.SIGTERM)
            for _ in range(10):
                try:
                    os.kill(pid, 0)
                    time.sleep(0.5)
                except ProcessLookupError:
                    break
            else:
                try:
                    os.kill(pid, signal.SIGKILL)
                except:
                    pass

            print(f"OK:已停止任务 (PID: {pid})")
        except Exception as e:
            print(f"ERROR:停止任务失败: {e}")
            return

        task_manager.set_pid(None)

        # 重置所有未完成任务的状态和重试次数
        reset_count = 0
        for idx_str, ep in task_manager.task.episodes.items():
            if ep.status in [TaskStatus.DOWNLOADING, TaskStatus.UPLOADING, TaskStatus.FAILED]:
                # 重置状态为 pending
                task_manager.set_status(int(idx_str), TaskStatus.PENDING)
                # 只重置重试次数和错误信息，不清空 video_url（只有遇到403时才清空）
                task_manager.update_episode(int(idx_str), retry_count=0, error="")
                reset_count += 1

        print(f"OK:任务已重置，已重置 {reset_count} 个未完成剧集的重试次数，可重新运行 sync 命令")

    # ========================================================================
    # 4. status 命令 - 查看任务状态
    # ========================================================================
    def status(self, drama_id: str = None, verbose: bool = False):
        if drama_id and drama_id.startswith("#"):
            drama_id = drama_id[1:]

        if drama_id:
            drama_dir = None
            for d in self.downloader.download_dir.iterdir():
                if d.is_dir() and (d / "task.json").exists():
                    try:
                        with open(d / "task.json", "r", encoding="utf-8") as f:
                            task_data = json.load(f)
                            if task_data.get("drama_id") == drama_id:
                                drama_dir = d
                                break
                    except:
                        pass

            if drama_dir:
                self._print_task_status(drama_dir, verbose)
            else:
                print(f"ERROR:未找到剧ID {drama_id} 的任务")
        else:
            if not self.downloader.download_dir.exists():
                print("暂无任务")
                return

            # 排除 archive 目录
            task_dirs = [
                d for d in self.downloader.download_dir.iterdir()
                if d.is_dir()
                and d.name != "archive"
                and (d / "task.json").exists()
            ]

            if not task_dirs:
                print("暂无任务")
                return

            print(f"共有 {len(task_dirs)} 个任务:\n")
            # 按时间倒序排序（最新的在前）
            for d in sorted(task_dirs, key=lambda x: (x / "task.json").stat().st_mtime, reverse=True):
                self._print_task_summary(d)

    def _print_task_summary(self, drama_dir: Path):
        task_manager = TaskManager(drama_dir)
        task = task_manager.task
        summary = task.get_summary()

        completed = summary.get(TaskStatus.COMPLETED.value, 0)
        total = task.total_episodes
        failed = summary.get(TaskStatus.FAILED.value, 0)
        downloading = summary.get(TaskStatus.DOWNLOADING.value, 0)

        progress = f"{completed}/{total}" if total > 0 else "-"
        percent = completed / total * 100 if total > 0 else 0

        if task.is_completed():
            mark = "✅"
        elif failed > 0:
            mark = "⚠️"
        elif downloading > 0:
            mark = "⬇️"
        else:
            mark = "⏳"

        running_status = ""
        if task.is_running():
            running_status = f" [运行中 PID:{task.pid}]"

        print(f"{mark} {task.drama_name}{running_status}")
        print(f"   ID: #{task.drama_id}")
        print(f"   进度: {progress} ({percent:.0f}%)")
        if failed > 0:
            print(f"   失败: {failed} 集")
        print()

    def _print_task_status(self, drama_dir: Path, verbose: bool):
        task_manager = TaskManager(drama_dir)
        task = task_manager.task

        print(f"\n{'='*50}")
        print(f"剧名: {task.drama_name}")
        print(f"ID: #{task.drama_id}")
        print(f"总集数: {task.total_episodes}")
        if task.is_running():
            print(f"状态: 运行中 (PID: {task.pid})")
        print(f"{'='*50}\n")

        summary = task.get_summary()
        print("状态统计:")
        for status in TaskStatus:
            count = summary.get(status.value, 0)
            if count > 0:
                print(f"  {status.value}: {count}")

        if verbose:
            print("\n分集详情:")
            for idx_str in sorted(task.episodes.keys(), key=int):
                ep = task.episodes[idx_str]
                icons = {
                    TaskStatus.COMPLETED.value: "✅",
                    TaskStatus.FAILED.value: "❌",
                    TaskStatus.DOWNLOADING.value: "⬇️",
                    TaskStatus.UPLOADING.value: "⬆️",
                    TaskStatus.DOWNLOADED.value: "📥",
                    TaskStatus.PENDING.value: "⏳",
                }
                progress_str = ""
                if ep.status == TaskStatus.DOWNLOADING and ep.file_size > 0:
                    percent = ep.downloaded_size / ep.file_size * 100
                    progress_str = f" ({percent:.1f}%)"
                elif ep.status == TaskStatus.UPLOADING and ep.file_size > 0:
                    percent = ep.uploaded_size / ep.file_size * 100
                    progress_str = f" ({percent:.1f}%)"
                elif ep.status == TaskStatus.COMPLETED:
                    progress_str = " (100%)"
                print(f"  {icons.get(ep.status.value, '❓')} 第{idx_str}集 - {ep.status.value}{progress_str}")

    # ========================================================================
    # 5. login/logout 命令
    # ========================================================================
    async def login(self):
        if self.auth.is_authenticated():
            if await self.auth.ensure_valid_token():
                print("ALREADY_LOGGED_IN")
                return

        result = await self.auth.login()
        if result:
            print("OK:登录成功")
        else:
            print("ERROR:登录失败")

    def logout(self):
        if self.auth.logout():
            print("OK:已退出登录")
        else:
            print("ERROR:退出登录失败")

    # ========================================================================
    # Archive 功能
    # ========================================================================
    def archive_run(self):
        """执行归档：将完成超过3天的任务移动到archive目录"""
        if not self.downloader.download_dir.exists():
            print("ERROR:下载目录不存在")
            return

        archive_dir = self.downloader.download_dir / "archive"
        archive_dir.mkdir(exist_ok=True)

        now = time.time()
        three_days = 3 * 24 * 60 * 60

        task_dirs = [
            d for d in self.downloader.download_dir.iterdir()
            if d.is_dir()
            and d.name != "archive"
            and (d / "task.json").exists()
        ]

        archived_count = 0
        for drama_dir in task_dirs:
            try:
                task_manager = TaskManager(drama_dir)
                task = task_manager.task

                # 只归档已完成的任务
                if not task.is_completed():
                    continue

                # 检查最后完成时间
                task_json_path = drama_dir / "task.json"
                task_mtime = task_json_path.stat().st_mtime

                # 如果完成时间超过3天
                if now - task_mtime > three_days:
                    target_dir = archive_dir / drama_dir.name

                    # 如果目标目录已存在，添加时间戳
                    if target_dir.exists():
                        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                        target_dir = archive_dir / f"{drama_dir.name}_{timestamp}"

                    # 移动目录
                    shutil.move(str(drama_dir), str(target_dir))
                    print(f"✓ 已归档: {task.drama_name}")
                    archived_count += 1

            except Exception as e:
                print(f"ERROR:归档失败 {drama_dir.name}: {e}")

        if archived_count == 0:
            print("没有需要归档的任务（已完成且超过3天）")
        else:
            print(f"\n归档完成！共归档 {archived_count} 个任务")

    def archive_list(self, verbose: bool = False):
        """列出归档的任务"""
        archive_dir = self.downloader.download_dir / "archive"

        if not archive_dir.exists():
            print("暂无归档任务")
            return

        task_dirs = [
            d for d in archive_dir.iterdir()
            if d.is_dir() and (d / "task.json").exists()
        ]

        if not task_dirs:
            print("暂无归档任务")
            return

        print(f"共有 {len(task_dirs)} 个归档任务:\n")
        for d in sorted(task_dirs, key=lambda x: x.stat().st_mtime, reverse=True):
            self._print_archived_task_summary(d, verbose)

    def _print_archived_task_summary(self, drama_dir: Path, verbose: bool):
        """打印归档任务摘要"""
        try:
            with open(drama_dir / "task.json", "r", encoding="utf-8") as f:
                task_data = json.load(f)

            drama_name = task_data.get("drama_name", "未知")
            drama_id = task_data.get("drama_id", "未知")
            total_episodes = task_data.get("total_episodes", 0)

            # 统计完成状态
            episodes = task_data.get("episodes", {})
            completed = sum(1 for ep in episodes.values() if ep.get("status") == "completed")

            # 获取归档时间（目录修改时间）
            archive_time = datetime.datetime.fromtimestamp(drama_dir.stat().st_mtime)
            archive_time_str = archive_time.strftime("%Y-%m-%d %H:%M")

            progress = f"{completed}/{total_episodes}" if total_episodes > 0 else "-"
            percent = completed / total_episodes * 100 if total_episodes > 0 else 0

            print(f"📦 {drama_name}")
            print(f"   ID: #{drama_id}")
            print(f"   进度: {progress} ({percent:.0f}%)")
            print(f"   归档时间: {archive_time_str}")

            if verbose:
                # 显示本地路径
                print(f"   本地路径: {drama_dir}")

            print()
        except Exception as e:
            print(f"ERROR:读取归档任务失败 {drama_dir.name}: {e}")


# ============================================================================
# 命令行入口
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="MissY - 短剧下载器 (队列版本)")
    subparsers = parser.add_subparsers(dest="command", help="命令")

    parse_p = subparsers.add_parser("parse", help="解析分享文本，创建任务")
    parse_p.add_argument("text", help="分享文本（包含剧名和链接）")

    sync_p = subparsers.add_parser("sync", help="同步下载上传剧集")
    sync_p.add_argument("drama_id", help="短剧ID（格式：#ID 或 ID）")
    sync_p.add_argument("-e", "--episodes", nargs="+", type=int, help="指定集数（默认全部）")
    sync_p.add_argument("-r", "--remote-dir", default="", help="远程目录")

    stop_p = subparsers.add_parser("stop", help="停止任务")
    stop_p.add_argument("drama_id", help="短剧ID（格式：#ID 或 ID）")

    status_p = subparsers.add_parser("status", help="查看任务状态")
    status_p.add_argument("drama_id", nargs="?", default=None, help="短剧ID（格式：#ID 或 ID，默认列出所有）")
    status_p.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")

    login_p = subparsers.add_parser("login", help="登录百度网盘")

    logout_p = subparsers.add_parser("logout", help="退出百度网盘登录")

    # Archive 子命令
    archive_p = subparsers.add_parser("archive", help="管理归档任务")
    archive_subparsers = archive_p.add_subparsers(dest="archive_command", help="归档子命令")

    archive_list_p = archive_subparsers.add_parser("list", help="列出归档任务")
    archive_list_p.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")

    archive_run_p = archive_subparsers.add_parser("run", help="执行归档（将完成>7天的任务归档）")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    missy = MissY()

    if args.command == "parse":
        asyncio.run(missy.parse(args.text))
    elif args.command == "sync":
        drama_id = args.drama_id
        if drama_id.startswith("#"):
            drama_id = drama_id[1:]
        asyncio.run(missy.sync(drama_id, args.episodes, args.remote_dir))
    elif args.command == "stop":
        missy.stop(args.drama_id)
    elif args.command == "status":
        missy.status(args.drama_id, args.verbose)
    elif args.command == "login":
        asyncio.run(missy.login())
    elif args.command == "logout":
        missy.logout()
    elif args.command == "archive":
        if args.archive_command == "list":
            missy.archive_list(args.verbose)
        elif args.archive_command == "run":
            missy.archive_run()
        else:
            asyncio.run(missy.parse(""))  # Will show help
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
