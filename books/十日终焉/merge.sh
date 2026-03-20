#!/bin/bash

# merge.sh
# 将《十日终焉》正文目录下所有章节按文件名顺序合并为一个 txt 文件

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SOURCE_DIR="${SCRIPT_DIR}/正文"
OUTPUT_FILE="${SCRIPT_DIR}/十日终焉_全文.txt"
BOOK_TITLE="十日终焉"

# 检查正文目录是否存在
if [ ! -d "$SOURCE_DIR" ]; then
    echo "错误：正文目录不存在：$SOURCE_DIR"
    exit 1
fi

# 统计章节文件数量
TOTAL=$(find "$SOURCE_DIR" -maxdepth 1 -name "*.txt" | wc -l | tr -d ' ')
if [ "$TOTAL" -eq 0 ]; then
    echo "错误：正文目录中没有找到任何 .txt 文件"
    exit 1
fi

echo "《${BOOK_TITLE}》章节合并"
echo "来源目录：$SOURCE_DIR"
echo "输出文件：$OUTPUT_FILE"
echo "共发现 ${TOTAL} 个章节文件"
echo ""

# 若输出文件已存在则清空重建
if [ -f "$OUTPUT_FILE" ]; then
    echo "已存在旧版全文文件，将覆盖重建..."
    rm "$OUTPUT_FILE"
fi

# 写入书名标题
printf "%s\n\n\n" "$BOOK_TITLE" > "$OUTPUT_FILE"

# 按文件名升序遍历所有章节（sort 对 0001- 前缀的数字编号天然正确）
count=0
find "$SOURCE_DIR" -maxdepth 1 -name "*.txt" | sort | while IFS= read -r file; do
    count=$((count + 1))
    filename=$(basename "$file")
    echo "[$count/$TOTAL] $filename"

    # 追加章节正文，章节之间以两个空行分隔
    cat "$file" >> "$OUTPUT_FILE"
    printf "\n\n\n" >> "$OUTPUT_FILE"
done

# 统计合并后文件信息
CHAR_COUNT=$(wc -c < "$OUTPUT_FILE" | tr -d ' ')
LINE_COUNT=$(wc -l < "$OUTPUT_FILE" | tr -d ' ')

echo ""
echo "合并完成！"
echo "输出文件：$OUTPUT_FILE"
echo "文件大小：$(du -sh "$OUTPUT_FILE" | cut -f1)"
echo "总行数：${LINE_COUNT} 行"
echo "字节数：${CHAR_COUNT} bytes"
