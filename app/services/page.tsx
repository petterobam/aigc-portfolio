import Link from 'next/link';

export default function Services() {
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
              <Link href="/#services" className="text-blue-600 dark:text-blue-400 font-semibold">
                服务内容
              </Link>
              <Link href="/#cases" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            服务内容
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            提供全方位的 AIGC 技术服务，帮助企业快速落地 AI 应用
          </p>
        </div>
      </section>

      {/* Services Detail */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Service 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    AIGC 技术咨询
                  </h2>
                  <p className="text-blue-100 text-lg">
                    AI 项目可行性分析、技术选型、架构设计
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <p className="text-white font-bold text-xl">
                    ¥5,000 - 20,000 / 天
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                服务内容
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                  AI 项目可行性分析
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                  技术选型与架构设计
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                  成本效益评估
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                  技术风险评估
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">✓</span>
                  实施方案制定
                </li>
              </ul>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                适合场景
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                  企业规划 AI 项目前
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                  不确定技术选型
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                  需要评估投入产出比
                </li>
              </ul>
            </div>
          </div>

          {/* Service 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    定制化开发
                  </h2>
                  <p className="text-green-100 text-lg">
                    企业级 AI 应用开发、系统集成、性能优化
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <p className="text-white font-bold text-xl">
                    ¥50,000 - 200,000 / 项目
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                服务内容
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  企业级 AI 应用开发
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  基于 RAG 的知识库系统
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  AI 内容生成工具
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  系统集成与部署
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 dark:text-green-400 mr-2">✓</span>
                  性能优化与维护
                </li>
              </ul>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                适合场景
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  有明确的 AI 需求
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  需要定制化开发
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                  需要专业技术团队
                </li>
              </ul>
            </div>
          </div>

          {/* Service 3 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    培训课程
                  </h2>
                  <p className="text-purple-100 text-lg">
                    AIGC 工具培训、团队技能提升、最佳实践分享
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <p className="text-white font-bold text-xl">
                    ¥1,000 - 5,000 / 人
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                服务内容
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">✓</span>
                  AIGC 工具使用培训
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">✓</span>
                  提示词工程实战
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">✓</span>
                  团队 AIGC 能力提升
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">✓</span>
                  最佳实践分享
                </li>
                <li className="flex items-start">
                  <span className="text-purple-600 dark:text-purple-400 mr-2">✓</span>
                  案例分析与讨论
                </li>
              </ul>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                适合场景
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">•</span>
                  团队刚接触 AIGC
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">•</span>
                  需要快速提升技能
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">•</span>
                  希望学习最佳实践
                </li>
              </ul>
            </div>
          </div>

          {/* Service 4 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 sm:p-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                    技术评估
                  </h2>
                  <p className="text-orange-100 text-lg">
                    现有 AI 项目评估、性能优化建议、技术债务清理
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-lg px-6 py-3">
                  <p className="text-white font-bold text-xl">
                    ¥10,000 - 50,000 / 次
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-10">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                服务内容
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300 mb-6">
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">✓</span>
                  现有 AI 项目评估
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">✓</span>
                  性能优化建议
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">✓</span>
                  技术债务清理
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">✓</span>
                  架构优化方案
                </li>
                <li className="flex items-start">
                  <span className="text-orange-600 dark:text-orange-400 mr-2">✓</span>
                  成本控制建议
                </li>
              </ul>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                适合场景
              </h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <span className="text-red-600 dark:text-red-400 mr-2">•</span>
                  AI 项目遇到瓶颈
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 dark:text-red-400 mr-2">•</span>
                  性能不达预期
                </li>
                <li className="flex items-start">
                  <span className="text-red-600 dark:text-red-400 mr-2">•</span>
                  需要第二意见
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            不确定哪种服务适合您？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            联系我，我会根据您的需求提供定制化建议
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            免费咨询
          </Link>
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
