#!/usr/bin/env python3
"""
检测相似段落（相似度 > 80%）
"""
import os
import re
from pathlib import Path
from difflib import SequenceMatcher

def calculate_similarity(text1, text2):
    """计算两个文本的相似度（使用 SequenceMatcher）"""
    return SequenceMatcher(None, text1, text2).ratio()

def normalize_text(text):
    """标准化文本（移除多余空格、统一标点）"""
    # 移除多余空格
    text = re.sub(r'\s+', ' ', text)
    # 统一标点符号
    text = text.replace('，', ',').replace('。', '.').replace('！', '!').replace('？', '?')
    text = text.replace('"', "'")
    return text.strip()

def find_similar_paragraphs(file_path, min_length=30, similarity_threshold=0.8):
    """找出文件中的相似段落"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 移除标题行和元数据
    lines = []
    for line in content.split('\n'):
        # 跳过标题、元数据标记
        if line.strip().startswith('#'):
            continue
        if line.strip() == '---':
            continue
        if '完】' in line or '预告' in line or '统计' in line:
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
                para = '\n'.join(current_para).strip()
                if len(para) >= min_length:
                    paragraphs.append(para)
                current_para = []
    
    if current_para:
        para = '\n'.join(current_para).strip()
        if len(para) >= min_length:
            paragraphs.append(para)
    
    # 找相似段落
    similar_pairs = []
    
    for i in range(len(paragraphs)):
        for j in range(i + 1, len(paragraphs)):
            para1 = normalize_text(paragraphs[i])
            para2 = normalize_text(paragraphs[j])
            
            similarity = calculate_similarity(para1, para2)
            
            if similarity >= similarity_threshold:
                similar_pairs.append({
                    'index1': i,
                    'index2': j,
                    'similarity': similarity,
                    'length1': len(paragraphs[i]),
                    'length2': len(paragraphs[j]),
                    'content1': paragraphs[i][:150] + '...' if len(paragraphs[i]) > 150 else paragraphs[i],
                    'content2': paragraphs[j][:150] + '...' if len(paragraphs[j]) > 150 else paragraphs[j]
                })
    
    return similar_pairs, len(paragraphs)

def check_full_story(story_path):
    """检查 full_story.md"""
    story_name = os.path.basename(story_path)
    full_story_path = os.path.join(story_path, 'content', 'full_story.md')
    
    if not os.path.exists(full_story_path):
        print(f"❌ full_story.md 不存在")
        return
    
    print(f"\n{'='*60}")
    print(f"检查：{story_name}")
    print(f"{'='*60}")
    
    # 统计文件信息
    file_size = os.path.getsize(full_story_path)
    with open(full_story_path, 'r', encoding='utf-8') as f:
        content = f.read()
    total_chars = len(content)
    
    print(f"文件大小：{file_size / 1024:.1f} KB")
    print(f"总字数：{total_chars} 字")
    
    # 检测相似段落（相似度 > 80%）
    similar_pairs, total_paras = find_similar_paragraphs(full_story_path, min_length=30, similarity_threshold=0.8)
    
    print(f"总段落数：{total_paras}")
    print(f"相似段落数：{len(similar_pairs)}")
    
    if similar_pairs:
        print(f"\n⚠️ 发现相似段落（相似度 >= 80%）：")
        for i, pair in enumerate(similar_pairs[:10], 1):  # 显示前10个
            print(f"\n{i}. 相似度：{pair['similarity']:.2%}")
            print(f"   段落 {pair['index1']}（长度：{pair['length1']} 字）：")
            print(f"   {pair['content1']}")
            print(f"   段落 {pair['index2']}（长度：{pair['length2']} 字）：")
            print(f"   {pair['content2']}")
    else:
        print(f"\n✅ 无相似段落（相似度 >= 80%）")
    
    return len(similar_pairs)

# 主程序
if __name__ == '__main__':
    import sys
    
    # 如果提供了参数，检查指定文件
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            check_full_story(os.path.dirname(file_path))
        else:
            print(f"❌ 文件不存在：{file_path}")
    else:
        # 默认检查归档故事集
        base_dir = Path("~/.openclaw/workspace/番茄短篇故事集/stories/归档故事集")
        
        stories = [
            "31_历史翻盘_崇祯听见心声_大明朝起死回生",
            "32_断亲复仇_养父母vs亲生父母_他们跪求原谅",
            "33_职场逆袭_AI替代_主管PUA说AI能代替我"
        ]
        
        total_similar_pairs = 0
        
        for story in stories:
            story_path = base_dir / story
            if story_path.exists():
                similar_pairs = check_full_story(story_path)
                if similar_pairs:
                    total_similar_pairs += similar_pairs
        
        print(f"\n{'='*60}")
        print(f"总计发现 {total_similar_pairs} 个相似段落")
        print(f"{'='*60}")
