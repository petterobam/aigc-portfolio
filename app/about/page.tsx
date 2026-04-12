import Link from 'next/link';

export default function About() {
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
              <Link href="/about" className="text-blue-600 dark:text-blue-400 font-semibold">
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
            关于我
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            AIGC 技术咨询专家 | 欧阳洁
          </p>
        </div>
      </section>

      {/* Bio Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              个人简介
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              AIGC 技术咨询专家，10 年全栈开发经验，深度学习背景。精通文本、图像、音视频生成，熟练掌握 LangChain、LlamaIndex、向量数据库、RAG 架构等技术栈。
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
              已服务 20+ 家企业，覆盖金融、教育、电商等行业。核心服务包括：AIGC 技术咨询、定制化开发、提示词工程、团队培训。目标：让每家企业都能用上 AI，提升效率，创造价值。
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <a href="mailto:petterobam@gmail.com" className="text-blue-600 dark:text-blue-400 hover:underline">📧 petterobam@gmail.com</a>
              <a href="https://github.com/petterobam" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">🐙 GitHub</a>
              <a href="https://www.zhihu.com/people/oy6666" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">📘 知乎</a>
              <a href="https://www.linkedin.com/in/petterobam/" target="_blank" className="text-blue-600 dark:text-blue-400 hover:underline">💼 LinkedIn</a>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            技术栈
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* AI Technology */}
            <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-4">
                AI 技术栈
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• LangChain、LlamaIndex</li>
                <li>• 向量数据库（Pinecone、Weaviate）</li>
                <li>• RAG 架构</li>
                <li>• 提示词工程</li>
                <li>• GPT、Claude、Gemini、GLM</li>
              </ul>
            </div>

            {/* Development Skills */}
            <div className="bg-green-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-green-600 dark:text-green-400 mb-4">
                开发技能
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• Python、TypeScript、Go、Rust</li>
                <li>• React、Vue、Node.js</li>
                <li>• 全栈开发</li>
                <li>• 系统架构设计</li>
              </ul>
            </div>

            {/* Business Capability */}
            <div className="bg-purple-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-purple-600 dark:text-purple-400 mb-4">
                业务能力
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 技术咨询</li>
                <li>• 项目管理</li>
                <li>• 团队培训</li>
                <li>• 需求分析</li>
                <li>• 方案设计</li>
                <li>• 成本评估</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-12">
            工作经历
          </h2>
          <div className="space-y-8">
            {/* Current Position */}
            <div className="relative pl-8 border-l-4 border-blue-600">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  AIGC 技术咨询顾问
                </h3>
                <p className="text-gray-600 dark:text-gray-400">2025 - 至今</p>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 为 20+ 家企业提供 AIGC 技术咨询和落地解决方案</li>
                <li>• 开发企业级 AI 应用（智能客服、内容生成、知识库系统等）</li>
                <li>• 培训 AIGC 工具使用和最佳实践</li>
              </ul>
            </div>

            {/* Past Position */}
            <div className="relative pl-8 border-l-4 border-green-600">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  全栈开发工程师
                </h3>
                <p className="text-gray-600 dark:text-gray-400">2020 - 2025</p>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 参与多个大型 Web 应用开发</li>
                <li>• 技术栈：Python、TypeScript、Go、React、Vue</li>
                <li>• 负责后端架构设计和前端优化</li>
              </ul>
            </div>

            {/* Earlier Position */}
            <div className="relative pl-8 border-l-4 border-purple-600">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  后端开发工程师
                </h3>
                <p className="text-gray-600 dark:text-gray-400">2015 - 2020</p>
              </div>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• 参与 10+ 个项目开发</li>
                <li>• 精通数据库设计和 API 开发</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600 dark:bg-blue-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            让我们合作
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            如果您对 AI 应用落地有任何问题，欢迎联系我
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            立即联系
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
