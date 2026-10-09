'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import DispatchCarousel from '@/components/DispatchCarousel'
import BannerStack from '@/components/BannerStack'
import ScrollReveal from '@/components/ScrollReveal'
import KasubayPatrol from '@/components/KasubayPatrol'
import KasubayHeroNest from '@/components/KasubayHeroNest'
import { socialDispatches } from '@/data/announcements'
import { dean } from '@/data/officers'
import {
  getPosts,
  postRowToSocialDispatch,
  getActiveBanners,
  getFacultyLeadership,
  supabase,
  type BannerRow,
} from '@/lib/supabase'
import coverImage from '@/public/assets/cover.jpg'

export default function HomePage() {
  const [dispatches, setDispatches] = useState(socialDispatches)
  const [activeBanners, setActiveBanners] = useState<BannerRow[]>([])
  const [bannersLoading, setBannersLoading] = useState(true)
  const [deanData, setDeanData] = useState(dean)
  const [studentStats, setStudentStats] = useState<{ totalStudents: number; totalSections: number }>({
    totalStudents: 0,
    totalSections: 0,
  })
  const [viewsData, setViewsData] = useState<{ totalViews: number; activeNow: number }>({
    totalViews: 2194,
    activeNow: 1,
  })
  const [viewsLoading, setViewsLoading] = useState(false)
  const [kasubayStage, setKasubayStage] = useState<'hero' | 'leaping' | 'patrol'>('hero')

  useEffect(() => {
    if (typeof window !== 'undefined' && window.scrollY > 50) {
      const id = requestAnimationFrame(() => {
        setKasubayStage('patrol')
      })
      return () => cancelAnimationFrame(id)
    }
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const [posts, banners, faculty] = await Promise.all([
          getPosts(),
          getActiveBanners(),
          getFacultyLeadership(),
        ])
        if (posts && posts.length > 0) {
          setDispatches(posts.map(postRowToSocialDispatch))
        }
        if (banners && banners.length > 0) {
          setActiveBanners(banners)
        }
        if (faculty?.dean) {
          setDeanData(faculty.dean)
        }
      } catch {
        // Fall back cleanly to static data
      } finally {
        setBannersLoading(false)
      }

      // Fetch student stats separately (non-blocking)
      try {
        const res = await fetch('/api/students/stats')
        if (res.ok) {
          const stats = await res.json()
          if (stats.totalStudents > 0) {
            setStudentStats(stats)
          }
        }
      } catch {
        // Keep fallback
      }
    }

    load()

    // 1. Initial page view fetch & atomic counter update
    let sid = typeof window !== 'undefined' ? sessionStorage.getItem('psits_sid') : null
    if (!sid && typeof window !== 'undefined') {
      sid = 'sid_' + Math.random().toString(36).substring(2, 10)
      sessionStorage.setItem('psits_sid', sid)
    }

    fetch(`/api/analytics/views?sid=${encodeURIComponent(sid || 'guest')}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setViewsData((prev) => ({
            ...prev,
            totalViews: data.totalViews || prev.totalViews,
          }))
        }
      })
      .catch(() => { })
      .finally(() => setViewsLoading(false))

    // 2. Real-time active viewers tracking via Supabase Presence (WebSockets)
    const presenceChannel = supabase.channel('online-visitors', {
      config: {
        presence: {
          key: sid || 'guest',
        },
      },
    })

    const updatePresenceCount = () => {
      const state = presenceChannel.presenceState()
      const uniqueCount = Object.keys(state).length
      setViewsData((prev) => ({
        ...prev,
        activeNow: Math.max(1, uniqueCount),
      }))
    }

    presenceChannel
      .on('presence', { event: 'sync' }, updatePresenceCount)
      .on('presence', { event: 'join' }, updatePresenceCount)
      .on('presence', { event: 'leave' }, updatePresenceCount)
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            online_at: new Date().toISOString(),
          })
        }
      })

    // 3. Database change listener for posts, banners, and leadership
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'faculty_leadership' },
        async () => {
          const faculty = await getFacultyLeadership()
          if (faculty?.dean) {
            setDeanData(faculty.dean)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      supabase.removeChannel(presenceChannel)
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
          url: d.postUrl || 'https://psitsua.vercel.app',
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
            <div className="inline-flex items-center justify-center h-9 px-5 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-white/[0.06] backdrop-blur-md mb-9 xs:mb-10 sm:mb-8 shadow-xs">
              <span className="text-slate-800 dark:text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                &quot;Transforming Lives, Building Communities&quot;
              </span>
            </div>

            <h1 className="font-display font-black text-4xl xs:text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-6 select-none">
              <span className="text-slate-950 dark:text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                PSITS{' '}
              </span>
              <span className="inline-flex items-baseline whitespace-nowrap">
                <span className="relative inline-block text-[#F5A623] drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                  U
                  <KasubayHeroNest
                    stage={kasubayStage}
                    onStartLeap={() => setKasubayStage('leaping')}
                    onLeapComplete={() => setKasubayStage('patrol')}
                  />
                </span>
                <span className="text-[#E63946] drop-shadow-[0_2px_12px_rgba(0,0,0,0.12)] dark:drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">
                  A
                </span>
              </span>
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
      <section className="relative max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 pt-24 sm:pt-14 pb-8 sm:pb-12 lg:py-12">
        <ScrollReveal>
          <div className="relative bg-surface-theme/75 backdrop-blur-md border border-border-theme rounded-2xl p-4 sm:p-6 md:p-8 shadow-xs">
            <KasubayPatrol isReady={kasubayStage === 'patrol'} />
            <div className="grid grid-cols-3 divide-x divide-border-theme items-center">
              <div className="text-center px-1 sm:px-4 md:px-8">
                <p className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-foreground-theme tracking-tight mb-1 whitespace-nowrap pt-1">
                  {studentStats.totalStudents > 0 ? `${studentStats.totalStudents}+` : '600+'}
                </p>
                <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-mono uppercase tracking-tight xs:tracking-normal sm:tracking-[0.2em] text-amber-600 dark:text-gold/80 font-bold">
                  Active Members
                </p>
              </div>

              <div className="text-center px-1 sm:px-4 md:px-8">
                <p
                  className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-foreground-theme tracking-tight mb-1 whitespace-nowrap inline-flex items-center justify-center pt-1"
                  title={`${viewsData.totalViews.toLocaleString()} total views · ${viewsData.activeNow} active right now`}
                >
                  {viewsLoading ? (
                    <span className="inline-block w-20 sm:w-28 h-6 sm:h-8 rounded bg-muted-foreground-theme/20 dark:bg-white/10 animate-pulse my-auto" />
                  ) : (
                    <>
                      <AnimatedCounter value={viewsData.totalViews} />
                      <span className="inline-flex items-center ml-0.5">
                        {viewsData.totalViews >= 10000 && <span>+</span>}
                        <sup
                          className="-translate-y-1.5 sm:-translate-y-2.5 ml-0.5 text-[10px] sm:text-xs font-mono font-bold text-emerald-500 dark:text-emerald-400 select-none leading-none"
                          title={`${viewsData.activeNow} active visitor${viewsData.activeNow > 1 ? 's' : ''} right now`}
                        >
                          {viewsData.activeNow}
                        </sup>
                      </span>
                    </>
                  )}
                </p>
                <p className="text-[8.5px] xs:text-[9.5px] sm:text-[11px] font-mono uppercase tracking-tight xs:tracking-normal sm:tracking-[0.2em] text-amber-600 dark:text-gold/80 font-bold">
                  Page Views
                </p>
              </div>

              <div className="text-center px-1 sm:px-4 md:px-8">
                <p className="font-display font-black text-lg sm:text-2xl md:text-3xl lg:text-4xl text-foreground-theme tracking-tight mb-1 whitespace-nowrap pt-1">
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
      <section className="relative max-w-5xl xl:max-w-6xl 2xl:max-w-7xl mx-auto px-6 sm:px-8 pt-24 sm:pt-14 pb-12 sm:pb-14 lg:py-20">
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
                  src={deanData.image || "/assets/dean.png"}
                  alt={`${deanData.name} — ${deanData.title}, ${deanData.college}`}
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

              <blockquote className="relative group/message">
                <a
                  href="https://www.facebook.com/share/1LrVi4RRjW/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View original statement on Facebook"
                  title="View original statement on Facebook"
                  className="inline-flex items-center gap-2 text-amber-600/40 dark:text-gold/35 group-hover/message:text-amber-600 dark:group-hover/message:text-gold hover:!text-amber-500 dark:hover:!text-amber-300 transition-all duration-300 mb-3 cursor-pointer group/icon"
                >
                  <Quote
                    size={28}
                    className="transition-all duration-300 group-hover/message:scale-110 group-hover/icon:scale-125 group-hover/message:drop-shadow-[0_0_10px_rgba(245,166,35,0.45)] group-active/icon:scale-95"
                  />
                </a>
                <p className="font-display font-medium text-sm sm:text-base md:text-lg lg:text-xl text-foreground-theme/90 leading-relaxed italic break-words">
                  &ldquo;One of my developmental goals is all about digital and smart campus transformation. I think it&apos;s good that the University of Antique has started the implementation of the AIMS. With this, there is a need to continue the implementation of the AIMS system of the university.&rdquo;
                </p>
              </blockquote>

              <div className="pt-4 border-t border-border-theme space-y-1">
                <h3 className="font-display font-black text-lg sm:text-xl md:text-2xl text-foreground-theme tracking-tight break-words">
                  {deanData.name}
                  {deanData.credentials && (
                    <span className="text-amber-600 dark:text-gold text-base sm:text-lg font-normal ml-2">
                      {deanData.credentials}
                    </span>
                  )}
                </h3>
                <p className="font-mono text-[11px] sm:text-xs md:text-[13px] text-amber-600 dark:text-gold/90 uppercase tracking-wider sm:tracking-widest font-bold break-words">
                  {deanData.title} · {deanData.college}
                </p>
                <p className="font-mono text-[10px] text-muted-foreground-theme uppercase tracking-wider break-words">
                  {deanData.institution}
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

function AnimatedCounter({ value }: { value: number }) {
  const baseHundred = Math.max(0, Math.floor(value / 100) * 100)
  const [displayValue, setDisplayValue] = useState<number>(baseHundred)
  const prevValueRef = useRef<number>(baseHundred)
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (!value) return

    const from = isFirstRender.current ? baseHundred : prevValueRef.current
    const duration = isFirstRender.current ? 800 : 350
    isFirstRender.current = false
    prevValueRef.current = value

    const startTime = performance.now()
    let frameId: number

    const tick = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic: fast rise with smooth deceleration
      const ease = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(from + (value - from) * ease)
      setDisplayValue(current)

      if (progress < 1) {
        frameId = requestAnimationFrame(tick)
      }
    }

    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [value, baseHundred])

  if (displayValue >= 1000000) {
    return <span>{(displayValue / 1000000).toFixed(1)}M</span>
  }

  return <span>{displayValue.toLocaleString()}</span>
}
