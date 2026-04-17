#!/usr/bin/env python3
"""
彻底修复32号故事的重复段落
"""
import os
from pathlib import Path

def fix_story_32_all():
    """彻底修复32号故事的所有重复段落"""
    story_path = Path("~/.openclaw/workspace/番茄短篇故事集/stories/归档故事集/32_断亲复仇_养父母vs亲生父母_他们跪求原谅/content")

    print("彻底修复32号故事...")

    # 1. 修复 chapter-001.md 的第二个重复
    file_path = story_path / "chapter-001.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 修复"家人"重复
    original1 = '"家人？"我看着他，"家人是那些在你最无助时给你温暖的人，而不是那些在你成功后才想起来的人。"'
    if content.count(original1) > 1:
        content = content.replace(original1, '"家人？"我直视着他，"真正的家人是在你最无助时伸出援手的人，而不是等你成功了才来攀亲戚的人。"', 1)
        print(f"  ✅ 修复 chapter-001.md 重复2")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 2. 修复 chapter-003.md 和 chapter-004.md 的跨章节重复
    # 删除 chapter-004.md 中的重复文件记录
    file_path = story_path / "chapter-004.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 找到文件记录部分并删除（第51-53行附近）
    new_lines = []
    skip_next = 0

    for i, line in enumerate(lines):
        if skip_next > 0:
            skip_next -= 1
            continue

        # 跳过重复的文件记录
        if '文件2：亲生父母的遗弃证明' in line:
            print(f"  ✅ 删除 chapter-004.md 第{i+1}行的重复文件记录")
            continue
        if '文件3：养父母的抚养记录' in line:
            print(f"  ✅ 删除 chapter-004.md 第{i+1}行的重复文件记录")
            continue

        # 跳过重复的"现在他们暴富了"
        if '现在他们暴富了，发现我是名校毕业生，想认我回去' in line:
            print(f"  ✅ 删除 chapter-004.md 第{i+1}行的重复表述")
            continue
        if '现在他们暴富了，发现她是名校毕业生，想认她回去' in line:
            # 改写而不是删除
            line = line.replace(
                '现在他们暴富了，发现她是名校毕业生，想认她回去"光宗耀祖"。',
                '如今亲生父母发了财，得知女儿是名校毕业，便想把人认回去"光宗耀祖"。'
            )
            print(f"  ✅ 改写 chapter-004.md 第{i+1}行")

        # 跳过重复的道德绑架
        if '他们道德绑架，说' in line and '血缘不能断' in line:
            print(f"  ✅ 删除 chapter-004.md 第{i+1}行的重复表述")
            continue

        # 跳过重复的"血缘不能断"
        if '而现在，他们被亲生父母欺负，警察却说血缘不能断' in line:
            # 改写
            line = line.replace(
                '而现在，他们被亲生父母欺负，警察却说血缘不能断，家庭纠纷要和和气气解决。',
                '然而现实是，养父母被亲生父母欺负，警方却以"血缘关系"为由，建议"家庭内部协商解决"。'
            )
            print(f"  ✅ 改写 chapter-004.md 第{i+1}行")

        new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    # 3. 修复 chapter-005.md 的重复网友评论
    file_path = story_path / "chapter-005.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    seen_comments = set()

    for i, line in enumerate(lines):
        # 检查是否是重复的网友评论
        if '用户"' in line and '：" ' in line:
            if line in seen_comments:
                print(f"  ✅ 删除 chapter-005.md 第{i+1}行的重复网友评论")
                continue
            seen_comments.add(line)

        new_lines.append(line)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)

    # 4. 修复 chapter-006.md 的重复
    file_path = story_path / "chapter-006.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = '林晓相信，真正的家人，是那些在你最无助时给你温暖的人，而不是那些在你成功后才想起来的人。'
    if content.count(original) > 1:
        content = content.replace(original, '林晓深知，真正的亲人是在她最艰难时刻给予温暖的人，而非等她功成名就才来相认的人。', 1)
        print(f"  ✅ 修复 chapter-006.md 重复")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 5. 修复 chapter-008.md 和 chapter-009.md 的跨章节重复
    file_path = story_path / "chapter-009.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original = '林晓："我为什么要原谅？你们从来没在乎过我，在乎的只是我的价值。"'
    if original in content:
        content = content.replace(original, '林晓冷冷道："原谅？你们从未在意过我，在意的不过是我能带来的利益罢了。"')
        print(f"  ✅ 修复 chapter-009.md 跨章节重复")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ 32号故事修复完成")

# 主程序
if __name__ == '__main__':
    print("="*60)
    print("彻底修复32号故事")
    print("="*60)

    fix_story_32_all()

    print("\n" + "="*60)
    print("修复完成！请重新运行检测脚本验证")
    print("="*60)
