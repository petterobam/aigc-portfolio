import Link from 'next/link';

export default function Blog() {
  const posts = [
    {
      id: 1,
      title: '企业如何快速落地 AI 应用？从 0 到 1 的完整指南',
      excerpt: '分享企业 AI 落地的常见误区、技术选型、快速验证方法论和成本控制策略。',
      date: '2026-03-25',
      category: '实战指南',
      readTime: '10 分钟'
    },
    {
      id: 2,
      title: 'LangChain 实战：7 天构建企业级知识库系统',
      excerpt: '详细介绍如何使用 LangChain 和 ChromaDB 构建企业级知识库系统。',
      date: '2026-03-20',
      category: '技术实战',
      readTime: '15 分钟'
    },
    {
      id: 3,
      title: '提示词工程：10 个提升模型输出的实用技巧',
      excerpt: '分享提示词工程的核心技巧，包括角色设定、提供示例、思维链等。',
      date: '2026-03-15',
      category: '技术技巧',
      readTime: '8 分钟'
    },
    {
      id: 4,
      title: 'AI 模型对比：GPT vs Claude vs Gemini，哪个更适合你的企业？',
      excerpt: '对比主流 LLM 的能力、成本、适用场景，提供决策框架。',
      date: '2026-03-10',
      category: '技术选型',
      readTime: '12 分钟'
    },
    {
      id: 5,
      title: '企业 AI 落地的 5 个坑，我踩过 3 个',
      excerpt: '分享企业 AI 落地的常见坑和规避方法，避免重复踩坑。',
      date: '2026-03-05',
      category: '经验分享',
      readTime: '7 分钟'
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
                    <Link href={`/blog/${post.id}`} className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.date}
                    </span>
                    <Link
                      href={`/blog/${post.id}`}
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      阅读更多 →
                    </Link>
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
