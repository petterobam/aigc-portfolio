import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: 'https://aigc-portfolio-rho.vercel.app/sitemap.xml',
  };
}
