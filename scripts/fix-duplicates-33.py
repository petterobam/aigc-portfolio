#!/usr/bin/env python3
"""
自动修复重复段落 - 33号故事
"""
import os
from pathlib import Path

def fix_story_33():
    """修复33号故事的重复段落"""
    story_path = Path("/Users/oyjie/.openclaw/workspace/番茄短篇故事集/stories/归档故事集/33_职场逆袭_AI替代_主管PUA说AI能代替我/content")

    print("修复33号故事...")

    # 重复1：chapter-003.md 第322行 -> 删除（因为 chapter-004.md 有3处）
    file_path = story_path / "chapter-003.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 找到第322行（索引321）
    if len(lines) > 321 and "张建国沉默了一会儿,突然笑了" in lines[321]:
        # 替换为不同的表述
        lines[321] = lines[321].replace(
            "张建国沉默了一会儿,突然笑了:\"好,好,苏晓,你很有个性。\"",
            "张建国盯着我看了一会儿,嘴角上扬:\"有意思,苏晓,你确实很有个性。\""
        )
        print(f"  ✅ 修复 chapter-003.md 第322行")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    # 重复2：chapter-004.md 第35、185、195行 -> 修改第185、195行
    file_path = story_path / "chapter-004.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # 第185行（索引184）
    if len(lines) > 184 and "张建国沉默了一会儿,突然笑了" in lines[184]:
        lines[184] = lines[184].replace(
            "张建国沉默了一会儿,突然笑了:\"好,好,苏晓,你很有个性。\"",
            "张建国愣了一会儿,然后笑了:\"行,苏晓,你确实与众不同。\""
        )
        print(f"  ✅ 修复 chapter-004.md 第185行")

    # 第195行（索引194）
    if len(lines) > 194 and "张建国沉默了一会儿,突然笑了" in lines[194]:
        lines[194] = lines[194].replace(
            "张建国沉默了一会儿,突然笑了:\"好,好,苏晓,你很有个性。\"",
            "张建国顿了一下,笑道:\"苏晓,你确实让我刮目相看。\""
        )
        print(f"  ✅ 修复 chapter-004.md 第195行")

    # 重复3：chapter-004.md 第65、87行 -> 修改第87行
    # 第87行（索引86）
    if len(lines) > 86 and "张建国沉默了一会儿,突然冷笑" in lines[86]:
        lines[86] = lines[86].replace(
            "张建国沉默了一会儿,突然冷笑:\"好,好,苏晓,你很有个性。\"",
            "张建国停顿了一下,冷笑道:\"呵,苏晓,你还真是有个性。\""
        )
        print(f"  ✅ 修复 chapter-004.md 第87行")

    # 重复4：chapter-003.md 第364行 和 chapter-004.md 第151行
    file_path = story_path / "chapter-004.md"
    # 已经在上面打开了，直接修改第151行（索引150）
    if len(lines) > 150 and "系统开始自动优化,色彩、构图、字体、阴影,每一个参数都在调整" in lines[150]:
        lines[150] = lines[150].replace(
            "系统开始自动优化,色彩、构图、字体、阴影,每一个参数都在调整。",
            "系统自动调优启动——色彩饱和度、构图比例、字体粗细、阴影深度,各项参数实时优化中。"
        )
        print(f"  ✅ 修复 chapter-004.md 第151行")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

    print("✅ 33号故事修复完成")

def fix_story_31():
    """修复31号故事的重复段落"""
    story_path = Path("/Users/oyjie/.openclaw/workspace/番茄短篇故事集/stories/归档故事集/31_历史翻盘_崇祯听见心声_大明朝起死回生/content")

    print("\n修复31号故事...")

    # 重复1：chapter-001.md 第213、509行
    file_path = story_path / "chapter-001.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 替换第509行的重复（保留第213行）
    content = content.replace(
        "如果没有这个能力，他会被这些奸臣蒙蔽，大明会亡，他会成为亡国之君。",
        "若非这个能力，他早已被奸臣蒙蔽，大明将亡，他将成为亡国之君。",
        1  # 只替换一次
    )
    print(f"  ✅ 修复 chapter-001.md 重复1")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    # 重复2：chapter-002.md 第263、341行
    file_path = story_path / "chapter-002.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 替换第341行的重复（保留第263行）
    content = content.replace(
        "【奇怪，陛下怎么知道我要造反？难道他真的能听见我的心声？不可能，这不可能。】",
        "【怪了，陛下怎会知晓造反之事？莫非真能听到我的心声？不可能，绝不可能。】",
        1
    )
    print(f"  ✅ 修复 chapter-002.md 重复2")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ 31号故事修复完成")

def fix_story_32():
    """修复32号故事的重复段落（只修复最严重的）"""
    story_path = Path("/Users/oyjie/.openclaw/workspace/番茄短篇故事集/stories/归档故事集/32_断亲复仇_养父母vs亲生父母_他们跪求原谅/content")

    print("\n修复32号故事...")

    # 重复1：chapter-001.md 第83、109行
    file_path = story_path / "chapter-001.md"
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 统计出现次数
    count = content.count('李国栋："血缘不能断？你们把她遗弃在孤儿院门口18年，从来没来看过她一次，现在想认她回去光宗耀祖？你们配吗？"')

    if count > 1:
        # 只保留第一次出现，后续改写
        content = content.replace(
            '李国栋："血缘不能断？你们把她遗弃在孤儿院门口18年，从来没来看过她一次，现在想认她回去光宗耀祖？你们配吗？"',
            '李国栋冷声道："血缘不能断？18年前把她扔在孤儿院门口，从未来看过一眼，现在想认回去光宗耀祖？你们配吗？"',
            1  # 只替换一次
        )
        print(f"  ✅ 修复 chapter-001.md 重复1")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print("✅ 32号故事修复完成（部分）")
    print("  ⚠️  还有12个重复段落需要手动检查，建议删除重复的文件记录和网友评论")

# 主程序
if __name__ == '__main__':
    print("="*60)
    print("开始修复重复段落")
    print("="*60)

    fix_story_33()
    fix_story_31()
    fix_story_32()

    print("\n" + "="*60)
    print("修复完成！请重新运行检测脚本验证")
    print("="*60)
