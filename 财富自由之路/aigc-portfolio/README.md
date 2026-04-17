# AIGC 个人网站

> 帮助企业快速落地 AI 应用的个人品牌网站

## 概述

这是一个基于 Next.js 14 + TypeScript + Tailwind CSS 构建的个人网站，用于展示 AIGC 技术咨询服务。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **部署**: Vercel (推荐)

## 功能特性

- ✅ 响应式设计（支持移动端）
- ✅ 深色模式支持
- ✅ SEO 优化
- ✅ 快速加载（Next.js 优化）
- ✅ 现代化 UI 设计

## 页面结构

- **首页** (`/`): Hero 区域 + 服务内容 + 成功案例 + CTA
- **关于我** (`/about`): 个人简介 + 技术栈 + 工作经历
- **服务内容** (`/services`): 详细的服务介绍和定价
- **博客** (`/blog`): 技术文章列表
- **联系我** (`/contact`): 联系表单 + 社交媒体链接

## 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000 查看网站

### 构建生产版本

```bash
npm run build
```

### 启动生产服务器

```bash
npm start
```

## 部署到 Vercel

### 方式 1: 使用 Vercel CLI（推荐）

1. 安装 Vercel CLI
```bash
npm i -g vercel
```

2. 登录 Vercel
```bash
vercel login
```

3. 部署
```bash
vercel
```

4. 部署生产版本
```bash
vercel --prod
```

### 方式 2: 使用 Vercel Dashboard

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "New Project"
3. 导入此项目
4. 点击 "Deploy"

## 自定义配置

### 修改个人信息

编辑以下文件以更新个人信息：

- `app/page.tsx`: 首页内容
- `app/about/page.tsx`: 关于我页面
- `app/services/page.tsx`: 服务内容页面
- `app/contact/page.tsx`: 联系信息
- `app/layout.tsx`: 网站元数据

### 修改主题颜色

在 Tailwind CSS 配置文件中修改主题颜色（如果需要自定义）

### 添加博客文章

在 `app/blog/` 目录下创建新文章页面，格式如下：

```
app/blog/[id]/page.tsx
```

## 项目结构

```
aigc-portfolio/
├── app/
│   ├── about/
│   │   └── page.tsx       # 关于我页面
│   ├── blog/
│   │   ├── page.tsx       # 博客列表页
│   │   └── [id]/
│   │       └── page.tsx   # 博客文章页
│   ├── contact/
│   │   └── page.tsx       # 联系我页面
│   ├── services/
│   │   └── page.tsx       # 服务内容页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── globals.css        # 全局样式
├── public/                # 静态资源
├── next.config.ts         # Next.js 配置
├── tailwind.config.ts     # Tailwind CSS 配置
├── tsconfig.json          # TypeScript 配置
└── package.json           # 项目依赖
```

## 脚本说明

- `npm run dev`: 启动开发服务器（热重载）
- `npm run build`: 构建生产版本
- `npm start`: 启动生产服务器
- `npm run lint`: 运行 ESLint 检查

## 浏览器支持

- Chrome (最新版)
- Firefox (最新版)
- Safari (最新版)
- Edge (最新版)

## 性能优化

- ✅ 自动代码分割
- ✅ 图片优化（Next.js Image 组件）
- ✅ 字体优化
- ✅ CSS 优化（Tailwind CSS）
- ✅ 服务端渲染（SSR）

## SEO 优化

- ✅ Meta 标签配置
- ✅ 语义化 HTML
- ✅ 响应式设计
- ✅ 快速加载速度

## 维护

### 定期更新依赖

```bash
npm update
```

### 检查过期依赖

```bash
npm outdated
```

## 许可证

MIT License

## 联系方式

- 邮箱: petterobam@gmail.com
- LinkedIn: linkedin.com/in/aigc-expert
- GitHub: github.com/aigc-expert
- 知乎: zhihu.com/people/aigc-expert

---

**创建日期**: 2026-03-30
**最后更新**: 2026-03-30
**版本**: v0.1.0
