#!/bin/bash

# 生成产品发布截图脚本
# 用于生成小红书封面图（1080x1080）和知乎文章插图（1200x800）

set -e

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "🎨 产品发布截图生成工具"
echo "========================="
echo ""

# 源截图目录
SOURCE_DIR="./产品发布素材/screenshots"
# 输出目录
OUTPUT_DIR_RED_BOOK="./产品发布素材/screenshots/xiaohongshu"
OUTPUT_DIR_ZHIHU="./产品发布素材/screenshots/zhihu"

# 创建输出目录
mkdir -p "$OUTPUT_DIR_RED_BOOK"
mkdir -p "$OUTPUT_DIR_ZHIHU"

echo "📁 源截图目录: $SOURCE_DIR"
echo "📁 小红书输出目录: $OUTPUT_DIR_RED_BOOK"
echo "📁 知乎输出目录: $OUTPUT_DIR_ZHIHU"
echo ""

# 检查 ImageMagick 是否安装
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick 未安装，请先安装："
    echo "   macOS: brew install imagemagick"
    echo "   Ubuntu: sudo apt-get install imagemagick"
    exit 1
fi

echo "✅ ImageMagick 已安装"
echo ""

# 函数：生成小红书封面图（1080x1080）
generate_xiaohongshu_cover() {
    local input_file=$1
    local output_file=$2
    local title=$3
    local subtitle=$4

    echo "🖼️  生成小红书封面图: $output_file"

    # 裁剪图片到 1080x1080（居中裁剪）
    convert "$input_file" \
        -resize 1080x1080^ \
        -gravity center \
        -extent 1080x1080 \
        -background white \
        -gravity north \
        -pointsize 48 \
        -fill '#FF6B6B' \
        -annotate +0+50 "$title" \
        -pointsize 28 \
        -fill '#333333' \
        -annotate +0+120 "$subtitle" \
        "$output_file"

    echo "✅ 生成完成: $output_file"
    echo ""
}

# 函数：生成知乎文章插图（1200x800）
generate_zhihu_illustration() {
    local input_file=$1
    local output_file=$2
    local caption=$3

    echo "🖼️  生成知乎文章插图: $output_file"

    # 裁剪图片到 1200x800（居中裁剪）
    convert "$input_file" \
        -resize 1200x800^ \
        -gravity center \
        -extent 1200x800 \
        -background white \
        -gravity south \
        -pointsize 24 \
        -fill '#666666' \
        -annotate +0+20 "$caption" \
        "$output_file"

    echo "✅ 生成完成: $output_file"
    echo ""
}

# ========================================
# 生成小红书封面图（5张）
# ========================================

echo "📱 生成小红书封面图（5张，1080x1080）"
echo "-----------------------------------"

# 1. 封面图 - 90万资产配置
generate_xiaohongshu_cover \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_RED_BOOK/cover-90w-allocation.png" \
    "90万资产如何配置？" \
    "科学规划，实现财务安全"

# 2. 饼图 - 资产分布
generate_xiaohongshu_cover \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_RED_BOOK/pie-chart-showcase.png" \
    "资产分布一目了然" \
    "饼图可视化，清晰直观"

# 3. 雷达图 - 风险收益
generate_xiaohongshu_cover \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_RED_BOOK/radar-chart-showcase.png" \
    "风险收益平衡分析" \
    "雷达图展示，科学配置"

# 4. 增长曲线 - 收益预测
generate_xiaohongshu_cover \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_RED_BOOK/growth-chart-showcase.png" \
    "10年资产增长预测" \
    "复利计算，规划未来"

# 5. 下载引导 - 行动引导
generate_xiaohongshu_cover \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_RED_BOOK/download-qr-code.png" \
    "立即下载体验" \
    "免费工具，开始规划"

# ========================================
# 生成知乎文章插图（4张）
# ========================================

echo "📱 生成知乎文章插图（4张，1200x800）"
echo "-----------------------------------"

# 1. 工具主界面
generate_zhihu_illustration \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_ZHIHU/tool-main-interface.png" \
    "图1：资产配置可视化工具主界面"

# 2. 财务安全配置
generate_zhihu_illustration \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_ZHIHU/security-allocation.png" \
    "图2：财务安全阶段的资产配置详情"

# 3. 三阶段对比
generate_zhihu_illustration \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_ZHIHU/three-stages-compare.png" \
    "图3：三阶段资产配置对比"

# 4. 增长预测
generate_zhihu_illustration \
    "$SOURCE_DIR/test-asset-allocation-desktop.png" \
    "$OUTPUT_DIR_ZHIHU/growth-prediction.png" \
    "图4：10年资产增长预测曲线"

# ========================================
# 生成完成
# ========================================

echo ""
echo "======================================="
echo "🎉 截图生成完成！"
echo "======================================="
echo ""
echo "📊 生成统计："
echo "  - 小红书封面图: 5 张（1080x1080）"
echo "  - 知乎文章插图: 4 张（1200x800）"
echo "  - 总计: 9 张"
echo ""
echo "📁 输出目录："
echo "  - 小红书: $OUTPUT_DIR_RED_BOOK"
echo "  - 知乎: $OUTPUT_DIR_ZHIHU"
echo ""
echo "👉 下一步："
echo "  1. 检查生成的截图质量和尺寸"
echo "  2. 如需调整，手动使用 ImageMagick 或图片编辑工具优化"
echo "  3. 准备发布文案"
echo "  4. 正式发布"
echo ""
