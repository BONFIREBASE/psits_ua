import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calendar,
  ArrowLeft,
  ArrowUpRight,
  Quote,
  PenTool,
  Camera,
  Palette,
  Video,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react'
import { getPostBySlugOrId, postRowToSocialDispatch } from '@/lib/supabase'
import { socialDispatches, type SocialDispatch } from '@/data/announcements'
import MarkdownContent from '@/components/MarkdownContent'
import ShareArticleButtons from '@/components/ShareArticleButtons'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function fetchPost(slug: string): Promise<SocialDispatch | null> {
  try {
    const row = await getPostBySlugOrId(slug)
    if (row) {
      return postRowToSocialDispatch(row)
    }
  } catch (err) {
    console.error('Error fetching post by slug:', err)
  }

  // Fallback to static announcements
  const staticFound = socialDispatches.find(
    (d) => (d.slug && d.slug === slug) || d.id === slug
  )
  return staticFound || null
}

function getReadingTime(content: string): string {
  const words = content.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 200))
  return `${minutes} min read`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post) {
    return {
      title: 'Article Not Found | PSITS-UA',
      description: 'The requested article could not be found.',
    }
  }

  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://psitsua.vercel.app'
  const baseUrl = rawUrl.replace('psits-ua.vercel.app', 'psitsua.vercel.app').replace(/\/$/, '')
  const postUrl = `${baseUrl}/blog/${post.slug || post.id}`

  // Original thumbnail of the blog (mandatory requirement)
  const thumbnail = post.imageUrl || `${baseUrl}/assets/cover.jpg`

  const cleanDescription = (post.excerpt || post.fullContent || '')
    .replace(/^[\s\u200B-\u200D\uFEFF\u200E\u200F]+/, '')
    .slice(0, 160)
    .trim()

  return {
    title: `${post.title} | PSITS-UA`,
    description: cleanDescription,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: 'article',
      title: post.title,
      description: cleanDescription,
      url: postUrl,
      siteName: 'PSITS - University of Antique',
      images: [
        {
          url: thumbnail,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      publishedTime: post.date,
      authors: post.credits?.writer ? [post.credits.writer] : ['PSITS-UA'],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: cleanDescription,
      images: [thumbnail],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await fetchPost(slug)

  if (!post) {
    notFound()
  }

  const rawUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://psitsua.vercel.app'
  const baseUrl = rawUrl.replace('psits-ua.vercel.app', 'psitsua.vercel.app').replace(/\/$/, '')
  const postUrl = `${baseUrl}/blog/${post.slug || post.id}`
  const thumbnail = post.imageUrl || `${baseUrl}/assets/cover.jpg`
  const readingTime = getReadingTime(post.fullContent || post.excerpt)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: post.title,
    description: post.excerpt,
    image: [thumbnail],
    datePublished: post.date,
    dateModified: post.date,
    author: post.credits?.writer
      ? [
          {
            '@type': 'Person',
            name: post.credits.writer,
          },
        ]
      : [
          {
            '@type': 'Organization',
            name: 'PSITS-UA',
          },
        ],
    publisher: {
      '@type': 'Organization',
      name: 'Philippine Society of Information Technology Students - University of Antique',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/assets/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': postUrl,
    },
  }

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 selection:bg-gold/30 selection:text-gold pt-28 pb-24">
      {/* JSON-LD for Search Engine Bots */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <Link
            href="/#community-pulse"
            className="inline-flex items-center gap-2 text-xs font-mono font-bold tracking-wider text-muted-foreground-theme hover:text-gold transition-colors py-1.5 px-3 rounded-lg hover:bg-white/[0.04]"
          >
            <ArrowLeft size={14} />
            <span>BACK TO HOME</span>
          </Link>

          <ShareArticleButtons url={postUrl} title={post.title} />
        </div>

        {/* Header Metadata */}
        <header className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[11px] font-mono uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-gold/15 text-gold border border-gold/30">
              {post.category}
            </span>
            <span className="text-xs font-mono text-muted-foreground-theme flex items-center gap-1.5">
              <Calendar size={13} className="text-gold" />
              {post.date}
            </span>
            <span className="text-muted-foreground-theme">·</span>
            <span className="text-xs font-mono text-muted-foreground-theme flex items-center gap-1.5">
              <Clock size={13} className="text-gold" />
              {readingTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-extrabold tracking-tight leading-tight text-white mb-6">
            {post.title}
          </h1>
        </header>

        {/* Featured Original Thumbnail */}
        {post.imageUrl && (
          <div className="relative w-full aspect-video sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 mb-10 shadow-2xl bg-black/40">
            <Image
              src={post.imageUrl}
              alt={post.title}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 896px"
            />
          </div>
        )}

        {/* Highlight Quote if present */}
        {post.highlightQuote && (
          <div className="my-8 p-6 rounded-2xl border-l-4 border-gold bg-white/[0.03] border border-white/10 shadow-sm">
            <div className="flex items-start gap-3">
              <Quote size={24} className="shrink-0 mt-1 text-gold" />
              <p className="font-display italic font-bold text-lg sm:text-xl leading-relaxed text-white">
                &ldquo;{post.highlightQuote}&rdquo;
              </p>
            </div>
            {post.quoteAuthor && (
              <p className="text-xs font-mono font-semibold mt-3 pl-9 text-gold">
                — {post.quoteAuthor}
              </p>
            )}
          </div>
        )}

        {/* Article Body */}
        <article className="prose prose-invert max-w-none mb-12 text-slate-200">
          <MarkdownContent content={post.fullContent || post.excerpt} />
        </article>

        {/* Participating Academic Departments */}
        {post.involvedColleges && post.involvedColleges.length > 0 && (
          <div className="p-5 rounded-xl bg-white/[0.03] border border-white/10 mb-8">
            <p className="text-[11px] font-mono uppercase tracking-widest font-bold mb-3 text-gold">
              Participating Academic Departments
            </p>
            <div className="flex flex-wrap gap-2">
              {post.involvedColleges.map((college) => (
                <span
                  key={college}
                  className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.06] border border-white/15 font-mono text-white font-medium"
                >
                  {college}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Credits & Sign-off */}
        <div className="border-t border-b border-white/10 py-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-muted-foreground-theme">
            {post.credits?.writer && (
              <span className="flex items-center gap-1.5">
                <PenTool size={13} className="text-gold" />
                Writer: <strong className="text-white">{post.credits.writer}</strong>
              </span>
            )}
            {post.credits?.photographer && (
              <>
                {post.credits.writer && <span className="text-white/20">·</span>}
                <span className="flex items-center gap-1.5">
                  <Camera size={13} className="text-gold" />
                  Photography: <strong className="text-white">{post.credits.photographer}</strong>
                </span>
              </>
            )}
            {post.credits?.pubmat && (
              <>
                {(post.credits.writer || post.credits.photographer) && (
                  <span className="text-white/20">·</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Palette size={13} className="text-gold" />
                  Pubmat: <strong className="text-white">{post.credits.pubmat}</strong>
                </span>
              </>
            )}
            {post.credits?.videographer && (
              <>
                {(post.credits.writer || post.credits.photographer || post.credits.pubmat) && (
                  <span className="text-white/20">·</span>
                )}
                <span className="flex items-center gap-1.5">
                  <Video size={13} className="text-gold" />
                  Videographer: <strong className="text-white">{post.credits.videographer}</strong>
                </span>
              </>
            )}
            {(post.credits?.publish_by || post.credits?.prepared_by) && (
              <>
                {(post.credits?.writer ||
                  post.credits?.photographer ||
                  post.credits?.pubmat ||
                  post.credits?.videographer) && <span className="text-white/20">·</span>}
                <span className="flex items-center gap-1.5">
                  <FileText size={13} className="text-gold" />
                  Publish by:{' '}
                  <strong className="text-white">
                    {post.credits.publish_by || post.credits.prepared_by}
                  </strong>
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {post.applyUrl && (
              <a
                href={post.applyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-4 py-2 rounded-lg bg-gold text-[#0D1117] hover:bg-gold-muted transition-colors shadow-md"
              >
                <span>Apply via Form</span>
                <ArrowUpRight size={14} />
              </a>
            )}
            {post.postUrl && (
              <a
                href={post.postUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-4 py-2 rounded-lg bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] text-white transition-colors"
              >
                <span>Open on Facebook</span>
                <ArrowUpRight size={14} className="text-gold" />
              </a>
            )}
          </div>
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-12">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-3 py-1 rounded-md bg-white/[0.04] border border-white/10 text-muted-foreground-theme"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}

        {/* Footer Back Home Banner */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-gold/10 via-white/[0.03] to-transparent border border-gold/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gold font-mono text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>PSITS Community Pulse</span>
            </div>
            <p className="text-sm text-slate-300">
              Stay in the loop with official recaps, student highlights, and academic advisories.
            </p>
          </div>
          <Link
            href="/#community-pulse"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-gold text-[#0D1117] hover:bg-gold-muted transition-colors shadow-lg shrink-0"
          >
            <span>Explore Dispatches</span>
            <ArrowLeft size={14} className="rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  )
}
