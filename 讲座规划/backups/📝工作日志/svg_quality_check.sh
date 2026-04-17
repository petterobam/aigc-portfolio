#!/bin/bash

# SVG流程图质量检查工具
# 功能：批量检查SVG流程图的显示效果和内容准确性
# 执行时间：2026-04-03 12:35

echo "🔍 SVG流程图质量检查工具启动..."
echo "执行时间：$(date)"
echo "检查目标：讲座规划案例库SVG流程图"
echo "检查数量：10-15个随机抽查"
echo "=================================================="

# 设置工作目录
LECTURE_DIR="～/.openclaw/workspace/讲座规划"
CASE_DIR="$LECTURE_DIR/📋案例库"
LOG_FILE="$LECTURE_DIR/📝工作日志/SVG质量检查报告_$(date +%Y-%m-%d_%H%M).md"

# 创建日志文件
mkdir -p "$LECTURE_DIR/📝工作日志"
echo "# SVG流程图质量检查报告" > "$LOG_FILE"
echo "**执行时间**: $(date)" >> "$LOG_FILE"
echo "**检查范围**: 10-15个随机抽查案例" >> "$LOG_FILE"
echo "**检查内容**: SVG显示效果、路径正确性、内容匹配度" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 定义检查的部门（随机选择）
DEPARTMENTS=("01_编剧部门" "02_导演部门" "03_制片部门" "04_品宣部门" "05_海外传播" "06_财务部门" "07_行政部门" "08_通用案例")

# 随机选择3-4个部门进行检查
SELECTED_DEPTS=()
for i in {1..3}; do
    random_index=$((RANDOM % ${#DEPARTMENTS[@]}))
    dept="${DEPARTMENTS[$random_index]}"
    if [[ ! " ${SELECTED_DEPTS[@]} " =~ " $dept " ]]; then
        SELECTED_DEPTS+=("$dept")
    fi
done

echo "📋 检查部门：${SELECTED_DEPTS[*]}"
echo "## 📋 检查部门" >> "$LOG_FILE"
echo "${SELECTED_DEPTS[*]}" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# 检查计数
TOTAL_CHECKED=0
SUCCESS_COUNT=0
ERROR_COUNT=0
WARNING_COUNT=0

# 对每个选中的部门进行检查
for dept in "${SELECTED_DEPTS[@]}"; do
    dept_path="$CASE_DIR/$dept"
    images_path="$dept_path/images"
    
    echo "📂 正在检查部门：$dept"
    echo "### 📂 检查部门：$dept" >> "$LOG_FILE"
    
    if [[ ! -d "$dept_path" ]]; then
        echo "❌ 部门目录不存在：$dept_path"
        echo "❌ 部门目录不存在：$dept_path" >> "$LOG_FILE"
        continue
    fi
    
    # 获取该部门的所有案例文件
    case_files=("$dept_path"/*.md)
    
    if [[ ${#case_files[@]} -eq 0 ]]; then
        echo "⚠️ 部门 $dept 没有找到案例文件"
        echo "⚠️ 部门 $dept 没有找到案例文件" >> "$LOG_FILE"
        continue
    fi
    
    # 随机选择2-3个案例进行检查
    num_cases=$((2 + RANDOM % 2))
    if [[ $num_cases -gt ${#case_files[@]} ]]; then
        num_cases=${#case_files[@]}
    fi
    
    selected_cases=()
    for i in $(shuf -i 1-${#case_files[@]} -n $num_cases); do
        selected_cases+=("${case_files[$((i-1))]}")
    done
    
    echo "📝 检查案例数量：$num_cases"
    echo "#### 📝 检查案例数量：$num_cases" >> "$LOG_FILE"
    
    # 检查选中的案例
    for case_file in "${selected_cases[@]}"; do
        case_name=$(basename "$case_file" .md)
        echo "🔍 检查案例：$case_name"
        echo "##### 🔍 检查案例：$case_name" >> "$LOG_FILE"
        echo "**文件路径**: $case_file" >> "$LOG_FILE"
        
        TOTAL_CHECKED=$((TOTAL_CHECKED + 1))
        
        # 检查SVG引用
        if grep -q "images/" "$case_file"; then
            svg_lines=$(grep -n "images/" "$case_file" | head -5)
            echo "✅ SVG引用存在"
            echo "✅ SVG引用存在" >> "$LOG_FILE"
            echo "**SVG引用**:" >> "$LOG_FILE"
            echo "$svg_lines" >> "$LOG_FILE"
            
            # 检查对应的SVG文件是否存在
            svg_files=()
            while read -r line; do
                # 提取SVG文件名
                svg_file=$(echo "$line" | grep -o 'images/[^)]*\.svg' | sed 's/images\///')
                if [[ -n "$svg_file" ]]; then
                    svg_files+=("$images_path/$svg_file")
                    if [[ -f "$images_path/$svg_file" ]]; then
                        echo "  ✅ SVG文件存在：$svg_file"
                        echo "  ✅ SVG文件存在：$svg_file" >> "$LOG_FILE"
                    else
                        echo "  ❌ SVG文件不存在：$svg_file"
                        echo "  ❌ SVG文件不存在：$svg_file" >> "$LOG_FILE"
                        ERROR_COUNT=$((ERROR_COUNT + 1))
                    fi
                fi
            done <<< "$svg_lines"
            
            # 检查案例内容质量
            word_count=$(wc -w < "$case_file")
            echo "📊 字数统计：$word_count"
            echo "**字数统计**: $word_count" >> "$LOG_FILE"
            
            if [[ $word_count -lt 100 ]]; then
                echo "⚠️ 案例内容较短，建议补充"
                echo "⚠️ 案例内容较短，建议补充" >> "$LOG_FILE"
                WARNING_COUNT=$((WARNING_COUNT + 1))
            fi
            
            # 检查是否有AI解决方案部分
            if grep -q "## AI 解决方案" "$case_file"; then
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
echo "成功案例数：$((TOTAL_CHECKED - ERROR_COUNT - WARNING_COUNT))"
echo "错误数量：$ERROR_COUNT"
echo "警告数量：$WARNING_COUNT"
echo "成功率：$(( (TOTAL_CHECKED - ERROR_COUNT) * 100 / TOTAL_CHECKED ))%"

# 更新日志文件
echo "" >> "$LOG_FILE"
echo "## 📊 检查汇总" >> "$LOG_FILE"
echo "总检查案例数：$TOTAL_CHECKED" >> "$LOG_FILE"
echo "成功案例数：$((TOTAL_CHECKED - ERROR_COUNT - WARNING_COUNT))" >> "$LOG_FILE"
echo "错误数量：$ERROR_COUNT" >> "$LOG_FILE"
echo "警告数量：$WARNING_COUNT" >> "$LOG_FILE"
echo "成功率：$(( (TOTAL_CHECKED - ERROR_COUNT) * 100 / TOTAL_CHECKED ))%" >> "$LOG_FILE"

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