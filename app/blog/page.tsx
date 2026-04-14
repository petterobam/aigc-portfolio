import Link from 'next/link';

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: 'AIGC 落地实战：从 0 到 1 构建企业级 AI 应用',
      excerpt: '分享企业 AI 落地的常见误区、技术选型、快速验证方法论和成本控制策略，帮助企业少走弯路。',
      date: '2026-04-05',
      category: '实战指南',
      readTime: '15 分钟'
    },
    {
      id: 2,
      title: 'AIGC 时代的技术管理：如何带领团队拥抱 AI？',
      excerpt: 'AI 不是取代团队，而是放大团队能力。分享如何在技术管理中有效整合 AI 工具和工作流。',
      date: '2026-04-07',
      category: '技术管理',
      readTime: '12 分钟'
    },
    {
      id: 3,
      title: '从技术人到技术顾问：我的转型之路',
      excerpt: '记录从一线开发到技术顾问的真实转型经历，包括思维方式、技能储备和业务视角的转变。',
      date: '2026-04-05',
      category: '职业发展',
      readTime: '10 分钟'
    },
    {
      id: 4,
      title: '用 AI 构建你的个人财务管理系统',
      excerpt: '一位开发者如何用 AI 辅助，从零打造一套真正适合自己的财务管理工具，规划通往财务自由的路径。',
      date: '2026-04-12',
      category: 'AI 应用',
      readTime: '15 分钟'
    },
    {
      id: 5,
      title: '普通人的财务自由之路：从记账到被动收入的系统化方法',
      excerpt: '不是鸡汤文，而是经过验证的可操作方法论。用真实数据和具体步骤，系统性地走向财务自由。',
      date: '2026-04-12',
      category: '财富思维',
      readTime: '12 分钟'
    },
    {
      id: 6,
      title: '如何用 AIGC 提升团队开发效率？',
      excerpt: '一线实践总结：从代码生成到架构设计，AI 工具如何真正帮团队提效（而不是制造更多混乱）。',
      date: '2026-04-12',
      category: '效率提升',
      readTime: '10 分钟'
    },
    {
      id: 7,
      title: '个人开发者如何为 SaaS 产品定价',
      excerpt: '定价不是拍脑袋。从免费版到终身版，系统分析三层定价模型，帮你找到利润最大化的甜蜜点。',
      date: '2026-04-14',
      category: '独立开发',
      readTime: '10 分钟'
    },
    {
      id: 8,
      title: '独立开发者增长实战：从0到1000用户的增长手册',
      excerpt: '不靠广告、不靠融资，一个独立开发者如何用内容和社区驱动实现用户增长的真实方法论。',
      date: '2026-04-14',
      category: '增长策略',
      readTime: '12 分钟'
    },
    {
      id: 9,
      title: '用 Electron + Vue3 构建桌面财务应用',
      excerpt: '从技术选型到跨平台打包的完整实战记录，分享开发桌面应用踩过的坑和学到的经验。',
      date: '2026-04-14',
      category: '技术实战',
      readTime: '11 分钟'
    },
    {
      id: 10,
      title: '复利思维：程序员的长期主义投资指南',
      excerpt: '代码可以重构，但时间不能回滚。用程序员的系统思维构建财富复利引擎，让两个复利同时运转。',
      date: '2026-04-14',
      category: '财富思维',
      readTime: '15 分钟'
    },
    {
      id: 11,
      title: '开源项目变现指南：从 Star 到收入',
      excerpt: '开源不是慈善，是获客漏斗。5种变现模式、真实案例分析，教你把开源项目变成可持续的商业模式。',
      date: '2026-04-14',
      category: '独立开发',
      readTime: '11 分钟'
    },
    {
      id: 12,
      title: '技术写作的 ROI 分析：为什么每个程序员都该写博客',
      excerpt: '技术写作是最被低估的投资。10篇文章带来的真实收益分析，帮你找到高ROI的选题方向。',
      date: '2026-04-14',
      category: '个人品牌',
      readTime: '10 分钟'
    },
    {
      id: 13,
      title: '程序员的时间投资学：用投资思维管理时间',
      excerpt: '时间和金钱一样需要资产配置。50/30/20时间模型 + AI工具加持，每天多出2小时。',
      date: '2026-04-14',
      category: '效率提升',
      readTime: '11 分钟'
    },
    {
      id: 14,
      title: '从0到1的产品思维：技术人的商业觉醒',
      excerpt: '技术能力是下限，产品思维是上限。5个核心转变 + 30天行动计划，帮技术人补上最缺的一课。',
      date: '2026-04-14',
      category: '产品思维',
      readTime: '11 分钟'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              AIGC Expert
            </Link>
            <div className="hidden md:flex space-x-8">
              <Link href="/#services" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                服务内容
              </Link>
              <Link href="/#cases" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                成功案例
              </Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                关于我
              </Link>
              <Link href="/blog" className="text-blue-600 dark:text-blue-400 font-semibold">
                博客
              </Link>
              <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                联系我
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            技术博客
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            分享 AIGC 技术实战经验、最佳实践和行业洞察
          </p>
        </div>
      </section>

      {/* Blog Posts */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <article
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-full">
                      {post.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.date}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            订阅我的博客
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            获取最新的 AIGC 技术文章和实战经验
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="输入您的邮箱"
              className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
              订阅
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">© 2026 AIGC Expert. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
