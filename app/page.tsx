import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                AIGC Expert
              </span>
            </div>
            <div className="hidden md:flex space-x-8">
              <Link href="#services" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                服务内容
              </Link>
              <Link href="#cases" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                成功案例
              </Link>
              <Link href="/about" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                关于我
              </Link>
              <Link href="/blog" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            让 AI 为您的企业创造价值
          </h1>
          <p className="text-xl sm:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            AIGC 技术咨询 + 定制开发 + 团队培训，一站式服务
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
            >
              立即咨询
            </Link>
            <Link
              href="#services"
              className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              了解服务
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            服务内容
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Service 1 */}
            <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-blue-600 dark:text-blue-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                技术咨询
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                AI 项目可行性分析、技术选型、架构设计
              </p>
              <p className="text-blue-600 dark:text-blue-400 font-semibold">
                ¥5,000 - 20,000 / 天
              </p>
            </div>

            {/* Service 2 */}
            <div className="bg-green-50 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-green-600 dark:text-green-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                定制开发
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                企业级 AI 应用开发、系统集成、性能优化
              </p>
              <p className="text-green-600 dark:text-green-400 font-semibold">
                ¥50,000 - 200,000 / 项目
              </p>
            </div>

            {/* Service 3 */}
            <div className="bg-purple-50 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-purple-600 dark:text-purple-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                培训课程
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                AIGC 工具培训、团队技能提升、最佳实践分享
              </p>
              <p className="text-purple-600 dark:text-purple-400 font-semibold">
                ¥1,000 - 5,000 / 人
              </p>
            </div>

            {/* Service 4 */}
            <div className="bg-orange-50 dark:bg-gray-800 rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="text-orange-600 dark:text-orange-400 mb-4">
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                技术评估
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                现有 AI 项目评估、性能优化建议、技术债务清理
              </p>
              <p className="text-orange-600 dark:text-orange-400 font-semibold">
                ¥10,000 - 50,000 / 次
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cases Section */}
      <section id="cases" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center text-gray-900 dark:text-white mb-12">
            成功案例
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Case 1 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  金融科技公司
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>问题：</strong>客服效率低，响应慢
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>解决方案：</strong>AI 智能客服系统
                </p>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  效果：客服效率提升 300%
                </p>
              </div>
            </div>

            {/* Case 2 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  在线教育平台
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>问题：</strong>课程生产效率低
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>解决方案：</strong>AI 内容生成工具
                </p>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  效果：课程生产效率提升 500%
                </p>
              </div>
            </div>

            {/* Case 3 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow">
              <div className="h-48 bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                  电商企业
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>问题：</strong>商品描述编写耗时
                </p>
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  <strong>解决方案：</strong>AI 商品描述生成
                </p>
                <p className="text-green-600 dark:text-green-400 font-semibold">
                  效果：节省 70% 人力成本
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            立即联系我，获取免费的 AI 落地咨询
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            立即咨询
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-900 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold text-white mb-4">联系方式</h3>
              <p className="text-gray-400">邮箱：aigc-expert@example.com</p>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">社交媒体</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">LinkedIn</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">GitHub</a>
                <a href="#" className="block text-gray-400 hover:text-white transition-colors">知乎</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">服务</h3>
              <div className="space-y-2">
                <a href="#services" className="block text-gray-400 hover:text-white transition-colors">技术咨询</a>
                <a href="#services" className="block text-gray-400 hover:text-white transition-colors">定制开发</a>
                <a href="#services" className="block text-gray-400 hover:text-white transition-colors">培训课程</a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-4">其他</h3>
              <div className="space-y-2">
                <Link href="/about" className="block text-gray-400 hover:text-white transition-colors">关于我</Link>
                <Link href="/blog" className="block text-gray-400 hover:text-white transition-colors">博客</Link>
                <Link href="/contact" className="block text-gray-400 hover:text-white transition-colors">联系我</Link>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-400">© 2026 AIGC Expert. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
