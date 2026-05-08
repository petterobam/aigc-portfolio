import { notFound } from 'next/navigation';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const articlesDir = path.resolve(process.cwd(), 'content/articles');

export async function generateStaticParams() {
  try {
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    return files.map(file => ({ slug: file.replace('.md', '') }));
  } catch {
    return [];
  }
}

function getArticle(slug: string) {
  const filePath = path.join(articlesDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, 'utf-8');
  const { data, content } = matter(raw);
  return { meta: data, content, slug };
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: 'Not Found' };
  return {
    title: `${article.meta.title || slug} | Wealth Freedom Blog`,
    description: article.meta.description || article.meta.excerpt || '',
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const processed = await remark().use(remarkHtml).process(article.content);
  const html = processed.toString();

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <Link href="/blog" style={{ color: '#0070f3', textDecoration: 'none', fontSize: 14 }}>← 返回博客</Link>
      <h1 style={{ marginTop: 20 }}>{article.meta.title || slug}</h1>
      <div style={{ color: '#666', fontSize: 14, marginBottom: 30 }}>
        {article.meta.date && <span>{article.meta.date}</span>}
        {article.meta.tags && Array.isArray(article.meta.tags) && (
          <span style={{ marginLeft: 16 }}>
            {(article.meta.tags as string[]).map(t => (
              <span key={t} style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, marginRight: 4, fontSize: 12 }}>{t}</span>
            ))}
          </span>
        )}
      </div>
      <div dangerouslySetInnerHTML={{ __html: html }} style={{ lineHeight: 1.8, fontSize: 16 }} />
      <div style={{ marginTop: 60, padding: '20px 0', borderTop: '1px solid #eee', textAlign: 'center' }}>
        <p style={{ color: '#888' }}>用 ❤️ 和 AI 构建</p>
        <Link href="https://github.com/petterobam/wealth-freedom" style={{ color: '#0070f3' }}>GitHub: Wealth Freedom →</Link>
      </div>
    </div>
  );
}
