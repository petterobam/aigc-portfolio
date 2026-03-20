#!/usr/bin/env python3
"""
批量清理章节文件末尾的元数据
"""
import os
import re
from pathlib import Path

def clean_chapter_file(file_path):
    """清理单个章节文件末尾的元数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 查找第一个 --- 分隔线的位置
    lines = content.split('\n')
    cut_index = None

    for i, line in enumerate(lines):
        if line.strip() == '---':
            cut_index = i
            break

    if cut_index is not None:
        # 截断 --- 及其后的所有内容
        cleaned_content = '\n'.join(lines[:cut_index])

        # 保存清理后的内容
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(cleaned_content)

        removed_lines = len(lines) - cut_index
        return True, removed_lines

    return False, 0

def clean_story(story_path):
    """清理一个故事的所有章节文件"""
    story_name = os.path.basename(story_path)
    print(f"\n{'='*60}")
    print(f"清理故事：{story_name}")
    print(f"{'='*60}")

    content_dir = os.path.join(story_path, 'content')
    if not os.path.exists(content_dir):
        print(f"❌ content 目录不存在")
        return

    chapter_files = sorted([f for f in os.listdir(content_dir)
                          if f.startswith('chapter-') and f.endswith('.md')])

    total_cleaned = 0
    total_removed = 0

    for chapter_file in chapter_files:
        file_path = os.path.join(content_dir, chapter_file)
        cleaned, removed = clean_chapter_file(file_path)

        if cleaned:
            print(f"✅ {chapter_file} - 清理了 {removed} 行")
            total_cleaned += 1
            total_removed += removed
        else:
            print(f"⏭️  {chapter_file} - 无需清理")

    print(f"\n总计：清理了 {total_cleaned} 个文件，删除了 {total_removed} 行")

    # 同时清理 full_story.md 的末尾标记
    full_story_path = os.path.join(content_dir, 'full_story.md')
    if os.path.exists(full_story_path):
        with open(full_story_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # 移除末尾的标记（【全文完】、【第X章 完】等）
        patterns = [
            r'\n---\s*\n\*\*【全文完】\*\*\s*$',
            r'\n---\s*\n【全文完】\s*$',
            r'\n\*\*【全文完】\*\*\s*$',
            r'\n【全文完】\s*$',
        ]

        modified = False
        for pattern in patterns:
            new_content = re.sub(pattern, '', content)
            if new_content != content:
                content = new_content
                modified = True
                print(f"✅ full_story.md - 移除了末尾标记")
                break

        if modified:
            with open(full_story_path, 'w', encoding='utf-8') as f:
                f.write(content)

# 主程序
if __name__ == '__main__':
    base_dir = Path("/Users/oyjie/.openclaw/workspace/番茄短篇故事集/stories/归档故事集")

    stories_to_clean = [
        "31_历史翻盘_崇祯听见心声_大明朝起死回生",
        "32_断亲复仇_养父母vs亲生父母_他们跪求原谅",
        "33_职场逆袭_AI替代_主管PUA说AI能代替我"
    ]

    for story in stories_to_clean:
        story_path = base_dir / story
        if story_path.exists():
            clean_story(story_path)
        else:
            print(f"❌ 故事不存在：{story}")

    print(f"\n{'='*60}")
    print(f"清理完成！")
    print(f"{'='*60}")
