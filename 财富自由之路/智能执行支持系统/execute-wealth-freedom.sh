#!/bin/bash

# 💡 财富自由加速器 - 智能执行支持系统 v2.0
# 一键启动脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 配置变量
WEALTH_FREEDOM_PATH="～/.openclaw/workspace/财富自由之路"
PERSONAL_WEBSITE_PATH="$WEALTH_FREEDOM_PATH/personal-website"

# 日志函数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_highlight() {
    echo -e "${PURPLE}🌟 $1${NC}"
}

# 显示欢迎信息
show_welcome() {
    clear
    echo -e "${CYAN}"
    echo "============================================================"
    echo "💡 财富自由加速器 - 智能执行支持系统 v2.0"
    echo "============================================================"
    echo -e "${NC}"
    log_info "当前时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "工作路径: $WEALTH_FREEDOM_PATH"
    echo ""
}

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."
    
    # 检查工作目录
    if [[ ! -d "$WEALTH_FREEDOM_PATH" ]]; then
        log_error "工作目录不存在: $WEALTH_FREEDOM_PATH"
        exit 1
    fi
    
    # 检查个人网站目录
    if [[ ! -d "$PERSONAL_WEBSITE_PATH" ]]; then
        log_error "个人网站目录不存在: $PERSONAL_WEBSITE_PATH"
        exit 1
    fi
    
    # 检查Git安装
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    
    log_success "前置条件检查通过"
    echo ""
}

# 显示菜单
show_menu() {
    echo -e "${YELLOW}"
    echo "🎯 请选择要执行的任务:"
    echo ""
    echo "1. 🔥 GitHub个人网站部署 (10分钟)"
    echo "2. 🔥 技术文章批量发布 (60分钟)"
    echo "3. 🔥 财务优化计划执行 (20分钟)"
    echo "4. 🔥 系统监控与维护 (5分钟)"
    echo "5. 🚀 完整执行流程 (90分钟)"
    echo "6. 📊 查看当前状态"
    echo "7. ❌ 退出"
    echo ""
    echo -e "${NC}"
    
    read -p "请输入选项 (1-7): " choice
}

# GitHub个人网站部署
deploy_github_site() {
    log_highlight "🔥 开始GitHub个人网站部署"
    echo ""
    
    log_info "步骤1: 创建GitHub仓库"
    echo "请在浏览器中打开以下链接创建仓库:"
    echo "https://github.com/new"
    echo ""
    echo "仓库配置要求:"
    echo "- Repository name: personal-website"
    echo "- Description: 财富自由之路 - 个人技术博客"
    echo "- Public/Private: Public"
    echo "- 不要勾选任何初始化选项"
    echo ""
    
    read -p "创建完成后按回车继续..."
    
    log_info "步骤2: 推送代码到GitHub"
    echo "请替换以下命令中的 YOUR_USERNAME 为您的GitHub用户名:"
    echo ""
    echo "cd '$PERSONAL_WEBSITE_PATH'"
    echo "git remote add origin https://github.com/YOUR_USERNAME/personal-website.git"
    echo "git branch -M main"
    echo "git push -u origin main"
    echo ""
    
    read -p "执行完上述命令后按回车继续..."
    
    log_info "步骤3: 启用GitHub Pages"
    echo "请访问以下链接启用GitHub Pages:"
    echo "https://github.com/YOUR_USERNAME/personal-website/settings/pages"
    echo ""
    echo "配置要求:"
    echo "- Source: GitHub Actions"
    echo "- Branch: main"
    echo ""
    
    read -p "启用完成后按回车继续..."
    
    log_info "步骤4: 验证部署"
    echo "请访问以下链接验证网站是否正常显示:"
    echo "https://YOUR_USERNAME.github.io/personal-website/"
    echo ""
    
    log_success "GitHub个人网站部署完成！"
    echo ""
}

# 技术文章发布
publish_articles() {
    log_highlight "🔥 开始技术文章批量发布"
    echo ""
    
    log_info "文章清单:"
    echo "1. AIGC落地实战-从0到1构建企业级AI应用 (14,382字)"
    echo "2. AIGC时代的技术管理-如何带领团队拥抱AI (约25,000字)"
    echo "3. 从技术人到技术顾问-我的转型之路 (1,383词)"
    echo ""
    
    read -p "按回车开始发布第一篇文章..."
    
    # 发布第一篇文章
    log_info "发布文章1: AIGC落地实战"
    echo "请打开以下链接:"
    echo "https://zhuanlan.zhihu.com/write"
    echo ""
    echo "发布要求:"
    echo "- 上传封面图 (29KB, 1200x675px)"
    echo "- 复制文章内容"
    echo "- 添加话题标签: #AIGC #技术管理 #企业应用"
    echo ""
    
    read -p "知乎发布完成后，按回车继续其他平台..."
    
    log_info "继续发布到其他平台:"
    echo "1. 掘金: https://juejin.cn/write"
    echo "2. V2EX: https://www.v2ex.com/new/topic"
    echo ""
    
    read -p "所有平台发布完成后按回车继续..."
    
    log_success "技术文章批量发布完成！"
    echo ""
}

# 财务优化执行
execute_finance_optimization() {
    log_highlight "🔥 开始财务优化计划执行"
    echo ""
    
    log_info "优化计划概览:"
    echo "1. 订阅服务审查 (月节省¥450)"
    echo "2. 餐饮优化计划 (月节省¥150-200/天)"
    echo "3. 购物预算管控 (月节省¥300-600)"
    echo "总预期节省: ¥1,200-1,450/月"
    echo ""
    
    log_info "步骤1: 订阅服务审查"
    echo "检查并取消不必要的订阅服务:"
    echo "- 流媒体服务 (Netflix, Spotify等)"
    echo "- 软件服务 (Adobe Creative Cloud等)"
    echo "- 其他非必需的月度订阅"
    echo ""
    echo "预期节省: ¥450/月"
    echo ""
    
    read -p "请检查并取消订阅，完成后按回车继续..."
    
    log_info "步骤2: 餐饮优化计划"
    echo "实施自备午餐计划:"
    echo "- 采购一周午餐食材 (预算¥150-200)"
    echo "- 提前准备工作日午餐"
    echo "- 记录实际支出"
    echo ""
    echo "预期节省: ¥150-200/天"
    echo ""
    
    read -p "请准备本周午餐，完成后按回车继续..."
    
    log_info "步骤3: 购物预算管控"
    echo "建立购物控制机制:"
    echo "- 设定每月购物预算上限"
    echo "- 实施72小时冷静期"
    echo "- 检查购买优先级"
    echo ""
    echo "预期节省: ¥300-600/月"
    echo ""
    
    read -p "请设定购物控制机制，完成后按回车继续..."
    
    log_success "财务优化计划执行完成！"
    echo ""
}

# 系统监控
system_monitoring() {
    log_highlight "🔥 开始系统监控与维护"
    echo ""
    
    log_info "检查系统健康状态..."
    echo ""
    
    # 检查财务数据
    if [[ -f "$WEALTH_FREEDOM_PATH/数据看板/财务追踪/current-state.md" ]]; then
        log_success "财务数据文件存在"
    else
        log_warning "财务数据文件不存在"
    fi
    
    # 检查工作日志
    if [[ -f "$WEALTH_FREEDOM_PATH/工作日志/latest.md" ]]; then
        log_success "工作日志文件存在"
    else
        log_warning "工作日志文件不存在"
    fi
    
    # 检查任务清单
    if [[ -f "$WEALTH_FREEDOM_PATH/📋任务清单/当前任务.md" ]]; then
        log_success "任务清单文件存在"
    else
        log_warning "任务清单文件不存在"
    fi
    
    echo ""
    log_info "执行日常维护任务..."
    
    # 清理临时文件
    log_info "清理临时文件..."
    find "$WEALTH_FREEDOM_PATH" -name "*.tmp" -delete 2>/dev/null || true
    
    # 备份重要文件
    log_info "备份重要文件..."
    backup_dir="$WEALTH_FREEDOM_PATH/备份/$(date +%Y-%m-%d)"
    mkdir -p "$backup_dir"
    cp "$WEALTH_FREEDOM_PATH/工作日志/latest.md" "$backup_dir/" 2>/dev/null || true
    cp "$WEALTH_FREEDOM_PATH/数据看板/财务追踪/current-state.md" "$backup_dir/" 2>/dev/null || true
    
    log_success "系统监控与维护完成！"
    echo ""
}

# 查看状态
show_status() {
    log_highlight "📊 当前系统状态"
    echo ""
    
    # 检查文件存在性
    check_file() {
        if [[ -f "$1" ]]; then
            echo "✅ $2"
        else
            echo "❌ $2"
        fi
    }
    
    check_directory() {
        if [[ -d "$1" ]]; then
            echo "✅ $2"
        else
            echo "❌ $2"
        fi
    }
    
    echo "📁 文件状态:"
    check_file "$WEALTH_FREEDOM_PATH/工作日志/latest.md" "工作日志"
    check_file "$WEALTH_FREEDOM_PATH/数据看板/财务追踪/current-state.md" "财务数据"
    check_file "$WEALTH_FREEDOM_PATH/立即行动清单-心跳256.md" "行动清单"
    
    echo ""
    echo "🌐 网站状态:"
    if [[ -d "$PERSONAL_WEBSITE_PATH" ]]; then
        echo "✅ 个人网站目录存在"
        echo "📂 目录内容:"
        ls -la "$PERSONAL_WEBSITE_PATH" | head -10
    else
        echo "❌ 个人网站目录不存在"
    fi
    
    echo ""
    echo "📋 任务状态:"
    if [[ -f "$WEALTH_FREEDOM_PATH/📋任务清单/当前任务.md" ]]; then
        echo "✅ 任务清单文件存在"
        head -10 "$WEALTH_FREEDOM_PATH/📋任务清单/当前任务.md"
    else
        echo "❌ 任务清单文件不存在"
    fi
    
    echo ""
    log_info "系统状态检查完成"
    echo ""
}

# 执行完整流程
execute_full_process() {
    log_highlight "🚀 开始完整执行流程"
    echo ""
    log_info "预计总时间: 90分钟"
    log_info "包含任务: GitHub部署 + 文章发布 + 财务优化 + 系统监控"
    echo ""
    
    read -p "确认开始完整执行流程吗? (y/n): " confirm
    if [[ "$confirm" != "y" ]]; then
        log_warning "取消完整执行流程"
        return
    fi
    
    deploy_github_site
    publish_articles
    execute_finance_optimization
    system_monitoring
    
    log_success "🎉 完整执行流程完成！"
    echo ""
}

# 主程序
main() {
    show_welcome
    check_prerequisites
    
    while true; do
        show_menu
        
        case $choice in
            1)
                deploy_github_site
                ;;
            2)
                publish_articles
                ;;
            3)
                execute_finance_optimization
                ;;
            4)
                system_monitoring
                ;;
            5)
                execute_full_process
                ;;
            6)
                show_status
                ;;
            7)
                log_highlight "感谢使用财富自由加速器！"
                exit 0
                ;;
            *)
                log_error "无效选项，请重新选择"
                ;;
        esac
        
        echo ""
        read -p "按回车键返回主菜单..."
    done
}

# 启动主程序
main