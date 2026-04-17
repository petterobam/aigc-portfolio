# 如何用 Next.js + Tailwind CSS 搭建个人技术网站

> 副标题：从零到部署上线，4-5 小时完成
> 发布时间：2026-03-30
> 作者：[你的名字]
> 标签：#Next.js #Tailwind CSS #个人网站 #技术实践
> 预计阅读时间：15 分钟

---

## 引言：为什么选择 Next.js + Tailwind CSS？

### 技术选型对比

**方案 1：WordPress**
- 优点：开箱即用，插件丰富
- 缺点：性能差、安全性低、不够现代
- 适合：非技术人员、博客类网站

**方案 2：Vuepress / Docsify**
- 优点：专注文档、Markdown 友好
- 缺点：定制能力有限、不够灵活
- 适合：技术文档、知识库

**方案 3：Next.js + Tailwind CSS** ✅
- 优点：现代化、性能好、定制能力强、SEO 友好
- 缺点：需要开发能力
- 适合：个人网站、产品官网、技术博客

### Next.js 的核心优势

**1. 性能优化**
- 服务端渲染（SSR）：提升 SEO 和首屏加载速度
- 自动代码分割：优化页面加载性能
- 图片优化：Next.js Image 组件自动优化
- 静态生成（SSG）：适合内容不变的页面

**2. 开发体验**
- 文件系统路由：无需手动配置路由
- API 路由：内置 API Server，无需单独的后端
- TypeScript 支持：类型安全，减少 bug
- 热重载：开发时实时预览修改

**3. 部署简单**
- 一键部署：Vercel、Netlify 等
- 自动 HTTPS：无需额外配置
- 全球 CDN：访问速度快
- 持续部署（CD）：推送代码自动部署

### Tailwind CSS 的核心优势

**1. 开发效率**
- 原子化 CSS：直接在 class 中写样式
- 无需切换文件：HTML + CSS 在一起
- 响应式设计：轻松实现移动端适配
- 深色模式：一行代码实现

**2. 样式一致**
- 设计系统：颜色、间距、字体统一
- 预设样式：按钮、卡片、导航栏等
- 自定义配置：tailwind.config.js 灵活配置

**3. 性能优秀**
- 按需加载：只加载使用的 CSS
- 生产环境优化：自动清除未使用的 CSS
- 无运行时开销：编译时生成 CSS

---

## 技术栈总览

```
Next.js 14 (React 18)
├── TypeScript（类型安全）
├── Tailwind CSS（样式）
├── Lucide React（图标）
└── Vercel（部署）
```

---

## 项目初始化（5 分钟）

### 1. 创建 Next.js 项目

```bash
# 使用 create-next-app 创建项目
npx create-next-app@latest personal-website --typescript --tailwind --app

# 进入项目目录
cd personal-website

# 启动开发服务器
npm run dev
```

**参数说明**：
- `--typescript`：使用 TypeScript
- `--tailwind`：使用 Tailwind CSS
- `--app`：使用 App Router（Next.js 14 新特性）

### 2. 项目结构

```
personal-website/
├── app/                      # App Router（Next.js 14）
│   ├── layout.tsx           # 根布局
│   ├── page.tsx             # 首页
│   ├── about/               # 关于我页面
│   │   └── page.tsx
│   ├── services/            # 服务内容页面
│   │   └── page.tsx
│   ├── blog/                # 博客页面
│   │   └── page.tsx
│   └── contact/             # 联系我页面
│       └── page.tsx
├── components/              # 组件
│   ├── Navbar.tsx           # 导航栏
│   ├── Footer.tsx           # 页脚
│   └── Hero.tsx             # Hero 区域
├── public/                  # 静态资源
│   ├── images/              # 图片
│   └── favicon.ico          # 网站图标
├── lib/                     # 工具函数
│   └── utils.ts             # 工具函数
├── tailwind.config.ts       # Tailwind 配置
├── tsconfig.json            # TypeScript 配置
└── package.json             # 依赖配置
```

---

## 核心页面开发（2-3 小时）

### 1. 根布局（app/layout.tsx）

```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AIGC 技术顾问 - [你的名字]',
  description: '专注大模型应用、AI 换脸、内容生成，帮助企业落地 AIGC 应用',
  keywords: 'AIGC, 大模型, AI 换脸, 内容生成, 技术顾问',
  openGraph: {
    title: 'AIGC 技术顾问 - [你的名字]',
    description: '专注大模型应用、AI 换脸、内容生成',
    type: 'website',
    locale: 'zh_CN',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
```

### 2. 导航栏组件（components/Navbar.tsx）

```typescript
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { name: '首页', href: '/' },
    { name: '关于我', href: '/about' },
    { name: '服务内容', href: '/services' },
    { name: '博客', href: '/blog' },
    { name: '联系我', href: '/contact' },
  ]

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="text-2xl font-bold text-blue-600">
              AIGC 技术顾问
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-blue-600"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block py-2 text-gray-700 hover:text-blue-600"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
```

### 3. 首页（app/page.tsx）

```typescript
import Hero from '@/components/Hero'
import Services from '@/components/Services'
import CaseStudies from '@/components/CaseStudies'
import CTA from '@/components/CTA'

export default function Home() {
  return (
    <div>
      <Hero />
      <Services />
      <CaseStudies />
      <CTA />
    </div>
  )
}
```

### 4. Hero 组件（components/Hero.tsx）

```typescript
import Link from 'next/link'

export default function Hero() {
  return (
    <section className="bg-gradient-to-b from-blue-50 to-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            帮助企业落地
            <span className="text-blue-600"> AIGC 应用</span>
          </h1>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            专注大模型应用、AI 换脸、内容生成，累计服务 50+ 客户，
            开源项目 200+ stars，技术博客 50k+ 阅读
          </p>

          <div className="flex justify-center space-x-4">
            <Link
              href="/contact"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              联系我
            </Link>
            <Link
              href="/services"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              了解服务
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50+</div>
              <div className="text-gray-600">服务客户</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">200+</div>
              <div className="text-gray-600">GitHub Stars</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50k+</div>
              <div className="text-gray-600">技术博客阅读</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">3 年</div>
              <div className="text-gray-600">AIGC 实战经验</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

### 5. 关于我页面（app/about/page.tsx）

```typescript
import { Award, Briefcase, GraduationCap } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-12">关于我</h1>

        {/* 个人简介 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">个人简介</h2>
          <p className="text-gray-600 mb-4">
            我是 [你的名字]，AIGC 技术顾问，专注大模型应用、AI 换脸、内容生成。
          </p>
          <p className="text-gray-600 mb-4">
            前大厂后端工程师 5 年，负责 AIGC 相关项目（AI 换脸、深度学习、大模型应用）。
          </p>
          <p className="text-gray-600">
            现在作为独立技术顾问，帮助企业落地 AIGC 应用，累计服务 50+ 客户。
          </p>
        </div>

        {/* 工作经历 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-4">
            <Briefcase className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-2xl font-bold">工作经历</h2>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold mb-2">
                独立 AIGC 技术顾问
              </h3>
              <p className="text-gray-600 mb-2">2024 - 至今</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>服务 50+ 企业客户，落地 AIGC 应用</li>
                <li>技术咨询、定制开发、培训课程</li>
                <li>开源项目 200+ stars，技术博客 50k+ 阅读</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-2">
                大厂后端工程师
              </h3>
              <p className="text-gray-600 mb-2">2019 - 2024</p>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                <li>负责 AIGC 相关项目（AI 换脸、深度学习、大模型应用）</li>
                <li>参与技术决策、架构设计、代码审查</li>
                <li>带领小团队，负责项目交付</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 技术栈 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center mb-4">
            <GraduationCap className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-2xl font-bold">技术栈</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="font-semibold mb-2">前端</h3>
              <p className="text-gray-600">
                React、Next.js、TypeScript、Tailwind CSS、Vue
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">后端</h3>
              <p className="text-gray-600">
                Python、Node.js、Go、Rust、Docker、Kubernetes
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI & ML</h3>
              <p className="text-gray-600">
                PyTorch、TensorFlow、OpenAI API、LangChain、LlamaIndex
              </p>
            </div>
          </div>
        </div>

        {/* 荣誉与成就 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center mb-4">
            <Award className="w-6 h-6 mr-2 text-blue-600" />
            <h2 className="text-2xl font-bold">荣誉与成就</h2>
          </div>

          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>开源项目 200+ stars（GitHub）</li>
            <li>技术博客 50k+ 阅读（知乎、掘金）</li>
            <li>3 次 tech share 分享</li>
            <li>2 篇技术文章被精选（掘金）</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
```

### 6. 服务内容页面（app/services/page.tsx）

```typescript
import { Zap, Code, Users, Search } from 'lucide-react'

export default function ServicesPage() {
  const services = [
    {
      icon: Zap,
      title: '技术咨询',
      description: '提供技术方案、最佳实践，帮助企业快速落地 AIGC 应用',
      price: '1000-3000 元/小时',
      features: [
        '技术方案设计',
        '最佳实践指导',
        '架构评审',
        '技术选型建议',
      ],
    },
    {
      icon: Code,
      title: '定制开发',
      description: '根据客户需求，开发定制化的 AIGC 应用',
      price: '2-10 万/项目',
      features: [
        '需求分析',
        '系统设计',
        '开发实现',
        '部署上线',
        '技术支持',
      ],
    },
    {
      icon: Users,
      title: '培训课程',
      description: '帮助企业团队掌握 AIGC 技术，提升开发效率',
      price: '5000-20000 元/场',
      features: [
        '大模型应用开发',
        'Prompt Engineering',
        'LangChain 实战',
        'RAG 系统搭建',
      ],
    },
    {
      icon: Search,
      title: '技术评估',
      description: '评估现有系统，提出优化建议和升级方案',
      price: '5000-10000 元/次',
      features: [
        '系统评估',
        '性能分析',
        '安全审查',
        '优化建议',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-4">服务内容</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          提供 AIGC 全方位技术服务，帮助企业快速落地应用
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {services.map((service) => (
            <div
              key={service.title}
              className="bg-white rounded-lg shadow-md p-8 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center mb-4">
                <service.icon className="w-8 h-8 text-blue-600 mr-3" />
                <h2 className="text-2xl font-bold">{service.title}</h2>
              </div>

              <p className="text-gray-600 mb-4">{service.description}</p>

              <div className="text-lg font-semibold text-blue-600 mb-4">
                {service.price}
              </div>

              <ul className="space-y-2">
                {service.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-600">
                    <span className="w-2 h-2 bg-blue-600 rounded-full mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 7. 联系我页面（app/contact/page.tsx）

```typescript
'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: 实现表单提交逻辑（可以使用 Vercel、Formspree 等）
    console.log('Form submitted:', formData)
    alert('感谢您的留言，我会尽快回复！')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-center mb-4">联系我</h1>
        <p className="text-xl text-gray-600 text-center mb-12">
          有问题？随时联系我，期待与您交流
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* 联系信息 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Mail className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">邮箱</h3>
              </div>
              <p className="text-gray-600">1460300366@qq.com</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <Phone className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">电话</h3>
              </div>
              <p className="text-gray-600">+86 138 0000 0000</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <MapPin className="w-6 h-6 text-blue-600 mr-3" />
                <h3 className="text-xl font-semibold">位置</h3>
              </div>
              <p className="text-gray-600">中国 · 北京</p>
            </div>

            {/* 社交链接 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">社交媒体</h3>
              <div className="space-y-2">
                <a
                  href="https://github.com/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  GitHub
                </a>
                <a
                  href="https://zhihu.com/people/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  知乎
                </a>
                <a
                  href="https://linkedin.com/in/yourusername"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-blue-600 hover:underline"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>

          {/* 联系表单 */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold mb-6">给我留言</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 mb-2">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 mb-2">留言</label>
                <textarea
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                发送留言
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## SEO 优化（30 分钟）

### 1. 元数据优化（app/layout.tsx）

```typescript
export const metadata: Metadata = {
  title: 'AIGC 技术顾问 - [你的名字]',
  description: '专注大模型应用、AI 换脸、内容生成，帮助企业落地 AIGC 应用',
  keywords: 'AIGC, 大模型, AI 换脸, 内容生成, 技术顾问',
  openGraph: {
    title: 'AIGC 技术顾问 - [你的名字]',
    description: '专注大模型应用、AI 换脸、内容生成',
    type: 'website',
    locale: 'zh_CN',
    siteName: 'AIGC 技术顾问',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIGC 技术顾问 - [你的名字]',
    description: '专注大模型应用、AI 换脸、内容生成',
  },
}
```

### 2. 结构化数据（app/layout.tsx）

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: '[你的名字]',
    jobTitle: 'AIGC 技术顾问',
    url: 'https://yourwebsite.com',
    sameAs: [
      'https://github.com/yourusername',
      'https://zhihu.com/people/yourusername',
      'https://linkedin.com/in/yourusername',
    ],
    description: '专注大模型应用、AI 换脸、内容生成，帮助企业落地 AIGC 应用',
  }

  return (
    <html lang="zh-CN">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={inter.className}>
        {/* ... */}
      </body>
    </html>
  )
}
```

### 3. Sitemap 生成（app/sitemap.ts）

```typescript
import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://yourwebsite.com',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://yourwebsite.com/about',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://yourwebsite.com/services',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://yourwebsite.com/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://yourwebsite.com/contact',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}
```

---

## 部署到 Vercel（5 分钟）

### 1. 推送代码到 GitHub

```bash
# 初始化 Git 仓库
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub（先在 GitHub 创建仓库）
git remote add origin https://github.com/yourusername/personal-website.git
git branch -M main
git push -u origin main
```

### 2. 部署到 Vercel

**方法 1：Vercel CLI**

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署
vercel
```

**方法 2：Vercel Dashboard**

1. 访问 https://vercel.com
2. 点击 "Add New Project"
3. 导入 GitHub 仓库
4. 点击 "Deploy"

### 3. 配置自定义域名

1. 在 Vercel Dashboard 点击项目
2. 进入 "Settings" → "Domains"
3. 添加域名（yourwebsite.com）
4. 按照 Vercel 的指引配置 DNS

---

## 成本分析

### 部署成本

| 项目 | 成本 | 备注 |
|------|------|------|
| Vercel 托管 | 免费 | 个人网站免费计划足够 |
| 域名费用 | ¥60-100/年 | .com 域名 |
| **总计** | **¥60-100/年** | |

### 开发时间成本

| 任务 | 时间 |
|------|------|
| 项目初始化 | 5 分钟 |
| 核心页面开发 | 2-3 小时 |
| 组件开发（Navbar、Footer 等） | 1 小时 |
| SEO 优化 | 30 分钟 |
| 部署 | 5 分钟 |
| **总计** | **4-5 小时** |

---

## 常见问题

### Q1：Next.js 14 的 App Router 是什么？

**A：App Router 是 Next.js 14 推出的新路由系统。**

**特点**：
- 基于文件系统的路由（`app/page.tsx` 对应 `/`）
- 支持 React Server Components（服务端组件）
- 内置布局系统（`layout.tsx`）
- 更好的性能和开发体验

**与 Pages Router 的区别**：
| 特性 | App Router | Pages Router |
|------|-----------|-------------|
| 目录结构 | `app/` | `pages/` |
| 文件扩展名 | `.tsx` | `.tsx` 或 `.js` |
| 布局系统 | 内置 | 需要手动实现 |
| 服务端组件 | 支持 | 不支持 |

### Q2：Tailwind CSS 如何实现深色模式？

**A：Tailwind CSS 内置深色模式支持。**

**启用深色模式**（`tailwind.config.ts`）：

```typescript
export default {
  darkMode: 'class', // 或 'media'
  // ...
}
```

**使用深色模式**：

```tsx
<div className="dark:bg-gray-900 dark:text-white">
  {/* 深色模式下的样式 */}
</div>
```

**切换深色模式**：

```typescript
'use client'

import { useState, useEffect } from 'react'

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  return (
    <button onClick={() => setIsDark(!isDark)}>
      {isDark ? '🌞' : '🌙'}
    </button>
  )
}
```

### Q3：如何实现博客文章列表？

**A：可以使用 Markdown 文件 + gray-matter 实现博客。**

**博客文章结构**：

```
blog/
├── 01-文章标题.md
├── 02-文章标题.md
└── ...
```

**读取博客文章**：

```typescript
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export async function getBlogPosts() {
  const files = fs.readdirSync(path.join(process.cwd(), 'blog'))
  const posts = files.map((filename) => {
    const filePath = path.join(process.cwd(), 'blog', filename)
    const fileContent = fs.readFileSync(filePath, 'utf-8')
    const { data, content } = matter(fileContent)

    return {
      meta: data,
      slug: filename.replace('.md', ''),
      content,
    }
  })

  return posts
}
```

**博客文章格式**（`blog/01-文章标题.md`）：

```markdown
---
title: 文章标题
date: 2026-03-30
description: 文章摘要
---

文章内容...
```

---

## 总结

### 技术栈优势

**Next.js**：
- 服务端渲染（SSR）：提升 SEO 和首屏加载速度
- 自动代码分割：优化页面加载性能
- API 路由：内置 API Server，无需单独的后端
- 部署简单：Vercel 一键部署

**Tailwind CSS**：
- 原子化 CSS：开发效率高
- 响应式设计：轻松实现移动端适配
- 深色模式：一行代码实现
- 设计系统：样式一致性强

### 开发效率

- 项目初始化：5 分钟
- 核心页面开发：2-3 小时
- SEO 优化：30 分钟
- 部署：5 分钟
- **总计：4-5 小时**

### 部署成本

- Vercel 托管：免费
- 域名费用：¥60-100/年
- **总计：¥60-100/年**

---

**相关文章**：
- [AIGC 时代如何构建个人技术品牌](#)
- [从零开始学习 Prompt Engineering](#)
- [大模型应用开发实战](#)

**联系方式**：
- 邮箱：1460300366@qq.com
- GitHub：https://github.com/yourusername
- 知乎：https://zhihu.com/people/yourusername
- 个人网站：https://yourwebsite.com

---

**版权声明**：本文首发于 [个人网站]，转载请注明出处。
