#!/bin/bash

# 🚀 财富自由加速器 - 快速启动脚本
# 一键式智能执行体验

# 设置工作路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEALTH_FREEDOM_DIR="$(dirname "$SCRIPT_DIR")"

# 显示欢迎信息
echo "🎯 财富自由加速器 - 快速启动"
echo "=================================="
echo "💡 一键执行关键任务，加速财务自由之路"
echo ""

# 询问执行模式
echo "选择执行模式:"
echo "1. 🚀 快速执行 (推荐新手用户)"
echo "2. 🔧 高级执行 (推荐有经验的用户)"
echo "3. 📊 状态检查"
echo "4. ❌ 退出"
echo ""

read -p "请输入选择 (1-4): " mode

case $mode in
    1)
        echo "🚀 启动快速执行模式..."
        echo "将自动执行：GitHub部署 + 文章发布 + 财务优化"
        read -p "确认开始? (y/n): " confirm
        
        if [[ "$confirm" == "y" ]]; then
            echo "✅ 开始执行快速流程..."
            cd "$WEALTH_FREEDOM_DIR"
            bash "智能执行支持系统/execute-wealth-freedom.sh"
        else
            echo "❌ 取消执行"
        fi
        ;;
    2)
        echo "🔧 启动高级执行模式..."
        echo "提供完整的执行控制和自定义选项"
        read -p "确认开始? (y/n): " confirm
        
        if [[ "$confirm" == "y" ]]; then
            echo "✅ 进入高级执行界面..."
            cd "$WEALTH_FREEDOM_DIR"
            bash "智能执行支持系统/execute-wealth-freedom.sh"
        else
            echo "❌ 取消执行"
        fi
        ;;
    3)
        echo "📊 执行状态检查..."
        if [[ -f "$WEALTH_FREEDOM_DIR/工作日志/latest.md" ]]; then
            echo "✅ 工作日志: 最新记录存在"
            echo "📅 最新更新时间: $(stat -f "%Sm" "$WEALTH_FREEDOM_DIR/工作日志/latest.md")"
        else
            echo "❌ 工作日志: 无最新记录"
        fi
        
        if [[ -d "$WEALTH_FREEDOM_DIR/personal-website" ]]; then
            echo "✅ 个人网站: 目录存在"
            echo "📁 文件数量: $(ls -1 "$WEALTH_FREEDOM_DIR/personal-website" | wc -l)"
        else
            echo "❌ 个人网站: 目录不存在"
        fi
        
        if [[ -f "$WEALTH_FREEDOM_DIR/立即行动清单-心跳256.md" ]]; then
            echo "✅ 行动清单: 存在待执行任务"
        else
            echo "⚠️  行动清单: 无待执行任务"
        fi
        ;;
    4)
        echo "👋 感谢使用财富自由加速器！"
        exit 0
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

echo ""
echo "🎉 执行完成！查看详细结果请访问:"
echo "$WEALTH_FREEDOM_DIR/智能执行支持系统/"