import { MetadataRoute } from 'next'
import { getPosts } from '@/lib/supabase'
import { socialDispatches } from '@/data/announcements'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://psitsua.vercel.app'
  const baseUrl = rawUrl.replace('psits-ua.vercel.app', 'psitsua.vercel.app').replace(/\/$/, '')
  const currentDate = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/officers`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/events`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/submission`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/merch`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ]

  try {
    const dbPosts = await getPosts()
    const seen = new Set<string>()
    const blogRoutes: MetadataRoute.Sitemap = []

    dbPosts.forEach((post) => {
      const slug = post.slug || post.id
      if (slug && !seen.has(slug)) {
        seen.add(slug)
        blogRoutes.push({
          url: `${baseUrl}/blog/${slug}`,
          lastModified: new Date(post.updated_at || post.created_at || currentDate),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    })

    socialDispatches.forEach((dispatch) => {
      const slug = dispatch.slug || dispatch.id
      if (slug && !seen.has(slug)) {
        seen.add(slug)
        blogRoutes.push({
          url: `${baseUrl}/blog/${slug}`,
          lastModified: currentDate,
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    })

    return [...staticRoutes, ...blogRoutes]
  } catch (error) {
    console.error('Failed to generate dynamic blog sitemap:', error)
    return staticRoutes
  }
}
