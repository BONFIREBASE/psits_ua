import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://psitsua.vercel.app'
  const baseUrl = rawUrl.replace('psits-ua.vercel.app', 'psitsua.vercel.app')

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/429', '/management'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
