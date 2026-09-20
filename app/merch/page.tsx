import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Sparkles, Tag, ShoppingBag } from 'lucide-react'
import MerchLockWrapper from '@/components/MerchLockWrapper'

export const metadata: Metadata = {
  title: 'Official Merch Store | PSITS-UA',
  description:
    'Official Merchandise, Department Polo Shirts, and Apparel Store of PSITS-UA, College of Computing and Information Sciences, University of Antique.',
}

const previewProducts = [
  {
    id: 'polo-2026',
    name: 'Official CCIS Polo Shirt (AY 2026–2027)',
    category: 'Apparel',
    status: 'Design in Contest',
    badge: 'Official Uniform',
    description:
      'The winning student design from the annual PSITS-UA Polo Shirt Contest, manufactured for College of Computing and Information Sciences IT majors.',
    price: '₱450 – ₱500 (Est.)',
    image: '/assets/logo/ccis new logo.png',
  },
  {
    id: 'lanyard-ccis',
    name: 'CCIS IT Department Lanyard & Holder',
    category: 'Accessories',
    status: 'In Production',
    badge: 'Essential',
    description:
      'High-grade sublimation satin lanyard with heavy-duty clip, safety breakaway buckle, and matte frosted ID badge holder.',
    price: '₱120 (Est.)',
    image: '/assets/logo/UA Logo.png',
  },
  {
    id: 'stickers-dev',
    name: 'Developer & IT Holographic Sticker Pack',
    category: 'Merch',
    status: 'Upcoming',
    badge: 'Limited Edition',
    description:
      '5-piece waterproof vinyl sticker pack featuring student-crafted tech art, Next.js, React, Linux, and PSITS-UA emblems.',
    price: '₱60 (Est.)',
    image: '/assets/logo/PSITS logo.png',
  },
  {
    id: 'hoodie-ccis',
    name: 'University of Antique Computing Hoodie',
    category: 'Apparel',
    status: 'Prototype',
    badge: 'Winter / Assembly',
    description:
      'Heavyweight 330gsm brushed fleece hoodie with embroidered CCIS crest, kangaroo pocket, and ribbed cuffs.',
    price: '₱850 (Est.)',
    image: '/assets/logo/ccis new logo.png',
  },
]

export default function MerchPage() {
  return (
    <MerchLockWrapper>
      <main className="min-h-screen bg-canvas text-text font-body pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-mono text-muted hover:text-text transition-colors group"
            >
              <ArrowLeft size={13} className="group-hover:-translate-x-0.5 transition-transform text-gold" />
              <span>Back to Home</span>
            </Link>
          </div>

          {/* Header */}
          <header className="mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-gold/20 bg-gold/5 text-[11px] font-mono text-gold">
              <Sparkles size={12} />
              <span>Internal Preview Catalog · AY 2026–2027</span>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-slate-900 dark:text-white tracking-tight">
              Official Merch Store
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
              Official organization uniforms, academic lanyards, and student developer merchandise for the College of
              Computing and Information Sciences, University of Antique.
            </p>
          </header>

          {/* Catalog Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {previewProducts.map((prod) => (
              <div
                key={prod.id}
                className="flex flex-col rounded-2xl border border-border/60 bg-card/30 backdrop-blur-sm p-5 space-y-4 hover:border-gold/30 transition-all group"
              >
                <div className="relative w-full aspect-square rounded-xl bg-surface/80 border border-border/40 flex items-center justify-center p-6 overflow-hidden">
                  <div className="relative w-24 h-24 sm:w-28 sm:h-28 opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
                    <Image
                      src={prod.image}
                      alt={prod.name}
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="absolute top-3 left-3 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-gold/10 text-gold border border-gold/20">
                    {prod.badge}
                  </span>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-muted">
                    <span>{prod.category}</span>
                    <span className="text-slate-500 dark:text-white/40">{prod.status}</span>
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900 dark:text-white group-hover:text-gold transition-colors line-clamp-2">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                    {prod.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between font-mono text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                    <Tag size={12} className="text-gold" />
                    <span>{prod.price}</span>
                  </span>
                  <span className="text-[11px] text-muted inline-flex items-center gap-1">
                    <ShoppingBag size={11} />
                    <span>Pre-order Soon</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Information */}
          <div className="mt-16 p-6 rounded-2xl border border-border/50 bg-card/20 backdrop-blur-sm space-y-2 text-xs text-muted leading-relaxed font-mono">
            <p className="text-slate-900 dark:text-white font-semibold">
              Student Organization Ordering &amp; Distribution Policy
            </p>
            <p>
              Merchandise proceeds support student academic events, hackathons, and community outreach under the CCIS
              Advisory Board. All transactions adhere to university treasury and liquidation standards per{' '}
              <Link href="/terms" className="text-gold underline">Terms of Service</Link> and{' '}
              <Link href="/privacy" className="text-gold underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
    </MerchLockWrapper>
  )
}
