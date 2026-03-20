#!/usr/bin/env python3
"""
定位重复段落的具体位置（章节 + 行号）
"""
import os
import re
from pathlib import Path

def find_duplicate_locations(story_path):
    """定位一个故事中所有重复段落的位置"""
    story_name = os.path.basename(story_path)
    content_dir = os.path.join(story_path, 'content')

    if not os.path.exists(content_dir):
        return

    print(f"\n{'='*60}")
    print(f"定位重复段落：{story_name}")
    print(f"{'='*60}")

    # 读取所有章节文件，记录每个段落的位置
    paragraphs_info = {}  # {normalized_text: [(file, line_num, original_text), ...]}
    chapter_files = sorted([f for f in os.listdir(content_dir)
                          if f.startswith('chapter-') and f.endswith('.md')])

    for chapter_file in chapter_files:
        file_path = os.path.join(content_dir, chapter_file)

        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # 按段落分割
        current_para = []
        para_start_line = 0

        for i, line in enumerate(lines, 1):
            # 跳过标题行
            if line.strip().startswith('#'):
                continue

            if line.strip():  # 非空行
                if not current_para:
                    para_start_line = i
                current_para.append(line.rstrip('\n'))
            else:  # 空行，段落结束
                if current_para:
                    para = '\n'.join(current_para).strip()
                    if len(para) >= 30:  # 只检查长段落
                        normalized = re.sub(r'\s+', ' ', para)

                        if normalized not in paragraphs_info:
                            paragraphs_info[normalized] = []

                        paragraphs_info[normalized].append({
                            'file': chapter_file,
                            'line': para_start_line,
                            'text': para
                        })

                    current_para = []

        # 检查最后一个段落
        if current_para:
            para = '\n'.join(current_para).strip()
            if len(para) >= 30:
                normalized = re.sub(r'\s+', ' ', para)
                if normalized not in paragraphs_info:
                    paragraphs_info[normalized] = []
                paragraphs_info[normalized].append({
                    'file': chapter_file,
                    'line': para_start_line,
                    'text': para
                })

    # 找出重复段落
    duplicates_found = 0
    for normalized, locations in paragraphs_info.items():
        if len(locations) > 1:  # 重复了
            duplicates_found += 1
            print(f"\n❌ 重复段落 {duplicates_found}（长度：{len(normalized)} 字）:")
            print(f"   内容：{normalized[:100]}...")

            for i, loc in enumerate(locations, 1):
                print(f"   位置 {i}: {loc['file']} 第 {loc['line']} 行")

    if duplicates_found == 0:
        print(f"✅ 无重复段落")
    else:
        print(f"\n总计：{duplicates_found} 个重复段落")

    return duplicates_found

# 主程序
if __name__ == '__main__':
    base_dir = Path("/Users/oyjie/.openclaw/workspace/番茄短篇故事集/stories/归档故事集")

    stories = [
        "31_历史翻盘_崇祯听见心声_大明朝起死回生",
        "32_断亲复仇_养父母vs亲生父母_他们跪求原谅",
        "33_职场逆袭_AI替代_主管PUA说AI能代替我"
    ]

    total_duplicates = 0

    for story in stories:
        story_path = base_dir / story
        if story_path.exists():
            duplicates = find_duplicate_locations(story_path)
            if duplicates:
                total_duplicates += duplicates

    print(f"\n{'='*60}")
    print(f"总计发现 {total_duplicates} 个重复段落")
    print(f"{'='*60}")
