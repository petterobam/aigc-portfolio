import { MetadataRoute } from 'next';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://aigc-portfolio-rho.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'weekly' as const, priority: 1.0 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.8 },
    { url: `${BASE_URL}/blog`, lastModified: new Date(), changeFrequency: 'daily' as const, priority: 0.9 },
    { url: `${BASE_URL}/contact`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
    { url: `${BASE_URL}/services`, lastModified: new Date(), changeFrequency: 'monthly' as const, priority: 0.7 },
  ];

  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const articlesDir = path.resolve(process.cwd(), 'content/articles');
    const files = fs.readdirSync(articlesDir).filter(f => f.endsWith('.md'));
    blogPages = files.map(file => {
      const slug = file.replace('.md', '');
      const content = fs.readFileSync(path.join(articlesDir, file), 'utf-8');
      const dateMatch = content.match(/^date:\s*(.+)$/m);
      const lastMod = dateMatch ? new Date(dateMatch[1]) : new Date();
      return {
        url: `${BASE_URL}/blog/${slug}`,
        lastModified: lastMod,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });
  } catch {}

  return [...staticPages, ...blogPages];
}
