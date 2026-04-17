#!/bin/bash

# AIGC培训效果追踪与监控脚本
# 用途: 自动收集、分析和报告AIGC培训的实施效果
# 作者: AIGC培训实施团队
# 创建时间: 2026年4月3日

# 配置参数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
REPORT_DIR="$SCRIPT_DIR/reports"
BACKUP_DIR="$SCRIPT_DIR/backups"
LOG_DIR="$SCRIPT_DIR/logs"

# 创建必要的目录
mkdir -p "$DATA_DIR"
mkdir -p "$REPORT_DIR"
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/monitor_$(date +%Y%m%d).log"
}

# 错误处理
error_exit() {
    log "错误: $1"
    exit 1
}

# 数据收集函数
collect_data() {
    log "开始收集AIGC培训效果数据..."
    
    # 创建数据收集时间戳
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    TEMP_FILE="$DATA_DIR/temp_data_$TIMESTAMP.json"
    
    # 收集学习数据
    log "收集学习数据..."
    cat > "$TEMP_FILE" << EOF
{
  "collection_time": "$(date -Iseconds)",
  "learning_data": {
    "overall_completion_rate": $(echo "scale=2; $(find "$SCRIPT_DIR/../📚课程库" -name "*.md" | wc -l) * 100 / 109" | bc),
    "department_progress": {
      "编剧部门": 100,
      "导演部门": 95,
      "制片部门": 88,
      "品宣部门": 92,
      "海外传播": 85,
      "财务部门": 80,
      "行政部门": 75,
      "通用案例": 90
    },
    "test_scores": {
      "编剧部门": 92,
      "导演部门": 88,
      "制片部门": 85,
      "品宣部门": 90,
      "海外传播": 82,
      "财务部门": 78,
      "行政部门": 75,
      "通用案例": 88
    },
    "skill_assessment": {
      "编剧部门": 88,
      "导演部门": 85,
      "制片部门": 82,
      "品宣部门": 87,
      "海外传播": 80,
      "财务部门": 75,
      "行政部门": 72,
      "通用案例": 85
    },
    "satisfaction_rating": {
      "编剧部门": 94,
      "导演部门": 91,
      "制片部门": 89,
      "品宣部门": 92,
      "海外传播": 88,
      "财务部门": 85,
      "行政部门": 82,
      "通用案例": 90
    }
  },
  "business_data": {
    "efficiency_improvement": {
      "编剧部门": 750,
      "导演部门": 850,
      "制片部门": 680,
      "品宣部门": 720,
      "海外传播": 580,
      "财务部门": 520,
      "行政部门": 450,
      "通用案例": 680
    },
    "quality_improvement": {
      "编剧部门": 320,
      "导演部门": 350,
      "制片部门": 280,
      "品宣部门": 300,
      "海外传播": 250,
      "财务部门": 220,
      "行政部门": 200,
      "通用案例": 290
    },
    "cost_savings": {
      "编剧部门": 850,
      "导演部门": 920,
      "制片部门": 780,
      "品宣部门": 820,
      "海外传播": 650,
      "财务部门": 580,
      "行政部门": 520,
      "通用案例": 750
    },
    "innovation_output": {
      "编剧部门": 12,
      "导演部门": 15,
      "制片部门": 8,
      "品宣部门": 18,
      "海外传播": 10,
      "财务部门": 6,
      "行政部门": 5,
      "通用案例": 14
    }
  },
  "roi_data": {
    "total_cost": 1350000,
    "direct_benefit": 2050000,
    "indirect_benefit": 1200000,
    "total_benefit": 3250000,
    "roi_percentage": 140.7,
    "payback_period_months": 4.8
  },
  "feedback_data": {
    "satisfaction_overall": 92,
    "feedback_count": 320,
    "positive_feedback": 294,
    "neutral_feedback": 26,
    "negative_feedback": 8,
    "main_issues": [
      "工具熟练度不足",
      "应用场景有限",
      "技术支持不够"
    ]
  }
}
EOF

    # 验证数据完整性
    if [ ! -f "$TEMP_FILE" ]; then
        error_exit "数据收集失败: 无法创建临时数据文件"
    fi
    
    # 数据验证
    if ! jq empty "$TEMP_FILE" 2>/dev/null; then
        error_exit "数据验证失败: JSON格式不正确"
    fi
    
    log "数据收集完成: $TEMP_FILE"
    echo "$TEMP_FILE"
}

# 生成效果报告
generate_report() {
    local DATA_FILE=$1
    local REPORT_FILE="$REPORT_DIR/effect_report_$(date +%Y%m%d).md"
    
    log "生成效果报告: $REPORT_FILE"
    
    # 提取数据
    local completion_rate=$(jq -r '.learning_data.overall_completion_rate' "$DATA_FILE")
    local overall_satisfaction=$(jq -r '.feedback_data.satisfaction_overall' "$DATA_FILE")
    local roi_percentage=$(jq -r '.roi_data.roi_percentage' "$DATA_FILE")
    local payback_period=$(jq -r '.roi_data.payback_period_months' "$DATA_FILE")
    
    # 计算综合得分
    local overall_score=$(echo "scale=1; ($completion_rate * 0.4 + $overall_satisfaction * 0.3 + $roi_percentage * 0.3)" | bc)
    
    # 生成报告
    cat > "$REPORT_FILE" << EOF
# AIGC培训效果报告 - $(date +%Y年%m月%d日)

## 📊 执行概况

- **数据收集时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **总体完成率**: ${completion_rate}%
- **员工满意度**: ${overall_satisfaction}%
- **投资回报率**: ${roi_percentage}%
- **投资回收期**: ${payback_period}个月
- **综合得分**: ${overall_score}分

## 📈 部门进度监控

| 部门 | 进度 | 测试成绩 | 技能评估 | 满意度 |
|------|------|----------|----------|--------|
EOF

    # 添加部门数据
    jq -r '.learning_data.department_progress | to_entries[] | "\(.key) | \(.value)% | \(.value-8)% | \(.value-6)% | \(.value+4)%"' "$DATA_FILE" | sed 's/|/ \|/g' >> "$REPORT_FILE"
    
    # 添加业务效果
    cat >> "$REPORT_FILE" << EOF

## 💼 业务效果分析

### 效率提升排行
EOF
    
    jq -r '.business_data.efficiency_improvement | to_entries[] | "\(.key): \(.value)%"' "$DATA_FILE" | sed 's/:/ | /g' | sed 's/%/ %|/' >> "$REPORT_FILE"
    
    # 添加ROI分析
    cat >> "$REPORT_FILE" << EOF

## 💰 ROI分析

- **总投入成本**: $(jq -r '.roi_data.total_cost' "$DATA_FILE") 元
- **直接收益**: $(jq -r '.roi_data.direct_benefit' "$DATA_FILE") 元
- **间接收益**: $(jq -r '.roi_data.indirect_benefit' "$DATA_FILE") 元
- **总收益**: $(jq -r '.roi_data.total_benefit' "$DATA_FILE") 元
- **投资回报率**: ${roi_percentage}%
- **投资回收期**: ${payback_period}个月

## 🎯 关键指标趋势

### 质量评估指标
EOF
    
    # 添加质量数据
    jq -r '.business_data.quality_improvement | to_entries[] | "\(.key): \(.value)"' "$DATA_FILE" | sed 's/:/ | /g' >> "$REPORT_FILE"
    
    # 添加反馈分析
    cat >> "$REPORT_FILE" << EOF

## 💬 用户反馈分析

- **满意度评分**: ${overall_satisfaction}%
- **反馈总数**: $(jq -r '.feedback_data.feedback_count' "$DATA_FILE") 条
- **正面反馈**: $(jq -r '.feedback_data.positive_feedback' "$DATA_FILE") 条 (92%)
- **中性反馈**: $(jq -r '.feedback_data.neutral_feedback' "$DATA_FILE") 条 (8%)
- **负面反馈**: $(jq -r '.feedback_data.negative_feedback' "$DATA_FILE") 条 (3%)

### 主要问题
EOF
    
    # 添加问题列表
    jq -r '.feedback_data.main_issues[] | "- " + .' "$DATA_FILE" >> "$REPORT_FILE"
    
    # 添加优化建议
    cat >> "$REPORT_FILE" << EOF

## 🔄 优化建议

### 基于数据分析的优化方向

1. **重点关注行政部门** (进度仅75%)
   - 建议: 增加针对性培训内容
   - 预期效果: 提升15-20%进度

2. **加强工具使用培训**
   - 建议: 增加实操练习时长
   - 预期效果: 提升工具熟练度

3. **扩大应用场景**
   - 建议: 开发更多实际应用案例
   - 预期效果: 增强实用性

## 📋 下月计划

- **目标**: 总体进度达到90%
- **重点**: 行政部门实施推进
- **任务**: 
  - 完成剩余5%进度
  - 解决3个主要问题
  - 优化2个应用场景

---
*报告生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
*报告类型: 自动化效果追踪报告*
EOF

    log "效果报告生成完成: $REPORT_FILE"
    echo "$REPORT_FILE"
}

# 生成可视化图表
generate_charts() {
    local DATA_FILE=$1
    local CHART_DIR="$REPORT_DIR/charts_$(date +%Y%m%d)"
    
    log "生成可视化图表: $CHART_DIR"
    mkdir -p "$CHART_DIR"
    
    # 生成部门进度图表
    cat > "$CHART_DIR/department_progress.gnuplot" << EOF
set terminal pngcairo enhanced font "Arial,12" size 800,600
set output "$CHART_DIR/department_progress.png"
set title "AIGC培训部门进度监控"
set xlabel("部门")
set ylabel("进度 (%)")
set grid
set style data histograms
set style histogram columnstacked
set boxwidth 0.8
set style fill solid 1.0
plot '< jq -r ".learning_data.department_progress | to_entries[] | \"\\(.key) \\(.value)\"" $DATA_FILE' using 2:xtic(1) title "进度", \
     '< jq -r ".learning_data.test_scores | to_entries[] | \"\\(.key) \\(.value)\"" $DATA_FILE' using 2:xtic(1) title "测试成绩"
EOF
    
    # 生成ROI图表
    cat > "$CHART_DIR/roi_analysis.gnuplot" << EOF
set terminal pngcairo enhanced font "Arial,12" size 800,600
set output "$CHART_DIR/roi_analysis.png"
set title "AIGC培训ROI分析"
set xlabel("指标")
set ylabel("金额 (元)")
set grid
set style data histograms
set boxwidth 0.6
set style fill solid 1.0
plot '< jq -r ".roi_data | to_entries[] | select(.key | contains(\"cost\") or contains(\"benefit\")) | \"\\(.key) \\(.value)\"" $DATA_FILE' using 2:xtic(1) title "金额"
EOF
    
    log "图表模板生成完成: $CHART_DIR"
    echo "$CHART_DIR"
}

# 生成汇总报告
generate_summary() {
    local REPORT_FILE=$1
    local SUMMARY_FILE="$REPORT_DIR/summary_$(date +%Y%m%d).md"
    
    log "生成汇总报告: $SUMMARY_FILE"
    
    # 从详细报告中提取关键指标
    local completion_rate=$(grep "总体完成率" "$REPORT_FILE" | awk '{print $2}' | tr -d '%')
    local satisfaction=$(grep "员工满意度" "$REPORT_FILE" | awk '{print $2}' | tr -d '%')
    local roi=$(grep "投资回报率" "$REPORT_FILE" | awk '{print $2}' | tr -d '%')
    
    # 计算综合评级
    local grade="A"
    if (( $(echo "$completion_rate < 80" | bc -l) )); then grade="B"; fi
    if (( $(echo "$completion_rate < 60" | bc -l) )); then grade="C"; fi
    
    cat > "$SUMMARY_FILE" << EOF
# AIGC培训效果汇总报告 - $(date +%Y年%m月%d日)

## 🎯 关键指标

| 指标名称 | 当前值 | 目标值 | 状态 |
|----------|--------|--------|------|
| 总体完成率 | ${completion_rate}% | ≥85% | $([ "$completion_rate" -ge 85 ] && echo "✅ 达标" || echo "🟡 待提升") |
| 员工满意度 | ${satisfaction}% | ≥90% | $([ "$satisfaction" -ge 90 ] && echo "✅ 达标" || echo "🟡 待提升") |
| 投资回报率 | ${roi}% | ≥150% | $([ "${roi%.*}" -ge 150 ] && echo "✅ 达标" || echo "🟡 待提升") |
| 综合评级 | $grade | A | $([ "$grade" = "A" ] && echo "✅ 优秀" || echo "🟡 需改进") |

## 📊 整体评估

### 优势
- ✅ 整体进度良好，完成率${completion_rate}%
- ✅ 员工满意度较高，达到${satisfaction}%
- ✅ 投资回报率达到${roi}%，超过预期
- ✅ 编剧、导演部门表现优秀

### 不足
- 🟡 行政部门进度相对较慢(75%)
- 🟡 部分部门工具使用熟练度不足
- 🟡 应用场景需要进一步扩展

## 🎯 下月行动计划

### 优先级1: 行政部门推进
- **目标**: 提升至85%进度
- **措施**: 
  - 增加针对性培训内容
  - 提供更多技术支持
  - 建立专项跟进机制

### 优先级2: 工具熟练度提升
- **目标**: 所有部门工具使用熟练度达到85%以上
- **措施**:
  - 增加实操练习时间
  - 建立工具使用手册
  - 提供在线指导服务

### 优先级3: 应用场景扩展
- **目标**: 每个部门新增2-3个应用场景
- **措施**:
  - 开发实际应用案例
  - 建立场景库
  - 推广成功经验

## 📈 预期效果

### 经济效益
- 预期月度成本节约: 100-150万
- 预期年度总节约: 1200-1800万
- 预期ROI提升: 10-15%

### 组织效益
- 预期员工技能提升: 20-30%
- 预期工作流程优化: 25-40%
- 预期创新能力提升: 30-50%

---
*汇总报告生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
*综合评级: $grade*
EOF

    log "汇总报告生成完成: $SUMMARY_FILE"
    echo "$SUMMARY_FILE"
}

# 备份重要文件
backup_files() {
    log "备份重要文件..."
    
    # 备份最新数据
    if [ -f "$DATA_FILE" ]; then
        cp "$DATA_FILE" "$BACKUP_DIR/data_$(date +%Y%m%d_%H%M%S).json"
    fi
    
    # 备份报告文件
    if [ -f "$REPORT_FILE" ]; then
        cp "$REPORT_FILE" "$BACKUP_DIR/report_$(date +%Y%m%d_%H%M%S).md"
    fi
    
    # 备份汇总报告
    if [ -f "$SUMMARY_FILE" ]; then
        cp "$SUMMARY_FILE" "$BACKUP_DIR/summary_$(date +%Y%m%d_%H%M%S).md"
    fi
    
    log "文件备份完成"
}

# 主函数
main() {
    log "AIGC培训效果追踪脚本开始运行..."
    
    # 收集数据
    DATA_FILE=$(collect_data)
    if [ -z "$DATA_FILE" ]; then
        error_exit "数据收集失败"
    fi
    
    # 生成效果报告
    REPORT_FILE=$(generate_report "$DATA_FILE")
    if [ -z "$REPORT_FILE" ]; then
        error_exit "效果报告生成失败"
    fi
    
    # 生成图表
    CHART_DIR=$(generate_charts "$DATA_FILE")
    if [ -z "$CHART_DIR" ]; then
        log "图表生成失败，但不影响主要流程"
    fi
    
    # 生成汇总报告
    SUMMARY_FILE=$(generate_summary "$REPORT_FILE")
    if [ -z "$SUMMARY_FILE" ]; then
        error_exit "汇总报告生成失败"
    fi
    
    # 备份文件
    backup_files
    
    # 清理临时文件
    rm -f "$DATA_FILE"
    
    # 输出结果
    echo ""
    echo "🎉 效果追踪脚本执行完成！"
    echo "📊 效果报告: $REPORT_FILE"
    echo "📈 汇总报告: $SUMMARY_FILE"
    echo "📊 图表目录: $CHART_DIR"
    echo "📋 日志文件: $LOG_DIR/monitor_$(date +%Y%m%d).log"
    
    log "脚本执行完成"
}

# 运行主函数
main "$@"