#!/usr/bin/env python3
"""
检测故事文件中的重复段落
"""
import os
import re
from pathlib import Path
from collections import defaultdict

def find_duplicate_paragraphs(file_path, min_length=50):
    """找出文件中的重复段落"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 移除标题行（# 开头的行）
    lines = [line for line in content.split('\n') if not line.strip().startswith('#')]
    
    # 按段落分割（空行分隔）
    paragraphs = []
    current_para = []
    
    for line in lines:
        if line.strip():  # 非空行
            current_para.append(line)
        else:  # 空行，段落结束
            if current_para:
                para = '\n'.join(current_para).strip()
                if len(para) >= min_length:  # 只检查长段落
                    paragraphs.append(para)
                current_para = []
    
    # 检查最后一个段落
    if current_para:
        para = '\n'.join(current_para).strip()
        if len(para) >= min_length:
            paragraphs.append(para)
    
    # 找重复段落
    seen = defaultdict(list)
    duplicates = []
    
    for i, para in enumerate(paragraphs):
        # 移除首尾空格，统一标点符号
        normalized = re.sub(r'\s+', ' ', para)
        
        if normalized in seen:
            duplicates.append({
                'paragraph': para[:100] + '...' if len(para) > 100 else para,
                'first_occurrence': seen[normalized][0],
                'duplicate_occurrences': seen[normalized][1:] + [i]
            })
        else:
            seen[normalized].append(i)
    
    return duplicates

def check_story(story_path):
    """检查一个故事的所有章节"""
    story_name = os.path.basename(story_path)
    print(f"\n{'='*60}")
    print(f"检查故事：{story_name}")
    print(f"{'='*60}")
    
    content_dir = os.path.join(story_path, 'content')
    if not os.path.exists(content_dir):
        print(f"❌ content 目录不存在")
        return
    
    # 检查每个章节文件
    chapter_files = sorted([f for f in os.listdir(content_dir) if f.startswith('chapter-') and f.endswith('.md')])
    
    total_duplicates = 0
    
    for chapter_file in chapter_files:
        file_path = os.path.join(content_dir, chapter_file)
        duplicates = find_duplicate_paragraphs(file_path, min_length=50)
        
        if duplicates:
            print(f"\n📄 {chapter_file} - 发现 {len(duplicates)} 个重复段落")
            total_duplicates += len(duplicates)
            
            for i, dup in enumerate(duplicates[:3], 1):  # 只显示前3个
                print(f"  {i}. 重复段落（长度：{len(dup['paragraph'])}）:")
                print(f"     {dup['paragraph'][:150]}...")
        else:
            print(f"✅ {chapter_file} - 无重复段落")
    
    # 检查 full_story.md 是否存在
    full_story_path = os.path.join(content_dir, 'full_story.md')
    if os.path.exists(full_story_path):
        print(f"\n📖 检查 full_story.md")
        duplicates = find_duplicate_paragraphs(full_story_path, min_length=100)
        
        if duplicates:
            print(f"❌ 发现 {len(duplicates)} 个重复段落（>=100字）")
            total_duplicates += len(duplicates)
            
            for i, dup in enumerate(duplicates[:5], 1):  # 只显示前5个
                print(f"  {i}. 重复段落:")
                print(f"     {dup['paragraph'][:200]}...")
        else:
            print(f"✅ full_story.md - 无重复段落")
    
    print(f"\n总计：{total_duplicates} 个重复段落")
    return total_duplicates

# 主程序
if __name__ == '__main__':
    base_dir = Path("/Users/oyjie/.openclaw/workspace/番茄短篇故事集/stories/归档故事集")
    
    stories_to_check = [
        "31_历史翻盘_崇祯听见心声_大明朝起死回生",
        "32_断亲复仇_养父母vs亲生父母_他们跪求原谅",
        "33_职场逆袭_AI替代_主管PUA说AI能代替我"
    ]
    
    total_issues = 0
    
    for story in stories_to_check:
        story_path = base_dir / story
        if story_path.exists():
            issues = check_story(story_path)
            if issues:
                total_issues += issues
        else:
            print(f"❌ 故事不存在：{story}")
    
    print(f"\n{'='*60}")
    print(f"检查完成！总共发现 {total_issues} 个重复段落")
    print(f"{'='*60}")
