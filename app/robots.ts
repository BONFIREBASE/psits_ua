import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://psits-ua.antiquespride.edu.ph'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/429'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
