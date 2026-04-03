#!/usr/bin/env bash
set -euo pipefail

#
# aigc-portfolio 一键部署脚本 (Vercel)
#
# 用法:
#   ./deploy.sh              # 部署到生产环境
#   ./deploy.sh preview      # 部署预览版本
#   ./deploy.sh --help       # 查看帮助
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ── 颜色 ───────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; }

# ── 帮助 ───────────────────────────────────────────────
show_help() {
  cat <<EOF
aigc-portfolio 一键部署脚本

用法:
  ./deploy.sh              部署到 Vercel 生产环境
  ./deploy.sh preview      部署预览版本（不影响生产）
  ./deploy.sh --help       显示帮助信息

前提条件:
  1. 已安装 Node.js >= 18
  2. 已安装 Vercel CLI:  npm install -g vercel
  3. 已登录 Vercel:      vercel login

流程:
  npm install → npm run build (webpack) → vercel deploy
EOF
  exit 0
}

# ── 参数解析 ─────────────────────────────────────────────
MODE="production"
if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  show_help
elif [[ "${1:-}" == "preview" ]]; then
  MODE="preview"
fi

echo ""
echo "============================================"
echo "  aigc-portfolio 一键部署 (Vercel)"
echo "============================================"
echo ""

# ── 前置检查 ─────────────────────────────────────────────
info "检查运行环境..."

if ! command -v node &>/dev/null; then
  error "未检测到 Node.js，请先安装: https://nodejs.org/"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
  error "Node.js 版本过低 (当前: $(node -v))，需要 >= 18"
  exit 1
fi
success "Node.js $(node -v)"

if ! command -v vercel &>/dev/null; then
  warn "未检测到 Vercel CLI，正在安装..."
  npm install -g vercel
  if ! command -v vercel &>/dev/null; then
    error "Vercel CLI 安装失败，请手动执行: npm install -g vercel"
    exit 1
  fi
fi
success "Vercel CLI $(vercel --version 2>/dev/null | head -1)"

# ── 安装依赖 ─────────────────────────────────────────────
info "安装项目依赖..."
npm install --prefer-offline --no-audit --no-fund
success "依赖安装完成"

# ── 构建 ─────────────────────────────────────────────────
info "构建生产版本 (使用 webpack 以兼容中文路径)..."
npx next build --webpack
success "构建成功"

# ── 部署 ─────────────────────────────────────────────────
if [[ "$MODE" == "production" ]]; then
  info "部署到 Vercel 生产环境..."
  vercel --prod
  echo ""
  success "🚀 生产环境部署完成！"
else
  info "部署 Vercel 预览版本..."
  vercel
  echo ""
  success "🔍 预览版本部署完成！"
fi

echo ""
echo "============================================"
echo "  部署完成"
echo "============================================"
echo ""
