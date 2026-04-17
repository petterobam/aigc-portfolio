# Vercel 部署指导

> 创建时间：2026-03-31（心跳 #232）
> 项目：aigc-portfolio（个人网站）
> 状态：待执行

---

## 一、概述

本文档提供详细的 Vercel 部署指导，帮助用户快速将个人网站部署到 Vercel 平台。

**项目位置**：`~/.openclaw/workspace/aigc-portfolio`

**项目技术栈**：Next.js 16.2.1 + TypeScript + Tailwind CSS 4

**构建状态**：✅ 已成功构建（2026-03-31 20:17）

---

## 二、前置条件

### 2.1 已解决的问题

✅ **项目路径问题已修复**
- 原路径：`~/.openclaw/workspace/aigc-portfolio`（包含中文）
- 新路径：`~/.openclaw/workspace/aigc-portfolio`（不含中文）
- 修复方法：将项目复制到不含中文的路径
- 修复时间：2026-03-31 20:15

✅ **依赖安装已完成**
- node_modules 已安装
- package-lock.json 已更新
- 构建测试成功

✅ **构建测试已通过**
```bash
cd ~/.openclaw/workspace/aigc-portfolio
npm run build
```

**构建结果**：
```
✓ Compiled successfully in 1745ms
✓ Finished TypeScript in 1396ms
✓ Generating static pages (8/8)
```

**生成的页面**：
- `/` (首页)
- `/about` (关于我)
- `/blog` (博客)
- `/contact` (联系我)
- `/services` (服务内容)

### 2.2 需要的工具

- Node.js 22.22.0 ✅ (已安装)
- npm 10.9.4 ✅ (已安装)
- Vercel CLI ⏳ (待安装)
- GitHub 账号 ⏳ (待注册/登录)
- Vercel 账号 ⏳ (待注册/登录)

---

## 三、部署步骤

### 步骤 1: 安装 Vercel CLI

```bash
npm install -g vercel
```

**验证安装**：
```bash
vercel --version
# 应该显示版本号，例如：vercel/39.x.x
```

**如果遇到权限问题**：
```bash
sudo npm install -g vercel
```

---

### 步骤 2: 登录 Vercel

```bash
cd ~/.openclaw/workspace/aigc-portfolio
vercel login
```

**登录流程**：
1. 选择登录方式（推荐使用 GitHub）
2. 浏览器会自动打开 Vercel 登录页面
3. 使用 GitHub 账号授权
4. 登录成功后返回终端

**如果 GitHub 账号不存在**：
1. 访问 https://github.com 注册
2. 注册后回到终端重新运行 `vercel login`

---

### 步骤 3: 初始化 Vercel 项目

```bash
cd ~/.openclaw/workspace/aigc-portfolio
vercel
```

**初始化流程**：
1. 问：Link to existing project?
   答：`No` (这是首次部署)

2. 问：What's your project's name?
   答：`aigc-portfolio` (或你喜欢的名称)

3. 问：In which directory is your code located?
   答：直接按回车（默认当前目录）

4. 问：Want to modify these settings?
   答：`No` (使用默认配置)

5. 等待部署完成...

**预期输出**：
```
? Link to existing project? [y/N] no
? What's your project's name? aigc-portfolio
? In which directory is your code located? ./
? Want to modify these settings? [y/N] no
```

**预览 URL**：`https://aigc-portfolio-xxx.vercel.app`

---

### 步骤 4: 部署生产版本

```bash
vercel --prod
```

**生产 URL**：`https://aigc-portfolio.vercel.app`

---

### 步骤 5: 验证部署

1. **访问生产 URL**：
   - 打开浏览器访问：`https://aigc-portfolio.vercel.app`
   - 检查所有页面是否正常显示：
     - 首页
     - 关于我
     - 博客
     - 联系我
     - 服务内容

2. **检查响应速度**：
   - 打开浏览器开发者工具（F12）
   - 查看 Network 标签
   - 检查页面加载时间（应该 < 2 秒）

3. **检查移动端适配**：
   - 使用浏览器开发者工具的移动设备模拟器
   - 检查页面在移动端的显示效果

---

## 四、配置自定义域名（可选）

### 步骤 1: 购买域名

推荐域名：
- `aigc-expert.com`
- `aigc-consultant.com`
- `yourname.com`

注册商：
- 阿里云：https://wanwang.aliyun.com
- 腾讯云：https://dnspod.cloud.tencent.com
- Namecheap：https://www.namecheap.com

**预计费用**：¥60-120/年（.com 域名）

---

### 步骤 2: 在 Vercel 中配置域名

1. 登录 Vercel Dashboard：https://vercel.com/dashboard
2. 找到 `aigc-portfolio` 项目
3. 点击 "Settings" → "Domains"
4. 添加你的域名：`aigc-expert.com`
5. 点击 "Add"

---

### 步骤 3: 配置 DNS 记录

Vercel 会显示需要配置的 DNS 记录，例如：

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

在你的域名注册商处添加这些 DNS 记录。

---

### 步骤 4: 等待 DNS 生效

DNS 生效时间：几分钟到 24 小时

**验证方法**：
```bash
ping aigc-expert.com
```

如果返回 Vercel 的 IP 地址（76.76.21.21），说明 DNS 已生效。

---

## 五、更新网站内容

### 更新博客文章

1. **编辑博客列表**：
   ```bash
   cd ~/.openclaw/workspace/aigc-portfolio
   vim app/blog/page.tsx
   ```

2. **添加真实文章**：
   - 将已有的技术文章复制到 `app/blog/` 目录
   - 或使用 Markdown 文件 + Contentlayer（需要额外配置）

3. **测试本地**：
   ```bash
   npm run dev
   ```

4. **重新部署**：
   ```bash
   vercel --prod
   ```

### 更新个人信息

- 编辑 `app/about/page.tsx`
- 编辑 `app/page.tsx`（首页 Hero 区域）
- 重新部署

---

## 六、监控网站

### 访问统计（可选）

#### 方案 1: Google Analytics 4

1. 注册 Google Analytics：https://analytics.google.com
2. 创建媒体资源
3. 获取跟踪 ID（G-XXXXXXXXXX）
4. 在 `app/layout.tsx` 中添加 GA 代码

**示例代码**：
```tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        {children}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script>
      </body>
    </html>
  )
}
```

#### 方案 2: Plausible（隐私友好）

1. 注册 Plausible：https://plausible.io
2. 添加站点
3. 在 `app/layout.tsx` 中添加 Plausible 代码

---

### 性能监控

Vercel 会自动收集性能指标，可以在 Dashboard 查看：
- LCP (Largest Contentful Paint)
- FID (First Input Delay)
- CLS (Cumulative Layout Shift)

---

## 七、SEO 优化

### 提交到搜索引擎

1. **Google Search Console**：
   - 注册：https://search.google.com/search-console
   - 添加站点
   - 验证站点（DNS 记录或 HTML 标签）
   - 提交 sitemap：`https://aigc-portfolio.vercel.app/sitemap.xml`

2. **Bing Webmaster Tools**：
   - 注册：https://www.bing.com/webmasters
   - 添加站点
   - 验证站点
   - 提交 sitemap

---

## 八、常见问题解答

### Q1: 部署失败怎么办？

**可能原因**：
1. 依赖安装失败 → 运行 `npm install`
2. 构建失败 → 检查日志，修复错误后重新部署
3. 网络问题 → 检查网络连接，重试

**解决方案**：
```bash
# 清理缓存
rm -rf .next

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build

# 重新部署
vercel --prod
```

---

### Q2: 自定义域名无法访问？

**可能原因**：
1. DNS 记录配置错误
2. DNS 未生效（需要等待）
3. 域名未在 Vercel 中添加

**解决方案**：
1. 检查 DNS 记录是否正确
2. 使用 `ping` 或 `nslookup` 检查域名解析
3. 等待 24 小时让 DNS 生效
4. 在 Vercel Dashboard 检查域名状态

---

### Q3: 如何回滚到之前的版本？

**方法 1: 使用 Git**
```bash
git log --oneline
git checkout <commit-hash>
vercel --prod
```

**方法 2: 使用 Vercel Dashboard**
1. 打开项目 Deployments
2. 找到之前的版本
3. 点击 "Promote to Production"

---

### Q4: 如何设置环境变量？

**方法 1: 使用 Vercel CLI**
```bash
vercel env add <variable-name>
```

**方法 2: 使用 Vercel Dashboard**
1. 打开项目 Settings
2. 点击 "Environment Variables"
3. 添加变量名和值

---

### Q5: Vercel 免费额度够用吗？

**免费额度**：
- 100GB 带宽/月
- 6000 分钟构建时间/月
- 无限部署次数

**个人网站使用量预估**：
- 每月 1000 访问 × 1MB/次 = 1GB 带宽
- 每天部署 1 次 = 30 分钟构建时间/月

**结论**：✅ 免费额度完全足够个人网站使用

---

## 九、维护清单

### 每周
- [ ] 检查网站访问量（Google Analytics）
- [ ] 检查错误日志（Vercel Dashboard）
- [ ] 发布 1 篇博客文章

### 每月
- [ ] 更新依赖（`npm update`）
- [ ] 优化 SEO（检查搜索排名）
- [ ] 更新服务内容或案例

### 每季度
- [ ] 更新个人简介和工作经历
- [ ] 优化网站性能（检查 LCP、FID、CLS）
- [ ] 备份数据（虽然 Git 已经在备份代码）

---

## 十、成功指标

### 短期（1-3 个月）
- ✅ 网站上线并正常运行
- ✅ 发布 6 篇技术文章
- ✅ 每篇文章平均阅读量 ≥ 100
- ✅ 网站月访问量 ≥ 300 UV

### 中期（3-6 个月）
- ✅ 网站月访问量 ≥ 1,000 UV
- ✅ GitHub 项目 Star 数 ≥ 50
- ✅ 获得前 5 个咨询请求
- ✅ 文章被转载或引用 ≥ 3 次

### 长期（12 个月）
- ✅ 网站月访问量 ≥ 10,000 UV
- ✅ 博客文章 ≥ 50 篇
- ✅ 客户转化率 ≥ 5%
- ✅ 成为行业专家
- ✅ 实现财务安全（316 万）

---

## 十一、总结

### 本次心跳完成的工作

✅ **修复项目路径问题**
- 将项目从中文路径复制到不含中文的路径
- 重新安装依赖
- 成功构建项目

✅ **创建详细的部署指导**
- 提供完整的部署步骤
- 包含自定义域名配置
- 提供常见问题解答
- 提供维护清单

### 下一步行动

1. **立即执行（72 小时内）**：
   - [ ] 安装 Vercel CLI：`npm install -g vercel`
   - [ ] 登录 Vercel：`vercel login`
   - [ ] 部署网站：`vercel`
   - [ ] 部署生产版本：`vercel --prod`

2. **短期行动（1 周内）**：
   - [ ] 访问生产 URL，验证部署
   - [ ] （可选）购买域名并配置
   - [ ] 发布第一篇技术文章
   - [ ] 在知乎同步发布文章
   - [ ] 更新 LinkedIn 和 GitHub 个人资料

3. **中期行动（1 个月内）**：
   - [ ] 发布 5-10 篇技术文章
   - [ ] 配置 Google Analytics
   - [ ] 提交到搜索引擎
   - [ ] 收集用户反馈
   - [ ] 获得前 5 个咨询请求

---

**创建人**：AI 助手
**创建时间**：2026-03-31 20:20
**心跳编号**：#232
**所属项目**：财富自由之路 - 企业家路径
**相关文档**：
- `~/.openclaw/workspace/财富自由之路/行动计划/个人网站建设记录-心跳228.md`
- `~/.openclaw/workspace/aigc-portfolio/README.md`
- `~/.openclaw/workspace/aigc-portfolio/DEPLOYMENT.md`
