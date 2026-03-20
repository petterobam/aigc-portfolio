#!/usr/bin/env python3
"""
提取 HEARTBEAT.md 中的历史记录到独立文件
"""
import re
import os
from pathlib import Path

# 文件路径
workspace = Path("/Users/oyjie/.openclaw/workspace")
heartbeat_file = workspace / "HEARTBEAT.md"
history_dir = workspace / "heartbeat-history" / "2026-03"

# 创建目录
history_dir.mkdir(parents=True, exist_ok=True)

# 读取 HEARTBEAT.md
with open(heartbeat_file, 'r', encoding='utf-8') as f:
    content = f.read()

# 提取所有历史记录（以 ## 📋 心跳执行记录 开头的部分）
pattern = r'## 📋 心跳执行记录（(.+?)）(.*?)(?=\n## 📋 心跳执行记录|\Z)'
matches = re.findall(pattern, content, re.DOTALL)

print(f"找到 {len(matches)} 条历史记录\n")

# 提取并保存每条记录
for i, (timestamp, record) in enumerate(matches):
    # 提取时间（例如：2026-03-19 10:00）
    time_match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', timestamp)
    if time_match:
        time_str = time_match.group(1)
        # 格式化为文件名（去除空格和冒号）
        filename = time_str.replace(' ', '-').replace(':', '') + '.md'
        filepath = history_dir / filename

        # 写入文件
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(f"# 心跳执行记录 - {time_str}\n\n")
            f.write(record.strip() + "\n")

        print(f"✅ 已保存: {filename}")

# 更新 latest.md（指向最新记录）
if matches:
    latest_timestamp, latest_record = matches[0]
    time_match = re.search(r'(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})', latest_timestamp)
    if time_match:
        time_str = time_match.group(1)
        filename = time_str.replace(' ', '-').replace(':', '') + '.md'
        filepath = history_dir / filename

        # 创建 latest.md 作为复制
        latest_file = workspace / "heartbeat-history" / "latest.md"
        with open(filepath, 'r', encoding='utf-8') as f:
            latest_content = f.read()

        with open(latest_file, 'w', encoding='utf-8') as f:
            f.write(latest_content)

        print(f"\n✅ 已更新 latest.md")

# 创建 stats.json（简单统计）
stats = {
    "total_records": len(matches),
    "date_range": {
        "earliest": matches[-1][0] if matches else None,
        "latest": matches[0][0] if matches else None
    },
    "records": [
        {
            "timestamp": match[0],
            "file": match[0].replace(' ', '-').replace(':', '') + '.md'
        }
        for match in matches
    ]
}

stats_file = workspace / "heartbeat-history" / "stats.json"
import json
with open(stats_file, 'w', encoding='utf-8') as f:
    json.dump(stats, f, ensure_ascii=False, indent=2)

print(f"\n✅ 已创建 stats.json")
print(f"\n📊 统计:")
print(f"   总记录数: {len(matches)}")
print(f"   最早记录: {matches[-1][0] if matches else 'N/A'}")
print(f"   最新记录: {matches[0][0] if matches else 'N/A'}")
