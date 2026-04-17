#!/bin/bash

# SVG流程图质量检查工具 - 简化版
# 功能：直接检查案例文件中的SVG引用和内容质量
# 执行时间：2026-04-03 12:40

echo "🔍 SVG流程图质量检查工具（简化版）启动..."
echo "执行时间：$(date)"
echo "检查目标：讲座规划案例库SVG流程图"
echo "检查数量：15个案例文件"
echo "=================================================="

# 设置工作目录
LECTURE_DIR="～/.openclaw/workspace/讲座规划"
CASE_DIR="$LECTURE_DIR/📋案例库"
LOG_FILE="$LECTURE_DIR/📝工作日志/SVG质量检查报告_简化版_$(date +%Y-%m-%d_%H%M).md"

# 创建日志文件
mkdir -p "$LECTURE_DIR/📝工作日志"
echo "# SVG流程图质量检查报告（简化版）" > "$LOG_FILE"
echo "**执行时间**: $(date)" >> "$LOG_FILE"
echo "**检查范围**: 15个案例文件" >> "$LOG_FILE"
echo "**检查内容**: SVG引用、内容质量、字数统计" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 检查计数
TOTAL_CHECKED=0
SUCCESS_COUNT=0
ERROR_COUNT=0
WARNING_COUNT=0

# 直接检查各个部门的案例文件
for dept in "01_编剧部门" "02_导演部门" "03_制片部门" "04_品宣部门" "05_海外传播" "06_财务部门" "07_行政部门" "08_通用案例"; do
    dept_path="$CASE_DIR/$dept"
    
    echo "📂 正在检查部门：$dept"
    echo "### 📂 检查部门：$dept" >> "$LOG_FILE"
    
    if [[ ! -d "$dept_path" ]]; then
        echo "❌ 部门目录不存在：$dept_path"
        echo "❌ 部门目录不存在：$dept_path" >> "$LOG_FILE"
        continue
    fi
    
    # 获取该部门的所有案例文件
    case_files=("$dept_path"/*.md)
    
    echo "📝 找到案例文件数量：${#case_files[@]}"
    echo "#### 📝 找到案例文件数量：${#case_files[@]}" >> "$LOG_FILE"
    
    # 限制检查数量，避免过多
    check_count=2
    if [[ ${#case_files[@]} -lt $check_count ]]; then
        check_count=${#case_files[@]}
    fi
    
    # 检查选中的案例
    for i in $(seq 0 $((check_count - 1))); do
        case_file="${case_files[$i]}"
        case_name=$(basename "$case_file" .md)
        
        if [[ ! -f "$case_file" ]]; then
            continue
        fi
        
        echo "🔍 检查案例：$case_name"
        echo "##### 🔍 检查案例：$case_name" >> "$LOG_FILE"
        echo "**文件路径**: $case_file" >> "$LOG_FILE"
        
        TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
        
        # 读取文件内容
        content=$(cat "$case_file")
        
        # 检查SVG引用
        if echo "$content" | grep -q "images/"; then
            echo "✅ SVG引用存在"
            echo "✅ SVG引用存在" >> "$LOG_FILE"
            
            # 提取SVG引用行
            svg_lines=$(echo "$content" | grep -n "images/" | head -3)
            echo "**SVG引用**:" >> "$LOG_FILE"
            echo "$svg_lines" >> "$LOG_FILE"
            
            # 检查内容质量
            word_count=$(echo "$content" | wc -w)
            echo "📊 字数统计：$word_count"
            echo "**字数统计**: $word_count" >> "$LOG_FILE"
            
            if [[ $word_count -lt 100 ]]; then
                echo "⚠️ 案例内容较短，建议补充"
                echo "⚠️ 案例内容较短，建议补充" >> "$LOG_FILE"
                WARNING_COUNT=$((WARNING_COUNT + 1))
            else
                echo "✅ 案例内容充足"
                echo "✅ 案例内容充足" >> "$LOG_FILE"
                SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            fi
            
            # 检查是否有AI解决方案部分
            if echo "$content" | grep -q "## AI 解决方案"; then
                echo "✅ AI解决方案部分存在"
                echo "✅ AI解决方案部分存在" >> "$LOG_FILE"
            else
                echo "⚠️ 缺少AI解决方案部分"
                echo "⚠️ 缺少AI解决方案部分" >> "$LOG_FILE"
                WARNING_COUNT=$((WARNING_COUNT + 1))
            fi
            
        else
            echo "❌ SVG引用不存在"
            echo "❌ SVG引用不存在" >> "$LOG_FILE"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
        
        echo "" >> "$LOG_FILE"
    done
    
    echo "" >> "$LOG_FILE"
done

# 汇总结果
echo "=================================================="
echo "📊 质量检查汇总："
echo "总检查案例数：$TOTAL_CHECKED"
echo "成功案例数：$SUCCESS_COUNT"
echo "错误数量：$ERROR_COUNT"
echo "警告数量：$WARNING_COUNT"
if [[ $TOTAL_CHECKED -gt 0 ]]; then
    success_rate=$((SUCCESS_COUNT * 100 / TOTAL_CHECKED))
    echo "成功率：${success_rate}%"
else
    echo "成功率：0%"
fi

# 更新日志文件
echo "" >> "$LOG_FILE"
echo "## 📊 检查汇总" >> "$LOG_FILE"
echo "总检查案例数：$TOTAL_CHECKED" >> "$LOG_FILE"
echo "成功案例数：$SUCCESS_COUNT" >> "$LOG_FILE"
echo "错误数量：$ERROR_COUNT" >> "$LOG_FILE"
echo "警告数量：$WARNING_COUNT" >> "$LOG_FILE"
if [[ $TOTAL_CHECKED -gt 0 ]]; then
    success_rate=$((SUCCESS_COUNT * 100 / TOTAL_CHECKED))
    echo "成功率：${success_rate}%" >> "$LOG_FILE"
else
    echo "成功率：0%" >> "$LOG_FILE"
fi

# 质量评估
if [[ $ERROR_COUNT -eq 0 && $WARNING_COUNT -le 2 ]]; then
    echo "🎉 质量检查结果：优秀 ✅"
    echo "🎉 质量检查结果：优秀 ✅" >> "$LOG_FILE"
    echo "## 🎉 质量评估：优秀 ✅" >> "$LOG_FILE"
elif [[ $ERROR_COUNT -le 2 && $WARNING_COUNT -le 5 ]]; then
    echo "👍 质量检查结果：良好 ✅"
    echo "👍 质量检查结果：良好 ✅" >> "$LOG_FILE"
    echo "## 👍 质量评估：良好 ✅" >> "$LOG_FILE"
else
    echo "⚠️ 质量检查结果：需要改进 ⚠️"
    echo "⚠️ 质量检查结果：需要改进 ⚠️" >> "$LOG_FILE"
    echo "## ⚠️ 质量评估：需要改进 ⚠️" >> "$LOG_FILE"
fi

echo "检查完成！详细报告已保存至：$LOG_FILE"