#!/usr/bin/env python3
"""
更严格地检测重复内容（30字以上）
"""

import os
import re
from collections import defaultdict
from pathlib import Path


def find_duplicates_strict(file_path, min_length=30):
    """更严格地找出文件中的重复内容"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 移除标题行和元数据
    lines = []
    for line in content.split("\n"):
        # 跳过标题、元数据标记
        if line.strip().startswith("#"):
            continue
        if line.strip() == "---":
            continue
        if "完】" in line or "预告" in line or "统计" in line:
            continue
        lines.append(line)

    # 按段落分割
    paragraphs = []
    current_para = []

    for line in lines:
        if line.strip():
            current_para.append(line)
        else:
            if current_para:
                para = "\n".join(current_para).strip()
                if len(para) >= min_length:
                    paragraphs.append(para)
                current_para = []

    if current_para:
        para = "\n".join(current_para).strip()
        if len(para) >= min_length:
            paragraphs.append(para)

    # 找重复
    seen = defaultdict(list)
    duplicates = []

    for i, para in enumerate(paragraphs):
        # 标准化：移除多余空格、统一标点
        normalized = re.sub(r"\s+", " ", para)

        if normalized in seen:
            duplicates.append(
                {
                    "length": len(para),
                    "content": para[:150] + "..." if len(para) > 150 else para,
                    "first_index": seen[normalized][0],
                    "duplicate_index": i,
                }
            )
        else:
            seen[normalized].append(i)

    return duplicates, len(paragraphs)


def check_full_story(story_path):
    """检查 full_story.md"""
    story_name = os.path.basename(story_path)
    full_story_path = os.path.join(story_path, "content", "full_story.md")

    if not os.path.exists(full_story_path):
        print(f"❌ full_story.md 不存在")
        return

    print(f"\n{'=' * 60}")
    print(f"检查：{story_name}")
    print(f"{'=' * 60}")

    # 统计文件信息
    file_size = os.path.getsize(full_story_path)
    with open(full_story_path, "r", encoding="utf-8") as f:
        content = f.read()
    total_chars = len(content)

    print(f"文件大小：{file_size / 1024:.1f} KB")
    print(f"总字数：{total_chars} 字")

    # 检测重复（30字以上）
    duplicates, total_paras = find_duplicates_strict(full_story_path, min_length=30)

    print(f"总段落数：{total_paras}")
    print(f"重复段落数：{len(duplicates)}")

    if duplicates:
        print(f"\n❌ 发现重复段落：")
        for i, dup in enumerate(duplicates[:10], 1):  # 显示前10个
            print(f"\n{i}. 长度：{dup['length']} 字")
            print(f"   内容：{dup['content']}")
    else:
        print(f"\n✅ 无重复段落（>=30字）")

    return len(duplicates)


# 主程序
if __name__ == "__main__":
    base_dir = Path("~/.openclaw/workspace/番茄短篇故事集/stories/归档故事集")

    stories = [
        "31_历史翻盘_崇祯听见心声_大明朝起死回生",
        "32_断亲复仇_养父母vs亲生父母_他们跪求原谅",
        "33_职场逆袭_AI替代_主管PUA说AI能代替我",
    ]

    total_duplicates = 0

    for story in stories:
        story_path = base_dir / story
        if story_path.exists():
            duplicates = check_full_story(story_path)
            if duplicates:
                total_duplicates += duplicates

    print(f"\n{'=' * 60}")
    print(f"总计发现 {total_duplicates} 个重复段落")
    print(f"{'=' * 60}")
