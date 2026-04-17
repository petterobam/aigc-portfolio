#!/usr/bin/env python3
"""
检查41号故事所有章节的重复率
"""

import os
import re
from collections import defaultdict


def find_duplicate_paragraphs(content, min_length=30):
    """找出文件中的重复段落"""
    # 移除标题行（# 开头的行）
    lines = [line for line in content.split("\n") if not line.strip().startswith("#")]

    # 按段落分割（空行分隔）
    paragraphs = []
    current_para = []

    for line in lines:
        if line.strip():  # 非空行
            current_para.append(line)
        else:  # 空行，段落结束
            if current_para:
                para = "\n".join(current_para).strip()
                if len(para) >= min_length:  # 只检查长段落
                    paragraphs.append(para)
                current_para = []

    # 检查最后一个段落
    if current_para:
        para = "\n".join(current_para).strip()
        if len(para) >= min_length:
            paragraphs.append(para)

    # 找重复段落
    seen = defaultdict(list)
    exact_duplicates = []
    similar_paragraphs = []

    for i, para in enumerate(paragraphs):
        # 移除首尾空格，统一标点符号
        normalized = re.sub(r"\s+", " ", para.strip())

        if normalized in seen:
            exact_duplicates.append(
                {
                    "paragraph": para[:100] + "..." if len(para) > 100 else para,
                    "first_occurrence": seen[normalized][0],
                    "duplicate_occurrences": seen[normalized][1:] + [i],
                }
            )
        else:
            seen[normalized].append(i)

    # 找高度相似的段落
    seen_similar = defaultdict(list)
    for i, para in enumerate(paragraphs):
        normalized = re.sub(r"\s+", " ", para.strip())
        if len(normalized) < 30:  # 跳过太短的段落
            continue

        # 简化相似度检查：只比较前80%的内容
        similarity_key = normalized[: int(len(normalized) * 0.8)]
        if similarity_key in seen_similar:
            similar_paragraphs.append(
                {
                    "paragraph": para[:100] + "..." if len(para) > 100 else para,
                    "first_occurrence": seen_similar[similarity_key][0],
                    "similar_occurrences": seen_similar[similarity_key][1:] + [i],
                }
            )
        else:
            seen_similar[similarity_key].append(i)

    return exact_duplicates, similar_paragraphs, len(paragraphs)


def check_file(file_path):
    """检查单个文件的重复率"""
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    exact_duplicates, similar_paragraphs, total_paragraphs = find_duplicate_paragraphs(
        content
    )

    exact_count = len(exact_duplicates)
    similar_count = len(similar_paragraphs)
    total_issues = exact_count + similar_count

    if total_paragraphs > 0:
        duplicate_rate = (total_issues / total_paragraphs) * 100
    else:
        duplicate_rate = 0

    # 评级
    if exact_count == 0 and similar_count <= 10:
        rating = "✅ 优秀"
    elif exact_count == 0 and similar_count <= 20:
        rating = "⚠️ 合格"
    else:
        rating = "❌ 不合格"

    result = {
        "file_path": file_path,
        "total_paragraphs": total_paragraphs,
        "exact_duplicates": exact_count,
        "similar_paragraphs": similar_count,
        "total_issues": total_issues,
        "duplicate_rate": round(duplicate_rate, 2),
        "rating": rating,
    }

    return result


def main():
    # 41号故事的章节文件路径
    story_dir = "~/.openclaw/workspace/番茄短篇故事集/stories/041-读心诡校_同学都在演戏/content"

    chapters = [
        "chapter1.md",
        "chapter2.md",
        "chapter02_v4.md",
        "chapter3.md",
        "chapter3-optimized-final-v5.md",
        "chapter4.md",
        "chapter4-optimized-v2.md",
        "chapter5.md",
        "chapter5-optimized-v1.md",
        "chapter6.md",
        "chapter6-optimized-v1.md",
    ]

    print("=" * 60)
    print("检查41号故事所有章节的重复率")
    print("=" * 60)
    print()

    results = []
    for chapter in chapters:
        file_path = os.path.join(story_dir, chapter)
        if os.path.exists(file_path):
            result = check_file(file_path)
            results.append(result)
            print(f"文件: {chapter}")
            print(f"  总段落数: {result['total_paragraphs']}")
            print(f"  完全重复: {result['exact_duplicates']}段")
            print(f"  高度相似: {result['similar_paragraphs']}段")
            print(f"  总问题数: {result['total_issues']}个")
            print(f"  重复率: {result['duplicate_rate']}%")
            print(f"  评级: {result['rating']}")
            print()

    # 汇总
    print("=" * 60)
    print("汇总")
    print("=" * 60)
    print(f"总共检查了 {len(results)} 个章节文件")
    print()

    # 找出需要优化的章节
    needs_optimization = [
        r for r in results if r["rating"] == "❌ 不合格" or r["duplicate_rate"] > 5.0
    ]
    if needs_optimization:
        print("需要优化的章节:")
        for r in needs_optimization:
            print(
                f"  - {os.path.basename(r['file_path'])} (重复率: {r['duplicate_rate']}%)"
            )
    else:
        print("所有章节重复率都在可接受范围内")


if __name__ == "__main__":
    main()
