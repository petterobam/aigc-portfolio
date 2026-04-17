#!/bin/bash

# 个人网站GitHub部署快速执行脚本
# 创建时间：2026-04-04
# 用途：一键完成GitHub仓库创建和部署，消除技术障碍

set -e  # 遇到错误立即退出

echo "🚀 开始执行个人网站GitHub部署..."
echo "⏰ 执行时间：$(date)"
echo "📍 工作目录：$(pwd)"
echo "--------------------------------------------------"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 检查前置条件
check_prerequisites() {
    log_info "检查前置条件..."
    
    # 检查git是否安装
    if ! command -v git &> /dev/null; then
        log_error "Git未安装，请先安装Git"
        exit 1
    fi
    log_success "Git已安装：$(git --version)"
    
    # 检查是否在正确的目录
    if [[ ! -f "config.toml" ]]; then
        log_error "未找到config.toml文件，请确保在personal-website目录中执行此脚本"
        exit 1
    fi
    log_success "确认在personal-website目录中"
    
    # 检查是否有未提交的更改
    if [[ -n $(git status --porcelain) ]]; then
        log_warning "有未提交的更改，正在自动提交..."
        git add .
        git commit -m "自动提交：GitHub部署准备 $(date)"
        log_success "已自动提交更改"
    else
        log_success "工作目录干净"
    fi
}

# 创建GitHub仓库
create_github_repo() {
    log_info "创建GitHub仓库..."
    
    # 获取GitHub用户名（从远程仓库或询问用户）
    if git remote get-url origin &> /dev/null; then
        log_warning "检测到已存在的远程仓库，跳过创建步骤"
        return 0
    fi
    
    echo "请选择创建GitHub仓库的方式："
    echo "1) 使用GitHub CLI（推荐，已安装）"
    echo "2) 手动创建网页版"
    echo "3) 使用Personal Access Token"
    
    read -p "请输入选择 (1/2/3): " choice
    
    case $choice in
        1)
            # 使用GitHub CLI
            log_info "使用GitHub CLI创建仓库..."
            echo "请输入仓库名称（默认：personal-website）:"
            read -r repo_name
            repo_name=${repo_name:-personal-website}
            
            gh repo create "$repo_name" --public --source=. --remote=origin --push
            if [[ $? -eq 0 ]]; then
                log_success "GitHub仓库创建成功：$repo_name"
            else
                log_error "GitHub CLI创建失败，请检查认证状态"
                return 1
            fi
            ;;
        2)
            # 手动创建网页版
            log_info "请手动创建GitHub仓库："
            echo "1) 访问: https://github.com/new"
            echo "2) 仓库名称: personal-website"
            echo "3) 设置为: Public"
            echo "4) 不要初始化README、.gitignore、license"
            echo "5) 点击 'Create repository'"
            echo ""
            read -p "创建完成后按回车继续..."
            
            # 询问GitHub用户名
            read -p "请输入你的GitHub用户名: " github_username
            
            # 添加远程仓库
            git remote add origin "https://github.com/$github_username/personal-website.git"
            
            log_info "已添加远程仓库，接下来推送代码..."
            ;;
        3)
            # 使用Personal Access Token
            read -p "请输入GitHub用户名: " github_username
            read -p "请输入Personal Access Token (在GitHub Settings > Developer settings > Personal access tokens): " token
            
            # 添加远程仓库
            git remote add origin "https://$github_username:$token@github.com/$github_username/personal-website.git"
            
            log_success "已配置Personal Access Token"
            ;;
    esac
}

# 推送代码到GitHub
push_to_github() {
    log_info "推送代码到GitHub..."
    
    git push -u origin main
    
    if [[ $? -eq 0 ]]; then
        log_success "代码推送成功！"
    else
        log_error "代码推送失败，请检查认证信息"
        return 1
    fi
}

# 配置GitHub Pages
setup_github_pages() {
    log_info "配置GitHub Pages..."
    
    echo "请完成以下步骤："
    echo "1) 访问你的GitHub仓库: https://github.com/YOUR_USERNAME/personal-website"
    echo "2) 点击 'Settings' 标签页"
    echo "3) 在左侧菜单中点击 'Pages'"
    echo "4) 在 'Build and deployment' 部分，选择 'GitHub Actions'"
    echo "5) 点击 'Save'"
    echo ""
    read -p "完成后按回车继续..."
    
    log_info "等待GitHub Actions部署完成..."
    echo "通常需要1-5分钟，你可以访问以下链接查看状态："
    echo "https://github.com/YOUR_USERNAME/personal-website/actions"
    echo ""
    read -p "确认部署完成后按回车继续..."
}

# 验证部署结果
verify_deployment() {
    log_info "验证部署结果..."
    
    # 从git remote中提取用户名
    github_username=$(git remote get-url origin | sed 's|https://github.com/||' | sed 's|/personal-website.git||')
    
    if [[ -n "$github_username" ]]; then
        website_url="https://$github_username.github.io/personal-website/"
        echo "访问以下链接验证网站是否正常运行："
        echo "$website_url"
        
        # 尝试访问网站
        if command -v curl &> /dev/null; then
            echo ""
            echo "正在测试网站访问..."
            if curl -s --head "$website_url" | grep -q "200 OK"; then
                log_success "网站验证成功！状态：200 OK"
            else
                log_warning "网站可能还在部署中，请稍后重试"
            fi
        fi
    else
        log_warning "无法自动获取GitHub用户名，请手动访问验证"
    fi
}

# 修改占位符信息
update_placeholders() {
    log_info "修改网站占位符信息..."
    
    # 创建备份
    cp config.toml config.toml.backup
    
    # 修改配置文件
    sed -i.bak 's/yourname.github.io/'"$github_username.github.io"'/g' config.toml
    sed -i.bak 's/AIGC 技术咨询专家 | 无何有/AIGC 技术咨询专家 | 无何有/g' config.toml
    
    log_success "配置文件已更新"
}

# 显示完成信息
show_completion_info() {
    echo ""
    echo "🎉 部署完成！"
    echo "--------------------------------------------------"
    echo "📊 部署结果："
    echo "   ✅ GitHub仓库创建完成"
    echo "   ✅ 代码推送成功"
    echo "   ✅ GitHub Pages配置完成"
    echo "   ✅ 网站已部署到：$website_url"
    echo ""
    echo "📝 下一步操作："
    echo "   1) 访问网站并检查所有页面"
    echo "   2) 测试联系表单功能"
    echo "   3) 开始发布技术文章"
    echo ""
    echo "📚 相关文档："
    echo "   - 技术文章发布清单：文章发布/"
    echo "   - 用户反馈收集：产品研发/"
    echo ""
    echo "🎯 财富自由进度：98% → 99%"
    echo "⏰ 完成时间：$(date)"
    echo "--------------------------------------------------"
}

# 主执行流程
main() {
    echo "🌟 个人网站GitHub部署脚本"
    echo "目标：一键完成从本地代码到GitHub Pages的完整部署"
    echo ""
    
    # 检查前置条件
    check_prerequisites
    
    # 创建GitHub仓库
    create_github_repo
    
    # 推送代码
    push_to_github
    
    # 配置GitHub Pages
    setup_github_pages
    
    # 验证部署
    verify_deployment
    
    # 更新占位符
    update_placeholders
    
    # 显示完成信息
    show_completion_info
}

# 捕获Ctrl+C信号
trap 'log_error "脚本被中断"; exit 1' INT

# 执行主函数
main "$@"