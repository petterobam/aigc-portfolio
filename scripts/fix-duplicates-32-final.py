#!/usr/bin/env python3
"""
最终修复32号故事的剩余4个重复段落
"""
import os
from pathlib import Path

def fix_story_32_final():
    """修复32号故事的剩余4个重复"""
    story_path = Path("~/.openclaw/workspace/番茄短篇故事集/stories/归档故事集/32_断亲复仇_养父母vs亲生父母_他们跪求原谅/content")

    print("修复32号故事剩余4个重复...")

    # 1. 修复"林建国不耐烦地说"重复
    file_path = story_path / "chapter-003.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = '林建国不耐烦地说："行了行了，过去的事就不提了，跟我们回去。"'
    if content.count(original) > 1:
        content = content.replace(original, '林建国不耐烦地挥挥手："行了，别翻旧账了，赶紧跟我们回家。"', 1)
        print(f"  ✅ 修复 chapter-003.md 重复1")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 2. 修复"如今亲生父母发了财"重复
    file_path = story_path / "chapter-004.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = '如今亲生父母发了财，得知女儿是名校毕业，便想把人认回去"光宗耀祖"。'
    if content.count(original) > 1:
        content = content.replace(original, '眼下亲生父母家业兴旺，得知女儿学业有成，便欲认亲以"光耀门楣"。', 1)
        print(f"  ✅ 修复 chapter-004.md 重复2")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 3. 修复网友评论重复 - chapter-005.md
    file_path = story_path / "chapter-005.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    seen_comments = {}

    for i, line in enumerate(lines):
        # 检查是否是网友评论
        if '用户"法律支持"' in line or '用户"亲生父母恶心"' in line:
            comment_key = line.strip()

            if comment_key in seen_comments:
                # 重复了，删除
                print(f"  ✅ 删除 chapter-005.md 第{i+1}行的重复网友评论")
                continue
            else:
                seen_comments[comment_key] = i

        new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    print("✅ 32号故事修复完成")

# 主程序
if __name__ == '__main__':
    print("="*60)
    print("最终修复32号故事")
    print("="*60)

    fix_story_32_final()

    print("\n" + "="*60)
    print("修复完成！请重新运行检测脚本验证")
    print("="*60)
