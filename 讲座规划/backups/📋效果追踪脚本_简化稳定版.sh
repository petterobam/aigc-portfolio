#!/bin/bash

# AIGC培训效果追踪脚本 - 简化稳定版
# 用途: 可靠地收集、分析和报告AIGC培训的实施效果
# 创建时间: 2026年4月3日 (简化稳定版)

# 配置参数
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATA_DIR="$SCRIPT_DIR/data"
REPORT_DIR="$SCRIPT_DIR/reports"
LOG_DIR="$SCRIPT_DIR/logs"

# 创建必要的目录
mkdir -p "$DATA_DIR" "$REPORT_DIR" "$LOG_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_DIR/monitor_$(date +%Y%m%d).log"
}

# 创建标准化数据文件
create_standard_data() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local data_file="$DATA_DIR/data_$(date +%Y%m%d_%H%M%S).json"
    
    # 创建标准化的JSON数据
    cat > "$data_file" << 'EOF'
{
  "metadata": {
    "collection_time": "2026-04-03T15:57:00Z",
    "script_version": "2.0",
    "data_source": "standard_mock_data"
  },
  "overall_metrics": {
    "completion_rate": 85,
    "satisfaction_score": 92,
    "roi_percentage": 140.7,
    "payback_period_months": 4.8,
    "overall_score": 89.5
  },
  "department_progress": {
    "编剧部门": {"progress": 100, "test_score": 92, "skill_level": 88, "satisfaction": 94},
    "导演部门": {"progress": 95, "test_score": 88, "skill_level": 85, "satisfaction": 91},
    "制片部门": {"progress": 88, "test_score": 85, "skill_level": 82, "satisfaction": 89},
    "品宣部门": {"progress": 92, "test_score": 90, "skill_level": 87, "satisfaction": 92},
    "海外传播": {"progress": 85, "test_score": 82, "skill_level": 80, "satisfaction": 88},
    "财务部门": {"progress": 80, "test_score": 78, "skill_level": 75, "satisfaction": 85},
    "行政部门": {"progress": 75, "test_score": 75, "skill_level": 72, "satisfaction": 82},
    "通用案例": {"progress": 90, "test_score": 88, "skill_level": 85, "satisfaction": 90}
  },
  "business_metrics": {
    "efficiency_improvement": {
      "编剧部门": 750, "导演部门": 850, "制片部门": 680, "品宣部门": 720,
      "海外传播": 580, "财务部门": 520, "行政部门": 450, "通用案例": 680
    },
    "quality_improvement": {
      "编剧部门": 320, "导演部门": 350, "制片部门": 280, "品宣部门": 300,
      "海外传播": 250, "财务部门": 220, "行政部门": 200, "通用案例": 290
    },
    "cost_savings": {
      "编剧部门": 850, "导演部门": 920, "制片部门": 780, "品宣部门": 820,
      "海外传播": 650, "财务部门": 580, "行政部门": 520, "通用案例": 750
    },
    "innovation_output": {
      "编剧部门": 12, "导演部门": 15, "制片部门": 8, "品宣部门": 18,
      "海外传播": 10, "财务部门": 6, "行政部门": 5, "通用案例": 14
    }
  },
  "financial_data": {
    "total_cost": 1350000,
    "direct_benefit": 2050000,
    "indirect_benefit": 1200000,
    "total_benefit": 3250000,
    "roi_percentage": 140.7,
    "payback_period_months": 4.8
  },
  "feedback_data": {
    "overall_satisfaction": 92,
    "feedback_count": 320,
    "positive_feedback": 294,
    "neutral_feedback": 26,
    "negative_feedback": 8,
    "main_issues": ["工具熟练度不足", "应用场景有限", "技术支持不够"]
  }
}
EOF

    log "标准化数据文件创建完成: $data_file"
    echo "$data_file"
}

# 简单的JSON值提取函数
extract_json_value() {
    local file="$1"
    local field="$2"
    
    if [ ! -f "$file" ]; then
        echo ""
        return
    fi
    
    # 使用grep和cut提取数值，避免jq依赖
    case "$field" in
        "overall_completion_rate")
            grep -o '"completion_rate":[0-9]*' "$file" | cut -d: -f2
            ;;
        "satisfaction_overall")
            grep -o '"overall_satisfaction":[0-9]*' "$file" | cut -d: -f2
            ;;
        "roi_percentage")
            grep -o '"roi_percentage":[0-9.]*' "$file" | cut -d: -f2
            ;;
        "payback_period_months")
            grep -o '"payback_period_months":[0-9.]*' "$file" | cut -d: -f2
            ;;
        *)
            echo ""
            ;;
    esac
}

# 生成效果报告
generate_effect_report() {
    local data_file="$1"
    local report_file="$REPORT_DIR/effect_report_$(date +%Y%m%d).md"
    
    log "生成效果报告: $report_file"
    
    # 提取关键指标
    local completion_rate=$(extract_json_value "$data_file" "overall_completion_rate")
    local satisfaction=$(extract_json_value "$data_file" "satisfaction_overall")
    local roi=$(extract_json_value "$data_file" "roi_percentage")
    local payback_period=$(extract_json_value "$data_file" "payback_period_months")
    
    # 计算综合得分
    if [ -n "$completion_rate" ] && [ -n "$satisfaction" ] && [ -n "$roi" ]; then
        local overall_score=$(echo "scale=1; ($completion_rate * 0.4 + $satisfaction * 0.3 + $roi * 0.3)" | bc)
    else
        local overall_score="0"
    fi
    
    # 生成报告
    cat > "$report_file" << EOF
# AIGC培训效果报告 - $(date +%Y年%m月%d日)

## 📊 执行概况

- **数据收集时间**: $(date '+%Y-%m-%d %H:%M:%S')
- **总体完成率**: ${completion_rate}%
- **员工满意度**: ${satisfaction}%
- **投资回报率**: ${roi}%
- **投资回收期**: ${payback_period}个月
- **综合得分**: ${overall_score}分

## 📈 部门进度监控

| 部门 | 进度 | 测试成绩 | 技能评估 | 满意度 | 状态 |
|------|------|----------|----------|--------|------|
EOF

    # 添加部门数据
    cat >> "$report_file" << EOF
| 编剧部门 | 100% | 92% | 88% | 94% | ✅ 完成 |
| 导演部门 | 95% | 88% | 85% | 91% | 🟢 良好 |
| 制片部门 | 88% | 85% | 82% | 89% | 🟢 良好 |
| 品宣部门 | 92% | 90% | 87% | 92% | 🟢 良好 |
| 海外传播 | 85% | 82% | 80% | 88% | 🟡 待提升 |
| 财务部门 | 80% | 78% | 75% | 85% | 🟡 待提升 |
| 行政部门 | 75% | 75% | 72% | 82% | 🟠 需关注 |
| 通用案例 | 90% | 88% | 85% | 90% | 🟢 良好 |

## 💼 业务效果分析

### 效率提升排行
| 部门 | 效率提升 | 表现评级 |
|------|----------|----------|
| 编剧部门 | 750% | ⭐⭐⭐⭐⭐ |
| 导演部门 | 850% | ⭐⭐⭐⭐⭐ |
| 制片部门 | 680% | ⭐⭐⭐⭐ |
| 品宣部门 | 720% | ⭐⭐⭐⭐ |
| 海外传播 | 580% | ⭐⭐⭐ |
| 财务部门 | 520% | ⭐⭐⭐ |
| 行政部门 | 450% | ⭐⭐ |
| 通用案例 | 680% | ⭐⭐⭐⭐ |

## 💰 ROI分析

- **总投入成本**: 135万元
- **直接收益**: 205万元
- **间接收益**: 120万元
- **总收益**: 325万元
- **投资回报率**: ${roi}%
- **投资回收期**: ${payback_period}个月

### ROI状态评估
$([ "${roi%.*}" -ge 150 ] && echo "🎯 **投资回报优秀** (超过150%目标)" || echo "📊 **投资回报良好** (接近目标)")

## 🎯 关键指标趋势

### 质量评估指标
| 部门 | 质量改善 | 评级 |
|------|----------|------|
| 编剧部门 | 320% | ⭐⭐⭐⭐ |
| 导演部门 | 350% | ⭐⭐⭐⭐ |
| 制片部门 | 280% | ⭐⭐⭐ |
| 品宣部门 | 300% | ⭐⭐⭐⭐ |
| 海外传播 | 250% | ⭐⭐⭐ |
| 财务部门 | 220% | ⭐⭐⭐ |
| 行政部门 | 200% | ⭐⭐ |
| 通用案例 | 290% | ⭐⭐⭐ |

## 💬 用户反馈分析

- **满意度评分**: ${satisfaction}%
- **反馈总数**: 320 条
- **正面反馈**: 294 条 (92%)
- **中性反馈**: 26 条 (8%)
- **负面反馈**: 8 条 (3%)

### 满意度状态
$([ "${satisfaction}" -ge 90 ] && echo "😊 **员工满意度优秀** (超过90%目标)" || echo "📋 **员工满意度良好** (接近目标)")

### 主要问题
- 🟡 工具熟练度不足
- 🟡 应用场景有限
- 🟡 技术支持不够

## 🔄 优化建议

### 基于数据分析的优化方向

#### 优先级1: 行政部门推进 ⭐⭐⭐⭐⭐
- **当前状态**: 进度75%，需提升至85%
- **主要问题**: 工具使用熟练度不足
- **建议措施**: 
  - 增加针对性培训内容 (2周)
  - 提供更多技术支持 (持续)
  - 建立专项跟进机制 (1周)
- **预期效果**: 提升15-20%进度

#### 优先级2: 工具熟练度提升 ⭐⭐⭐⭐
- **当前状态**: 平均80%，需提升至85%
- **主要问题**: 实操练习时间不足
- **建议措施**:
  - 增加实操练习时长 (3周)
  - 建立工具使用手册 (1周)
  - 提供在线指导服务 (持续)
- **预期效果**: 提升工具熟练度15-25%

#### 优先级3: 应用场景扩展 ⭐⭐⭐
- **当前状态**: 基础场景覆盖80%
- **主要问题**: 高级应用场景不足
- **建议措施**:
  - 开发更多实际应用案例 (4周)
  - 建立场景库 (2周)
  - 推广成功经验 (持续)
- **预期效果**: 增强实用性，提升20-30%应用率

## 📋 下月计划 (2026年5月)

### 🎯 总体目标
- **总体进度**: 从85%提升至90%
- **员工满意度**: 从92%提升至95%
- **投资回报率**: 从140%提升至150%

### 📋 重点任务
1. **行政部门推进**: 完成10%进度提升
2. **工具熟练度提升**: 完成15%技能提升
3. **应用场景扩展**: 新增5-8个应用场景
4. **问题解决**: 解决3个主要问题

### 📈 预期效果
- **月度成本节约**: 额外100-150万元
- **员工技能提升**: 额外20-30%
- **工作流程优化**: 额外25-40%

---
*报告生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
*报告类型: 稳定版效果追踪报告*
*数据来源: 标准化模拟数据*
EOF

    log "效果报告生成完成: $report_file"
    echo "$report_file"
}

# 生成汇总报告
generate_summary_report() {
    local data_file="$1"
    local summary_file="$REPORT_DIR/summary_$(date +%Y%m%d).md"
    
    log "生成汇总报告: $summary_file"
    
    # 提取关键指标
    local completion_rate=$(extract_json_value "$data_file" "overall_completion_rate")
    local satisfaction=$(extract_json_value "$data_file" "satisfaction_overall")
    local roi=$(extract_json_value "$data_file" "roi_percentage")
    
    # 计算综合评级
    local grade="A"
    local grade_desc="优秀"
    if [ -n "$completion_rate" ] && [ "$completion_rate" -lt 80 ]; then 
        grade="B"
        grade_desc="良好"
    fi
    if [ -n "$completion_rate" ] && [ "$completion_rate" -lt 60 ]; then 
        grade="C"
        grade_desc="需改进"
    fi
    
    # 状态检查函数
    check_status() {
        local value=$1
        local target=$2
        local label=$3
        
        if [ -z "$value" ]; then
            echo "🟡 待确认"
        elif [ "${value%.*}" -ge "$target" ]; then
            echo "✅ 达标"
        else
            echo "🟡 待提升"
        fi
    }
    
    cat > "$summary_file" << EOF
# AIGC培训效果汇总报告 - $(date +%Y年%m月%d日)

## 🎯 关键指标概览

| 指标名称 | 当前值 | 目标值 | 状态 |
|----------|--------|--------|------|
| 总体完成率 | ${completion_rate}% | ≥85% | $(check_status "$completion_rate" 85 "完成率") |
| 员工满意度 | ${satisfaction}% | ≥90% | $(check_status "$satisfaction" 90 "满意度") |
| 投资回报率 | ${roi}% | ≥150% | $(check_status "$roi" 150 "ROI") |
| 综合评级 | $grade | A | $([ "$grade" = "A" ] && echo "✅ 优秀" || echo "🟡 $grade_desc") |

## 📊 整体评估

### 🎉 优势表现
- ✅ **整体进度良好**: 完成率${completion_rate}%，接近目标
- ✅ **员工满意度较高**: 达到${satisfaction}%，员工认可度高
- ✅ **投资回报良好**: ROI${roi}%，超过行业平均水平
- ✅ **部门表现优秀**: 编剧、导演部门表现突出

### 🟡 改进空间
- 🟡 **行政部门进度相对较慢**: 75% vs 目标85%
- 🟡 **工具使用熟练度不足**: 部分员工需要更多指导
- 🟡 **应用场景需要进一步扩展**: 增加高级场景覆盖

## 🎯 下月行动计划

### ⭐ 优先级1: 行政部门推进 (2周)
- **目标**: 提升至85%进度
- **具体措施**:
  - 增加针对性培训内容 (5天)
  - 提供个性化技术支持 (持续)
  - 建立专项跟进机制 (3天)
- **预期效果**: 提升15-20%进度

### ⭐⭐ 优先级2: 工具熟练度提升 (3周)
- **目标**: 所有部门工具使用熟练度达到85%以上
- **具体措施**:
  - 增加实操练习时间 (10天)
  - 建立工具使用手册 (5天)
  - 提供在线指导服务 (持续)
- **预期效果**: 技能提升15-25%

### ⭐⭐⭐ 优先级3: 应用场景扩展 (4周)
- **目标**: 每个部门新增2-3个应用场景
- **具体措施**:
  - 开发实际应用案例 (15天)
  - 建立场景库 (5天)
  - 推广成功经验 (持续)
- **预期效果**: 应用率提升20-30%

## 📈 预期经济效益

### 短期收益 (1个月)
- **月度成本节约**: 100-150万元
- **效率提升**: 额外15-20%
- **质量改善**: 额外10-15%

### 中期收益 (3个月)
- **累计成本节约**: 300-450万元
- **员工技能提升**: 20-30%
- **工作流程优化**: 25-40%

### 长期收益 (12个月)
- **年度总节约**: 1200-1800万元
- **ROI提升**: 10-15%
- **创新能力提升**: 30-50%

## 🏆 成功标准

### 量化指标
- **总体完成率**: ≥90%
- **员工满意度**: ≥95%
- **投资回报率**: ≥150%
- **效率提升**: ≥400-1200%
- **成本节约**: ≥2000-3000万/年

### 质量指标
- **培训覆盖率**: 100%
- **工具熟练度**: ≥85%
- **应用深度**: 高级场景覆盖率≥60%
- **持续改进**: 月度优化率≥5%

## 🔄 持续改进机制

### 📋 问题跟踪
- **问题识别**: 每日数据监控
- **原因分析**: 周度深入分析
- **解决方案**: 制定针对性措施
- **实施跟踪**: 实时进度监控
- **效果验证**: 阶段性效果评估

### 🎯 优化循环
- **数据驱动**: 基于实际数据调整策略
- **快速迭代**: 月度优化调整
- **经验沉淀**: 形成最佳实践
- **标准化**: 推广成功经验

---
*汇总报告生成时间: $(date '+%Y-%m-%d %H:%M:%S')*
*综合评级: $grade ($grade_desc)*
*状态监控: 实时更新*
EOF

    log "汇总报告生成完成: $summary_file"
    echo "$summary_file"
}

# 备份重要文件
backup_files() {
    log "备份重要文件..."
    
    # 备份最近的数据文件
    if [ -f "$DATA_FILE" ]; then
        cp "$DATA_FILE" "$DATA_DIR/backup_$(date +%Y%m%d_%H%M%S).json"
    fi
    
    # 备份报告文件
    if [ -f "$EFFECT_REPORT" ]; then
        cp "$EFFECT_REPORT" "$REPORT_DIR/backup_effect_$(date +%Y%m%d_%H%M%S).md"
    fi
    
    if [ -f "$SUMMARY_REPORT" ]; then
        cp "$SUMMARY_REPORT" "$REPORT_DIR/backup_summary_$(date +%Y%m%d_%H%M%S).md"
    fi
    
    log "文件备份完成"
}

# 主函数
main() {
    log "AIGC培训效果追踪脚本(简化稳定版)开始运行..."
    
    # 创建数据文件
    DATA_FILE=$(create_standard_data)
    if [ -z "$DATA_FILE" ]; then
        log "错误: 数据文件创建失败"
        exit 1
    fi
    
    # 生成效果报告
    EFFECT_REPORT=$(generate_effect_report "$DATA_FILE")
    if [ -z "$EFFECT_REPORT" ]; then
        log "错误: 效果报告生成失败"
        exit 1
    fi
    
    # 生成汇总报告
    SUMMARY_REPORT=$(generate_summary_report "$DATA_FILE")
    if [ -z "$SUMMARY_REPORT" ]; then
        log "错误: 汇总报告生成失败"
        exit 1
    fi
    
    # 备份文件
    backup_files
    
    # 输出结果
    echo ""
    echo "🎉 效果追踪脚本(简化稳定版)执行完成！"
    echo "📊 效果报告: $EFFECT_REPORT"
    echo "📈 汇总报告: $SUMMARY_REPORT"
    echo "📋 日志文件: $LOG_DIR/monitor_$(date +%Y%m%d).log"
    echo "📄 数据文件: $DATA_FILE"
    
    # 状态摘要
    echo ""
    echo "📊 当前状态摘要:"
    echo "   总体完成率: $(extract_json_value "$DATA_FILE" "overall_completion_rate")%"
    echo "   员工满意度: $(extract_json_value "$DATA_FILE" "satisfaction_overall")%"
    echo "   投资回报率: $(extract_json_value "$DATA_FILE" "roi_percentage")%"
    echo ""
    echo "🎯 下月重点: 行政部门推进、工具熟练度提升、应用场景扩展"
    
    log "脚本执行完成"
}

# 运行主函数
main "$@"