'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import SectionHeader from '@/components/SectionHeader'
import DispatchCarousel from '@/components/DispatchCarousel'
import BannerStack from '@/components/BannerStack'
import { socialDispatches } from '@/data/announcements'
import { dean } from '@/data/officers'
import { getPosts, postRowToSocialDispatch, getActiveBanners, supabase, type BannerRow } from '@/lib/supabase'
import coverImage from '@/public/assets/cover.jpg'

export default function HomePage() {
  const [dispatches, setDispatches] = useState(socialDispatches)
  const [activeBanners, setActiveBanners] = useState<BannerRow[]>([])

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
  return (
    <>
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center pt-28 pb-12 overflow-hidden bg-base">
        <div className="absolute inset-0 pointer-events-none z-0">
          <Image
            src={coverImage}
            alt="University of Antique College of Computing Studies"
            fill
            className="object-cover object-center opacity-35 sm:opacity-45"
            priority
            sizes="100vw"
          />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[850px] h-[550px] bg-navy/50 rounded-full blur-[160px]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-gold/10 rounded-full blur-[130px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0D1117]/60 via-[#0D1117]/75 to-[#0D1117]" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 text-center flex flex-col items-center my-auto z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center justify-center h-9 px-5 rounded-full border border-white/15 bg-white/[0.06] backdrop-blur-md mb-8 shadow-sm">
              <span className="text-white/90 text-xs sm:text-sm font-medium tracking-wide">
                &quot;Transforming Lives, Building Communities&quot;
              </span>
            </div>

            <h1 className="font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none mb-6 select-none">
              <span className="text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">PSITS </span>
              <span className="text-[#F5A623] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">U</span>
              <span className="text-[#E63946] drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)]">A</span>
            </h1>

            <p className="text-white/90 text-base sm:text-lg md:text-xl mb-6 font-normal tracking-wide max-w-3xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
              Philippine Society of Information Technology Students — University of Antique
            </p>

            <p className="text-white font-bold text-2xl sm:text-3xl md:text-4xl max-w-3xl mx-auto leading-snug drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)]">
              Empowering Future IT Students Through Innovation and Collaboration.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="relative max-w-4xl mx-auto px-6 py-14">
        <div className="grid grid-cols-3 divide-x divide-white/10 items-center">
          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              600+
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Active Members
            </p>
          </div>

          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              5+
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Events per Year
            </p>
          </div>

          <div className="text-center px-4 sm:px-8">
            <p className="font-display font-black text-2xl sm:text-3xl md:text-4xl text-white tracking-tight mb-1">
              1993
            </p>
            <p className="text-[10px] sm:text-[11px] font-mono uppercase tracking-[0.2em] text-gold/80 font-semibold">
              Est. Year
            </p>
          </div>
        </div>
      </section>

      <section className="relative max-w-5xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-12 gap-10 md:gap-14 items-center">
          <div className="md:col-span-5 flex justify-center">
            <div
              className="relative w-72 sm:w-80 md:w-[380px] h-[420px] sm:h-[460px] md:h-[500px] select-none"
              style={{
                maskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 98%)',
                WebkitMaskImage:
                  'linear-gradient(to bottom, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 98%)',
              }}
            >
              <Image
                src="/assets/dean.png"
                alt={`${dean.name} — ${dean.title}, ${dean.college}`}
                fill
                className="object-contain object-bottom drop-shadow-[0_24px_48px_rgba(0,0,0,0.95)] pointer-events-none"
                priority
              />
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="space-y-2">
              <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl text-white tracking-tight uppercase">
                Dean&apos;s <span className="text-gold">Message</span>
              </h2>
            </div>

            <blockquote className="relative">
              <Quote size={28} className="text-gold/35 mb-3" />
              <p className="font-display font-medium text-base sm:text-lg md:text-xl text-white/90 leading-relaxed italic">
                &ldquo;One of my developmental goals is all about digital and smart campus transformation. I think it&apos;s good that the University of Antique has started the implementation of the AIMS. With this, there is a need to continue the implementation of the AIMS system of the university.&rdquo;
              </p>
            </blockquote>

            <div className="pt-4 border-t border-white/10 space-y-1">
              <h3 className="font-display font-black text-xl sm:text-2xl text-white tracking-tight">
                {dean.name}
              </h3>
              <p className="font-mono text-xs sm:text-[13px] text-gold/90 uppercase tracking-widest font-semibold">
                Dean · College of Computing and Information Sciences
              </p>
              <p className="font-mono text-[10px] text-white/40 uppercase tracking-wider">
                {dean.institution}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <SectionHeader
            eyebrow="Community Pulse"
            title="What's Happening in PSITS"
            subtitle="Stay in the loop with official event recaps, department event, and student spotlights."
          />
        </div>
        <DispatchCarousel dispatches={dispatches} />
      </section>

      {/* Dynamic Banner Section - Stacked carousel for multiple banners, flat card for single banner */}
      <BannerStack banners={activeBanners} />
    </>
  )
}
