import type { MetadataRoute } from 'next';

const site = 'https://www.parkourreborn.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/'],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
