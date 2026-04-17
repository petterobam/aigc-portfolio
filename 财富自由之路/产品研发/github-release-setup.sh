#!/bin/bash

# GitHub 仓库初始化和发布脚本
# 使用前请先安装 git：`brew install git`（macOS）或从 https://git-scm.com/downloads 下载（Windows）

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 git 是否安装
if ! command -v git &> /dev/null; then
    print_error "git 未安装，请先安装 git"
    exit 1
fi

# 进入项目目录
cd "$(dirname "$0")/code/wealth-freedom"
PROJECT_DIR=$(pwd)

print_info "当前项目目录：$PROJECT_DIR"

# 检查是否已经初始化 git 仓库
if [ -d ".git" ]; then
    print_warning "Git 仓库已存在，跳过初始化"
else
    print_info "初始化 Git 仓库..."
    git init
    print_info "Git 仓库初始化完成"
fi

# 检查是否有 .gitignore
if [ ! -f ".gitignore" ]; then
    print_info "创建 .gitignore 文件..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnpm-store/

# Build outputs
dist/
out/
release/
*.dmg
*.exe
*.AppImage
*.deb

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo

# Database
*.db
*.db-shm
*.db-wal

# Test files
test-*.js
test-*.png
test-downloads/

# Temporary files
*.tmp
.temp/
EOF
    print_info ".gitignore 文件创建完成"
fi

# 检查是否有 README.md
if [ ! -f "README.md" ]; then
    print_info "创建 README.md 文件..."
    cat > README.md << 'EOF'
# 财富自由之路

> 一款帮助你实现财务自由的个人财务管理软件

## 下载

最新版本：v0.1.0

下载链接：[GitHub Releases](https://github.com/xxx/wealth-freedom/releases/latest)

## 功能

- 资产配置可视化工具
- 财务三阶段进度追踪
- 投资收益预测
- 数据导出（PDF、图片）

## 系统要求

- macOS：10.15 或更高版本
- Windows：Windows 10 或更高版本

## 安装说明

详见：[GitHub Release](https://github.com/xxx/wealth-freedom/releases/latest)

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build
```

## 许可证

MIT License

## 联系我们

- GitHub：https://github.com/xxx/wealth-freedom
- 邮箱：your.email@example.com
EOF
    print_info "README.md 文件创建完成"
fi

# 添加文件到暂存区
print_info "添加文件到 Git 暂存区..."
git add .

# 创建初始提交
print_info "创建初始提交..."
git commit -m "Initial commit: 财富自由之路 v0.1.0"

print_info "Git 仓库初始化完成！"
print_info ""
print_warning "接下来需要手动完成以下步骤："
print_info "1. 在 GitHub 上创建新仓库：https://github.com/new"
print_info "2. 仓库名称建议：wealth-freedom"
print_info "3. 仓库权限选择：Public（公开）或 Private（私有）"
print_info "4. 创建后，复制远程仓库 URL"
print_info ""
print_info "5. 添加远程仓库（替换以下命令中的 YOUR_USERNAME）："
echo "   git remote add origin https://github.com/YOUR_USERNAME/wealth-freedom.git"
print_info ""
print_info "6. 推送到 GitHub（首次推送）："
echo "   git push -u origin main"
print_info ""
print_info "7. 创建 GitHub Release："
print_info "   - 访问：https://github.com/YOUR_USERNAME/wealth-freedom/releases/new"
print_info "   - 选择标签：v0.1.0"
print_info "   - 标题：财富自由之路 v0.1.0"
print_info "   - 描述：复制 ../GitHub-Release-文案-心跳214.md 的内容"
print_info "   - 上传安装包（需要先完成打包）"
print_info "   - 点击 Publish release"
print_info ""
print_info "完成！"
EOF
