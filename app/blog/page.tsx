import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const articlesDir = path.resolve(process.cwd(), 'content/articles');

function getPosts() {
  try {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    return files.map(file => {
      const raw = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      const { data } = matter(raw);
      return {
        slug: file.replace('.md', ''),
        title: data.title || file,
        excerpt: data.description || data.excerpt || '',
        date: data.date || '2026-05-09',
        category: Array.isArray(data.tags) ? data.tags[0] : (data.category || '技术'),
        tags: data.tags || [],
      };
    }).sort((a, b) => (a.date > b.date ? -1 : 1));
  } catch {
    return [];
  }
}

export default function Blog() {
  const posts = getPosts();

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
              <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article
                className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow h-full"
              >
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-semibold rounded-full">
                      {post.category}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {post.date}
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {post.excerpt}
                  </p>
                  <span className="text-blue-600 dark:text-blue-400 text-sm font-medium">
                    阅读全文 →
                  </span>
                </div>
              </article>
              </Link>
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
