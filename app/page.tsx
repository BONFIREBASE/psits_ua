'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import DispatchCarousel from '@/components/DispatchCarousel'
import BannerStack from '@/components/BannerStack'
import ScrollReveal from '@/components/ScrollReveal'
import { socialDispatches } from '@/data/announcements'
import { dean } from '@/data/officers'
import { getPosts, postRowToSocialDispatch, getActiveBanners, supabase, type BannerRow } from '@/lib/supabase'
import coverImage from '@/public/assets/cover.jpg'

export default function HomePage() {
  const [dispatches, setDispatches] = useState(socialDispatches)
  const [activeBanners, setActiveBanners] = useState<BannerRow[]>([])
  const [bannersLoading, setBannersLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [posts, banners] = await Promise.all([
          getPosts(),
          getActiveBanners(),
        ])
        if (posts && posts.length > 0) {
          setDispatches(posts.map(postRowToSocialDispatch))
        }
        if (banners && banners.length > 0) {
          setActiveBanners(banners)
        }
      } catch {
        // Fall back cleanly to static data
      } finally {
        setBannersLoading(false)
      }
    }
    load()

    const channel = supabase
      .channel('homepage-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        async () => {
          const posts = await getPosts()
          if (posts && posts.length > 0) {
            setDispatches(posts.map(postRowToSocialDispatch))
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'banners' },
        async () => {
          const banners = await getActiveBanners()
          if (banners && banners.length > 0) {
            setActiveBanners(banners)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const articlesSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'PSITS-UA Community Dispatches & Announcements',
    itemListElement: dispatches.map((d, idx) => {
      const contributors = []
      if (d.credits?.photographer) contributors.push({ '@type': 'Person', name: d.credits.photographer, jobTitle: 'Photographer' })
      if (d.credits?.pubmat) contributors.push({ '@type': 'Person', name: d.credits.pubmat, jobTitle: 'Pubmat Designer' })
      if (d.credits?.videographer) contributors.push({ '@type': 'Person', name: d.credits.videographer, jobTitle: 'Videographer' })
      if (d.credits?.prepared_by) contributors.push({ '@type': 'Person', name: d.credits.prepared_by, jobTitle: 'Prepared By' })

      return {
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'NewsArticle',
          headline: d.title,
          description: d.excerpt,
          url: d.postUrl || 'https://psits-ua.antiquespride.edu.ph',
          ...(d.credits?.writer ? { author: { '@type': 'Person', name: d.credits.writer, jobTitle: 'Writer' } } : {}),
          ...(contributors.length > 0 ? { contributor: contributors } : {}),
          publisher: {
            '@type': 'EducationalOrganization',
            name: 'PSITS-UA',
          },
        },
      }
    }),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articlesSchema) }}
      />
      <section className="relative min-h-[65vh] sm:min-h-[75vh] lg:min-h-[84vh] flex flex-col items-center justify-center pt-24 sm:pt-32 pb-8 sm:pb-14 lg:py-20 overflow-hidden bg-base">
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src={coverImage}
            alt="University of Antique College of Computing Studies"
            fill
            className="object-cover object-center opacity-65 sm:opacity-80 dark:opacity-45 transition-opacity duration-300"
            priority
            sizes="100vw"
          />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-navy/20 dark:bg-navy/50 rounded-full blur-[160px]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/15 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#F8FAFC]/35 via-[#F8FAFC]/65 to-[#F8FAFC] dark:from-[#0D1117]/60 dark:via-[#0D1117]/75 dark:to-[#0D1117]" />
        </div>

        <div className="relative max-w-5xl xl:max-w-6xl mx-auto px-6 text-center flex flex-col items-center my-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center justify-center h-9 px-5 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] backdrop-blur-md mb-6 shadow-xs">
              <span className="text-slate-800 dark:text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                &quot;Transforming Lives, Building Communities&quot;
              </span>
            </div>

            <h1 className="font-display font-black text-5xl xs:text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-6 select-none break-words">
              <span className="text-slate-950 dark:text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">PSITS </span>
              <span className="text-[#F5A623] drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">U</span>
              <span className="text-[#E63946] drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">A</span>
            </h1>

            <p className="text-slate-800 dark:text-white/90 text-sm sm:text-base md:text-lg lg:text-xl mb-4 font-normal tracking-wide max-w-3xl drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] break-words">
              Philippine Society of Information Technology Students — University of Antique
            </p>

            <p className="text-slate-950 dark:text-white font-bold text-xl sm:text-2xl md:text-3xl lg:text-4xl max-w-3xl mx-auto leading-snug drop-shadow-[0_1px_4px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] break-words">
              Empowering Future IT Students Through Innovation and Collaboration.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="relative max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8 lg:py-12">
        <ScrollReveal>
          <div className="bg-surface-theme/75 backdrop-blur-md border border-border-theme rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs">
            <div className="grid grid-cols-3 divide-x divide-border-theme items-center">
              <div className="text-center px-1 sm:px-4 md:px-8">
                <p className="font-display font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground-theme tracking-tight mb-1 whitespace-nowrap">
                  600+
                </p>
                <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-mono uppercase tracking-tight xs:tracking-normal sm:tracking-[0.2em] text-amber-600 dark:text-gold/80 font-bold">
                  Active Members
                </p>
              </div>

              <div className="text-center px-1 sm:px-4 md:px-8">
                <p className="font-display font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground-theme tracking-tight mb-1 whitespace-nowrap">
                  5+
                </p>
                <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-mono uppercase tracking-tight xs:tracking-normal sm:tracking-[0.2em] text-amber-600 dark:text-gold/80 font-bold">
                  Events per Year
                </p>
              </div>

              <div className="text-center px-1 sm:px-4 md:px-8">
                <p className="font-display font-black text-xl sm:text-2xl md:text-3xl lg:text-4xl text-foreground-theme tracking-tight mb-1 whitespace-nowrap">
                  1993
                </p>
                <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-mono uppercase tracking-tight xs:tracking-normal sm:tracking-[0.2em] text-amber-600 dark:text-gold/80 font-bold">
                  Est. Year
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Dean's Message */}
      <section className="relative max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-6 sm:px-8 py-8 sm:py-14 lg:py-20">
        <ScrollReveal>
          <div className="grid md:grid-cols-12 gap-6 md:gap-8 lg:gap-14 items-center">
            <div className="md:col-span-5 flex justify-center relative">
              {/* Subtle ambient back-glow behind portrait */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-gold/[0.08] dark:bg-gold/[0.05] rounded-full blur-[90px] pointer-events-none" />

              <div
                className="relative w-64 sm:w-80 md:w-[420px] lg:w-[460px] xl:w-[490px] h-[300px] sm:h-[390px] md:h-[480px] lg:h-[530px] select-none"
                style={{
                  maskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, rgba(0,0,0,1) 82%, rgba(0,0,0,0) 100%)',
                }}
              >
                <Image
                  src="/assets/dean.png"
                  alt={`${dean.name} — ${dean.title}, ${dean.college}`}
                  fill
                  className="object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_24px_50px_rgba(0,0,0,0.9)] pointer-events-none"
                  priority
                />
              </div>
            </div>

            <div className="md:col-span-7 space-y-6">
              <div className="space-y-2">
                <h2 className="font-display font-black text-2xl sm:text-3xl md:text-4xl lg:text-5xl text-foreground-theme tracking-tight uppercase break-words">
                  Dean&apos;s <span className="text-amber-600 dark:text-gold">Message</span>
                </h2>
              </div>

              <blockquote className="relative">
                <Quote size={28} className="text-gold/35 mb-3" />
                <p className="font-display font-medium text-sm sm:text-base md:text-lg lg:text-xl text-foreground-theme/90 leading-relaxed italic break-words">
                  &ldquo;One of my developmental goals is all about digital and smart campus transformation. I think it&apos;s good that the University of Antique has started the implementation of the AIMS. With this, there is a need to continue the implementation of the AIMS system of the university.&rdquo;
                </p>
              </blockquote>

              <div className="pt-4 border-t border-border-theme space-y-1">
                <h3 className="font-display font-black text-lg sm:text-xl md:text-2xl text-foreground-theme tracking-tight break-words">
                  {dean.name}
                </h3>
                <p className="font-mono text-[11px] sm:text-xs md:text-[13px] text-amber-600 dark:text-gold/90 uppercase tracking-wider sm:tracking-widest font-bold break-words">
                  Dean · College of Computing and Information Sciences
                </p>
                <p className="font-mono text-[10px] text-muted-foreground-theme uppercase tracking-wider break-words">
                  {dean.institution}
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Community Pulse */}
      <section className="py-16 lg:py-20 overflow-hidden">
        <div className="max-w-5xl xl:max-w-6xl mx-auto px-6 mb-10 sm:mb-12">
          <SectionHeader
            eyebrow="Community Pulse"
            title="What's Happening in PSITS"
            subtitle="Stay in the loop with official event recaps, department event, and student spotlights."
          />
        </div>
        <DispatchCarousel dispatches={dispatches} />
      </section>

      {/* Dynamic Banner Section - Stacked carousel for multiple banners, flat card for single banner */}
      <BannerStack banners={activeBanners} isLoading={bannersLoading} />
    </>
  )
}
