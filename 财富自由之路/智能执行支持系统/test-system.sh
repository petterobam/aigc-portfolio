#!/bin/bash

# 🧪 智能执行支持系统v2.0 - 测试脚本
# 用于验证系统功能的完整性

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 测试配置
WEALTH_FREEDOM_PATH="～/.openclaw/workspace/财富自由之路"
SMART_SYSTEM_PATH="$WEALTH_FREEDOM_PATH/智能执行支持系统"

# 测试结果计数
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 测试函数
run_test() {
    local test_name="$1"
    local test_command="$2"

    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${BLUE}🧪 测试 $TOTAL_TESTS: $test_name${NC}"

    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
    echo ""
}

# 显示测试标题
show_test_header() {
    echo -e "${CYAN}"
    echo "============================================================"
    echo "🧪 智能执行支持系统v2.0 - 功能测试"
    echo "============================================================"
    echo -e "${NC}"
    echo "测试路径: $SMART_SYSTEM_PATH"
    echo "测试时间: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
}

# 显示测试结果
show_test_results() {
    echo -e "${CYAN}"
    echo "============================================================"
    echo "📊 测试结果汇总"
    echo "============================================================"
    echo -e "${NC}"

    echo "总测试数: $TOTAL_TESTS"
    echo "通过数: $PASSED_TESTS"
    echo "失败数: $FAILED_TESTS"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 所有测试通过！系统功能正常！${NC}"
    else
        echo -e "${RED}⚠️  有 $FAILED_TESTS 个测试失败，请检查系统配置${NC}"
    fi

    echo ""
    echo "测试完成时间: $(date '+%Y-%m-%d %H:%M:%S')"
}

# 开始测试
show_test_header

# 测试1: 检查系统目录是否存在
echo "🔍 检查系统基础结构..."
run_test "智能执行系统目录存在" "test -d '$SMART_SYSTEM_PATH'"

# 测试2: 检查核心脚本文件
echo "🔍 检查核心脚本文件..."
run_test "快速启动脚本存在" "test -f '$SMART_SYSTEM_PATH/quick-start.sh'"
run_test "完整执行脚本存在" "test -f '$SMART_SYSTEM_PATH/execute-wealth-freedom.sh'"

# 测试3: 检查脚本执行权限
echo "🔍 检查脚本执行权限..."
run_test "快速启动脚本可执行" "test -x '$SMART_SYSTEM_PATH/quick-start.sh'"
run_test "完整执行脚本可执行" "test -x '$SMART_SYSTEM_PATH/execute-wealth-freedom.sh'"

# 测试4: 检查配置文件
echo "🔍 检查配置文件..."
run_test "系统配置文件存在" "test -f '$SMART_SYSTEM_PATH/智能执行支持系统配置-v2.0.md'"
run_test "README文件存在" "test -f '$SMART_SYSTEM_PATH/README.md'"
run_test "行动清单文件存在" "test -f '$WEALTH_FREEDOM_PATH/立即行动清单-智能执行系统-v2.0.md'"

# 测试5: 检查相关文件
echo "🔍 检查相关文件..."
run_test "工作日志最新记录存在" "test -f '$WEALTH_FREEDOM_PATH/工作日志/latest.md'"
run_test "心跳文件存在" "test -f '$WEALTH_FREEDOM_PATH/HEARTBEAT.md'"
run_test "个人网站目录存在" "test -d '$WEALTH_FREEDOM_PATH/personal-website'"

# 测试6: 检查文件内容
echo "🔍 检查文件内容完整性..."
run_test "配置文件包含核心内容" "grep -q '智能执行支持系统' '$SMART_SYSTEM_PATH/智能执行支持系统配置-v2.0.md'"
run_test "README包含使用说明" "grep -q '快速启动' '$SMART_SYSTEM_PATH/README.md'"
run_test "行动清单包含启动命令" "grep -q 'quick-start.sh' '$WEALTH_FREEDOM_PATH/立即行动清单-智能执行系统-v2.0.md'"

# 测试7: 检查脚本语法
echo "🔍 检查脚本语法..."
run_test "快速启动脚本语法正确" "bash -n '$SMART_SYSTEM_PATH/quick-start.sh'"
run_test "完整执行脚本语法正确" "bash -n '$SMART_SYSTEM_PATH/execute-wealth-freedom.sh'"

# 测试8: 检查执行路径
echo "🔍 检查执行路径..."
run_test "工作路径存在" "test -d '$WEALTH_FREEDOM_PATH'"
run_test "智能系统路径存在" "test -d '$SMART_SYSTEM_PATH'"

# 测试9: 检查文件大小
echo "🔍 检查文件大小..."
run_test "配置文件大小正常" "[ $(wc -c < '$SMART_SYSTEM_PATH/智能执行支持系统配置-v2.0.md') -gt 1000 ]"
run_test "脚本文件大小正常" "[ $(wc -c < '$SMART_SYSTEM_PATH/execute-wealth-freedom.sh') -gt 1000 ]"

# 测试10: 检查文档内容
echo "🔍 检查文档内容..."
run_test "心跳文件包含最新进展" "grep -q '智能执行支持系统v2.0' '$WEALTH_FREEDOM_PATH/HEARTBEAT.md'"
run_test "执行报告存在" "test -f '$WEALTH_FREEDOM_PATH/工作日志/wealth-freedom-cron执行报告-2026-04-06.md'"

# 显示测试结果
echo ""
show_test_results

# 根据测试结果决定退出状态
if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 系统测试全部通过，准备就绪！${NC}"
    exit 0
else
    echo -e "${RED}⚠️  有 $FAILED_TESTS 个测试失败，请检查系统配置${NC}"
    exit 1
fi
