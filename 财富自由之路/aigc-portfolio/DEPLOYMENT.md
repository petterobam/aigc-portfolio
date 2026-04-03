# 部署指南 - AIGC 个人网站

> 将个人网站部署到 Vercel 平台

## 概述

本指南详细说明如何将 AIGC 个人网站部署到 Vercel 平台。

## 前提条件

- [x] 已完成网站开发
- [x] 已安装 Node.js (v18+)
- [x] 已有 Vercel 账户

---

## 部署步骤

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

### 步骤 2: 登录 Vercel

```bash
vercel login
```

按照提示选择：
- 选择 "Continue with GitHub" 或其他登录方式
- 授权 Vercel 访问你的 GitHub 账户

### 步骤 3: 部署到 Vercel

```bash
cd /Users/oyjie/.openclaw/workspace/财富自由之路/aigc-portfolio
vercel
```

按照提示操作：
1. **Set up and deploy "aigc-portfolio"?** → `Y`
2. **Which scope do you want to deploy to?** → 选择你的账户
3. **Link to existing project?** → `N` (首次部署)
4. **What's your project's name?** → `aigc-portfolio` (使用默认)
5. **In which directory is your code located?** → `./` (使用默认)
6. **Want to modify these settings?** → `N` (使用默认设置)

等待部署完成，Vercel 会提供一个预览 URL。

### 步骤 4: 部署生产版本

```bash
vercel --prod
```

这将部署到生产环境，分配一个永久域名（例如：aigc-portfolio.vercel.app）。

---

## 自定义域名

### 步骤 1: 购买域名

推荐域名注册商：
- 阿里云: 万网
- 腾讯云: DNSPod
- Namecheap
- GoDaddy

推荐的域名：
- aigc-expert.com
- aigc-consultant.com
- aigc-entrepreneur.com

### 步骤 2: 在 Vercel 添加域名

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "Domains"
4. 输入你的域名，点击 "Add"

### 步骤 3: 配置 DNS

根据 Vercel 提供的说明，配置你的域名 DNS：

- 如果是根域名（如 `aigc-expert.com`），添加 A 记录
- 如果是子域名（如 `www.aigc-expert.com`），添加 CNAME 记录

等待 DNS 生效（通常需要几分钟到几小时）。

---

## 更新网站

### 方式 1: 使用 Git（推荐）

1. 将代码推送到 GitHub
2. 在 Vercel Dashboard 中连接 GitHub 仓库
3. 每次推送代码，Vercel 会自动部署

### 方式 2: 使用 Vercel CLI

修改代码后，运行：

```bash
vercel --prod
```

---

## 环境变量

如果需要配置环境变量：

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加环境变量

### 可选的环境变量

- `NEXT_PUBLIC_CONTACT_EMAIL`: 联系邮箱
- `NEXT_PUBLIC_ANALYTICS_ID`: Google Analytics ID

---

## 性能监控

### 查看 Lighthouse 分数

1. 访问你的网站
2. 按 F12 打开开发者工具
3. 切换到 "Lighthouse" 标签
4. 点击 "Analyze page load"

### 查看 Vercel Analytics

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Analytics" 标签

---

## 常见问题

### Q1: 部署失败，提示 "Build Error"

**解决方案**:
1. 检查本地是否能正常构建：`npm run build`
2. 检查 `package.json` 中的依赖是否完整
3. 查看 Vercel Dashboard 中的构建日志

### Q2: 部署成功，但访问 404

**解决方案**:
1. 检查部署的域名是否正确
2. 等待 DNS 生效（可能需要几分钟）
3. 清除浏览器缓存

### Q3: 自定义域名配置后，访问仍然跳转到 Vercel 域名

**解决方案**:
1. 检查 DNS 配置是否正确
2. 等待 DNS 生效（最多 48 小时）
3. 在 Vercel Dashboard 中检查域名状态

### Q4: 如何回滚到之前的版本？

**解决方案**:
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 "Deployments" 标签
4. 找到要回滚的版本，点击右侧菜单 → "Promote to Production"

---

## 优化建议

### 1. 添加 Google Analytics

1. 注册 [Google Analytics](https://analytics.google.com)
2. 获取跟踪 ID
3. 在 Vercel Dashboard 中添加环境变量：`NEXT_PUBLIC_GA_ID=你的GA_ID`
4. 在 `app/layout.tsx` 中添加 Google Analytics 代码

### 2. 启用 HTTPS

Vercel 默认启用 HTTPS，无需额外配置。

### 3. 添加 Favicon

将 `favicon.ico` 文件放入 `public/` 目录。

### 4. 优化图片

使用 Next.js 的 `Image` 组件优化图片：

```tsx
import Image from 'next/image';

<Image
  src="/path/to/image.jpg"
  alt="描述"
  width={800}
  height={600}
  priority
/>
```

---

## 成本

- **Vercel Hobby Plan**: 免费
  - 每月 100GB 带宽
  - 无限次部署
  - 自动 HTTPS
  - 全球 CDN

- **Vercel Pro Plan**: $20/月
  - 更高的带宽限制
  - 更快的构建时间
  - 优先支持

个人网站使用免费计划即可。

---

## 维护清单

- [ ] 定期更新依赖（每月一次）
- [ ] 监控网站性能（每周一次）
- [ ] 备份数据（如有）
- [ ] 更新博客文章（每周 1 篇）
- [ ] 检查 SEO 优化（每月一次）
- [ ] 回应用户反馈（及时）

---

## 联系支持

如果遇到问题：

- Vercel 文档: https://vercel.com/docs
- Vercel 支持: https://vercel.com/support
- Next.js 文档: https://nextjs.org/docs

---

**创建日期**: 2026-03-30
**最后更新**: 2026-03-30
**版本**: v1.0.0
