'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { LogIn, AlertCircle, Shield } from 'lucide-react'
import { useAuth } from './_context/auth-context'
import { LoginCardSkeleton } from './_components/SkeletonPreloader'

export default function ManagementLoginPage() {
  const { login, isAuthenticated, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // If already authenticated, redirect to dashboard
  if (authLoading) {
    return <LoginCardSkeleton />
  }

  if (isAuthenticated) {
    router.replace('/management/dashboard')
    return null
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await login(email)

    if (result.success) {
      router.replace('/management/dashboard')
    } else {
      setError(result.error || 'Authentication failed.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0e17] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-navy/30 rounded-full blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] bg-gold/[0.04] rounded-full blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-sm"
      >
        {/* Card */}
        <div className="bg-[#0d1219]/80 backdrop-blur-2xl border border-white/8 rounded-2xl p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
          {/* Specular top rim */}
          <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 mb-4 relative">
              <Image
                src="/assets/logo/PSITS logo.png"
                alt="PSITS-UA"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="font-display font-black text-2xl text-white tracking-tight">
              PSITS<span className="text-gold">-U</span><span className="text-[#E63946]">A</span>
            </h1>
            <p className="text-xs text-white/40 font-mono uppercase tracking-[0.2em] mt-1.5">
              Officer Management Portal
            </p>
          </div>

          {/* Security notice */}
          <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/6 mb-6">
            <Shield size={14} className="text-gold/60 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-white/35 leading-relaxed">
              Access restricted to verified PSITS-UA officers. Use your prescribed <span className="text-white/55 font-medium">@antiquespride.edu.ph</span> email account.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="login-email"
                className="block font-mono text-[11px] text-white/50 uppercase tracking-[0.1em] font-semibold"
              >
                Email Address
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(null) }}
                placeholder="officer@antiquespride.edu.ph"
                autoComplete="email"
                autoFocus
                required
                className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3.5 py-3 text-sm text-white placeholder:text-white/20 outline-none transition-all duration-200 focus:border-gold/50 focus:ring-1 focus:ring-gold/20 hover:border-white/20"
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/[0.08] border border-red-500/20"
              >
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <span className="text-xs text-red-300">{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              className="
                w-full flex items-center justify-center gap-2
                py-3 px-4 rounded-lg
                bg-gradient-to-r from-gold to-[#FFA726]
                text-[#0D1117] font-display font-bold text-sm
                hover:from-[#FFA726] hover:to-gold
                active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                shadow-[0_4px_16px_rgba(245,166,35,0.25)]
              "
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2 font-mono text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#0D1117] animate-pulse" />
                  <span>Authenticating...</span>
                </span>
              ) : (
                <>
                  <LogIn size={16} />
                  <span>Sign In</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-[10px] text-white/15 mt-5 font-mono">
          Philippine Society of Information Technology Students
        </p>
      </motion.div>
    </div>
  )
}
